# Plano Técnico: Renomeação das Guias de Navegação de Findings (`019-rename-tabs-behaviors-packages-suites`)

## 1. Arquitetura e Mecanismo de Tradução do Allure Report

O Allure Report utiliza o framework `i18next` integrado via `allure.api.addTranslation(language, translations)` e componentes Backbone/Marionette para renderização de abas e árvores.

```mermaid
flowchart TD
    subgraph Registro de Plugins e Abas
        A["app.js: addTab('suites', { title: 'tab.suites.name' })"]
        B["plugin/behaviors: addTab('behaviors', { title: 'tab.behaviors.name' })"]
        C["plugin/packages: addTab('packages', { title: 'tab.packages.name' })"]
    end
    subgraph Plugin ASVS (allure-plugin.ts)
        D["allure.api.addTranslation (en, br, etc.)"]
        D -->|tab.behaviors.name| E["'Findings by Tools'"]
        D -->|tab.packages.name| F["'Findings List'"]
        D -->|tab.suites.name / widget.suites.name| G["'Findings by Requirements'"]
        H["Defensive DOM Sync"] -->|Garante consistência pós-render| I["SideNav & Tree Headers"]
    end
    subgraph Interface de Usuário
        E --> J["Menu Lateral: Findings by Tools / Cabeçalho #behaviors"]
        F --> K["Menu Lateral: Findings List / Cabeçalho #packages"]
        G --> L["Menu Lateral: Findings by Requirements / Cabeçalho #suites / Overview Widget"]
    end
```

### Detalhes Técnicos de Implementação ([`web-ui/allure-plugin.ts`](file:///home/user/felipe/speckit/assat/web-ui/allure-plugin.ts))

1. **Injeção de Traduções Abrangentes**:
   ```javascript
   var ALLURE_LANGS = ['en', 'br', 'ru', 'zh', 'de', 'nl', 'he', 'ja', 'es', 'kr', 'fr', 'pl', 'az', 'sv', 'isv'];

   ALLURE_LANGS.forEach(function (lang) {
     allure.api.addTranslation(lang, {
       tab: {
         behaviors: { name: 'Findings by Tools' },
         packages: { name: 'Findings List' },
         suites: { name: 'Findings by Requirements' }
       },
       widget: {
         suites: { name: 'Findings by Requirements' },
         behaviors: { name: 'Findings by Tools' }
       }
     });
   });
   ```

2. **Sincronização Defensiva no DOM (Fallback Garantido)**:
   Para assegurar que qualquer renderização tardia ou comportamento de cache preserve os rótulos solicitados:
   ```javascript
   function updateTabLabels() {
     var mappings = [
       { href: 'behaviors', label: 'Findings by Tools' },
       { href: 'packages', label: 'Findings List' },
       { href: 'suites', label: 'Findings by Requirements' }
     ];
     mappings.forEach(function (m) {
       var links = document.querySelectorAll('a.side-nav__link[href*="' + m.href + '"]');
       links.forEach(function (link) {
         var textEl = link.querySelector('.side-nav__text');
         if (textEl && textEl.textContent !== m.label) {
           textEl.textContent = m.label;
         }
         var item = link.closest('.side-nav__item');
         if (item && item.getAttribute('data-tooltip') !== m.label) {
           item.setAttribute('data-tooltip', m.label);
         }
       });
     });
   }
   ```

---

## 2. Conformidade com a Constituição

* **Princípio I (Zero Core Modification)**: Nenhuma alteração nos scripts `security-tests/run_security_scans.sh`, conversores ou tabelas de mapeamento normativo.
* **Princípio IV (Canonical Pipeline Outputs)**: As abas continuam consumindo os dados canônicos (`data/suites.json`, `data/behaviors.json`, `data/packages.json`) inalterados.
* **Princípio V (Stack Nativa)**: Solução 100% contida no wrapper TypeScript/JavaScript do plugin nativo do Allure.

