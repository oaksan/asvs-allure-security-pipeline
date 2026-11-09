# Tasks: Remoção da Guia Graphs e Migração de Gráficos para o Overview (`018-move-graphs-to-overview-and-remove-tab`)

- [x] **1. Supressão da Guia Graphs e Redirecionamento (`web-ui/allure-plugin.ts`)**
  - [x] 1.1 Injetar regra CSS em `getAllurePluginCss()` para ocultar a aba "Graphs" da barra lateral de navegação (`.side-nav__item:has(a[href*="graph"])`).
  - [x] 1.2 Remover a aba `graph` de `allure.api.tabs` no carregamento de `getAllurePluginJs()`.
  - [x] 1.3 Adicionar interceptação de rota para redirecionar `#graph` para `#` (Overview).

- [x] **2. Migração Seletiva dos Gráficos Exclusivos para Overview (`web-ui/allure-plugin.ts`)**
  - [x] 2.1 Identificar os widgets gráficos analíticos em `allure.api.widgets.graph`: `status-chart`, `severity` e `duration`.
  - [x] 2.2 Registrar esses widgets em `allure.api.widgets.widgets` preservando suas definições de view e modelo.
  - [x] 2.3 Garantir que o gráfico `history-trend` não seja duplicado e que `categories-trend` permaneça descontinuado.

- [x] **3. Testes Automatizados e Verificação**
  - [x] 3.1 Adicionar teste em `web-ui/runner.test.ts` validando a supressão da aba Graphs e a migração dos widgets para `widgets`.
  - [x] 3.2 Executar `npm test` e `npm run typecheck` para garantir aprovação de 100% dos testes.

- [x] **4. Validação Experimental no Juice Shop**
  - [x] 4.1 Reinstalar os assets do plugin e reiniciar o servidor daemon.
  - [x] 4.2 Inspecionar `http://127.0.0.1:8765/#` e verificar:
    - [x] A aba Graphs foi removida do menu lateral.
    - [x] O Overview renderiza os novos gráficos de Status, Severidade e Duração.
    - [x] Acessar `#graph` redireciona para `#`.
