import { KycCase } from '../../domain/entities/kyc-case.entity';
import { KycCaseOrmEntity } from './kyc-case.orm-entity';

export class KycCaseMapper {
  static toDomain(orm: KycCaseOrmEntity): KycCase {
    return KycCase.rehydrate({
      id: orm.id,
      clientRecordId: orm.clientRecordId,
      status: orm.status,
      assignedTo: orm.assignedTo,
      notes: orm.notes,
      documents: orm.documents,
      createdBy: orm.createdBy,
      updatedAt: orm.updatedAt,
      createdAt: orm.createdAt,
    });
  }

  static toOrm(entity: KycCase): KycCaseOrmEntity {
    const orm = new KycCaseOrmEntity();
    orm.id = entity.id;
    orm.clientRecordId = entity.clientRecordId;
    orm.status = entity.status;
    orm.assignedTo = entity.assignedTo;
    orm.notes = entity.notes;
    orm.documents = entity.documents;
    orm.createdBy = entity.createdBy;
    orm.updatedAt = entity.updatedAt;
    orm.createdAt = entity.createdAt;
    return orm;
  }
}
