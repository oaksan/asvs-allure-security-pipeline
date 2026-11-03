import * as assert from 'node:assert/strict';
import * as http from 'node:http';
import * as path from 'node:path';
import { describe, it } from 'node:test';

import { detectToolsForRepo } from './detector';
import {
  extractRepoNameFromUrl,
  isSafeRepoDirName,
  isTrivyDbCached,
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
        'bash security-tests/run_security_scans.sh --repo-url https://github.com/FlowiseAI/Flowise.git --tools npm-audit,semgrep'
      );

      const traversal = await httpRequest(`${base}/api/projects/..%2Fetc`);
      assert.equal(traversal.status, 400);
    } finally {
      await new Promise<void>((resolve) => srv.close(() => resolve()));
    }
  });
});
