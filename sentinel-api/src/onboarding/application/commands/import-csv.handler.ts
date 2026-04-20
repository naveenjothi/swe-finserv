import { BadRequestException, Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { parse } from 'csv-parse/sync';
import { RulesEngineService } from '../../../risk-classification/domain/services/rules-engine.service';
import { RulesCacheService } from '../../../risk-classification/infrastructure/cache/rules-cache.service';
import { RiskTier } from '../../../risk-classification/domain/value-objects/risk-tier.vo';
import { ClassificationMismatchDetectedEvent } from '../../../risk-classification/domain/events/classification-mismatch-detected.event';
import { ClientRecord } from '../../domain/entities/client-record.entity';
import {
  CLIENT_RECORD_REPOSITORY,
  ClientRecordRepositoryPort,
} from '../../domain/ports/client-record.repository.port';
import { ImportCsvCommand, ImportCsvResult, CsvImportRow } from './import-csv.command';

interface CsvRow {
  client_name: string;
  client_type: string;
  pep_status: string;
  sanctions_screening_match: string;
  adverse_media_flag: string;
  country_of_tax_residence: string;
  annual_income: string;
  source_of_funds: string;
  declared_tier?: string;
}

const REQUIRED_COLUMNS = [
  'client_name',
  'client_type',
  'pep_status',
  'sanctions_screening_match',
  'adverse_media_flag',
  'country_of_tax_residence',
  'annual_income',
  'source_of_funds',
] as const;

function toBool(value: string): boolean {
  const v = value.trim().toLowerCase();
  return v === 'true' || v === '1' || v === 'yes';
}

function parseDeclaredTier(value: string | undefined): RiskTier | null {
  if (!value || value.trim() === '') return null;
  const upper = value.trim().toUpperCase();
  if (Object.values(RiskTier).includes(upper as RiskTier)) {
    return upper as RiskTier;
  }
  return null;
}

@CommandHandler(ImportCsvCommand)
export class ImportCsvHandler implements ICommandHandler<ImportCsvCommand, ImportCsvResult> {
  constructor(
    private readonly engine: RulesEngineService,
    private readonly cache: RulesCacheService,
    private readonly eventBus: EventBus,
    @Inject(CLIENT_RECORD_REPOSITORY)
    private readonly repo: ClientRecordRepositoryPort,
  ) {}

  async execute(command: ImportCsvCommand): Promise<ImportCsvResult> {
    let rows: CsvRow[];
    try {
      rows = parse(command.csvBuffer, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }) as CsvRow[];
    } catch {
      throw new BadRequestException('Invalid CSV format');
    }

    if (rows.length === 0) {
      throw new BadRequestException('CSV file is empty');
    }

    // Validate required columns exist
    const headers = Object.keys(rows[0]);
    for (const col of REQUIRED_COLUMNS) {
      if (!headers.includes(col)) {
        throw new BadRequestException(`Missing required CSV column: ${col}`);
      }
    }

    const ruleSet = await this.cache.getActive();
    const entities: ClientRecord[] = [];
    const resultRows: CsvImportRow[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const classifiable = {
        pep_status: toBool(row.pep_status),
        sanctions_screening_match: toBool(row.sanctions_screening_match),
        adverse_media_flag: toBool(row.adverse_media_flag),
        country_of_tax_residence: row.country_of_tax_residence,
        client_type: row.client_type,
        annual_income: Number(row.annual_income),
        source_of_funds: row.source_of_funds,
      };

      const classification = this.engine.classify(classifiable, ruleSet.payload);
      const declaredTier = parseDeclaredTier(row.declared_tier);
      const mismatch = declaredTier !== null && declaredTier !== classification.computed_tier;

      const entity = ClientRecord.create({
        clientName: row.client_name,
        clientType: row.client_type,
        pepStatus: classifiable.pep_status,
        sanctionsScreeningMatch: classifiable.sanctions_screening_match,
        adverseMediaFlag: classifiable.adverse_media_flag,
        countryOfTaxResidence: row.country_of_tax_residence,
        annualIncome: classifiable.annual_income,
        sourceOfFunds: row.source_of_funds,
        computedTier: classification.computed_tier,
        triggeredRules: [...classification.triggered_rules],
        requiresEdd: classification.requires_edd,
        rulesVersion: ruleSet.version,
        declaredTier,
        mismatch,
        submittedBy: command.submittedBy,
      });

      entities.push(entity);
      resultRows.push({
        row: i + 1,
        client_name: row.client_name,
        computed_tier: classification.computed_tier,
        declared_tier: declaredTier,
        mismatch,
        id: entity.id,
      });
    }

    const saved = await this.repo.saveBatch(entities);

    // Publish events
    for (const entity of saved) {
      for (const event of entity.pullDomainEvents()) {
        this.eventBus.publish(event);
      }
    }

    // Emit mismatch events
    for (const entity of saved) {
      if (entity.mismatch) {
        this.eventBus.publish(
          new ClassificationMismatchDetectedEvent(
            entity.id,
            ruleSet.version,
            entity.declaredTier,
            entity.computedTier,
            entity.computedTier === RiskTier.HIGH,
          ),
        );
      }
    }

    return {
      total_imported: saved.length,
      mismatches: resultRows.filter((r) => r.mismatch).length,
      rows: resultRows,
    };
  }
}
