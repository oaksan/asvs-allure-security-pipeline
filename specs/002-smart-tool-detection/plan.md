# Implementation Plan: Smart Tool Detection & Target URL Verification (`002-smart-tool-detection`)

**Branch**: `main` (`002-smart-tool-detection`) | **Date**: 2026-11-02 | **Spec**: [spec.md](file:///home/user/felipe/speckit/assat/specs/002-smart-tool-detection/spec.md)

## Summary

Adicionar ao módulo `web-ui/` um motor de detecção inteligente (`web-ui/detector.ts`) que analisa o repositório informado em `--repo-url` (verificando clone local existente ou consultando a árvore de arquivos via API do GitHub) e o ambiente local (Docker, cache NVD do ODC, SonarQube local e conectividade HTTP da `--target-url`), marcando automaticamente no plugin nativo do Allure Report todas as ferramentas aplicáveis e informando quais capítulos do OWASP ASVS v5 serão avaliados.

## Technical Context

**Language/Version**: TypeScript 5.4 / Node.js (`ts-node` 10.9.2)  
**Primary Dependencies**: Node.js stdlib (`http`, `https`, `fs`, `path`, `child_process`, `os`)  
**Testing**: `npx tsc -p web-ui/tsconfig.json --noEmit` + `node --test -r ts-node/register web-ui/runner.test.ts`

## Constitution Check

- **Principle I (Preservação Estrita do Núcleo Original)**: **PASS**. Nenhum arquivo original do repositório é modificado.
- **Principle II (Paridade 1:1 com a CLI)**: **PASS**. A detecção apenas pré-seleciona os checkboxes de `--tools` e preenche `--target-url`, mantendo o comando final `bash security-tests/run_security_scans.sh ...` 100% fiel ao original.
- **Principle III (Segurança por Padrão)**: **PASS**. Uso de `spawnSync` sem shell e timeouts curtos em requisições HTTP/HTTPS.
- **Principle IV & V (Artefatos Originais & Stack Nativa)**: **PASS**.

## Project Structure

```text
web-ui/
├── tsconfig.json         # Configuração TypeScript
├── detector.ts           # NOVO: Motor de detecção de linguagem/arquivos do repo, ambiente local, check HTTP de --target-url e container helper
├── runner.ts             # Construtor de CLI, executor de processos e leitor de artefatos
├── allure-plugin.ts      # ATUALIZADO: Aba Security Scan com Auto-Detect Tools, badges por ferramenta, resumo de capítulos ASVS e Target Container helper
├── server.ts             # ATUALIZADO: Rotas POST /api/detect-tools e POST /api/target-container
└── runner.test.ts        # ATUALIZADO: Testes unitários e de integração para detecção automática de ferramentas
```
