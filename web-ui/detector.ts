/**
 * Smart Repository & Environment Tool Detector (Iteration 002)
 * Inspects target repository languages/files, local environment readiness,
 * and target Web URL connectivity to recommend the optimal --tools set
 * and maximize OWASP ASVS v5 chapter coverage.
 */

import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';
import * as os from 'os';
import * as path from 'path';
import {
  ALLOWED_TOOLS,
  ScannerTool,
  extractRepoNameFromUrl,
  isTrivyDbCached,
} from './runner';

export interface ToolRecommendation {
  tool: ScannerTool;
  recommended: boolean;
  available: boolean;
  reason: string;
  asvsChapters: string[];
}

export interface TargetUrlCheckResult {
  provided: boolean;
  reachable: boolean;
  statusCode: number | null;
  suggestedScannerUrl: string | null;
  message: string;
}

export interface DetectionReport {
  repoName: string;
  repoUrl: string;
  detectedLanguages: string[];
  hasPackageJson: boolean;
  hasPythonFiles: boolean;
  dockerAvailable: boolean;
  trivyDbCached: boolean;
  recommendSkipNpmInstall: boolean;
  recommendedTools: ScannerTool[];
  coveredAsvsChapters: string[];
  toolsDetail: Record<ScannerTool, ToolRecommendation>;
  targetUrlCheck: TargetUrlCheckResult;
}

export const TOOL_ASVS_CHAPTERS: Record<ScannerTool, string[]> = {
  'npm-audit': ['V15.2.1 (Third-Party Dependencies & Remediation)'],
  'trivy-fs': [
    'V15.2.1 (Dependencies SCA)',
    'V13.2.4 / V13.1.1 (IaC & Cloud Configuration)',
    'V13.3.1 (Secret Exposure)',
  ],
  semgrep: [
    'V1.2.1 / V1.2.4 / V1.2.5 (XSS, SQL/NoSQL & Command Injection)',
    'V1.3.2 (Dynamic Code Execution)',
    'V2.3.1 (Business Logic)',
    'V3.4.2 / V3.4.4 / V3.4.6 (Browser Security Headers)',
    'V5.3.2 (Path Traversal)',
    'V11.4.1 / V11.5.1 (Hashing & CSPRNG)',
    'V13.3.1 (Hardcoded Secrets)',
    'V16.5.1 (Error Disclosure)',
  ],
  gitleaks: ['V13.3.1 (Secret Management & Hardcoded Credentials)'],
  zap: [
    'V3.4.1 / V3.4.2 / V3.4.3 / V3.4.8 (HSTS, CORS, CSP, COEP Headers)',
    'V3.3.1 / V3.3.2 / V3.3.4 (Cookie Secure, SameSite & HttpOnly)',
    'V1.3.2 (Dangerous JS Functions)',
    'V14.3.2 (Anti-Caching Headers)',
  ],
  odc: ['V15.2.1 (Known Vulnerable Dependencies / NVD CVEs)'],
  bandit: [
    'V1.2.4 / V1.2.5 (Python SQL & OS Command Injection)',
    'V5.3.2 (File Handling)',
    'V11.3.1 / V11.4.1 (Cryptography)',
    'V13.3.1 (Hardcoded Secrets)',
    'V15.2.1 (Secure Coding)',
  ],
  sonar: [
    'V1.2.4 (Injection Prevention)',
    'V6.2.8 (Authentication)',
    'V11.2.1 (Secure Cryptography Implementation)',
    'V15.3.1 (Defensive Coding)',
  ],
};

function checkDockerAvailable(): boolean {
  try {
    const res = spawnSync('docker', ['--version'], { timeout: 2000 });
    return res.status === 0;
  } catch {
    return false;
  }
}

