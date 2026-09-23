import {
  calcularIntegracao,
  montarVinculos,
  selecionarItensNovos,
} from './integracao.rules';

describe('integracao.rules', () => {
  describe('selecionarItensNovos', () => {
    const porCodigo = (e: { codigo: number }) => e.codigo;

    it('retorna todos os itens quando o pedido ainda não tem nenhum', () => {
      const recebidos = [{ codigo: 1 }, { codigo: 2 }];
      expect(selecionarItensNovos([], recebidos, porCodigo)).toEqual(recebidos);
    });

    it('descarta itens cujo CodigoItemPedido já existe no pedido', () => {
      const recebidos = [{ codigo: 930 }, { codigo: 931 }];
      expect(selecionarItensNovos([930], recebidos, porCodigo)).toEqual([
        { codigo: 931 },
      ]);
    });

    it('retorna vazio quando todos os itens já existem (reenvio idêntico)', () => {
      expect(
        selecionarItensNovos([1, 2], [{ codigo: 1 }, { codigo: 2 }], porCodigo),
      ).toEqual([]);
    });
  });

  describe('calcularIntegracao', () => {
    const item = (id: number, accessionNumber: string, integrado = false) => ({
      id,
      accessionNumber,
      integrado,
    });

    it('não integra o pedido quando nenhum exame chegou', () => {
      const resultado = calcularIntegracao([item(1, '930')], new Set());
      expect(resultado).toEqual({
        idsItensAIntegrar: [],
        accessionsIntegrados: [],
        pedidoIntegrado: false,
      });
    });

    it('integra o pedido quando ao menos um item tem exame chegado', () => {
      const resultado = calcularIntegracao(
        [item(1, '930'), item(2, '931')],
        new Set(['931']),
      );
      expect(resultado).toEqual({
        idsItensAIntegrar: [2],
        accessionsIntegrados: ['931'],
        pedidoIntegrado: true,
      });
    });

    it('não reprocessa itens que já estavam integrados', () => {
      const resultado = calcularIntegracao(
        [item(1, '930', true), item(2, '931')],
        new Set(['930', '931']),
      );
      expect(resultado.idsItensAIntegrar).toEqual([2]);
      expect(resultado.accessionsIntegrados).toEqual(['930', '931']);
    });

    it('não repete accession quando dois itens compartilham o mesmo', () => {
      const resultado = calcularIntegracao(
        [item(1, '930'), item(2, '930')],
        new Set(['930']),
      );
      expect(resultado.accessionsIntegrados).toEqual(['930']);
      expect(resultado.idsItensAIntegrar).toEqual([1, 2]);
    });
  });

  describe('montarVinculos', () => {
    it('vincula todo documento a todo exame integrado do pedido', () => {
      expect(montarVinculos([10, 11], ['930', '931'])).toEqual([
        { documentoId: 10, accessionNumber: '930' },
        { documentoId: 10, accessionNumber: '931' },
        { documentoId: 11, accessionNumber: '930' },
        { documentoId: 11, accessionNumber: '931' },
      ]);
    });

    it('não gera vínculos sem documentos ou sem exames', () => {
      expect(montarVinculos([], ['930'])).toEqual([]);
      expect(montarVinculos([10], [])).toEqual([]);
    });
  });
});
