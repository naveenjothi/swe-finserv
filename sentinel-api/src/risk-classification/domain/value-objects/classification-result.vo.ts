import { RiskTier } from './risk-tier.vo';
import { TriggeredRule } from './triggered-rule.vo';

export interface ClassificationResult {
  readonly computed_tier: RiskTier;
  readonly triggered_rules: ReadonlyArray<TriggeredRule>;
  readonly requires_edd: boolean;
}
