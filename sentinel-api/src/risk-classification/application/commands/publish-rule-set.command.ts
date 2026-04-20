import { RulesPayload } from '../../domain/value-objects/rules-payload.vo';
import { RulesSource } from '../../domain/entities/rule-set.entity';

export class PublishRuleSetCommand {
  constructor(
    public readonly version: string,
    public readonly payload: RulesPayload,
    public readonly source: RulesSource,
    public readonly createdBy: string,
  ) {}
}

export interface PublishRuleSetResult {
  id: string;
  version: string;
  valid_from: string;
  source: string;
  superseded_version: string | null;
}
