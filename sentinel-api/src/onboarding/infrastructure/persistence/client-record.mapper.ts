import { ClientRecord } from '../../domain/entities/client-record.entity';
import { ClientRecordOrmEntity } from './client-record.orm-entity';

export class ClientRecordMapper {
  static toDomain(orm: ClientRecordOrmEntity): ClientRecord {
    return ClientRecord.rehydrate({
      id: orm.id,
      clientName: orm.clientName,
      clientType: orm.clientType,
      pepStatus: orm.pepStatus,
      sanctionsScreeningMatch: orm.sanctionsScreeningMatch,
      adverseMediaFlag: orm.adverseMediaFlag,
      countryOfTaxResidence: orm.countryOfTaxResidence,
      annualIncome: Number(orm.annualIncome),
      sourceOfFunds: orm.sourceOfFunds,
      computedTier: orm.computedTier,
      triggeredRules: orm.triggeredRules,
      requiresEdd: orm.requiresEdd,
      rulesVersion: orm.rulesVersion,
      declaredTier: orm.declaredTier,
      mismatch: orm.mismatch,
      submittedBy: orm.submittedBy,
      createdAt: orm.createdAt,
    });
  }

  static toOrm(entity: ClientRecord): ClientRecordOrmEntity {
    const orm = new ClientRecordOrmEntity();
    orm.id = entity.id;
    orm.clientName = entity.clientName;
    orm.clientType = entity.clientType;
    orm.pepStatus = entity.pepStatus;
    orm.sanctionsScreeningMatch = entity.sanctionsScreeningMatch;
    orm.adverseMediaFlag = entity.adverseMediaFlag;
    orm.countryOfTaxResidence = entity.countryOfTaxResidence;
    orm.annualIncome = entity.annualIncome;
    orm.sourceOfFunds = entity.sourceOfFunds;
    orm.computedTier = entity.computedTier;
    orm.triggeredRules = entity.triggeredRules;
    orm.requiresEdd = entity.requiresEdd;
    orm.rulesVersion = entity.rulesVersion;
    orm.declaredTier = entity.declaredTier;
    orm.mismatch = entity.mismatch;
    orm.submittedBy = entity.submittedBy;
    orm.createdAt = entity.createdAt;
    return orm;
  }
}
