# Tarefas da Iteração: Data/Hora no Trend, Legenda no Summary e Remoção do Status (`020-trend-timestamp-summary-legend-remove-status`)

- [x] **1. Especificação e Configuração**
  - [x] 1.1 Criar diretório `specs/020-trend-timestamp-summary-legend-remove-status/`
  - [x] 1.2 Redigir `spec.md` com requisitos RF-01, RF-02 e RF-03
  - [x] 1.3 Redigir `plan.md` com estratégia arquitetural
  - [x] 1.4 Atualizar `.specify/feature.json`

- [x] **2. Enriquecimento de Dados Históricos**
  - [x] 2.1 Implementar `enrichHistoryTrend` em `web-ui/enricher.ts` para mapear datas e horas de execuções
  - [x] 2.2 Integrar `enrichHistoryTrend` ao ciclo de vida do relatório após `generateAllureReport`

- [x] **3. Customização do Allure Plugin**
  - [x] 3.1 Remover `status-chart` de `chartsToMove` e excluir do mapa de widgets do Overview
  - [x] 3.2 Implementar wrapping do `summary.widget` habilitando `showLegend: true` no donut chart
  - [x] 3.3 Implementar interceptação de `history-trend.model` (`parse`) para formatar data e hora no eixo X e no tooltip
  - [x] 3.4 Ajustar `PAD_BOTTOM` e CSS de overflow do gráfico de Trend
  - [x] 3.5 Ocultar visualmente o widget de status no CSS para sessões com cache antigo

- [x] **4. Testes e Validação**
  - [x] 4.1 Adicionar teste unitário em `web-ui/runner.test.ts` e `web-ui/enricher.test.ts` cobrindo os requisitos
  - [x] 4.2 Reinstalar plugin Allure nos templates locais
  - [x] 4.3 Re-enriquecer os dados de teste do Juice Shop com preservação de histórico
  - [x] 4.4 Executar `npm run typecheck` e `npm test` verificando aprovação de 100% dos testes (23/23 testes passando)
  - [x] 4.5 Validar interface web do relatório no servidor ativo
