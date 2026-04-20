import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PaginatedResult } from '../../../shared/application/pagination.dto';
import { AUDIT_REPOSITORY, AuditRepositoryPort } from '../../domain/ports/audit.repository.port';
import { AuditEntryView, GetAuditLogQuery } from './get-audit-log.query';

@QueryHandler(GetAuditLogQuery)
export class GetAuditLogHandler implements IQueryHandler<
  GetAuditLogQuery,
  PaginatedResult<AuditEntryView>
> {
  constructor(
    @Inject(AUDIT_REPOSITORY)
    private readonly repo: AuditRepositoryPort,
  ) {}

  async execute(query: GetAuditLogQuery): Promise<PaginatedResult<AuditEntryView>> {
    const result = query.aggregateId
      ? await this.repo.findByAggregateId(query.aggregateId, query.skip, query.take)
      : await this.repo.findAll(query.skip, query.take);

    return {
      items: result.items.map((e) => ({
        id: e.id,
        aggregate_id: e.aggregateId,
        aggregate_type: e.aggregateType,
        event_type: e.eventType,
        payload: e.payload,
        performed_by: e.performedBy,
        created_at: e.createdAt.toISOString(),
      })),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    };
  }
}
