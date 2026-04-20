import { AuditEntry } from '../../domain/entities/audit-entry.entity';
import { AuditLogOrmEntity } from './audit-log.orm-entity';

export class AuditLogMapper {
  static toDomain(orm: AuditLogOrmEntity): AuditEntry {
    return AuditEntry.rehydrate({
      id: orm.id,
      aggregateId: orm.aggregateId,
      aggregateType: orm.aggregateType,
      eventType: orm.eventType,
      payload: orm.payload,
      performedBy: orm.performedBy,
      createdAt: orm.createdAt,
    });
  }

  static toOrm(entry: AuditEntry): AuditLogOrmEntity {
    const orm = new AuditLogOrmEntity();
    orm.id = entry.id;
    orm.aggregateId = entry.aggregateId;
    orm.aggregateType = entry.aggregateType;
    orm.eventType = entry.eventType;
    orm.payload = entry.payload;
    orm.performedBy = entry.performedBy;
    orm.createdAt = entry.createdAt;
    return orm;
  }
}
