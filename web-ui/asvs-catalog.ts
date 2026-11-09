/**
 * Canonical OWASP ASVS v5.0.0 Catalog & Granular Requirement (req_id) Classifier (SDD 006)
 *
 * Loads the official 345 atomic requirements (req_id) across 80 sections (section_id)
 * and 17 chapters (chapter_id) from:
 *   docs/OWASP_Application_Security_Verification_Standard_5.0.0_en.csv
 *
 * Resolves security findings from SAST, DAST, SCA, and Secret scanners directly to
 * 3-tier atomic requirement IDs (e.g. V1.2.4, V3.4.3, V13.3.1, V15.2.1) and official
 * verification levels (L1, L2, L3) without modifying any upstream repository files.
 */

import * as fs from 'fs';
import * as path from 'path';

export interface AsvsRequirementRecord {
  chapterId: string;
  chapterName: string;
  sectionId: string;
  sectionName: string;
  reqId: string;
  reqDescription: string;
  level: 'L1' | 'L2' | 'L3';
}

export interface AsvsCatalog {
  csvPath: string;
  requirements: AsvsRequirementRecord[];
  byReqId: Map<string, AsvsRequirementRecord>;
  bySectionId: Map<string, AsvsRequirementRecord[]>;
  byChapterId: Map<string, AsvsRequirementRecord[]>;
  stats: {
    totalRequirements: number;
    totalSections: number;
    totalChapters: number;
    byLevel: { L1: number; L2: number; L3: number };
  };
}

export interface FindingClassificationInput {
  tool: string;
  name?: string;
  fullName?: string;
  message?: string;
  asvsTags?: string[];
  suiteChapter?: string;
  epicTitle?: string;
}

/**
 * RFC 4180 compliant CSV parser for OWASP_Application_Security_Verification_Standard_5.0.0_en.csv
 */
export function getRequirementsByLevel(
  catalog: AsvsCatalog,
  level: 'L1' | 'L2' | 'L3'
): AsvsRequirementRecord[] {
  return catalog.requirements.filter((r) => r.level === level);
}

export function parseRfc4180Csv(content: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    const next = content[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        currentField += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        currentField += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        currentRow.push(currentField);
        currentField = '';
      } else if (ch === '\r' && next === '\n') {
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
        i++;
      } else if (ch === '\n' || ch === '\r') {
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
      } else {
        currentField += ch;
      }
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  return rows;
}

let cachedCatalog: { path: string; mtimeMs: number; catalog: AsvsCatalog } | null = null;

export function loadAsvsCatalog(
  workspaceDir: string = path.resolve(__dirname, '..')
): AsvsCatalog {
  const csvPath = path.join(
    workspaceDir,
    'docs',
    'OWASP_Application_Security_Verification_Standard_5.0.0_en.csv'
  );

  if (fs.existsSync(csvPath)) {
    const stat = fs.statSync(csvPath);
    if (cachedCatalog && cachedCatalog.path === csvPath && cachedCatalog.mtimeMs === stat.mtimeMs) {
      return cachedCatalog.catalog;
    }

    const raw = fs.readFileSync(csvPath, 'utf8');
    const rawRows = parseRfc4180Csv(raw);
    const requirements: AsvsRequirementRecord[] = [];
    const byReqId = new Map<string, AsvsRequirementRecord>();
    const bySectionId = new Map<string, AsvsRequirementRecord[]>();
    const byChapterId = new Map<string, AsvsRequirementRecord[]>();
    const byLevel = { L1: 0, L2: 0, L3: 0 };

    // Header: chapter_id,chapter_name,section_id,section_name,req_id,req_description,L
    for (let i = 1; i < rawRows.length; i++) {
      const r = rawRows[i];
      if (!r || r.length < 7) continue;
      const chapterId = r[0].trim();
      const chapterName = r[1].trim();
      const sectionId = r[2].trim();
      const sectionName = r[3].trim();
      const reqId = r[4].trim();
      const reqDescription = r[5].trim();
      const rawLevel = r[6].trim().replace(/^L/i, '');
      if (!reqId) continue;

      const level: 'L1' | 'L2' | 'L3' =
        rawLevel === '1' ? 'L1' : rawLevel === '3' ? 'L3' : 'L2';

      byLevel[level]++;

      const rec: AsvsRequirementRecord = {
        chapterId,
        chapterName,
        sectionId,
        sectionName,
        reqId,
        reqDescription,
        level,
      };

      requirements.push(rec);
      byReqId.set(reqId, rec);

      const secList = bySectionId.get(sectionId) || [];
      secList.push(rec);
      bySectionId.set(sectionId, secList);

      const chapList = byChapterId.get(chapterId) || [];
      chapList.push(rec);
      byChapterId.set(chapterId, chapList);
    }

    const catalog: AsvsCatalog = {
      csvPath,
      requirements,
      byReqId,
      bySectionId,
      byChapterId,
      stats: {
        totalRequirements: requirements.length,
        totalSections: bySectionId.size,
        totalChapters: byChapterId.size,
        byLevel,
      },
    };

    cachedCatalog = { path: csvPath, mtimeMs: stat.mtimeMs, catalog };
    return catalog;
  }

  return {
    csvPath,
    requirements: [],
    byReqId: new Map(),
    bySectionId: new Map(),
    byChapterId: new Map(),
    stats: {
      totalRequirements: 0,
      totalSections: 0,
      totalChapters: 0,
      byLevel: { L1: 0, L2: 0, L3: 0 },
    },
  };
}

