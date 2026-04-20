import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OutboxOrmEntity } from './outbox.orm-entity';
import { OutboxService } from './outbox.service';
import { OutboxPoller } from './outbox.poller';

@Module({
  imports: [TypeOrmModule.forFeature([OutboxOrmEntity])],
  providers: [OutboxService, OutboxPoller],
  exports: [OutboxService],
})
export class OutboxModule {}
