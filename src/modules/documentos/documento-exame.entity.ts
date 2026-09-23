import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Exame } from '../exames/exame.entity';
import { Documento } from './documento.entity';

// Vínculo entre documento e exame (N:N).
@Entity('documentos_exames')
export class DocumentoExame {
  @PrimaryColumn({ name: 'documento_id', type: 'integer' })
  documentoId: number;

  @PrimaryColumn({ name: 'accession_number', type: 'varchar', length: 64 })
  accessionNumber: string;

  @CreateDateColumn({ name: 'vinculado_em', type: 'timestamptz' })
  vinculadoEm: Date;

  @ManyToOne(() => Documento, (documento) => documento.vinculos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'documento_id' })
  documento: Documento;

  @ManyToOne(() => Exame, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'accession_number' })
  exame: Exame;
}
