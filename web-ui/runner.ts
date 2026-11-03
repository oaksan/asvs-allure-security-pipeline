/**
 * Web Wrapper Runner for the unmodified upstream pipeline:
 * - security-tests/run_security_scans.sh
 * - security-tests/run_security_scans.timer.sh
 *
 * Preserves 100% 1:1 CLI parity, prevents command injection (spawn with shell: false),
 * masks secrets in CLI previews, and reads canonical Allure/ASVS artifacts.
 */

import { ChildProcess, spawn, spawnSync } from 'child_process';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { installAllureCliPlugin } from './allure-plugin';

export function getTrivyCacheDir(): string {
  return process.env.TRIVY_CACHE_DIR || path.join(os.homedir(), '.cache', 'trivy');
}

export function isTrivyDbCached(cacheDir: string = getTrivyCacheDir()): boolean {
  return (
    fs.existsSync(path.join(cacheDir, 'trivy', 'db', 'trivy.db')) ||
    fs.existsSync(path.join(cacheDir, 'db', 'trivy.db'))
  );
}

export const ALLOWED_TOOLS = [
  'odc',
  'trivy-fs',
  'zap',
  'npm-audit',
  'bandit',
  'semgrep',
  'gitleaks',
  'sonar',
] as const;

export type ScannerTool = (typeof ALLOWED_TOOLS)[number];
export type ZapMode = 'baseline' | 'full' | 'openapi' | 'auth';

export interface ScanRunOptions {
  repoUrl: string;
  branch?: string;
  tools: ScannerTool[];
  zapMode?: ZapMode;
  targetUrl?: string;
  openapiSpec?: string;
  zapLoginUrl?: string;
  zapAuthUser?: string;
  zapAuthPass?: string;
  zapUserField?: string;
  zapPassField?: string;
  zapLoggedIn?: string;
  zapLoggedOut?: string;
  zapExclude?: string;
  zapPolicy?: string;
  zapSpiderAjax?: string;
  useTimer?: boolean;
  iterations?: number;
  zapBaselineTime?: number;
  zapFullTime?: number;
  gitleaksHistory?: boolean;
  skipNpmInstall?: boolean;
  generateAllure?: boolean;
}

export interface BuiltCliCommand {
  script: string;
  args: string[];
  envOverrides: Record<string, string>;
  displayCommand: string;
  repoName: string;
}

export interface PipelineRunRecord {
  id: string;
  repoName: string;
  repoUrl: string;
  displayCommand: string;
  status: 'running' | 'completed' | 'failed' | 'canceled';
  startTime: string;
  endTime: string | null;
  exitCode: number | null;
  logs: string[];
}

const SAFE_NAME_RE = /^[A-Za-z0-9._-]+$/;

export function isSafeRepoDirName(name: string): boolean {
  if (
    !name ||
    name === '.' ||
    name === '..' ||
    name.includes('..') ||
    name.includes('/') ||
    name.includes('\\')
  ) {
    return false;
  }
  return SAFE_NAME_RE.test(name);
}

export function extractRepoNameFromUrl(repoUrl: string): string {
  const cleaned = String(repoUrl || '')
    .trim()
    .replace(/\/+$/, '')
    .replace(/\.git$/i, '');
  const parts = cleaned.split(/[/:]/).filter(Boolean);
  const last = parts[parts.length - 1] || 'repo';
  return isSafeRepoDirName(last) ? last : 'repo';
}

