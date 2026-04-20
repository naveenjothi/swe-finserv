import { ClassifiableRecord } from '../../../risk-classification/domain/value-objects/classifiable-record.vo';
import { RiskTier } from '../../../risk-classification/domain/value-objects/risk-tier.vo';

export class SubmitOnboardingCommand {
  constructor(
    public readonly clientName: string,
    public readonly record: ClassifiableRecord,
    public readonly submittedBy: string,
    public readonly declaredTier: RiskTier | null = null,
  ) {}
}

export interface SubmitOnboardingResult {
  id: string;
  client_name: string;
  computed_tier: string;
  declared_tier: string | null;
  mismatch: boolean;
  requires_edd: boolean;
  rules_version: string;
  triggered_rules: Array<{ tier: string; code: string; description: string }>;
}
