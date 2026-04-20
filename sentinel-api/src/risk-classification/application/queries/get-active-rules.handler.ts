import { NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { RulesCacheService } from '../../infrastructure/cache/rules-cache.service';
import { ActiveRulesView, GetActiveRulesQuery } from './get-active-rules.query';

@QueryHandler(GetActiveRulesQuery)
export class GetActiveRulesHandler implements IQueryHandler<GetActiveRulesQuery, ActiveRulesView> {
  constructor(private readonly cache: RulesCacheService) {}

  async execute(): Promise<ActiveRulesView> {
    try {
      const rs = await this.cache.getActive();
      return {
        version: rs.version,
        valid_from: rs.validFrom.toISOString(),
        valid_to: rs.validTo ? rs.validTo.toISOString() : null,
        source: rs.source,
        payload: rs.payload,
      };
    } catch {
      throw new NotFoundException('No active rules configuration');
    }
  }
}
