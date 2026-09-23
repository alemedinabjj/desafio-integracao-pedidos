import { Module } from '@nestjs/common';
import { IntegracaoModule } from '../integracao/integracao.module';
import { PedidosController } from './pedidos.controller';
import { PedidosService } from './pedidos.service';

@Module({
  imports: [IntegracaoModule],
  controllers: [PedidosController],
  providers: [PedidosService],
})
export class PedidosModule {}
