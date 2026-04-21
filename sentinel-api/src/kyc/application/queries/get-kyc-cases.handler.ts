import { Inject, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { PaginatedResult } from '../../../shared/application/pagination.dto';
import { GetKycCasesQuery, GetKycCaseByIdQuery, KycCaseView } from './get-kyc-cases.query';

@QueryHandler(GetKycCasesQuery)
export class GetKycCasesHandler implements IQueryHandler<
  GetKycCasesQuery,
  PaginatedResult<KycCaseView>
> {
  constructor(private readonly dataSource: DataSource) {}

  async execute(query: GetKycCasesQuery): Promise<PaginatedResult<KycCaseView>> {
    const qb = this.dataSource
      .createQueryBuilder()
      .select([
        'c.id AS id',
        'c.client_record_id AS client_id',
        'r.client_name AS client_name',
        'c.status AS kyc_status',
        'c.assigned_to AS updated_by',
        'c.notes AS reason',
        'r.requires_edd AS requires_edd',
        'c.updated_at AS updated_at',
      ])
      .from('kyc_cases', 'c')
      .leftJoin('client_records', 'r', 'r.id = c.client_record_id');

    if (query.status) {
      qb.where('c.status = :status', { status: query.status });
    }

    const [items, totalCount] = await Promise.all([
      qb.orderBy('c.updated_at', 'DESC').offset(query.skip).limit(query.take).getRawMany(),
      qb.getCount(),
    ]);

    const mappedItems = items.map((row) => ({
      id: row.id,
      client_id: row.client_id,
      client_name: row.client_name,
      kyc_status: row.kyc_status,
      previous_status: null,
      updated_by: row.updated_by || 'system',
      reason: row.reason,
      requires_edd: row.requires_edd,
      updated_at: (row.updated_at as Date).toISOString(),
    }));

    return {
      items: mappedItems,
      total: totalCount,
      page: Math.floor(query.skip / query.take) + 1,
      pageSize: query.take,
    };
  }
}

@QueryHandler(GetKycCaseByIdQuery)
export class GetKycCaseByIdHandler implements IQueryHandler<GetKycCaseByIdQuery, KycCaseView> {
  constructor(private readonly dataSource: DataSource) {}

  async execute(query: GetKycCaseByIdQuery): Promise<KycCaseView> {
    const row = await this.dataSource
      .createQueryBuilder()
      .select([
        'c.id AS id',
        'c.client_record_id AS client_id',
        'r.client_name AS client_name',
        'c.status AS kyc_status',
        'c.assigned_to AS updated_by',
        'c.notes AS reason',
        'r.requires_edd AS requires_edd',
        'c.updated_at AS updated_at',
      ])
      .from('kyc_cases', 'c')
      .leftJoin('client_records', 'r', 'r.id = c.client_record_id')
      .where('c.id = :id', { id: query.id })
      .getRawOne();

    if (!row) {
      throw new NotFoundException(`KYC case ${query.id} not found`);
    }

    return {
      id: row.id,
      client_id: row.client_id,
      client_name: row.client_name,
      kyc_status: row.kyc_status,
      previous_status: null,
      updated_by: row.updated_by || 'system',
      reason: row.reason,
      requires_edd: row.requires_edd,
      updated_at: (row.updated_at as Date).toISOString(),
    };
  }
}
