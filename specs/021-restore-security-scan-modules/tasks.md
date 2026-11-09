# Tarefas da Iteração: Restauração dos Módulos de Scan e Validação Sintática (`021-restore-security-scan-modules`)

- [x] **1. Especificação e Configuração**
  - [x] 1.1 Criar diretório `specs/021-restore-security-scan-modules/`
  - [x] 1.2 Redigir `spec.md` com diagnóstico detalhado e histórias de usuário
  - [x] 1.3 Redigir `plan.md` com estratégia arquitetural
  - [x] 1.4 Atualizar `.specify/feature.json`

- [x] **2. Correção de Sintaxe e Validação no Allure Plugin**
  - [x] 2.1 Substituir expressão regular de formatação de data por verificação determinística imune a escape em `web-ui/allure-plugin.ts`
  - [x] 2.2 Reinstalar arquivos estáticos do plugin Allure (`plugin/asvs-pipeline/index.js` e `styles.css`)
  - [x] 2.3 Reiniciar processo daemon do servidor `web-ui/server.ts`

- [x] **3. Testes Automatizados e Blindagem**
  - [x] 3.1 Adicionar teste de compilação via `vm.Script` em `web-ui/runner.test.ts`
  - [x] 3.2 Adicionar verificação explícita dos 8 módulos de scan nos testes unitários
  - [x] 3.3 Executar `npm run typecheck` e `npm test` verificando aprovação total (24/24)
  - [x] 3.4 Validar via requisição HTTP que `plugin/asvs-pipeline/index.js` compila sem erros
