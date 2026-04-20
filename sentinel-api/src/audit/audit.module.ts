import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogOrmEntity } from './infrastructure/persistence/audit-log.orm-entity';
import { AuditLogTypeOrmRepository } from './infrastructure/persistence/audit-log.repository';
import { AUDIT_REPOSITORY } from './domain/ports/audit.repository.port';
import {
  OnboardingAuditHandler,
  MismatchAuditHandler,
  BulkReclassificationAuditHandler,
} from './application/event-handlers/audit-event.handlers';
import { GetAuditLogHandler } from './application/queries/get-audit-log.handler';
import { AuditController } from './infrastructure/http/audit.controller';

const eventHandlers = [
  OnboardingAuditHandler,
  MismatchAuditHandler,
  BulkReclassificationAuditHandler,
];
const queryHandlers = [GetAuditLogHandler];

@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature([AuditLogOrmEntity])],
  controllers: [AuditController],
  providers: [
    { provide: AUDIT_REPOSITORY, useClass: AuditLogTypeOrmRepository },
    ...eventHandlers,
    ...queryHandlers,
  ],
  exports: [AUDIT_REPOSITORY],
})
export class AuditModule {}
