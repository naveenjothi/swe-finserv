import { Inject, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PaginatedResult } from '../../../shared/application/pagination.dto';
import {
  KYC_CASE_REPOSITORY,
  KycCaseRepositoryPort,
} from '../../domain/ports/kyc-case.repository.port';
import { KycCase } from '../../domain/entities/kyc-case.entity';
import {
  GetKycCasesQuery,
  GetKycCaseByIdQuery,
  KycCaseView,
} from './get-kyc-cases.query';

function toView(c: KycCase): KycCaseView {
  return {
    id: c.id,
    client_record_id: c.clientRecordId,
    status: c.status,
    assigned_to: c.assignedTo,
    notes: c.notes,
    documents: c.documents,
    created_by: c.createdBy,
    updated_at: c.updatedAt.toISOString(),
    created_at: c.createdAt.toISOString(),
  };
}

@QueryHandler(GetKycCasesQuery)
export class GetKycCasesHandler
  implements IQueryHandler<GetKycCasesQuery, PaginatedResult<KycCaseView>>
{
  constructor(
    @Inject(KYC_CASE_REPOSITORY)
    private readonly repo: KycCaseRepositoryPort,
  ) {}

  async execute(query: GetKycCasesQuery): Promise<PaginatedResult<KycCaseView>> {
    const result = await this.repo.findAll(query.skip, query.take);
    return {
      items: result.items.map(toView),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    };
  }
}

@QueryHandler(GetKycCaseByIdQuery)
export class GetKycCaseByIdHandler
  implements IQueryHandler<GetKycCaseByIdQuery, KycCaseView>
{
  constructor(
    @Inject(KYC_CASE_REPOSITORY)
    private readonly repo: KycCaseRepositoryPort,
  ) {}

  async execute(query: GetKycCaseByIdQuery): Promise<KycCaseView> {
    const kycCase = await this.repo.findById(query.id);
    if (!kycCase) {
      throw new NotFoundException(`KYC case ${query.id} not found`);
    }
    return toView(kycCase);
  }
}
