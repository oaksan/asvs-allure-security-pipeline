# Implementation Plan: Evidência Precisa de Localização na Aplicação (`015-precise-application-location-evidence`)

## 1. Visão Geral da Arquitetura

O enriquecedor de relatórios (`web-ui/enricher.ts`) será estendido com quatro capacidades essenciais:
1. **Indexador Completo de Relatórios**:
   - `semgrep-report.json`: extração de caminho, linha, coluna, trecho e CWE.
   - `trivy-fs-report.json`: extração de CVE, pacote, versão instalada, versão corrigida e advisory.
   - `npm-audit.json`: extração de vulnerabilidades diretas e transitivas (`via`), dependências afetadas, títulos de advisories, CVE/GHSA IDs, CWEs e recomendações de atualização.
   - `zap-report.json`: extração de sites, alertas, instâncias de endpoints de runtime (`uri`), métodos HTTP (`method`), parâmetros vulneráveis (`param`), evidências e soluções.
   - `gitleaks-report.json`: extração de arquivo, linha de início e regra de segredo exposto.

2. **Mecanismo de Correlação de Código da Aplicação (`findApplicationCallers`)**:
   - Para dependências de bibliotecas (`pdfkit`, `sanitize-html`, etc.), realiza varredura recursiva nos arquivos do repositório avaliado (`routes/`, `lib/`, `models/`, `data/`, `server.ts`, `package.json`), ignorando `node_modules` e pastas compiladas redundantes.
   - Identifica onde o pacote é importado (`import ... from 'pkg'`, `require('pkg')`) e onde é declarado no manifesto (`package.json`).

3. **Extrator de Trecho Real de Código com Indicador Visual (`readSourceSnippet`)**:
   - Quando o `targetFile` existe no repositório avaliado e uma `line` é indicada, lê o arquivo do disco e extrai uma janela de 5 linhas (2 antes, a linha exata e 2 depois).
   - Renderiza com números de linha alinhados e marcador `>` na linha do achado:
     ```
     23 |   const criteria = req.query.q === 'undefined' ? '' : req.query.q ?? ''
     24 |   models.sequelize.query(
     25 > |     `SELECT * FROM Products WHERE ((name ...
     26 |   )
     ```

4. **Painel Visual Allure Aprimorado (`asvs-remediation-box`)**:
   - Tabela organizada com:
     - 📁 **Arquivo / Alvo Principal**: Arquivo com link conceitual ou pacote.
     - 📍 **Ocorrência na Aplicação (Callers)**: Arquivo(s) e linha(s) exatos onde a biblioteca é importada.
     - 🔗 **Cadeia de Dependência & Causa Raiz**: Caminho do pacote até a biblioteca vulnerável (ex.: `pdfkit -> crypto-js (CWE-327)`).
     - 🛡️ **Advisory / CVE**: ID do advisory, CWE e severidade.
     - 🖥️ **Trecho de Código / Evidência**: Bloco visual com código-fonte ou evidência de requisição/resposta DAST.
     - 💡 **Guia Prático de Correção**: Comandos e passos acionáveis para resolver a vulnerabilidade.

## 2. Conformidade com a Constituição

- **Princípio I (Zero Core Modification)**:
  - Nenhuma alteração nos scripts em `security-tests/` ou tabelas `shared-*.json`.
  - Toda a lógica é contida no módulo de pós-processamento do Web Wrapper (`web-ui/enricher.ts` e suíte de testes).
- **Princípio IV (Artefatos Originais como Fonte de Verdade)**:
  - Os dados são extraídos fielmente dos relatórios gerados pelos scanners originais em `security-reports/` e do código real do repositório clonado.
- **Princípio V (Stack Nativa Node/TypeScript)**:
  - Implementação pura em TypeScript com APIs nativas do Node.js (`fs`, `path`).

## 3. Plano de Verificação

1. **Testes Unitários**:
   - Adicionar casos de teste em `web-ui/enricher.test.ts` cobrindo:
     - Indexação de `npm-audit.json` e derivação de causa transitiva (`pdfkit` -> `crypto-js` com `CWE-327`).
     - Detecção de chamadores na aplicação (`findApplicationCallers`).
     - Extração de trecho real de código com gutter e indicador `>` (`readSourceSnippet`).
     - Indexação de ZAP com endpoint de runtime e evidência.
2. **Execução de Testes e Tipagem**:
   - `npm test`
   - `npm run typecheck`
3. **Validação no Juice Shop**:
   - Executar `npm run enrich juice-shop -- --level L1 --clean-history`.
   - Inspecionar `fd41b74c-5ca0-4e95-8c5d-6311914679d4-result.json` e verificar se `routes/order.ts:42`, `package.json:139` e `crypto-js (CWE-327)` aparecem com máxima clareza.
   - Iniciar o servidor e inspecionar a interface Allure.

