# Tasks: Removal of Redundant Categories (`013-remove-categories-redundancy`)

- [x] **1. Implementação em `web-ui/allure-plugin.ts`**
  - [x] 1.1 Inserir regras CSS em `getAllurePluginCss()` para suprimir o widget `.widget:has(a[href*="categories"])` e o item da side-nav `.side-nav__item:has(a[href*="categories"])`.
  - [x] 1.2 Inserir remoção de `categories` de `allure.api.widgets` e `allure.api.tabs` em `getAllurePluginJs()`.
  - [x] 1.3 Adicionar interceptação e redirecionamento de rota de `#/categories` para `#/suites`.
  - [x] 1.4 Adicionar varredura de nós de Categories no laço periódico de sanitização.

- [x] **2. Testes Automatizados**
  - [x] 2.1 Adicionar teste em `web-ui/runner.test.ts` validando a presença da regra de supressão de Categories no CSS e JS do plugin Allure.
  - [x] 2.2 Executar `npm test` e `npm run typecheck`.

- [x] **3. Validação Experimental**
  - [x] 3.1 Executar `npm run enrich juice-shop -- --level L1 --clean-history` para reinstalar o plugin e regenerar o relatório.
  - [x] 3.2 Reiniciar o servidor web e verificar que o widget e a aba Categories não são mais exibidos.
