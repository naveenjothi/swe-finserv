import { RiskTier } from './risk-tier.vo';

export enum RuleCode {
  PEP_STATUS = 'PEP_STATUS',
  SANCTIONS_MATCH = 'SANCTIONS_MATCH',
  ADVERSE_MEDIA = 'ADVERSE_MEDIA',
  HIGH_RISK_COUNTRY = 'HIGH_RISK_COUNTRY',
  ENTITY_CLIENT = 'ENTITY_CLIENT',
  MEDIUM_RISK_COUNTRY = 'MEDIUM_RISK_COUNTRY',
  HIGH_INCOME_RISKY_SOURCE = 'HIGH_INCOME_RISKY_SOURCE',
}

export interface TriggeredRule {
  readonly tier: RiskTier;
  readonly code: RuleCode;
  readonly description: string;
  readonly value?: string | number | boolean;
}
