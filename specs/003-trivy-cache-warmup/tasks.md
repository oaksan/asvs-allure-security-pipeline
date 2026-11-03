# Tasks: Automatic Trivy DB Cache Warmup & Fast NPM Mode (`003-trivy-cache-warmup`)

**Input**: Design documents from `/specs/003-trivy-cache-warmup/`  
**Prerequisites**: `constitution.md`, `spec.md`, `plan.md`

## Phase 1: Trivy Pre-Flight Cache Warmup & Detector Update (`US1`, `US2`)

- [X] T001 [US1] Implement `getTrivyCacheDir()`, `isTrivyDbCached()`, and automatic pre-flight Trivy DB download (`docker run --rm -v <cache>:/root/.cache/ aquasec/trivy:latest image --download-db-only`) inside `PipelineRunManager.startRun` in `web-ui/runner.ts`
- [X] T002 [US1] Update `web-ui/detector.ts` to report whether the Trivy vulnerability DB is already cached or will be auto-warmed on first run, and whether the target repo already has `node_modules` / `package-lock.json`
- [X] T003 [US2] Update `web-ui/allure-plugin.ts` to include the `Skip slow npm install/build (SKIP_NPM_INSTALL=true)` checkbox and ZAP duration (`ZAP_BASELINE_TIME` / `ZAP_FULL_TIME` minutes) control in the `Security Scan (CLI)` Allure tab

## Phase 2: Warmup Execution, Verification & GitHub Push

- [X] T004 Warm up the local Trivy DB cache (`~/.cache/trivy/trivy/db/trivy.db`), update `web-ui/runner.test.ts`, and run `npx tsc -p web-ui/tsconfig.json --noEmit` and `node --test -r ts-node/register web-ui/runner.test.ts`
- [X] T005 Commit and push Iteration `003-trivy-cache-warmup` to `origin/main` and restart `npx ts-node web-ui/server.ts` on `http://127.0.0.1:8765`
