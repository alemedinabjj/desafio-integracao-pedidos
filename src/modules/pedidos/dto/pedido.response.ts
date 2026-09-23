import { ApiProperty } from '@nestjs/swagger';
import { ItemPedido } from '../item-pedido.entity';
import { Pedido } from '../pedido.entity';

export class ItemPedidoResponse {
  @ApiProperty({ example: 930 }) CodigoItemPedido: number;
  @ApiProperty({ example: '930' }) AccessionNumber: string;
  @ApiProperty({ example: 'CR' }) Modalidade: string;
  @ApiProperty({ example: 'RX ANTEBRACO ESQUERDO' }) NomeProcedimento: string;
  @ApiProperty({ example: false }) Integrado: boolean;

  static from(item: ItemPedido): ItemPedidoResponse {
    return {
      CodigoItemPedido: item.codigoItemPedido,
      AccessionNumber: item.accessionNumber,
      Modalidade: item.modalidade,
      NomeProcedimento: item.nomeProcedimento,
      Integrado: item.integrado,
    };
  }
}

export class PedidoResponse {
  @ApiProperty({ example: 616 }) CodigoPedido: number;
  @ApiProperty({ example: 'ALEFHER MONTONI DE ALMEIDA' }) NomePaciente: string;
  @ApiProperty({ example: '19970601' }) DataNascimento: string;
  @ApiProperty({ example: 'M' }) Sexo: string;
  @ApiProperty({ example: 104 }) CodUnidade: number;
  @ApiProperty({ example: false }) Integrado: boolean;
  @ApiProperty({ type: [ItemPedidoResponse] }) Exames: ItemPedidoResponse[];
  @ApiProperty() CriadoEm: Date;
  @ApiProperty() AtualizadoEm: Date;

  static from(pedido: Pedido): PedidoResponse {
    return {
      CodigoPedido: pedido.codigoPedido,
      NomePaciente: pedido.nomePaciente,
      DataNascimento: pedido.dataNascimento,
      Sexo: pedido.sexo,
      CodUnidade: pedido.codUnidade,
      Integrado: pedido.integrado,
      Exames: [...pedido.itens]
        .sort((a, b) => a.codigoItemPedido - b.codigoItemPedido)
        .map((i) => ItemPedidoResponse.from(i)),
      CriadoEm: pedido.criadoEm,
      AtualizadoEm: pedido.atualizadoEm,
    };
  }
}
