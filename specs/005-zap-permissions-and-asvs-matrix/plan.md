# Implementation Plan: ZAP Container Permissions, Clean Per-Run Rollup & Cross-Tool ASVS Matrix (`005-zap-permissions-and-asvs-matrix`)

**Branch**: `005-zap-permissions-and-asvs-matrix` | **Date**: 2026-11-03 | **Spec**: [spec.md](file:///home/user/felipe/speckit/assat/specs/005-zap-permissions-and-asvs-matrix/spec.md)  
**Input**: Feature specification from `/specs/005-zap-permissions-and-asvs-matrix/spec.md`

## Summary

Deliver three seamless improvements without touching any upstream scripts:
1. Pre-flight permission preparation in `web-ui/runner.ts` (`chmod 0o777 security-reports`, temporary `0o666 zap.yaml` during ZAP runs, and per-run `allure-results/<repoName>` cleanup preserving `history/`) so rootless Docker ZAP containers write `zap-report.json` without `AccessDeniedException` and `severity-rollup.json` never multiplies across runs.
2. Full parsing of `asvs-summary.csv` (`control,chapter,levels,count,tools`) combined with cross-tool aggregation from `allure-results/<repoName>/*-result.json` in `web-ui/runner.ts`.
3. Completion banner & `Tools` column in `web-ui/allure-plugin.ts`.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js 20+  
**Primary Dependencies**: Node built-in `fs`, `path`, `child_process`, `http`  
**Testing**: `node --test -r ts-node/register web-ui/runner.test.ts` and `npx tsc -p web-ui/tsconfig.json --noEmit`  
**Target Platform**: Linux (rootless or standard Docker)  
**Constraints**: Zero edits to any original tracked file in the repository.

## Constitution Check

- **Principle I (Zero Modification of Original Pipeline Scripts)**: PASS — All pre-flight and post-flight handling occurs in `web-ui/runner.ts` and `web-ui/allure-plugin.ts`.
- **Principle II (1:1 CLI Parity & Execution Transparency)**: PASS.
- **Principle III (Secure Credential Handling)**: PASS.
- **Principle IV (Real-Time Observability)**: PASS.
- **Principle V (Minimal Footprint)**: PASS.

## Project Structure

```text
specs/005-zap-permissions-and-asvs-matrix/
├── spec.md
├── plan.md
├── tasks.md
└── checklists/
    └── requirements.md

web-ui/
├── runner.ts         # Pre-flight ZAP permissions, allure-results reset (preserving history/), cross-tool ASVS summary aggregation
├── allure-plugin.ts  # Completion banner + auto-open option + Tools column in ASVS v5 Matrix
└── runner.test.ts    # Unit tests for parseAsvsSummaryCsv and cross-tool ASVS aggregation
```

