# ASVS Allure Security Pipeline (ASSAT Web Wrapper) Constitution

## Core Principles

### I. Preservação Estrita do Núcleo Original (Zero Core Modification & Attribution)
O repositório original (`adeelahmad6834/asvs-allure-security-pipeline`, licenciado sob MIT, `DOI: 10.5281/zenodo.17289091`) é tratado como a base canônica e imutável de avaliação:
- Os scripts originais (`security-tests/run_security_scans.sh` e `security-tests/run_security_scans.timer.sh`), o conversor TypeScript (`security-tests/parsers/asvs-unified-to-allure.ts`) e as tabelas de mapeamento (`shared-asvs-map.json`, `shared-owasp-map.json`, `shared-owners-map.json`) **não devem ter sua lógica nem seus itens do OWASP ASVS alterados**.
- Os arquivos de licença e citação acadêmica (`LICENSE`, `CITATION.cff` e `SECURITY.md`) devem ser preservados integralmente.

### II. Paridade Fiel com a Linha de Comando (1:1 CLI Parity)
A Interface Web deve funcionar como um invólucro transparente (*Web Wrapper*) que preserva exatamente o comportamento da execução via linha de comando:
- Todos os parâmetros de CLI do script original (`--repo-url`, `--branch`, `--tools`, `--zap-mode`, `--target-url`, `--openapi` e flags `--zap-*` para modo autenticado) e a opção de execução cronometrada (`run_security_scans.timer.sh`) devem ser representados fielmente na interface.
- A Interface Web deve apresentar ao usuário o comando CLI exato correspondente à execução e transmitir a saída real (`stdout`/`stderr`) do script original em tempo real.

### III. Segurança por Padrão e Prevenção de Injeção (Security & Safe Defaults)
- **Execução Segura de Processos**: O backend deve invocar o script original via `child_process.spawn` passando argumentos como lista (array) estruturada, nunca concatenando strings em um shell (`shell: false`), prevenindo *Command Injection*.
- **Proteção contra Path Traversal**: Qualquer leitura de relatórios em `./allure-report/<repo>`, `./allure-results/<repo>` ou `./security-reports/` deve validar estritamente o nome do diretório dentro da raiz do workspace.
- **Redação de Segredos**: Senhas (`--zap-auth-pass`) e tokens (`SONAR_TOKEN`, `NVD_API_KEY`, `GITHUB_TOKEN`, `GITLAB_TOKEN`) devem ser mascarados (`***`) no preview do comando CLI e nos logs exibidos.
- **Escuta Local**: O servidor Web deve escutar por padrão apenas em `127.0.0.1` (localhost).

### IV. Artefatos Originais como Única Fonte de Verdade (Canonical Pipeline Outputs)
A Interface Web não deve recalcular nem alterar os resultados do pipeline; ela deve consumir e exibir diretamente os artefatos produzidos pelo fluxo original:
- Relatório gráfico **Allure HTML** (`./allure-report/<repo>/index.html`);
- Resumo de severidades (`./allure-results/<repo>/severity-rollup.json` e `severity-rollup.md`);
- Resumo de controles ASVS (`./allure-results/<repo>/asvs-summary.csv`);
- Relatórios brutos em `./security-reports/` e métricas de tempo em `timings.csv`.

### V. Simplicidade Técnica e Stack Nativa (Native TypeScript/Node Stack)
- A solução deve utilizar exclusivamente a stack já presente no repositório original (**Node.js + TypeScript 5.4 + `ts-node`** no backend e **HTML5/CSS3/JavaScript Vanilla** no frontend), sem introduzir dependências de produção externas no `package.json`.
- Todo código TypeScript adicionado em `web-ui/` deve passar sem erros na verificação estrita de tipos (`tsc --noEmit`).

## Governance & SDD Workflow

Todas as funcionalidades evoluídas sobre o clone original seguem o ciclo **Spec-Driven Development (SDD)**:
1. **Constitution** (`.specify/memory/constitution.md`) — Princípios arquiteturais e restrições inegociáveis.
2. **Specification** (`specs/<id>/spec.md`) — Histórias de usuário, requisitos funcionais e critérios de aceitação.
3. **Implementation Plan** (`specs/<id>/plan.md`) — Arquitetura técnica, contratos de API e verificação de conformidade com a Constituição.
4. **Tasks** (`specs/<id>/tasks.md`) — Lista ordenada e rastreável de tarefas de implementação e verificação.

**Version**: 1.0.0 | **Ratified**: 2026-11-02 | **Last Amended**: 2026-11-02

