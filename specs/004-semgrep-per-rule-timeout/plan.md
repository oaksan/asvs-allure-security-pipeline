# Implementation Plan: Semgrep Per-Rule Timeout Optimization (`004-semgrep-per-rule-timeout`)

**Branch**: `004-semgrep-per-rule-timeout` | **Date**: 2026-11-02 | **Spec**: [spec.md](file:///home/user/felipe/speckit/assat/specs/004-semgrep-per-rule-timeout/spec.md)  
**Input**: Feature specification from `/specs/004-semgrep-per-rule-timeout/spec.md`

## Summary

`security-tests/run_security_scans.sh` (line 872) reads `local TIMEOUT="${SEMGREP_TIMEOUT:-300}"` and passes `--timeout "$TIMEOUT"` to `semgrep scan`. Because Semgrep's `--timeout` flag controls the **per-rule per-file** timeout (official Semgrep default is `5` seconds), a 300-second timeout causes Semgrep to stall for `3 × 300s = 900s` (15 minutes) on each minified JavaScript bundle (such as `three.js` in Juice Shop). Without modifying `security-tests/run_security_scans.sh`, we configure `SEMGREP_TIMEOUT=10` (10 seconds per rule per file) by default in `web-ui/runner.ts` and expose it in `web-ui/allure-plugin.ts`.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js 20+  
**Primary Dependencies**: Node built-in `child_process`, `http`, `fs`, `path`  
**Testing**: `node --test -r ts-node/register web-ui/runner.test.ts` and `npx tsc -p web-ui/tsconfig.json --noEmit`  
**Target Platform**: Linux (with Docker CLI access)  
**Constraints**: Zero edits to any original tracked file in the repository.

## Constitution Check

- **Principle I (Zero Modification of Original Pipeline Scripts)**: PASS — `security-tests/run_security_scans.sh` already supports `${SEMGREP_TIMEOUT:-300}` natively on line 872.
- **Principle II (1:1 CLI Parity & Execution Transparency)**: PASS — `SEMGREP_TIMEOUT=10` is displayed in the Equivalent CLI Command Preview whenever `semgrep` is selected.
- **Principle III (Secure Credential Handling)**: PASS — No credentials involved.
- **Principle IV (Real-Time Observability)**: PASS — Streams directly to the Live Pipeline Console.
- **Principle V (Minimal Footprint)**: PASS — Zero new dependencies.

## Project Structure

```text
specs/004-semgrep-per-rule-timeout/
├── spec.md
├── plan.md
├── tasks.md
└── checklists/
    └── requirements.md

web-ui/
├── runner.ts         # Add semgrepTimeout?: number (default 10 when semgrep is selected) to ScanRunRequest & env
├── allure-plugin.ts  # Add Semgrep Rule Timeout (SEMGREP_TIMEOUT=10) input & CLI preview prefix
└── runner.test.ts    # Unit test verifying SEMGREP_TIMEOUT=10 in CLI preview and env
```
