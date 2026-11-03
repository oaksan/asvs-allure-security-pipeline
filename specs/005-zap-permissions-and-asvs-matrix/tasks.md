# Tasks: ZAP Container Permissions, Clean Per-Run Rollup & Cross-Tool ASVS Matrix (`005-zap-permissions-and-asvs-matrix`)

**Input**: Design documents from `/specs/005-zap-permissions-and-asvs-matrix/`  
**Prerequisites**: `constitution.md`, `spec.md`, `plan.md`

## Phase 1: Pre-Flight Permissions, Per-Run Reset & Cross-Tool ASVS Parser (`US1`, `US2`)

- [X] T001 [US1] Implement `prepareZapAndReportsWorkspace()`, `cleanupTempZapFiles()`, and `resetAllureResultsKeepHistory()` in `web-ui/runner.ts` so rootless Docker ZAP containers write `zap-report.json`/`zap-report.html` without `AccessDeniedException` and `severity-rollup.json` does not multiply across runs
- [X] T002 [US2] Update `parseAsvsSummaryCsv()` and `aggregateAsvsFromAllureResults()` in `web-ui/runner.ts` to parse `control,chapter,levels,count,tools` and merge ASVS mappings across all `*-result.json` files in `allure-results/<repoName>`
- [X] T003 [US3] Update `web-ui/allure-plugin.ts` to add the `Tools` column in the `ASVS v5 Matrix` tab, a completion banner with a `"📊 Open Updated Allure Overview"` button, and an `"Auto-open Allure Overview when scan finishes"` checkbox

## Phase 2: Verification & GitHub Push

- [X] T004 Update `web-ui/runner.test.ts` to test `parseAsvsSummaryCsv()` (`control,chapter,levels,count,tools`) and cross-tool ASVS aggregation, and run `npx tsc -p web-ui/tsconfig.json --noEmit` and `node --test -r ts-node/register web-ui/runner.test.ts`
- [X] T005 Commit and push SDD `005-zap-permissions-and-asvs-matrix` to `origin/main` and restart the live Allure Report server on `http://127.0.0.1:8765`
