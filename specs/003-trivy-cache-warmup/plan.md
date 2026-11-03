# Implementation Plan: Automatic Trivy DB Cache Warmup & Fast NPM Mode (`003-trivy-cache-warmup`)

**Branch**: `main` (`003-trivy-cache-warmup`) | **Date**: 2026-11-02 | **Spec**: [spec.md](file:///home/user/felipe/speckit/assat/specs/003-trivy-cache-warmup/spec.md)

## Summary

Resolver o erro `ERROR [vulndb] The first run cannot skip downloading DB` do Trivy adicionando uma etapa automática de *pre-flight cache warmup* (`aquasec/trivy:latest image --download-db-only`) no `PipelineRunManager` (`web-ui/runner.ts`) sempre que `trivy-fs` for selecionado e `$TRIVY_CACHE_DIR/db/trivy.db` ainda não existir, além de expor na aba `Security Scan (CLI)` do Allure a opção nativa `SKIP_NPM_INSTALL=true` e o ajuste de tempo do ZAP (`ZAP_BASELINE_TIME` / `ZAP_FULL_TIME`), mantendo `security-tests/run_security_scans.sh` 100% inalterado.

## Project Structure

```text
web-ui/
├── detector.ts           # ATUALIZADO: Verifica presença de ~/.cache/trivy/db/trivy.db e informa status do cache
├── runner.ts             # ATUALIZADO: Executa pre-flight warmup do Trivy DB automaticamente antes de chamar run_security_scans.sh
├── allure-plugin.ts      # ATUALIZADO: Adiciona controles rápidos para SKIP_NPM_INSTALL=true e duração máxima do ZAP (minutos)
└── runner.test.ts        # ATUALIZADO: Testes unitários para verificação de cache do Trivy e geração de variáveis de ambiente
```

