# Feature Specification: Removal of Redundant Categories Widget and Tab (`013-remove-categories-redundancy`)

## 1. Contexto e Motivação

**Input**: Solicitação do usuário acompanhada da captura do Allure Overview:
*"Crie uma nova iteracao SDD para remover CATEGORIES, pois a informacao quantitativa em SUITES é a mesma"*

### 1.1 Diagnóstico da Redundância Informacional
Na tela principal (**Overview**) do Allure Report, são apresentados simultaneamente:
1. **Widget SUITES**:
   - `Severity: HIGH (51)`
   - `Severity: CRITICAL (18)`
   - `Severity: MEDIUM (62)`
   - `Severity: LOW (3)`
   - `Severity: UNKNOWN (2)`
2. **Widget CATEGORIES**:
   - `High (51)`
   - `Critical (18)`
   - `Medium (62)`
   - `Low (3)`
   - `Unknown (2)`

A informação quantitativa e taxonômica é rigorosamente idêntica entre os dois blocos, gerando ruído cognitivo e sobrecarga visual. Na aba lateral, o botão **Categories** também repete a mesma navegação por severidade que a aba **Suites** já fornece com muito maior riqueza estrutural (permitindo navegar por capítulo, seção e requisito atômico ASVS v5).

### 1.2 Objetivo
Eliminar por completo o widget **CATEGORIES** do painel Overview e ocultar a aba **Categories** da barra de navegação lateral do Allure, consolidando o widget **SUITES** como a única fonte da verdade de distribuição de severidade.

---

## 2. Requisitos Funcionais

- **RF-001 (Supressão do Widget CATEGORIES no Overview):** O widget de Categorias não deve ser renderizado na grade de visão geral (`.widgets-grid`).
- **RF-002 (Ocultação da Aba Categories na Navegação Lateral):** O item de menu correspondente a Categorias (`side-nav__item` com link para `#categories`) deve ser suprimido da barra lateral.
- **RF-003 (Redirecionamento Defensivo de Rota):** Caso o usuário tente acessar diretamente a URL `#/categories`, a aplicação deve redirecionar automaticamente para `#/suites`.
- **RF-004 (Estratégia Multicamada à Prova de Falhas):**
  - **Camada Allure API:** Remoção de `categories` de `allure.api.widgets.widgets` e `allure.api.tabs`.
  - **Camada CSS:** Regras com `display: none !important` para `.widget:has(a[href*="categories"])` e itens de navegação correspondentes.
  - **Camada DOM Mutator:** Interceptador dinâmico em `getAllurePluginJs()` que remove nós órfãos de Categorias.
- **RF-005 (Princípio I - Zero Core Modification):** Nenhuma alteração nos scripts originais em `security-tests/` ou nos arquivos compartilhados. Todas as customizações são efetuadas exclusivamente pelo plugin Allure em `web-ui/`.

---

## 3. Critérios de Aceitação

1. **Visão Geral Limpa:** A página Overview exibe o widget SUITES sem o widget duplicado CATEGORIES.
2. **Barra Lateral Alinhada:** A barra de navegação lateral não exibe o ícone/link "Categories".
3. **Navegação Segura:** Clicar ou navegar para `#/categories` redireciona imediatamente para `#/suites`.
4. **Sem Regressões:** Todos os testes unitários (`npm test`) continuam passando com sucesso.

