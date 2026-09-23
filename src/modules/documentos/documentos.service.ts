import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { DataSource, EntityManager } from 'typeorm';
import { RecursoDuplicadoError } from '../../common/errors/domain.errors';
import { IntegracaoService } from '../integracao/integracao.service';
import { CriarDocumentoDto } from './dto/criar-documento.dto';
import { Documento } from './documento.entity';

@Injectable()
export class DocumentosService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly integracao: IntegracaoService,
    @InjectPinoLogger(DocumentosService.name)
    private readonly logger: PinoLogger,
  ) {}

  async receber(dto: CriarDocumentoDto): Promise<Documento> {
    const documento = await this.dataSource.transaction(async (manager) => {
      await this.integracao.bloquearPedido(manager, dto.CodigoPedido);

      // ON CONFLICT DO NOTHING: a unicidade é garantida pela constraint
      // (codigo_documento, codigo_pedido), sem depender de SELECT prévio.
      const insercao = await manager
        .createQueryBuilder()
        .insert()
        .into(Documento)
        .values({
          codigoDocumento: dto.CodigoDocumento,
          codigoPedido: dto.CodigoPedido,
          nomeDocumento: dto.NomeDocumento,
          conteudo: dto.Documento,
        })
        .orIgnore()
        .returning(['id'])
        .execute();

      const [inserido] = insercao.raw as { id: number }[];
      if (!inserido) {
        throw new RecursoDuplicadoError(
          `Documento ${dto.CodigoDocumento} já recebido para o pedido ${dto.CodigoPedido}`,
        );
      }

      // Se o pedido ainda não existe ou não está integrado, o documento
      // fica pendente e é vinculado quando o exame chegar.
      await this.integracao.reconciliarPedido(manager, dto.CodigoPedido);

      return this.carregarPorId(manager, inserido.id);
    });

    this.logger.info(
      {
        codigoDocumento: documento.codigoDocumento,
        codigoPedido: documento.codigoPedido,
        integrado: documento.integrado,
        examesVinculados: documento.vinculos.length,
      },
      'Documento recebido',
    );
    return documento;
  }

  async listarPorPedido(
    codigoPedido: number,
    incluirConteudo = false,
  ): Promise<Documento[]> {
    const query = this.dataSource.manager
      .createQueryBuilder(Documento, 'documento')
      .leftJoinAndSelect('documento.vinculos', 'vinculo')
      .where('documento.codigoPedido = :codigoPedido', { codigoPedido })
      .orderBy('documento.codigoDocumento', 'ASC');

    if (incluirConteudo) {
      query.addSelect('documento.conteudo');
    }
    return query.getMany();
  }

  private async carregarPorId(
    manager: EntityManager,
    id: number,
  ): Promise<Documento> {
    return manager.findOneOrFail(Documento, {
      where: { id },
      relations: { vinculos: true },
    });
  }
}
