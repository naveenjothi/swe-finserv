import { BaseDomainEvent } from '../../../shared/domain/domain-event';
import { RiskTier } from '../value-objects/risk-tier.vo';

export class ClassificationMismatchDetectedEvent extends BaseDomainEvent {
  constructor(
    recordId: string,
    public readonly rulesVersion: string,
    public readonly storedTier: RiskTier | null,
    public readonly computedTier: RiskTier,
    public readonly isCritical: boolean,
  ) {
    super(recordId, 'risk-classification.mismatch-detected');
  }
}