function checkOdcCachePresent(workspaceDir: string): boolean {
  if (process.env.NVD_API_KEY && process.env.NVD_API_KEY !== 'replace_me') {
    return true;
  }
  const candidates = [
    path.join(workspaceDir, '.odc-cache', 'odc.mv.db'),
    path.join(workspaceDir, '.odc-cache', 'dc.h2.db'),
    path.join(os.homedir(), 'odc-data', 'odc.mv.db'),
    path.join(os.homedir(), 'odc-data', 'dc.h2.db'),
  ];
  return candidates.some((p) => fs.existsSync(p));
}

function httpProbe(urlStr: string, timeoutMs = 2000): Promise<{ ok: boolean; statusCode: number | null }> {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(urlStr);
      const client = parsed.protocol === 'https:' ? https : http;
      const req = client.request(
        parsed,
        {
          method: 'GET',
          timeout: timeoutMs,
          headers: { 'User-Agent': 'ASVS-Allure-Pipeline-Detector/1.0' },
        },
        (res) => {
          res.resume();
          const code = res.statusCode || 0;
          resolve({ ok: code > 0 && code < 500, statusCode: code });
        }
      );
      req.on('timeout', () => {
        req.destroy();
        resolve({ ok: false, statusCode: null });
      });
      req.on('error', () => resolve({ ok: false, statusCode: null }));
      req.end();
    } catch {
      resolve({ ok: false, statusCode: null });
    }
  });
}

function fetchJsonHttps(urlStr: string, timeoutMs = 2500): Promise<any | null> {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(urlStr);
      const req = https.request(
        parsed,
        {
          method: 'GET',
          timeout: timeoutMs,
          headers: {
            'User-Agent': 'ASVS-Allure-Pipeline-Detector/1.0',
            Accept: 'application/vnd.github.v3+json',
          },
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on('data', (c) => chunks.push(Buffer.from(c)));
          res.on('end', () => {
            if (res.statusCode !== 200) return resolve(null);
            try {
              resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
            } catch {
              resolve(null);
            }
          });
        }
      );
      req.on('timeout', () => {
        req.destroy();
        resolve(null);
      });
      req.on('error', () => resolve(null));
      req.end();
    } catch {
      resolve(null);
    }
  });
}

function scanLocalRepoCharacteristics(repoDir: string): {
  hasPackageJson: boolean;
  hasPythonFiles: boolean;
  languages: string[];
} {
  const hasPackageJson =
    fs.existsSync(path.join(repoDir, 'package.json')) ||
    fs.existsSync(path.join(repoDir, 'frontend', 'package.json'));

  let hasPythonFiles =
    fs.existsSync(path.join(repoDir, 'requirements.txt')) ||
    fs.existsSync(path.join(repoDir, 'pyproject.toml')) ||
    fs.existsSync(path.join(repoDir, 'Pipfile')) ||
    fs.existsSync(path.join(repoDir, 'setup.py'));

  if (!hasPythonFiles) {
    try {
      const entries = fs.readdirSync(repoDir);
      for (const e of entries) {
        if (e.endsWith('.py')) {
          hasPythonFiles = true;
          break;
        }
        const sub = path.join(repoDir, e);
        if (
          !['node_modules', '.git', 'dist', 'build', 'coverage'].includes(e) &&
          fs.existsSync(sub) &&
          fs.statSync(sub).isDirectory()
        ) {
          const subEntries = fs.readdirSync(sub);
          if (subEntries.some((se) => se.endsWith('.py'))) {
            hasPythonFiles = true;
            break;
          }
        }
      }
    } catch {
      // ignore read errors
    }
  }

  const languages: string[] = [];
  if (hasPackageJson) languages.push('JavaScript/TypeScript (Node.js)');
  if (hasPythonFiles) languages.push('Python');
  if (languages.length === 0) languages.push('Generic Source Code');

  return { hasPackageJson, hasPythonFiles, languages };
}

