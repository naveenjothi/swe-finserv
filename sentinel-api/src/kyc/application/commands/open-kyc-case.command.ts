import { KycStatus } from '../../domain/value-objects/kyc-status.vo';

export class OpenKycCaseCommand {
  constructor(
    public readonly clientRecordId: string,
    public readonly createdBy: string,
    public readonly initialStatus?: KycStatus,
  ) {}
}

export interface OpenKycCaseResult {
  id: string;
  client_record_id: string;
  status: string;
  created_by: string;
}
