import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Pedido } from './pedido.entity';

/**
 * Exame solicitado dentro de um pedido (o "Exames[]" do payload).
 * Não confundir com a entidade Exame, que representa o exame que de fato
 * chegou (ex.: estudo DICOM). A correlação entre os dois é o AccessionNumber.
 */
@Entity('itens_pedido')
@Unique('uq_item_pedido', ['codigoPedido', 'codigoItemPedido'])
export class ItemPedido {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'codigo_pedido', type: 'integer' })
  codigoPedido: number;

  @Column({ name: 'codigo_item_pedido', type: 'integer' })
  codigoItemPedido: number;

  @Index('idx_itens_pedido_accession_number')
  @Column({ name: 'accession_number', type: 'varchar', length: 64 })
  accessionNumber: string;

  @Column({ type: 'varchar', length: 16 })
  modalidade: string;

  @Column({ name: 'nome_procedimento', type: 'varchar', length: 200 })
  nomeProcedimento: string;

  /** true quando já existe um Exame com o mesmo AccessionNumber. */
  @Column({ type: 'boolean', default: false })
  integrado: boolean;

  @CreateDateColumn({ name: 'criado_em', type: 'timestamptz' })
  criadoEm: Date;

  @ManyToOne(() => Pedido, (pedido) => pedido.itens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'codigo_pedido' })
  pedido: Pedido;
}
