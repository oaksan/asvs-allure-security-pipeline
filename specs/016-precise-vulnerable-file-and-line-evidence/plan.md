# Implementation Plan: Apresentação Precisa do Arquivo e Linha da Vulnerabilidade (`016-precise-vulnerable-file-and-line-evidence`)

## 1. Arquitetura e Estratégia Técnica

Para eliminar a ambiguidade visual observada no painel de detalhes do Allure, a interface `FindingLocationDetails` e o resolvedor `resolveFindingLocation` serão aprimorados para separar com precisão matemática o **arquivo físico do código** (`sourceFile`), a **linha nesse arquivo** (`line`), o **componente/pacote avaliado** (`targetComponent`) e o **manifesto de dependência** (`manifestFile`).

### 1.1 Modelo Estruturado de Localização
```typescript
export interface FindingLocationDetails {
  sourceFile: string;         // Arquivo físico no projeto (ex: 'routes/order.ts', 'routes/search.ts', 'server.ts')
  line: number | null;        // Linha no sourceFile (ex: 42, 25, 184)
  targetComponent: string;    // Alvo/Pacote avaliado (ex: 'pdfkit', 'http://172.17.0.1:3000')
  manifestFile?: string;      // Arquivo de manifesto (ex: 'package.json:139')
  ruleOrVulnId: string;
  tool: string;
  snippet?: string;
  installedVersion?: string;
  fixedVersion?: string;
  remediation: string;
  advisoryTitle?: string;
  advisoryUrl?: string;
  cwe?: string[];
  dependencyChain?: string;
  appCallers?: string[];
  runtimeEndpoint?: string;
  httpMethod?: string;
  runtimeParam?: string;
  runtimeEvidence?: string;
}
```

### 1.2 Estratégia de Resolução por Ferramenta (Todas as Ferramentas)

1. **SAST (Semgrep / Bandit / NJSSCan)**:
   - `sourceFile`: extraído diretamente de `r.path` (ex.: `routes/search.ts`).
   - `line`: extraído de `r.start.line` (ex.: `25`).
   - `targetComponent`: mesmo caminho do arquivo ou regra.
   - `snippet`: lido com `readSourceSnippet(workspaceDir, repoName, sourceFile, line)`.

2. **SCA (NPM-Audit & Trivy Dependências)**:
   - `targetComponent`: nome do pacote (ex.: `pdfkit`, `jsonwebtoken`).
   - `appCallers`: chamadores localizados por `findApplicationCallers(workspaceDir, repoName, pkgName)`.
   - Se houver chamador no código-fonte (ex.: `routes/order.ts:42`):
     * `sourceFile`: `routes/order.ts`
     * `line`: `42`
   - Se houver apenas declaração no manifesto (ex.: `package.json:139`):
     * `sourceFile`: `package.json`
     * `line`: `139`
   - `manifestFile`: primeira linha de `package.json` onde o pacote foi declarado (ex.: `package.json:139`).
   - `snippet`: lido diretamente do `sourceFile` na linha `line` com cursor ` > | `.

3. **DAST (OWASP ZAP)**:
   - `targetComponent`: endpoint base ou testado (ex.: `http://172.17.0.1:3000`).
   - `runtimeEndpoint`: URL específica com método (ex.: `GET http://172.17.0.1:3000/assets/public/favicon_js.ico`).
   - `sourceFile`: correlacionado automaticamente com a infraestrutura Express:
     * Alertas de headers globais (CORS, CSP, Feature-Policy, Cache): `server.ts`.
     * Rotas de API (ex.: `/rest/user/login`): `routes/login.ts` ou `server.ts`.
   - `line`: linha no `server.ts` onde o middleware ou rota é configurado (ex.: linha `184` para `cors()`, linha `187` para `helmet`, linha `191` para `featurePolicy`).
   - `snippet`: lido de `server.ts` na linha do middleware com o cursor ` > | `, acompanhado da evidência de requisição/resposta.

4. **Secret Detection (Gitleaks)**:
   - `sourceFile`: `l.File` (ex.: `config/default.yml`).
   - `line`: `l.StartLine` (ex.: `15`).
   - `targetComponent`: `l.RuleID` (ex.: `generic-api-key`).

### 1.3 Design Visual do Cartão Allure (`asvs-remediation-box`)
O cabeçalho da tabela de remediação exibirá de forma cristalina:
- **📄 Arquivo no Código**: badge com caminho completo relativo do arquivo (destaque em azul).
- **🔢 Linha no Arquivo**: badge verde com a linha exata e sufixo explícito `(em <sourceFile>)`.
- **📦 Componente / Pacote**: pacote ou URL avaliada.
- **📋 Manifesto de Pacote**: linha correspondente em `package.json`.

## 2. Conformidade com a Constituição

- **Princípio I (Zero Core Modification)**: Nenhuma alteração nos scripts `security-tests/` ou tabelas `shared-*.json`.
- **Princípio IV (Artefatos Originais como Fonte de Verdade)**: Informações derivadas estritamente dos relatórios em `security-reports/` e do código-fonte real do repositório clonado.
- **Princípio V (Stack Nativa Node/TypeScript)**: Uso exclusivo de APIs nativas de `fs` e `path`.

## 3. Plano de Verificação

1. **Testes Unitários**:
   - Atualizar e expandir `web-ui/enricher.test.ts` para testar `sourceFile`, `line`, `targetComponent` e `manifestFile` para todas as ferramentas (SAST, SCA, DAST, Secrets).
2. **Execução de Testes e Tipagem**:
   - `npm test`
   - `npm run typecheck`
3. **Validação Experimental no Juice Shop**:
   - Executar `npm run enrich juice-shop -- --level L1 --clean-history`.
   - Inspecionar `allure-results/juice-shop/fd41b74c-5ca0-4e95-8c5d-6311914679d4-result.json` e validar os campos `sourceFile`, `line`, `manifestFile` e a renderização do HTML.
   - Confirmar a execução do servidor web e inspecionar a interface no navegador.

