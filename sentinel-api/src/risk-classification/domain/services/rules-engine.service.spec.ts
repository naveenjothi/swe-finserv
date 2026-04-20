import { ClassifiableRecord } from '../value-objects/classifiable-record.vo';
import { RiskTier } from '../value-objects/risk-tier.vo';
import { RulesPayload } from '../value-objects/rules-payload.vo';
import { RuleCode } from '../value-objects/triggered-rule.vo';
import { RulesEngineService } from './rules-engine.service';

const rules: RulesPayload = {
  high_risk: {
    countries: ['Russia', 'Belarus', 'Venezuela'],
    boolean_flags: {
      pep_status: true,
      sanctions_screening_match: true,
      adverse_media_flag: true,
    },
  },
  medium_risk: {
    countries: ['Brazil', 'Turkey', 'South Africa', 'Mexico', 'UAE', 'China'],
    client_types: ['ENTITY'],
    income_threshold: 500000,
    income_source_of_funds: ['Inheritance', 'Gift', 'Other'],
  },
};

const clean = (overrides: Partial<ClassifiableRecord> = {}): ClassifiableRecord => ({
  pep_status: false,
  sanctions_screening_match: false,
  adverse_media_flag: false,
  country_of_tax_residence: 'Netherlands',
  client_type: 'INDIVIDUAL',
  annual_income: 100000,
  source_of_funds: 'Business Income',
  ...overrides,
});

