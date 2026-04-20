import { BaseDomainEvent } from '../../../shared/domain/domain-event';
import { KycStatus } from '../value-objects/kyc-status.vo';

export class KycStatusChangedEvent extends BaseDomainEvent {
  constructor(
    kycCaseId: string,
    public readonly clientRecordId: string,
    public readonly previousStatus: KycStatus,
    public readonly newStatus: KycStatus,
    public readonly changedBy: string,
  ) {
    super(kycCaseId, 'kyc.status-changed');
  }
}
