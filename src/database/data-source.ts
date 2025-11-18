import { DataSource } from 'typeorm';
import { join } from 'path';
import { config } from 'dotenv';

config();

// use CommonJS global __dirname (avoid import.meta which is not allowed for CommonJS builds)
export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [join(__dirname, '/../**/*.entity.{ts,js}')],
  migrations: [join(__dirname, '/migrations/*.{ts,js}')],
  synchronize: false,
  logging: true,
});
