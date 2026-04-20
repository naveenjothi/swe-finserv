import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const buildTypeOrmOptions = (config: ConfigService): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: config.get<string>('DB_HOST', 'localhost'),
  port: config.get<number>('DB_PORT', 5432),
  username: config.get<string>('DB_USERNAME', 'sentinel'),
  password: config.get<string>('DB_PASSWORD', 'sentinel'),
  database: config.get<string>('DB_NAME', 'sentinel'),
  autoLoadEntities: true,
  synchronize: false,
  logging: config.get<string>('DB_LOGGING') === 'true',
});
