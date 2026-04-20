import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RiskClassificationModule } from '../risk-classification/risk-classification.module';
import { ClientRecordOrmEntity } from './infrastructure/persistence/client-record.orm-entity';
import { ClientRecordTypeOrmRepository } from './infrastructure/persistence/client-record.repository';
import { CLIENT_RECORD_REPOSITORY } from './domain/ports/client-record.repository.port';
import { SubmitOnboardingHandler } from './application/commands/submit-onboarding.handler';
import { ImportCsvHandler } from './application/commands/import-csv.handler';
import { GetClientsHandler } from './application/queries/get-clients.handler';
import { GetClientByIdHandler } from './application/queries/get-client-by-id.handler';
import { OnboardingController } from './infrastructure/http/onboarding.controller';

const commandHandlers = [SubmitOnboardingHandler, ImportCsvHandler];
const queryHandlers = [GetClientsHandler, GetClientByIdHandler];

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([ClientRecordOrmEntity]),
    RiskClassificationModule,
  ],
  controllers: [OnboardingController],
  providers: [
    { provide: CLIENT_RECORD_REPOSITORY, useClass: ClientRecordTypeOrmRepository },
    ...commandHandlers,
    ...queryHandlers,
  ],
})
export class OnboardingModule {}
