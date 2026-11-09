# Especificação: Data/Hora no Trend, Legenda no Summary e Remoção do Gráfico Status (`020-trend-timestamp-summary-legend-remove-status`)

## 1. Contexto e Motivação
No dashboard do **Allure Report** no contexto do **ASVS Security Pipeline**, a guia **Overview** concentra a visão executiva e analítica da postura de segurança da aplicação. Nesta iteração, refinamos os componentes visuais do Overview para maximizar a clareza analítica e eliminar redundâncias:

1. **Gráfico de Trend com Data/Hora de Execução**:
   O widget `history-trend` exibia por padrão no eixo horizontal apenas identificadores sequenciais ou genéricos (como `#1` ou em branco). Para auditores e times de DevSecOps, o acompanhamento da evolução dos scans exige saber exatamente **quando** cada scan foi executado. O eixo horizontal e os tooltips do gráfico de Trend devem exibir a **data e hora** de cada execução (`DD/MM/YYYY HH:mm`).

2. **Legenda no Gráfico de Percentual (Summary Donut Chart)**:
   O gráfico de percentual principal do Allure Report no Overview (`summary-widget`) exibia o anel percentual mas omitia a legenda de status (`showLegend: false`). Com a reclassificação semântica introduzida no SDD 017 (onde `passed` representa Warning/Amarelo, `failed` representa Falhas Críticas/Vermelho e `broken` representa Bloqueantes/Marrom), a exibição da legenda com a contagem e indicador de cor diretamente no widget torna a leitura imediata e autoexplicativa.

3. **Remoção do Gráfico de Status do Overview**:
   O widget `status-chart` (promovido na iteração SDD 018 a partir da antiga guia Graphs) apresentava um donut idêntico com legenda. Uma vez que o gráfico principal de percentual (`summary`) passa a conter a legenda nativa completa, o `status-chart` tornou-se totalmente redundante. Sua remoção despolui a grade de widgets do Overview, mantendo o foco nos gráficos essenciais: Resumo com Legenda, Tendência Histórica com Data/Hora, Severidade ASVS e Duração.

---

## 2. Histórias de Usuário (User Stories)

### US-01: Rastreabilidade Temporal no Gráfico de Tendência
**Como** Analista de Segurança ou Engenheiro DevSecOps,  
**Quero** visualizar a data e hora de cada scan no eixo horizontal e no tooltip do gráfico de Trend no Overview,  
**Para que** eu possa correlacionar instantaneamente a variação no número de vulnerabilidades com as datas reais de execução dos testes de segurança e deploys.

### US-02: Clareza Semântica no Gráfico Percentual de Resumo
**Como** Auditor de Conformidade ASVS e Gestor Técnico,  
**Quero** que o gráfico donut de percentual do Allure Report apresente a legenda de status com suas respectivas cores semânticas (Warning/Amarelo, Failed/Vermelho, Broken/Marrom, Skipped, Unknown),  
**Para que** a distribuição dos findings seja compreensível sem necessidade de consultar painéis secundários.

### US-03: Dashboard Executivo Conciso e Sem Redundância
**Como** Usuário do Relatório ASAT,  
**Quero** que a guia Overview não apresente gráficos duplicados de status,  
**Para que** o espaço do dashboard seja ocupado de forma eficiente pelos gráficos mais informativos e analíticos.

---

## 3. Requisitos Funcionais

* **RF-01: Data/Hora de Execução no Gráfico de Trend**
  * O eixo X do gráfico de tendência histórica (`history-trend`) deve exibir a data e hora formatada (`DD/MM/YYYY HH:mm`) correspondente a cada execução do scan de segurança.
  * O tooltip ativado ao passar o mouse sobre cada coluna/fatia do gráfico de Trend deve exibir no seu cabeçalho a data e hora da respectiva execução.
  * O modelo do widget (`TrendModel.prototype.parse`) e o enriquecedor (`web-ui/enricher.ts`) devem associar a cada registro histórico o timestamp e data legível da execução a partir de `summary.json` e `history.json`.
  * Ajustar o espaçamento inferior (`PAD_BOTTOM`) e as regras de overflow do gráfico para garantir legibilidade perfeita sem corte das legendas rotacionadas.

* **RF-02: Inclusão de Legenda no Gráfico de Percentual de Resumo (Summary Donut)**
  * No widget principal de resumo (`summary`), configurar a renderização do gráfico donut (`Dh`) com `showLegend: true`.
  * Garantir a exibição da legenda com os rótulos de status (`failed`, `broken`, `passed`, `skipped`, `unknown`) integrados ao layout do widget, respeitando o alinhamento e a paleta de cores customizada.

* **RF-03: Remoção do Gráfico Status da Guia Overview**
  * Remover o `status-chart` da lista de gráficos promovidos para o Overview no plugin Allure.
  * Excluir o registro `allure.api.widgets.widgets['status-chart']` para assegurar que não seja montado no grid da visão geral.
  * Adicionar regra de proteção visual no CSS para suprimir qualquer resquício em cache do widget de status.

---

## 4. Critérios de Aceitação

* **AC-01**: O gráfico de Trend na guia Overview exibe a data/hora formatada (`DD/MM/YYYY HH:mm`) em cada tick do eixo X.
* **AC-02**: Ao passar o mouse sobre qualquer barra do gráfico de Trend, o tooltip exibe a data e hora daquela execução.
* **AC-03**: O gráfico de percentual (donut) no topo do Overview exibe a legenda com todos os status e suas cores semânticas.
* **AC-04**: O gráfico isolado de "Status" (`status-chart`) NÃO é exibido na guia Overview.
* **AC-05**: Os gráficos remanescentes (`history-trend`, `severity`, `duration`, `summary`, etc.) continuam funcionando normalmente.
* **AC-06**: `npm run typecheck` e `npm test` passam com 100% de sucesso.
* **AC-07**: O Princípio I da Constituição (Zero Core Modification) permanece estritamente preservado.
