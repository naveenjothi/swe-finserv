import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  RULES_CONFIG_REPOSITORY,
  RulesConfigRepositoryPort,
} from '../../domain/ports/rules-config.repository.port';
import { GetRulesVersionsQuery, RulesVersionInfoView } from './get-rules-versions.query';

@QueryHandler(GetRulesVersionsQuery)
export class GetRulesVersionsHandler implements IQueryHandler<
  GetRulesVersionsQuery,
  RulesVersionInfoView[]
> {
  constructor(
    @Inject(RULES_CONFIG_REPOSITORY)
    private readonly repo: RulesConfigRepositoryPort,
  ) {}

  async execute(): Promise<RulesVersionInfoView[]> {
    const rows = await this.repo.findAll();

    return rows.map((row) => ({
      version: row.version,
      valid_from: row.validFrom.toISOString(),
      created_at: row.createdAt.toISOString(),
      created_by: row.createdBy,
    }));
  }
}
