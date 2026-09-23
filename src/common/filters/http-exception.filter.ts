import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { PinoLogger } from 'nestjs-pino';
import { QueryFailedError } from 'typeorm';
import {
  DomainError,
  RecursoDuplicadoError,
  RecursoNaoEncontradoError,
} from '../errors/domain.errors';

const PG_UNIQUE_VIOLATION = '23505';

interface ErrorBody {
  statusCode: number;
  error: string;
  message: string | string[];
  path: string;
  timestamp: string;
}

// Padroniza o corpo de erro da API. Erro não mapeado vira 500 (detalhe só no log).
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(AllExceptionsFilter.name);
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const { status, message } = this.resolve(exception);

    const body: ErrorBody = {
      statusCode: status,
      error: HttpStatus[status] ?? 'ERROR',
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    if (status >= 500) {
      this.logger.error(
        { err: exception, path: request.url },
        'Erro não tratado',
      );
    } else {
      this.logger.warn(
        { status, message, path: request.url },
        'Requisição rejeitada',
      );
    }

    response.status(status).json(body);
  }

  private resolve(exception: unknown): {
    status: number;
    message: string | string[];
  } {
    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      const message =
        typeof res === 'object' && res !== null && 'message' in res
          ? (res as { message: string | string[] }).message
          : exception.message;
      return { status: exception.getStatus(), message };
    }

    if (exception instanceof DomainError) {
      if (exception instanceof RecursoNaoEncontradoError) {
        return { status: HttpStatus.NOT_FOUND, message: exception.message };
      }
      if (exception instanceof RecursoDuplicadoError) {
        return { status: HttpStatus.CONFLICT, message: exception.message };
      }
      return {
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        message: exception.message,
      };
    }

    // Se algum insert bater numa constraint unique, responde 409 em vez de 500.
    if (
      exception instanceof QueryFailedError &&
      (exception.driverError as { code?: string } | undefined)?.code ===
        PG_UNIQUE_VIOLATION
    ) {
      return { status: HttpStatus.CONFLICT, message: 'Registro duplicado' };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Erro interno inesperado',
    };
  }
}
