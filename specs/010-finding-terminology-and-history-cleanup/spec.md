# Feature Specification: Pure Security Findings Standard & History Reset (`010-finding-terminology-and-history-cleanup`)

**Feature Branch**: `010-finding-terminology-and-history-cleanup`  
**Created**: 2026-11-04  
**Status**: Implemented  
**Input**: User request: *"crie uma nova iteracao SDD que remove o historico de findings/ test case e que padroniza o test case para ser chamando agora de finding."*

---

## 1. Fundamentação Científica e Metodológica (Rigor de Mestrado)

### 1.1 A Necessidade de Padronização Ontológica: "Test Case" vs. "Finding"
Em ferramentas de Garantia de Qualidade (QA funcional como JUnit ou Jest), o conceito nuclear é o **Test Case** (um procedimento que avalia um assert e resulta em sucesso ou falha). Contudo, em **Engenharia de Segurança de Software (AppSec)**, a unidade primária de medida não é um teste funcional genérico, mas sim o **Finding de Segurança** (a evidência de uma vulnerabilidade ou fraqueza CWE/CVE detectada no sistema).

Apresentar relatórios de segurança com a expressão legada *"test cases"* causa estranhamento metodológico em bancas de pós-graduação e induz a falsas interpretações:
1. Faz parecer que foram escritos 142 testes manuais de software, quando na verdade foram detectadas vulnerabilidades por scanners automatizados.
2. A contagem do Allure ficava inflada em 6 unidades devido a artefatos utilitários (`Meta :: Severity Rollup Summary` e `Artifacts :: ZAP (baseline) artifacts`), que não representam falhas de segurança do código-alvo.

Ao padronizar terminologicamente a interface para **Findings** e expurgar os 6 casos utilitários da contagem, alcança-se uma **equivalência matemática rigorosa**:
$$\mathbf{1 \text{ Item no Allure}} \equiv \mathbf{1 \text{ Finding de Segurança}}$$

### 1.2 O Problema do Acúmulo Histórico (*Trend Pollution*)
O script original copia recursivamente a pasta `history/` entre execuções sucessivas do Allure (`carry_history`). Em ambientes experimentais de laboratório e testes iterativos de mestrado, isso faz com que o gráfico **TREND** acumule execuções passadas com parâmetros divergentes, distorcendo as métricas visuais do relatório canônico. O expurgo do histórico de tendências garante um relatório limpo, pontual e 100% reprodutível.

---

## 2. Requisitos do Sistema

### 2.1 Requisitos Funcionais (RF)
- **RF-001 (Padronização Terminológica na Interface):** Substituir em toda a interface do Allure (widget principal de resumo, cabeçalhos e gráficos) os textos *"test cases"* e *"test case"* pelo termo padronizado **"findings"** (ou *"findings (vulnerabilidades)"*).
- **RF-002 (Expurgo de Test Cases Utilitários):** O enriquecedor deve filtrar e remover dos resultados ativos do Allure os 6 arquivos utilitários gerados pelo script original (`feature === 'Meta'` e `feature === 'Artifacts'`), preservando os logs brutos correspondentes na pasta `./security-reports/`.
- **RF-003 (Limpeza de Histórico Residual):** Disponibilizar flag/opção `cleanHistory: true` para purgar os arquivos de tendência acumulados (`history/`) em `allure-results/<repo>` e `allure-report/<repo>`, gerando um gráfico Allure limpo focado na execução atual.
- **RF-004 (Paridade Exata 1:1):** No estudo de caso do Juice-Shop no Nível 1, o número total de findings no Allure deve ser exatamente **136** (136 vulnerabilidades de Nível 1).

### 2.2 Critérios de Aceitação (Gherkin)
```gherkin
Cenário: Relatório Allure padronizado com terminologia Finding e sem ruído utilitário
  Dado que o enriquecedor com limpeza de histórico e padronização é executado
  Quando o usuário visualiza o Overview do Allure
  Então o contador circular deve exibir a palavra "findings" em vez de "test cases"
  E o total de itens para o Juice-Shop no Nível 1 deve ser exatamente 136
  E a categoria "Other (no severity token)" não deve existir
  E o gráfico de histórico não deve conter ruído de execuções descartadas
```
