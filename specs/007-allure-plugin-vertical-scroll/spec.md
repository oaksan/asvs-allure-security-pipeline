# Feature Specification: Vertical Scroll Restoration for Native Allure Plugin Views (`007-allure-plugin-vertical-scroll`)

**Feature Branch**: `007-allure-plugin-vertical-scroll`  
**Created**: 2026-11-03  
**Status**: Approved  
**Input**: User request: *"gere uma nova iteracao 007 para corrigir a questao que estou sem scroll vertical nas páginas Security Scan e OWASP ASVS v5 Matrix"*

---

## 1. Root Cause Analysis (Diagnóstico Técnico de Layout CSS no Allure Report 2)

A inspeção da folha de estilos nativa do Allure Report 2 (`allure-report/<repo>/styles.css`) revelou a seguinte hierarquia de containers DOM:

```css
body, html { font-size: 14px; height: 100%; }
#content { display: flex; flex-direction: column; height: 100%; min-height: 100%; overflow: hidden; }
#content .app { flex: 1; }
.app { background: #fff; display: flex; }
.app__content { flex: 1; overflow: auto; position: relative; }
```

### Por que o scroll vertical estava bloqueado nas abas `Security Scan (CLI)` e `ASVS v5 Matrix`?

1. **Comportamento `min-height: auto` em Flex Containers Colunares (W3C CSS Flexbox §4.5)**:
   - O container raiz `#content` é um flex container com `flex-direction: column; height: 100%; overflow: hidden;`.
   - O filho direto `#content .app` possui `flex: 1; display: flex;`, mas **não define `min-height: 0` nem `height: 100%`**.
   - Quando `.asvs-plugin-page` era inserido em fluxo estático (`position: static; height: 100%; overflow-y: auto;`) dentro de `.app__content`, a altura intrínseca da tabela de 35 requisitos ASVS (ou do formulário completo de CLI + terminal) forçava `.app` a expandir sua altura além da viewport (`> 100vh`).
   - Como `.app` ficava com a altura total do conteúdo interno, `.app__content` e `.asvs-plugin-page` nunca atingiam condição de *overflow* interno, enquanto o ancestral `#content` cortava (*clipping*) todo o conteúdo excedente com `overflow: hidden`, impedindo qualquer barra de rolagem vertical.

2. **Padrão Nativo das Views do Allure Report 2 (`.widgets-grid` e `.side-by-side`)**:
   - No CSS original do Allure Report 2, as views nativas que possuem rolagem vertical própria dentro de `.app__content` (como `.widgets-grid` na aba Overview e `.side-by-side` nas abas Suites/Behaviors) utilizam posicionamento absoluto ancorado às quatro bordas de `.app__content` (`position: relative`):
     ```css
     .widgets-grid {
       position: absolute;
       top: 0;
       right: 0;
       bottom: 0;
       left: 0;
       max-height: 100%;
       overflow: auto;
     }
     ```
   - Ao ancorar a view com `position: absolute; top: 0; right: 0; bottom: 0; left: 0; max-height: 100%; overflow-y: auto;`, o elemento desacopla sua altura intrínseca do cálculo de `min-height: auto` de `.app` e fica estritamente confinado à altura visível da viewport (`100vh`), ativando imediatamente a barra de rolagem vertical nativa do navegador.

---

## 2. User Scenarios & Testing *(mandatory)*

### User Story 1 - Rolagem Vertical Completa na Aba `Security Scan (CLI)` (`#security-scan`) (Priority: P1)

Como usuário configurando e acompanhando um scan de segurança na aba **`Security Scan (CLI)`** (`#security-scan`), quero poder rolar verticalmente toda a página (desde o cabeçalho até as opções autenticadas do ZAP, o terminal de saída em tempo real e a tabela de execuções recentes) em qualquer resolução de tela.

**Why this priority**: Quando as opções avançadas do ZAP são exibidas ou quando a tela possui altura reduzida, os controles inferiores e o histórico de execuções ficavam inacessíveis sem scroll vertical.

**Independent Test**: Acessar `http://127.0.0.1:8765/#security-scan`, habilitar `zap (Web DAST)` no modo `auth` e verificar que a página possui barra de rolagem vertical funcional até o final de todos os cards.

---

### User Story 2 - Rolagem Vertical Completa na Aba `ASVS v5 Matrix` (`#asvs-matrix`) (Priority: P1)

Como pesquisador analisando os **35 requisitos (`req_id`)** acionados no estudo de caso `juice-shop` na aba **`ASVS v5 Matrix`** (`#asvs-matrix`), quero rolar verticalmente a página inteira para inspecionar todos os requisitos do início (`V15.2.1`) até o último item (`V3.7.1`) sem corte visual.

**Why this priority**: Com a mudança de `section_id` (9 linhas) para `req_id` (35 linhas detalhadas com descrições oficiais do CSV na Iteração SDD 006), a tabela ultrapassa a altura de uma tela padrão (`1080p`), tornando o scroll vertical indispensável.

**Independent Test**: Acessar `http://127.0.0.1:8765/#asvs-matrix` e verificar que `.asvs-plugin-page` possui `position: absolute; top: 0; right: 0; bottom: 0; left: 0; max-height: 100%; overflow-y: auto;` e permite rolar até o último requisito da tabela com espaçamento inferior (`padding-bottom: 48px`).

---

## 3. Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Atualizar `.asvs-plugin-page` em [`web-ui/allure-plugin.ts`](file:///home/user/felipe/speckit/assat/web-ui/allure-plugin.ts) para utilizar o padrão de ancoragem absoluta do Allure Report 2 (`position: absolute; top: 0; right: 0; bottom: 0; left: 0; max-height: 100%; overflow-y: auto; overflow-x: hidden; padding: 20px 28px 48px 28px;`).
- **FR-002**: Adicionar regras de contenção Flexbox (`#content .app { min-height: 0; height: 100%; overflow: hidden; }` e `.app__content { min-height: 0; height: 100%; overflow-y: auto; position: relative; }`) em `getAllurePluginCss()` em [`web-ui/allure-plugin.ts`](file:///home/user/felipe/speckit/assat/web-ui/allure-plugin.ts).
- **FR-003**: Reinstalar automaticamente os arquivos estáticos do plugin (`styles.css` e `index.js`) nos diretórios `allure-report/<repo>/plugin/asvs-pipeline/` e `security-reports/_bin/allure-2.29.0/plugins/asvs-pipeline-plugin/static/`.
- **FR-004**: Preservar 100% dos arquivos originais do repositório upstream sem modificações (Princípio I da Constituição).

## 4. Success Criteria *(mandatory)*

- **SC-001**: `GET /plugin/asvs-pipeline/styles.css` serve `.asvs-plugin-page` com `position: absolute`, `top: 0`, `bottom: 0`, `max-height: 100%`, `overflow-y: auto` e `#content .app { min-height: 0; height: 100%; }`.
- **SC-002**: Ambas as abas `#security-scan` e `#asvs-matrix` exibem barra de rolagem vertical funcional até o final do conteúdo.
- **SC-003**: `npx tsc -p web-ui/tsconfig.json --noEmit` e `node --test -r ts-node/register web-ui/runner.test.ts` passam com 100% de aprovação.

