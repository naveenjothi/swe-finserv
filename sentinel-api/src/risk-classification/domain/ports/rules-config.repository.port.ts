import { RuleSet } from '../entities/rule-set.entity';

export const RULES_CONFIG_REPOSITORY = Symbol('RULES_CONFIG_REPOSITORY');

export interface RulesConfigRepositoryPort {
  findActive(at?: Date): Promise<RuleSet | null>;
  findByVersion(version: string): Promise<RuleSet | null>;
  findAll(): Promise<RuleSet[]>;
  save(ruleSet: RuleSet): Promise<RuleSet>;
}
