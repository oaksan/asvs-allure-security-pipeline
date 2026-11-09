# Tasks: Evidência Precisa de Localização na Aplicação (`015-precise-application-location-evidence`)

- [x] **1. Expansão do Indexador de Relatórios e Localizador de Código (`web-ui/enricher.ts`)**
  - [x] 1.1 Indexar `npm-audit.json` em `loadRawReportsIndex`: mapear vulnerabilidades diretas, transitivas (`via`), títulos de advisories, CVE/GHSA, CWEs e versões de correção.
  - [x] 1.2 Indexar `zap-report.json` em `loadRawReportsIndex`: mapear alertas, instâncias de endpoints (`uri`), métodos HTTP, parâmetros, evidências e soluções.
  - [x] 1.3 Implementar função `findApplicationCallers(workspaceDir, repoName, pkgName)` para localizar declarações em `package.json` e importações em rotas/código-fonte (`routes/`, `lib/`, `server.ts`).
  - [x] 1.4 Implementar função `readSourceSnippet(workspaceDir, repoName, targetFile, line)` para extrair contexto de código com indicador `>` e numeração de linha.
  - [x] 1.5 Atualizar `resolveFindingLocation` para integrar as novas evidências (chamadores de pacotes, causa transitiva/CWE, trecho de código com gutter, endpoints DAST).
  - [x] 1.6 Atualizar `data.parameters` no Allure com metadados estruturados (`Location`, `Line`, `Tool`, `Remediation`, `Advisory`, `App Caller`, `Dependency Path`).
  - [x] 1.7 Aprimorar o cartão HTML `asvs-remediation-box` em `descriptionHtml` com seções claras para código-fonte, cadeia de dependência, evidência de execução e solução recomendada.

- [x] **2. Testes Automatizados**
  - [x] 2.1 Criar testes em `web-ui/enricher.test.ts` cobrindo indexação de `npm-audit`, localização de callers na aplicação, extração de código e evidência de runtime ZAP.
  - [x] 2.2 Executar `npm test` e `npm run typecheck` e garantir aprovação integral (16/16 testes passando).

- [x] **3. Validação Experimental e Visual**
  - [x] 3.1 Executar `npm run enrich juice-shop -- --level L1 --clean-history` para reprocessar os achados do Juice Shop.
  - [x] 3.2 Verificar o arquivo de resultado de `V11.3.1` (pdfkit/crypto-js) e confirmar a presença de `routes/order.ts:42`, `package.json:139` e detalhes do advisory CWE-327.
  - [x] 3.3 Reiniciar o servidor web daemon e inspecionar a interface Allure em `http://127.0.0.1:8765/#suites`.
