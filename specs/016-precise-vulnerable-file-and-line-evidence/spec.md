# Spec: Apresentação Precisa do Arquivo e Linha da Vulnerabilidade para Todas as Ferramentas (`016-precise-vulnerable-file-and-line-evidence`)

## Contexto e Problema Identificado
Na visualização dos findings do relatório Allure (ex.: requisito **OWASP ASVS V11.3.1** referente a `pdfkit`/`crypto-js`), a tabela de evidências apresentava a seguinte formatação:
* `📁 Arquivo / Alvo: pdfkit`
* `🔢 Linha no Arquivo: LINHA 42`

Essa disposição gerou ambiguidade e falta de clareza imediata para os engenheiros, pois:
1. `pdfkit` é o nome de um pacote/componente externo, e **não um arquivo de código**.
2. A indicação `Linha no Arquivo: LINHA 42` ficava desassociada do nome do arquivo real ao qual pertencia (que no caso é [`routes/order.ts`](file:///home/user/felipe/speckit/assat/juice-shop/routes/order.ts#L42)).
3. É imperativo que a identificação explícita de **qual é o Arquivo** e **qual é a Linha** esteja presente não apenas para ferramentas de SAST (onde o scanner já fornece naturalmente o arquivo), mas de forma consistente e garantida para **todas as ferramentas** utilizadas no ecossistema (SCA via `npm-audit` e `trivy`, DAST via `zap`, Secret Detection via `gitleaks` e SAST via `semgrep`).

## Requisitos Funcionais

### RF-01: Apresentação Explícita do Arquivo do Código e da Linha no Arquivo
1. A tabela de detalhamento deve separar inequivocamente:
   - **📄 Arquivo no Código**: O caminho do arquivo físico no repositório avaliado onde a vulnerabilidade ou chamada ao componente ocorre (ex.: `routes/order.ts`, `routes/search.ts`, `server.ts`, `config/default.yml`, `package.json`).
   - **🔢 Linha no Arquivo**: A numeração da linha com badge destacado e indicação contextual explícita (ex.: `LINHA 42 (em routes/order.ts)`).
   - **📦 Componente / Pacote Avaliado**: O pacote vulnerável ou endpoint avaliado (ex.: `pdfkit`, `jsonwebtoken`, `http://172.17.0.1:3000`).
   - **📋 Manifesto de Dependência**: O arquivo de manifesto e linha de declaração (ex.: `package.json:139`).

### RF-02: Resolução Universal do Arquivo para Todas as Ferramentas da Aplicação
1. **SCA (`npm-audit` e `trivy`)**:
   - Se houver chamador do pacote no código da aplicação (`routes/`, `lib/`, `models/`, `data/`), o `sourceFile` deve ser o arquivo do código (ex.: `routes/order.ts`) e `line` a linha do import/uso (ex.: `42`).
   - Se a dependência for apenas declarada no manifesto, `sourceFile` deve ser `package.json` (ou `package-lock.json`) e `line` a linha da declaração.
2. **SAST (`semgrep` / `njsscan` / `bandit`)**:
   - `sourceFile` deve ser o arquivo fonte sob análise (ex.: `routes/search.ts`) e `line` a linha identificada pela regra estática.
3. **DAST (`OWASP ZAP`)**:
   - `sourceFile` deve correlacionar o endpoint de tempo de execução com o arquivo de rota ou configuração de middleware no backend (ex.: `/rest/user/login` -> `routes/login.ts` ou `server.ts`; headers globais de CORS/CSP -> `server.ts:184` ou `server.ts:187`).
   - `line` deve apontar para a definição da rota ou middleware em `server.ts` ou `routes/*.ts`.
   - `runtimeEndpoint` deve manter o endpoint e método HTTP em execução.
4. **Secret Detection (`gitleaks`)**:
   - `sourceFile` deve ser o arquivo do segredo (ex.: `config/default.yml`) e `line` a linha de exposição da chave.

### RF-03: Parâmetros e Árvore de Suites Padronizados no Allure
1. Atualizar a lista de parâmetros Allure (`data.parameters`) com:
   - `Source File`: `routes/order.ts` (ou arquivo equivalente)
   - `Line Number`: `42`
   - `Target Component`: `pdfkit`
   - `Tool`: Nome da ferramenta
   - `Manifest File`: `package.json:139` (quando aplicável)
2. Atualizar o nome do item na árvore de Suites (`data.name`) para sempre incluir o arquivo e linha: `[routes/order.ts:42] pdfkit (Fixed: 0.20.2)`.

## Critérios de Aceitação
- **AC-01**: No finding `V11.3.1` (pdfkit), o cartão deve exibir explicitamente `📄 Arquivo no Código: routes/order.ts` e `🔢 Linha no Arquivo: LINHA 42 (em routes/order.ts)`, além de `📦 Componente / Pacote: pdfkit` e `📋 Manifesto: package.json:139`.
- **AC-02**: Todas as ferramentas ativas (SAST, SCA, DAST, Secrets) devem ter `sourceFile` e `line` devidamente preenchidos e exibidos de forma consistente.
- **AC-03**: Nenhuma alteração nos arquivos originais do pipeline (`security-tests/` ou `shared-*.json`), respeitando estritamente o Princípio I da Constituição.
- **AC-04**: Suíte de testes automatizados (`npm test`) com cobertura para todas as ferramentas, aprovada com 100% de sucesso.
- **AC-05**: Verificação de tipos estrita do TypeScript (`npm run typecheck`) sem advertências ou erros.

