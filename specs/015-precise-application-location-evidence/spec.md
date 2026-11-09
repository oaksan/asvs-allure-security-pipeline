# Spec: Evidência Precisa de Localização na Aplicação e em Tempo de Execução (`015-precise-application-location-evidence`)

## Contexto e Motivação
Na iteração anterior (`014`), adicionamos a localização básica dos findings e caixas de remediação nos relatórios Allure. Contudo, ao inspecionar achados específicos como o requisito **OWASP ASVS V11.3.1** (*"Verify that insecure block modes (e.g., ECB) and weak padding schemes (e.g., PKCS#1 v1.5) are not used"*), identificou-se uma deficiência crítica de contexto:
- O relatório apontava apenas o pacote `pdfkit` sob o scanner `npm-audit`, sem explicar **onde na aplicação** o `pdfkit` é importado ou utilizado.
- Não ficava evidente por que o `pdfkit` violava um controle de criptografia (`V11.3.1`), ocultando que a causa raiz é a dependência transitiva vulnerável `crypto-js` (`CWE-327: Use of a Broken or Risky Cryptographic Algorithm`, com entropia insuficiente e PBKDF2 obsoleto - advisories `GHSA-xwcq-pm8m-c4vf` e `GHSA-rg76-677x-56q9`).
- Em achados SAST (Semgrep) e DAST (ZAP), faltava a exibição do trecho exato de código-fonte circunvizinho (com número de linha destacado) e das evidências de requisição/resposta em tempo de execução (*runtime endpoint*, método HTTP, parâmetro e cabeçalho afetado).

Esta iteração visa resolver essa lacuna de rastreabilidade, fornecendo a desenvolvedores e auditores a localização exata no código-fonte do repositório avaliado e nas rotas em execução.

## Requisitos Funcionais

### RF-01: Rastreabilidade de Dependências (SCA) no Código da Aplicação
1. Para achados de dependências (`npm-audit`, `trivy`), indexar o arquivo `security-reports/npm-audit.json` e o `package.json` / `package-lock.json` do alvo.
2. Identificar a cadeia de dependência completa (ex.: `juice-shop -> pdfkit@0.11.0 -> crypto-js@<=4.1.1`).
3. Buscar ativamente nos arquivos de código-fonte da aplicação (`.ts`, `.js`, `.json`) onde o componente vulnerável é declarado (`package.json`) e onde é importado ou instanciado em tempo de execução (ex.: `routes/order.ts:42: const { default: PDFDocument } = await import('pdfkit')`).
4. Extrair os advisories subjacentes (CVE / GHSA), CWEs (ex.: `CWE-327`), severidade CVSS e justificativa da vinculação com o requisito ASVS.

### RF-02: Trecho Real do Código-Fonte com Contexto para SAST
1. Para achados estáticos (`semgrep`, `njsscan`), quando um arquivo e linha forem identificados (ex.: `routes/search.ts:25`), ler diretamente as linhas do arquivo original no repositório avaliado.
2. Formatar um trecho de código com contexto (ex.: 2 linhas antes, linha vulnerável com ponteiro visual `>` e 2 linhas depois), com numeração de linha clara.
3. Se o scanner fornecer um snippet próprio, mesclá-lo caso o arquivo não seja acessível localmente.

### RF-03: Evidências em Tempo de Execução para DAST (OWASP ZAP)
1. Indexar o relatório de alertas do ZAP (`security-reports/zap-report.json` ou arquivo no Allure).
2. Para cada alerta de DAST, extrair:
   - URL e Endpoint em execução (`uri`, ex.: `http://172.17.0.1:3000/rest/user/login`).
   - Método HTTP (`method`: `GET`, `POST`, etc.).
   - Parâmetro ou cabeçalho vulnerável (`param`, `evidence`).
   - Solução recomendada pelo ZAP.
3. Correlacionar a URL da rota com o respectivo arquivo de rota na aplicação (ex.: `/rest/user/login` -> `routes/login.ts`).

### RF-04: Exibição Aprimorada nos Detalhes do Finding no Allure
1. Atualizar o bloco `asvs-remediation-box` em `descriptionHtml` para conter:
   - **Localização Exata**: Arquivo, linha, manifesto e chamadores na aplicação.
   - **Cadeia de Vulnerabilidade / Causa Raiz**: Pacote vulnerável, dependência transitiva que causou a falha e identificador do advisory/CVE.
   - **Trecho de Código ou Evidência de Runtime**: Bloco com visual de código (`pre`/`code`) com a linha ofensora destacada.
   - **Guia Técnico de Remediação**: Ação direta necessária para corrigir o finding (ex.: upgrade de versão, sanitização ou configuração de cabeçalho).
2. Atualizar a lista de parâmetros Allure (`parameters`) com chaves estruturadas: `Location`, `Line`, `Tool`, `Remediation`, `Advisory`, `App Caller`.

## Critérios de Aceitação
- **AC-01**: O finding `V11.3.1` (pdfkit/crypto-js) deve indicar explicitamente a chamada em `routes/order.ts:42`, a declaração em `package.json:139`, a dependência transitiva `crypto-js` com `CWE-327` e o advisory `GHSA-xwcq-pm8m-c4vf`.
- **AC-02**: Achados SAST devem renderizar o bloco de código com linhas numeradas e a linha exata apontada pelo scanner.
- **AC-03**: Achados DAST do ZAP devem apresentar o endpoint HTTP (`uri`), método, parâmetro/evidência e a solução do scanner.
- **AC-04**: Total conformidade com a Constituição (Princípio I - Zero Core Modification: nenhum arquivo em `security-tests/` ou tabelas `shared-*.json` alterados).
- **AC-05**: Suíte de testes automatizados (`npm test`) passando 100% e verificação de tipos estrita (`npm run typecheck`) sem erros.

