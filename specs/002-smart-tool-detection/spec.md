# Feature Specification: Smart Tool Detection & Target URL Verification (`002-smart-tool-detection`)

**Feature Branch**: `002-smart-tool-detection`  
**Created**: 2026-11-02  
**Status**: Approved  
**Input**: User request: *"como possivel iteracao 002 do sdd, seria possível, após inserir Target Repository URL (--repo-url), já verificar quais tools são possíveis de ter um scan e já deixar marcado ? ... ok, crie a iteracao sdd 002-smart-tool-detection"*

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Detecção Automática de Ferramentas Aplicáveis pela `--repo-url` (Priority: P1)

Como avaliador de segurança, ao inserir ou selecionar uma `Target Repository URL (--repo-url)` na aba nativa **`Security Scan (CLI)`** do Allure Report, quero que o sistema inspecione automaticamente o repositório (localmente ou via GitHub API / Git) e o ambiente da máquina para marcar automaticamente todas as ferramentas (`--tools`) aplicáveis e exibir o motivo de cada recomendação.

**Why this priority**: Maximiza a cobertura de capítulos do OWASP ASVS v5 sem que o avaliador precise adivinhar quais linguagens/arquivos existem no repositório ou quais scanners estão prontos no ambiente.

**Independent Test**: Inserir `https://github.com/juice-shop/juice-shop.git` em `--repo-url` e verificar que `npm-audit`, `trivy-fs`, `semgrep` e `gitleaks` são marcados automaticamente, enquanto `bandit` (sem código Python), `odc` (sem cache NVD rápido) e `sonar` (servidor SonarQube offline) permanecem desmarcados com diagnóstico explicativo.

**Acceptance Scenarios**:

1. **Given** a aba `Security Scan (CLI)` aberta no Allure Report, **When** o usuário preenche `--repo-url` (ou clica em um Preset / botão **"🔍 Auto-Detect Tools"**), **Then** o backend (`POST /api/detect-tools`) retorna o diagnóstico de cada uma das 8 ferramentas (`npm-audit`, `trivy-fs`, `semgrep`, `gitleaks`, `zap`, `odc`, `bandit`, `sonar`), marca automaticamente os checkboxes recomendados e atualiza o preview do comando CLI.
2. **Given** um repositório que contém código Python (`*.py`, `requirements.txt` ou `pyproject.toml`), **When** a detecção é executada, **Then** `bandit` também é marcado automaticamente.

---

### User Story 2 - Verificação de Conectividade da `--target-url` e Ativação Automática do `zap (Web DAST)` (Priority: P2)

Como avaliador de segurança, quando eu informar uma URL em `--target-url` (ou verificar uma aplicação web em execução), quero que o sistema teste a conectividade HTTP dessa URL, normalize automaticamente `localhost`/`127.0.0.1` para o endereço acessível pelo container Docker do ZAP (`http://172.17.0.1:<porta>` no Linux) quando necessário, e marque automaticamente o checkbox `zap (Web DAST)`.

**Why this priority**: Garante que a avaliação dinâmica (DAST, que cobre `V3.4` Browser Security Headers, Cookies, CORS e APIs) seja habilitada automaticamente sempre que houver uma aplicação web acessível.

**Independent Test**: Informar uma URL ativa em `--target-url`, clicar em verificar/detectar e confirmar que `zap (Web DAST)` é marcado automaticamente e exibe o status HTTP retornado pelo alvo.

---

### User Story 3 - Inicializador Rápido de Container Local para Aplicações de Estudo (Juice Shop / Flowise) (Priority: P3)

Como avaliador testando os estudos de caso clássicos (`Juice Shop` ou `Flowise`), quero poder iniciar (ou parar) um container Docker local da aplicação-alvo com 1 clique diretamente na aba `Security Scan (CLI)` do Allure Report, preenchendo automaticamente `--target-url` e habilitando o `zap (Web DAST)`.

**Why this priority**: Facilita testes completos (SAST + SCA + Secrets + DAST) em laboratório sem precisar abrir outro terminal para rodar `docker run`.

**Independent Test**: Clicar em **"🐳 Start Local Target Container"** para `juice-shop` ou `flowise` (ou consultar `/api/target-containers`) e verificar que `--target-url` é preenchido automaticamente com a URL acessível pelo ZAP.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Manter **zero alterações** nos arquivos rastreados do repositório original (`security-tests/run_security_scans.sh`, `asvs-unified-to-allure.ts`, `shared-asvs-map.json`, etc.).
- **FR-002**: Implementar `detectToolsForRepo(workspaceDir, repoUrl, branch, targetUrl)` em `web-ui/detector.ts` que avalia as 8 ferramentas do pipeline:
  - `npm-audit`: recomendado (`recommended: true`) quando `package.json` é detectado no repositório (local ou remoto via GitHub API / `git ls-remote`).
  - `trivy-fs`: recomendado (`recommended: true`) quando Docker está disponível.
  - `semgrep`: recomendado (`recommended: true`) quando Docker está disponível.
  - `gitleaks`: recomendado (`recommended: true`) quando Docker está disponível.
  - `bandit`: recomendado (`recommended: true`) apenas quando arquivos `.py`, `requirements.txt`, `Pipfile` ou `pyproject.toml` são detectados no repositório.
  - `odc`: recomendado (`recommended: true`) apenas quando o cache local NVD (`odc.mv.db` / `dc.h2.db`) ou `NVD_API_KEY` está configurado; caso contrário, `available: true, recommended: false` com aviso sobre o tempo de download inicial da NVD.
  - `sonar`: recomendado (`recommended: true`) apenas quando `SONAR_HOST_URL` (ou `http://127.0.0.1:9000`) responde HTTP 200.
  - `zap`: recomendado (`recommended: true`) quando `targetUrl` é informada e responde via HTTP/HTTPS.
- **FR-003**: Expor `POST /api/detect-tools` no `web-ui/server.ts` retornando as ferramentas recomendadas, motivos detalhados por ferramenta, capítulos ASVS cobertos e status de conectividade da `targetUrl`.
- **FR-004**: Expor `POST /api/target-container` (`action: 'start' | 'stop' | 'status'`, `preset: 'juice-shop' | 'flowise'`) para gerenciar opcionalmente containers locais de estudo em Docker e retornar a `targetUrl` pronta (`http://172.17.0.1:<port>`).
- **FR-005**: Atualizar a aba nativa `Security Scan (CLI)` em `web-ui/allure-plugin.ts` para disparar a autodetecção sempre que `--repo-url`, Preset ou `--target-url` mudar, marcando automaticamente os checkboxes recomendados e exibindo badges de diagnóstico por ferramenta.

## Success Criteria *(mandatory)*

- **SC-001**: `git status --porcelain -uno` permanece vazio (zero arquivos originais modificados).
- **SC-002**: `npx tsc -p web-ui/tsconfig.json --noEmit` e `node --test -r ts-node/register web-ui/runner.test.ts` passam com 100% de aprovação incluindo testes para `detectToolsForRepo` e `POST /api/detect-tools`.
- **SC-003**: Na aba `Security Scan (CLI)` do Allure Report, ao selecionar/digitar um repositório, as ferramentas compatíveis são marcadas automaticamente e exibem seus diagnósticos e capítulos ASVS cobertos.

