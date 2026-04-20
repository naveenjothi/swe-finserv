import { NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { RulesCacheService } from '../../infrastructure/cache/rules-cache.service';
import { GetRulesVersionQuery, RulesVersionView } from './get-rules-version.query';

@QueryHandler(GetRulesVersionQuery)
export class GetRulesVersionHandler implements IQueryHandler<
  GetRulesVersionQuery,
  RulesVersionView
> {
  constructor(private readonly cache: RulesCacheService) {}

  async execute(): Promise<RulesVersionView> {
    try {
      const rs = await this.cache.getActive();
      return {
        version: rs.version,
        valid_from: rs.validFrom.toISOString(),
      };
    } catch {
      throw new NotFoundException('No active rules configuration');
    }
  }
}
