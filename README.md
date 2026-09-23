# desafio-integracao-pedidos

[![CI](https://github.com/alemedinabjj/desafio-integracao-pedidos/actions/workflows/ci.yml/badge.svg)](https://github.com/alemedinabjj/desafio-integracao-pedidos/actions/workflows/ci.yml)

API para receber pedidos de exame, documentos e a chegada de exames, e relacionar tudo pelo AccessionNumber.

Stack: Node 24, NestJS, TypeORM, PostgreSQL, Jest, Docker.

## Rodando

Com Docker:

```bash
docker compose up --build
```

- API: http://localhost:3000
- Swagger: http://localhost:3000/docs
- Health: http://localhost:3000/health

As migrations rodam sozinhas quando a API sobe.

Sem Docker (precisa de Node 24.9+ e pnpm):

```bash
nvm use
pnpm install
cp .env.example .env
docker compose up -d db
pnpm start:dev
```

Uso Node 24.9+ porque o Nest 12 é publicado como ESM e o Jest só consegue carregar isso a partir dessa versão. No Node 22 os testes e2e quebram.

## Testes

```bash
pnpm test        # unitários
pnpm test:e2e    # e2e (precisa do Docker rodando)
pnpm test:cov    # cobertura (unitários + e2e)
```

Os testes e2e sobem um Postgres temporário com Testcontainers e chamam a API de verdade. Os 6 casos pedidos no desafio estão em `test/integracao.e2e-spec.ts`, no bloco "casos mínimos do enunciado".

## CI

GitHub Actions (`.github/workflows/ci.yml`), rodando em push na main e em pull requests:

- lint, typecheck e testes unitários;
- testes e2e com cobertura (o relatório fica como artefato do job);
- build da imagem Docker, depois que os dois anteriores passam. Em PR só valida o build. Na main a imagem é publicada no GitHub Container Registry com as tags `latest` e o SHA do commit.

Para usar a imagem publicada (precisa de um Postgres acessível):

```bash
docker pull ghcr.io/alemedinabjj/desafio-integracao-pedidos:latest
docker run -p 3000:3000 -e DATABASE_URL=postgres://postgres:postgres@host.docker.internal:5432/pedidos ghcr.io/alemedinabjj/desafio-integracao-pedidos:latest
```

Não tem deploy automático porque o projeto não vai para produção e não existe ambiente para receber. Se tivesse, o deploy usaria a imagem publicada pelo SHA do commit.

## Exemplo

```bash
# pedido chega sem exame (Integrado: false)
curl -X POST localhost:3000/pedidos -H 'Content-Type: application/json' -d '{
  "CodigoPedido": 616, "NomePaciente": "ALEFHER MONTONI DE ALMEIDA",
  "DataNascimento": "19970601", "Sexo": "M", "CodUnidade": 104,
  "Exames": [{ "CodigoItemPedido": 930, "AccessionNumber": "930",
               "Modalidade": "CR", "NomeProcedimento": "RX ANTEBRACO ESQUERDO" }]
}'

# documento chega e fica pendente
curl -X POST localhost:3000/documentos -H 'Content-Type: application/json' -d '{
  "CodigoDocumento": 251, "CodigoPedido": 616, "NomeDocumento": "PEDIDO",
  "Documento": "JVBERi0xLjQK"
}'

# exame chega: pedido fica integrado e o documento é vinculado
curl -X POST localhost:3000/exames -H 'Content-Type: application/json' -d '{
  "AccessionNumber": "930", "NomePaciente": "ALEFHER MONTONI DE ALMEIDA",
  "Modalidade": "CR", "Status": "NOVO"
}'

curl localhost:3000/pedidos/616
curl localhost:3000/documentos/616
curl localhost:3000/exames/930
```

## Endpoints

| Método | Rota | Retornos |
|---|---|---|
| POST | /pedidos | 201 (criado), 200 (pedido já existia), 400 |
| GET | /pedidos/:codigoPedido | 200, 404 |
| POST | /documentos | 201, 400, 409 (duplicado) |
| GET | /documentos/:codigoPedido | 200 (`?incluirConteudo=true` traz o base64) |
| POST | /exames | 201 (criado), 200 (já existia), 400 |
| GET | /exames/:accessionNumber | 200, 404 |
| GET | /health | 200, 503 |

Os payloads seguem o formato do enunciado (PascalCase). Os erros sempre voltam assim:

```json
{ "statusCode": 409, "error": "CONFLICT", "message": "Documento 251 já recebido para o pedido 616", "path": "/documentos", "timestamp": "..." }
```

## Modelagem

```mermaid
erDiagram
    pedidos ||--|{ itens_pedido : ""
    documentos ||--o{ documentos_exames : ""
    exames ||--o{ documentos_exames : ""
```

Tabelas:

- `pedidos`: chave é o CodigoPedido.
- `itens_pedido`: os exames que vêm dentro do pedido. Unique em (codigo_pedido, codigo_item_pedido).
- `exames`: exames que chegaram. Chave é o AccessionNumber.
- `documentos`: unique em (codigo_documento, codigo_pedido). O base64 fica numa coluna que não é carregada por padrão.
- `documentos_exames`: vínculo entre documento e exame.

Separei o exame que vem dentro do pedido (`itens_pedido`) do exame que chega (`exames`). No enunciado os dois se chamam "exame", mas um é o que foi pedido e o outro é o que foi realizado, e um pode existir sem o outro. A ligação entre eles é o AccessionNumber.

Não coloquei FK de `documentos` para `pedidos`, nem de `itens_pedido` para `exames`, porque o documento ou o exame podem chegar antes do pedido.

## Como a integração funciona

Cada endpoint grava o seu dado e depois chama `reconciliarPedido` (em `src/modules/integracao/integracao.service.ts`), que:

1. carrega o pedido e seus itens;
2. verifica quais AccessionNumbers já têm exame;
3. marca esses itens e o pedido como integrados;
4. vincula todos os documentos do pedido a todos os exames que já chegaram e marca os documentos como integrados.

Como essa função sempre olha o estado atual do banco, a ordem em que as coisas chegam não faz diferença. Chamar de novo também não duplica nada (os vínculos usam `ON CONFLICT DO NOTHING`).

A lógica de decisão (quais itens são novos, quais integrar, quais vínculos criar) fica em funções puras em `integracao.rules.ts`, que têm testes unitários.

| Evento | O que grava | Qual pedido reconcilia |
|---|---|---|
| POST /pedidos | pedido e só os itens novos | o próprio pedido |
| POST /documentos | documento (duplicado dá 409) | o pedido do documento |
| POST /exames | exame (se já existir, mantém o original) | todos os pedidos que têm item com esse AccessionNumber |

## Decisões

- **Camadas.** O controller cuida da parte HTTP. O service cuida da transação e do fluxo. O módulo `integracao` guarda as regras. Os services lançam erros próprios (`RecursoDuplicadoError`, `RecursoNaoEncontradoError`), e um filtro global transforma em 404 ou 409.
- **Sem repository próprio.** Usei o EntityManager do TypeORM direto nos services. Para o tamanho do projeto, uma camada a mais só ia repassar chamada.
- **Duplicidade.** Quem garante é o banco, com constraint unique e `INSERT ... ON CONFLICT DO NOTHING RETURNING`. Não faço SELECT antes do INSERT, porque isso falha com duas requisições ao mesmo tempo.
- **Transação e lock.** Cada evento roda numa transação com `pg_advisory_xact_lock(CodigoPedido)`, então eventos do mesmo pedido rodam um de cada vez. Usei advisory lock em vez de `SELECT FOR UPDATE` porque o pedido pode ainda não existir.
- **Migrations.** O schema é versionado com `synchronize: false`. As migrations rodam na subida da API. Em produção eu rodaria num passo separado do deploy.
- **Logs.** Uso Pino em JSON, com requestId em todos os logs da requisição. O corpo das requisições não é logado, porque tem dado de paciente e base64.
- **Validação.** Uso class-validator com `whitelist`: campo que não está no DTO é descartado, sem dar erro. Assim, se o sistema de origem mandar um campo a mais, nada quebra.
- **Testes e2e com Postgres de verdade.** As regras dependem de unique, ON CONFLICT e lock, então um mock não testaria o que importa.

## Premissas

- Dentro de um pedido, o item é identificado pelo CodigoItemPedido. No reenvio, itens que já existem não são alterados.
- Os dados do paciente e da unidade ficam como vieram no primeiro envio do pedido.
- O pedido fica integrado quando pelo menos um item tem exame. Depois de integrado, não volta para false.
- Documento de pedido que ainda não existe é aceito e fica pendente.
- Exame reenviado (mesmo AccessionNumber) retorna 200 com os dados originais.
- O mesmo AccessionNumber pode estar em mais de um pedido.
- O documento fica integrado quando tem pelo menos um exame vinculado.
- `DataNascimento` é guardada no formato recebido (YYYYMMDD). `Sexo` aceita M, F, O ou I. `Status` do exame é opcional e o padrão é NOVO.
- O base64 fica no Postgres. O limite do corpo é 10mb e pode ser mudado com `BODY_LIMIT`.

## O que ficou de fora / melhorias

- Arquivos no S3, guardando só a referência no banco.
- Concorrência: o lock resolve eventos do mesmo pedido. Ainda tem uma janela quando pedido e exame com o mesmo AccessionNumber chegam exatamente juntos. Eu resolveria com uma fila por CodigoPedido ou com um job que roda a reconciliação periodicamente, já que ela pode rodar várias vezes sem problema.
- Paginação no GET de documentos.
- Autenticação e métricas/tracing.

## Estrutura

```
src/
  main.ts, app.setup.ts, app.module.ts
  config/          variáveis de ambiente
  common/          erros, filtro de exceções, logger
  database/        config do TypeORM e migrations
  modules/
    integracao/    regras e reconciliação
    pedidos/
    documentos/
    exames/
    health/
test/
  setup/           Postgres com Testcontainers
  integracao.e2e-spec.ts
```
