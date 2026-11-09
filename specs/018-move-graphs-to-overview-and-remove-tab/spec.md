# Especificação: Remoção da Guia Graphs e Migração de Gráficos para o Overview (`018-move-graphs-to-overview-and-remove-tab`)

## 1. Contexto e Motivação
No Allure Report, a navegação lateral inclui uma guia dedicada chamada **Graphs** (`#graph`). No entanto, ter uma aba separada fragmenta a experiência do usuário e dispersa a análise de métricas de segurança.

A página principal de **Overview** (`#`) já concentra o resumo executivo da execução (gráfico de rosca *summary*, tabela de suítes e variáveis de ambiente). Para proporcionar uma visão unificada e completa em um único painel (*single-pane-of-glass*), a guia **Graphs** deve ser removida da navegação lateral, e seus gráficos exclusivos e relevantes — que não existam previamente no Overview — devem ser incorporados diretamente à página de **Overview**.

---

## 2. Histórias de Usuário (User Stories)

### US-01: Consolidação da Visão Geral no Overview
**Como** Analista de Segurança / Engenheiro DevSecOps,  
**Quero** visualizar todos os gráficos relevantes de status, severidade e duração diretamente na página principal de **Overview**,  
**Para que** eu tenha uma análise analítica imediata da postura de segurança da aplicação sem precisar alternar entre abas.

### US-02: Eliminação da Guia Redundante "Graphs"
**Como** Usuário do Relatório Allure,  
**Quero** que a guia lateral **Graphs** seja suprimida do menu e que qualquer acesso à rota `#graph` seja redirecionado para o Overview (`#`),  
**Para que** a interface fique mais enxuta, intuitiva e sem seções redundantes ou vazias.

### US-03: Não Duplicação de Métricas
**Como** Auditor de Conformidade ASVS,  
**Quero** que apenas os gráficos analíticos novos de Graphs sejam migrados (evitando duplicar widgets já existentes como o histórico de tendências ou métricas de categorias descontinuadas),  
**Para que** o Overview permaneça limpo, focado e informativo.

---

## 3. Requisitos Funcionais

* **RF-01: Remoção da Guia Graphs da Navegação Lateral**
  * Ocultar o item de menu "Graphs" na barra lateral (`.side-nav__item` com link para `#graph` ou tooltip "Graphs" / "Gráficos") via CSS (`display: none !important`).
  * Remover o objeto de aba correspondente a `graph` de `allure.api.tabs` no ciclo de inicialização do plugin.
  * Interceptar a rota `#graph` via evento `hashchange` e redirecionar automaticamente para o Overview (`#`).

* **RF-02: Migração Seletiva de Gráficos para o Overview (`widgets`)**
  * Identificar os widgets gráficos registrados sob `allure.api.widgets.graph`:
    * `status-chart` (Gráfico analítico de distribuição de status dos findings);
    * `severity` (Gráfico de distribuição por níveis de severidade);
    * `duration` (Gráfico de distribuição de duração de execução).
  * Promover e registrar esses widgets dentro de `allure.api.widgets.widgets` (a coleção consumida nativamente pela página de Overview).
  * Ignorar widgets que já existam em Overview (ex: `history-trend`) ou que pertençam a conceitos descontinuados (ex: `categories-trend`).

* **RF-03: Renderização Automática e Responsiva no Overview**
  * Garantir que o mecanismo nativo do Allure distribua os novos widgets nas colunas do grid do Overview (`widgets-grid__col`), mantendo responsividade e carregamento assíncrono dos respectivos dados JSON (`widgets/status-chart.json`, `widgets/severity.json`, `widgets/duration.json`).
  * Aplicar as regras visuais e semânticas da iteração SDD 017 aos novos gráficos (Warning em Amarelo, Failed em Vermelho e Broken em Marrom).

---

## 4. Critérios de Aceitação

* **AC-01**: A guia "Graphs" não é mais exibida na barra lateral de navegação do Allure Report.
* **AC-02**: Ao digitar ou acessar a URL com `#graph`, o usuário é redirecionado imediatamente para o Overview (`#`).
* **AC-03**: A página principal de Overview renderiza com sucesso os gráficos de `Status` (`status-chart`), `Severidade` (`severity`) e `Duração` (`duration`).
* **AC-04**: Nenhum widget duplicado é exibido (o gráfico de tendência `history-trend` não é duplicado).
* **AC-05**: As cores e ícones definidos no SDD 017 (Amarelo para Warning, Vermelho para Failed e Marrom para Broken) são preservados nos gráficos migrados.
* **AC-06**: Todos os testes automatizados são executados com 100% de sucesso (`npm test` e `npm run typecheck`).
* **AC-07**: O Princípio I da Constituição (Zero Core Modification em `security-tests/`) é rigorosamente mantido.

