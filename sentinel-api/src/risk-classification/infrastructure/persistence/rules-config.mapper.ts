import { RuleSet, RulesSource } from '../../domain/entities/rule-set.entity';
import { RulesConfigOrmEntity } from './rules-config.orm-entity';

export class RulesConfigMapper {
  static toDomain(orm: RulesConfigOrmEntity): RuleSet {
    return RuleSet.rehydrate({
      id: orm.id,
      version: orm.version,
      validFrom: orm.validFrom,
      validTo: orm.validTo,
      payload: orm.payload,
      source: orm.source as RulesSource,
      createdBy: orm.createdBy,
      createdAt: orm.createdAt,
    });
  }

  static toOrm(ruleSet: RuleSet): RulesConfigOrmEntity {
    const orm = new RulesConfigOrmEntity();
    orm.id = ruleSet.id;
    orm.version = ruleSet.version;
    orm.validFrom = ruleSet.validFrom;
    orm.validTo = ruleSet.validTo;
    orm.payload = ruleSet.payload;
    orm.source = ruleSet.source;
    orm.createdBy = ruleSet.createdBy;
    orm.createdAt = ruleSet.createdAt;
    return orm;
  }
}
