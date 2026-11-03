# Feature Specification: Semgrep Per-Rule Timeout Optimization (`004-semgrep-per-rule-timeout`)

**Feature Branch**: `004-semgrep-per-rule-timeout`  
**Created**: 2026-11-02  
**Status**: Approved  
**Input**: User request: *"crie um sdd 004 para ajustar SEMGREP_TIMEOUT=10"*

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Fast Semgrep SAST Execution via `SEMGREP_TIMEOUT=10` (Priority: P1)

As a security engineer running `semgrep` via `security-tests/run_security_scans.sh` against repositories containing large minified third-party files (such as `juice-shop/frontend/src/assets/private/three.js`), I want `SEMGREP_TIMEOUT` to default to `10` seconds (double Semgrep's official `5s` per-rule per-file default) instead of the script's fallback of `300` seconds (5 minutes per rule per file), so that Semgrep does not stall for 15+ minutes on a single minified bundle while still preserving 100% of SAST findings on real source code files, without modifying `security-tests/run_security_scans.sh`.

**Why this priority**: In `security-tests/run_security_scans.sh` (line 872), `local TIMEOUT="${SEMGREP_TIMEOUT:-300}"` passes `--timeout 300` to `semgrep scan`. Because Semgrep's `--timeout` is a **per-rule per-file** timeout (with `-timeout_threshold 3`), any minified JS file in a repo (e.g., `three.js` at 834 KB) causes catastrophic regex/taint backtracking for `3 × 300s = 900s` (15 minutes) per file. Setting `SEMGREP_TIMEOUT=10` via environment variables respects the Zero Upstream Script Modification principle while cutting Semgrep's hang time on minified assets from 15 minutes down to 30 seconds.

**Independent Test**: Select `semgrep` in the `Security Scan (CLI)` tab of the Allure Report (`http://127.0.0.1:8765/#security-scan`), verify `SEMGREP_TIMEOUT=10` is included in the CLI Command Preview and passed to the child process environment in `PipelineRunManager.startRun`.

**Acceptance Scenarios**:

1. **Given** `semgrep` is included in `--tools`, **When** a scan is configured or executed in `Security Scan (CLI)`, **Then** `SEMGREP_TIMEOUT=10` (or the user-configured value in seconds) is passed in the environment to `security-tests/run_security_scans.sh` and displayed in the Equivalent CLI Command Preview.
2. **Given** all tracked upstream files in the repository, **When** `git status --porcelain -uno` is checked against upstream files, **Then** `security-tests/run_security_scans.sh` remains 100% unmodified.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: `ScanRunRequest` in `web-ui/runner.ts` MUST support `semgrepTimeout?: number` (defaulting to `10` seconds when `semgrep` is selected) and inject `SEMGREP_TIMEOUT` into the environment of `security-tests/run_security_scans.sh`.
- **FR-002**: `buildDisplayCommand()` in `web-ui/runner.ts` and `buildPreview()` in `web-ui/allure-plugin.ts` MUST prefix `SEMGREP_TIMEOUT=<seconds>` in the Equivalent CLI Command Preview whenever `semgrep` is selected.
- **FR-003**: `web-ui/allure-plugin.ts` MUST provide a numeric input control (`Semgrep Rule Timeout (s, SEMGREP_TIMEOUT)`) defaulting to `10` seconds in the `Security Scan (CLI)` tab.
- **FR-004**: `security-tests/run_security_scans.sh` and all other original repository files MUST NOT be modified.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `SEMGREP_TIMEOUT=10` is automatically applied whenever `semgrep` is selected, preventing 15-minute stalls on minified files without losing any source-code SAST findings.
- **SC-002**: `git diff` against all original upstream files remains completely empty (`0` lines changed).