describe('RulesEngineService', () => {
  let engine: RulesEngineService;

  beforeEach(() => {
    engine = new RulesEngineService();
  });

  // ---------- LOW ----------
  it('returns LOW for a clean individual with no triggers', () => {
    const result = engine.classify(clean(), rules);
    expect(result.computed_tier).toBe(RiskTier.LOW);
    expect(result.triggered_rules).toEqual([]);
    expect(result.requires_edd).toBe(false);
  });

  // ---------- HIGH ----------
  it('classifies HIGH when pep_status is true', () => {
    const result = engine.classify(clean({ pep_status: true }), rules);
    expect(result.computed_tier).toBe(RiskTier.HIGH);
    expect(result.requires_edd).toBe(true);
    expect(result.triggered_rules.map((r) => r.code)).toContain(RuleCode.PEP_STATUS);
  });

  it('classifies HIGH when sanctions_screening_match is true', () => {
    const result = engine.classify(clean({ sanctions_screening_match: true }), rules);
    expect(result.computed_tier).toBe(RiskTier.HIGH);
    expect(result.triggered_rules.map((r) => r.code)).toContain(RuleCode.SANCTIONS_MATCH);
  });

  it('classifies HIGH when adverse_media_flag is true', () => {
    const result = engine.classify(clean({ adverse_media_flag: true }), rules);
    expect(result.computed_tier).toBe(RiskTier.HIGH);
    expect(result.triggered_rules.map((r) => r.code)).toContain(RuleCode.ADVERSE_MEDIA);
  });

  it.each(['Russia', 'Belarus', 'Venezuela'])(
    'classifies HIGH when country of tax residence is %s',
    (country) => {
      const result = engine.classify(clean({ country_of_tax_residence: country }), rules);
      expect(result.computed_tier).toBe(RiskTier.HIGH);
      expect(result.triggered_rules.map((r) => r.code)).toContain(RuleCode.HIGH_RISK_COUNTRY);
    },
  );

  it('HIGH overrides MEDIUM when a record would otherwise be MEDIUM', () => {
    const result = engine.classify(
      clean({ client_type: 'ENTITY', country_of_tax_residence: 'Russia' }),
      rules,
    );
    expect(result.computed_tier).toBe(RiskTier.HIGH);
    expect(result.triggered_rules.every((r) => r.tier === RiskTier.HIGH)).toBe(true);
  });

  it('collects multiple HIGH triggers', () => {
    const result = engine.classify(
      clean({
        pep_status: true,
        sanctions_screening_match: true,
        adverse_media_flag: true,
        country_of_tax_residence: 'Russia',
      }),
      rules,
    );
    expect(result.computed_tier).toBe(RiskTier.HIGH);
    expect(result.triggered_rules).toHaveLength(4);
  });

  it('does NOT trigger HIGH pep_status when the rule flag is disabled', () => {
    const disabledRules: RulesPayload = {
      ...rules,
      high_risk: {
        ...rules.high_risk,
        boolean_flags: { ...rules.high_risk.boolean_flags, pep_status: false },
      },
    };
    const result = engine.classify(clean({ pep_status: true }), disabledRules);
    expect(result.computed_tier).toBe(RiskTier.LOW);
  });

  // ---------- MEDIUM ----------
  it('classifies MEDIUM when client_type is ENTITY', () => {
    const result = engine.classify(clean({ client_type: 'ENTITY' }), rules);
    expect(result.computed_tier).toBe(RiskTier.MEDIUM);
    expect(result.requires_edd).toBe(false);
    expect(result.triggered_rules.map((r) => r.code)).toContain(RuleCode.ENTITY_CLIENT);
  });

  it.each(['Brazil', 'Turkey', 'South Africa', 'Mexico', 'UAE', 'China'])(
    'classifies MEDIUM when country of tax residence is %s',
    (country) => {
      const result = engine.classify(clean({ country_of_tax_residence: country }), rules);
      expect(result.computed_tier).toBe(RiskTier.MEDIUM);
      expect(result.triggered_rules.map((r) => r.code)).toContain(RuleCode.MEDIUM_RISK_COUNTRY);
    },
  );

  it.each(['Inheritance', 'Gift', 'Other'])(
    'classifies MEDIUM when income > 500k and source is %s',
    (source) => {
      const result = engine.classify(
        clean({ annual_income: 750000, source_of_funds: source }),
        rules,
      );
      expect(result.computed_tier).toBe(RiskTier.MEDIUM);
      expect(result.triggered_rules.map((r) => r.code)).toContain(
        RuleCode.HIGH_INCOME_RISKY_SOURCE,
      );
    },
  );

  it('does NOT trigger MEDIUM when income > 500k but source is Business Income', () => {
    const result = engine.classify(
      clean({ annual_income: 1_200_000, source_of_funds: 'Business Income' }),
      rules,
    );
    expect(result.computed_tier).toBe(RiskTier.LOW);
  });

  it('does NOT trigger MEDIUM when income equals threshold exactly (strict >)', () => {
    const result = engine.classify(
      clean({ annual_income: 500_000, source_of_funds: 'Inheritance' }),
      rules,
    );
    expect(result.computed_tier).toBe(RiskTier.LOW);
  });

  it('does NOT trigger MEDIUM when source is risky but income is below threshold', () => {
    const result = engine.classify(
      clean({ annual_income: 250_000, source_of_funds: 'Inheritance' }),
      rules,
    );
    expect(result.computed_tier).toBe(RiskTier.LOW);
  });

  it('collects multiple MEDIUM triggers', () => {
    const result = engine.classify(
      clean({
        client_type: 'ENTITY',
        country_of_tax_residence: 'Brazil',
        annual_income: 750000,
        source_of_funds: 'Gift',
      }),
      rules,
    );
    expect(result.computed_tier).toBe(RiskTier.MEDIUM);
    expect(result.triggered_rules).toHaveLength(3);
  });

  // ---------- Invariants ----------
  it('requires_edd is true only for HIGH', () => {
    expect(engine.classify(clean({ pep_status: true }), rules).requires_edd).toBe(true);
    expect(engine.classify(clean({ client_type: 'ENTITY' }), rules).requires_edd).toBe(false);
    expect(engine.classify(clean(), rules).requires_edd).toBe(false);
  });

  it('does not trigger a country rule for an unknown country', () => {
    const result = engine.classify(clean({ country_of_tax_residence: 'Atlantis' }), rules);
    expect(result.computed_tier).toBe(RiskTier.LOW);
  });

  it('produces the same result for the same inputs (deterministic)', () => {
    const record = clean({ pep_status: true, country_of_tax_residence: 'Brazil' });
    const a = engine.classify(record, rules);
    const b = engine.classify(record, rules);
    expect(a).toEqual(b);
  });

  it('returns a frozen result and frozen triggered_rules array', () => {
    const result = engine.classify(clean({ pep_status: true }), rules);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.triggered_rules)).toBe(true);
  });

  it('does not mutate the input record', () => {
    const record = clean({ pep_status: true });
    const snapshot = JSON.stringify(record);
    engine.classify(record, rules);
    expect(JSON.stringify(record)).toBe(snapshot);
  });

  it('does not mutate the rules payload', () => {
    const snapshot = JSON.stringify(rules);
    engine.classify(clean({ pep_status: true, country_of_tax_residence: 'Russia' }), rules);
    expect(JSON.stringify(rules)).toBe(snapshot);
  });

  it('handles numeric income passed as string-typed value (coerces to number)', () => {
    const record = clean({
      annual_income: '750000' as unknown as number,
      source_of_funds: 'Inheritance',
    });
    const result = engine.classify(record, rules);
    expect(result.computed_tier).toBe(RiskTier.MEDIUM);
  });

  it('ignores the country trigger when country_of_tax_residence is empty', () => {
    const result = engine.classify(clean({ country_of_tax_residence: '' }), rules);
    expect(result.computed_tier).toBe(RiskTier.LOW);
  });

  it('each triggered rule carries its tier and description', () => {
    const result = engine.classify(clean({ pep_status: true }), rules);
    const [trigger] = result.triggered_rules;
    expect(trigger.tier).toBe(RiskTier.HIGH);
    expect(trigger.description).toBeTruthy();
    expect(trigger.code).toBe(RuleCode.PEP_STATUS);
  });
});
