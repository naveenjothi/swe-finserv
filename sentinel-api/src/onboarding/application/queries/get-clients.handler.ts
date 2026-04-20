import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PaginatedResult } from '../../../shared/application/pagination.dto';
import {
  CLIENT_RECORD_REPOSITORY,
  ClientRecordRepositoryPort,
} from '../../domain/ports/client-record.repository.port';
import { ClientView, GetClientsQuery } from './get-clients.query';

@QueryHandler(GetClientsQuery)
export class GetClientsHandler implements IQueryHandler<
  GetClientsQuery,
  PaginatedResult<ClientView>
> {
  constructor(
    @Inject(CLIENT_RECORD_REPOSITORY)
    private readonly repo: ClientRecordRepositoryPort,
  ) {}

  async execute(query: GetClientsQuery): Promise<PaginatedResult<ClientView>> {
    const result = await this.repo.findAll(query.skip, query.take);
    return {
      items: result.items.map((r) => ({
        id: r.id,
        client_name: r.clientName,
        client_type: r.clientType,
        computed_tier: r.computedTier,
        requires_edd: r.requiresEdd,
        mismatch: r.mismatch,
        rules_version: r.rulesVersion,
        submitted_by: r.submittedBy,
        created_at: r.createdAt.toISOString(),
      })),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    };
  }
}
