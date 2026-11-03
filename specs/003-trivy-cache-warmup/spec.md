# Feature Specification: Automatic Trivy DB Cache Warmup & Fast NPM Mode (`003-trivy-cache-warmup`)

**Feature Branch**: `003-trivy-cache-warmup`  
**Created**: 2026-11-02  
**Status**: Approved  
**Input**: User request: *"poderia criar uma nova iteracao sdd para corrigir: ... 2026-11-03T02:15:09Z ERROR [vulndb] The first run cannot skip downloading DB / FATAL Fatal error run error: init error: DB error: database error: --skip-db-update cannot be specified on the first run"*

## Root Cause Analysis

No script original `security-tests/run_security_scans.sh` (linhas 700–711), a função `run_trivy_fs()` executa:
```bash
docker run --rm -v "$WORKSPACE_DIR":/work -w /work -v "$TRIVY_CACHE_DIR":/root/.cache/ \
  "$TRIVY_IMAGE" fs --scanners vuln,misconfig,secret --format json --output "$REPORT_JSON" --skip-db-update "$LOCAL_DIR"
```
Como o script original passa a flag fixa `--skip-db-update`, o Trivy exige que o banco de dados de vulnerabilidades (`$HOME/.cache/trivy/db/trivy.db`) já tenha sido baixado previamente (etapa de *cache warmup* descrita no `README.md` original). Quando o diretório `$HOME/.cache/trivy/db/trivy.db` ainda não existe na máquina, o Trivy falha com `ERROR [vulndb] The first run cannot skip downloading DB`.

Além disso, em projetos grandes como o `juice-shop`, a etapa `npm install` executa scripts de `postinstall` (build completo do Angular em produção, levando ~2 minutos) mesmo quando o repositório já possui `package-lock.json` ou `node_modules`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Pré-Aquecimento Automático do Banco de Dados do Trivy (`trivy.db`) antes do Scan (Priority: P1)

Como avaliador de segurança, quando eu executar um scan contendo `trivy-fs` e o cache local `$TRIVY_CACHE_DIR/db/trivy.db` ainda não existir na máquina, quero que o `PipelineRunManager` execute automaticamente o download inicial do banco do Trivy (`trivy image --download-db-only`) antes de chamar `security-tests/run_security_scans.sh`, sem precisar alterar o script original.

**Why this priority**: Elimina definitivamente o erro fatal `--skip-db-update cannot be specified on the first run` mantendo `security-tests/run_security_scans.sh` 100% intocado (Princípio I da Constituição).

**Independent Test**: Verificar com `ensureTrivyDbReady()` que o arquivo `~/.cache/trivy/db/trivy.db` é baixado automaticamente quando ausente e que `trivy-fs` passa a executar com código de saída `0`.

**Acceptance Scenarios**:

1. **Given** `trivy-fs` selecionado em `--tools` e `~/.cache/trivy/db/trivy.db` ausente, **When** a execução inicia, **Then** o runner executa `docker run --rm -v "$TRIVY_CACHE_DIR:/root/.cache/" aquasec/trivy:latest image --download-db-only` transmitindo o progresso no console ao vivo antes de iniciar `security-tests/run_security_scans.sh`.
2. **Given** `~/.cache/trivy/db/trivy.db` já presente na máquina, **When** a execução inicia, **Then** o pré-aquecimento é pulado instantaneamente (`Trivy DB cache ready`).

---

### User Story 2 - Opção de Pular Build Desnecessário no `npm install` (`SKIP_NPM_INSTALL=true`) (Priority: P2)

Como avaliador de segurança, quero ter na aba `Security Scan (CLI)` do Allure um checkbox **`Skip slow npm postinstall build (SKIP_NPM_INSTALL=true)`** (pré-ativado quando o clone local já possui `node_modules` ou `package-lock.json`) para que o pipeline não gaste 2 minutos compilando o frontend Angular do Juice Shop a cada scan.

**Why this priority**: Reduz o tempo de scan de projetos como `juice-shop` em ~2 minutos, usando a variável de ambiente nativa `SKIP_NPM_INSTALL=true` que já existe na linha 474 de `security-tests/run_security_scans.sh`.

## Requirements *(mandatory)*

- **FR-001**: Preservar `security-tests/run_security_scans.sh` e todos os arquivos originais do repositório sem nenhuma modificação (`git status --porcelain -uno` vazio).
- **FR-002**: Implementar `isTrivyDbCached(trivyCacheDir)` e a etapa de *pre-flight warmup* (`docker run --rm -v <cache>:/root/.cache/ aquasec/trivy:latest image --download-db-only`) em `web-ui/runner.ts` sempre que `trivy-fs` estiver selecionado e `db/trivy.db` não existir.
- **FR-003**: Exibir o status do cache do Trivy em `web-ui/detector.ts` e adicionar o controle `SKIP_NPM_INSTALL=true` na aba `Security Scan (CLI)` em `web-ui/allure-plugin.ts`.

## Success Criteria *(mandatory)*

- **SC-001**: `~/.cache/trivy/db/trivy.db` presente e validado; `trivy-fs` executa sem o erro `--skip-db-update cannot be specified on the first run`.
- **SC-002**: `npx tsc -p web-ui/tsconfig.json --noEmit` e `node --test -r ts-node/register web-ui/runner.test.ts` passam com 100% de sucesso.
- **SC-003**: `git status --porcelain -uno` vazio.
