# Implementation Plan: Granular OWASP ASVS v5.0.0 Requirement (`req_id`) Evaluation & Canonical 345-Item Catalog Integration (`006-asvs-v5-req-granularity`)

**Branch**: `main` (`006-asvs-v5-req-granularity`) | **Date**: 2026-11-03 | **Spec**: [spec.md](file:///home/user/felipe/speckit/assat/specs/006-asvs-v5-req-granularity/spec.md)  
**Input**: Feature specification from `/specs/006-asvs-v5-req-granularity/spec.md`

---

## 1. Summary

Evoluir a avaliação de conformidade do ASSAT do nível macro de **Seção (`section_id`, 2 dígitos: `V#.#`)** para o nível atômico de **Requisito de Verificação (`req_id`, 3 dígitos: `V#.#.#`)**, utilizando como base canônica os **345 requisitos oficiais** contidos em [`docs/OWASP_Application_Security_Verification_Standard_5.0.0_en.csv`](file:///home/user/felipe/speckit/assat/docs/OWASP_Application_Security_Verification_Standard_5.0.0_en.csv), sem modificar nenhum arquivo original do repositório upstream (`security-tests/parsers/asvs-unified-to-allure.ts` ou `shared-asvs-map.json`).

---

## 2. Architecture Decision Record (ADR-006): Avaliação por `req_id` vs. `section_id`

### 2.1 Contexto
No repositório upstream (`adeelahmad6834/asvs-allure-security-pipeline`, commit `3f9f43d`), o arquivo [`shared-asvs-map.json`](file:///home/user/felipe/speckit/assat/shared-asvs-map.json) mapeia regras de ferramentas e CWEs para apenas **20 seções (`section_id`)** distribuídas em **11 capítulos**. Quando confrontado com o catálogo completo do OWASP ASVS 5.0.0 (`docs/OWASP_Application_Security_Verification_Standard_5.0.0_en.csv`, com **345 `req_id`** em **80 `section_id`** e **17 `chapter_id`**), verificou-se que avaliar por `section_id`:
1. **Agrega falhas heterogêneas sob um único rótulo** (ex: SQLi, NoSQLi, Command Injection, XSS e Open Redirect colidem todos sob `V1.2`; CSP, CORS, HSTS, `X-Content-Type-Options`, `X-Frame-Options` e `COEP` colidem sob `V3.4`).
2. **Viola a semântica de níveis (`L1`, `L2`, `L3`) do ASVS 5.0.0**, atribuindo `"L1"` a seções que no padrão oficial possuem exclusivamente requisitos `L2` e `L3` (`V2.4`, `V6.4`, `V11.2`, `V13.1`, `V13.3`).
3. **Sofre com falsos fallbacks no parser original**, onde regras do Semgrep com `metadata.cwe` em formato de array caíam em `V15.3` (*Defensive Coding*) e vulnerabilidades NPM do Trivy (`Type: "npm"`) caíam em `V13.1` (*Configuration Documentation*).

### 2.2 Decisão
Adotar **`req_id` (3 dígitos: `V< capítulo >.< seção >.< requisito >`)** como unidade primária de avaliação no ASSAT, implementando o motor [`web-ui/asvs-catalog.ts`](file:///home/user/felipe/speckit/assat/web-ui/asvs-catalog.ts) que:
1. Carrega em memória os **345 requisitos** de `docs/OWASP_Application_Security_Verification_Standard_5.0.0_en.csv` com seus metadados oficiais (`chapterId`, `chapterName`, `sectionId`, `sectionName`, `reqId`, `reqDescription`, `level`).
2. Executa resolução semântica multi-sinal (`resolveFindingToReqIds`) sobre os artefatos `allure-results/<repo>/*-result.json`, inspecionando nome da regra, identificador CWE, mensagem detalhada, ferramenta geradora e tag ASVS para determinar o `req_id` exato.
3. Preserva a hierarquia completa (`req_id` $\rightarrow$ `section_id` $\rightarrow$ `chapter_id`), permitindo exibir simultaneamente o requisito atômico e sua seção/capítulo na aba `ASVS v5 Matrix`.

### 2.3 Evidência Empírica Comparativa (Estudo de Caso: `juice-shop`, 234 Achados em 4 Scanners)

| Métrica Comparativa | Antes (`section_id` — SDD 005) | Depois (`req_id` — SDD 006) | Explicação Técnica da Melhoria |
| :--- | :---: | :---: | :--- |
| **Unidades ASVS Identificadas** | 9 `section_id` | **35 `req_id`** | Desagregação de pacotes de vulnerabilidades em requisitos atômicos auditáveis. |
| **Seções Distintas (`section_id`)** | 9 / 80 (11,25%) | **25 / 80 (31,25%)** | Recuperação de achados que antes caíam nos fallbacks genéricos `V15.3` e `V13.1`. |
| **Capítulos Cobertos (`chapter_id`)** | 7 / 17 | **11 / 17** | Inclusão dos capítulos `V9` (*Self-contained Tokens*: `V9.1.1`) e `V16` (*Logging & Error Handling*: `V16.4.2`, `V16.5.1`). |
| **Distribuição por Nível Oficial** | 100% marcados com `L1` (distorcido) | **`L1: 16`, `L2: 15`, `L3: 4`** | Alinhamento estrito com a coluna `L` do CSV oficial do OWASP ASVS 5.0.0. |
| **Achados ZAP DAST (7 alertas)** | Todos os 7 agrupados em `V3.4` | Separados em **`V3.4.2`, `V3.4.3`, `V3.4.8`, `V1.3.2`, `V13.4.6`, `V14.3.2`, `V3.7.1`** | Cada alerta DAST do ZAP passa a apontar para o requisito exato do ASVS 5.0.0. |

---

## 3. Technical Context

**Language/Version**: TypeScript 5.4 on Node.js 20+ (`ts-node`)  
**Primary Dependencies**: Node.js built-ins (`fs`, `path`, `http`, `https`, `child_process`, `crypto`, `os`) — Zero external runtime dependencies added  
**Canonical Data Source**: `docs/OWASP_Application_Security_Verification_Standard_5.0.0_en.csv` (345 rows)  
**Testing**: `npx tsc -p web-ui/tsconfig.json --noEmit` and `node --test -r ts-node/register web-ui/runner.test.ts`  
**Constraints**: Zero modifications to upstream tracked files (`security-tests/*`, `shared-asvs-map.json`, etc.).

---

## 4. Constitution Check

- **Principle I (Preservação Estrita do Núcleo Original)**: **PASS** — `security-tests/run_security_scans.sh`, `security-tests/parsers/asvs-unified-to-allure.ts` e `shared-asvs-map.json` permanecem 100% intocados.
- **Principle II (Paridade Fiel 1:1 com a CLI)**: **PASS**.
- **Principle III (Segurança por Padrão e Prevenção de Injeção)**: **PASS**.
- **Principle IV (Artefatos Originais como Fonte de Verdade)**: **PASS** — A resolução para `req_id` lê diretamente os arquivos `allure-results/<repo>/*-result.json` e `asvs-summary.csv` gerados pelo pipeline original, enriquecendo-os com o catálogo oficial CSV em `docs/`.
- **Principle V (Simplicidade Técnica e Stack Nativa)**: **PASS** — Parser RFC 4180 e classificador semântico escritos em TypeScript puro sem bibliotecas externas.

---

## 5. Project Structure

```text
docs/
└── OWASP_Application_Security_Verification_Standard_5.0.0_en.csv  # Catálogo canônico (345 req_id, 80 section_id, 17 chapter_id)

specs/006-asvs-v5-req-granularity/
├── spec.md                     # Especificação com fundamentação teórica de mestrado e análise de gaps
├── plan.md                     # Plano de implementação, ADR-006 e comparativo empírico (section_id vs req_id)
├── tasks.md                    # Checklist rastreável de tarefas da Iteração 006
└── checklists/
    └── requirements.md         # Validação de qualidade da especificação SDD 006

web-ui/
├── asvs-catalog.ts             # NOVO: Parser CSV RFC 4180 dos 345 req_id e motor de classificação semântica por req_id
├── runner.ts                   # ATUALIZADO: Agregação por req_id e cálculo de asvsCatalogSummary (345 reqs)
├── detector.ts                 # ATUALIZADO: Mapeamento preditivo de ferramentas referenciando req_id
├── allure-plugin.ts            # ATUALIZADO: Aba ASVS v5 Matrix com KPI req_id (X/345), Section, Level oficial e req_description
├── server.ts                   # ATUALIZADO: Endpoint GET /api/asvs-catalog
└── runner.test.ts              # ATUALIZADO: Testes automatizados do catálogo de 345 req_id e classificação granular
```

