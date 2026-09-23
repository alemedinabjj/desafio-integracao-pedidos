import { ApiProperty } from '@nestjs/swagger';
import {
  IsBase64,
  IsInt,
  IsNotEmpty,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class CriarDocumentoDto {
  @ApiProperty({ example: 251 })
  @IsInt()
  @IsPositive()
  CodigoDocumento: number;

  @ApiProperty({ example: 616 })
  @IsInt()
  @IsPositive()
  CodigoPedido: number;

  @ApiProperty({ example: 'PEDIDO' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  NomeDocumento: string;

  @ApiProperty({
    example: 'JVBERi0xLjQK',
    description: 'Conteúdo do arquivo em base64',
  })
  @IsNotEmpty()
  @IsBase64()
  Documento: string;
}