/**
 * Default representative req_id when only a 2-tier section_id is known and no
 * finer rule/message heuristic matches.
 */
const DEFAULT_REQ_BY_SECTION: Record<string, string> = {
  'V1.1': 'V1.1.1',
  'V1.2': 'V1.2.1',
  'V1.3': 'V1.3.1',
  'V1.4': 'V1.4.1',
  'V1.5': 'V1.5.2',
  'V2.1': 'V2.1.1',
  'V2.2': 'V2.2.1',
  'V2.3': 'V2.3.1',
  'V2.4': 'V2.4.1',
  'V3.1': 'V3.1.1',
  'V3.2': 'V3.2.1',
  'V3.3': 'V3.3.1',
  'V3.4': 'V3.4.3',
  'V3.5': 'V3.5.1',
  'V3.6': 'V3.6.1',
  'V3.7': 'V3.7.2',
  'V4.1': 'V4.1.1',
  'V4.2': 'V4.2.1',
  'V4.3': 'V4.3.1',
  'V4.4': 'V4.4.1',
  'V5.1': 'V5.1.1',
  'V5.2': 'V5.2.2',
  'V5.3': 'V5.3.2',
  'V5.4': 'V5.4.1',
  'V6.1': 'V6.1.1',
  'V6.2': 'V6.2.8',
  'V6.3': 'V6.3.1',
  'V6.4': 'V6.4.3',
  'V7.2': 'V7.2.1',
  'V8.1': 'V8.1.1',
  'V8.2': 'V8.2.1',
  'V8.3': 'V8.3.1',
  'V9.1': 'V9.1.1',
  'V9.2': 'V9.2.1',
  'V11.1': 'V11.1.1',
  'V11.2': 'V11.2.1',
  'V11.3': 'V11.3.2',
  'V11.4': 'V11.4.1',
  'V11.5': 'V11.5.1',
  'V12.1': 'V12.1.1',
  'V12.2': 'V12.2.1',
  'V13.1': 'V13.1.1',
  'V13.2': 'V13.2.4',
  'V13.3': 'V13.3.1',
  'V13.4': 'V13.4.3',
  'V14.2': 'V14.2.1',
  'V14.3': 'V14.3.2',
  'V15.1': 'V15.1.1',
  'V15.2': 'V15.2.1',
  'V15.3': 'V15.3.1',
  'V16.4': 'V16.4.2',
  'V16.5': 'V16.5.1',
};

/**
 * Multi-signal semantic resolver that maps a security scanner finding to the exact
 * 3-tier atomic requirement (req_id) from the 345-item OWASP ASVS 5.0.0 catalog.
 *
 * Addresses three systemic limitations of the upstream section_id mapping:
 *  1. Disaggregates coarse sections (e.g. V1.2 -> V1.2.1 XSS, V1.2.2 Open Redirect,
 *     V1.2.4 SQL/NoSQL Injection, V1.2.5 OS Command Injection; V3.4 -> V3.4.1 HSTS,
 *     V3.4.2 CORS, V3.4.3 CSP, V3.4.4 X-Content-Type-Options, V3.4.6 Frame-Ancestors,
 *     V3.4.8 COEP/COOP).
 *  2. Recovers Semgrep rules whose metadata.cwe array fell into the V15.3 fallback
 *     and Trivy package vulnerabilities whose "npm" type fell into the V13.1 fallback.
 *  3. Assigns the true ASVS 5.0.0 verification level (L1, L2, L3) defined per req_id
 *     in the official CSV rather than static section-level approximations.
 */
