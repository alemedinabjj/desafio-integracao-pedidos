import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Params } from 'nestjs-pino';

const REQUEST_ID_HEADER = 'x-request-id';

// Logs em JSON. Cada requisição ganha um requestId (usa o x-request-id se vier no header).
export function buildLoggerConfig(options: {
  level: string;
  pretty: boolean;
}): Params {
  return {
    pinoHttp: {
      level: options.level,
      transport: options.pretty
        ? { target: 'pino-pretty', options: { singleLine: true } }
        : undefined,
      genReqId: (req: IncomingMessage, res: ServerResponse) => {
        const recebido = req.headers[REQUEST_ID_HEADER];
        const id =
          typeof recebido === 'string' && recebido ? recebido : randomUUID();
        res.setHeader(REQUEST_ID_HEADER, id);
        return id;
      },
      // Nunca logar o corpo: documentos trazem base64 e dados de paciente.
      serializers: {
        req: (req: { id: string; method: string; url: string }) => ({
          id: req.id,
          method: req.method,
          url: req.url,
        }),
        res: (res: { statusCode: number }) => ({ statusCode: res.statusCode }),
      },
      autoLogging: { ignore: (req) => req.url === '/health' },
    },
  };
}
