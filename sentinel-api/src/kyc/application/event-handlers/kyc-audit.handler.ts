import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { KycStatusChangedEvent } from '../../domain/events/kyc-status-changed.event';
import { AuditEntry } from '../../../audit/domain/entities/audit-entry.entity';
import {
  AUDIT_REPOSITORY,
  AuditRepositoryPort,
} from '../../../audit/domain/ports/audit.repository.port';

@EventsHandler(KycStatusChangedEvent)
@Injectable()
export class KycAuditHandler implements IEventHandler<KycStatusChangedEvent> {
  private readonly logger = new Logger(KycAuditHandler.name);

  constructor(
    @Inject(AUDIT_REPOSITORY)
    private readonly auditRepo: AuditRepositoryPort,
  ) {}

  async handle(event: KycStatusChangedEvent): Promise<void> {
    const isEddApproval =
      event.previousStatus === 'ENHANCED_DUE_DILIGENCE' && event.newStatus === 'APPROVED';

    const entry = AuditEntry.create({
      aggregateId: event.aggregateId,
      aggregateType: 'KycCase',
      eventType: event.eventType,
      payload: {
        clientRecordId: event.clientRecordId,
        previousStatus: event.previousStatus,
        newStatus: event.newStatus,
        changedBy: event.changedBy,
        ...(isEddApproval && { edd_approval: true }),
      },
      performedBy: event.changedBy,
    });
    await this.auditRepo.save(entry);
    this.logger.debug(`Audit: KYC ${event.aggregateId} → ${event.newStatus}`);
  }
}
