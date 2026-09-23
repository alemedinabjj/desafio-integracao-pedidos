import { DataSourceOptions } from 'typeorm';
import { DocumentoExame } from '../modules/documentos/documento-exame.entity';
import { Documento } from '../modules/documentos/documento.entity';
import { Exame } from '../modules/exames/exame.entity';
import { ItemPedido } from '../modules/pedidos/item-pedido.entity';
import { Pedido } from '../modules/pedidos/pedido.entity';
import { migrations } from './migrations';

export const entities = [Pedido, ItemPedido, Exame, Documento, DocumentoExame];

export function buildTypeOrmOptions(databaseUrl: string): DataSourceOptions {
  return {
    type: 'postgres',
    url: databaseUrl,
    entities,
    migrations,
    // Schema versionado por migrations; synchronize nunca em produção.
    synchronize: false,
    migrationsRun: true,
  };
}
