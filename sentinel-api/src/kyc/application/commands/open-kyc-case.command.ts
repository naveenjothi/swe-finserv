export class OpenKycCaseCommand {
  constructor(
    public readonly clientRecordId: string,
    public readonly createdBy: string,
  ) {}
}

export interface OpenKycCaseResult {
  id: string;
  client_record_id: string;
  status: string;
  created_by: string;
}
