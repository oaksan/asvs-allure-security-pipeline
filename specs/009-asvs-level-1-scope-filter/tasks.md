# Tasks: OWASP ASVS v5.0.0 Level 1 (L1) Verification Scope & Filtering (`009-asvs-level-1-scope-filter`)

- [x] **1. Módulo de Enriquecimento e Filtro de Nível 1**
  - [x] 1.1 Estender `web-ui/enricher.ts` com opção `levelFilter: 'L1' | 'all'` e suporte a argumentos de CLI (`--level L1`).
  - [x] 1.2 Implementar preservação não-destrutiva de achados L2/L3 em subdiretório `.non-l1-backup/` ao filtrar para L1.
  - [x] 1.3 Adicionar helper em `web-ui/asvs-catalog.ts` para extração dos 70 requisitos L1.

- [x] **2. Testes Automatizados**
  - [x] 2.1 Criar testes em `web-ui/enricher.test.ts` verificando que quando `levelFilter === 'L1'`, achados L2 e L3 são removidos de `allure-results/` e preservados em backup, retendo estritamente os de nível L1.
  - [x] 2.2 Validar que o `asvs-summary.csv` gerado reflete o escopo estrito L1.

- [x] **3. Integração no Allure Plugin, Server e Runner**
  - [x] 3.1 Atualizar `web-ui/server.ts` para aceitar `?level=L1` em `POST /api/enrich/:repo`.
  - [x] 3.2 Atualizar `web-ui/allure-plugin.ts` na aba `#asvs-matrix` com seletor de nível e métricas dos 70 requisitos L1.
  - [x] 3.3 Atualizar `web-ui/runner.ts` para repassar opção de escopo de nível L1.

- [x] **4. Execução Prática e Validação Experimental**
  - [x] 4.1 Executar o enriquecedor com `--level L1` sobre `juice-shop`.
  - [x] 4.2 Recompilar o Allure Report e verificar `data/categories.json` (garantindo que 100% dos itens são de nível `L1`).
  - [x] 4.3 Rodar a suíte completa de testes (`npm test`) e verificação de tipos (`npm run typecheck`).
