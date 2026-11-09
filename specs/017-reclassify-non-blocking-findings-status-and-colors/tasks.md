# Tasks: Reclassificação Visual e Semântica de Findings Não-Bloqueantes (`017-reclassify-non-blocking-findings-status-and-colors`)

- [x] **1. Estilização Dinâmica por Criticidade no Enriquecedor (`web-ui/enricher.ts`)**
  - [x] 1.1 Atualizar a função `enrichResultData` para definir paleta de cores condicional no `asvs-remediation-box`:
    - [x] 1.1.1 Findings com `status === 'passed'` (Medium/Low/Unknown): Fundo `#fffde7`, borda `#f57f17` (âmbar), título com badge `[Warning - Não Bloqueante]` e sem cores verdes.
    - [x] 1.1.2 Findings com `status === 'failed'` (Critical/High): Fundo `#ffebee`, borda `#c62828` (vermelho) e título com badge `[Failed - Bloqueante]`.

- [x] **2. Injeção de CSS e Regras Visuais no Plugin Allure (`web-ui/allure-plugin.ts`)**
  - [x] 2.1 Adicionar regras CSS em `getAllurePluginCss()` para transformar `passed` em **Amarelo / Warning**:
    - [x] `.bar__fill_status_passed`, `.y-label_status_passed`, `.chart__fill_status_passed`, `.status-details_status_passed`.
    - [x] Substituir o ícone de visto verde (`fa-check-circle`) na árvore pelo ícone de alerta amarelo (`fa-exclamation-triangle` em `#f57f17`).
    - [x] Estilizar a tag de status no painel do resultado para exibir `Warning` em amarelo.
  - [x] 2.2 Adicionar regras CSS em `getAllurePluginCss()` para transformar `broken` em **Marrom**:
    - [x] `.bar__fill_status_broken`, `.y-label_status_broken`, `.chart__fill_status_broken`, `.status-details_status_broken`.
    - [x] Definir tons de marrom (`#795548`, `#6d4c41`, `#5d4037`, `#efebe9`).
  - [x] 2.3 Adicionar rotina de DOM Mutation/Text Observer em `getAllurePluginJs()` para traduzir labels e tooltips de "Passed" para "Warning".

- [x] **3. Testes Automatizados e Validação**
  - [x] 3.1 Adicionar testes em `web-ui/runner.test.ts` e `web-ui/enricher.test.ts` verificando a presença das novas classes de estilo amarelo para `passed` e marrom para `broken`, bem como o texto `Warning`.
  - [x] 3.2 Executar `npm test` e `npm run typecheck` garantindo aprovação total.

- [x] **4. Regeneração e Validação Experimental**
  - [x] 4.1 Executar `npm run enrich juice-shop -- --level L1 --clean-history`.
  - [x] 4.2 Verificar o relatório gerado em `http://127.0.0.1:8765/`:
    - [x] Confirmar que nenhum finding aparece com verde ou "Passed".
    - [x] Confirmar que achados Medium e Low aparecem em amarelo com status "Warning".
    - [x] Confirmar que o status Broken está estilizado em marrom sem colisão de cor.

