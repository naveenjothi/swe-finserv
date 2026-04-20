import { ClassifiableRecord } from '../value-objects/classifiable-record.vo';
import { ClassificationResult } from '../value-objects/classification-result.vo';
import { RiskTier } from '../value-objects/risk-tier.vo';
import { RulesPayload } from '../value-objects/rules-payload.vo';
import { RuleCode, TriggeredRule } from '../value-objects/triggered-rule.vo';

export class RulesEngineService {
  classify(record: ClassifiableRecord, rules: RulesPayload): ClassificationResult {
    const high = this.evaluateHigh(record, rules);
    if (high.length > 0) {
      return Object.freeze({
        computed_tier: RiskTier.HIGH,
        triggered_rules: Object.freeze(high),
        requires_edd: true,
      });
    }

    const medium = this.evaluateMedium(record, rules);
    if (medium.length > 0) {
      return Object.freeze({
        computed_tier: RiskTier.MEDIUM,
        triggered_rules: Object.freeze(medium),
        requires_edd: false,
      });
    }

    return Object.freeze({
      computed_tier: RiskTier.LOW,
      triggered_rules: Object.freeze([] as TriggeredRule[]),
      requires_edd: false,
    });
  }

  private evaluateHigh(record: ClassifiableRecord, rules: RulesPayload): TriggeredRule[] {
    const triggered: TriggeredRule[] = [];
    const flags = rules.high_risk.boolean_flags;

    if (flags.pep_status && record.pep_status === true) {
      triggered.push({
        tier: RiskTier.HIGH,
        code: RuleCode.PEP_STATUS,
        description: 'Politically Exposed Person',
        value: true,
      });
    }
    if (flags.sanctions_screening_match && record.sanctions_screening_match === true) {
      triggered.push({
        tier: RiskTier.HIGH,
        code: RuleCode.SANCTIONS_MATCH,
        description: 'Sanctions screening match',
        value: true,
      });
    }
    if (flags.adverse_media_flag && record.adverse_media_flag === true) {
      triggered.push({
        tier: RiskTier.HIGH,
        code: RuleCode.ADVERSE_MEDIA,
        description: 'Adverse media flag',
        value: true,
      });
    }
    if (
      record.country_of_tax_residence &&
      rules.high_risk.countries.includes(record.country_of_tax_residence)
    ) {
      triggered.push({
        tier: RiskTier.HIGH,
        code: RuleCode.HIGH_RISK_COUNTRY,
        description: `Country of tax residence is high risk: ${record.country_of_tax_residence}`,
        value: record.country_of_tax_residence,
      });
    }

    return triggered;
  }

  private evaluateMedium(record: ClassifiableRecord, rules: RulesPayload): TriggeredRule[] {
    const triggered: TriggeredRule[] = [];

    if (record.client_type && rules.medium_risk.client_types.includes(record.client_type)) {
      triggered.push({
        tier: RiskTier.MEDIUM,
        code: RuleCode.ENTITY_CLIENT,
        description: `Client type flagged for enhanced review: ${record.client_type}`,
        value: record.client_type,
      });
    }

    if (
      record.country_of_tax_residence &&
      rules.medium_risk.countries.includes(record.country_of_tax_residence)
    ) {
      triggered.push({
        tier: RiskTier.MEDIUM,
        code: RuleCode.MEDIUM_RISK_COUNTRY,
        description: `Country of tax residence is medium risk: ${record.country_of_tax_residence}`,
        value: record.country_of_tax_residence,
      });
    }

    const income = Number(record.annual_income);
    const threshold = rules.medium_risk.income_threshold;
    const riskySources = rules.medium_risk.income_source_of_funds;
    if (
      Number.isFinite(income) &&
      income > threshold &&
      record.source_of_funds &&
      riskySources.includes(record.source_of_funds)
    ) {
      triggered.push({
        tier: RiskTier.MEDIUM,
        code: RuleCode.HIGH_INCOME_RISKY_SOURCE,
        description: `Income > ${threshold} with source of funds: ${record.source_of_funds}`,
        value: income,
      });
    }

    return triggered;
  }
}
