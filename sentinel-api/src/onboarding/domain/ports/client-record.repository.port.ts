import { ClientRecord } from '../entities/client-record.entity';
import { PaginatedResult } from '../../../shared/application/pagination.dto';

export const CLIENT_RECORD_REPOSITORY = Symbol('CLIENT_RECORD_REPOSITORY');

export interface ClientRecordRepositoryPort {
  save(entity: ClientRecord): Promise<ClientRecord>;
  saveBatch(entities: ClientRecord[]): Promise<ClientRecord[]>;
  findById(id: string): Promise<ClientRecord | null>;
  findAll(skip: number, take: number): Promise<PaginatedResult<ClientRecord>>;
}
