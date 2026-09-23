import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ItemPedido } from './item-pedido.entity';

@Entity('pedidos')
export class Pedido {
  /** Chave vem do sistema de origem (HIS), por isso não é gerada aqui. */
  @PrimaryColumn({ name: 'codigo_pedido', type: 'integer' })
  codigoPedido: number;

  @Column({ name: 'nome_paciente', type: 'varchar', length: 200 })
  nomePaciente: string;

  /** Mantido no formato de origem (YYYYMMDD) para não perder fidelidade. */
  @Column({ name: 'data_nascimento', type: 'char', length: 8 })
  dataNascimento: string;

  @Column({ type: 'char', length: 1 })
  sexo: string;

  @Column({ name: 'cod_unidade', type: 'integer' })
  codUnidade: number;

  @Column({ type: 'boolean', default: false })
  integrado: boolean;

  @OneToMany(() => ItemPedido, (item) => item.pedido, { cascade: ['insert'] })
  itens: ItemPedido[];

  @CreateDateColumn({ name: 'criado_em', type: 'timestamptz' })
  criadoEm: Date;

  @UpdateDateColumn({ name: 'atualizado_em', type: 'timestamptz' })
  atualizadoEm: Date;
}
