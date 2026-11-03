# Feature Specification: ZAP Container Permissions, Clean Per-Run Rollup & Cross-Tool ASVS Matrix (`005-zap-permissions-and-asvs-matrix`)

**Feature Branch**: `005-zap-permissions-and-asvs-matrix`  
**Created**: 2026-11-03  
**Status**: Approved  
**Input**: User request: *"crie a iteracao sdd 005"*

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Rootless Docker Write Permissions for OWASP ZAP Reports (Priority: P1)

As a security engineer running `zap` via `security-tests/run_security_scans.sh` in a rootless Docker environment, I want `security-reports/` and the temporary `/zap/wrk/zap.yaml` file to be writable by the container's `zap` user (`uid=1000`) during the scan and cleaned up afterward, so that OWASP ZAP never fails with `AccessDeniedException /zap/wrk/./security-reports/zap-report.html` or `[Errno 13] Permission denied: '/zap/wrk/zap.yaml'`, and its DAST findings are parsed into Allure and `severity-rollup.json` without modifying `security-tests/run_security_scans.sh`.

**Why this priority**: In rootless Docker, the host user (`uid=1000`) maps to `root` (`uid=0`) inside the container, while `ghcr.io/zaproxy/zaproxy:stable` runs as `uid=1000(zap)`. Unless `security-reports/` has `0o777` permissions and `zap.yaml` is pre-created with `0o666` permissions before the container starts, ZAP completes its DAST scan (`WARN-NEW: 7`) but fails to write `zap-report.json` and `zap-report.html`.

**Independent Test**: Run `zap` baseline against `juice-shop` and verify `security-reports/zap-report.json` is written and `byTool.zap` appears in `allure-results/juice-shop/severity-rollup.json`.

**Acceptance Scenarios**:

1. **Given** `zap` is included in `--tools`, **When** `PipelineRunManager.startRun` starts a scan, **Then** `<workspaceDir>/security-reports` is set to mode `0o777`, any stale `zap-report.*` files are removed before the run, `<workspaceDir>/zap.yaml` is pre-created with mode `0o666`, and `<workspaceDir>/zap.yaml` is removed as soon as the scan exits.
2. **Given** a new scan is started for `<repoName>`, **When** `PipelineRunManager.startRun` initializes the run, **Then** stale `*-result.json` and `severity-rollup.*` from prior runs in `allure-results/<repoName>` are reset (preserving `history/`), matching `allure_init_iteration` in `run_security_scans.timer.sh` so counts do not multiply across runs.

---

### User Story 2 - Complete Cross-Tool OWASP ASVS v5 Matrix (Priority: P1)

As a security engineer inspecting the **ASVS v5 Matrix** tab inside the Allure Report, I want the table to parse `asvs-summary.csv` (`control,chapter,levels,count,tools`) and aggregate ASVS labels across all `*-result.json` files in `allure-results/<repoName>`, so that every scanner tool (`npm-audit`, `trivy`, `semgrep`, `gitleaks`, `zap`, `odc`, `bandit`, `sonar`) and its mapped ASVS v5 controls are displayed with a `Tools` column.

**Why this priority**: `asvs-unified-to-allure.ts` writes `asvs-summary.csv` with 5 columns (`control,chapter,levels,count,tools`) and overwrites it per tool invocation. Merging `asvs-summary.csv` with the `*-result.json` ASVS tags gives a complete cross-tool ASVS v5 matrix without modifying `asvs-unified-to-allure.ts`.

**Independent Test**: Query `GET /api/projects/juice-shop` and verify `asvsSummary` includes controls from `npm-audit`, `trivy`, `semgrep`, and `zap` with `asvsId`, `chapter`, `title`, `levels`, `tools`, and `count`.

---

### User Story 3 - Scan Completion Banner & Optional Auto-Open in Allure (Priority: P2)

As a user running a scan from the `Security Scan (CLI)` tab, I want a clear completion banner with a 1-click **"📊 Open Updated Allure Overview"** button (and an optional **"Auto-open Allure Overview when scan finishes"** checkbox) when the scan finishes, so I know immediately how to view the newly generated Allure Report.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: `PipelineRunManager.startRun` in `web-ui/runner.ts` MUST ensure `security-reports/` has mode `0o777`, pre-create `zap.yaml` (`0o666`) when `zap` is selected, and delete `zap.yaml` when the child process exits.
- **FR-002**: `PipelineRunManager.startRun` in `web-ui/runner.ts` MUST reset stale `*-result.json`, `*-attachment`, and `severity-rollup.*` in `allure-results/<repoName>` before starting a standard scan while preserving `history/`.
- **FR-003**: `parseAsvsSummaryCsv` and `getProjectArtifacts` in `web-ui/runner.ts` MUST parse `control,chapter,levels,count,tools` rows and aggregate ASVS mappings across `allure-results/<repoName>/*-result.json`.
- **FR-004**: `web-ui/allure-plugin.ts` MUST display the `Tools` column in the `ASVS v5 Matrix` tab and show a completion banner with a 1-click `"📊 Open Updated Allure Overview"` button when a scan finishes.
- **FR-005**: All original repository files MUST remain 100% unmodified.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: OWASP ZAP writes `security-reports/zap-report.json` and `zap-report.html` with zero `AccessDeniedException` errors in rootless Docker.
- **SC-002**: `GET /api/projects/<repoName>` returns the complete cross-tool `asvsSummary` array with `asvsId`, `chapter`, `title`, `levels`, `tools`, and `count`.
- **SC-003**: `git status --porcelain -uno` shows zero modifications to any upstream tracked file.

