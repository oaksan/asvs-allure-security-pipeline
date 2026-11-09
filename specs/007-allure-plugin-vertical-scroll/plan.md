# Implementation Plan: Vertical Scroll Restoration for Native Allure Plugin Views (`007-allure-plugin-vertical-scroll`)

**Branch**: `main` (`007-allure-plugin-vertical-scroll`) | **Date**: 2026-11-03 | **Spec**: [spec.md](file:///home/user/felipe/speckit/assat/specs/007-allure-plugin-vertical-scroll/spec.md)  
**Input**: Feature specification from `/specs/007-allure-plugin-vertical-scroll/spec.md`

## 1. Summary

Restaurar a rolagem vertical completa nas abas nativas **`Security Scan (CLI)`** (`#security-scan`) e **`ASVS v5 Matrix`** (`#asvs-matrix`) alinhando o container `.asvs-plugin-page` ao padrão arquitetural de layout do Allure Report 2 (`position: absolute; top: 0; right: 0; bottom: 0; left: 0; max-height: 100%; overflow-y: auto;`, idêntico ao `.widgets-grid` nativo) e aplicando `min-height: 0; height: 100%;` em `#content .app` e `.app__content`.

## 2. Technical Context

**Language/Version**: TypeScript 5.4 / CSS3  
**Primary Dependencies**: None (native CSS injected via `web-ui/allure-plugin.ts`)  
**Testing**: `npx tsc -p web-ui/tsconfig.json --noEmit` + `node --test -r ts-node/register web-ui/runner.test.ts`  
**Constraints**: Zero modifications to upstream tracked files.

## 3. Constitution Check

- **Principle I (Preservação Estrita do Núcleo Original)**: **PASS**.
- **Principle II (Paridade 1:1 com a CLI)**: **PASS**.
- **Principle III, IV & V**: **PASS**.

## 4. Project Structure

```text
specs/007-allure-plugin-vertical-scroll/
├── spec.md
├── plan.md
├── tasks.md
└── checklists/
    └── requirements.md

web-ui/
├── allure-plugin.ts   # ATUALIZADO: getAllurePluginCss() com ancoragem absoluta e min-height: 0 para scroll vertical
└── runner.test.ts     # ATUALIZADO: Verificação automatizada das propriedades CSS de scroll vertical
```

