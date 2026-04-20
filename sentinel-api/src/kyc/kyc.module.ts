import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { KycCaseOrmEntity } from './infrastructure/persistence/kyc-case.orm-entity';
import { KycCaseTypeOrmRepository } from './infrastructure/persistence/kyc-case.repository';
import { KYC_CASE_REPOSITORY } from './domain/ports/kyc-case.repository.port';
import { OpenKycCaseHandler } from './application/commands/open-kyc-case.handler';
import { TransitionKycHandler } from './application/commands/transition-kyc.handler';
import {
  GetKycCasesHandler,
  GetKycCaseByIdHandler,
} from './application/queries/get-kyc-cases.handler';
import { KycAuditHandler } from './application/event-handlers/kyc-audit.handler';
import { KycController } from './infrastructure/http/kyc.controller';

const commandHandlers = [OpenKycCaseHandler, TransitionKycHandler];
const queryHandlers = [GetKycCasesHandler, GetKycCaseByIdHandler];
const eventHandlers = [KycAuditHandler];

@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature([KycCaseOrmEntity]), AuditModule],
  controllers: [KycController],
  providers: [
    { provide: KYC_CASE_REPOSITORY, useClass: KycCaseTypeOrmRepository },
    ...commandHandlers,
    ...queryHandlers,
    ...eventHandlers,
  ],
})
export class KycModule {}
