# Plano Técnico: Remoção da Guia Graphs e Migração de Gráficos para o Overview (`018-move-graphs-to-overview-and-remove-tab`)

## 1. Arquitetura e Fluxo de Dados

A arquitetura de plugins do Allure Report desacopla a definição de abas (`tabs`), a coleção de widgets (`allure.api.widgets`) e as visualizações em grade (`WidgetsView`).

```mermaid
flowchart TD
    subgraph Inicialização Nativa Allure (app.js)
        A["allure.api.widgets.graph"] -->|status-chart, severity, duration, trends| B["Coleção Graphs"]
        C["allure.api.widgets.widgets"] -->|summary, suites, environment, executors| D["Coleção Overview"]
    end
    subgraph Plugin ASVS (web-ui/allure-plugin.ts)
        B -->|Filtro: apenas novos e não-redundantes| E["Migração Dinâmica"]
        E -->|Injeta status-chart, severity, duration| D
        F["Remoção de aba graph de allure.api.tabs"]
        G["CSS: Oculta .side-nav__item para graph"]
        H["Redirect: #graph -> #"]
    end
    subgraph Renderização do Overview
        D --> I["WidgetsView (Grid de 2 Colunas)"]
        I --> J["Painel Overview Unificado com Gráficos Analíticos"]
    end
```

### Detalhes de Integração no Plugin Allure ([`web-ui/allure-plugin.ts`](file:///home/user/felipe/speckit/assat/web-ui/allure-plugin.ts))

1. **Supressão da Guia Graphs via CSS**:
   ```css
   /* Remove Graphs Tab from Sidebar (SDD 018) */
   .side-nav__item:has(a[href*="graph"]),
   .side-nav__item[data-tooltip*="Graphs"],
   .side-nav__item[data-tooltip*="Gráficos"],
   a.side-nav__link[href*="graph"] {
     display: none !important;
   }
   ```

2. **Remoção de Aba e Redirecionamento de Rota em JS**:
   ```javascript
   if (Array.isArray(allure.api.tabs)) {
     var graphTabIdx = allure.api.tabs.findIndex(function (t) {
       return t && (t.tabName === 'graph' || (t.options && t.options.route === 'graph'));
     });
     if (graphTabIdx !== -1) {
       allure.api.tabs.splice(graphTabIdx, 1);
     }
   }
   if (window.location.hash.indexOf('#graph') === 0) {
     window.location.hash = '#';
   }
   window.addEventListener('hashchange', function () {
     if (window.location.hash.indexOf('#graph') === 0) {
       window.location.hash = '#';
     }
   });
   ```

3. **Migração Seletiva de Widgets de Gráfico**:
   ```javascript
   if (allure.api.widgets && allure.api.widgets.graph && allure.api.widgets.widgets) {
     var graphWidgets = allure.api.widgets.graph;
     var overviewWidgets = allure.api.widgets.widgets;
     var chartsToMove = ['status-chart', 'severity', 'duration'];
     chartsToMove.forEach(function (name) {
       if (graphWidgets[name] && !overviewWidgets[name]) {
         overviewWidgets[name] = graphWidgets[name];
       }
     });
   }
   ```

4. **Auto-descoberta pelo Layout Nativo do Allure**:
   No arquivo `app.js`, a classe `WidgetsView` executa:
   ```javascript
   Object.keys(this.widgets).forEach(function(t) {
     e.every(function(e) { return -1 === e.indexOf(t); }) &&
     e.reduce(function(t, e) { return e.length < t.length ? e : t; }).push(t);
   });
   ```
   Dessa forma, qualquer novo widget inserido em `allure.api.widgets.widgets` é automaticamente adicionado à coluna mais curta da grade de Overview, sem necessidade de hacks ou sobrescritas manuais de template HTML.

---

## 2. Conformidade com a Constituição

* **Princípio I (Zero Core Modification)**: Nenhuma alteração nos scripts `security-tests/run_security_scans.sh`, conversores ou tabelas de mapeamento.
* **Princípio IV (Canonical Pipeline Outputs)**: Os dados consumidos pelos gráficos são os arquivos JSON gerados pelo próprio Allure CLI em `allure-report/<repo>/widgets/*.json`.
* **Princípio V (Stack Nativa)**: Implementação em TypeScript/JavaScript nativo já suportado pelo ecossistema do wrapper.

