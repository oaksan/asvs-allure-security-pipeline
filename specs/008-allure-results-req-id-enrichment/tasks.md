# Tasks: Allure Native Results Granular Requirement (`req_id`) Enrichment (`008-allure-results-req-id-enrichment`)

- [x] **1. Implementação do Módulo Enriquecedor**
  - [x] 1.1 Criar `web-ui/enricher.ts` com a lógica de reescrita precisa de `statusDetails.message`, `labels` e `asvs-summary.csv`.
  - [x] 1.2 Implementar CLI runner para invocação direta via script (`npx ts-node web-ui/enricher.ts <allure-results-dir>`).

- [x] **2. Testes Automatizados**
  - [x] 2.1 Criar testes unitários em `web-ui/enricher.test.ts` cobrindo cenários com Semgrep, Trivy, ZAP, NPM Audit e Gitleaks.
  - [x] 2.2 Garantir preservação estrita de tokens de severidade `[[SEVERITY:...]]` e de campos não-ASVS.

- [x] **3. Integração no Pipeline e Servidor Web**
  - [x] 3.1 Integrar `enrichAllureResultsDir` em `web-ui/runner.ts` no encerramento de cada scan bem-sucedido.
  - [x] 3.2 Adicionar rota `POST /api/enrich/:repo` em `web-ui/server.ts` para enriquecimento retroativo e regeneração do HTML do Allure.
  - [x] 3.3 Adicionar script npm correspondente em `package.json` (`"enrich": "ts-node web-ui/enricher.ts"`).

- [x] **4. Execução Prática e Validação Experimental**
  - [x] 4.1 Executar o enriquecedor sobre os resultados reais do `juice-shop` (`allure-results/juice-shop/`).
  - [x] 4.2 Recompilar o Allure Report para `allure-report/juice-shop/`.
  - [x] 4.3 Verificar no arquivo `data/categories.json` e no Allure Report que as categorias agora contêm `ASVS: <req_id> [<level>]`.
  - [x] 4.4 Validar tipagem (`tsc --noEmit`) e execução de testes (`node --test`).
