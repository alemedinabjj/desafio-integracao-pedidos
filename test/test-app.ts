import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';

export interface TestApp {
  app: NestExpressApplication;
  limparBanco: () => Promise<void>;
  encerrar: () => Promise<void>;
}

// Sobe a aplicação completa apontando para o Postgres do global-setup.
export async function criarTestApp(): Promise<TestApp> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>({
    bodyParser: false,
  });
  configureApp(app);
  await app.init();

  const dataSource = app.get(DataSource);

  return {
    app,
    limparBanco: async () => {
      await dataSource.query(
        'TRUNCATE documentos_exames, documentos, itens_pedido, pedidos, exames RESTART IDENTITY CASCADE',
      );
    },
    encerrar: () => app.close(),
  };
}
