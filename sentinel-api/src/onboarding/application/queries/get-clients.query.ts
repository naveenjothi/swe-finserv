export class GetClientsQuery {
  constructor(
    public readonly skip: number,
    public readonly take: number,
  ) {}
}

export interface ClientView {
  id: string;
  client_name: string;
  client_type: string;
  computed_tier: string;
  requires_edd: boolean;
  kyc_status: string;
  mismatch: boolean;
  rules_version: string;
  submitted_by: string;
  created_at: string;
}
