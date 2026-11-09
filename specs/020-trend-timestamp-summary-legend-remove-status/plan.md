# Plano de Implementação: Data/Hora no Trend, Legenda no Summary e Remoção do Status (`020-trend-timestamp-summary-legend-remove-status`)

## 1. Arquitetura e Estratégia de Mudanças

### 1.1 Gráfico de Trend com Data/Hora (`history-trend`)
- **Backend / Enriquecedor (`web-ui/enricher.ts`)**:
  - Implementar a função `enrichHistoryTrend(reportDir: string, resultsDir?: string)`.
  - Ler `history/history.json` e `widgets/summary.json` para agrupar e ordenar os timestamps das execuções históricas.
  - Ler `widgets/history-trend.json`, associar a cada item os campos `timestamp`, `dateStr` e `date` no formato `DD/MM/YYYY HH:mm`.
  - Persistir as atualizações em `widgets/history-trend.json`, `history/history-trend.json` e `resultsDir/history/history-trend.json`.
- **Frontend Allure Plugin (`web-ui/allure-plugin.ts`)**:
  - Interceptar `allure.api.widgets.widgets['history-trend'].model.prototype.parse`.
  - Mapear cada registro histórico formatando `item.name = formatTrendDate(item.timestamp || item.dateStr || item.date)`.
  - Interceptar `allure.api.widgets.widgets['history-trend'].widget.prototype.onRender` ajustando `chartView.PAD_BOTTOM = 85` para acomodar os rótulos de data/hora no eixo vertical rotacionado.
  - No CSS (`web-ui/allure-plugin.ts`), configurar `.history-trend__chart svg { overflow: visible !important; }`.

### 1.2 Gráfico de Percentual com Legenda (`summary`)
- **Frontend Allure Plugin (`web-ui/allure-plugin.ts`)**:
  - Interceptar `allure.api.widgets.widgets.summary.widget.prototype.onRender`.
  - Após a renderização padrão, obter o componente de gráfico da região `'chart'` e recriá-lo com a opção `showLegend: true`.
  - No CSS, assegurar alinhamento do anel donut com a grade da legenda lateral.

### 1.3 Remoção do Gráfico Status do Overview (`status-chart`)
- **Frontend Allure Plugin (`web-ui/allure-plugin.ts`)**:
  - Atualizar `chartsToMove` para remover `'status-chart'` (permanecendo apenas `['severity', 'duration']`).
  - Executar defensivamente `delete allure.api.widgets.widgets['status-chart'];`.
  - Adicionar regra no CSS `.widget[data-id="status-chart"], .widget:has(.status-widget) { display: none !important; }`.

---

## 2. Fases de Execução

1. **Fase 1: Especificação e Setup**
   - Criar diretório `specs/020-trend-timestamp-summary-legend-remove-status/` com `spec.md`, `plan.md` e `tasks.md`.
   - Atualizar `.specify/feature.json`.

2. **Fase 2: Enriquecedor de Dados (`web-ui/enricher.ts`)**
   - Implementar `enrichHistoryTrend` para enriquecer `widgets/history-trend.json` com timestamps reais e formatados.
   - Integrar a chamada a `enrichHistoryTrend` no final de `generateAllureReport` e no fluxo de CLI.

3. **Fase 3: Plugin Allure (`web-ui/allure-plugin.ts`)**
   - Remover `'status-chart'` de `chartsToMove` e deletar `widgets.widgets['status-chart']`.
   - Wrapping do Summary View para forçar `showLegend: true`.
   - Wrapping do Trend Model (`parse`) e View (`onRender`) para formatar data/hora no eixo X e nos tooltips e aumentar `PAD_BOTTOM`.
   - Estilização CSS defensiva.

4. **Fase 4: Testes Unitários e Validação**
   - Adicionar casos de teste em `web-ui/runner.test.ts`.
   - Reinstalar plugin Allure no workspace (`installAllureCliPlugin`).
   - Executar re-enriquecimento do Juice Shop.
   - Executar `npm run typecheck` e `npm test`.

5. **Fase 5: Conclusão e Documentação**
   - Atualizar `tasks.md` marcando todas as tarefas como concluídas.
