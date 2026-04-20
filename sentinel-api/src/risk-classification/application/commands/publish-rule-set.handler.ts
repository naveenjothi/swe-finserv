import { ConflictException, Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { RuleSet } from '../../domain/entities/rule-set.entity';
import {
  RULES_CONFIG_REPOSITORY,
  RulesConfigRepositoryPort,
} from '../../domain/ports/rules-config.repository.port';
import { RulesCacheService } from '../../infrastructure/cache/rules-cache.service';
import { PublishRuleSetCommand, PublishRuleSetResult } from './publish-rule-set.command';

@CommandHandler(PublishRuleSetCommand)
export class PublishRuleSetHandler
  implements ICommandHandler<PublishRuleSetCommand, PublishRuleSetResult>
{
  private readonly logger = new Logger(PublishRuleSetHandler.name);

  constructor(
    @Inject(RULES_CONFIG_REPOSITORY)
    private readonly repo: RulesConfigRepositoryPort,
    private readonly cache: RulesCacheService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: PublishRuleSetCommand): Promise<PublishRuleSetResult> {
    // Reject duplicate version
    const existing = await this.repo.findByVersion(command.version);
    if (existing) {
      throw new ConflictException(`Rule set version ${command.version} already exists`);
    }

    // Supersede current active rule set
    const now = new Date();
    let supersededVersion: string | null = null;
    const currentActive = await this.repo.findActive(now);
    if (currentActive) {
      currentActive.supersede(now);
      await this.repo.save(currentActive);
      supersededVersion = currentActive.version;
      this.logger.log(`Superseded rule set ${supersededVersion}`);
    }

    // Create and save new rule set
    const ruleSet = RuleSet.create({
      version: command.version,
      validFrom: now,
      validTo: null,
      payload: command.payload,
      source: command.source,
      createdBy: command.createdBy,
    });

    const saved = await this.repo.save(ruleSet);
    this.cache.invalidate();
    this.logger.log(`Published rule set ${saved.version}`);

    return {
      id: saved.id,
      version: saved.version,
      valid_from: saved.validFrom.toISOString(),
      source: saved.source,
      superseded_version: supersededVersion,
    };
  }
}