async function inspectRepoCharacteristics(
  workspaceDir: string,
  repoUrl: string
): Promise<{
  hasPackageJson: boolean;
  hasPythonFiles: boolean;
  languages: string[];
  source: 'local-clone' | 'github-api' | 'heuristic';
}> {
  const repoName = extractRepoNameFromUrl(repoUrl);
  const localDir = path.join(workspaceDir, repoName);

  // 1. Check if already cloned locally in workspace
  if (fs.existsSync(localDir) && fs.statSync(localDir).isDirectory()) {
    const localInfo = scanLocalRepoCharacteristics(localDir);
    return { ...localInfo, source: 'local-clone' };
  }

  // 2. If GitHub URL, try fast GitHub API inspection
  const ghMatch = /github\.com[:/]([^/]+)\/([^/.]+)(?:\.git)?$/i.exec(repoUrl.trim());
  if (ghMatch) {
    const owner = ghMatch[1];
    const repo = ghMatch[2];
    const [langsObj, rootContents] = await Promise.all([
      fetchJsonHttps(`https://api.github.com/repos/${owner}/${repo}/languages`),
      fetchJsonHttps(`https://api.github.com/repos/${owner}/${repo}/contents`),
    ]);

    if (langsObj || Array.isArray(rootContents)) {
      const langKeys = langsObj ? Object.keys(langsObj) : [];
      const fileNames = Array.isArray(rootContents)
        ? rootContents.map((item: any) => String(item.name || '').toLowerCase())
        : [];

      const hasPackageJson =
        fileNames.includes('package.json') ||
        langKeys.includes('TypeScript') ||
        langKeys.includes('JavaScript');
      const hasPythonFiles =
        langKeys.includes('Python') ||
        fileNames.includes('requirements.txt') ||
        fileNames.includes('pyproject.toml') ||
        fileNames.includes('setup.py');

      return {
        hasPackageJson,
        hasPythonFiles,
        languages: langKeys.length > 0 ? langKeys : hasPackageJson ? ['JavaScript/TypeScript'] : ['Generic'],
        source: 'github-api',
      };
    }
  }

  // 3. Heuristic fallback for known repositories or generic git URLs
  const lower = repoUrl.toLowerCase();
  const isKnownNode =
    lower.includes('juice-shop') ||
    lower.includes('flowise') ||
    lower.includes('asvs-allure-security-pipeline') ||
    lower.includes('node');
  const isKnownPy = lower.includes('django') || lower.includes('flask') || lower.includes('fastapi') || lower.includes('python');

  return {
    hasPackageJson: isKnownNode,
    hasPythonFiles: isKnownPy,
    languages: isKnownNode
      ? ['JavaScript/TypeScript (Node.js)']
      : isKnownPy
      ? ['Python']
      : ['Generic Repository'],
    source: 'heuristic',
  };
}

export async function checkTargetUrlReachability(rawTargetUrl?: string): Promise<TargetUrlCheckResult> {
  const trimmed = String(rawTargetUrl || '').trim();
  if (!trimmed) {
    return {
      provided: false,
      reachable: false,
      statusCode: null,
      suggestedScannerUrl: null,
      message: 'No --target-url provided yet (fill --target-url to enable OWASP ZAP DAST).',
    };
  }

  // If user gave 172.17.0.1 (Docker bridge IP on Linux), also probe 127.0.0.1 from the host
  let hostProbeUrl = trimmed;
  let suggestedScannerUrl = trimmed;
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/.*)?$/i.test(trimmed)) {
    suggestedScannerUrl = trimmed.replace(
      /^http:\/\/(localhost|127\.0\.0\.1)/i,
      'http://172.17.0.1'
    );
  } else if (/^http:\/\/172\.17\.0\.1(:\d+)?(\/.*)?$/i.test(trimmed)) {
    hostProbeUrl = trimmed.replace(/^http:\/\/172\.17\.0\.1/i, 'http://127.0.0.1');
  }

  const probe = await httpProbe(hostProbeUrl, 2000);
  if (probe.ok) {
    return {
      provided: true,
      reachable: true,
      statusCode: probe.statusCode,
      suggestedScannerUrl,
      message: `Target Web App is online (HTTP ${probe.statusCode}). ZAP DAST enabled!`,
    };
  }

  return {
    provided: true,
    reachable: false,
    statusCode: probe.statusCode,
    suggestedScannerUrl,
    message: `Target URL (${trimmed}) did not respond to HTTP probe, but ZAP can still be run if reachable from Docker.`,
  };
}

