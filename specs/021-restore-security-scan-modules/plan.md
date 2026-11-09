# Plano de Implementação: Restauração dos Módulos de Scan e Validação Sintática (`021-restore-security-scan-modules`)

## 1. Diagnóstico da Causa Raiz
Na iteração SDD 020, ao adicionar a lógica de formatação de data para o gráfico de Trend em `web-ui/allure-plugin.ts`, a expressão regular:
```javascript
if (typeof val === 'string' && /^\d{2}\/\d{2}\/\d{4}\s\d{2}:\d{2}$/.test(val.trim()))
```
estava contida em uma template string delimitada por crases (`` `...` ``). Durante a avaliação do arquivo TypeScript, caracteres como `\/` foram interpretados pelo compilador de strings, resultando em:
```javascript
if (typeof val === 'string' && /^d{2}/d{2}/d{4}sd{2}:d{2}$/.test(val.trim()))
```
Essa saída foi interpretada pelo JavaScript do navegador como operador de divisão após a regex `/^d{2}/`, seguido por `{2}`, gerando um erro fatal `SyntaxError: Unexpected token '{'`. Com a falha sintática, a execução de todo o arquivo `asvs-pipeline/index.js` foi interrompida, impedindo a execução de `allure.api.addTab('security-scan')` e `allure.api.addTab('asvs-matrix')`.

---

## 2. Arquitetura da Solução

### 2.1 Correção Determinística em `allure-plugin.ts`
Substituir a regex no código do cliente por checagem determinística de posição de caracteres e tamanho, imune a problemas de escape em strings:
```javascript
if (typeof val === 'string' && val.indexOf('/') === 2 && val.indexOf(':') !== -1) {
  return val.trim();
}
```

### 2.2 Reinstalação dos Arquivos Estáticos do Plugin
Reexecutar `installAllureCliPlugin(process.cwd())` para regenerar os arquivos em `allure-report/juice-shop/plugin/asvs-pipeline/` e sincronizar com o servidor web.

### 2.3 Barreira Defensiva Automatizada em `runner.test.ts`
Incluir no arquivo de testes `web-ui/runner.test.ts` a compilação do script com `new vm.Script(js)` e a asserção explícita da presença dos 8 módulos de escaneamento:
- `npm-audit`
- `trivy-fs`
- `semgrep`
- `gitleaks`
- `zap`
- `odc`
- `bandit`
- `sonar`

---

## 3. Fases de Execução
1. Atualizar `.specify/feature.json` para `"specs/021-restore-security-scan-modules"`.
2. Validar sintaxe em runtime com `vm.Script`.
3. Executar `npm run typecheck` e `npm test`.
4. Reinstalar plugin Allure e reiniciar servidor daemon se necessário.
5. Marcar tarefas em `tasks.md`.
