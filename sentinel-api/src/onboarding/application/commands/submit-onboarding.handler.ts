import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { RulesEngineService } from '../../../risk-classification/domain/services/rules-engine.service';
import { RulesCacheService } from '../../../risk-classification/infrastructure/cache/rules-cache.service';
import { ClassificationMismatchDetectedEvent } from '../../../risk-classification/domain/events/classification-mismatch-detected.event';
import { ClientRecord } from '../../domain/entities/client-record.entity';
import {
  CLIENT_RECORD_REPOSITORY,
  ClientRecordRepositoryPort,
} from '../../domain/ports/client-record.repository.port';
import { SubmitOnboardingCommand, SubmitOnboardingResult } from './submit-onboarding.command';

@CommandHandler(SubmitOnboardingCommand)
export class SubmitOnboardingHandler implements ICommandHandler<
  SubmitOnboardingCommand,
  SubmitOnboardingResult
> {
  constructor(
    private readonly engine: RulesEngineService,
    private readonly cache: RulesCacheService,
    private readonly eventBus: EventBus,
    @Inject(CLIENT_RECORD_REPOSITORY)
    private readonly repo: ClientRecordRepositoryPort,
  ) {}

  async execute(command: SubmitOnboardingCommand): Promise<SubmitOnboardingResult> {
    const ruleSet = await this.cache.getActive();
    const classification = this.engine.classify(command.record, ruleSet.payload);

    const mismatch =
      command.declaredTier !== null && command.declaredTier !== classification.computed_tier;

    const entity = ClientRecord.create({
      clientName: command.clientName,
      clientType: command.record.client_type,
      pepStatus: command.record.pep_status,
      sanctionsScreeningMatch: command.record.sanctions_screening_match,
      adverseMediaFlag: command.record.adverse_media_flag,
      countryOfTaxResidence: command.record.country_of_tax_residence,
      annualIncome: command.record.annual_income,
      sourceOfFunds: command.record.source_of_funds,
      computedTier: classification.computed_tier,
      triggeredRules: [...classification.triggered_rules],
      requiresEdd: classification.requires_edd,
      rulesVersion: ruleSet.version,
      declaredTier: command.declaredTier,
      mismatch,
      submittedBy: command.submittedBy,
      relationship_manager: command.submittedBy,
    });

    const domainEvents = entity.pullDomainEvents();

    const saved = await this.repo.save(entity);

    // Publish domain events collected before persistence. The repository rehydrates
    // a new entity instance from ORM rows, so in-memory events are not carried over.
    for (const event of domainEvents) {
      this.eventBus.publish(event);
    }

    // If mismatch detected, emit a mismatch event
    if (mismatch) {
      this.eventBus.publish(
        new ClassificationMismatchDetectedEvent(
          saved.id,
          ruleSet.version,
          command.declaredTier,
          classification.computed_tier,
          classification.computed_tier === 'HIGH',
        ),
      );
    }

    return {
      id: saved.id,
      client_name: saved.clientName,
      computed_tier: saved.computedTier,
      declared_tier: saved.declaredTier,
      mismatch: saved.mismatch,
      requires_edd: saved.requiresEdd,
      rules_version: saved.rulesVersion,
      triggered_rules: saved.triggeredRules.map((r) => ({
        tier: r.tier,
        code: r.code,
        description: r.description,
      })),
    };
  }
}
