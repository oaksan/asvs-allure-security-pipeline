# Feature Specification: Precise Finding Location & Remediation Context (`014-precise-finding-location-and-remediation`)

## 1. Contexto e Motivação

**Input**: Solicitação do usuário:
*"gere uma nova iteracao SDD para apresentar na aplicacao com maior precisao onde cada finding foi identificado para facilitar a correcao futura"*

### 1.1 Diagnóstico do Estado Atual
No relatório Allure gerado pelo pipeline, cada achado (*finding*) sob um requisito ASVS apresenta limitações que dificultam a localização e remediação rápida pelo time de desenvolvimento:
1. **Rótulos Genéricos na Árvore de Suítes:**
   - Na aba **Suites**, sob o requisito `V1.2.4`, o usuário visualiza 19 itens com nomes idênticos: `#18 ajinabraham.njsscan...`, `#15 ajinabraham.njsscan...`.
   - O desenvolvedor é incapaz de identificar qual arquivo contém a falha sem abrir individualmente cada item.
2. **Ausência de Parâmetros de Localização:**
   - A tabela nativa de parâmetros (`parameters`) do Allure não é preenchida com o arquivo alvo, número da linha, componente afetado ou versão segura recomendada.
3. **Falta de Destaque para Correção Futura:**
   - O painel de descrição contém apenas a especificação normativa geral do ASVS v5, mas não destaca em um cartão dedicado o caminho exato do arquivo, linha de código, trecho afetado e instruções diretas de correção (*Remediation Guidance*).

### 1.2 Objetivo
Apresentar na aplicação Allure a **localização exata** (arquivo, linha, componente vulnerável) e o **contexto de remediação** (versão corrigida, instrução técnica de mitigação) de cada finding:
- No título do item na árvore de suítes: prefixado com `[arquivo:linha]` ou `[arquivo] pacote (versão segura)`.
- Nos parâmetros nativos do Allure (`parameters`): exibição estruturada de arquivo, linha, ferramenta, regra e remediação.
- No painel de detalhes (`descriptionHtml`): cartão visual de localização precisa e guia de correção para o desenvolvedor.

---

## 2. Requisitos Funcionais

- **RF-001 (Identificação no Título do Finding - Tree Node Name):**
  - Para falhas de código-fonte (SAST / Secrets): formatar o nome como `[<caminho_arquivo>:<linha>] <nome_regra>`.
  - Para vulnerabilidades de dependências (SCA / npm / Trivy): formatar o nome como `[<arquivo_lock>] <pacote> (Fixed: <versao_corrigida>)`.
  - Para arquivos de infraestrutura/configuração (IaC / Dockerfile): formatar como `[<arquivo_config>] <descricao_problema>`.
- **RF-002 (Injeção de Parâmetros Nativos Allure):**
  - Cada finding deve conter parâmetros no atributo `parameters`:
    - `Location`: Caminho do arquivo afetado.
    - `Line`: Linha exata (quando disponível via SAST/Secrets).
    - `Tool`: Ferramenta de detecção (ex: `Semgrep (SAST)`, `Trivy (SCA)`).
    - `Component / Package`: Pacote ou componente vulnerável.
    - `Remediation`: Instrução prática de correção ou versão segura para upgrade.
- **RF-003 (Cartão Visual de Localização e Remediação em `descriptionHtml`):**
  - Inserir no topo da descrição de cada finding um cartão estilizado em verde/azul com:
    - 📁 **Arquivo / Alvo:** `<code>caminho/do/arquivo</code>`
    - 🔢 **Linha de Código:** `Linha X`
    - 🛠️ **Ferramenta & Regra:** Tool + Rule ID / CVE / CWE
    - 💡 **Guia Prático de Correção:** Instruções objetivas para sanar a vulnerabilidade conforme as melhores práticas do ASVS v5.
- **RF-004 (Indexação Inteligente de Relatórios Brutos):**
  - O enriquecedor deve indexar relatórios disponíveis em `security-reports/` (`semgrep-report.json`, `trivy-fs-report.json`, etc.) para correlacionar linhas de código exatas e versões seguras corrigidas (`FixedVersion`), com fallback resiliente para parsing de `fullName` e mensagens.
- **RF-005 (Princípio I - Zero Core Modification):**
  - Preservar integralmente os scripts e arquivos em `security-tests/` e os CSVs originais.

---

## 3. Critérios de Aceitação

1. **Visibilidade Imediata:** Na aba **Suites**, os findings de um mesmo requisito mostram claramente seus arquivos e linhas distintos (ex: `[routes/basketItems.ts:68] ...`, `[routes/wallet.ts:18] ...`).
2. **Parâmetros Estruturados:** Ao clicar em um finding, a seção *Parameters* exibe *Location*, *Line*, *Tool* e *Remediation*.
3. **Guia de Correção:** O painel de descrição exibe o cartão de localização com instruções práticas de mitigação.
4. **Sem Regressões:** Todos os testes automatizados existentes continuam sendo aprovados (`npm test`).

