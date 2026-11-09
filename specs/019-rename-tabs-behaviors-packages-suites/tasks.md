# Tasks: Renomeação das Guias de Navegação de Findings (`019-rename-tabs-behaviors-packages-suites`)

- [x] **1. Implementação das Traduções e Rótulos no Plugin Allure (`web-ui/allure-plugin.ts`)**
  - [x] 1.1 Injetar traduções para `tab.behaviors.name` e `widget.behaviors.name` como `"Findings by Tools"`.
  - [x] 1.2 Injetar traduções para `tab.packages.name` como `"Findings List"`.
  - [x] 1.3 Injetar traduções para `tab.suites.name` e `widget.suites.name` como `"Findings by Requirements"`.
  - [x] 1.4 Aplicar as traduções em todos os idiomas suportados pelo Allure para consistência global.
  - [x] 1.5 Implementar rotina defensiva no DOM para sincronização contínua de rótulos e tooltips no SideNav.

- [x] **2. Testes Automatizados e Verificação**
  - [x] 2.1 Adicionar teste unitário em `web-ui/runner.test.ts` verificando as novas traduções e a rotina de renomeação.
  - [x] 2.2 Executar `npm test` e `npm run typecheck` garantindo 100% de aprovação.

- [x] **3. Validação Experimental e Re-Deploy**
  - [x] 3.1 Instalar os novos assets do plugin Allure (`installAllureCliPlugin`).
  - [x] 3.2 Reiniciar o servidor daemon (`web-ui/server.ts`).
  - [x] 3.3 Validar a entrega dos assets e inspecionar a interface no navegador.
