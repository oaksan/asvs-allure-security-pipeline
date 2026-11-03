# Tasks: Smart Tool Detection & Target URL Verification (`002-smart-tool-detection`)

**Input**: Design documents from `/specs/002-smart-tool-detection/`  
**Prerequisites**: `constitution.md`, `spec.md`, `plan.md`

## Phase 1: Smart Detector Engine (`US1`, `US2`, `US3`)

- [X] T001 [US1] [US2] Create `web-ui/detector.ts` implementing repository inspection (local directory + GitHub API fallback), environment checks (Docker, ODC NVD cache, SonarQube probe), HTTP reachability check + Docker bridge IP suggestion for `--target-url`, and ASVS chapter coverage mapping per tool
- [X] T002 [US3] Add optional local study-target Docker container manager (`managePresetContainer` for `juice-shop` and `flowise`) in `web-ui/detector.ts`

## Phase 2: Server Endpoints & Native Allure Plugin UI (`US1`, `US2`, `US3`)

- [X] T003 [US1] [US2] [US3] Add `POST /api/detect-tools` and `POST /api/target-container` endpoints in `web-ui/server.ts`
- [X] T004 [US1] [US2] [US3] Update `web-ui/allure-plugin.ts` so changing `--repo-url`, clicking a Preset, clicking "🔍 Auto-Detect Tools", or entering `--target-url` automatically runs detection, checks recommended tools, displays per-tool status badges & ASVS chapter coverage, and provides a 1-click Docker target container button for presets

## Phase 3: Automated Verification & Live Server Restart

- [X] T005 Add automated tests for `detectToolsForRepo` and `POST /api/detect-tools` in `web-ui/runner.test.ts`, run `npx tsc -p web-ui/tsconfig.json --noEmit` and `node --test -r ts-node/register web-ui/runner.test.ts`, and verify `git status --porcelain -uno` is empty
- [X] T006 Restart `npx ts-node web-ui/server.ts` on `http://127.0.0.1:8765`
