import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { buildTypeOrmOptions } from './shared/infrastructure/typeorm/typeorm.config';
import { RiskClassificationModule } from './risk-classification/risk-classification.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { AuditModule } from './audit/audit.module';
import { KycModule } from './kyc/kyc.module';
import { OutboxModule } from './shared/infrastructure/outbox/outbox.module';
import { MockAuthMiddleware } from './shared/infrastructure/guards/mock-auth.middleware';
import { AdminController } from './shared/infrastructure/http/admin.controller';
import { BackfillAuditEddService } from './shared/infrastructure/migrations/backfill-audit-edd.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env'] }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: buildTypeOrmOptions,
    }),
    CqrsModule,
    RiskClassificationModule,
    OnboardingModule,
    AuditModule,
    KycModule,
    OutboxModule,
  ],
  controllers: [AdminController],
  providers: [BackfillAuditEddService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(MockAuthMiddleware).forRoutes('*');
  }
}
