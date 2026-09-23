import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsPositive,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export const SEXOS = ['M', 'F', 'O', 'I'] as const;

export class ExameDoPedidoDto {
  @ApiProperty({ example: 930 })
  @IsInt()
  @IsPositive()
  CodigoItemPedido: number;

  @ApiProperty({ example: '930' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  AccessionNumber: string;

  @ApiProperty({
    example: 'CR',
    description: 'Modalidade DICOM (CR, CT, MR...)',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(16)
  Modalidade: string;

  @ApiProperty({ example: 'RX ANTEBRACO ESQUERDO' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  NomeProcedimento: string;
}

export class CriarPedidoDto {
  @ApiProperty({ example: 616 })
  @IsInt()
  @IsPositive()
  CodigoPedido: number;

  @ApiProperty({ example: 'ALEFHER MONTONI DE ALMEIDA' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  NomePaciente: string;

  @ApiProperty({ example: '19970601', description: 'Formato YYYYMMDD' })
  @Matches(/^\d{4}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])$/, {
    message: 'DataNascimento deve estar no formato YYYYMMDD',
  })
  DataNascimento: string;

  @ApiProperty({ example: 'M', enum: SEXOS })
  @IsIn(SEXOS)
  Sexo: (typeof SEXOS)[number];

  @ApiProperty({ example: 104 })
  @IsInt()
  @IsPositive()
  CodUnidade: number;

  @ApiProperty({ type: [ExameDoPedidoDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique((e: ExameDoPedidoDto) => e.CodigoItemPedido, {
    message: 'Exames não pode conter CodigoItemPedido repetido',
  })
  @ValidateNested({ each: true })
  @Type(() => ExameDoPedidoDto)
  Exames: ExameDoPedidoDto[];
}
