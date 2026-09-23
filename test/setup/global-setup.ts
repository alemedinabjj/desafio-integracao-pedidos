import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';

declare global {
  var __POSTGRES_CONTAINER__: StartedPostgreSqlContainer | undefined;
}

// Sobe o Postgres antes dos testes. Precisa ser aqui porque o AppModule
// valida DATABASE_URL já no import.
export default async function globalSetup(): Promise<void> {
  const container = await new PostgreSqlContainer('postgres:17-alpine').start();
  globalThis.__POSTGRES_CONTAINER__ = container;
  process.env.DATABASE_URL = container.getConnectionUri();
  process.env.LOG_LEVEL = 'silent';
}
