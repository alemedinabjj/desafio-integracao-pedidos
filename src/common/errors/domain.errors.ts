// Erros de negócio, sem relação com HTTP. O AllExceptionsFilter converte para o status.
export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class RecursoNaoEncontradoError extends DomainError {}

export class RecursoDuplicadoError extends DomainError {}
