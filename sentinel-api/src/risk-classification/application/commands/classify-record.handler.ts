import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RulesEngineService } from '../../domain/services/rules-engine.service';
import { RulesCacheService } from '../../infrastructure/cache/rules-cache.service';
import { ClassifyRecordCommand, ClassifyRecordResult } from './classify-record.command';

@CommandHandler(ClassifyRecordCommand)
export class ClassifyRecordHandler implements ICommandHandler<
  ClassifyRecordCommand,
  ClassifyRecordResult
> {
  constructor(
    private readonly engine: RulesEngineService,
    private readonly cache: RulesCacheService,
  ) {}

  async execute(command: ClassifyRecordCommand): Promise<ClassifyRecordResult> {
    const ruleSet = await this.cache.getActive();
    const result = this.engine.classify(command.record, ruleSet.payload);
    return {
      rulesVersion: ruleSet.version,
      computed_tier: result.computed_tier,
      triggered_rules: result.triggered_rules.map((r) => ({
        tier: r.tier,
        code: r.code,
        description: r.description,
      })),
      requires_edd: result.requires_edd,
    };
  }
}
