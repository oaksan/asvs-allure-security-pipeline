# Tasks: Precise Finding Location & Remediation Context (`014-precise-finding-location-and-remediation`)

- [x] **1. Implementação do Indexador de Relatórios e Extrator de Localização (`web-ui/enricher.ts`)**
  - [x] 1.1 Criar função `loadRawReportsIndex(workspaceDir)` para ler Semgrep, Trivy, Gitleaks e npm-audit.
  - [x] 1.2 Criar função `resolveFindingLocation(data, index)` para derivar arquivo, linha, trecho de código, versão de correção e guia prático.
  - [x] 1.3 Atualizar `data.name` para incluir prefixo `[arquivo:linha]` ou `[alvo] pacote (Fixed: versão)`.
  - [x] 1.4 Preencher `data.parameters` com as chaves nativas do Allure (`Location`, `Line`, `Tool`, `Remediation`, `Component`).
  - [x] 1.5 Inserir o cartão visual `📍 Localização & Guia de Correção` em `data.descriptionHtml`.
  - [x] 1.6 Garantir restauração de `.non-l1-backup` no início de `enrichAllureResultsDir` para idempotência.

- [x] **2. Testes Automatizados**
  - [x] 2.1 Adicionar testes em `web-ui/enricher.test.ts` validando a geração de nome com localização, preenchimento de `parameters` e injeção do cartão de remediação.
  - [x] 2.2 Executar `npm test` e `npm run typecheck`.

- [x] **3. Validação Experimental e Visual**
  - [x] 3.1 Executar `npm run enrich juice-shop -- --level L1 --clean-history` para reprocessar todos os achados do Juice Shop.
  - [x] 3.2 Iniciar o servidor web daemon e inspecionar a aba Suites e o painel de detalhes no navegador.
