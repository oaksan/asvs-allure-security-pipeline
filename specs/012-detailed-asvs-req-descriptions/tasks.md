# Tasks: Detailed ASVS Requirement Descriptions (`012-detailed-asvs-req-descriptions`)

- [x] **1. Atualização do Módulo de Enriquecimento (`web-ui/enricher.ts`)**
  - [x] 1.1 Configurar a label `subSuite` para `${primary.reqId} - ${primary.reqDescription}`.
  - [x] 1.2 Configurar `descriptionHtml` e `description` com cartão visual contendo o requisito normativo oficial do ASVS v5.0.0.
  - [x] 1.3 Atualizar `statusDetails.message` com `ASVS: <req_id> [<level>] — <req_description>`.
  - [x] 1.4 Adicionar coluna `req_description` em `asvs-summary.csv`.

- [x] **2. Atualização do Parser e Tipagens em `web-ui/runner.ts`**
  - [x] 2.1 Adicionar `reqDescription` na interface de resumo e no parser `parseAsvsSummaryCsv`.

- [x] **3. Testes Automatizados**
  - [x] 3.1 Atualizar `web-ui/enricher.test.ts` e `web-ui/runner.test.ts` para verificar `reqDescription` em `subSuite`, `descriptionHtml` e CSV.
  - [x] 3.2 Executar `npm test` e `npm run typecheck`.

- [x] **4. Enriquecimento e Validação no Relatório Allure**
  - [x] 4.1 Rodar `npm run enrich juice-shop -- --level L1 --clean-history`.
  - [x] 4.2 Validar na interface do Allure que a árvore de Suites e o painel de detalhes exibem a descrição detalhada do requisito.
