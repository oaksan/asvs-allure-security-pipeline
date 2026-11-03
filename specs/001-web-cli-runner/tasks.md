# Tasks: Native Allure Report Plugin for Security Pipeline (`001-web-cli-runner`)

**Input**: Design documents from `/specs/001-web-cli-runner/`  
**Prerequisites**: `constitution.md`, `spec.md`, `plan.md`

## Phase 1: Foundational CLI Runner & Artifact Reader

- [X] T001 Maintain `web-ui/tsconfig.json` and `web-ui/runner.ts` (`validateAndBuildCliCommand`, `PipelineRunManager`, `listEvaluatedProjects`, `getProjectArtifacts`) with zero modifications to tracked upstream files

## Phase 2: Native Allure Report Plugin (`US1`, `US2`)

- [X] T002 [US1] [US2] Create `web-ui/allure-plugin.ts` defining the native Allure 2 plugin CSS (`getAllurePluginCss`) and JS (`getAllurePluginJs`) using `allure.api.addTranslation`, `allure.api.addTab('security-scan', ...)`, `allure.api.addTab('asvs-matrix', ...)`, and `allure.components.AppLayout`, plus `installAllureCliPlugin()` to register the plugin inside `security-reports/_bin/allure-2.29.0/plugins/asvs-pipeline-plugin/`
- [X] T003 [US1] [US2] Remove standalone `web-ui/ui.ts` and update `web-ui/server.ts` so `GET /` serves the official Allure Report (`./allure-report/<activeRepo>/`) directly with `/plugin/asvs-pipeline/index.js` and `/plugin/asvs-pipeline/styles.css` loaded, and supports switching the active Allure Report project via `/api/active-project`

## Phase 3: Automated Verification & Live Allure Server

- [X] T004 Update and run `web-ui/runner.test.ts` + `npx tsc -p web-ui/tsconfig.json --noEmit` to verify that `GET /` serves the official Allure Report with the native plugin tabs registered, and verify `git status --porcelain -uno` is empty
- [X] T005 Regenerate the Allure Report with the native plugin installed and launch `npx ts-node web-ui/server.ts` on `http://127.0.0.1:8765`