export function resolveFindingToReqIds(
  input: FindingClassificationInput,
  catalog: AsvsCatalog
): AsvsRequirementRecord[] {
  const tool = (input.tool || '').toLowerCase();
  const name = input.name || '';
  const fullName = input.fullName || '';
  const message = input.message || '';
  const titleText = `${name} ${fullName}`.toLowerCase();
  const combined = `${name} ${fullName} ${message}`.toLowerCase();
  const tags = (input.asvsTags || []).map((t) => t.trim()).filter(Boolean);

  const pick = (reqId: string): AsvsRequirementRecord[] => {
    const rec = catalog.byReqId.get(reqId);
    if (rec) return [rec];
    const secId = reqId.split('.').slice(0, 2).join('.');
    const chapId = reqId.split('.')[0];
    return [
      {
        chapterId: chapId,
        chapterName: input.suiteChapter?.replace(/^V\d+:\s*/i, '') || chapId,
        sectionId: secId,
        sectionName: secId,
        reqId,
        reqDescription: reqId,
        level: 'L1',
      },
    ];
  };

  // 0. If the tag is already an explicit 3-tier req_id (e.g. V1.2.4), honor it directly
  const explicitReqs = tags.filter((t) => /^V\d+\.\d+\.\d+$/i.test(t));
  if (explicitReqs.length > 0) {
    return explicitReqs.flatMap((r) => pick(r.toUpperCase()));
  }

  // 1. Browser Security Mechanism Headers & Frontend (Chapter V3) — checked first on title/rule name
  // so header descriptions mentioning "XSS" or "CORS" do not get misclassified
  if (/\b(cross-origin-embedder-policy|cross-origin-opener-policy|coep|coop)\b/i.test(titleText)) {
    return pick('V3.4.8');
  }
  if (/\b(content security policy|\bcsp\b)\b/i.test(titleText)) {
    return pick('V3.4.3');
  }
  if (/\b(strict-transport-security|hsts)\b/i.test(titleText)) {
    return pick('V3.4.1');
  }
  if (
    /\b(cross-domain misconfiguration|header_cors_star|generic_cors|express_cors|access-control-allow-origin|\bcors\b)\b/i.test(
      titleText
    )
  ) {
    return pick('V3.4.2');
  }
  if (/\b(helmet_header_nosniff|x-content-type-options|nosniff)\b/i.test(titleText)) {
    return pick('V3.4.4');
  }
  if (/\b(referrer-policy|referrer policy)\b/i.test(titleText)) {
    return pick('V3.4.5');
  }
  if (
    /\b(helmet_header_frame_guard|x-frame-options|frame-ancestors|clickjacking)\b/i.test(titleText)
  ) {
    return pick('V3.4.6');
  }
  if (/\b(modern web application)\b/i.test(titleText)) {
    return pick('V3.7.1');
  }

  // 2. Secret detection (Gitleaks, Trivy SECRET, Semgrep hardcoded secrets/JWT keys)
  if (
    tool === 'gitleaks' ||
    /\b(hardcoded[_-]secrets|node_password|node_username|hardcoded-jwt-secret|cwe-798|cwe-259|cwe-321|cwe-522)\b/i.test(
      combined
    ) ||
    tags.includes('V13.3')
  ) {
    return pick('V13.3.1');
  }

  // 3. Injection & Sanitization (Chapter V1)
  if (
    /\b(sequelize-injection|sql[_-]?injection|nosql[_-]?injection|nosql_find_injection|node_nosqli|cwe-89|cwe-943)\b/i.test(
      combined
    )
  ) {
    return pick('V1.2.4');
  }
  if (
    /\b(run-shell-injection|gha-curl-pipe-shell|command[_-]?injection|shell[_-]?injection|os[_-]?command|cwe-78|cwe-77)\b/i.test(
      combined
    )
  ) {
    return pick('V1.2.5');
  }
  if (/\b(express_xss|xss_node|cross-site scripting|\bxss\b|cwe-79)\b/i.test(combined)) {
    return pick('V1.2.1');
  }
  if (/\b(open-redirect|express-open-redirect|cwe-601)\b/i.test(combined)) {
    return pick('V1.2.2');
  }
  if (/\b(code-string-concat|dangerous js functions|\beval\b|cwe-94|cwe-95)\b/i.test(combined)) {
    return pick('V1.3.2');
  }
  if (/\b(ssrf|server-side request forgery|cwe-918)\b/i.test(combined)) {
    return pick('V1.3.6');
  }
  if (
    /\b(regular expression denial of service|redos|exponential backtracking|cwe-1333)\b/i.test(
      combined
    )
  ) {
    return pick('V1.3.12');
  }
  if (/\b(xxe|xml external entity|libxmljs2|cwe-611)\b/i.test(combined)) {
    return pick('V1.5.1');
  }
  if (/\b(deserialization|cwe-502)\b/i.test(combined) || tags.includes('V1.5')) {
    return pick('V1.5.2');
  }

  // 4. Validation & Business Logic (Chapter V2)
  if (/\b(logic_bypass|node_logic_bypass|business logic)\b/i.test(combined)) {
    return pick('V2.3.1');
  }
  if (
    tags.includes('V2.4') ||
    /\b(uncontrolled resource consumption|cwe-400|quadratic-time cpu denial of service|abortsignal)\b/i.test(
      combined
    )
  ) {
    return pick('V2.4.1');
  }

  // 5. Additional Cookie & Origin Separation checks (Chapter V3)
  if (/\b(cookie.*secure|__host-)\b/i.test(combined)) {
    return pick('V3.3.1');
  }
  if (/\b(samesite)\b/i.test(combined)) {
    return pick('V3.3.2');
  }
  if (/\b(httponly)\b/i.test(combined)) {
    return pick('V3.3.4');
  }
  if (tags.includes('V3.5') || /\b(csrf|cross-site request forgery|cwe-352)\b/i.test(combined)) {
    return pick('V3.5.1');
  }

  // 5. File Handling (Chapter V5)
  if (
    /\b(express-res-sendfile|path traversal|hardlink path traversal|cwe-22)\b/i.test(combined)
  ) {
    return pick('V5.3.2');
  }
  if (tags.includes('V5.2') || /\b(decompress|unrestricted file upload|cwe-434)\b/i.test(combined)) {
    return pick('V5.2.2');
  }

  // 6. Authentication & Authorization (Chapters V6, V8, V9)
  if (/\b(jsonwebtoken|jws\.verify|\bjwt\b.*bypass|algorithm.*isn't enforced)\b/i.test(combined)) {
    return pick('V9.1.1');
  }
  if (tags.includes('V6.2') || /\b(plaintext storage of password|cwe-256)\b/i.test(combined)) {
    return pick('V6.2.8');
  }
  if (tags.includes('V6.3') || /\b(excessive auth attempts|brute force|cwe-307)\b/i.test(combined)) {
    return pick('V6.3.1');
  }
  if (tags.includes('V6.4') || /\b(weak password recovery|cwe-640)\b/i.test(combined)) {
    return pick('V6.4.3');
  }
  if (tags.includes('V8.3') || /\b(\bidor\b|cwe-639)\b/i.test(combined)) {
    return pick('V8.3.1');
  }
  if (
    tags.includes('V8.2') ||
    /\b(improper authorization|cwe-284|cwe-285|cwe-863|cwe-732)\b/i.test(combined)
  ) {
    return pick('V8.2.1');
  }

  // 7. Cryptography & TLS (Chapters V11, V12)
  if (/\b(node_timing_attack|timing attack)\b/i.test(combined)) {
    return pick('V11.2.4');
  }
  if (/\b(pbkdf2)\b/i.test(combined)) {
    return pick('V11.4.2');
  }
  if (/\b(node_md5|\bmd5\b|\bsha1\b|weak hash)\b/i.test(combined)) {
    return pick('V11.4.1');
  }
  if (
    /\b(node_insecure_random_generator|pseudorandombytes|math\.random|weak random)\b/i.test(
      combined
    )
  ) {
    return pick('V11.5.1');
  }
  if (tags.includes('V11.3') || /\b(crypto-js|cwe-327|broken\/obsolete crypto)\b/i.test(combined)) {
    return pick('V11.3.1');
  }
  if (tags.includes('V11.2')) {
    return pick('V11.2.1');
  }
  if (/\b(insecure-load-balancer-tls-version|tls versions less than)\b/i.test(combined)) {
    return pick('V12.1.1');
  }
  if (
    tags.includes('V12.2') ||
    /\b(aws-0054|listener.*does not use https|cleartext transmission|cwe-319)\b/i.test(combined)
  ) {
    return pick('V12.2.1');
  }

  // 8. Configuration, Data Protection, Logging & Error Handling (Chapters V13, V14, V16)
  if (/\b(express-check-directory-listing|directory listing)\b/i.test(combined)) {
    return pick('V13.4.3');
  }
  if (
    /\b(helmet_header_x_powered_by|x-powered-by|deprecated feature policy|helmet_header_feature_policy)\b/i.test(
      combined
    )
  ) {
    return pick('V13.4.6');
  }
  if (/\b(non-storable content|cache-control)\b/i.test(combined)) {
    return pick('V14.3.2');
  }
  if (tags.includes('V14.2') || /\b(information exposure|cwe-200)\b/i.test(combined)) {
    return pick('V14.2.1');
  }
  if (/\b(aws-0017|aws-0178|log group is not encrypted|vpc flow logs)\b/i.test(combined)) {
    return pick('V16.4.2');
  }
  if (/\b(generic_error_disclosure|error_disclosure|stack traces may expose)\b/i.test(combined)) {
    return pick('V16.5.1');
  }
  if (/\b(aws-0164|aws-0104|aws-0053|aws-0052|aws-0124|subnet_has_public_ip|public ip address|unrestricted egress)\b/i.test(combined)) {
    return pick('V13.2.4');
  }

  // 9. Secure Coding, Architecture & Dependencies (Chapter V15)
  if (/\b(prototype pollution|cwe-1321)\b/i.test(combined)) {
    return pick('V15.3.6');
  }
  if (
    tool === 'npm-audit' ||
    tool === 'dependency-check' ||
    (tool === 'trivy' && /package-lock\.json|yarn\.lock|pnpm-lock|cargo\.lock|requirements\.txt|pom\.xml|go\.mod/i.test(fullName)) ||
    /\b(ds-0001|github-actions-mutable-action-tag|npm-missing-minimum-release-age)\b/i.test(combined) ||
    tags.includes('V15.2')
  ) {
    return pick('V15.2.1');
  }

  // 10. Section fallback -> canonical atomic req_id in that section
  for (const t of tags) {
    const cleanSec = t.toUpperCase();
    if (DEFAULT_REQ_BY_SECTION[cleanSec]) {
      return pick(DEFAULT_REQ_BY_SECTION[cleanSec]);
    }
    const secReqs = catalog.bySectionId.get(cleanSec);
    if (secReqs && secReqs.length > 0) {
      return [secReqs[0]];
    }
  }

  // Default tool fallbacks
  if (tool === 'zap') return pick('V3.4.3');
  if (tool === 'trivy') return pick('V13.1.1');
  return pick('V15.3.1');
}

export function resolveSectionOrReqId(
  controlId: string,
  catalog: AsvsCatalog
): AsvsRequirementRecord | null {
  const clean = String(controlId || '').trim().toUpperCase();
  if (!clean) return null;
  if (catalog.byReqId.has(clean)) {
    return catalog.byReqId.get(clean)!;
  }
  if (DEFAULT_REQ_BY_SECTION[clean] && catalog.byReqId.has(DEFAULT_REQ_BY_SECTION[clean])) {
    return catalog.byReqId.get(DEFAULT_REQ_BY_SECTION[clean])!;
  }
  const secReqs = catalog.bySectionId.get(clean);
  if (secReqs && secReqs.length > 0) {
    return secReqs[0];
  }
  const chapReqs = catalog.byChapterId.get(clean);
  if (chapReqs && chapReqs.length > 0) {
    return chapReqs[0];
  }
  return null;
}
