// Usado apenas pela CLI do TypeORM (migration:generate / migration:run).
import { DataSource } from 'typeorm';
import { buildTypeOrmOptions } from './typeorm.options';

export default new DataSource(
  buildTypeOrmOptions(
    process.env.DATABASE_URL ??
      'postgres://postgres:postgres@localhost:5432/pedidos',
  ),
);
