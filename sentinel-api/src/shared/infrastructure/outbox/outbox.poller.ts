import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { OutboxService } from './outbox.service';

@Injectable()
export class OutboxPoller implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxPoller.name);
  private intervalRef: ReturnType<typeof setInterval> | null = null;
  private readonly pollIntervalMs = 5_000;

  constructor(private readonly outbox: OutboxService) {}

  onModuleInit(): void {
    this.logger.log(`Outbox poller started (every ${this.pollIntervalMs}ms)`);
    this.intervalRef = setInterval(() => void this.poll(), this.pollIntervalMs);
  }

  onModuleDestroy(): void {
    if (this.intervalRef) {
      clearInterval(this.intervalRef);
      this.intervalRef = null;
    }
    this.logger.log('Outbox poller stopped');
  }

  private async poll(): Promise<void> {
    const pending = await this.outbox.fetchPending(50);
    if (pending.length === 0) return;

    this.logger.debug(`Outbox: processing ${pending.length} pending messages`);

    for (const entry of pending) {
      try {
        // In a production system, this would publish to RabbitMQ/Kafka.
        // For now we just mark as published (message bus integration point).
        this.logger.debug(
          `Outbox: publishing ${entry.eventType} for aggregate ${entry.aggregateId}`,
        );
        await this.outbox.markPublished(entry.id);
      } catch (err) {
        this.logger.error(
          `Outbox: failed to publish ${entry.id}: ${err instanceof Error ? err.message : String(err)}`,
        );
        await this.outbox.markFailed(entry.id, entry.retries + 1);
      }
    }
  }
}
