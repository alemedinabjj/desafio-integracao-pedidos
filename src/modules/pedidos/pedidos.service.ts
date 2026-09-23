import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { DataSource, EntityManager } from 'typeorm';
import { RecursoNaoEncontradoError } from '../../common/errors/domain.errors';
import { IntegracaoService } from '../integracao/integracao.service';
import { selecionarItensNovos } from '../integracao/integracao.rules';
import { CriarPedidoDto } from './dto/criar-pedido.dto';
import { ItemPedido } from './item-pedido.entity';
import { Pedido } from './pedido.entity';

export interface ResultadoRecebimentoPedido {
  pedido: Pedido;
  criado: boolean;
  examesAdicionados: number;
}

@Injectable()
export class PedidosService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly integracao: IntegracaoService,
    @InjectPinoLogger(PedidosService.name)
    private readonly logger: PinoLogger,
  ) {}

  async receber(dto: CriarPedidoDto): Promise<ResultadoRecebimentoPedido> {
    const resultado = await this.dataSource.transaction(async (manager) => {
      await this.integracao.bloquearPedido(manager, dto.CodigoPedido);

      const existente = await manager.findOne(Pedido, {
        where: { codigoPedido: dto.CodigoPedido },
        relations: { itens: true },
      });

      // Dados do cabeçalho (paciente, unidade) são mantidos da primeira
      // chegada: o enunciado só define a mesclagem dos exames.
      if (!existente) {
        await manager.insert(Pedido, {
          codigoPedido: dto.CodigoPedido,
          nomePaciente: dto.NomePaciente,
          dataNascimento: dto.DataNascimento,
          sexo: dto.Sexo,
          codUnidade: dto.CodUnidade,
        });
      }

      const novos = selecionarItensNovos(
        (existente?.itens ?? []).map((i) => i.codigoItemPedido),
        dto.Exames,
        (e) => e.CodigoItemPedido,
      );

      if (novos.length > 0) {
        await manager.insert(
          ItemPedido,
          novos.map((e) => ({
            codigoPedido: dto.CodigoPedido,
            codigoItemPedido: e.CodigoItemPedido,
            accessionNumber: e.AccessionNumber,
            modalidade: e.Modalidade,
            nomeProcedimento: e.NomeProcedimento,
          })),
        );
      }

      await this.integracao.reconciliarPedido(manager, dto.CodigoPedido);

      return {
        pedido: await this.carregar(manager, dto.CodigoPedido),
        criado: !existente,
        examesAdicionados: novos.length,
      };
    });

    this.logger.info(
      {
        codigoPedido: dto.CodigoPedido,
        criado: resultado.criado,
        examesRecebidos: dto.Exames.length,
        examesAdicionados: resultado.examesAdicionados,
        integrado: resultado.pedido.integrado,
      },
      'Pedido recebido',
    );
    return resultado;
  }

  async buscar(codigoPedido: number): Promise<Pedido> {
    return this.carregar(this.dataSource.manager, codigoPedido);
  }

  private async carregar(
    manager: EntityManager,
    codigoPedido: number,
  ): Promise<Pedido> {
    const pedido = await manager.findOne(Pedido, {
      where: { codigoPedido },
      relations: { itens: true },
    });
    if (!pedido) {
      throw new RecursoNaoEncontradoError(
        `Pedido ${codigoPedido} não encontrado`,
      );
    }
    return pedido;
  }
}
