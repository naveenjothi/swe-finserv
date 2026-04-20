import { RulesPayload } from '../../domain/value-objects/rules-payload.vo';

export const INITIAL_RULES_VERSION = 'v1.0.0-2024';

export const INITIAL_RULES_PAYLOAD: RulesPayload = {
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
