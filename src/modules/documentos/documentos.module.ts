import { Module } from '@nestjs/common';
import { IntegracaoModule } from '../integracao/integracao.module';
import { DocumentosController } from './documentos.controller';
import { DocumentosService } from './documentos.service';

@Module({
  imports: [IntegracaoModule],
  controllers: [DocumentosController],
  providers: [DocumentosService],
})
export class DocumentosModule {}
