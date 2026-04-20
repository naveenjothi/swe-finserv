import { Inject, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  CLIENT_RECORD_REPOSITORY,
  ClientRecordRepositoryPort,
} from '../../domain/ports/client-record.repository.port';
import { ClientDetailView, GetClientByIdQuery } from './get-client-by-id.query';

@QueryHandler(GetClientByIdQuery)
export class GetClientByIdHandler implements IQueryHandler<GetClientByIdQuery, ClientDetailView> {
  constructor(
    @Inject(CLIENT_RECORD_REPOSITORY)
    private readonly repo: ClientRecordRepositoryPort,
  ) {}

  async execute(query: GetClientByIdQuery): Promise<ClientDetailView> {
    const record = await this.repo.findById(query.id);
    if (!record) {
      throw new NotFoundException(`Client record ${query.id} not found`);
    }
    return {
      id: record.id,
      client_name: record.clientName,
      client_type: record.clientType,
      pep_status: record.pepStatus,
      sanctions_screening_match: record.sanctionsScreeningMatch,
      adverse_media_flag: record.adverseMediaFlag,
      country_of_tax_residence: record.countryOfTaxResidence,
      annual_income: record.annualIncome,
      source_of_funds: record.sourceOfFunds,
      computed_tier: record.computedTier,
      triggered_rules: record.triggeredRules.map((r) => ({
        tier: r.tier,
        code: r.code,
        description: r.description,
      })),
      requires_edd: record.requiresEdd,
      rules_version: record.rulesVersion,
      declared_tier: record.declaredTier,
      mismatch: record.mismatch,
      submitted_by: record.submittedBy,
      created_at: record.createdAt.toISOString(),
    };
  }
}
