export class GetKycCasesQuery {
  constructor(
    public readonly skip: number,
    public readonly take: number,
  ) {}
}

export class GetKycCaseByIdQuery {
  constructor(public readonly id: string) {}
}

export interface KycCaseView {
  id: string;
  client_record_id: string;
  status: string;
  assigned_to: string | null;
  notes: string | null;
  documents: string[];
  created_by: string;
  updated_at: string;
  created_at: string;
}
