import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { Env } from './config/env';

/** Configuração compartilhada entre main.ts e testes e2e. */
export function configureApp(app: NestExpressApplication): INestApplication {
  const config = app.get<ConfigService<Env, true>>(ConfigService);

  app.useLogger(app.get(Logger));
  // Documentos chegam em base64: o limite padrão do Express (100kb) é baixo.
  app.useBodyParser('json', {
    limit: config.get('BODY_LIMIT', { infer: true }),
  });
  app.enableShutdownHooks();

  const swagger = new DocumentBuilder()
    .setTitle('Integração de Pedidos e Documentos')
    .setDescription(
      'Recebe pedidos, documentos e eventos de chegada de exame e os correlaciona pelo AccessionNumber.',
    )
    .setVersion('1.0.0')
    .build();
  SwaggerModule.setup('docs', app, () =>
    SwaggerModule.createDocument(app, swagger),
  );

  return app;
}
