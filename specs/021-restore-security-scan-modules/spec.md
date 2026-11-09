# Especificação: Restauração dos Módulos de Scan e Validação Sintática do Plugin Allure (`021-restore-security-scan-modules`)

## 1. Contexto e Motivação
Na iteração anterior (SDD 020), durante a implementação da formatação de data/hora para o gráfico de Trend (`history-trend`), a inclusão de uma expressão regular com barras invertidas dentro de uma template string TypeScript (`getAllurePluginJs()`) resultou em um erro de escape que gerou `SyntaxError: Unexpected token '{'` quando avaliado no navegador.

Como consequência dessa falha sintática em tempo de carregamento do arquivo `plugin/asvs-pipeline/index.js`:
1. A execução do script do plugin Allure era abortada antes do registro das extensões nativas;
2. A guia **Security Scan (CLI)** (`#security-scan`) — que abriga os controles e seletores dos módulos de varredura (`npm-audit`, `trivy-fs`, `semgrep`, `gitleaks`, `zap`, `odc`, `bandit`, `sonar`) — não era registrada na barra lateral (`allure.api.addTab`);
3. A guia **ASVS v5 Matrix** (`#asvs-matrix`) também era suprimida pelo mesmo motivo;
4. Os testes unitários anteriores verificavam apenas a presença de trechos textuais (`includes`), sem executar a compilação sintática do script gerado via `vm.Script`.

Esta iteração SDD 021 resolve a causa raiz, restabelece a presença integral dos módulos de scan na interface e adiciona uma barreira automatizada de validação sintática nos testes de regressão.

---

## 2. Histórias de Usuário (User Stories)

### US-01: Acesso aos Módulos de Scan no Allure Report
**Como** Analista de Segurança / Engenheiro DevSecOps,  
**Quero** que a guia lateral "Security Scan (CLI)" esteja sempre visível e funcional com todos os seus módulos de escaneamento (`npm-audit`, `trivy-fs`, `semgrep`, `gitleaks`, `zap`, `odc`, `bandit`, `sonar`),  
**Para que** eu possa configurar e disparar varreções de segurança diretamente pelo dashboard Allure.

### US-02: Blindagem Sintática no Pipeline de Build
**Como** Desenvolvedor e Mantenedor do ASAT,  
**Quero** que o conjunto de testes unitários execute a compilação do JavaScript gerado pelo plugin (`vm.Script`),  
**Para que** qualquer erro de sintaxe, interpolação ou escape seja detectado imediatamente durante o `npm test` antes de chegar ao usuário final.

---

## 3. Requisitos Funcionais

* **RF-01: Correção do Parser de Data e Validação no Allure Plugin**
  * Eliminar regex sensível a escape em template string dentro da função `formatTrendDate` em `web-ui/allure-plugin.ts`, adotando verificação determinística de formato (`indexOf('/') === 2 && indexOf(':') !== -1`).
  * Garantir que `getAllurePluginJs()` produza código JavaScript 100% válido e executável por qualquer engine ECMAScript moderna.

* **RF-02: Restauração da Guia Security Scan (CLI) com os 8 Módulos de Varredura**
  * Assegurar que `allure.api.addTab('security-scan', ...)` e `allure.api.addTab('asvs-matrix', ...)` sejam executados e registrados na inicialização do relatório.
  * Garantir a renderização dos 8 módulos de varredura (`npm-audit`, `trivy-fs`, `semgrep`, `gitleaks`, `zap`, `odc`, `bandit`, `sonar`) na grade de ferramentas da guia `#security-scan`.

* **RF-03: Barreira de Testes com Validação Sintática via `vm.Script`**
  * Adicionar asserção em `web-ui/runner.test.ts` compilando `getAllurePluginJs()` com `new vm.Script(js)` dentro de `assert.doesNotThrow`.
  * Assegurar a presença e renderização dos chips e checkboxes de todos os 8 módulos de scan nos testes automatizados.

---

## 4. Critérios de Aceitação

* **AC-01**: O arquivo `plugin/asvs-pipeline/index.js` é servido sem nenhum erro de sintaxe e executa com sucesso no navegador.
* **AC-02**: A guia **Security Scan (CLI)** aparece na barra de navegação lateral com o ícone de escudo (`fa fa-shield`).
* **AC-03**: Ao acessar `#security-scan`, todos os 8 módulos de scan (`npm-audit`, `trivy-fs`, `semgrep`, `gitleaks`, `zap`, `odc`, `bandit`, `sonar`) estão presentes com seus chips e seletores.
* **AC-04**: A guia **ASVS v5 Matrix** aparece normalmente na barra de navegação lateral (`#asvs-matrix`).
* **AC-05**: `npm run typecheck` e `npm test` passam com 100% de sucesso (24/24 testes aprovados).
* **AC-06**: O Princípio I da Constituição (Zero Core Modification) permanece estritamente preservado.
