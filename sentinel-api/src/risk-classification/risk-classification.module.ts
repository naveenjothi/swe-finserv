import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RulesEngineService } from './domain/services/rules-engine.service';
import { RULES_CONFIG_REPOSITORY } from './domain/ports/rules-config.repository.port';
import { RulesConfigOrmEntity } from './infrastructure/persistence/rules-config.orm-entity';
import { RulesConfigTypeOrmRepository } from './infrastructure/persistence/rules-config.repository';
import { RulesCacheService } from './infrastructure/cache/rules-cache.service';
import { ClassifyRecordHandler } from './application/commands/classify-record.handler';
import { PublishRuleSetHandler } from './application/commands/publish-rule-set.handler';
import { GetActiveRulesHandler } from './application/queries/get-active-rules.handler';
import { GetRulesVersionHandler } from './application/queries/get-rules-version.handler';
import { GetRulesVersionsHandler } from './application/queries/get-rules-versions.handler';
import { RulesAdminController } from './infrastructure/http/rules-admin.controller';

const commandHandlers = [ClassifyRecordHandler, PublishRuleSetHandler];
const queryHandlers = [GetActiveRulesHandler, GetRulesVersionHandler, GetRulesVersionsHandler];

@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature([RulesConfigOrmEntity])],
  controllers: [RulesAdminController],
  providers: [
    RulesEngineService,
    RulesCacheService,
    { provide: RULES_CONFIG_REPOSITORY, useClass: RulesConfigTypeOrmRepository },
    ...commandHandlers,
    ...queryHandlers,
  ],
  exports: [RulesEngineService, RulesCacheService, RULES_CONFIG_REPOSITORY],
})
export class RiskClassificationModule {}