export async function detectToolsForRepo(params: {
  workspaceDir: string;
  repoUrl: string;
  targetUrl?: string;
}): Promise<DetectionReport> {
  const { workspaceDir, repoUrl, targetUrl } = params;
  const repoName = extractRepoNameFromUrl(repoUrl);
  const dockerAvailable = checkDockerAvailable();
  const odcCacheReady = checkOdcCachePresent(workspaceDir);
  const trivyDbCached = isTrivyDbCached();
  const localRepoDir = path.join(workspaceDir, repoName);
  const recommendSkipNpmInstall =
    fs.existsSync(path.join(localRepoDir, 'node_modules')) ||
    fs.existsSync(path.join(localRepoDir, 'package-lock.json'));

  const sonarUrl = process.env.SONAR_HOST_URL || 'http://127.0.0.1:9000';
  const [repoInfo, sonarProbe, targetCheck] = await Promise.all([
    inspectRepoCharacteristics(workspaceDir, repoUrl),
    httpProbe(sonarUrl, 1200),
    checkTargetUrlReachability(targetUrl),
  ]);

  const details: Record<ScannerTool, ToolRecommendation> = {
    'npm-audit': {
      tool: 'npm-audit',
      available: true,
      recommended: repoInfo.hasPackageJson,
      reason: repoInfo.hasPackageJson
        ? `Detected Node.js / package.json (${repoInfo.source})`
        : 'No package.json detected in repository',
      asvsChapters: TOOL_ASVS_CHAPTERS['npm-audit'],
    },
    'trivy-fs': {
      tool: 'trivy-fs',
      available: dockerAvailable,
      recommended: dockerAvailable,
      reason: !dockerAvailable
        ? 'Docker not available on host'
        : trivyDbCached
        ? 'Docker + Trivy Vulnerability DB cached & ready'
        : 'Docker ready (will auto-download Trivy DB on first run)',
      asvsChapters: TOOL_ASVS_CHAPTERS['trivy-fs'],
    },
    semgrep: {
      tool: 'semgrep',
      available: dockerAvailable,
      recommended: dockerAvailable,
      reason: dockerAvailable
        ? `Docker available — SAST rules for ${repoInfo.languages.join(', ')}`
        : 'Docker not available on host',
      asvsChapters: TOOL_ASVS_CHAPTERS.semgrep,
    },
    gitleaks: {
      tool: 'gitleaks',
      available: dockerAvailable,
      recommended: dockerAvailable,
      reason: dockerAvailable
        ? 'Docker available — scans repository for hardcoded secrets & keys'
        : 'Docker not available on host',
      asvsChapters: TOOL_ASVS_CHAPTERS.gitleaks,
    },
    zap: {
      tool: 'zap',
      available: dockerAvailable,
      recommended: dockerAvailable && targetCheck.provided && targetCheck.reachable,
      reason: !dockerAvailable
        ? 'Docker not available'
        : targetCheck.provided && targetCheck.reachable
        ? `Target URL reachable (HTTP ${targetCheck.statusCode}) — DAST ready`
        : targetCheck.provided
        ? 'Target URL provided (currently unreachable from host)'
        : 'Requires running Web App (--target-url)',
      asvsChapters: TOOL_ASVS_CHAPTERS.zap,
    },
    bandit: {
      tool: 'bandit',
      available: dockerAvailable,
      recommended: dockerAvailable && repoInfo.hasPythonFiles,
      reason: repoInfo.hasPythonFiles
        ? 'Python files detected in repository'
        : 'Skipped automatically (no Python .py files detected)',
      asvsChapters: TOOL_ASVS_CHAPTERS.bandit,
    },
    odc: {
      tool: 'odc',
      available: dockerAvailable,
      recommended: dockerAvailable && odcCacheReady,
      reason: odcCacheReady
        ? 'Local NVD CVE cache / API key ready'
        : 'Optional (no local NVD cache; 1st run downloads ~300MB CVE DB)',
      asvsChapters: TOOL_ASVS_CHAPTERS.odc,
    },
    sonar: {
      tool: 'sonar',
      available: sonarProbe.ok,
      recommended: sonarProbe.ok && Boolean(process.env.SONAR_TOKEN),
      reason: sonarProbe.ok
        ? 'Local SonarQube server online'
        : 'Local SonarQube server (port 9000) is offline',
      asvsChapters: TOOL_ASVS_CHAPTERS.sonar,
    },
  };

  const recommendedTools = ALLOWED_TOOLS.filter((t) => details[t].recommended);
  const chaptersSet = new Set<string>();
  for (const t of recommendedTools) {
    for (const ch of details[t].asvsChapters) {
      chaptersSet.add(ch);
    }
  }

  return {
    repoName,
    repoUrl,
    detectedLanguages: repoInfo.languages,
    hasPackageJson: repoInfo.hasPackageJson,
    hasPythonFiles: repoInfo.hasPythonFiles,
    dockerAvailable,
    trivyDbCached,
    recommendSkipNpmInstall,
    recommendedTools,
    coveredAsvsChapters: Array.from(chaptersSet),
    toolsDetail: details,
    targetUrlCheck: targetCheck,
  };
}

