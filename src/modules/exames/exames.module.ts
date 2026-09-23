import { Module } from '@nestjs/common';
import { IntegracaoModule } from '../integracao/integracao.module';
import { ExamesController } from './exames.controller';
import { ExamesService } from './exames.service';

@Module({
  imports: [IntegracaoModule],
  controllers: [ExamesController],
  providers: [ExamesService],
})
export class ExamesModule {}
