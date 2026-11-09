# Implementation Plan: Removal of Redundant Categories (`013-remove-categories-redundancy`)

## 1. Arquitetura da Solução

```mermaid
flowchart TD
    A["Allure UI Initialization"] --> B["Plugin JS: Inspeciona allure.api"]
    B --> C["delete allure.api.widgets.widgets.categories<br/>delete allure.api.widgets.graph['categories-trend']"]
    B --> D["Remove 'categories' from allure.api.tabs"]
    A --> E["Plugin CSS: Injeção Instantânea"]
    E --> F[".widget:has(a[href*='categories']) { display: none !important }"]
    E --> G[".side-nav__item:has(a[href*='categories']) { display: none !important }"]
    A --> H["Dynamic Mutator: Remove nós DOM órfãos & intercepta rota"]
    H --> I["Redireciona #categories para #suites"]
```

## 2. Componentes Afetados

1. **`web-ui/allure-plugin.ts`**:
   - Adicionar regras de ocultação CSS em `getAllurePluginCss()`.
   - Adicionar remoção programática de `categories` dos registros da API Allure em `getAllurePluginJs()`.
   - Adicionar supressão contínua no laço `standardizeFindingsTerminology()`.
   - Adicionar listener de redirecionamento de rota para `#categories` $\to$ `#suites`.
2. **`web-ui/runner.test.ts`**:
   - Adicionar teste unitário verificando a presença das regras de supressão de Categories em CSS e JS.
3. **Instalação e Recompilação**:
   - Recompilar e reinstalar o plugin na distribuição Allure via `npm run enrich juice-shop -- --level L1 --clean-history`.
   - Reiniciar o servidor web daemon e validar visualmente.

