# Tasks: Pure Security Findings Standard & History Reset (`010-finding-terminology-and-history-cleanup`)

- [x] **1. Expurgar Artefatos Utilitários e Limpeza de Histórico no Enriquecedor**
  - [x] 1.1 Atualizar `web-ui/enricher.ts` com opções `excludeUtilityArtifacts: true` e `cleanHistory: true`.
  - [x] 1.2 Mover os 6 arquivos utilitários (`Meta`, `Artifacts`) para `.non-l1-backup/` de modo que apenas vulnerabilidades reais sejam compiladas.
  - [x] 1.3 Implementar purga dos diretórios `history/` em `allure-results/` e `allure-report/` para resetar o gráfico TREND.

- [x] **2. Padronização Terminológica no Allure Plugin**
  - [x] 2.1 Adicionar interceptador dinâmico no `web-ui/allure-plugin.ts` que substitui `"test cases"` por `"findings"` no widget principal e tabelas do Allure.
  - [x] 2.2 Validar que na aba Categories não existe mais a categoria "Other (no severity token)".

- [x] **3. Testes Automatizados**
  - [x] 3.1 Atualizar testes em `web-ui/enricher.test.ts` cobrindo o expurgo de itens `Meta`/`Artifacts` e limpeza de histórico.
  - [x] 3.2 Rodar a suíte completa de testes (`npm test`) e verificação de tipos (`npm run typecheck`).

- [x] **4. Execução Experimental no Juice-Shop**
  - [x] 4.1 Executar `npm run enrich juice-shop -- --level L1 --clean-history`.
  - [x] 4.2 Recompilar o Allure Report e verificar que o total de findings é exatamente 136.
  - [x] 4.3 Reiniciar o servidor web daemon e validar no navegador.
