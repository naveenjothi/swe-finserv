import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { PaginatedResult } from '../../../shared/application/pagination.dto';
import { ClientView, GetClientsQuery } from './get-clients.query';

@QueryHandler(GetClientsQuery)
export class GetClientsHandler implements IQueryHandler<
  GetClientsQuery,
  PaginatedResult<ClientView>
> {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async execute(query: GetClientsQuery): Promise<PaginatedResult<ClientView>> {
    const [{ count }] = await this.dataSource.query(`SELECT COUNT(*) as count FROM client_records`);
    const total = parseInt(count, 10);

    const rows = await this.dataSource.query(
      `
      SELECT 
        c.id, c.client_name, c.client_type, c.computed_tier, 
        c.requires_edd, c.mismatch, c.rules_version, 
        c.submitted_by, c.created_at,
        k.status as kyc_status, c.relationship_manager
      FROM client_records c
      LEFT JOIN kyc_cases k ON k.client_record_id = c.id
      ORDER BY c.created_at DESC
      LIMIT $1 OFFSET $2
      `,
      [query.take, query.skip],
    );

    return {
      items: rows.map((r: any) => ({
        id: r.id,
        client_name: r.client_name,
        client_type: r.client_type,
        computed_tier: r.computed_tier,
        requires_edd: r.requires_edd,
        kyc_status: r.kyc_status || 'NOT_STARTED',
        mismatch: r.mismatch,
        rules_version: r.rules_version,
        submitted_by: r.submitted_by,
        created_at: r.created_at.toISOString(),
        relationship_manager: r.relationship_manager,
      })),
      total,
      page: Math.floor(query.skip / query.take) + 1,
      pageSize: query.take,
    };
  }
}
