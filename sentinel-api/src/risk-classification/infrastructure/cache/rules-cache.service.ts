import { Inject, Injectable, Logger } from '@nestjs/common';
import { RuleSet } from '../../domain/entities/rule-set.entity';
import {
  RULES_CONFIG_REPOSITORY,
  RulesConfigRepositoryPort,
} from '../../domain/ports/rules-config.repository.port';

@Injectable()
export class RulesCacheService {
  private readonly logger = new Logger(RulesCacheService.name);
  private cached: RuleSet | null = null;
  private cachedAt: Date | null = null;
  private readonly ttlMs = 60_000;

  constructor(
    @Inject(RULES_CONFIG_REPOSITORY)
    private readonly repo: RulesConfigRepositoryPort,
  ) {}

  async getActive(): Promise<RuleSet> {
    if (this.cached && this.cachedAt && Date.now() - this.cachedAt.getTime() < this.ttlMs) {
      return this.cached;
    }
    const active = await this.repo.findActive();
    if (!active) {
      throw new Error('No active rules_config row found — run migrations to seed initial rules');
    }
    this.cached = active;
    this.cachedAt = new Date();
    this.logger.debug(`Rules cache refreshed: ${active.version}`);
    return active;
  }

  invalidate(): void {
    this.cached = null;
    this.cachedAt = null;
  }
}
