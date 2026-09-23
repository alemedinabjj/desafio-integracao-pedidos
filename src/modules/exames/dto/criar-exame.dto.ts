import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CriarExameDto {
  @ApiProperty({ example: '930' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  AccessionNumber: string;

  @ApiProperty({ example: 'ALEFHER MONTONI DE ALMEIDA' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  NomePaciente: string;

  @ApiProperty({ example: 'CR' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(16)
  Modalidade: string;

  @ApiPropertyOptional({ example: 'NOVO', default: 'NOVO' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  Status?: string;
}
