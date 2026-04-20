import { Body, Controller, Get, Post } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RulesSource } from '../../domain/entities/rule-set.entity';
import {
  PublishRuleSetCommand,
  PublishRuleSetResult,
} from '../../application/commands/publish-rule-set.command';
import {
  ClassifyRecordCommand,
  ClassifyRecordResult,
} from '../../application/commands/classify-record.command';
import {
  GetActiveRulesQuery,
  ActiveRulesView,
} from '../../application/queries/get-active-rules.query';
import {
  GetRulesVersionQuery,
  RulesVersionView,
} from '../../application/queries/get-rules-version.query';
import { PublishRuleSetDto, FcaWebhookDto } from '../../application/dto/rules-admin.dto';
import { ClassifiableRecord } from '../../domain/value-objects/classifiable-record.vo';

@ApiTags('Rules Admin')
@Controller('rules')
export class RulesAdminController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get('active')
  @ApiOperation({ summary: 'Get the currently active rule set' })
  async getActive(): Promise<ActiveRulesView> {
    return this.queryBus.execute(new GetActiveRulesQuery());
  }

  @Get('version')
  @ApiOperation({ summary: 'Get the active rules version' })
  async getVersion(): Promise<RulesVersionView> {
    return this.queryBus.execute(new GetRulesVersionQuery());
  }

  @Post()
  @ApiOperation({ summary: 'Publish a new rule set (manual upload)' })
  async publish(@Body() dto: PublishRuleSetDto): Promise<PublishRuleSetResult> {
    return this.commandBus.execute(
      new PublishRuleSetCommand(dto.version, dto.payload, RulesSource.MANUAL_UPLOAD, 'system'),
    );
  }

  @Post('classify')
  @ApiOperation({ summary: 'Classify a record against the active rules (dry run)' })
  async classify(@Body() record: ClassifiableRecord): Promise<ClassifyRecordResult> {
    return this.commandBus.execute(new ClassifyRecordCommand(record));
  }

  @Post('fca-webhook')
  @ApiOperation({ summary: 'Receive FCA regulatory update webhook' })
  async fcaWebhook(@Body() dto: FcaWebhookDto): Promise<PublishRuleSetResult> {
    return this.commandBus.execute(
      new PublishRuleSetCommand(dto.version, dto.payload, RulesSource.FCA_WEBHOOK, 'fca-webhook'),
    );
  }
}
