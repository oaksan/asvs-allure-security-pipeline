# Feature Specification: Complete Finding Terminology Standardization across Allure UI (`011-complete-finding-terminology-standardization`)

**Feature Branch**: `011-complete-finding-terminology-standardization`  
**Created**: 2026-11-04  
**Status**: In Progress  
**Input**: User request: *"crie um novo SDD para chamar onde está test cases (vide print). verifique se existe outras referencias para test case no projeto e substitua pelo termo finding"* acompanhado da captura do widget do Allure com `136 test cases`.

---

## 1. Fundamentação Científica e Metodológica (Rigor de Mestrado)

### 1.1 Eliminação Definitiva da Ambiguidade "Test Case" no Relatório Allure
Na versão padrão do Allure 2, o widget principal de resumo (`summary-widget`) renderiza a contagem central através dos elementos DOM:
```html
<div class="summary-widget__stats splash">
    <div class="splash__title">136</div>
    <div class="splash__subtitle">test cases</div>
</div>
```
A presença da legenda *"test cases"* sob o numeral 136 colide com o rigor ontológico da pesquisa de mestrado em segurança:
* Em uma avaliação de conformidade AppSec, 136 não são "casos de teste" genéricos de QA, mas sim **findings de segurança (vulnerabilidades empíricas de Nível 1)** detectados pelas ferramentas.
* A persistência do termo *"test cases"* causa confusão conceitual, sugerindo testes unitários ou manuais em vez de achados automatizados de vulnerabilidade.

### 1.2 Estratégia de Substituição em Camadas (*Multi-Layer UI Standardization*)
Para garantir que o termo **"findings"** substitua universalmente e sem falhas o texto *"test cases"* em todos os componentes visuais do Allure, a solução adota uma estratégia redundante e à prova de falhas:
1. **Camada CSS Instantânea (`.splash__subtitle`):** Oculta o texto legado via `font-size: 0` e injeta `content: "findings"` via pseudo-elemento `::after`, garantindo renderização imediata, estável e livre de qualquer *flickering* antes ou durante a execução de scripts.
2. **Camada JS Dinâmica (`Mutation / Interval Observer`):** Intercepta e reescreve ativamente os nós de texto em `.splash__subtitle`, `.chart__caption-text`, `.widget__title`, `.popover` e cabeçalhos sempre que o Marionette.js re-renderizar a visualização.
3. **Auditoria de Referências no Código:** Verificação e alinhamento de termos em todos os arquivos de configuração, testes e documentação do projeto.

---

## 2. Requisitos do Sistema

### 2.1 Requisitos Funcionais (RF)
- **RF-001 (Padronização do Widget Central Splash):** O subtítulo sob o número 136 no Overview (`.splash__subtitle`) deve exibir estritamente a palavra **"findings"** (em vez de *"test cases"*).
- **RF-002 (Padronização de Tooltips e Popovers):** Qualquer popover ou legenda Allure que mencione "X test cases" deve ser reescrita para "X findings".
- **RF-003 (Auditoria e Limpeza de Referências no Projeto):** Todos os arquivos do projeto em `web-ui/` e testes devem adotar terminologia consistente referente a `findings`.
- **RF-004 (Persistência e Instalação Automática):** Os novos estilos CSS e scripts JS devem ser injetados tanto dinamicamente pelo servidor quanto estaticamente na distribuição Allure em `security-reports/_bin/allure-2.29.0/plugins/asvs-pipeline-plugin/`.

### 2.2 Critérios de Aceitação (Gherkin)
```gherkin
Cenário: Visualização do Overview do Allure com a palavra findings
  Dado que o usuário acessa a página inicial do Allure Report (/#)
  Quando o widget de resumo é renderizado na tela
  Então abaixo do número 136 deve constar explicitamente a palavra "findings"
  E em nenhum momento deve aparecer o texto "test cases"
  E as popovers do gráfico circular devem expressar a contagem em "findings"
```

