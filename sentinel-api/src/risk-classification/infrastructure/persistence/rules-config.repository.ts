import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, LessThanOrEqual, MoreThan, Repository } from 'typeorm';
import { RuleSet } from '../../domain/entities/rule-set.entity';
import { RulesConfigRepositoryPort } from '../../domain/ports/rules-config.repository.port';
import { RulesConfigMapper } from './rules-config.mapper';
import { RulesConfigOrmEntity } from './rules-config.orm-entity';

@Injectable()
export class RulesConfigTypeOrmRepository implements RulesConfigRepositoryPort {
  constructor(
    @InjectRepository(RulesConfigOrmEntity)
    private readonly repo: Repository<RulesConfigOrmEntity>,
  ) {}

  async findActive(at: Date = new Date()): Promise<RuleSet | null> {
    const row = await this.repo.findOne({
      where: [
        { validFrom: LessThanOrEqual(at), validTo: IsNull() },
        { validFrom: LessThanOrEqual(at), validTo: MoreThan(at) },
      ],
      order: { validFrom: 'DESC' },
    });
    return row ? RulesConfigMapper.toDomain(row) : null;
  }

  async findByVersion(version: string): Promise<RuleSet | null> {
    const row = await this.repo.findOne({ where: { version } });
    return row ? RulesConfigMapper.toDomain(row) : null;
  }

  async findAll(): Promise<RuleSet[]> {
    const rows = await this.repo.find({ order: { validFrom: 'DESC' } });
    return rows.map(RulesConfigMapper.toDomain);
  }

  async save(ruleSet: RuleSet): Promise<RuleSet> {
    const orm = RulesConfigMapper.toOrm(ruleSet);
    const saved = await this.repo.save(orm);
    return RulesConfigMapper.toDomain(saved);
  }
}
