import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KycCase } from '../../domain/entities/kyc-case.entity';
import { KycCaseRepositoryPort } from '../../domain/ports/kyc-case.repository.port';
import { PaginatedResult } from '../../../shared/application/pagination.dto';
import { KycCaseMapper } from './kyc-case.mapper';
import { KycCaseOrmEntity } from './kyc-case.orm-entity';

@Injectable()
export class KycCaseTypeOrmRepository implements KycCaseRepositoryPort {
  constructor(
    @InjectRepository(KycCaseOrmEntity)
    private readonly repo: Repository<KycCaseOrmEntity>,
  ) {}

  async save(entity: KycCase): Promise<KycCase> {
    const orm = KycCaseMapper.toOrm(entity);
    const saved = await this.repo.save(orm);
    return KycCaseMapper.toDomain(saved);
  }

  async findById(id: string): Promise<KycCase | null> {
    const row = await this.repo.findOne({ where: { id } });
    return row ? KycCaseMapper.toDomain(row) : null;
  }

  async findByClientRecordId(clientRecordId: string): Promise<KycCase | null> {
    const row = await this.repo.findOne({ where: { clientRecordId } });
    return row ? KycCaseMapper.toDomain(row) : null;
  }

  async findAll(skip: number, take: number): Promise<PaginatedResult<KycCase>> {
    const [rows, total] = await this.repo.findAndCount({
      order: { createdAt: 'DESC' },
      skip,
      take,
    });
    return {
      items: rows.map(KycCaseMapper.toDomain),
      total,
      page: Math.floor(skip / take) + 1,
      pageSize: take,
    };
  }
}
