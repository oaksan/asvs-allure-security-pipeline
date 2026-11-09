# Feature Specification: Granular OWASP ASVS v5.0.0 Requirement (`req_id`) Evaluation & Canonical 345-Item Catalog Integration (`006-asvs-v5-req-granularity`)

**Feature Branch**: `006-asvs-v5-req-granularity`  
**Created**: 2026-11-03  
**Status**: Approved  
**Input**: User request: *"vamos fazer toda a documentacao com rigor de mestrado diretamente nas iteracoes do sdd. na iteracao 006, por favor considere o arquivo no csv com os 345 req_id como a base do asvs 5. por favor altere a avaliação do assat de section_id para req_id, explicando inclusive por que foi feita a alteracao e porque a abordagem mais granular por req_id é melhor."*

---

## 1. Fundamentação Científica e Análise Crítica do Baseline (`upstream/main`)

### 1.1 A Base Canônica do Padrão OWASP ASVS 5.0.0 (`docs/OWASP_Application_Security_Verification_Standard_5.0.0_en.csv`)

O padrão **OWASP Application Security Verification Standard (ASVS) v5.0.0** estrutura suas verificações de segurança em uma taxonomia estritamente hierárquica de três níveis, consolidada no arquivo canônico [`docs/OWASP_Application_Security_Verification_Standard_5.0.0_en.csv`](file:///home/user/felipe/speckit/assat/docs/OWASP_Application_Security_Verification_Standard_5.0.0_en.csv):

1. **Capítulo (`chapter_id` / `chapter_name`)**: **17 capítulos** (`V1` a `V17`), representando grandes domínios arquiteturais de segurança da informação.
2. **Seção (`section_id` / `section_name`)**: **80 seções** (`V1.1` a `V17.3`), agrupando famílias temáticas de controles dentro de cada capítulo.
3. **Requisito Atômico de Verificação (`req_id` / `req_description` / `L`)**: **345 requisitos individuais** (`V1.1.1` a `V17.3.2`), onde cada item define um critério binário, testável e auditável, acompanhado de seu **Nível de Verificação Oficial (`L`)**:
   - **Nível 1 (`L1`)**: **70 requisitos** (20,29% do total) — higiene básica e controles essenciais contra vulnerabilidades exploráveis remotamente.
   - **Nível 2 (`L2`)**: **183 requisitos** (53,04% do total) — defesa em profundidade recomendada para a maioria das aplicações que lidam com dados sensíveis.
   - **Nível 3 (`L3`)**: **92 requisitos** (26,67% do total) — garantia máxima para aplicações críticas de alta segurança.

| Capítulo (`chapter_id`) | Nome Oficial (`chapter_name`) | Nº de Seções (`section_id`) | Nº de Requisitos (`req_id`) | Coberto no `shared-asvs-map.json` Original? |
| :--- | :--- | :---: | :---: | :---: |
| **V1** | Encoding and Sanitization | 5 | 30 | Parcial (3/5 seções: `V1.2`, `V1.3`, `V1.5`) |
| **V2** | Validation and Business Logic | 4 | 13 | Parcial (1/4 seções: `V2.4`) |
| **V3** | Web Frontend Security | 7 | 31 | Parcial (2/7 seções: `V3.4`, `V3.5`) |
| **V4** | API and Web Service | 4 | 16 | **Não (0/4 seções)** |
| **V5** | File Handling | 4 | 13 | Parcial (1/4 seções: `V5.2`) |
| **V6** | Authentication | 8 | 47 | Parcial (3/8 seções: `V6.2`, `V6.3`, `V6.4`) |
| **V7** | Session Management | 6 | 19 | **Não (0/6 seções)** |
| **V8** | Authorization | 4 | 13 | Parcial (2/4 seções: `V8.2`, `V8.3`) |
| **V9** | Self-contained Tokens | 2 | 7 | **Não (0/2 seções)** |
| **V10** | OAuth and OIDC | 7 | 36 | **Não (0/7 seções)** |
| **V11** | Cryptography | 7 | 24 | Parcial (2/7 seções: `V11.2`, `V11.3`) |
| **V12** | Secure Communication | 3 | 12 | Parcial (1/3 seções: `V12.2`) |
| **V13** | Configuration | 4 | 21 | Parcial (2/4 seções: `V13.1`, `V13.3`) |
| **V14** | Data Protection | 3 | 13 | Parcial (1/3 seções: `V14.2`) |
| **V15** | Secure Coding and Architecture | 4 | 21 | Parcial (2/4 seções: `V15.2`, `V15.3`) |
| **V16** | Security Logging and Error Handling | 5 | 17 | **Não (0/5 seções)** |
| **V17** | WebRTC | 3 | 12 | **Não (0/3 seções)** |
| **TOTAL** | **17 Capítulos** | **80 Seções** | **345 Requisitos (`req_id`)** | **Apenas 20/80 seções (25%) e 0/345 `req_id`** |

---

### 1.2 Problemas Metodológicos da Abordagem Original por `section_id`

No projeto original ([`shared-asvs-map.json`](file:///home/user/felipe/speckit/assat/shared-asvs-map.json) e [`security-tests/parsers/asvs-unified-to-allure.ts`](file:///home/user/felipe/speckit/assat/security-tests/parsers/asvs-unified-to-allure.ts)), o mapeamento de vulnerabilidades estacionou no **2º nível hierárquico (`section_id`, ex: `V1.2`, `V3.4`, `V15.2`)**. A análise empírica conduzida sobre o estudo de caso `juice-shop` revelou **quatro falhas metodológicas graves** decorrentes do uso exclusivo de `section_id`:

#### Problema 1: Perda de Rastreabilidade Semântica e Colisão de Vulnerabilidades Ortogonais (*Coarse-Grained Aggregation Bias*)
Ao mapear achados apenas para `section_id`, vulnerabilidades de naturezas técnicas completamente distintas colidem sob um mesmo identificador:
- Na seção **`V1.2` (*Injection Prevention*, 10 requisitos no CSV)**: falhas de *Cross-Site Scripting (XSS)* (`V1.2.1`), *Open Redirect / Dynamic URL Encoding* (`V1.2.2`), *SQL/NoSQL Injection* (`V1.2.4`) e *OS Command Injection* (`V1.2.5`) recebem todas o mesmo rótulo `V1.2`.
- Na seção **`V3.4` (*Browser Security Mechanism Headers*, 8 requisitos no CSV)**: ausências de *HSTS* (`V3.4.1`), *CORS mal configurado* (`V3.4.2`), *CSP ausente* (`V3.4.3`), *X-Content-Type-Options: nosniff* (`V3.4.4`), *Frame-Ancestors / X-Frame-Options* (`V3.4.6`) e *Cross-Origin-Embedder-Policy (COEP)* (`V3.4.8`) ficam indistinguíveis sob `V3.4`.

#### Problema 2: Distorção Epistemológica dos Níveis de Maturidade ASVS (`L1`, `L2`, `L3`)
No OWASP ASVS 5.0.0, **seções (`section_id`) não possuem nível próprio**; o nível (`L1`, `L2` ou `L3`) é atributo exclusivo de cada requisito atômico (`req_id`). Como o [`shared-asvs-map.json`](file:///home/user/felipe/speckit/assat/shared-asvs-map.json) atribuiu níveis estáticos às seções, ele introduziu **falsos positivos de conformidade L1** em seções que **não possuem nenhum requisito L1** no padrão oficial:
- **`V2.4` (*Anti-automation*)**: No CSV oficial, contém apenas `V2.4.1` (**L2**) e `V2.4.2` (**L3**). No `shared-asvs-map.json`, estava rotulado como `["L1"]`.
- **`V6.4` (*Authentication Factor Lifecycle and Recovery*)**: No CSV para recuperação de senha (`V6.4.3`..`V6.4.6`), os itens são **L2**. No `shared-asvs-map.json`, recebeu `["L1", "L2"]`.
- **`V11.2` (*Secure Cryptography Implementation*)**: No CSV oficial, possui 5 requisitos (`V11.2.1` a `V11.2.5`), todos de nível **L2** ou **L3** (nenhum L1). No `shared-asvs-map.json`, recebeu `["L1", "L2"]`.
- **`V13.1` (*Configuration Documentation*)**: No CSV oficial (`V13.1.1` a `V13.1.4`), existem apenas requisitos **L2** e **L3**. No `shared-asvs-map.json`, recebeu `["L1"]`.
- **`V13.3` (*Secret Management*)**: No CSV oficial (`V13.3.1` a `V13.3.4`), existem apenas requisitos **L2** e **L3**. No `shared-asvs-map.json`, recebeu `["L1", "L2"]`.

#### Problema 3: Falsos Fallbacks em Scanners SAST e SCA (`V15.3` e `V13.1`)
A inspeção do parser original [`asvs-unified-to-allure.ts`](file:///home/user/felipe/speckit/assat/security-tests/parsers/asvs-unified-to-allure.ts) demonstrou duas limitações técnicas que agravavam a perda de precisão por seção:
1. **No Semgrep (`parseSemgrep`, linhas 696–705)**: O código original verifica apenas `typeof md.cwe === 'string'`. Contudo, rulesets modernos do Semgrep (`p/owasp-top-ten`) exportam `metadata.cwe` como um **array de strings** (ex: `["CWE-89: Improper Neutralization..."]`). Como `typeof md.cwe === 'string'` avalia para `false`, `cweNumber` tornava-se `null` e **42 achados críticos de SQL Injection (`express-sequelize-injection`), Command Injection (`run-shell-injection`), Eval (`code-string-concat`), CORS (`express_cors`), Path Traversal (`express-res-sendfile`) e Hardcoded JWT Secret (`hardcoded-jwt-secret`) caíam todos no fallback genérico `V15.3` (*Defensive Coding*)**.
2. **No Trivy (`parseTrivy`, linha 561 e `applyAsvsLabels`, linha 355)**: Ao escanear `package-lock.json`, o Trivy define `res.Type = "npm"` (e não `"VULNERABILITY"`). Quando o CVE de um pacote NPM não possuía um dos 26 CWEs listados manualmente em `shared-asvs-map.json`, o achado caía no fallback `trivy.default = V13.1` (*Configuration Documentation*) em vez de `V15.2.1` (*Security Architecture and Dependencies*).

#### Problema 4: Omissão de Capítulos Relevantes Detectados pelos Scanners (`V9` e `V16`)
Mesmo quando os scanners detectavam vulnerabilidades claras em **Tokens JWT** (`jsonwebtoken`, `jws.verify()` $\rightarrow$ Capítulo `V9: Self-contained Tokens`, `V9.1.1`) ou em **Logs e Tratamento de Erros** (`AWS-0017` Log group unencrypted $\rightarrow$ `V16.4.2`; `generic_error_disclosure` stack traces $\rightarrow$ `V16.5.1`), o mapeamento estático por `section_id` os descartava em categorias genéricas (`V13.1` ou `V15.3`), fazendo parecer que os capítulos `V9` e `V16` tinham zero achados.

---

### 1.3 Justificativa Científica: Por que a Avaliação por `req_id` é Superior à Avaliação por `section_id`

| Dimensão de Análise | Abordagem por `section_id` (2 dígitos: `V#.#`) | Abordagem Granular por `req_id` (3 dígitos: `V#.#.#`) | Ganho Metodológico para a Dissertação |
| :--- | :--- | :--- | :--- |
| **Unidade de Auditoria** | Agrupamento temático amplo (80 seções) | Requisito verificável atômico (**345 `req_id`**) | Conformidade 1:1 com o formato oficial de auditoria OWASP ASVS 5.0.0. |
| **Fidelidade de Nível (`L1`/`L2`/`L3`)** | Aproximada e sujeita a falsos L1 | **100% exata** (extraída diretamente da coluna `L` do CSV oficial) | Elimina distorções estatísticas ao medir aderência ao nível L1, L2 ou L3. |
| **Poder Discriminante (Caso `juice-shop`)** | Apenas **9 seções** genéricas reportadas | **35 requisitos (`req_id`) específicos** em **25 seções** e **11 capítulos** | Aumento de **3,88×** na resolução diagnóstica sobre os mesmos artefatos brutos. |
| **Preservação Hierárquica** | Perde o nível inferior (`req_id`) | Mantém `req_id` $\subset$ `section_id` $\subset$ `chapter_id` | Permite tanto o *drill-down* ao requisito exato quanto o *roll-up* por seção e capítulo sem perda de informação. |
| **Aderência à Constituição (Princípio I)** | Implementada estaticamente em `shared-asvs-map.json` | Resolvida dinamicamente em `web-ui/asvs-catalog.ts` sobre o CSV oficial | Preserva 100% dos arquivos originais upstream intocados (`git status -uno` limpo). |

---

## 2. User Scenarios & Testing *(mandatory)*

### User Story 1 - Catálogo Canônico dos 345 `req_id` do OWASP ASVS 5.0.0 como Base de Avaliação (Priority: P1)

Como pesquisador de mestrado e engenheiro de segurança, quero que o ASSAT carregue diretamente o arquivo oficial [`docs/OWASP_Application_Security_Verification_Standard_5.0.0_en.csv`](file:///home/user/felipe/speckit/assat/docs/OWASP_Application_Security_Verification_Standard_5.0.0_en.csv) contendo os **345 requisitos (`req_id`)**, **80 seções (`section_id`)**, **17 capítulos (`chapter_id`)** e níveis oficiais (`L1=70`, `L2=183`, `L3=92`), utilizando-o como única fonte de verdade taxonômica para avaliar os resultados dos scanners.

**Why this priority**: Garante que toda métrica, nível (`L1`/`L2`/`L3`), descrição de requisito (`req_description`) e seção apresentada no ASSAT reflita com fidelidade absoluta a especificação oficial do OWASP ASVS 5.0.0.

**Independent Test**: Consultar `GET /api/asvs-catalog` e `loadAsvsCatalog()` verificando que `stats.totalRequirements === 345`, `stats.totalSections === 80`, `stats.totalChapters === 17` e `stats.byLevel` corresponde exatamente a `{ L1: 70, L2: 183, L3: 92 }`.

**Acceptance Scenarios**:

1. **Given** o arquivo `docs/OWASP_Application_Security_Verification_Standard_5.0.0_en.csv` presente no workspace, **When** `loadAsvsCatalog()` é invocado ou `GET /api/asvs-catalog` é chamado, **Then** todos os 345 requisitos são parseados seguindo as regras RFC 4180 (incluindo campos com vírgulas e aspas escapadas como `V1.2.8` e `V1.2.10`) e indexados por `reqId`, `sectionId` e `chapterId`.

---

### User Story 2 - Resolução Semântica Granular de Achados para `req_id` (Priority: P1)

Como avaliador de segurança analisando um repositório (ex: `juice-shop`), quero que `aggregateAsvsFromAllureResults()` e `parseAsvsSummaryCsv()` classifiquem cada achado de `allure-results/<repo>/*-result.json` no nível granular de **`req_id` (3 dígitos, ex: `V1.2.4`, `V3.4.3`, `V13.3.1`, `V15.2.1`)**, mantendo também a referência explícita para `sectionId`, `sectionName`, `chapterId`, `chapter`, `levels` (nível oficial do CSV) e `reqDescription`.

**Why this priority**: Corrige a agregação grosseira por `section_id`, recupera achados do Semgrep e Trivy que caíam em fallbacks genéricos (`V15.3` e `V13.1`), e elimina a distorção de níveis `L1`/`L2`/`L3`.

**Independent Test**: Executar `getProjectArtifacts(workspaceDir, 'juice-shop')` (ou consultar `GET /api/projects/juice-shop`) e verificar que `asvsSummary` retorna os requisitos granulares no formato `V#.#.#` (`req_id`), com seus respectivos `sectionId`, `chapter`, `levels` oficiais do CSV e `reqDescription`, além do objeto `asvsCatalogSummary` contabilizando quantos dos 345 `req_id` foram acionados em cada nível (`L1`, `L2`, `L3`).

**Acceptance Scenarios**:

1. **Given** achados de SQL/NoSQL Injection (`CWE-89`, `CWE-943`, `sequelize-injection`, `nosql_find_injection`), Command Injection (`run-shell-injection`), XSS (`express_xss`) e Open Redirect (`express-open-redirect`), **When** agregados pelo avaliador ASVS, **Then** eles são separados nos requisitos atômicos `V1.2.4`, `V1.2.5`, `V1.2.1` e `V1.2.2` respectivamente, em vez de colidirem sob `V1.2` ou `V15.3`.
2. **Given** achados de cabeçalhos HTTP do ZAP e Semgrep (CORS, CSP, `X-Content-Type-Options`, `X-Frame-Options`, `Cross-Origin-Embedder-Policy`), **When** agregados pelo avaliador ASVS, **Then** eles são mapeados individualmente para `V3.4.2` (`L1`), `V3.4.3` (`L2`), `V3.4.4` (`L2`), `V3.4.6` (`L2`) e `V3.4.8` (`L3`).
3. **Given** achados em seções exclusivamente L2/L3 no CSV oficial (como `V13.3.1` *Secret Management*, `V2.4.1` *Anti-automation*, `V16.4.2` *Log Protection* e `V16.5.1` *Error Handling*), **When** agregados pelo avaliador ASVS, **Then** o campo `levels` reflete fielmente `"L2"` (e nunca o falso `"L1"` da abordagem anterior por seção).

---

### User Story 3 - Visualização da Matriz ASVS v5 por `req_id` e Cobertura sobre os 345 Requisitos no Allure Report (Priority: P1)

Como usuário inspecionando a aba **`ASVS v5 Matrix`** (`#asvs-matrix`) dentro do Allure Report, quero visualizar o KPI **`ASVS req_id Hit (X / 345)`**, o banner de cobertura detalhada por nível (`L1: X/70`, `L2: Y/183`, `L3: Z/92`), seções (`S / 80`) e capítulos (`C / 17`), e a tabela detalhada com as colunas **`Req ID (req_id)`**, **`Section (section_id)`**, **`Chapter`**, **`Level (CSV)`**, **`Official Requirement (req_description)`**, **`Tools`** e **`Findings`**.

**Why this priority**: Permite apresentar visualmente na dissertação de mestrado e na defesa perante a banca a rastreabilidade completa desde a ferramenta de scan até o requisito atômico (`req_id`) do OWASP ASVS 5.0.0.

**Independent Test**: Acessar `http://127.0.0.1:8765/#asvs-matrix` e verificar a renderização do KPI `ASVS req_id Hit`, do banner de estatísticas sobre os 345 requisitos e das 7 colunas da tabela `OWASP ASVS v5.0.0 Atomic Requirements Triggered (req_id Granularity)`.

---

## 3. Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Criar o módulo [`web-ui/asvs-catalog.ts`](file:///home/user/felipe/speckit/assat/web-ui/asvs-catalog.ts) com parser CSV compatível com RFC 4180 para carregar os **345 requisitos (`req_id`)**, **80 seções (`section_id`)** e **17 capítulos (`chapter_id`)** de [`docs/OWASP_Application_Security_Verification_Standard_5.0.0_en.csv`](file:///home/user/felipe/speckit/assat/docs/OWASP_Application_Security_Verification_Standard_5.0.0_en.csv).
- **FR-002**: Implementar `resolveFindingToReqIds()` e `resolveSectionOrReqId()` em [`web-ui/asvs-catalog.ts`](file:///home/user/felipe/speckit/assat/web-ui/asvs-catalog.ts) para classificar achados de todas as ferramentas do pipeline (`npm-audit`, `trivy`, `semgrep`, `zap`, `gitleaks`, `dependency-check`, `bandit`, `sonar`) em requisitos atômicos de 3 dígitos (`req_id`, ex: `V1.2.4`, `V3.4.3`, `V13.3.1`, `V15.2.1`) com seus níveis oficiais (`L1`, `L2`, `L3`) vindos do CSV.
- **FR-003**: Atualizar `parseAsvsSummaryCsv()`, `aggregateAsvsFromAllureResults()`, `buildAsvsCoverageStats()` e `getProjectArtifacts()` em [`web-ui/runner.ts`](file:///home/user/felipe/speckit/assat/web-ui/runner.ts) para produzir linhas `AsvsSummaryRow` indexadas por `req_id` (contendo `asvsId`, `reqId`, `sectionId`, `sectionName`, `chapterId`, `chapter`, `title`, `reqDescription`, `levels`, `tools`, `count`) e incluir `asvsCatalogSummary` na resposta de `/api/projects/<repoName>`.
- **FR-004**: Expor o endpoint REST `GET /api/asvs-catalog` em [`web-ui/server.ts`](file:///home/user/felipe/speckit/assat/web-ui/server.ts) retornando as estatísticas globais (`345` `req_id`, `80` `section_id`, `17` `chapter_id`, `L1: 70`, `L2: 183`, `L3: 92`) e a lista completa dos 345 requisitos.
- **FR-005**: Atualizar [`web-ui/allure-plugin.ts`](file:///home/user/felipe/speckit/assat/web-ui/allure-plugin.ts) e [`web-ui/detector.ts`](file:///home/user/felipe/speckit/assat/web-ui/detector.ts) para exibir a avaliação por `req_id`, incluindo `Section (section_id)`, `Level (CSV)` e `Official Requirement (req_description)` na aba `ASVS v5 Matrix`.
- **FR-006**: Preservar **100% intocados** todos os arquivos originais do repositório upstream (`security-tests/run_security_scans.sh`, `security-tests/parsers/asvs-unified-to-allure.ts`, `shared-asvs-map.json`, etc.), em conformidade estrita com o Princípio I da Constituição.

## 4. Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `loadAsvsCatalog()` carrega exatamente `345` requisitos (`L1: 70`, `L2: 183`, `L3: 92`), `80` seções e `17` capítulos a partir de `docs/OWASP_Application_Security_Verification_Standard_5.0.0_en.csv`.
- **SC-002**: Todos os itens retornados em `asvsSummary` por `getProjectArtifacts()` possuem identificadores atômicos de 3 níveis (`/^V\d+\.\d+\.\d+$/`) validados contra o catálogo CSV oficial e níveis `L1`/`L2`/`L3` isentos de falsos L1.
- **SC-003**: No estudo de caso `juice-shop`, a avaliação granular identifica **35 `req_id` distintos** distribuídos em **25 seções** e **11 capítulos** (contra apenas 9 seções genéricas na abordagem anterior por `section_id`).
- **SC-004**: `npx tsc -p web-ui/tsconfig.json --noEmit` e `node --test -r ts-node/register web-ui/runner.test.ts` passam com 100% de aprovação, e `git status --porcelain -uno` não aponta nenhuma modificação em arquivos originais upstream.

