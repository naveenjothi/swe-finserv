export class GetKycCasesQuery {
  constructor(
    public readonly skip: number,
    public readonly take: number,
    public readonly status?: string,
  ) {}
}

export class GetKycCaseByIdQuery {
  constructor(public readonly id: string) {}
}

export interface KycCaseView {
  id: string;
  client_id: string; // The frontend maps client_record_id to client_id
  client_name: string; // From join
  kyc_status: string; // status in DB mapped to kyc_status in frontend
  previous_status: string | null;
  updated_by: string; // createdBy or assignedTo or audit log? We can just use created_by or "system"
  reason?: string; // notes mapped to reason
  requires_edd: boolean; // From join
  updated_at: string;
}
