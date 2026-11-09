# Feature Specification: Detailed ASVS Requirement Descriptions from Official v5 CSV (`012-detailed-asvs-req-descriptions`)

## 1. Contexto e Motivação

**Input**: Solicitação do usuário acompanhada de captura da árvore de Suítes do Allure Report:
*"crie uma nova iteracao SDD para deixar a descricao do req_id mais detalhada conforme o csv em docs do asvs 5"*

### 1.1 Diagnóstico do Estado Atual
Na árvore de navegação **Suites** do Allure Report, os achados são agrupados por:
1. `parentSuite`: Severidade (ex: `Severity: HIGH`)
2. `suite`: Capítulo ASVS (ex: `ASVS: V1: Encoding and Sanitization`)
3. `subSuite`: Atualmente definido em `enricher.ts` como `${primary.reqId} - ${primary.sectionName}`.

Como múltiplos requisitos atômicos (`req_id`) pertencem à mesma seção (`section_id`), requisitos distintos acabavam exibindo títulos idênticos e genéricos:
- `V1.2.1 - Injection Prevention` (2 achados)
- `V1.2.4 - Injection Prevention` (19 achados)

O mesmo ocorria para `V15.2.1 - Security Architecture and Dependencies` e outros requisitos. Além disso:
- O campo `description` e `descriptionHtml` dos resultados JSON do Allure encontrava-se vazio (`undefined`), deixando o painel lateral de detalhes sem a especificação oficial de conformidade.
- A mensagem de status (`statusDetails.message`) continha apenas `ASVS: V1.2.4 [L1]` sem detalhar o texto normativo exigido pelo padrão OWASP ASVS v5.0.0.
- O arquivo consolidado `asvs-summary.csv` omitia a coluna `req_description`.

### 1.2 Objetivo
Enriquecer a apresentação de cada `req_id` em todas as instâncias do Allure Report com a descrição normativa detalhada e integral extraída diretamente de `docs/OWASP_Application_Security_Verification_Standard_5.0.0_en.csv`.

---

## 2. Requisitos Funcionais

- **RF-001 (Nó de SubSuite Detalhado):** O atributo `subSuite` de cada resultado Allure deve ser formatado como `${primary.reqId} - ${primary.reqDescription}` (ou `${primary.reqId} [${primary.level}] - ${primary.reqDescription}`), garantindo distinção imediata e clareza na árvore de testes.
- **RF-002 (Enriquecimento de `descriptionHtml`):** Cada arquivo `-result.json` deve incluir um painel formatado em HTML com:
  - Identificador e nível: `req_id` e `level` (ex: `V1.2.4 [L1]`).
  - Capítulo e Seção ASVS correspondentes.
  - Texto integral da especificação de verificação (`req_description`).
  - Contexto diagnóstico fornecido pela ferramenta de segurança.
- **RF-003 (Enriquecimento de `statusDetails.message`):** A mensagem do status do achado deve incorporar a descrição oficial: `ASVS: <req_id> [<level>] — <req_description>`.
- **RF-004 (Inclusão de `req_description` em `asvs-summary.csv`):** O CSV consolidado deve incluir a coluna `req_description`, preservando a rastreabilidade estruturada.
- **RF-005 (Preservação do Princípio I - Zero Core Modification):** Nenhuma alteração nos scripts legados em `security-tests/` ou no CSV canônico em `docs/`. Todas as transformações são efetuadas exclusivamente pelo enriquecedor e utilitários em `web-ui/`.

---

## 3. Critérios de Aceitação

1. **Diferenciação Visual:** Na aba Suites, `V1.2.1` e `V1.2.4` não exibem mais o mesmo subtítulo genérico "Injection Prevention"; cada nó exibe sua respectiva descrição normativa do CSV.
2. **Painel de Detalhes:** Ao selecionar qualquer finding no Allure, o painel exibe a descrição oficial do requisito ASVS v5.0.0.
3. **Integridade de Testes:** A suíte de testes em `npm test` passa com 100% de sucesso.

