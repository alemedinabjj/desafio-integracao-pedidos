import request from 'supertest';
import { App } from 'supertest/types';
import { criarTestApp, TestApp } from './test-app';

const pedido = (sobrescrever: Record<string, unknown> = {}) => ({
  CodigoPedido: 616,
  NomePaciente: 'ALEFHER MONTONI DE ALMEIDA',
  DataNascimento: '19970601',
  Sexo: 'M',
  CodUnidade: 104,
  Exames: [
    {
      CodigoItemPedido: 930,
      AccessionNumber: '930',
      Modalidade: 'CR',
      NomeProcedimento: 'RX ANTEBRACO ESQUERDO',
    },
  ],
  ...sobrescrever,
});

const documento = (sobrescrever: Record<string, unknown> = {}) => ({
  CodigoDocumento: 251,
  CodigoPedido: 616,
  NomeDocumento: 'PEDIDO',
  Documento: Buffer.from('%PDF-1.4 conteudo').toString('base64'),
  ...sobrescrever,
});

const exame = (sobrescrever: Record<string, unknown> = {}) => ({
  AccessionNumber: '930',
  NomePaciente: 'ALEFHER MONTONI DE ALMEIDA',
  Modalidade: 'CR',
  Status: 'NOVO',
  ...sobrescrever,
});

