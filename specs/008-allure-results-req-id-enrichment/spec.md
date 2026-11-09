# Feature Specification: Allure Native Results Granular Requirement (`req_id`) Enrichment (`008-allure-results-req-id-enrichment`)

**Feature Branch**: `008-allure-results-req-id-enrichment`  
**Created**: 2026-11-03  
**Status**: Implemented  
**Input**: User request: *"seria possivel criar uma nova iteracao sdd para ao inves de mostrar os itens checados que falharam no nivel de section_id, mostrar em req_id ?"* acompanhado de evidência visual da aba nativa Allure Categories (`#categories`).

---

## 1. Fundamentação Científica e Rigor Acadêmico

### 1.1 O Descompasso Semântico na Apresentação Nativa de Resultados do Allure
Nas iterações anteriores (especialmente SDD 006), o catálogo canônico de **345 requisitos atômicos (`req_id`)** do **OWASP ASVS v5.0.0** (`docs/OWASP_Application_Security_Verification_Standard_5.0.0_en.csv`) foi integrado à aba customizada da Matriz ASVS (`#asvs-matrix`). Contudo, o motor nativo do **Allure Framework** (responsável pelas abas canônicas **Categories**, **Suites**, **Overview**, **Behaviors**, **Packages** e pelos cards individuais de falhas) continua consumindo diretamente os arquivos brutos `allure-results/<repo>/*-result.json`.

Como esses arquivos são inicialmente gerados pelo parser upstream ([`security-tests/parsers/asvs-unified-to-allure.ts`](file:///home/user/felipe/speckit/assat/security-tests/parsers/asvs-unified-to-allure.ts)) parametrizado pelo [`shared-asvs-map.json`](file:///home/user/felipe/speckit/assat/shared-asvs-map.json), o Allure Report nativo exibe graves distorções semânticas:

1. **Agrupamento Grosseiro de Falhas em Categories (`#categories`):**
   * Falhas de injeção distintas colidem sob o cabeçalho `[[SEVERITY:HIGH]] ASVS: V1.2 [L1,L2] ...`, ocultando se a falha é NoSQL Injection (`V1.2.4 [L1]`), XSS (`V1.2.1 [L1]`) ou OS Command Injection (`V1.2.5 [L1]`).
   * Centenas de falhas de dependências e IaC colidem sob `[[SEVERITY:HIGH]] ASVS: V13.1 [L1]` e `[[SEVERITY:UNKNOWN]] ASVS: V15.3 [L1]` devido a fallbacks imprecisos.
2. **Ambiguidade de Nível de Verificação (`[L1,L2]`):**
   * No padrão ASVS v5.0.0 oficial, cada requisito atômico possui um único nível (`L1`, `L2` ou `L3`). O parser original gravava intervalos artificiais (`[L1,L2]`), impedindo a aferição exata de conformidade com o Nível 1.
3. **Desalinhamento da Taxonomia de Suítes Allure:**
   * A aba **Suites** classifica as execuções por capítulo e seção macro, sem permitir que o auditor ou banca acadêmica filtre especificamente pelo identificador atômico auditável (`req_id`).

### 1.2 Princípio da Não-Modificação do Núcleo e Abordagem por Pós-Processamento Enriquecedor
Em conformidade com o **Princípio I da Constituição** (*Zero Core Modification & Attribution*), o script de scan original e o conversor upstream não devem ser alterados. A solução academicamente e arquiteturalmente correta consiste em um **Módulo Enriquecedor Não-Destrutivo (*ASVS Result Enricher*)** executado na camada de orquestração (`web-ui/enricher.ts`), que:
1. Intercepta os arquivos `-result.json` em `allure-results/<repo>/` gerados após a execução do parser.
2. Aplica o classificador canônico RFC 4180 de 345 requisitos (`web-ui/asvs-catalog.ts`).
3. Reescreve cirurgicamente o `statusDetails.message`, o array de `labels` (tags, suite, level) e o sumário tabular `asvs-summary.csv`.
4. Dispara a compilação do relatório HTML do Allure (`allure generate --clean`).

---

## 2. Requisitos do Sistema

### 2.1 Requisitos Funcionais (RF)
- **RF-001 (Enriquecimento de Mensagem de Status):** Substituir em cada `-result.json` a menção agregada `ASVS: <section_id> [L...]` pela menção atômica exata `ASVS: <req_id> [<level>]` e descrição correspondente (ex: `ASVS: V1.2.4 [L1]`).
- **RF-002 (Refinamento de Labels e Tags Allure):**
  - Adicionar/substituir a tag `ASVS:5.0.0/<req_id>` no array `labels`.
  - Definir a label `level` estritamente com o nível oficial do ASVS 5.0 (`L1`, `L2` ou `L3`).
  - Refinar a label `suite` ou `subSuite` para refletir o capítulo e o requisito atômico.
- **RF-003 (Enriquecimento Retroativo e On-Demand):** Disponibilizar comando CLI e endpoint de API (`POST /api/enrich/:repo`) para reprocessar diretórios existentes de resultados (ex: `allure-results/juice-shop`).
- **RF-004 (Integração Automática no Runner):** O gerenciador de execução (`web-ui/runner.ts`) deve invocar automaticamente o enriquecedor ao final de cada execução do pipeline de testes antes de gerar o relatório HTML.
- **RF-005 (Preservação de Integridade):** Nenhum campo de evidência de teste (steps, anexos, trace de severidade `[[SEVERITY:...]]`, tempos de execução) pode ser corrompido ou descartado.

### 2.2 Critérios de Aceitação (Gherkin)
```gherkin
Cenário: Visualização de achados na aba Categories do Allure por req_id
  Dado que um scan foi executado sobre o repositório juice-shop
  E o módulo de enriquecimento de resultados foi executado
  Quando o usuário abre a aba "Categories" do Allure Report
  Então os agrupamentos de falhas devem exibir o prefixo "ASVS: <req_id> [<level>]"
  E não devem exibir o rótulo ambíguo "[L1,L2]"
  E falhas de NoSQL Injection devem exibir explicitamente "ASVS: V1.2.4 [L1]"
  E falhas de bibliotecas vulneráveis devem exibir "ASVS: V15.2.1 [L1]" em vez do fallback "V13.1 [L1]"
```
