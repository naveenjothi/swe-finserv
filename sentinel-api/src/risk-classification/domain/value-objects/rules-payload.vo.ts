export interface RulesPayload {
  readonly high_risk: {
    readonly countries: string[];
    readonly boolean_flags: {
      readonly pep_status: boolean;
      readonly sanctions_screening_match: boolean;
      readonly adverse_media_flag: boolean;
    };
  };
  readonly medium_risk: {
    readonly countries: string[];
    readonly client_types: string[];
    readonly income_threshold: number;
    readonly income_source_of_funds: string[];
  };
}
