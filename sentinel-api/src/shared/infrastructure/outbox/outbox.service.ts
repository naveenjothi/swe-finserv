import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OutboxOrmEntity, OutboxStatus } from './outbox.orm-entity';
import { DomainEvent } from '../../domain/domain-event';

@Injectable()
export class OutboxService {
  private readonly logger = new Logger(OutboxService.name);

  constructor(
    @InjectRepository(OutboxOrmEntity)
    private readonly repo: Repository<OutboxOrmEntity>,
  ) {}

  async store(event: DomainEvent, payload: Record<string, unknown>): Promise<void> {
    const entry = new OutboxOrmEntity();
    entry.eventType = event.eventType;
    entry.aggregateId = event.aggregateId;
    entry.payload = payload;
    entry.status = OutboxStatus.PENDING;
    entry.retries = 0;
    entry.publishedAt = null;
    await this.repo.save(entry);
  }

  async fetchPending(batchSize = 50): Promise<OutboxOrmEntity[]> {
    return this.repo.find({
      where: { status: OutboxStatus.PENDING },
      order: { createdAt: 'ASC' },
      take: batchSize,
    });
  }

  async markPublished(id: string): Promise<void> {
    await this.repo.update(id, {
      status: OutboxStatus.PUBLISHED,
      publishedAt: new Date(),
    });
  }

  async markFailed(id: string, retries: number): Promise<void> {
    const status = retries >= 5 ? OutboxStatus.FAILED : OutboxStatus.PENDING;
    await this.repo.update(id, { status, retries });
  }
}
