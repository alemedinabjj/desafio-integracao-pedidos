import {
  Body,
  Controller,
  Get,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CriarDocumentoDto } from './dto/criar-documento.dto';
import { DocumentoResponse } from './dto/documento.response';
import { DocumentosService } from './documentos.service';

@ApiTags('Documentos')
@Controller('documentos')
export class DocumentosController {
  constructor(private readonly documentosService: DocumentosService) {}

  @Post()
  @ApiOperation({
    summary: 'Recebe um documento vinculado a um pedido',
    description:
      'Se o pedido já estiver integrado, o documento é vinculado aos exames do pedido na hora. ' +
      'Caso contrário fica pendente até a chegada do exame.',
  })
  @ApiCreatedResponse({ type: DocumentoResponse })
  @ApiBadRequestResponse({ description: 'Payload inválido' })
  @ApiConflictResponse({
    description: 'Documento já recebido para este pedido',
  })
  async receber(@Body() dto: CriarDocumentoDto): Promise<DocumentoResponse> {
    return DocumentoResponse.from(await this.documentosService.receber(dto));
  }

  @Get(':codigoPedido')
  @ApiOperation({ summary: 'Lista os documentos de um pedido' })
  @ApiQuery({ name: 'incluirConteudo', required: false, type: Boolean })
  @ApiOkResponse({ type: [DocumentoResponse] })
  async listar(
    @Param('codigoPedido', ParseIntPipe) codigoPedido: number,
    @Query('incluirConteudo', new ParseBoolPipe({ optional: true }))
    incluirConteudo?: boolean,
  ): Promise<DocumentoResponse[]> {
    const documentos = await this.documentosService.listarPorPedido(
      codigoPedido,
      incluirConteudo ?? false,
    );
    return documentos.map((d) => DocumentoResponse.from(d));
  }
}