describe('Integração de pedidos, documentos e exames (e2e)', () => {
  let ctx: TestApp;
  let http: App;

  beforeAll(async () => {
    ctx = await criarTestApp();
    http = ctx.app.getHttpServer() as App;
  });

  afterAll(async () => {
    await ctx?.encerrar();
  });

  beforeEach(async () => {
    await ctx.limparBanco();
  });

  describe('casos mínimos do enunciado', () => {
    it('1. pedido sem exame correspondente é salvo como não integrado', async () => {
      const res = await request(http)
        .post('/pedidos')
        .send(pedido())
        .expect(201);

      expect(res.body).toMatchObject({ CodigoPedido: 616, Integrado: false });
      expect(res.body.Exames).toEqual([
        expect.objectContaining({ Integrado: false }),
      ]);
    });

    it('2. pedido com exame já existente (mesmo accession) é salvo como integrado', async () => {
      await request(http).post('/exames').send(exame()).expect(201);

      const res = await request(http)
        .post('/pedidos')
        .send(pedido())
        .expect(201);

      expect(res.body.Integrado).toBe(true);
      expect(res.body.Exames[0].Integrado).toBe(true);
    });

    it('3. documento de pedido não integrado é salvo mas não vinculado', async () => {
      await request(http).post('/pedidos').send(pedido()).expect(201);

      const res = await request(http)
        .post('/documentos')
        .send(documento())
        .expect(201);

      expect(res.body).toMatchObject({
        Integrado: false,
        ExamesVinculados: [],
      });
    });

    it('4. exame que chega depois integra o pedido e vincula o documento pendente', async () => {
      await request(http).post('/pedidos').send(pedido()).expect(201);
      await request(http).post('/documentos').send(documento()).expect(201);

      const res = await request(http).post('/exames').send(exame()).expect(201);

      expect(res.body.PedidosVinculados).toEqual([616]);
      expect(res.body.DocumentosVinculados).toEqual([
        { CodigoDocumento: 251, CodigoPedido: 616, NomeDocumento: 'PEDIDO' },
      ]);

      const pedidoAtual = await request(http).get('/pedidos/616').expect(200);
      expect(pedidoAtual.body.Integrado).toBe(true);

      const documentos = await request(http).get('/documentos/616').expect(200);
      expect(documentos.body).toEqual([
        expect.objectContaining({ Integrado: true, ExamesVinculados: ['930'] }),
      ]);
    });

    it('5. pedido reenviado com exame novo adiciona só o novo, sem duplicar', async () => {
      await request(http).post('/pedidos').send(pedido()).expect(201);

      const exames = [
        ...pedido().Exames,
        {
          CodigoItemPedido: 931,
          AccessionNumber: '931',
          Modalidade: 'CR',
          NomeProcedimento: 'RX MAO',
        },
      ];
      const res = await request(http)
        .post('/pedidos')
        .send(pedido({ Exames: exames }))
        .expect(200);

      expect(
        res.body.Exames.map(
          (e: { CodigoItemPedido: number }) => e.CodigoItemPedido,
        ),
      ).toEqual([930, 931]);
    });

    it('6. documento duplicado retorna erro de duplicidade', async () => {
      await request(http).post('/documentos').send(documento()).expect(201);

      const res = await request(http)
        .post('/documentos')
        .send(documento())
        .expect(409);

      expect(res.body).toMatchObject({
        statusCode: 409,
        message: 'Documento 251 já recebido para o pedido 616',
      });
    });
  });

  describe('ordem de chegada e idempotência', () => {
    it('documento que chega antes do pedido é vinculado quando pedido e exame chegam', async () => {
      await request(http).post('/documentos').send(documento()).expect(201);
      await request(http).post('/exames').send(exame()).expect(201);
      await request(http).post('/pedidos').send(pedido()).expect(201);

      const documentos = await request(http).get('/documentos/616').expect(200);
      expect(documentos.body[0]).toMatchObject({
        Integrado: true,
        ExamesVinculados: ['930'],
      });
    });

    it('documento de pedido já integrado é vinculado na hora', async () => {
      await request(http).post('/exames').send(exame()).expect(201);
      await request(http).post('/pedidos').send(pedido()).expect(201);

      const res = await request(http)
        .post('/documentos')
        .send(documento())
        .expect(201);

      expect(res.body).toMatchObject({
        Integrado: true,
        ExamesVinculados: ['930'],
      });
    });

    it('segundo exame do mesmo pedido também recebe os documentos já vinculados', async () => {
      const exames = [
        ...pedido().Exames,
        {
          CodigoItemPedido: 931,
          AccessionNumber: '931',
          Modalidade: 'CR',
          NomeProcedimento: 'RX MAO',
        },
      ];
      await request(http)
        .post('/pedidos')
        .send(pedido({ Exames: exames }))
        .expect(201);
      await request(http).post('/documentos').send(documento()).expect(201);
      await request(http).post('/exames').send(exame()).expect(201);

      await request(http)
        .post('/exames')
        .send(exame({ AccessionNumber: '931' }))
        .expect(201);

      const documentos = await request(http).get('/documentos/616').expect(200);
      expect(documentos.body[0].ExamesVinculados).toEqual(['930', '931']);
    });

    it('reenvio do mesmo exame é idempotente e mantém os dados originais', async () => {
      await request(http).post('/exames').send(exame()).expect(201);

      const res = await request(http)
        .post('/exames')
        .send(exame({ NomePaciente: 'OUTRO NOME' }))
        .expect(200);

      expect(res.body.NomePaciente).toBe('ALEFHER MONTONI DE ALMEIDA');
    });

    it('mesmo CodigoDocumento em pedidos diferentes não é duplicidade', async () => {
      await request(http).post('/documentos').send(documento()).expect(201);
      await request(http)
        .post('/documentos')
        .send(documento({ CodigoPedido: 617 }))
        .expect(201);
    });
  });

  describe('consultas e erros', () => {
    it('GET /documentos só retorna o base64 quando solicitado', async () => {
      const payload = documento();
      await request(http).post('/documentos').send(payload).expect(201);

      const semConteudo = await request(http)
        .get('/documentos/616')
        .expect(200);
      expect(semConteudo.body[0]).not.toHaveProperty('Documento');

      const comConteudo = await request(http)
        .get('/documentos/616?incluirConteudo=true')
        .expect(200);
      expect(comConteudo.body[0].Documento).toBe(payload.Documento);
    });

    it('retorna 404 para pedido e exame inexistentes', async () => {
      await request(http).get('/pedidos/999').expect(404);
      await request(http).get('/exames/999').expect(404);
    });

    it('retorna 400 com detalhes quando o pedido é inválido', async () => {
      const res = await request(http)
        .post('/pedidos')
        .send(
          pedido({
            DataNascimento: '1997-06-01',
            Exames: [{ CodigoItemPedido: 1 }],
          }),
        )
        .expect(400);

      expect(res.body.message).toEqual(
        expect.arrayContaining([
          'DataNascimento deve estar no formato YYYYMMDD',
          expect.stringContaining('AccessionNumber'),
        ]),
      );
    });

    it('retorna 400 quando o pedido traz CodigoItemPedido repetido', async () => {
      const repetido = pedido().Exames[0];
      await request(http)
        .post('/pedidos')
        .send(pedido({ Exames: [repetido, repetido] }))
        .expect(400);
    });

    it('retorna 400 quando o documento não é base64', async () => {
      await request(http)
        .post('/documentos')
        .send(documento({ Documento: '###' }))
        .expect(400);
    });

    it('retorna 400 quando o parâmetro de rota não é numérico', async () => {
      await request(http).get('/pedidos/abc').expect(400);
    });
  });
});
