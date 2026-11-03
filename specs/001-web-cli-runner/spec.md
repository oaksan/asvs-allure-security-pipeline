# Feature Specification: Native Allure Report Plugin for Security Pipeline (`001-web-cli-runner`)

**Feature Branch**: `001-web-cli-runner`  
**Created**: 2026-11-02  
**Status**: Approved  
**Input**: User request: *"eu desejo que as novas funcionalidades sejam adicionadas direto na interface grafica do Allure Report. Seria possível criar uma iteracao SDD que apenas adiciona modulos na interface grafica do Allure Report ?"*

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Executar `run_security_scans.sh` de dentro de uma Aba Nativa do Allure Report (Priority: P1)

Como avaliador de segurança, ao abrir o Allure Report no navegador, quero clicar em uma aba nativa na barra lateral esquerda do próprio Allure (**`Security Scan`**) para preencher os parâmetros de linha de comando de `security-tests/run_security_scans.sh`, visualizar o comando CLI equivalente, iniciar a avaliação e acompanhar o log do terminal em tempo real sem sair da interface do Allure Report.

**Why this priority**: Mantém 100% a interface gráfica oficial do Allure Report (sem criar uma interface web paralela), adicionando apenas um módulo/aba nativo via `allure.api.addTab`.

**Independent Test**: Abrir `http://127.0.0.1:8765/#security-scan`, verificar que o menu lateral padrão do Allure (*Overview, Categories, Suites, Graphs, Timeline, Behaviors, Packages*) está presente junto com a aba *Security Scan*, preencher `--repo-url` e `--tools` e disparar uma execução.

**Acceptance Scenarios**:

1. **Given** o Allure Report aberto no navegador, **When** o usuário clica no item **`Security Scan`** (`#security-scan`) na barra lateral esquerda do Allure, **Then** o painel principal do Allure (`allure.components.AppLayout`) renderiza o formulário 1:1 de parâmetros do `run_security_scans.sh`, o preview do comando CLI (com segredos mascarados) e o console em tempo real.
2. **Given** uma execução concluída na aba **`Security Scan`**, **When** o scan termina e gera `./allure-report/<repo>`, **Then** o usuário pode alternar ou recarregar o Allure Report para inspecionar imediatamente as abas *Overview*, *Categories*, *Suites*, *Behaviors* e *ASVS v5 Matrix* do projeto avaliado.

---

### User Story 2 - Visualizar a Matriz ASVS v5 (`asvs-summary.csv`) e Rollup (`severity-rollup.json`) em Aba Nativa do Allure (Priority: P2)

Como avaliador de segurança, quero clicar na aba nativa **`ASVS v5 Matrix`** (`#asvs-matrix`) na barra lateral do Allure Report para visualizar em tabela dedicada os artefatos que o parser original (`asvs-unified-to-allure.ts`) gera (`asvs-summary.csv`, `severity-rollup.json` e `timings.csv`).

**Why this priority**: Expõe diretamente dentro do Allure Report os resumos consolidados do OWASP ASVS v5 que o script original já produz em `./allure-results/<repo>/`.

**Independent Test**: Abrir `http://127.0.0.1:8765/#asvs-matrix` e verificar os contadores de severidade por ferramenta (`severity-rollup.json`) e a tabela de controles ASVS (`asvs-summary.csv`).

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Nenhum arquivo rastreado do repositório original (`security-tests/run_security_scans.sh`, `security-tests/run_security_scans.timer.sh`, `security-tests/parsers/asvs-unified-to-allure.ts`, `shared-asvs-map.json`, `shared-owasp-map.json`, `shared-owners-map.json`, `package.json`, `tsconfig.json`, `README.md`, `LICENSE`, `CITATION.cff`) deve ser modificado.
- **FR-002**: A interface gráfica servida em `GET /` deve ser o próprio **Allure Report oficial** (`./allure-report/<active-repo>/index.html`), estendido exclusivamente via API nativa de plugins do Allure 2 (`allure.api.addTab`, `allure.api.addTranslation`, `allure.components.AppLayout`, `Backbone.Marionette.View`).
- **FR-003**: O plugin nativo do Allure deve adicionar duas abas à barra lateral do Allure Report:
  - `security-scan` (**Security Scan**): seletor do projeto ativo no Allure, formulário 1:1 com a CLI de `run_security_scans.sh` (`--repo-url`, `--branch`, `--tools`, `--zap-mode`, `--target-url`, `--openapi`, `--zap-*` auth, `run_security_scans.timer.sh`), preview do comando CLI e console `stdout`/`stderr` ao vivo.
  - `asvs-matrix` (**ASVS v5 Matrix**): visualização nativa dentro do Allure para `severity-rollup.json`, `asvs-summary.csv` e `timings.csv` do projeto atual.
- **FR-004**: O plugin deve ser instalado também em `security-reports/_bin/allure-2.29.0/plugins/asvs-pipeline-plugin/` e registrado em `security-reports/_bin/allure-2.29.0/config/allure.yml` para que toda execução futura do `allure generate` já inclua os arquivos do plugin nativamente.

## Success Criteria *(mandatory)*

- **SC-001**: `git status --porcelain -uno` retorna vazio (zero alterações nos arquivos rastreados do repositório original).
- **SC-002**: `GET /` entrega a interface gráfica original do Allure Report com os scripts do plugin nativo carregados (`plugin/asvs-pipeline/index.js` e `plugin/asvs-pipeline/styles.css`).
- **SC-003**: `npx tsc -p web-ui/tsconfig.json --noEmit` e `node --test -r ts-node/register web-ui/runner.test.ts` passam com 100% de sucesso.
