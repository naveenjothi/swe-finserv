import { KycStatus } from '../../domain/value-objects/kyc-status.vo';

export class TransitionKycCommand {
  constructor(
    public readonly kycCaseId: string,
    public readonly newStatus: KycStatus,
    public readonly changedBy: string,
    public readonly notes?: string,
  ) {}
}

export interface TransitionKycResult {
  id: string;
  status: string;
  previous_status: string;
  updated_at: string;
}
