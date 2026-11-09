# Tasks: Complete Finding Terminology Standardization across Allure UI (`011-complete-finding-terminology-standardization`)

- [x] **1. Implementação da Substituição Multicamada em `web-ui/allure-plugin.ts`**
  - [x] 1.1 Injetar regra CSS em `getAllurePluginCss()` sobrepondo `.splash__subtitle` com pseudo-elemento `::after { content: "findings" }`.
  - [x] 1.2 Atualizar o interceptador dinâmico em `getAllurePluginJs()` para cobrir `.splash__subtitle`, `.chart__caption-text`, `.popover` e cabeçalhos.
  - [x] 1.3 Adicionar sobrescrita de chaves de tradução i18n (`widget.summary.testResults`, `widget.summary.testResults_plural`).

- [x] **2. Auditoria e Atualização de Referências no Código**
  - [x] 2.1 Verificar e alinhar referências a "test cases" nos arquivos de testes e módulos TS.
  - [x] 2.2 Reinstalar o plugin na distribuição Allure via `installAllureCliPlugin`.

- [x] **3. Testes Automatizados**
  - [x] 3.1 Adicionar teste unitário em `web-ui/runner.test.ts` verificando que o CSS gerado contém a regra de substituição de `.splash__subtitle` para `findings`.
  - [x] 3.2 Rodar `npm test` e `npm run typecheck`.

- [x] **4. Validação Experimental e Visual**
  - [x] 4.1 Recompilar o Allure Report e reiniciar o servidor web.
  - [x] 4.2 Validar via curl e inspeção no navegador que o texto "test cases" abaixo de 136 foi substituído por "findings".
