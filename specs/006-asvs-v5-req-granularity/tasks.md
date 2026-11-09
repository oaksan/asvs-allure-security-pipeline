# Tasks: Granular OWASP ASVS v5.0.0 Requirement (`req_id`) Evaluation & Canonical 345-Item Catalog Integration (`006-asvs-v5-req-granularity`)

**Input**: Design documents from `/specs/006-asvs-v5-req-granularity/`  
**Prerequisites**: `constitution.md`, `spec.md`, `plan.md`, `docs/OWASP_Application_Security_Verification_Standard_5.0.0_en.csv`

## Phase 1: Canonical 345-Item ASVS 5.0.0 Catalog & Semantic `req_id` Resolver (`US1`, `US2`)

- [X] T001 [US1] Implement `parseRfc4180Csv()` and `loadAsvsCatalog()` in `web-ui/asvs-catalog.ts` to parse all 345 atomic requirements (`req_id`), 80 sections (`section_id`), 17 chapters (`chapter_id`), and official verification levels (`L1=70`, `L2=183`, `L3=92`) from `docs/OWASP_Application_Security_Verification_Standard_5.0.0_en.csv`
- [X] T002 [US2] Implement `resolveFindingToReqIds()` and `resolveSectionOrReqId()` in `web-ui/asvs-catalog.ts` to classify findings across all scanner tools (`npm-audit`, `trivy`, `semgrep`, `zap`, `gitleaks`, `dependency-check`, `bandit`, `sonar`) into 3-tier `req_id` identifiers (`V#.#.#`) with official CSV verification levels
- [X] T003 [US2] Update `parseAsvsSummaryCsv()`, `aggregateAsvsFromAllureResults()`, `buildAsvsCoverageStats()`, and `getProjectArtifacts()` in `web-ui/runner.ts` to aggregate findings by `req_id` and compute `asvsCatalogSummary` against the 345-requirement baseline

## Phase 2: Native Allure Plugin UI, REST API & Verification (`US3`)

- [X] T004 [US3] Expose `GET /api/asvs-catalog` in `web-ui/server.ts` and update `web-ui/allure-plugin.ts` and `web-ui/detector.ts` so the `ASVS v5 Matrix` tab displays `Req ID (req_id)`, `Section (section_id)`, `Chapter`, `Level (CSV)`, `Official Requirement (req_description)`, `Tools`, `Findings`, and the `ASVS req_id Hit (X / 345)` KPI
- [X] T005 Update `web-ui/runner.test.ts` to verify the 345-item CSV catalog (`L1: 70`, `L2: 183`, `L3: 92`), `GET /api/asvs-catalog`, and granular `req_id` resolution on `juice-shop`, and run `npx tsc -p web-ui/tsconfig.json --noEmit` and `node --test -r ts-node/register web-ui/runner.test.ts`

