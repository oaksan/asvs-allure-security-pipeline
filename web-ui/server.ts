#!/usr/bin/env ts-node
/**
 * Local HTTP Server that serves the official Allure Report UI directly at "/"
 * with the native ASVS Pipeline plugin injected (adding the "Security Scan (CLI)"
 * and "ASVS v5 Matrix" tabs inside Allure's own left sidebar).
 */

import * as fs from 'fs';
import * as http from 'http';
import * as path from 'path';
import {
  getAllurePluginCss,
  getAllurePluginJs,
  installAllureCliPlugin,
} from './allure-plugin';
import { loadAsvsCatalog } from './asvs-catalog';
import {
  detectToolsForRepo,
  managePresetContainer,
} from './detector';
import {
  enrichAllureResultsDir,
  regenerateAllureHtmlReport,
} from './enricher';
import {
  PipelineRunManager,
  getProjectArtifacts,
  isSafeRepoDirName,
  listEvaluatedProjects,
  validateAndBuildCliCommand,
} from './runner';

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
};

function sendJson(res: http.ServerResponse, status: number, payload: any): void {
  const body = JSON.stringify(payload, null, 2);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(body);
}

function sendText(res: http.ServerResponse, status: number, contentType: string, text: string): void {
  res.writeHead(status, {
    'Content-Type': contentType,
    'Content-Length': Buffer.byteLength(text),
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(text);
}

function readJsonBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c) => chunks.push(Buffer.from(c)));
    req.on('end', () => {
      try {
        const text = Buffer.concat(chunks).toString('utf8');
        resolve(text ? JSON.parse(text) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function injectPluginTagsIntoAllureHtml(html: string): string {
  let out = html;
  if (!out.includes('plugin/asvs-pipeline/styles.css')) {
    out = out.replace(
      '</head>',
      '    <link rel="stylesheet" type="text/css" href="plugin/asvs-pipeline/styles.css">\n</head>'
    );
  }
  if (!out.includes('plugin/asvs-pipeline/index.js')) {
    if (out.includes('<script src="plugin/screen-diff/index.js"></script>')) {
      out = out.replace(
        '<script src="plugin/screen-diff/index.js"></script>',
        '<script src="plugin/screen-diff/index.js"></script>\n    <script src="plugin/asvs-pipeline/index.js"></script>'
      );
    } else {
      out = out.replace(
        '</body>',
        '    <script src="plugin/asvs-pipeline/index.js"></script>\n</body>'
      );
    }
  }
  return out;
}

function serveAllureFile(res: http.ServerResponse, reportDir: string, relativePath: string, method = 'GET'): void {
  const resolvedBase = path.resolve(reportDir);
  const relClean = relativePath.replace(/^\/+/, '') || 'index.html';
  const targetPath = path.resolve(resolvedBase, relClean);

  if (!targetPath.startsWith(resolvedBase + path.sep) && targetPath !== resolvedBase) {
    return sendJson(res, 400, { error: 'Path traversal blocked' });
  }

  let finalPath = targetPath;
  if (fs.existsSync(finalPath) && fs.statSync(finalPath).isDirectory()) {
    finalPath = path.join(finalPath, 'index.html');
  }
  if (!fs.existsSync(finalPath) || !fs.statSync(finalPath).isFile()) {
    return sendJson(res, 404, { error: `Allure file not found: ${relClean}` });
  }

  if (path.basename(finalPath) === 'index.html') {
    const rawHtml = fs.readFileSync(finalPath, 'utf8');
    const injected = injectPluginTagsIntoAllureHtml(rawHtml);
    if (method === 'HEAD') {
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Length': Buffer.byteLength(injected),
        'X-Content-Type-Options': 'nosniff',
      });
      res.end();
      return;
    }
    return sendText(res, 200, 'text/html; charset=utf-8', injected);
  }

  const ext = path.extname(finalPath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  const buf = fs.readFileSync(finalPath);
  res.writeHead(200, {
    'Content-Type': contentType,
    'Content-Length': buf.length,
    'X-Content-Type-Options': 'nosniff',
  });
  if (method === 'HEAD') {
    res.end();
    return;
  }
  res.end(buf);
}

export function createWebCliServer(workspaceDir: string = path.resolve(__dirname, '..')): http.Server {
  const rootPath = path.resolve(workspaceDir);
  installAllureCliPlugin(rootPath);
  const runManager = new PipelineRunManager(rootPath);

  const pickDefaultProject = (): string => {
    const projs = listEvaluatedProjects(rootPath);
    const withReport = projs.find((p) => p.hasAllureReport);
    return withReport ? withReport.repoName : projs[0]?.repoName || 'asvs-allure-security-pipeline';
  };

  let activeProject = pickDefaultProject();

  return http.createServer(async (req, res) => {
    try {
      const parsedUrl = new URL(req.url || '/', 'http://127.0.0.1');
      const pathname = parsedUrl.pathname;
      const method = (req.method || 'GET').toUpperCase();

      // Dynamic plugin assets (always up-to-date)
      if (method === 'GET' && pathname.endsWith('/plugin/asvs-pipeline/index.js')) {
        return sendText(res, 200, 'application/javascript; charset=utf-8', getAllurePluginJs());
      }
      if (method === 'GET' && pathname.endsWith('/plugin/asvs-pipeline/styles.css')) {
        return sendText(res, 200, 'text/css; charset=utf-8', getAllurePluginCss());
      }

      // REST API routes for the native Allure tabs
      if (method === 'POST' && pathname === '/api/detect-tools') {
        const body = await readJsonBody(req);
        const repoUrl = String(body.repoUrl || '').trim();
        const targetUrl = body.targetUrl ? String(body.targetUrl).trim() : undefined;
        if (!repoUrl) {
          return sendJson(res, 400, { error: '--repo-url is required for tool detection' });
        }
        const detection = await detectToolsForRepo({
          workspaceDir: rootPath,
          repoUrl,
          targetUrl,
        });
        return sendJson(res, 200, detection);
      }

      if (method === 'POST' && pathname === '/api/target-container') {
        const body = await readJsonBody(req);
        const action = body.action === 'start' || body.action === 'stop' ? body.action : 'status';
        const preset = body.preset === 'flowise' ? 'flowise' : 'juice-shop';
        try {
          const result = managePresetContainer(action, preset);
          return sendJson(res, 200, result);
        } catch (err: any) {
          return sendJson(res, 500, { error: err?.message || 'Container operation failed' });
        }
      }

      if (method === 'POST' && pathname === '/api/preview-cmd') {
        const body = await readJsonBody(req);
        try {
          const built = validateAndBuildCliCommand(body);
          return sendJson(res, 200, built);
        } catch (err: any) {
          return sendJson(res, 400, { error: err?.message || 'Invalid CLI parameters' });
        }
      }

      if (method === 'GET' && pathname === '/api/runs') {
        return sendJson(res, 200, { runs: runManager.listRuns() });
      }

      if (method === 'POST' && pathname === '/api/runs') {
        const body = await readJsonBody(req);
        try {
          const run = runManager.startRun(body);
          activeProject = run.repoName;
          return sendJson(res, 201, { run });
        } catch (err: any) {
          return sendJson(res, 400, { error: err?.message || 'Failed to start run' });
        }
      }

      if (method === 'GET' && pathname.startsWith('/api/runs/')) {
        const runId = decodeURIComponent(pathname.slice('/api/runs/'.length));
        const offset = Number(parsedUrl.searchParams.get('offset') || 0);
        const run = runManager.getRun(runId, offset);
        if (!run) return sendJson(res, 404, { error: 'Run not found' });
        return sendJson(res, 200, run);
      }

      if (method === 'POST' && pathname.startsWith('/api/runs/') && pathname.endsWith('/cancel')) {
        const runId = decodeURIComponent(
          pathname.slice('/api/runs/'.length, pathname.length - '/cancel'.length)
        );
        const ok = runManager.cancelRun(runId);
        return sendJson(res, ok ? 200 : 400, { canceled: ok });
      }

      if (method === 'GET' && pathname === '/api/asvs-catalog') {
        const catalog = loadAsvsCatalog(rootPath);
        return sendJson(res, 200, {
          source: 'docs/OWASP_Application_Security_Verification_Standard_5.0.0_en.csv',
          granularity: 'req_id',
          stats: catalog.stats,
          requirements: catalog.requirements,
        });
      }

      if (method === 'GET' && pathname === '/api/projects') {
        const projects = listEvaluatedProjects(rootPath);
        if (!projects.some((p) => p.repoName === activeProject) && projects.length > 0) {
          activeProject = projects[0].repoName;
        }
        return sendJson(res, 200, { activeProject, projects });
      }

      if (method === 'POST' && pathname === '/api/active-project') {
        const body = await readJsonBody(req);
        const repoName = String(body.repoName || '').trim();
        if (!isSafeRepoDirName(repoName)) {
          return sendJson(res, 400, { error: 'Invalid repository name' });
        }
        activeProject = repoName;
        installAllureCliPlugin(rootPath);
        return sendJson(res, 200, { activeProject });
      }

      if (method === 'GET' && pathname.startsWith('/api/projects/')) {
        const repoName = decodeURIComponent(pathname.slice('/api/projects/'.length));
        if (!isSafeRepoDirName(repoName)) {
          return sendJson(res, 400, { error: 'Invalid repository name' });
        }
        try {
          const artifacts = getProjectArtifacts(rootPath, repoName);
          return sendJson(res, 200, artifacts);
        } catch (err: any) {
          return sendJson(res, 404, { error: err?.message || 'Project not found' });
        }
      }

      if (method === 'POST' && pathname.startsWith('/api/enrich/')) {
        const repoName = decodeURIComponent(pathname.slice('/api/enrich/'.length));
        if (!isSafeRepoDirName(repoName)) {
          return sendJson(res, 400, { error: 'Invalid repository name' });
        }
        const resultsDir = path.join(rootPath, 'allure-results', repoName);
        if (!fs.existsSync(resultsDir)) {
          return sendJson(res, 404, { error: `Results directory not found for ${repoName}` });
        }
        const levelQuery = parsedUrl.searchParams.get('level');
        const levelFilter: 'L1' | 'all' = levelQuery === 'all' ? 'all' : 'L1';
        const cleanHistory = parsedUrl.searchParams.get('cleanHistory') !== 'false';
        const catalog = loadAsvsCatalog(rootPath);
        const stats = enrichAllureResultsDir(resultsDir, catalog, {
          updateSummaryCsv: true,
          levelFilter,
          excludeUtilityArtifacts: true,
          cleanHistory,
        });
        const genRes = regenerateAllureHtmlReport(rootPath, repoName, { cleanHistory });
        installAllureCliPlugin(rootPath);
        return sendJson(res, 200, {
          repoName,
          levelFilter,
          stats,
          reportRegenerated: genRes.success,
          reportOutput: genRes.output.trim(),
        });
      }

      // Serve explicit /allure-report/:repo/* if requested
      if ((method === 'GET' || method === 'HEAD') && pathname.startsWith('/allure-report/')) {
        const rest = pathname.slice('/allure-report/'.length);
        const slashIdx = rest.indexOf('/');
        const repoName = decodeURIComponent(slashIdx >= 0 ? rest.slice(0, slashIdx) : rest);
        const relFile = slashIdx >= 0 ? decodeURIComponent(rest.slice(slashIdx + 1)) : 'index.html';
        if (!isSafeRepoDirName(repoName)) {
          return sendJson(res, 400, { error: 'Invalid repository name' });
        }
        const reportDir = path.join(rootPath, 'allure-report', repoName);
        return serveAllureFile(res, reportDir, relFile, method);
      }

      // Root ("/") and all relative Allure assets ("/app.js", "/styles.css", "/data/*", "/widgets/*")
      // serve the active Allure Report directly!
      if (method === 'GET' || method === 'HEAD') {
        const activeReportDir = path.join(rootPath, 'allure-report', activeProject);
        return serveAllureFile(res, activeReportDir, pathname, method);
      }

      return sendJson(res, 404, { error: 'Not found' });
    } catch (err: any) {
      return sendJson(res, 500, { error: err?.message || 'Internal server error' });
    }
  });
}

if (require.main === module) {
  const port = Number(process.env.PORT || 8765);
  const host = process.env.HOST || '127.0.0.1';
  const srv = createWebCliServer();
  srv.listen(port, host, () => {
    console.log(
      `Allure Report with Native ASVS Security Pipeline Plugin listening on http://${host}:${port}`
    );
  });
}
