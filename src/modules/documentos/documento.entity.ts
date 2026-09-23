import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { DocumentoExame } from './documento-exame.entity';

/**
 * Sem FK para pedidos de propósito: o documento pode chegar antes do pedido
 * e fica pendente até ser possível vinculá-lo.
 */
@Entity('documentos')
@Unique('uq_documento_pedido', ['codigoDocumento', 'codigoPedido'])
export class Documento {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'codigo_documento', type: 'integer' })
  codigoDocumento: number;

  @Index('idx_documentos_codigo_pedido')
  @Column({ name: 'codigo_pedido', type: 'integer' })
  codigoPedido: number;

  @Column({ name: 'nome_documento', type: 'varchar', length: 200 })
  nomeDocumento: string;

  /** Conteúdo em base64. Não carregado por padrão (pode ser grande). */
  @Column({ type: 'text', select: false })
  conteudo: string;

  @Column({ type: 'boolean', default: false })
  integrado: boolean;

  @OneToMany(() => DocumentoExame, (vinculo) => vinculo.documento)
  vinculos: DocumentoExame[];

  @CreateDateColumn({ name: 'criado_em', type: 'timestamptz' })
  criadoEm: Date;

  @UpdateDateColumn({ name: 'atualizado_em', type: 'timestamptz' })
  atualizadoEm: Date;
}
