import { ApiProperty } from '@nestjs/swagger';
import { Exame } from '../exame.entity';

export class DocumentoVinculadoResponse {
  @ApiProperty({ example: 251 }) CodigoDocumento: number;
  @ApiProperty({ example: 616 }) CodigoPedido: number;
  @ApiProperty({ example: 'PEDIDO' }) NomeDocumento: string;
}

export interface ExameDetalhado {
  exame: Exame;
  pedidosVinculados: number[];
  documentosVinculados: DocumentoVinculadoResponse[];
}

export class ExameResponse {
  @ApiProperty({ example: '930' }) AccessionNumber: string;
  @ApiProperty({ example: 'ALEFHER MONTONI DE ALMEIDA' }) NomePaciente: string;
  @ApiProperty({ example: 'CR' }) Modalidade: string;
  @ApiProperty({ example: 'NOVO' }) Status: string;
  @ApiProperty({ example: [616] }) PedidosVinculados: number[];
  @ApiProperty({ type: [DocumentoVinculadoResponse] })
  DocumentosVinculados: DocumentoVinculadoResponse[];
  @ApiProperty() CriadoEm: Date;

  static from({
    exame,
    pedidosVinculados,
    documentosVinculados,
  }: ExameDetalhado): ExameResponse {
    return {
      AccessionNumber: exame.accessionNumber,
      NomePaciente: exame.nomePaciente,
      Modalidade: exame.modalidade,
      Status: exame.status,
      PedidosVinculados: pedidosVinculados,
      DocumentosVinculados: documentosVinculados,
      CriadoEm: exame.criadoEm,
    };
  }
}
