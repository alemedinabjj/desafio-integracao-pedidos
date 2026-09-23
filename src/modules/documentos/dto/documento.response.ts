import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Documento } from '../documento.entity';

export class DocumentoResponse {
  @ApiProperty({ example: 251 }) CodigoDocumento: number;
  @ApiProperty({ example: 616 }) CodigoPedido: number;
  @ApiProperty({ example: 'PEDIDO' }) NomeDocumento: string;
  @ApiProperty({ example: true }) Integrado: boolean;
  @ApiProperty({
    example: ['930'],
    description: 'AccessionNumbers dos exames vinculados',
  })
  ExamesVinculados: string[];
  @ApiPropertyOptional({
    description: 'Base64; só retornado com incluirConteudo=true',
  })
  Documento?: string;
  @ApiProperty() CriadoEm: Date;

  static from(documento: Documento): DocumentoResponse {
    return {
      CodigoDocumento: documento.codigoDocumento,
      CodigoPedido: documento.codigoPedido,
      NomeDocumento: documento.nomeDocumento,
      Integrado: documento.integrado,
      ExamesVinculados: (documento.vinculos ?? [])
        .map((v) => v.accessionNumber)
        .sort(),
      ...(documento.conteudo !== undefined && {
        Documento: documento.conteudo,
      }),
      CriadoEm: documento.criadoEm,
    };
  }
}
