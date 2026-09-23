import { Module } from '@nestjs/common';
import { IntegracaoService } from './integracao.service';

@Module({
  providers: [IntegracaoService],
  exports: [IntegracaoService],
})
export class IntegracaoModule {}
