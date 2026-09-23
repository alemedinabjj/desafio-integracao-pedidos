import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { EntityManager, In } from 'typeorm';
import { DocumentoExame } from '../documentos/documento-exame.entity';
import { Documento } from '../documentos/documento.entity';
import { Exame } from '../exames/exame.entity';
import { ItemPedido } from '../pedidos/item-pedido.entity';
import { Pedido } from '../pedidos/pedido.entity';
import { calcularIntegracao, montarVinculos } from './integracao.rules';

export interface ResultadoReconciliacao {
  codigoPedido: number;
  pedidoIntegrado: boolean;
  itensIntegrados: number;
  vinculosCriados: number;
}

/**
 * Pedido, documento e exame podem chegar em qualquer ordem. Cada endpoint grava
 * o seu dado e chama reconciliarPedido, que recalcula o estado a partir do banco.
 * Pode ser chamado mais de uma vez sem duplicar nada.
 */
@Injectable()
export class IntegracaoService {
  constructor(
    @InjectPinoLogger(IntegracaoService.name)
    private readonly logger: PinoLogger,
  ) {}

  // Lock por CodigoPedido até o fim da transação. Funciona mesmo se o pedido
  // ainda não existir (ex.: documento chegou antes).
  async bloquearPedido(
    manager: EntityManager,
    codigoPedido: number,
  ): Promise<void> {
    await manager.query('SELECT pg_advisory_xact_lock($1)', [codigoPedido]);
  }

  async reconciliarPedido(
    manager: EntityManager,
    codigoPedido: number,
  ): Promise<ResultadoReconciliacao | null> {
    const pedido = await manager.findOne(Pedido, {
      where: { codigoPedido },
      relations: { itens: true },
    });
    if (!pedido) {
      return null;
    }

    const accessionsDoPedido = [
      ...new Set(pedido.itens.map((i) => i.accessionNumber)),
    ];
    const examesChegados = await manager.find(Exame, {
      select: { accessionNumber: true },
      where: { accessionNumber: In(accessionsDoPedido) },
    });

    const resultado = calcularIntegracao(
      pedido.itens,
      new Set(examesChegados.map((e) => e.accessionNumber)),
    );

    if (resultado.idsItensAIntegrar.length > 0) {
      await manager.update(
        ItemPedido,
        { id: In(resultado.idsItensAIntegrar) },
        { integrado: true },
      );
    }

    if (resultado.pedidoIntegrado && !pedido.integrado) {
      await manager.update(Pedido, { codigoPedido }, { integrado: true });
    }

    const vinculosCriados = await this.vincularDocumentos(
      manager,
      codigoPedido,
      resultado.accessionsIntegrados,
    );

    const saida: ResultadoReconciliacao = {
      codigoPedido,
      pedidoIntegrado: resultado.pedidoIntegrado,
      itensIntegrados: resultado.idsItensAIntegrar.length,
      vinculosCriados,
    };
    this.logger.info(saida, 'Pedido reconciliado');
    return saida;
  }

  private async vincularDocumentos(
    manager: EntityManager,
    codigoPedido: number,
    accessionsIntegrados: string[],
  ): Promise<number> {
    if (accessionsIntegrados.length === 0) {
      return 0;
    }

    const documentos = await manager.find(Documento, {
      select: { id: true },
      where: { codigoPedido },
    });
    if (documentos.length === 0) {
      return 0;
    }

    const documentoIds = documentos.map((d) => d.id);
    const vinculos = montarVinculos(documentoIds, accessionsIntegrados);

    const insercao = await manager
      .createQueryBuilder()
      .insert()
      .into(DocumentoExame)
      .values(vinculos)
      .orIgnore()
      .returning(['documentoId'])
      .execute();

    await manager.update(
      Documento,
      { id: In(documentoIds), integrado: false },
      { integrado: true },
    );

    return (insercao.raw as unknown[]).length;
  }
}
