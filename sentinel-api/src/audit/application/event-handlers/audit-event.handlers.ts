import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { OnboardingSubmittedEvent } from '../../../onboarding/domain/events/onboarding-submitted.event';
import { ClassificationMismatchDetectedEvent } from '../../../risk-classification/domain/events/classification-mismatch-detected.event';
import { BulkReclassificationCompletedEvent } from '../../../risk-classification/domain/events/bulk-reclassification-completed.event';
import { AuditEntry } from '../../domain/entities/audit-entry.entity';
import { AUDIT_REPOSITORY, AuditRepositoryPort } from '../../domain/ports/audit.repository.port';

@EventsHandler(OnboardingSubmittedEvent)
@Injectable()
export class OnboardingAuditHandler implements IEventHandler<OnboardingSubmittedEvent> {
  private readonly logger = new Logger(OnboardingAuditHandler.name);

  constructor(
    @Inject(AUDIT_REPOSITORY)
    private readonly repo: AuditRepositoryPort,
  ) {}

  async handle(event: OnboardingSubmittedEvent): Promise<void> {
    const entry = AuditEntry.create({
      aggregateId: event.aggregateId,
      aggregateType: 'ClientRecord',
      eventType: event.eventType,
      payload: {
        rulesVersion: event.rulesVersion,
        computedTier: event.computedTier,
      },
      performedBy: 'system',
    });
    await this.repo.save(entry);
    this.logger.debug(`Audit: ${event.eventType} for ${event.aggregateId}`);
  }
}

@EventsHandler(ClassificationMismatchDetectedEvent)
@Injectable()
export class MismatchAuditHandler implements IEventHandler<ClassificationMismatchDetectedEvent> {
  private readonly logger = new Logger(MismatchAuditHandler.name);

  constructor(
    @Inject(AUDIT_REPOSITORY)
    private readonly repo: AuditRepositoryPort,
  ) {}

  async handle(event: ClassificationMismatchDetectedEvent): Promise<void> {
    const entry = AuditEntry.create({
      aggregateId: event.aggregateId,
      aggregateType: 'ClientRecord',
      eventType: event.eventType,
      payload: {
        rulesVersion: event.rulesVersion,
        storedTier: event.storedTier,
        computedTier: event.computedTier,
        isCritical: event.isCritical,
      },
      performedBy: 'system',
    });
    await this.repo.save(entry);
    this.logger.debug(`Audit: mismatch for ${event.aggregateId} (critical: ${event.isCritical})`);
  }
}

@EventsHandler(BulkReclassificationCompletedEvent)
@Injectable()
export class BulkReclassificationAuditHandler implements IEventHandler<BulkReclassificationCompletedEvent> {
  private readonly logger = new Logger(BulkReclassificationAuditHandler.name);

  constructor(
    @Inject(AUDIT_REPOSITORY)
    private readonly repo: AuditRepositoryPort,
  ) {}

  async handle(event: BulkReclassificationCompletedEvent): Promise<void> {
    const entry = AuditEntry.create({
      aggregateId: event.aggregateId,
      aggregateType: 'RuleSet',
      eventType: event.eventType,
      payload: {
        totalRecordsScanned: event.totalRecordsScanned,
        tierChanges: event.tierChanges,
        eddEscalations: event.eddEscalations,
      },
      performedBy: 'system',
    });
    await this.repo.save(entry);
    this.logger.debug(`Audit: bulk reclassification for ${event.aggregateId}`);
  }
}
