export class GetClientByIdQuery {
  constructor(public readonly id: string) {}
}

export interface ClientDetailView {
  id: string;
  client_name: string;
  client_type: string;
  pep_status: boolean;
  sanctions_screening_match: boolean;
  adverse_media_flag: boolean;
  country_of_tax_residence: string;
  annual_income: number;
  source_of_funds: string;
  computed_tier: string;
  triggered_rules: Array<{ tier: string; code: string; description: string }>;
  requires_edd: boolean;
  rules_version: string;
  declared_tier: string | null;
  mismatch: boolean;
  submitted_by: string;
  created_at: string;
}
