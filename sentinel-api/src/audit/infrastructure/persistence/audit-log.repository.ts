import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditEntry } from '../../domain/entities/audit-entry.entity';
import { AuditRepositoryPort } from '../../domain/ports/audit.repository.port';
import { PaginatedResult } from '../../../shared/application/pagination.dto';
import { AuditLogMapper } from './audit-log.mapper';
import { AuditLogOrmEntity } from './audit-log.orm-entity';

@Injectable()
export class AuditLogTypeOrmRepository implements AuditRepositoryPort {
  constructor(
    @InjectRepository(AuditLogOrmEntity)
    private readonly repo: Repository<AuditLogOrmEntity>,
  ) {}

  async save(entry: AuditEntry): Promise<AuditEntry> {
    const orm = AuditLogMapper.toOrm(entry);
    const saved = await this.repo.save(orm);
    return AuditLogMapper.toDomain(saved);
  }

  async findByAggregateId(
    aggregateId: string,
    skip: number,
    take: number,
  ): Promise<PaginatedResult<AuditEntry>> {
    const [rows, total] = await this.repo.findAndCount({
      where: { aggregateId },
      order: { createdAt: 'DESC' },
      skip,
      take,
    });
    return {
      items: rows.map(AuditLogMapper.toDomain),
      total,
      page: Math.floor(skip / take) + 1,
      pageSize: take,
    };
  }

  async findAll(skip: number, take: number): Promise<PaginatedResult<AuditEntry>> {
    const [rows, total] = await this.repo.findAndCount({
      order: { createdAt: 'DESC' },
      skip,
      take,
    });
    return {
      items: rows.map(AuditLogMapper.toDomain),
      total,
      page: Math.floor(skip / take) + 1,
      pageSize: take,
    };
  }
}
