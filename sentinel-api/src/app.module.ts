import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { buildTypeOrmOptions } from './shared/infrastructure/typeorm/typeorm.config';
import { RiskClassificationModule } from './risk-classification/risk-classification.module';
import { OnboardingModule } from './onboarding/onboarding.module';

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
  ],
})
export class AppModule {}
