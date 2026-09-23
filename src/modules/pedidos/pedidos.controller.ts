import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Res,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { CriarPedidoDto } from './dto/criar-pedido.dto';
import { PedidoResponse } from './dto/pedido.response';
import { PedidosService } from './pedidos.service';

@ApiTags('Pedidos')
@Controller('pedidos')
export class PedidosController {
  constructor(private readonly pedidosService: PedidosService) {}

  @Post()
  @ApiOperation({
    summary: 'Recebe um pedido de exame',
    description:
      'Cria o pedido ou, se o CodigoPedido já existir, adiciona apenas os exames novos ' +
      '(identificados por CodigoItemPedido). O pedido fica integrado quando algum exame ' +
      'dele já chegou (mesmo AccessionNumber).',
  })
  @ApiCreatedResponse({ type: PedidoResponse, description: 'Pedido criado' })
  @ApiOkResponse({
    type: PedidoResponse,
    description: 'Pedido já existia e foi atualizado',
  })
  @ApiBadRequestResponse({ description: 'Payload inválido' })
  async receber(
    @Body() dto: CriarPedidoDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<PedidoResponse> {
    const { pedido, criado } = await this.pedidosService.receber(dto);
    res.status(criado ? HttpStatus.CREATED : HttpStatus.OK);
    return PedidoResponse.from(pedido);
  }

  @Get(':codigoPedido')
  @ApiOperation({ summary: 'Consulta um pedido e seus exames' })
  @ApiOkResponse({ type: PedidoResponse })
  @ApiNotFoundResponse({ description: 'Pedido não encontrado' })
  async buscar(
    @Param('codigoPedido', ParseIntPipe) codigoPedido: number,
  ): Promise<PedidoResponse> {
    return PedidoResponse.from(await this.pedidosService.buscar(codigoPedido));
  }
}
