# Especificação: Reclassificação Visual e Semântica de Findings Não-Bloqueantes (`017-reclassify-non-blocking-findings-status-and-colors`)

## 1. Contexto e Motivação
Em auditorias de segurança de software e pipelines DevSecOps (como OWASP ASVS v5.0.0), **nenhum achado de vulnerabilidade identificado (finding) deve ser considerado "Passed" (Aprovado) ou colorido em verde**. Mesmo achados de menor criticidade (Medium, Low, Unknown / Informational) representam débitos técnicos de segurança ou exposições que exigem atenção, e não sucessos de teste.

Atualmente, o Allure Report nativo classifica achados Medium e Low como `status: "passed"` com ícones de visto verde (`fa-check-circle`) e barras/gráficos verdes (`#97cc64`). Isso induz a falsas impressões de aprovação e conformidade plena.

Adicionalmente, ao reclassificar o status `passed` para a cor **Amarela** (`Warning`), surge um conflito direto com o status nativo `broken` do Allure (que originalmente utiliza tons amarelos/alaranjados `#ffd050`). Para eliminar qualquer ambiguidade, o status `broken` deve ser redefinido para a cor **Marrom** (`#795548` / `#6d4c41`).

---

## 2. Histórias de Usuário (User Stories)

### US-01: Eliminação de "Passed" em Achados de Segurança
**Como** Analista de Segurança / Engenheiro DevSecOps,  
**Quero** que nenhum finding de segurança seja exibido como `Passed` ou com a cor verde no Allure Report,  
**Para que** a equipe de desenvolvimento compreenda claramente que todo achado detectado é uma vulnerabilidade/aviso que requer atenção, mesmo quando não for bloqueante.

### US-02: Novo Status e Paleta Amarela para Achados Não-Bloqueantes
**Como** Auditor de Conformidade ASVS,  
**Quero** que achados de menor criticidade (Medium, Low, Info) tenham a denominação de status alterada para `Warning` (ou `Advisory` / Não-Bloqueante) com coloração visual estritamente **Amarela**,  
**Para que** haja distinção inequívoca entre vulnerabilidades bloqueantes (`Failed` - Vermelho) e avisos/não-bloqueantes (`Warning` - Amarelo).

### US-03: Resolução de Conflito de Cores com o Status "Broken"
**Como** Usuário do Relatório Allure,  
**Quero** que qualquer item com status `Broken` (erros de execução de teste/infraestrutura) seja apresentado na cor **Marrom**,  
**Para que** a nova cor amarela dos achados `Warning` não seja confundida com problemas de quebra de teste.

---

## 3. Requisitos Funcionais

* **RF-01: Reclassificação do Status Exibido**
  * O texto do status nativo `Passed` / `Passou` em badges de cabeçalho, barras de ferramentas, filtros de status (`status-toggle`) e legendas deve ser substituído pelo termo **`Warning`** (indicando achado não-bloqueante de menor severidade).
  * O tooltip e metadados devem esclarecer que se trata de vulnerabilidade/aviso monitorado (não-bloqueante).

* **RF-02: Paleta Amarela para "Warning" (antigo Passed)**
  * Substituir todos os estilos visuais verdes (`#97cc64`, `#a6e19d`, `#2e7d32`, `#f1f8e9`):
    * Barras de progresso e widgets (`.bar__fill_status_passed`): Amarelo (`#fbc02d`).
    * Badges de contagem e filtros (`.y-label_status_passed`, `.n-label_status_passed`, `.label_status_passed`): Amarelo (`#fbc02d` / `#fff59d`).
    * Gráficos SVG Donut / Pizza (`.chart__fill_status_passed`, `.chart__legend-icon_status_passed`): Amarelo (`#fbc02d`).
    * Ícone na árvore de Suites: Substituir o visto verde (`fa-check-circle`) por ícone de aviso amarelo (`fa-exclamation-triangle` / `\f071` em `#f57f17`).
    * Caixa de remediação (`asvs-remediation-box`): Para achados Medium/Low, utilizar fundo amarelo/âmbar suave (`#fffde7`), borda âmbar (`#f57f17`), e badges amarelos, sem elementos verdes.

* **RF-03: Paleta Marrom para "Broken"**
  * Substituir os estilos visuais de `broken` (`#ffd050`, `#ffeca0`) pela cor **Marrom**:
    * Barras de progresso (`.bar__fill_status_broken`): Marrom (`#795548`).
    * Badges e contadores (`.y-label_status_broken`, `.n-label_status_broken`, `.label_status_broken`): Marrom (`#795548` / `#efebe9`).
    * Gráficos SVG (`.chart__fill_status_broken`, `.chart__legend-icon_status_broken`): Marrom (`#795548`).
    * Textos e ícones (`.text_status_broken`): Marrom escuro (`#5d4037`).
    * Alertas e caixas de status (`.alert_status_broken`, `.status-details_status_broken`): Fundo marrom claro (`#efebe9`) com borda marrom (`#8d6e63`).

* **RF-04: Card de Remediação Adaptativo no Enriquecedor (`web-ui/enricher.ts`)**
  * Adaptar o gerador de HTML do card de remediação para utilizar tema visual condizente com a severidade:
    * **Critical / High (`failed`)**: Tema Vermelho (`#c62828`, `#ffebee`).
    * **Medium / Low / Unknown (`warning`)**: Tema Amarelo/Âmbar (`#f57f17`, `#fffde7`, borda `#ffe082`).

---

## 4. Critérios de Aceitação

* **AC-01**: Nenhum componente da interface gráfica Allure exibe o termo "Passed" ou cor verde para descrever findings de vulnerabilidade.
* **AC-02**: Achados Medium, Low e Unknown aparecem com status visual **Warning** e coloração estritamente **Amarela** em gráficos, barras, listas e badges.
* **AC-03**: Os ícones na árvore de suites para achados Warning exibem símbolo de alerta (`fa-exclamation-triangle`) na cor amarela/âmbar em vez do visto verde.
* **AC-04**: O status `Broken` adota coloração **Marrom** consistente em todos os seletores CSS e gráficos, sem colidir com o amarelo do Warning.
* **AC-05**: Todos os testes automatizados existentes continuam passando com 100% de sucesso (`npm test` e `npm run typecheck`).
* **AC-06**: Princípio I da Constituição estritamente respeitado (zero alterações em `security-tests/` e arquivos originais).

