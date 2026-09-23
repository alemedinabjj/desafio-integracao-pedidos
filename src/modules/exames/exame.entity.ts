import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

/** Exame que efetivamente chegou (simula a chegada do estudo DICOM). */
@Entity('exames')
export class Exame {
  @PrimaryColumn({ name: 'accession_number', type: 'varchar', length: 64 })
  accessionNumber: string;

  @Column({ name: 'nome_paciente', type: 'varchar', length: 200 })
  nomePaciente: string;

  @Column({ type: 'varchar', length: 16 })
  modalidade: string;

  @Column({ type: 'varchar', length: 32 })
  status: string;

  @CreateDateColumn({ name: 'criado_em', type: 'timestamptz' })
  criadoEm: Date;
}
