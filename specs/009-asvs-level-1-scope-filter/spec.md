# Feature Specification: OWASP ASVS v5.0.0 Level 1 (L1) Verification Scope & Filtering (`009-asvs-level-1-scope-filter`)

**Feature Branch**: `009-asvs-level-1-scope-filter`  
**Created**: 2026-11-03  
**Status**: Implemented  
**Input**: User request: *"ótimo, crie uma nova iteracao sdd para manter apenas o req_id que forem de nivel 1 (level 1) do asvs"*

---

## 1. Fundamentação Científica e Metodológica (Rigor de Mestrado)

### 1.1 A Singularidade Epistemológica do Nível 1 no Padrão OWASP ASVS
Na taxonomia do **OWASP Application Security Verification Standard (ASVS)**, os três níveis de garantia possuem objetivos e metodologias de avaliação profundamente distintos:

* **Nível 1 (L1 — Automated / Basic Verification):** Constitui a higiene cibernética essencial contra vulnerabilidades comuns (*low-hanging fruit* e OWASP Top 10). **O Nível 1 é formalmente definido pela OWASP como o único nível cujos requisitos são passíveis de verificação automatizada por ferramentas (SAST, DAST, SCA, Secrets, IaC) sem necessidade obrigatória de auditoria humana de código ou entrevistas de arquitetura**.
* **Nível 2 (L2 — Standard Defense-in-Depth):** Recomendado para aplicações que transacionam dados de negócio sensíveis. Exige análises aprofundadas de controle de acesso, gestão de sessões e integridade de criptografia, dependendo substancialmente de testes manuais e modelagem de ameaças.
* **Nível 3 (L3 — Advanced / Critical Systems):** Voltado a infraestruturas críticas e aplicações de alta confidencialidade (módulos bancários, saúde). Requer provas formais de arquitetura e verificação holística.

### 1.2 O Problema do Viés de Escopo na Automação (*Methodological Scope Bias*)
Em um trabalho de pós-graduação estrita (*stricto sensu*), submeter um pipeline automatizado a todos os 345 requisitos do ASVS introduz um **viés epistemológico de falsa incompletude e distorção de conformidade**:
1. Como ferramentas automatizadas cobrem apenas uma fração ínfima dos requisitos dos Níveis 2 e 3 (por dependerem de cognição humana e contexto de negócio), avaliar L2 e L3 em um pipeline automatizado gera taxas de cobertura artificialmente baixas e métricas distorcidas.
2. Misturar achados de L2 e L3 (ex: *timing attacks* em `V11.2.4 [L3]`, ou cabeçalhos COEP em `V3.4.8 [L3]`) com requisitos de L1 impede que o pesquisador meça com exatidão a conformidade da aplicação com o **baseline mandatório L1 da OWASP**.

Ao isolar rigorosamente os **70 requisitos atômicos de Nível 1 (`L1`)** presentes no arquivo canônico [`docs/OWASP_Application_Security_Verification_Standard_5.0.0_en.csv`](file:///home/user/felipe/speckit/assat/docs/OWASP_Application_Security_Verification_Standard_5.0.0_en.csv), obtém-se uma métrica de conformidade matematicamente fechada, reproduzível e conceitualmente válida:

$$\text{Taxa de Conformidade L1} = \frac{|\{r \in \text{ASVS}_{L1} \mid \text{Pass}(r)\}|}{|\text{ASVS}_{L1}|} = \frac{70 - |\text{Violated}_{L1}|}{70}$$

---

## 2. Requisitos do Sistema

### 2.1 Requisitos Funcionais (RF)
- **RF-001 (Filtro de Escopo L1 no Enriquecedor):** O módulo `web-ui/enricher.ts` deve suportar o parâmetro `levelFilter: 'L1' | 'all'` (com padrão selecionável ou flag `--level L1`). Quando configurado para `L1`, apenas os achados mapeados para requisitos de nível `L1` serão retidos nos arquivos Allure Results e compilados no Allure Report.
- **RF-002 (Quarentena / Preservação Não-Destrutiva de L2/L3):** Os resultados originais não-L1 (L2 e L3) não devem ser descartados permanentemente; devem ser armazenados em subdiretório de quarentena/preservação (ex: `.allure-results-raw/<repo>` ou filtrados em pipeline) permitindo alternar entre o escopo estrito L1 e a visão abrangente sem reexecutar os scans.
- **RF-003 (Métricas L1 Dedicadas no `asvs-summary.csv`):** O sumário tabular gerado deve registrar os 70 requisitos de Nível 1, discriminando requisitos L1 violados (*failed*) vs. requisitos L1 conformes (*passed / not triggered*).
- **RF-004 (Visão L1 na Matriz ASVS do Allure):** A aba nativa do Allure `#asvs-matrix` deve exibir um seletor de escopo de nível (**"Scope: Level 1 (70 Reqs) [Ativo]"** vs. **"All Levels (345 Reqs)"**), calculando o Scoreboard e a porcentagem oficial de conformidade L1.
- **RF-005 (Integração na CLI e API):**
  - O script de enriquecimento deve aceitar `--level L1` (`npm run enrich juice-shop -- --level L1`).
  - O endpoint de API `POST /api/enrich/:repo?level=L1` deve aceitar o filtro de nível.
  - A interface de disparo CLI `#security-scan` deve disponibilizar o seletor de nível ASVS.

### 2.2 Critérios de Aceitação (Gherkin)
```gherkin
Cenário: Relatório Allure restrito estritamente a requisitos ASVS Nível 1
  Dado que um repositório foi escaneado e o filtro de escopo L1 está ativado
  Quando o enriquecedor processa os resultados de teste
  Então apenas achados com level "L1" devem estar presentes no relatório Allure
  E nenhum achado com level "L2" ou "L3" deve constar nas abas Categories ou Suites
  E o asvs-summary.csv deve contabilizar apenas violações pertencentes aos 70 requisitos L1
  E a matriz ASVS v5 deve destacar a taxa de conformidade sobre os 70 requisitos L1
```
