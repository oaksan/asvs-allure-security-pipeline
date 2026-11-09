import * as assert from 'node:assert/strict';
import * as http from 'node:http';
import * as path from 'node:path';
import * as vm from 'node:vm';
import { describe, it } from 'node:test';

import { getAllurePluginCss, getAllurePluginJs } from './allure-plugin';
import { loadAsvsCatalog, resolveFindingToReqIds } from './asvs-catalog';
import { detectToolsForRepo } from './detector';
import {
  extractRepoNameFromUrl,
  isSafeRepoDirName,
  isTrivyDbCached,
  parseAsvsSummaryCsv,
  validateAndBuildCliCommand,
} from './runner';
import { createWebCliServer } from './server';

function httpRequest(
  url: string,
  method = 'GET',
  bodyObj?: any
): Promise<{ status: number; body: any; raw: string }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const payload = bodyObj ? JSON.stringify(bodyObj) : undefined;
    const req = http.request(
      {
        hostname: parsed.hostname,
        port: parsed.port,
        path: parsed.pathname + parsed.search,
        method,
        headers: payload
          ? {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(payload),
            }
          : {},
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (c) => chunks.push(Buffer.from(c)));
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf8');
          let body: any = raw;
          try {
            body = JSON.parse(raw);
          } catch {
            // keep raw
          }
          resolve({ status: res.statusCode || 0, body, raw });
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

describe('Native Allure Report Plugin & Smart Tool Detection (SDD 001 & 002)', () => {
  it('builds 1:1 CLI commands for run_security_scans.sh and masks passwords/tokens', () => {
    const cmd = validateAndBuildCliCommand({
      repoUrl: 'https://oauth2:mysecret@gitlab.com/org/webapp.git',
      branch: 'main',
      tools: ['npm-audit', 'trivy-fs', 'zap'],
      zapMode: 'auth',
      targetUrl: 'http://localhost:3000',
      zapLoginUrl: 'http://localhost:3000/login',
      zapAuthUser: 'admin',
      zapAuthPass: 'SuperSecret123',
      useTimer: true,
      iterations: 3,
    });

    assert.equal(cmd.script, 'security-tests/run_security_scans.timer.sh');
    assert.equal(cmd.repoName, 'webapp');
    assert.ok(
      cmd.displayCommand.includes("--zap-auth-pass '***'") ||
        cmd.displayCommand.includes('--zap-auth-pass ***')
    );
    assert.ok(!cmd.displayCommand.includes('SuperSecret123'));
    assert.ok(!cmd.displayCommand.includes('mysecret'));
    assert.equal(cmd.envOverrides.ITERATIONS, '3');
  });

  it('enforces CLI validation rules identical to run_security_scans.sh', () => {
    assert.throws(
      () => validateAndBuildCliCommand({ repoUrl: '', tools: ['npm-audit'] }),
      /--repo-url is required/
    );
    assert.throws(
      () =>
        validateAndBuildCliCommand({
          repoUrl: 'https://github.com/org/app.git',
          tools: ['zap'],
          zapMode: 'baseline',
        }),
      /--target-url is required/
    );
    assert.equal(extractRepoNameFromUrl('https://github.com/FlowiseAI/Flowise.git'), 'Flowise');
    assert.equal(isSafeRepoDirName('Flowise'), true);
    assert.equal(isSafeRepoDirName('../etc'), false);
  });

  it('auto-detects compatible tools and ASVS chapters from repository and environment', async () => {
    const workspaceRoot = path.resolve(__dirname, '..');
    const det = await detectToolsForRepo({
      workspaceDir: workspaceRoot,
      repoUrl: 'https://github.com/adeelahmad6834/asvs-allure-security-pipeline.git',
    });

    assert.equal(det.repoName, 'asvs-allure-security-pipeline');
    assert.equal(det.hasPackageJson, true);
    assert.equal(det.hasPythonFiles, false);
    assert.equal(det.trivyDbCached, true);
    assert.equal(isTrivyDbCached(), true);
    assert.equal(det.recommendSkipNpmInstall, true);
    assert.ok(det.recommendedTools.includes('npm-audit'));
    assert.ok(det.recommendedTools.includes('trivy-fs'));
    assert.ok(det.recommendedTools.includes('semgrep'));
    assert.ok(det.recommendedTools.includes('gitleaks'));
    assert.ok(!det.recommendedTools.includes('bandit'));
    assert.ok(det.coveredAsvsChapters.length >= 4);
  });

  it('serves the official Allure Report at /, native plugin assets, and /api/detect-tools', async () => {
    const workspaceRoot = path.resolve(__dirname, '..');
    const srv = createWebCliServer(workspaceRoot);
    await new Promise<void>((resolve) => srv.listen(0, '127.0.0.1', resolve));
    const addr = srv.address() as { port: number };
    const base = `http://127.0.0.1:${addr.port}`;

    try {
      const home = await httpRequest(`${base}/`);
      assert.equal(home.status, 200);
      assert.ok(home.raw.includes('<title>Allure Report</title>'));
      assert.ok(home.raw.includes('<script src="app.js"></script>'));
      assert.ok(home.raw.includes('plugin/asvs-pipeline/index.js'));

      const cssRes = await httpRequest(`${base}/plugin/asvs-pipeline/styles.css`);
      assert.equal(cssRes.status, 200);
      assert.ok(cssRes.raw.includes('position: absolute;'));
      assert.ok(cssRes.raw.includes('overflow-y: auto;'));
      assert.ok(cssRes.raw.includes('max-height: 100%;'));

      const detectRes = await httpRequest(`${base}/api/detect-tools`, 'POST', {
        repoUrl: 'https://github.com/juice-shop/juice-shop.git',
        targetUrl: base,
      });
      assert.equal(detectRes.status, 200);
      assert.equal(detectRes.body.repoName, 'juice-shop');
      assert.ok(detectRes.body.recommendedTools.includes('npm-audit'));
      assert.ok(detectRes.body.recommendedTools.includes('zap'));
      assert.equal(detectRes.body.targetUrlCheck.reachable, true);

      const preview = await httpRequest(`${base}/api/preview-cmd`, 'POST', {
        repoUrl: 'https://github.com/FlowiseAI/Flowise.git',
        tools: ['npm-audit', 'semgrep'],
      });
      assert.equal(preview.status, 200);
      assert.equal(
        preview.body.displayCommand,
        'SEMGREP_TIMEOUT=10 bash security-tests/run_security_scans.sh --repo-url https://github.com/FlowiseAI/Flowise.git --tools npm-audit,semgrep'
      );

      const traversal = await httpRequest(`${base}/api/projects/..%2Fetc`);
      assert.equal(traversal.status, 400);

      const csvPath = path.join(workspaceRoot, 'allure-results', 'juice-shop', 'asvs-summary.csv');
      const parsedCsv = parseAsvsSummaryCsv(csvPath);
      assert.ok(parsedCsv.length > 0);
      assert.ok(parsedCsv[0].asvsId.startsWith('V'));
      assert.match(parsedCsv[0].reqId, /^V\d+\.\d+\.\d+$/);
      assert.ok(parsedCsv[0].count > 0);
      assert.ok(parsedCsv[0].reqDescription.length > 0);

      const catalogRes = await httpRequest(`${base}/api/asvs-catalog`);
      assert.equal(catalogRes.status, 200);
      assert.equal(catalogRes.body.granularity, 'req_id');
      assert.equal(catalogRes.body.stats.totalRequirements, 345);
      assert.equal(catalogRes.body.stats.totalSections, 80);
      assert.equal(catalogRes.body.stats.totalChapters, 17);
      assert.deepEqual(catalogRes.body.stats.byLevel, { L1: 70, L2: 183, L3: 92 });

      const projRes = await httpRequest(`${base}/api/projects/juice-shop`);
      assert.equal(projRes.status, 200);
      assert.equal(projRes.body.asvsCatalogSummary.evaluationGranularity, 'req_id');
      assert.equal(projRes.body.asvsCatalogSummary.totalRequirements, 345);
      assert.ok(projRes.body.asvsSummary.length >= 10);
      for (const row of projRes.body.asvsSummary) {
        assert.match(row.reqId, /^V\d+\.\d+\.\d+$/);
        assert.match(row.sectionId, /^V\d+\.\d+$/);
        assert.ok(['L1', 'L2', 'L3'].includes(row.levels));
      }
    } finally {
      await new Promise<void>((resolve) => srv.close(() => resolve()));
    }
  });

  it('loads the 345-requirement ASVS 5.0.0 CSV catalog and resolves findings to exact req_id items (SDD 006)', () => {
    const workspaceRoot = path.resolve(__dirname, '..');
    const catalog = loadAsvsCatalog(workspaceRoot);
    assert.equal(catalog.stats.totalRequirements, 345);
    assert.equal(catalog.stats.totalSections, 80);
    assert.equal(catalog.stats.totalChapters, 17);
    assert.deepEqual(catalog.stats.byLevel, { L1: 70, L2: 183, L3: 92 });

    const sqli = resolveFindingToReqIds(
      {
        tool: 'semgrep',
        name: 'javascript.sequelize.security.audit.sequelize-injection-express',
        message: 'Detected a sequelize statement tainted by user-input (SQL Injection)',
        asvsTags: ['V15.3'],
      },
      catalog
    );
    assert.equal(sqli[0].reqId, 'V1.2.4');
    assert.equal(sqli[0].sectionId, 'V1.2');
    assert.equal(sqli[0].level, 'L1');

    const csp = resolveFindingToReqIds(
      {
        tool: 'zap',
        name: 'Content Security Policy (CSP) Header Not Set',
        message: 'Content Security Policy (CSP) helps mitigate Cross Site Scripting (XSS)',
        asvsTags: ['V3.4'],
      },
      catalog
    );
    assert.equal(csp[0].reqId, 'V3.4.3');
    assert.equal(csp[0].sectionId, 'V3.4');
    assert.equal(csp[0].level, 'L2');

    const secret = resolveFindingToReqIds(
      {
        tool: 'gitleaks',
        name: 'generic-api-key',
        message: 'Hardcoded secret detected',
        asvsTags: ['V13.3'],
      },
      catalog
    );
    assert.equal(secret[0].reqId, 'V13.3.1');
    assert.equal(secret[0].sectionId, 'V13.3');
    assert.equal(secret[0].level, 'L2');
  });

  it('standardizes finding terminology in allure plugin css and js (SDD 011)', () => {
    const css = getAllurePluginCss();
    assert.ok(css.includes('.splash__subtitle'));
    assert.ok(css.includes('content: "findings" !important;'));

    const js = getAllurePluginJs();
    assert.ok(js.includes("testResults_plural: 'findings'"));
    assert.ok(js.includes('standardizeFindingsTerminology'));
    assert.ok(js.includes('.splash__subtitle'));
  });

  it('suppresses redundant categories widget and tab in allure plugin (SDD 013)', () => {
    const css = getAllurePluginCss();
    assert.ok(css.includes('.widget:has(a[href*="categories"])'));
    assert.ok(css.includes('.side-nav__item:has(a[href*="categories"])'));

    const js = getAllurePluginJs();
    assert.ok(js.includes('delete allure.api.widgets.widgets.categories'));
    assert.ok(js.includes("t.tabName === 'categories'"));
    assert.ok(js.includes("window.location.hash = '#suites'"));
  });

  it('reclassifies passed to warning (yellow) and broken to brown (SDD 017)', () => {
    const css = getAllurePluginCss();
    // Yellow styling for passed / warning
    assert.ok(css.includes('.bar__fill_status_passed'));
    assert.ok(css.includes('#fbc02d'));
    assert.ok(css.includes('\\f071')); // fa-exclamation-triangle
    assert.ok(css.includes('content: "Warning" !important;'));

    // Brown styling for broken
    assert.ok(css.includes('.bar__fill_status_broken'));
    assert.ok(css.includes('#795548'));
    assert.ok(css.includes('.alert_status_broken'));

    const js = getAllurePluginJs();
    assert.ok(js.includes("passed: 'Warning'"));
    assert.ok(js.includes("broken: 'Broken'"));
    assert.ok(js.includes("passed: 'Warning'"));
    assert.ok(js.includes("warning"));
  });

  it('removes graphs tab and migrates exclusive charts to overview (SDD 018)', () => {
    const css = getAllurePluginCss();
    assert.ok(css.includes('.side-nav__item:has(a[href*="graph"])'));
    assert.ok(css.includes('.side-nav__item[data-tooltip*="Graphs"]'));
    assert.ok(css.includes('a.side-nav__link[href*="graph"]'));

    const js = getAllurePluginJs();
    assert.ok(js.includes("['severity', 'duration']"));
    assert.ok(js.includes('overviewWidgets[name] = graphWidgets[name]'));
    assert.ok(js.includes("t.tabName === 'graph'"));
    assert.ok(js.includes("window.location.hash = '#'"));
  });

  it('renames Behaviors to Findings by Tools, Packages to Findings List, Suites to Findings by Requirements (SDD 019)', () => {
    const css = getAllurePluginCss();
    assert.ok(css.includes('content: "Findings by Tools" !important;'));
    assert.ok(css.includes('content: "Findings List" !important;'));
    assert.ok(css.includes('content: "Findings by Requirements" !important;'));

    const js = getAllurePluginJs();
    assert.ok(js.includes("behaviors: { name: 'Findings by Tools' }"));
    assert.ok(js.includes("packages: { name: 'Findings List' }"));
    assert.ok(js.includes("suites: { name: 'Findings by Requirements' }"));
    assert.ok(js.includes('syncFindingsTabLabels'));
  });

  it('indicates date/time on trend chart, includes summary donut legend, and removes status chart (SDD 020)', () => {
    const css = getAllurePluginCss();
    assert.ok(css.includes('.widget[data-id="status-chart"]'));
    assert.ok(css.includes('.widget:has(.status-widget)'));
    assert.ok(css.includes('.history-trend__chart svg'));
    assert.ok(css.includes('.summary-widget .chart__legend'));

    const js = getAllurePluginJs();
    // 1. Status chart removal
    assert.ok(js.includes("delete overviewWidgets['status-chart']"));
    // 2. Summary chart legend
    assert.ok(js.includes("showLegend: true"));
    assert.ok(js.includes("allure.api.widgets.widgets.summary"));
    // 3. Trend chart timestamp formatting and padding
    assert.ok(js.includes("formatTrendDate"));
    assert.ok(js.includes("allure.api.widgets.widgets['history-trend']"));
    assert.ok(js.includes("chartView.PAD_BOTTOM = 85"));
  });

  it('restores security-scan modules and validates complete plugin JavaScript syntax (SDD 021)', () => {
    const js = getAllurePluginJs();
    // 1. Verify syntax compiles cleanly without SyntaxError
    assert.doesNotThrow(() => {
      new vm.Script(js);
    });

    // 2. Verify all scanning modules are present in the launcher
    const expectedModules = [
      'npm-audit',
      'trivy-fs',
      'semgrep',
      'gitleaks',
      'zap',
      'odc',
      'bandit',
      'sonar',
    ];
    for (const mod of expectedModules) {
      assert.ok(js.includes(`value="${mod}"`), `Missing module checkbox for ${mod}`);
      assert.ok(js.includes(`chip-${mod}`), `Missing chip markup for ${mod}`);
    }

    // 3. Verify security-scan and asvs-matrix tab registrations
    assert.ok(js.includes("allure.api.addTab('security-scan'"));
    assert.ok(js.includes("allure.api.addTab('asvs-matrix'"));
  });
});
