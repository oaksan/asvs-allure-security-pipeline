import test from 'node:test';
import * as assert from 'node:assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { loadAsvsCatalog } from './asvs-catalog';
import {
  enrichResultData,
  enrichAllureResultsDir,
  findApplicationCallers,
  readSourceSnippet,
  RawReportsIndex,
  enrichHistoryTrend,
} from './enricher';

test('enrichResultData transforms coarse section_id to atomic req_id and L1 level', () => {
  const catalog = loadAsvsCatalog(path.resolve(__dirname, '..'));

  const rawResult = {
    uuid: 'test-uuid-1',
    name: 'ajinabraham.njsscan.database.nosql_find_injection.node_nosqli_injection',
    fullName: 'data/static/codefixes/db.ts :: nosql_find_injection',
    status: 'failed',
    statusDetails: {
      message:
        '[[SEVERITY:HIGH]]\nASVS: V1.2 [L1,L2]\n\nUntrusted user input in findOne() function can result in NoSQL Injection.',
      trace: '[[SEVERITY:HIGH]]',
    },
    labels: [
      { name: 'feature', value: 'semgrep' },
      { name: 'tag', value: 'Tool:semgrep' },
      { name: 'tag', value: 'ASVS:5.0.0/V1.2' },
      { name: 'suite', value: 'ASVS: V1: Encoding and Sanitization' },
      { name: 'level', value: 'L1' },
    ],
  };

  const res = enrichResultData(rawResult, catalog);
  assert.strictEqual(res.changed, true);
  assert.strictEqual(res.resolvedReqs.length > 0, true);
  assert.strictEqual(res.resolvedReqs[0].reqId, 'V1.2.4');
  assert.strictEqual(res.resolvedReqs[0].level, 'L1');

  // statusDetails.message must now contain ASVS: V1.2.4 [L1]
  assert.match(res.data.statusDetails.message, /ASVS: V1\.2\.4 \[L1\]/);
  assert.doesNotMatch(res.data.statusDetails.message, /\[L1,L2\]/);
  // Preserves severity token and description
  assert.match(res.data.statusDetails.message, /\[\[SEVERITY:HIGH\]\]/);
  assert.match(res.data.statusDetails.message, /NoSQL Injection/);

  // Labels must contain ASVS:5.0.0/V1.2.4 and single level L1
  const tags = res.data.labels.filter((l: any) => l.name === 'tag').map((l: any) => l.value);
  assert.ok(tags.includes('ASVS:5.0.0/V1.2.4'));
  assert.ok(!tags.includes('ASVS:5.0.0/V1.2'));

  const levelLabel = res.data.labels.find((l: any) => l.name === 'level')?.value;
  assert.strictEqual(levelLabel, 'L1');

  const subSuite = res.data.labels.find((l: any) => l.name === 'subSuite')?.value;
  assert.match(subSuite, /V1\.2\.4/);
  assert.match(subSuite, /parameterized queries/i);

  // Description and descriptionHtml must be enriched with ASVS Requirement details (SDD 012)
  assert.ok(res.data.descriptionHtml.includes('asvs-requirement-box'));
  assert.ok(res.data.descriptionHtml.includes('V1.2.4'));
  assert.match(res.data.descriptionHtml, /parameterized queries/i);
  assert.ok(res.data.description.includes('OWASP ASVS v5.0.0 Requirement'));
});

test('enrichResultData reclassifies Trivy package vulnerabilities from V13.1 to V15.2.1', () => {
  const catalog = loadAsvsCatalog(path.resolve(__dirname, '..'));

  const rawResult = {
    uuid: 'test-uuid-2',
    name: 'got',
    fullName: 'package-lock.json :: got',
    status: 'failed',
    statusDetails: {
      message:
        '[[SEVERITY:MEDIUM]]\nASVS: V13.1 [L1]\n\nThe got package before 12.1.0 allows redirect to UNIX socket.',
      trace: '[[SEVERITY:MEDIUM]]',
    },
    labels: [
      { name: 'feature', value: 'trivy' },
      { name: 'tag', value: 'Tool:trivy' },
      { name: 'tag', value: 'ASVS:5.0.0/V13.1' },
      { name: 'suite', value: 'ASVS: V13: Configuration' },
      { name: 'level', value: 'L1' },
    ],
  };

  const res = enrichResultData(rawResult, catalog);
  assert.strictEqual(res.changed, true);
  assert.strictEqual(res.resolvedReqs[0].reqId, 'V15.2.1');
  assert.strictEqual(res.resolvedReqs[0].level, 'L1');
  assert.match(res.data.statusDetails.message, /ASVS: V15\.2\.1 \[L1\]/);
  assert.doesNotMatch(res.data.statusDetails.message, /V13\.1/);
});

