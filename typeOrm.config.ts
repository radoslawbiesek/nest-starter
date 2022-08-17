import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';

import { User } from './src/users/entities/user.entity';
import { Log } from './src/logs/entities/log.entity';

import { CreateUser1659474688629 } from './migrations/1659474688629-CreateUser';
import { CreateLog1660765996392 } from './migrations/1660765996392-CreateLog';

config();

const configService = new ConfigService();

export default new DataSource({
  type: 'postgres',
  host: configService.get('DATABASE_HOST'),
  port: configService.get('DATABASE_PORT'),
  username: configService.get('DATABASE_USER'),
  password: configService.get('DATABASE_PASSWORD'),
  database: configService.get('DATABASE_NAME'),
  entities: [User, Log],
  migrations: [CreateUser1659474688629, CreateLog1660765996392],
});
