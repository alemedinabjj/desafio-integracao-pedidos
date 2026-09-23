import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
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
import { CriarExameDto } from './dto/criar-exame.dto';
import { ExameResponse } from './dto/exame.response';
import { ExamesService } from './exames.service';

@ApiTags('Exames')
@Controller('exames')
export class ExamesController {
  constructor(private readonly examesService: ExamesService) {}

  @Post()
  @ApiOperation({
    summary: 'Simula a chegada de um exame',
    description:
      'Marca como integrados os pedidos que têm exame com o mesmo AccessionNumber e vincula ' +
      'a ele os documentos pendentes desses pedidos. Reenvio do mesmo AccessionNumber é idempotente.',
  })
  @ApiCreatedResponse({ type: ExameResponse, description: 'Exame registrado' })
  @ApiOkResponse({
    type: ExameResponse,
    description: 'Exame já existia (reprocessado)',
  })
  @ApiBadRequestResponse({ description: 'Payload inválido' })
  async receber(
    @Body() dto: CriarExameDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ExameResponse> {
    const { detalhe, criado } = await this.examesService.receber(dto);
    res.status(criado ? HttpStatus.CREATED : HttpStatus.OK);
    return ExameResponse.from(detalhe);
  }

  @Get(':accessionNumber')
  @ApiOperation({
    summary: 'Consulta um exame, pedidos e documentos vinculados',
  })
  @ApiOkResponse({ type: ExameResponse })
  @ApiNotFoundResponse({ description: 'Exame não encontrado' })
  async buscar(
    @Param('accessionNumber') accessionNumber: string,
  ): Promise<ExameResponse> {
    return ExameResponse.from(await this.examesService.buscar(accessionNumber));
  }
}
