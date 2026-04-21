import { BaseDomainEvent } from '../../../shared/domain/domain-event';
import { RiskTier } from '../../../risk-classification/domain/value-objects/risk-tier.vo';

export class OnboardingSubmittedEvent extends BaseDomainEvent {
  constructor(
    clientRecordId: string,
    public readonly rulesVersion: string,
    public readonly computedTier: RiskTier,
    public readonly createdBy: string | null,
  ) {
    super(clientRecordId, 'onboarding.submitted');
  }
}
