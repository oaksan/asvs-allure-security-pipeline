# Tasks: Vertical Scroll Restoration for Native Allure Plugin Views (`007-allure-plugin-vertical-scroll`)

**Input**: Design documents from `/specs/007-allure-plugin-vertical-scroll/`  
**Prerequisites**: `constitution.md`, `spec.md`, `plan.md`

## Phase 1: CSS Layout Fix & Plugin Reinstallation (`US1`, `US2`)

- [X] T001 [US1, US2] Update `getAllurePluginCss()` in `web-ui/allure-plugin.ts` so `.asvs-plugin-page` uses `position: absolute; top: 0; right: 0; bottom: 0; left: 0; max-height: 100%; overflow-y: auto; overflow-x: hidden; padding: 20px 28px 48px 28px;` and `#content .app` / `.app__content` enforce `min-height: 0; height: 100%;`
- [X] T002 [US1, US2] Run `installAllureCliPlugin()` to update static plugin stylesheets in `allure-report/<repo>/plugin/asvs-pipeline/styles.css` and `security-reports/_bin/allure-2.29.0/plugins/asvs-pipeline-plugin/static/styles.css`

## Phase 2: Automated Verification

- [X] T003 Update `web-ui/runner.test.ts` to assert that `/plugin/asvs-pipeline/styles.css` includes the vertical scroll positioning rules, and run `npx tsc -p web-ui/tsconfig.json --noEmit` and `node --test -r ts-node/register web-ui/runner.test.ts`

