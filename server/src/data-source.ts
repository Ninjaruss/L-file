import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { validate } from './config/env.validation';
import { getDatabaseConfig } from './config/database.config';
import { ConfigService } from '@nestjs/config';

dotenv.config();
const validatedConfig = validate(process.env);
const configService = new ConfigService(validatedConfig);

export const AppDataSource = new DataSource({
  ...getDatabaseConfig(configService),
  type: 'postgres'
});