export interface PresetContainerResult {
  preset: 'juice-shop' | 'flowise';
  containerName: string;
  running: boolean;
  targetUrl: string;
  message: string;
}

export function managePresetContainer(
  action: 'status' | 'start' | 'stop',
  preset: 'juice-shop' | 'flowise' = 'juice-shop'
): PresetContainerResult {
  const cfg =
    preset === 'flowise'
      ? {
          name: 'assat-flowise-target',
          image: 'flowiseai/flowise:latest',
          port: 3001,
          containerPort: 3000,
        }
      : {
          name: 'assat-juice-shop-target',
          image: 'bkimminich/juice-shop:latest',
          port: 3000,
          containerPort: 3000,
        };

  const targetUrl = `http://172.17.0.1:${cfg.port}`;

  const isRunning = (): boolean => {
    const res = spawnSync('docker', ['ps', '--filter', `name=^/${cfg.name}$`, '--format', '{{.Names}}']);
    return (res.stdout?.toString('utf8') || '').trim() === cfg.name;
  };

  if (action === 'status') {
    const running = isRunning();
    return {
      preset,
      containerName: cfg.name,
      running,
      targetUrl,
      message: running
        ? `Container ${cfg.name} is running on ${targetUrl}`
        : `Container ${cfg.name} is not running`,
    };
  }

  if (action === 'stop') {
    spawnSync('docker', ['rm', '-f', cfg.name]);
    return {
      preset,
      containerName: cfg.name,
      running: false,
      targetUrl,
      message: `Container ${cfg.name} stopped.`,
    };
  }

  // action === 'start'
  if (isRunning()) {
    return {
      preset,
      containerName: cfg.name,
      running: true,
      targetUrl,
      message: `Container ${cfg.name} is already running at ${targetUrl}`,
    };
  }

  spawnSync('docker', ['rm', '-f', cfg.name]);
  const startRes = spawnSync('docker', [
    'run',
    '-d',
    '--rm',
    '--name',
    cfg.name,
    '-p',
    `${cfg.port}:${cfg.containerPort}`,
    cfg.image,
  ]);

  if (startRes.status !== 0) {
    const errText = startRes.stderr?.toString('utf8') || 'Failed to start Docker container';
    throw new Error(errText.trim());
  }

  return {
    preset,
    containerName: cfg.name,
    running: true,
    targetUrl,
    message: `Started ${cfg.name} (${cfg.image}) at ${targetUrl}`,
  };
}

