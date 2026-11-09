# Especificação: Renomeação das Guias de Navegação de Findings (`019-rename-tabs-behaviors-packages-suites`)

## 1. Contexto e Motivação
No ecossistema do Allure Report voltado para testes unitários tradicionais, as guias de navegação utilizam terminologia de QA genérica:
- **Suites**: Agrupa testes em suítes e classes;
- **Behaviors**: Agrupa testes no paradigma BDD (Features e Stories);
- **Packages**: Agrupa testes pela árvore de diretórios e pacotes de código.

No contexto do **ASVS Security Pipeline**, cada um desses pontos de vista representa uma dimensão de análise de segurança:
1. A guia **Suites** organiza os findings diretamente por severidade e capítulos/requisitos normativos do OWASP ASVS v5.0.0;
2. A guia **Behaviors** organiza os findings pelas ferramentas de segurança que os identificaram (`npm-audit`, `trivy-fs`, `semgrep`, `gitleaks`, `zap`);
3. A guia **Packages** organiza a listagem direta de todos os findings identificados nos artefatos.

Para tornar a experiência de DevSecOps, auditoria e conformidade totalmente intuitiva e alinhada ao domínio de segurança, as guias devem ser renomeadas para:
* **Behaviors** -> **`Findings by Tools`**
* **Packages** -> **`Findings List`**
* **Suites** -> **`Findings by Requirements`**

---

## 2. Histórias de Usuário (User Stories)

### US-01: Navegação Alinhada ao Domínio de Segurança
**Como** Analista de Segurança ou Engenheiro DevSecOps,  
**Quero** que as opções de navegação na barra lateral e os cabeçalhos de tela reflitam terminologia clara de segurança cibernética (`Findings by Requirements`, `Findings by Tools`, `Findings List`),  
**Para que** eu identifique imediatamente qual critério de agrupamento estou consultando sem a ambiguidade da terminologia herdada de QA tradicional.

### US-02: Consistência Visual e Internacionalização
**Como** Auditor de Conformidade ASVS,  
**Quero** que os novos nomes sejam exibidos tanto no texto do menu lateral quanto no tooltip ao recolher a barra, no cabeçalho das páginas correspondentes e no widget de requisitos no Overview,  
**Para que** toda a interface do relatório mantenha coerência textual independentemente da resolução de tela ou idioma selecionado.

---

## 3. Requisitos Funcionais

* **RF-01: Renomeação da Guia "Behaviors" para "Findings by Tools"**
  * Atualizar o dicionário de internacionalização do Allure (`allure.api.addTranslation`) sobrescrevendo `tab.behaviors.name` com `"Findings by Tools"`.
  * Atualizar títulos de widgets relacionados (`widget.behaviors.name`).
  * Garantir aplicação tanto na barra lateral quanto no cabeçalho da visualização de árvore (`#behaviors`).

* **RF-02: Renomeação da Guia "Packages" para "Findings List"**
  * Atualizar o dicionário de internacionalização do Allure (`allure.api.addTranslation`) sobrescrevendo `tab.packages.name` com `"Findings List"`.
  * Garantir aplicação tanto na barra lateral quanto no cabeçalho da visualização de árvore (`#packages`).

* **RF-03: Renomeação da Guia "Suites" para "Findings by Requirements"**
  * Atualizar o dicionário de internacionalização do Allure (`allure.api.addTranslation`) sobrescrevendo `tab.suites.name` com `"Findings by Requirements"`.
  * Atualizar o widget correspondente no Overview (`widget.suites.name`) para `"Findings by Requirements"`.
  * Garantir aplicação tanto na barra lateral quanto no cabeçalho da visualização de árvore (`#suites`).

* **RF-04: Suporte Multi-idioma e Camada Defensiva no DOM**
  * Injetar as traduções em todos os idiomas suportados pelo Allure para garantir consistência caso o usuário alterne de idioma.
  * Implementar normalização defensiva no ciclo de renderização do SideNav para garantir que nenhum plugin assíncrono reverta os rótulos.

---

## 4. Critérios de Aceitação

* **AC-01**: O item da barra lateral referente a "Behaviors" exibe o texto **`Findings by Tools`** (e seu tooltip quando colapsado também exibe `Findings by Tools`).
* **AC-02**: Ao acessar `#behaviors`, o cabeçalho superior da árvore exibe **`Findings by Tools`**.
* **AC-03**: O item da barra lateral referente a "Packages" exibe o texto **`Findings List`** (e seu tooltip exibe `Findings List`).
* **AC-04**: Ao acessar `#packages`, o cabeçalho superior da árvore exibe **`Findings List`**.
* **AC-05**: O item da barra lateral referente a "Suites" exibe o texto **`Findings by Requirements`** (e seu tooltip exibe `Findings by Requirements`).
* **AC-06**: Ao acessar `#suites`, o cabeçalho superior da árvore exibe **`Findings by Requirements`**.
* **AC-07**: O widget de Suites na página de Overview (`#`) exibe o título **`Findings by Requirements`** (renderizado em caixa alta).
* **AC-08**: Todos os testes unitários e de tipagem passam com 100% de sucesso (`npm run typecheck` e `npm test`).
* **AC-09**: O Princípio I da Constituição (Zero Core Modification) permanece estritamente preservado.

