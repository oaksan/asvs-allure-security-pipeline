# Tasks: Apresentação Precisa do Arquivo e Linha da Vulnerabilidade (`016-precise-vulnerable-file-and-line-evidence`)

- [x] **1. Estruturação e Resolução de Localização Universal (`web-ui/enricher.ts`)**
  - [x] 1.1 Atualizar `FindingLocationDetails` adicionando explicitamente `sourceFile`, `targetComponent` e `manifestFile`.
  - [x] 1.2 Atualizar `resolveFindingLocation` para determinar `sourceFile` e `line` para todas as ferramentas (SAST, SCA, DAST, Secrets):
    - [x] 1.2.1 SAST (`semgrep`): `sourceFile` = arquivo do código, `line` = linha do achado.
    - [x] 1.2.2 SCA (`npm-audit` & `trivy`): derivar `sourceFile` do chamador de código (`routes/order.ts`) e `manifestFile` (`package.json:139`), com a respectiva `line`.
    - [x] 1.2.3 DAST (`zap`): correlacionar rotas e headers globais a `server.ts` e arquivos de rota correspondentes com a respectiva `line` do middleware/express.
    - [x] 1.2.4 Secrets (`gitleaks`): `sourceFile` = arquivo do segredo, `line` = linha da exposição.
  - [x] 1.3 Atualizar a tabela visual em `asvs-remediation-box` (`descriptionHtml`) para exibir `📄 Arquivo no Código`, `🔢 Linha no Arquivo` com sufixo `(em <sourceFile>)`, `📦 Componente / Alvo` e `📋 Manifesto de Pacote`.
  - [x] 1.4 Atualizar `data.parameters` no Allure com `Source File`, `Line Number`, `Target Component`, `Manifest File`.
  - [x] 1.5 Atualizar `data.name` para refletir `[sourceFile:line] component`.

- [x] **2. Testes Automatizados**
  - [x] 2.1 Adicionar casos de teste em `web-ui/enricher.test.ts` cobrindo a resolução de `sourceFile` e `line` para SAST, SCA, DAST e Secrets.
  - [x] 2.2 Executar `npm test` e `npm run typecheck` e garantir aprovação integral.

- [x] **3. Validação Experimental e Visual**
  - [x] 3.1 Executar `npm run enrich juice-shop -- --level L1 --clean-history` para reprocessar os achados do Juice Shop.
  - [x] 3.2 Verificar o arquivo de resultado de `V11.3.1` (pdfkit) e confirmar `sourceFile: 'routes/order.ts'`, `line: 42`, `manifestFile: 'package.json:139'`.
  - [x] 3.3 Confirmar que achados de SAST, SCA e DAST possuem seus respectivos arquivos e linhas claramente exibidos.
  - [x] 3.4 Reiniciar o servidor web daemon e inspecionar a interface Allure em `http://127.0.0.1:8765/#suites`.

