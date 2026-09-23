export interface Env {
  PORT: number;
  DATABASE_URL: string;
  LOG_LEVEL: string;
  LOG_PRETTY: boolean;
  BODY_LIMIT: string;
}

// Valida as variáveis de ambiente na subida da aplicação.
export function validateEnv(raw: Record<string, unknown>): Env {
  const databaseUrl = raw.DATABASE_URL;
  if (typeof databaseUrl !== 'string' || databaseUrl.length === 0) {
    throw new Error('Variável de ambiente DATABASE_URL é obrigatória');
  }

  const port = Number(raw.PORT ?? 3000);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`PORT inválida: ${String(raw.PORT)}`);
  }

  return {
    PORT: port,
    DATABASE_URL: databaseUrl,
    LOG_LEVEL: typeof raw.LOG_LEVEL === 'string' ? raw.LOG_LEVEL : 'info',
    LOG_PRETTY: raw.LOG_PRETTY === 'true',
    BODY_LIMIT: typeof raw.BODY_LIMIT === 'string' ? raw.BODY_LIMIT : '10mb',
  };
}