function shellQuote(arg: string): string {
  if (/^[A-Za-z0-9_.,/:@=-]+$/.test(arg)) return arg;
  return `'${arg.replace(/'/g, `'\\''`)}'`;
}

export function redactUrlSecrets(url: string): string {
  return String(url || '').replace(/(https?:\/\/)([^:@/]+):([^@/]+)@/gi, '$1$2:***@');
}

export function validateAndBuildCliCommand(opts: ScanRunOptions): BuiltCliCommand {
  const repoUrl = String(opts.repoUrl || '').trim();
  if (!repoUrl) {
    throw new Error('--repo-url is required (same requirement as run_security_scans.sh).');
  }

  const tools = (opts.tools || []).filter((t): t is ScannerTool =>
    (ALLOWED_TOOLS as readonly string[]).includes(t)
  );
  if (tools.length === 0) {
    throw new Error('At least one scanner tool must be selected in --tools.');
  }

  const hasZap = tools.includes('zap');
  const zapMode: ZapMode = opts.zapMode || 'baseline';

  if (hasZap) {
    if (
      (zapMode === 'baseline' || zapMode === 'full' || zapMode === 'auth') &&
      !String(opts.targetUrl || '').trim()
    ) {
      throw new Error(`--target-url is required when ZAP mode is '${zapMode}'.`);
    }
    if (zapMode === 'openapi' && !String(opts.openapiSpec || '').trim()) {
      throw new Error("--openapi is required when ZAP mode is 'openapi'.");
    }
    if (zapMode === 'auth') {
      if (!String(opts.zapLoginUrl || '').trim()) {
        throw new Error("--zap-login-url is required when ZAP mode is 'auth'.");
      }
      if (!String(opts.zapAuthUser || '').trim() || !String(opts.zapAuthPass || '').trim()) {
        throw new Error("--zap-auth-user and --zap-auth-pass are required when ZAP mode is 'auth'.");
      }
    }
  }

  const script = opts.useTimer
    ? 'security-tests/run_security_scans.timer.sh'
    : 'security-tests/run_security_scans.sh';

  const args: string[] = ['--repo-url', repoUrl];
  const displayArgs: string[] = ['--repo-url', redactUrlSecrets(repoUrl)];

  if (opts.branch && opts.branch.trim()) {
    args.push('--branch', opts.branch.trim());
    displayArgs.push('--branch', opts.branch.trim());
  }

  const toolsCsv = tools.join(',');
  args.push('--tools', toolsCsv);
  displayArgs.push('--tools', toolsCsv);

  if (hasZap) {
    args.push('--zap-mode', zapMode);
    displayArgs.push('--zap-mode', zapMode);

    if (opts.targetUrl && opts.targetUrl.trim()) {
      args.push('--target-url', opts.targetUrl.trim());
      displayArgs.push('--target-url', redactUrlSecrets(opts.targetUrl.trim()));
    }
    if (opts.openapiSpec && opts.openapiSpec.trim()) {
      args.push('--openapi', opts.openapiSpec.trim());
      displayArgs.push('--openapi', opts.openapiSpec.trim());
    }
    if (zapMode === 'auth') {
      if (opts.zapLoginUrl?.trim()) {
        args.push('--zap-login-url', opts.zapLoginUrl.trim());
        displayArgs.push('--zap-login-url', opts.zapLoginUrl.trim());
      }
      if (opts.zapAuthUser?.trim()) {
        args.push('--zap-auth-user', opts.zapAuthUser.trim());
        displayArgs.push('--zap-auth-user', opts.zapAuthUser.trim());
      }
      if (opts.zapAuthPass?.trim()) {
        args.push('--zap-auth-pass', opts.zapAuthPass.trim());
        displayArgs.push('--zap-auth-pass', '***');
      }
      if (opts.zapUserField?.trim()) {
        args.push('--zap-user-field', opts.zapUserField.trim());
        displayArgs.push('--zap-user-field', opts.zapUserField.trim());
      }
      if (opts.zapPassField?.trim()) {
        args.push('--zap-pass-field', opts.zapPassField.trim());
        displayArgs.push('--zap-pass-field', opts.zapPassField.trim());
      }
      if (opts.zapLoggedIn?.trim()) {
        args.push('--zap-logged-in', opts.zapLoggedIn.trim());
        displayArgs.push('--zap-logged-in', opts.zapLoggedIn.trim());
      }
      if (opts.zapLoggedOut?.trim()) {
        args.push('--zap-logged-out', opts.zapLoggedOut.trim());
        displayArgs.push('--zap-logged-out', opts.zapLoggedOut.trim());
      }
      if (opts.zapExclude?.trim()) {
        args.push('--zap-exclude', opts.zapExclude.trim());
        displayArgs.push('--zap-exclude', opts.zapExclude.trim());
      }
      if (opts.zapPolicy?.trim()) {
        args.push('--zap-policy', opts.zapPolicy.trim());
        displayArgs.push('--zap-policy', opts.zapPolicy.trim());
      }
      if (opts.zapSpiderAjax?.trim()) {
        args.push('--zap-spider-ajax', opts.zapSpiderAjax.trim());
        displayArgs.push('--zap-spider-ajax', opts.zapSpiderAjax.trim());
      }
    }
  }

  const envOverrides: Record<string, string> = {};
  if (opts.useTimer && opts.iterations && opts.iterations > 0) {
    envOverrides.ITERATIONS = String(opts.iterations);
  }
  if (opts.zapBaselineTime && opts.zapBaselineTime > 0) {
    envOverrides.ZAP_BASELINE_TIME = String(opts.zapBaselineTime);
  }
  if (opts.zapFullTime && opts.zapFullTime > 0) {
    envOverrides.ZAP_FULL_TIME = String(opts.zapFullTime);
  }
  if (typeof opts.gitleaksHistory === 'boolean') {
    envOverrides.GITLEAKS_HISTORY = opts.gitleaksHistory ? 'true' : 'false';
  }
  if (typeof opts.skipNpmInstall === 'boolean' && opts.skipNpmInstall) {
    envOverrides.SKIP_NPM_INSTALL = 'true';
  }
  if (typeof opts.generateAllure === 'boolean') {
    envOverrides.GENERATE_ALLURE = opts.generateAllure ? 'true' : 'false';
  }

  const envPrefix = Object.entries(envOverrides)
    .map(([k, v]) => `${k}=${shellQuote(v)}`)
    .join(' ');
  const cmdCore = `bash ${script} ${displayArgs.map(shellQuote).join(' ')}`;
  const displayCommand = envPrefix ? `${envPrefix} ${cmdCore}` : cmdCore;

  return {
    script,
    args,
    envOverrides,
    displayCommand,
    repoName: extractRepoNameFromUrl(repoUrl),
  };
}

export class PipelineRunManager {
  private runs = new Map<string, PipelineRunRecord>();
  private procs = new Map<string, ChildProcess>();

  constructor(private readonly workspaceDir: string) {}

  public listRuns(): Array<Omit<PipelineRunRecord, 'logs'> & { logCount: number }> {
    return Array.from(this.runs.values())
      .sort((a, b) => b.startTime.localeCompare(a.startTime))
      .map(({ logs, ...rest }) => ({ ...rest, logCount: logs.length }));
  }

  public getRun(id: string, offset = 0): (Omit<PipelineRunRecord, 'logs'> & { logs: string[]; totalLogs: number }) | null {
    const r = this.runs.get(id);
    if (!r) return null;
    const { logs, ...rest } = r;
    return {
      ...rest,
      logs: logs.slice(Math.max(0, offset)),
      totalLogs: logs.length,
    };
  }

  public startRun(opts: ScanRunOptions): PipelineRunRecord {
    const built = validateAndBuildCliCommand(opts);
    const id = crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : String(Date.now());

    const record: PipelineRunRecord = {
      id,
      repoName: built.repoName,
      repoUrl: redactUrlSecrets(opts.repoUrl),
      displayCommand: built.displayCommand,
      status: 'running',
      startTime: new Date().toISOString(),
      endTime: null,
      exitCode: null,
      logs: [`$ ${built.displayCommand}`, ''],
    };
    this.runs.set(id, record);

    // Ensure local Allure CLI downloaded by run_security_scans.sh is in PATH
    const localAllureBin = path.join(
      this.workspaceDir,
      'security-reports',
      '_bin',
      'allure-2.29.0',
      'bin'
    );
    const currentPath = process.env.PATH || '';
    const augmentedPath = fs.existsSync(localAllureBin)
      ? `${localAllureBin}:${currentPath}`
      : currentPath;

    const appendLines = (chunk: Buffer) => {
      const text = chunk.toString('utf8');
      const lines = text.split(/\r?\n/);
      for (const line of lines) {
        if (line.length > 0) record.logs.push(line);
      }
    };

    const launchMainScript = () => {
      if (record.status === 'canceled') return;
      const child = spawn('bash', [built.script, ...built.args], {
        cwd: this.workspaceDir,
        shell: false,
        env: {
          ...process.env,
          ...built.envOverrides,
          PATH: augmentedPath,
        },
      });
      this.procs.set(id, child);

      child.stdout?.on('data', appendLines);
      child.stderr?.on('data', appendLines);

      child.on('close', (code) => {
        this.procs.delete(id);
        const allureBinExe = path.join(localAllureBin, 'allure');
        const resultsDir = path.join(this.workspaceDir, 'allure-results', built.repoName);
        const reportDir = path.join(this.workspaceDir, 'allure-report', built.repoName);
        if (
          fs.existsSync(allureBinExe) &&
          fs.existsSync(resultsDir) &&
          !fs.existsSync(path.join(reportDir, 'index.html'))
        ) {
          try {
            fs.chmodSync(allureBinExe, 0o755);
            spawnSync(allureBinExe, ['generate', resultsDir, '--clean', '-o', reportDir], {
              cwd: this.workspaceDir,
            });
            record.logs.push(`📊 Allure report generated → ./allure-report/${built.repoName}`);
          } catch {
            // ignore fallback error
          }
        }
        try {
          installAllureCliPlugin(this.workspaceDir);
        } catch {
          // ignore plugin install error
        }

        record.endTime = new Date().toISOString();
        record.exitCode = code ?? 1;
        if (record.status === 'running') {
          record.status = code === 0 ? 'completed' : 'failed';
        }
      });

      child.on('error', (err) => {
        this.procs.delete(id);
        record.logs.push(`Process error: ${err.message}`);
        record.endTime = new Date().toISOString();
        record.exitCode = 1;
        record.status = 'failed';
      });
    };

    const trivyCacheDir = getTrivyCacheDir();
    if (opts.tools.includes('trivy-fs') && !isTrivyDbCached(trivyCacheDir)) {
      fs.mkdirSync(trivyCacheDir, { recursive: true });
      record.logs.push(
        `⬇️ Pre-warming Trivy vulnerability DB in ${trivyCacheDir} (required by --skip-db-update)...`
      );
      const warmup = spawn(
        'docker',
        [
          'run',
          '--rm',
          '-v',
          `${trivyCacheDir}:/root/.cache/`,
          process.env.TRIVY_IMAGE || 'aquasec/trivy:latest',
          'image',
          '--download-db-only',
        ],
        { cwd: this.workspaceDir, shell: false }
      );
      this.procs.set(id, warmup);
      warmup.stdout?.on('data', appendLines);
      warmup.stderr?.on('data', appendLines);
      warmup.on('close', () => {
        record.logs.push('✅ Trivy vulnerability DB ready. Starting pipeline...');
        launchMainScript();
      });
      warmup.on('error', () => {
        launchMainScript();
      });
    } else {
      launchMainScript();
    }

    return record;
  }

  public cancelRun(id: string): boolean {
    const proc = this.procs.get(id);
    const rec = this.runs.get(id);
    if (!proc || !rec || rec.status !== 'running') return false;
    rec.status = 'canceled';
    rec.logs.push('⚠️ Execution canceled by user.');
    proc.kill('SIGTERM');
    return true;
  }
}

export function parseAsvsSummaryCsv(csvPath: string): Array<{
  asvsId: string;
  chapter: string;
  title: string;
  levels: string;
  count: number;
}> {
  if (!fs.existsSync(csvPath)) return [];
  const lines = fs
    .readFileSync(csvPath, 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0);
  if (lines.length <= 1) return [];

  const out: Array<{
    asvsId: string;
    chapter: string;
    title: string;
    levels: string;
    count: number;
  }> = [];

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i];
    // Format from asvs-unified-to-allure.ts: asvs_id,chapter,title,levels,count (with JSON.stringify quotes on strings)
    const match = /^"([^"]*)","([^"]*)","((?:[^"]|"")*)","([^"]*)",(\d+)$/.exec(row.trim());
    if (match) {
      out.push({
        asvsId: match[1],
        chapter: match[2],
        title: match[3].replace(/""/g, '"'),
        levels: match[4],
        count: Number(match[5]),
      });
    }
  }
  return out;
}

export function listEvaluatedProjects(workspaceDir: string): Array<Record<string, any>> {
  const resultsRoot = path.join(workspaceDir, 'allure-results');
  const reportsRoot = path.join(workspaceDir, 'allure-report');
  const names = new Set<string>();

  for (const root of [resultsRoot, reportsRoot]) {
    if (fs.existsSync(root)) {
      for (const entry of fs.readdirSync(root)) {
        if (isSafeRepoDirName(entry) && fs.statSync(path.join(root, entry)).isDirectory()) {
          names.add(entry);
        }
      }
    }
  }

  const projects: Array<Record<string, any>> = [];
  for (const name of Array.from(names).sort()) {
    const resDir = path.join(resultsRoot, name);
    const repIndex = path.join(reportsRoot, name, 'index.html');
    const rollupPath = path.join(resDir, 'severity-rollup.json');
    let rollup: any = null;
    if (fs.existsSync(rollupPath)) {
      try {
        rollup = JSON.parse(fs.readFileSync(rollupPath, 'utf8'));
      } catch {
        rollup = null;
      }
    }
    projects.push({
      repoName: name,
      hasAllureReport: fs.existsSync(repIndex),
      allureReportUrl: fs.existsSync(repIndex) ? `/allure-report/${encodeURIComponent(name)}/index.html` : null,
      rollup,
    });
  }
  return projects;
}

export function getProjectArtifacts(workspaceDir: string, repoName: string): Record<string, any> {
  if (!isSafeRepoDirName(repoName)) {
    throw new Error('Invalid repository name');
  }
  const resDir = path.join(workspaceDir, 'allure-results', repoName);
  const repIndex = path.join(workspaceDir, 'allure-report', repoName, 'index.html');
  if (!fs.existsSync(resDir) && !fs.existsSync(repIndex)) {
    throw new Error(`Project '${repoName}' not found in allure-results or allure-report.`);
  }

  let rollupJson: any = null;
  const rollupPath = path.join(resDir, 'severity-rollup.json');
  if (fs.existsSync(rollupPath)) {
    try {
      rollupJson = JSON.parse(fs.readFileSync(rollupPath, 'utf8'));
    } catch {
      rollupJson = null;
    }
  }

  const rollupMdPath = path.join(resDir, 'severity-rollup.md');
  const rollupMd = fs.existsSync(rollupMdPath) ? fs.readFileSync(rollupMdPath, 'utf8') : '';

  const envPropPath = path.join(resDir, 'environment.properties');
  const environmentProperties = fs.existsSync(envPropPath)
    ? fs.readFileSync(envPropPath, 'utf8')
    : '';

  const asvsSummary = parseAsvsSummaryCsv(path.join(resDir, 'asvs-summary.csv'));

  const timingsPath = path.join(workspaceDir, 'timings.csv');
  const timingsCsv = fs.existsSync(timingsPath) ? fs.readFileSync(timingsPath, 'utf8') : '';

  const secReportsDir = path.join(workspaceDir, 'security-reports');
  const rawReports: string[] = [];
  if (fs.existsSync(secReportsDir)) {
    for (const f of fs.readdirSync(secReportsDir).sort()) {
      const full = path.join(secReportsDir, f);
      if (fs.statSync(full).isFile()) rawReports.push(f);
    }
  }

  return {
    repoName,
    hasAllureReport: fs.existsSync(repIndex),
    allureReportUrl: fs.existsSync(repIndex)
      ? `/allure-report/${encodeURIComponent(repoName)}/index.html`
      : null,
    rollup: rollupJson,
    rollupMarkdown: rollupMd,
    asvsSummary,
    environmentProperties,
    timingsCsv,
    rawReports,
  };
}
