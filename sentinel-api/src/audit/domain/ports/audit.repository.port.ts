import { AuditEntry } from '../entities/audit-entry.entity';
import { PaginatedResult } from '../../../shared/application/pagination.dto';

export const AUDIT_REPOSITORY = Symbol('AUDIT_REPOSITORY');

export interface AuditRepositoryPort {
  save(entry: AuditEntry): Promise<AuditEntry>;
  findByAggregateId(
    aggregateId: string,
    skip: number,
    take: number,
  ): Promise<PaginatedResult<AuditEntry>>;
  findAll(skip: number, take: number): Promise<PaginatedResult<AuditEntry>>;
}
