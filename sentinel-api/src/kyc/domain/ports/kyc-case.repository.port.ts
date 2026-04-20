import { KycCase } from '../entities/kyc-case.entity';
import { PaginatedResult } from '../../../shared/application/pagination.dto';

export const KYC_CASE_REPOSITORY = Symbol('KYC_CASE_REPOSITORY');

export interface KycCaseRepositoryPort {
  save(entity: KycCase): Promise<KycCase>;
  findById(id: string): Promise<KycCase | null>;
  findByClientRecordId(clientRecordId: string): Promise<KycCase | null>;
  findAll(skip: number, take: number): Promise<PaginatedResult<KycCase>>;
}