test('enrichAllureResultsDir updates files in directory and generates req_id summary csv', () => {
  const catalog = loadAsvsCatalog(path.resolve(__dirname, '..'));
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'assat-enrich-test-'));

  try {
    const file1 = path.join(tmpDir, '1-result.json');
    const file2 = path.join(tmpDir, '2-result.json');

    fs.writeFileSync(
      file1,
      JSON.stringify({
        uuid: '1',
        name: 'express-open-redirect',
        statusDetails: { message: '[[SEVERITY:HIGH]]\nASVS: V1.2 [L1,L2]\nOpen redirect' },
        labels: [{ name: 'feature', value: 'semgrep' }, { name: 'tag', value: 'ASVS:5.0.0/V1.2' }],
      })
    );

    fs.writeFileSync(
      file2,
      JSON.stringify({
        uuid: '2',
        name: 'helmet_header_nosniff',
        statusDetails: { message: '[[SEVERITY:LOW]]\nASVS: V3.4 [L1]\nNosniff' },
        labels: [{ name: 'feature', value: 'semgrep' }, { name: 'tag', value: 'ASVS:5.0.0/V3.4' }],
      })
    );

    const stats = enrichAllureResultsDir(tmpDir, catalog, { updateSummaryCsv: true });
    assert.strictEqual(stats.totalResults, 2);
    assert.strictEqual(stats.enrichedCount, 2);
    assert.strictEqual(stats.byReqId['V1.2.2'], 1);
    assert.strictEqual(stats.byReqId['V3.4.4'], 1);

    // Verify file content written back
    const read1 = JSON.parse(fs.readFileSync(file1, 'utf8'));
    assert.match(read1.statusDetails.message, /ASVS: V1\.2\.2 \[L1\]/);

    const read2 = JSON.parse(fs.readFileSync(file2, 'utf8'));
    assert.match(read2.statusDetails.message, /ASVS: V3\.4\.4 \[L2\]/);

    // Verify asvs-summary.csv (with req_description)
    const csvContent = fs.readFileSync(path.join(tmpDir, 'asvs-summary.csv'), 'utf8');
    assert.match(csvContent, /req_id,chapter_id,chapter_name/);
    assert.match(csvContent, /req_description/);
    assert.match(csvContent, /V1\.2\.2/);
    assert.match(csvContent, /V3\.4\.4/);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('enrichAllureResultsDir with levelFilter=L1 retains only L1 findings and backups non-L1 (SDD 009)', () => {
  const catalog = loadAsvsCatalog(path.resolve(__dirname, '..'));
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'assat-l1-filter-test-'));

  try {
    const l1File = path.join(tmpDir, 'l1-result.json');
    const l2File = path.join(tmpDir, 'l2-result.json');

    // V1.2.2 is Level 1
    fs.writeFileSync(
      l1File,
      JSON.stringify({
        uuid: 'l1',
        name: 'express-open-redirect',
        statusDetails: { message: '[[SEVERITY:HIGH]]\nASVS: V1.2 [L1,L2]\nOpen redirect' },
        labels: [{ name: 'feature', value: 'semgrep' }, { name: 'tag', value: 'ASVS:5.0.0/V1.2' }],
      })
    );

    // V3.4.4 is Level 2 (nosniff)
    fs.writeFileSync(
      l2File,
      JSON.stringify({
        uuid: 'l2',
        name: 'helmet_header_nosniff',
        statusDetails: { message: '[[SEVERITY:LOW]]\nASVS: V3.4 [L1]\nNosniff' },
        labels: [{ name: 'feature', value: 'semgrep' }, { name: 'tag', value: 'ASVS:5.0.0/V3.4' }],
      })
    );

    // Run with levelFilter: 'L1'
    const stats = enrichAllureResultsDir(tmpDir, catalog, {
      updateSummaryCsv: true,
      levelFilter: 'L1',
    });

    assert.strictEqual(stats.levelFilter, 'L1');
    assert.strictEqual(stats.enrichedCount, 1);
    assert.strictEqual(stats.filteredNonL1Count, 1);
    assert.strictEqual(stats.byLevel.L1, 1);
    assert.strictEqual(stats.byLevel.L2, 0);

    // L1 file must exist in results directory
    assert.strictEqual(fs.existsSync(l1File), true);
    // L2 file must NOT exist in root results directory
    assert.strictEqual(fs.existsSync(l2File), false);
    // L2 file must be safely backed up in .non-l1-backup
    const backupL2 = path.join(tmpDir, '.non-l1-backup', 'l2-result.json');
    assert.strictEqual(fs.existsSync(backupL2), true);

    // Summary CSV must only have L1
    const csvContent = fs.readFileSync(path.join(tmpDir, 'asvs-summary.csv'), 'utf8');
    assert.match(csvContent, /V1\.2\.2/);
    assert.doesNotMatch(csvContent, /V3\.4\.4/);

    // Now test restoring back with levelFilter: 'all'
    const restoreStats = enrichAllureResultsDir(tmpDir, catalog, {
      updateSummaryCsv: true,
      levelFilter: 'all',
    });
    assert.strictEqual(restoreStats.enrichedCount, 2);
    assert.strictEqual(fs.existsSync(l2File), true);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('enrichAllureResultsDir excludes utility artifacts and cleans history (SDD 010)', () => {
  const catalog = loadAsvsCatalog(path.resolve(__dirname, '..'));
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'assat-clean-history-test-'));

  try {
    const findingFile = path.join(tmpDir, 'vuln-result.json');
    const utilityFile = path.join(tmpDir, 'meta-result.json');
    const histDir = path.join(tmpDir, 'history');
    fs.mkdirSync(histDir, { recursive: true });
    fs.writeFileSync(path.join(histDir, 'history.json'), '{}');

    // Real vulnerability
    fs.writeFileSync(
      findingFile,
      JSON.stringify({
        uuid: 'vuln',
        name: 'express-open-redirect',
        statusDetails: { message: '[[SEVERITY:HIGH]]\nASVS: V1.2 [L1,L2]\nOpen redirect' },
        labels: [{ name: 'feature', value: 'semgrep' }, { name: 'tag', value: 'ASVS:5.0.0/V1.2' }],
      })
    );

    // Utility artifact / pseudo-finding (Meta Rollup)
    fs.writeFileSync(
      utilityFile,
      JSON.stringify({
        uuid: 'meta',
        name: 'Severity Rollup Summary',
        fullName: 'Meta :: Severity Rollup Summary',
        status: 'passed',
        labels: [{ name: 'feature', value: 'Meta' }],
      })
    );

    const stats = enrichAllureResultsDir(tmpDir, catalog, {
      updateSummaryCsv: true,
      levelFilter: 'L1',
      excludeUtilityArtifacts: true,
      cleanHistory: true,
    });

    assert.strictEqual(stats.enrichedCount, 1);
    assert.strictEqual(stats.filteredUtilityCount, 1);
    // Real finding retained
    assert.strictEqual(fs.existsSync(findingFile), true);
    // Utility file moved to backup
    assert.strictEqual(fs.existsSync(utilityFile), false);
    // History directory purged
    assert.strictEqual(fs.existsSync(histDir), false);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('enrichResultData enriches finding with precise location, parameters and remediation context (SDD 014)', () => {
  const catalog = loadAsvsCatalog(path.resolve(__dirname, '..'));

  const rawResult = {
    uuid: 'test-loc-1',
    name: 'ajinabraham.njsscan.database.nosql_find_injection.node_nosqli_injection',
    fullName:
      'routes/basketItems.ts :: ajinabraham.njsscan.database.nosql_find_injection.node_nosqli_injection',
    status: 'failed',
    statusDetails: {
      message: '[[SEVERITY:HIGH]]\nASVS: V1.2 [L1]\nUntrusted user input in findOne()',
      trace: '[[SEVERITY:HIGH]]',
    },
    labels: [
      { name: 'feature', value: 'semgrep' },
      { name: 'tag', value: 'Tool:semgrep' },
      { name: 'suite', value: 'ASVS: V1: Encoding and Sanitization' },
      { name: 'level', value: 'L1' },
    ],
  };

  const mockIndex = {
    semgrep: new Map([
      [
        'routes/basketItems.ts::ajinabraham.njsscan.database.nosql_find_injection.node_nosqli_injection',
        {
          line: 68,
          col: 10,
          snippet: 'models.BasketItem.findOne({ where: { id: req.params.id } })',
          message: 'Sanitize input or use parameterized queries to avoid NoSQL Injection.',
          cwe: ['CWE-943'],
        },
      ],
    ]),
    trivy: new Map(),
    npmAudit: new Map(),
    zap: new Map(),
    gitleaks: new Map(),
  };

  const res = enrichResultData(rawResult, catalog, mockIndex);

  // 1. Name is updated to highlight file and line
  assert.strictEqual(res.data.name, '[routes/basketItems.ts:68] node_nosqli_injection');

  // 2. Parameters are populated
  assert.ok(Array.isArray(res.data.parameters));
  const fileParam = res.data.parameters.find((p: any) => p.name === 'Source File');
  assert.strictEqual(fileParam?.value, 'routes/basketItems.ts');
  const lineParam = res.data.parameters.find((p: any) => p.name === 'Line Number');
  assert.strictEqual(lineParam?.value, '68');
  const remParam = res.data.parameters.find((p: any) => p.name === 'Remediation');
  assert.match(remParam?.value, /parameterized queries/i);

  // 3. descriptionHtml contains remediation card with code snippet
  assert.ok(res.data.descriptionHtml.includes('asvs-remediation-box'));
  assert.ok(res.data.descriptionHtml.includes('routes/basketItems.ts'));
  assert.ok(res.data.descriptionHtml.includes('LINHA 68'));
  assert.ok(res.data.descriptionHtml.includes('models.BasketItem.findOne'));
});

test('findApplicationCallers discovers manifest and source callers (SDD 015)', () => {
  const root = path.resolve(__dirname, '..');
  const callers = findApplicationCallers(root, 'juice-shop', 'pdfkit');
  assert.ok(callers.length > 0, 'Should find callers for pdfkit in juice-shop');
  assert.ok(callers.some((c) => c.includes('package.json')), 'Should find package.json caller');
  assert.ok(callers.some((c) => c.includes('routes/order.ts')), 'Should find routes/order.ts caller');
});

test('readSourceSnippet formats code lines with gutter and > marker (SDD 015)', () => {
  const root = path.resolve(__dirname, '..');
  const snippet = readSourceSnippet(root, 'juice-shop', 'routes/order.ts', 42);
  assert.ok(snippet, 'Snippet should be non-empty');
  assert.ok(snippet.includes('> |'), 'Should have > marker on line 42');
  assert.ok(snippet.includes('PDFDocument'), 'Should include imported class');
});

test('enrichResultData for SCA dependency resolves transitive cause, callers and advisory (SDD 015)', () => {
  const catalog = loadAsvsCatalog(path.resolve(__dirname, '..'));
  const rawResult = {
    uuid: 'test-sca-pdfkit',
    name: 'pdfkit',
    fullName: 'pdfkit :: pdfkit',
    status: 'failed',
    statusDetails: {
      message: '[[SEVERITY:CRITICAL]]\nASVS: V11.3.1\ncrypto-js',
    },
    labels: [
      { name: 'feature', value: 'npm-audit' },
      { name: 'severity', value: 'critical' },
      { name: 'tag', value: 'Tool:npm-audit' },
      { name: 'tag', value: 'ASVS:5.0.0/V11.3.1' },
      { name: 'level', value: 'L1' },
    ],
  };

  const mockIndex: RawReportsIndex = {
    semgrep: new Map(),
    trivy: new Map(),
    npmAudit: new Map([
      [
        'pdfkit',
        {
          name: 'pdfkit',
          severity: 'critical',
          isDirect: true,
          advisories: [],
          transitiveCauses: [
            {
              pkgName: 'crypto-js',
              title: 'crypto-js PBKDF2 weak standard',
              cwe: ['CWE-327'],
              url: 'https://github.com/advisories/GHSA-xwcq-pm8m-c4vf',
            },
          ],
          effects: [],
          range: '<=0.12.1',
          fixedVersion: '0.20.2',
        },
      ],
    ]),
    zap: new Map(),
    gitleaks: new Map(),
  };

  const root = path.resolve(__dirname, '..');
  const res = enrichResultData(rawResult, catalog, mockIndex, root, 'juice-shop');

  // Name should reflect code caller or manifest
  assert.ok(res.data.name.includes('[routes/order.ts:42]') || res.data.name.includes('pdfkit'));
  assert.ok(res.data.name.includes('Fixed: 0.20.2'));

  // Parameters should include Source File, Line, Advisory and Dependency Chain
  const srcParam = res.data.parameters.find((p: any) => p.name === 'Source File');
  assert.strictEqual(srcParam?.value, 'routes/order.ts');
  const lineParam = res.data.parameters.find((p: any) => p.name === 'Line Number');
  assert.strictEqual(lineParam?.value, '42');
  const advParam = res.data.parameters.find((p: any) => p.name === 'Advisory');
  assert.strictEqual(advParam?.value, 'crypto-js PBKDF2 weak standard');
  const chainParam = res.data.parameters.find((p: any) => p.name === 'Dependency Chain');
  assert.ok(chainParam?.value.includes('crypto-js'));

  // descriptionHtml has explicit Source File and Line details (SDD 016)
  assert.ok(res.data.descriptionHtml.includes('asvs-remediation-box'));
  assert.ok(res.data.descriptionHtml.includes('📄 Arquivo no Código:'));
  assert.ok(res.data.descriptionHtml.includes('routes/order.ts'));
  assert.ok(res.data.descriptionHtml.includes('LINHA 42'));
  assert.ok(res.data.descriptionHtml.includes('(em <code>routes/order.ts</code>)'));
  assert.ok(res.data.descriptionHtml.includes('crypto-js'));
  assert.ok(res.data.descriptionHtml.includes('CWE-327'));
  assert.ok(res.data.descriptionHtml.includes('0.20.2'));
});

test('correlates DAST ZAP findings to concrete application source file and line (SDD 016)', () => {
  const catalog = loadAsvsCatalog(path.resolve(__dirname, '..'));
  const rawZapResult = {
    uuid: 'test-zap-cors',
    name: 'Cross-Domain Misconfiguration',
    fullName: 'http://172.17.0.1:3000 :: Cross-Domain Misconfiguration',
    status: 'failed',
    statusDetails: {
      message: '[[SEVERITY:MEDIUM]]\nASVS: V12.2.1\nCORS Header allows all origins',
    },
    labels: [
      { name: 'feature', value: 'zap' },
      { name: 'severity', value: 'medium' },
      { name: 'tag', value: 'Tool:zap' },
      { name: 'tag', value: 'ASVS:5.0.0/V12.2.1' },
      { name: 'level', value: 'L1' },
    ],
  };

  const mockIndex: RawReportsIndex = {
    semgrep: new Map(),
    trivy: new Map(),
    npmAudit: new Map(),
    zap: new Map([
      [
        'cross-domain misconfiguration',
        {
          pluginId: '10098',
          name: 'Cross-Domain Misconfiguration',
          riskDesc: 'Medium',
          solution: 'Configure CORS properly',
          instances: [
            {
              uri: 'http://172.17.0.1:3000/assets/public/favicon_js.ico',
              method: 'GET',
              evidence: 'Access-Control-Allow-Origin: *',
            },
          ],
        },
      ],
    ]),
    gitleaks: new Map(),
  };

  const root = path.resolve(__dirname, '..');
  const res = enrichResultData(rawZapResult, catalog, mockIndex, root, 'juice-shop');

  // Should resolve source file and line for DAST
  const srcParam = res.data.parameters.find((p: any) => p.name === 'Source File');
  assert.strictEqual(srcParam?.value, 'server.ts');
  const lineParam = res.data.parameters.find((p: any) => p.name === 'Line Number');
  assert.strictEqual(lineParam?.value, '184');

  // descriptionHtml shows server.ts and line 184
  assert.ok(res.data.descriptionHtml.includes('📄 Arquivo no Código:'));
  assert.ok(res.data.descriptionHtml.includes('server.ts'));
  assert.ok(res.data.descriptionHtml.includes('LINHA 184'));
  assert.ok(res.data.descriptionHtml.includes('Access-Control-Allow-Origin: *'));
});

test('applies semantic yellow/warning styling to passed findings and red to failed findings (SDD 017)', () => {
  const catalog = loadAsvsCatalog(path.resolve(__dirname, '..'));

  const failedResult = {
    uuid: 'f-1',
    name: 'routes/order.ts :: injection',
    fullName: 'routes/order.ts :: injection',
    status: 'failed',
    labels: [
      { name: 'feature', value: 'semgrep' },
      { name: 'tag', value: 'Tool:semgrep' },
      { name: 'tag', value: 'ASVS:5.0.0/V1.2.4' },
    ],
  };

  const warningResult = {
    uuid: 'w-1',
    name: 'server.ts :: express_cors',
    fullName: 'server.ts :: express_cors',
    status: 'passed',
    labels: [
      { name: 'feature', value: 'semgrep' },
      { name: 'tag', value: 'Tool:semgrep' },
      { name: 'tag', value: 'ASVS:5.0.0/V3.4.2' },
    ],
  };

  const mockIndex: RawReportsIndex = {
    semgrep: new Map(),
    trivy: new Map(),
    npmAudit: new Map(),
    zap: new Map(),
    gitleaks: new Map(),
  };

  const root = path.resolve(__dirname, '..');
  const enrichedFailed = enrichResultData(failedResult, catalog, mockIndex, root, 'juice-shop');
  const enrichedWarning = enrichResultData(warningResult, catalog, mockIndex, root, 'juice-shop');

  // Failed finding theme
  assert.ok(enrichedFailed.data.descriptionHtml.includes('FAILED - BLOQUEANTE'));
  assert.ok(enrichedFailed.data.descriptionHtml.includes('#c62828'));

  // Warning (non-blocking) finding theme - yellow/amber, no green
  assert.ok(enrichedWarning.data.descriptionHtml.includes('WARNING - NÃO BLOQUEANTE'));
  assert.ok(enrichedWarning.data.descriptionHtml.includes('#f57f17'));
  assert.ok(!enrichedWarning.data.descriptionHtml.includes('#2e7d32')); // no green
  assert.ok(!enrichedWarning.data.descriptionHtml.includes('#f1f8e9')); // no green
});

test('enrichHistoryTrend maps execution timestamps and formatted dates into history-trend.json (SDD 020)', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'allure-trend-test-'));
  const reportDir = path.join(tmpDir, 'allure-report');
  const widgetsDir = path.join(reportDir, 'widgets');
  const historyDir = path.join(reportDir, 'history');
  fs.mkdirSync(widgetsDir, { recursive: true });
  fs.mkdirSync(historyDir, { recursive: true });

  // 1. Setup summary.json with time.start
  const tsLatest = 1794232756889; // 09/11/2026 10:59 UTC-3
  fs.writeFileSync(
    path.join(widgetsDir, 'summary.json'),
    JSON.stringify({ time: { start: tsLatest, stop: tsLatest + 60000 } }),
    'utf8'
  );

  // 2. Setup history.json with an older run
  const tsOlder = 1793836242022; // 04/11/2026 20:50 UTC-3
  fs.writeFileSync(
    path.join(historyDir, 'history.json'),
    JSON.stringify({
      'test-1': {
        items: [{ time: { start: tsOlder, stop: tsOlder + 600 } }],
      },
    }),
    'utf8'
  );

  // 3. Setup mock history-trend.json with 2 items
  fs.writeFileSync(
    path.join(widgetsDir, 'history-trend.json'),
    JSON.stringify([
      { buildOrder: 2, data: { failed: 10, passed: 5 } },
      { buildOrder: 1, data: { failed: 8, passed: 5 } },
    ]),
    'utf8'
  );

  const res = enrichHistoryTrend(reportDir);
  assert.strictEqual(res, true);

  const enrichedContent = JSON.parse(
    fs.readFileSync(path.join(widgetsDir, 'history-trend.json'), 'utf8')
  );
  assert.strictEqual(enrichedContent.length, 2);
  assert.ok(enrichedContent[0].timestamp);
  assert.ok(enrichedContent[0].dateStr);
  assert.strictEqual(enrichedContent[0].timestamp, tsLatest);
  assert.strictEqual(enrichedContent[1].timestamp, tsOlder);
  assert.ok(enrichedContent[0].dateStr.includes('/2026'));
  assert.ok(enrichedContent[1].dateStr.includes('/2026'));

  fs.rmSync(tmpDir, { recursive: true, force: true });
});



