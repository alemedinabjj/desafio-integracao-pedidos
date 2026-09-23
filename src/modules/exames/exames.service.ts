import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { DataSource, EntityManager } from 'typeorm';
import { RecursoNaoEncontradoError } from '../../common/errors/domain.errors';
import { DocumentoExame } from '../documentos/documento-exame.entity';
import { IntegracaoService } from '../integracao/integracao.service';
import { ItemPedido } from '../pedidos/item-pedido.entity';
import { CriarExameDto } from './dto/criar-exame.dto';
import { ExameDetalhado } from './dto/exame.response';
import { Exame } from './exame.entity';

export const STATUS_PADRAO = 'NOVO';

export interface ResultadoRecebimentoExame {
  detalhe: ExameDetalhado;
  criado: boolean;
}

@Injectable()
export class ExamesService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly integracao: IntegracaoService,
    @InjectPinoLogger(ExamesService.name)
    private readonly logger: PinoLogger,
  ) {}

  async receber(dto: CriarExameDto): Promise<ResultadoRecebimentoExame> {
    const resultado = await this.dataSource.transaction(async (manager) => {
      // Metadados de exame (DICOM) são tratados como fixos: um reenvio do
      // mesmo AccessionNumber não sobrescreve o que já chegou, mas ainda
      // dispara a reconciliação (útil para reprocessar um evento).
      const insercao = await manager
        .createQueryBuilder()
        .insert()
        .into(Exame)
        .values({
          accessionNumber: dto.AccessionNumber,
          nomePaciente: dto.NomePaciente,
          modalidade: dto.Modalidade,
          status: dto.Status ?? STATUS_PADRAO,
        })
        .orIgnore()
        .returning(['accessionNumber'])
        .execute();
      const criado = (insercao.raw as unknown[]).length > 0;

      const codigosPedido = await this.pedidosDoAccession(
        manager,
        dto.AccessionNumber,
      );
      // Ordem determinística de locks evita deadlock entre transações.
      for (const codigoPedido of codigosPedido) {
        await this.integracao.bloquearPedido(manager, codigoPedido);
        await this.integracao.reconciliarPedido(manager, codigoPedido);
      }

      return {
        criado,
        detalhe: await this.detalhar(manager, dto.AccessionNumber),
      };
    });

    this.logger.info(
      {
        accessionNumber: dto.AccessionNumber,
        criado: resultado.criado,
        pedidosVinculados: resultado.detalhe.pedidosVinculados,
        documentosVinculados: resultado.detalhe.documentosVinculados.length,
      },
      resultado.detalhe.pedidosVinculados.length > 0
        ? 'Exame recebido e integrado'
        : 'Exame recebido sem pedido correspondente',
    );
    return resultado;
  }

  async buscar(accessionNumber: string): Promise<ExameDetalhado> {
    return this.detalhar(this.dataSource.manager, accessionNumber);
  }

  private async detalhar(
    manager: EntityManager,
    accessionNumber: string,
  ): Promise<ExameDetalhado> {
    const exame = await manager.findOneBy(Exame, { accessionNumber });
    if (!exame) {
      throw new RecursoNaoEncontradoError(
        `Exame ${accessionNumber} não encontrado`,
      );
    }

    const vinculos = await manager.find(DocumentoExame, {
      where: { accessionNumber },
      relations: { documento: true },
      order: { documento: { codigoPedido: 'ASC', codigoDocumento: 'ASC' } },
    });

    return {
      exame,
      pedidosVinculados: await this.pedidosDoAccession(
        manager,
        accessionNumber,
      ),
      documentosVinculados: vinculos.map(({ documento }) => ({
        CodigoDocumento: documento.codigoDocumento,
        CodigoPedido: documento.codigoPedido,
        NomeDocumento: documento.nomeDocumento,
      })),
    };
  }

  private async pedidosDoAccession(
    manager: EntityManager,
    accessionNumber: string,
  ): Promise<number[]> {
    const linhas = await manager
      .createQueryBuilder(ItemPedido, 'item')
      .select('DISTINCT item.codigoPedido', 'codigoPedido')
      .where('item.accessionNumber = :accessionNumber', { accessionNumber })
      .orderBy('"codigoPedido"', 'ASC')
      .getRawMany<{ codigoPedido: number }>();
    return linhas.map((l) => l.codigoPedido);
  }
}
