# Tasks: Semgrep Per-Rule Timeout Optimization (`004-semgrep-per-rule-timeout`)

**Input**: Design documents from `/specs/004-semgrep-per-rule-timeout/`  
**Prerequisites**: `constitution.md`, `spec.md`, `plan.md`

## Phase 1: Runner & Allure Plugin Implementation (`US1`)

- [X] T001 [US1] Update `ScanRunRequest`, `buildDisplayCommand()`, and `PipelineRunManager.startRun` in `web-ui/runner.ts` to support `semgrepTimeout` (defaulting to `10` seconds when `semgrep` is selected) and inject `SEMGREP_TIMEOUT` into the child process environment
- [X] T002 [US1] Update `web-ui/allure-plugin.ts` to include the `Semgrep Rule Timeout (s, SEMGREP_TIMEOUT)` control (default `10`) and include `SEMGREP_TIMEOUT=<seconds>` in the Equivalent CLI Command Preview when `semgrep` is selected
- [X] T003 [US1] Update `web-ui/runner.test.ts` to verify `SEMGREP_TIMEOUT=10` in `buildDisplayCommand()`, run `npx tsc -p web-ui/tsconfig.json --noEmit` and `node --test -r ts-node/register web-ui/runner.test.ts`, and commit & push SDD `004-semgrep-per-rule-timeout` to `origin/main`
