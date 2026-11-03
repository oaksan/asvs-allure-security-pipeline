# Implementation Plan: Native Allure Report Plugin (`001-web-cli-runner`)

**Branch**: `001-web-cli-runner` | **Date**: 2026-11-02 | **Spec**: [spec.md](file:///home/user/felipe/speckit/assat/specs/001-web-cli-runner/spec.md)

## Summary

Substituir a interface web separada por um **Plugin Nativo do Allure Report 2** (`allure.api.addTab` + `allure.components.AppLayout` + `Backbone.Marionette.View`) que adiciona diretamente na barra lateral esquerda do Allure Report oficial as abas **`Security Scan`** (`#security-scan`) e **`ASVS v5 Matrix`** (`#asvs-matrix`). O servidor local (`web-ui/server.ts`) serve o próprio Allure Report na raiz (`/`) e responde às chamadas REST (`/api/preview-cmd`, `/api/runs`, `/api/projects`, `/api/active-project`) acionadas de dentro das abas nativas do Allure.

## Technical Context

**Frontend Integration**: API nativa de plugins do Allure 2.29.0 (`window.allure.api.addTranslation`, `window.allure.api.addTab`, `window.allure.components.AppLayout`, `window.Backbone.Marionette.View`)  
**Backend**: Node.js + TypeScript 5.4 (`ts-node` 10.9.2 do repositório original) servindo `./allure-report/<activeRepo>/` na raiz `/` + endpoints `/api/*`  
**Allure CLI Plugin Registration**: `security-reports/_bin/allure-2.29.0/plugins/asvs-pipeline-plugin/` (`allure-plugin.yml`, `static/index.js`, `static/styles.css`)

## Project Structure

```text
web-ui/
├── tsconfig.json         # Extends ../tsconfig.json sem alterar arquivos originais
├── runner.ts             # Construtor/validador 1:1 de argumentos CLI, spawn seguro e leitor de artefatos (asvs-summary.csv, severity-rollup.json)
├── allure-plugin.ts      # Código JS/CSS do plugin nativo do Allure (allure.api.addTab('security-scan'), allure.api.addTab('asvs-matrix')) + instalador em allure-2.29.0/plugins/
├── server.ts             # Serve o Allure Report oficial na raiz (/), injeta/serve /plugin/asvs-pipeline/* e expõe /api/*
└── runner.test.ts        # Testes automatizados de CLI, plugin Allure e rotas HTTP
```
