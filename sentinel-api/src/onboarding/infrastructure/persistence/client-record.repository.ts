import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientRecord } from '../../domain/entities/client-record.entity';
import { ClientRecordRepositoryPort } from '../../domain/ports/client-record.repository.port';
import { PaginatedResult } from '../../../shared/application/pagination.dto';
import { ClientRecordMapper } from './client-record.mapper';
import { ClientRecordOrmEntity } from './client-record.orm-entity';

@Injectable()
export class ClientRecordTypeOrmRepository implements ClientRecordRepositoryPort {
  constructor(
    @InjectRepository(ClientRecordOrmEntity)
    private readonly repo: Repository<ClientRecordOrmEntity>,
  ) {}

  async save(entity: ClientRecord): Promise<ClientRecord> {
    const orm = ClientRecordMapper.toOrm(entity);
    const saved = await this.repo.save(orm);
    return ClientRecordMapper.toDomain(saved);
  }

  async saveBatch(entities: ClientRecord[]): Promise<ClientRecord[]> {
    const orms = entities.map(ClientRecordMapper.toOrm);
    const saved = await this.repo.save(orms);
    return saved.map(ClientRecordMapper.toDomain);
  }

  async findById(id: string): Promise<ClientRecord | null> {
    const row = await this.repo.findOne({ where: { id } });
    return row ? ClientRecordMapper.toDomain(row) : null;
  }

  async findAll(skip: number, take: number): Promise<PaginatedResult<ClientRecord>> {
    const [rows, total] = await this.repo.findAndCount({
      order: { createdAt: 'DESC' },
      skip,
      take,
    });
    return {
      items: rows.map(ClientRecordMapper.toDomain),
      total,
      page: Math.floor(skip / take) + 1,
      pageSize: take,
    };
  }
}
