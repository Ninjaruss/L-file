import * as path from 'path';
import { ConfigService } from '@nestjs/config';

export const getDatabaseConfig = (configService: ConfigService) => ({
  type: 'postgres' as const,
  host: configService.get('DATABASE_HOST'),
  port: configService.get('DATABASE_PORT'),
  username: configService.get('DATABASE_USERNAME'),
  password: configService.get('DATABASE_PASSWORD'),
  database: configService.get('DATABASE_NAME'),
  entities: [
    path.join(__dirname, '..', 'entities', '**', '*.entity.{ts,js}'),
    path.join(__dirname, '..', 'entities', 'translations', '*.entity.{ts,js}')
  ],
  migrations: [path.join(__dirname, '..', 'migrations', '**', '*{.ts,.js}')],
  migrationsRun: false,
  synchronize: false,
  ssl: configService.get('NODE_ENV') === 'production',
});
