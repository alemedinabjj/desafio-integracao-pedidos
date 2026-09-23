// Regras de integração em funções puras (sem acesso a banco), para facilitar os testes.

export interface ItemComAccession {
  id: number;
  accessionNumber: string;
  integrado: boolean;
}

/**
 * Regra 1: um pedido reenviado só ganha os exames (itens) que ainda não
 * existem nele. A identidade do item é o CodigoItemPedido.
 */
export function selecionarItensNovos<T>(
  codigosExistentes: Iterable<number>,
  recebidos: readonly T[],
  codigoDe: (item: T) => number,
): T[] {
  const existentes = new Set(codigosExistentes);
  return recebidos.filter((item) => !existentes.has(codigoDe(item)));
}

export interface ResultadoIntegracao {
  /** Itens que passam a integrado nesta rodada. */
  idsItensAIntegrar: number[];
  /** AccessionNumbers do pedido que já têm exame chegado. */
  accessionsIntegrados: string[];
  /** Regras 2 e 4: o pedido é integrado se ao menos um item tiver exame. */
  pedidoIntegrado: boolean;
}

export function calcularIntegracao(
  itens: readonly ItemComAccession[],
  accessionsChegados: ReadonlySet<string>,
): ResultadoIntegracao {
  const itensComExame = itens.filter((i) =>
    accessionsChegados.has(i.accessionNumber),
  );

  return {
    idsItensAIntegrar: itensComExame
      .filter((i) => !i.integrado)
      .map((i) => i.id),
    accessionsIntegrados: [
      ...new Set(itensComExame.map((i) => i.accessionNumber)),
    ],
    pedidoIntegrado: itensComExame.length > 0,
  };
}

export interface ParVinculo {
  documentoId: number;
  accessionNumber: string;
}

/**
 * Regras 3 e 4: cada documento do pedido é vinculado a cada exame que já chegou.
 * Os pares que já existem são ignorados no insert (ON CONFLICT DO NOTHING).
 */
export function montarVinculos(
  documentoIds: readonly number[],
  accessionsIntegrados: readonly string[],
): ParVinculo[] {
  return documentoIds.flatMap((documentoId) =>
    accessionsIntegrados.map((accessionNumber) => ({
      documentoId,
      accessionNumber,
    })),
  );
}
