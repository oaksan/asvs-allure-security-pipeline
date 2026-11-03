/**
 * Native Allure Report 2 Plugin (asvs-pipeline-plugin)
 * Adds native sidebar tabs directly inside Allure Report:
 *  1. "Security Scan" (#security-scan) — 1:1 CLI runner for run_security_scans.sh
 *  2. "ASVS v5 Matrix" (#asvs-matrix) — displays asvs-summary.csv & severity-rollup.json
 */

import * as fs from 'fs';
import * as path from 'path';

export function getAllurePluginCss(): string {
  return `
.asvs-plugin-page {
  padding: 20px 28px;
  height: 100%;
  overflow-y: auto;
  background: #f5f7fa;
  color: #263238;
  font-family: Helvetica, Arial, sans-serif;
  box-sizing: border-box;
}
.asvs-plugin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 18px;
  padding-bottom: 12px;
  border-bottom: 1px solid #cfd8dc;
}
.asvs-plugin-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #263238;
}
.asvs-plugin-sub {
  font-size: 12px;
  color: #607d8b;
  margin-top: 3px;
}
.asvs-grid-2 {
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  gap: 18px;
}
@media (max-width: 1100px) {
  .asvs-grid-2 { grid-template-columns: 1fr; }
}
.asvs-card {
  background: #ffffff;
  border: 1px solid #e0e6ed;
  border-radius: 4px;
  padding: 16px 18px;
  margin-bottom: 16px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
}
.asvs-card h3 {
  margin: 0 0 12px 0;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: #455a64;
  border-bottom: 1px solid #eceff1;
  padding-bottom: 8px;
}
.asvs-form-row { margin-bottom: 11px; }
.asvs-form-row label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #455a64;
  margin-bottom: 4px;
}
.asvs-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.asvs-input, .asvs-select {
  width: 100%;
  padding: 6px 9px;
  border: 1px solid #cfd8dc;
  border-radius: 3px;
  font-size: 13px;
  color: #263238;
  background: #fff;
  box-sizing: border-box;
}
.asvs-tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(135px, 1fr));
  gap: 6px;
}
.asvs-tool-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
  border: 1px solid #cfd8dc;
  border-radius: 3px;
  background: #fafbfc;
  font-size: 12px;
  cursor: pointer;
}
.asvs-cmd-box {
  background: #263238;
  color: #80cbc4;
  padding: 10px 12px;
  border-radius: 3px;
  font-family: monospace;
  font-size: 12px;
  word-break: break-all;
  margin-bottom: 12px;
}
.asvs-btn-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}
.asvs-btn {
  padding: 7px 14px;
  border-radius: 3px;
  border: 1px solid #b0bec5;
  background: #eceff1;
  color: #263238;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.asvs-btn-primary {
  background: #1e88e5;
  border-color: #1976d2;
  color: #fff;
}
.asvs-btn-primary:hover { background: #1565c0; }
.asvs-btn-success {
  background: #43a047;
  border-color: #388e3c;
  color: #fff;
}
.asvs-btn-danger {
  background: #e53935;
  border-color: #c62828;
  color: #fff;
}
.asvs-terminal {
  background: #1c242b;
  color: #eceff1;
  padding: 12px;
  border-radius: 4px;
  height: 410px;
  overflow-y: auto;
  font-family: monospace;
  font-size: 12px;
  white-space: pre-wrap;
}
.asvs-kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}
.asvs-kpi {
  background: #fff;
  border: 1px solid #e0e6ed;
  border-left: 4px solid #90a4ae;
  border-radius: 4px;
  padding: 10px 14px;
}
.asvs-kpi.crit { border-left-color: #fd5a3e; }
.asvs-kpi.high { border-left-color: #ff9900; }
.asvs-kpi.med  { border-left-color: #ffd050; }
.asvs-kpi.low  { border-left-color: #97cc64; }
.asvs-kpi .lbl { font-size: 11px; text-transform: uppercase; color: #78909c; }
.asvs-kpi .val { font-size: 22px; font-weight: 700; margin-top: 2px; }
.asvs-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}
.asvs-table th, .asvs-table td {
  text-align: left;
  padding: 8px 10px;
  border-bottom: 1px solid #eceff1;
}
.asvs-table th {
  background: #f8fafc;
  color: #546e7a;
  text-transform: uppercase;
  font-size: 11px;
}
.asvs-badge {
  display: inline-block;
  padding: 2px 7px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
}
.asvs-badge-running { background: #e3f2fd; color: #1565c0; }
.asvs-badge-completed { background: #e8f5e9; color: #2e7d32; }
.asvs-badge-failed, .asvs-badge-canceled { background: #ffebee; color: #c62828; }
.asvs-hidden { display: none !important; }
`;
}

export function getAllurePluginJs(): string {
  return `(function () {
  'use strict';

  if (typeof window.allure === 'undefined' || !window.allure.api) {
    return;
  }

  allure.api.addTranslation('en', {
    tab: {
      securityScan: { name: 'Security Scan (CLI)' },
      asvsMatrix: { name: 'ASVS v5 Matrix' }
    }
  });

  allure.api.addTranslation('br', {
    tab: {
      securityScan: { name: 'Executar Scan (CLI)' },
      asvsMatrix: { name: 'Matriz ASVS v5' }
    }
  });

  var activeRunId = null;
  var pollTimer = null;

  var SecurityScanContentView = Backbone.Marionette.View.extend({
    className: 'asvs-plugin-page',
    template: function () {
      return [
        '<div class="asvs-plugin-header">',
        '  <div>',
        '    <h2>Security Scan Launcher (1:1 CLI inside Allure Report)</h2>',
        '    <div class="asvs-plugin-sub">Executes unmodified <code>security-tests/run_security_scans.sh</code> and updates this Allure Report</div>',
        '  </div>',
        '  <div class="asvs-btn-row">',
        '    <label style="font-size:12px;font-weight:600;color:#455a64">Active Allure Project:</label>',
        '    <select id="ap-active-project" class="asvs-select" style="width:240px"></select>',
        '    <button type="button" id="ap-btn-switch-proj" class="asvs-btn">Load in Allure</button>',
        '  </div>',
        '</div>',
        '<div class="asvs-grid-2">',
        '  <div>',
        '    <div class="asvs-card">',
        '      <h3>CLI Parameters (<code>run_security_scans.sh</code>)</h3>',
        '      <div class="asvs-form-row">',
        '        <label>Target Repository URL (<code>--repo-url</code>) *</label>',
        '        <input type="text" id="ap-repo-url" class="asvs-input" value="https://github.com/adeelahmad6834/asvs-allure-security-pipeline.git">',
        '        <div class="asvs-btn-row" style="margin-top:5px">',
        '          <button type="button" class="asvs-btn ap-preset" data-url="https://github.com/adeelahmad6834/asvs-allure-security-pipeline.git" style="padding:3px 7px;font-size:11px">Preset: Self Repo</button>',
        '          <button type="button" class="asvs-btn ap-preset" data-url="https://github.com/FlowiseAI/Flowise.git" style="padding:3px 7px;font-size:11px">Preset: Flowise</button>',
        '          <button type="button" class="asvs-btn ap-preset" data-url="https://github.com/juice-shop/juice-shop.git" style="padding:3px 7px;font-size:11px">Preset: Juice Shop</button>',
        '        </div>',
        '      </div>',
        '      <div class="asvs-form-grid">',
        '        <div class="asvs-form-row">',
        '          <label>Branch (<code>--branch</code>)</label>',
        '          <input type="text" id="ap-branch" class="asvs-input" placeholder="e.g. main">',
        '        </div>',
        '        <div class="asvs-form-row">',
        '          <label>Runner Script</label>',
        '          <select id="ap-use-timer" class="asvs-select">',
        '            <option value="false">Standard (run_security_scans.sh)</option>',
        '            <option value="true">Timed (run_security_scans.timer.sh)</option>',
        '          </select>',
        '        </div>',
        '      </div>',
        '      <div class="asvs-form-row">',
        '        <label>Tools (<code>--tools</code>) *</label>',
        '        <div class="asvs-tools-grid">',
        '          <label class="asvs-tool-chip"><input type="checkbox" class="ap-tool-cb" value="npm-audit" checked> npm-audit</label>',
        '          <label class="asvs-tool-chip"><input type="checkbox" class="ap-tool-cb" value="trivy-fs"> trivy-fs</label>',
        '          <label class="asvs-tool-chip"><input type="checkbox" class="ap-tool-cb" value="semgrep"> semgrep</label>',
        '          <label class="asvs-tool-chip"><input type="checkbox" class="ap-tool-cb" value="gitleaks"> gitleaks</label>',
        '          <label class="asvs-tool-chip"><input type="checkbox" class="ap-tool-cb" value="zap" id="ap-cb-zap"> zap (Web DAST)</label>',
        '          <label class="asvs-tool-chip"><input type="checkbox" class="ap-tool-cb" value="odc"> odc</label>',
        '          <label class="asvs-tool-chip"><input type="checkbox" class="ap-tool-cb" value="bandit"> bandit</label>',
        '          <label class="asvs-tool-chip"><input type="checkbox" class="ap-tool-cb" value="sonar"> sonar</label>',
        '        </div>',
        '      </div>',
        '      <div id="ap-zap-box" class="asvs-card asvs-hidden" style="background:#f8fafc;margin-top:8px">',
        '        <h3>Web Application DAST — OWASP ZAP (<code>--zap-*</code>)</h3>',
        '        <div class="asvs-form-grid">',
        '          <div class="asvs-form-row">',
        '            <label>ZAP Mode (<code>--zap-mode</code>)</label>',
        '            <select id="ap-zap-mode" class="asvs-select">',
        '              <option value="baseline">baseline (Passive)</option>',
        '              <option value="full">full (Active)</option>',
        '              <option value="openapi">openapi (API Spec)</option>',
        '              <option value="auth">auth (Authenticated)</option>',
        '            </select>',
        '          </div>',
        '          <div class="asvs-form-row" id="ap-row-target-url">',
        '            <label>Web App Target URL (<code>--target-url</code>) *</label>',
        '            <input type="text" id="ap-target-url" class="asvs-input" placeholder="http://172.17.0.1:3000 or https://...">',
        '          </div>',
        '          <div class="asvs-form-row asvs-hidden" id="ap-row-openapi">',
        '            <label>OpenAPI Spec (<code>--openapi</code>) *</label>',
        '            <input type="text" id="ap-openapi" class="asvs-input" placeholder="https://example.com/openapi.json">',
        '          </div>',
        '        </div>',
        '        <div id="ap-zap-auth-box" class="asvs-hidden">',
        '          <div class="asvs-form-grid">',
        '            <div class="asvs-form-row"><label>Login URL (<code>--zap-login-url</code>) *</label><input type="text" id="ap-zap-login" class="asvs-input"></div>',
        '            <div class="asvs-form-row"><label>Username (<code>--zap-auth-user</code>) *</label><input type="text" id="ap-zap-user" class="asvs-input"></div>',
        '            <div class="asvs-form-row"><label>Password (<code>--zap-auth-pass</code>) *</label><input type="password" id="ap-zap-pass" class="asvs-input"></div>',
        '            <div class="asvs-form-row"><label>User / Pass Fields</label>',
        '              <div style="display:flex;gap:4px">',
        '                <input type="text" id="ap-zap-ufield" class="asvs-input" placeholder="username">',
        '                <input type="text" id="ap-zap-pfield" class="asvs-input" placeholder="password">',
        '              </div>',
        '            </div>',
        '          </div>',
        '        </div>',
        '      </div>',
        '      <div class="asvs-form-row">',
        '        <label>Equivalent CLI Command Preview</label>',
        '        <div id="ap-cmd-preview" class="asvs-cmd-box">bash security-tests/run_security_scans.sh ...</div>',
        '      </div>',
        '      <div class="asvs-btn-row">',
        '        <button type="button" id="ap-btn-run" class="asvs-btn asvs-btn-primary">▶ Run Security Scan</button>',
        '        <button type="button" id="ap-btn-copy" class="asvs-btn">Copy CLI Command</button>',
        '        <button type="button" id="ap-btn-cancel" class="asvs-btn asvs-btn-danger asvs-hidden">⏹ Cancel Run</button>',
        '      </div>',
        '    </div>',
        '  </div>',
        '  <div>',
        '    <div class="asvs-card">',
        '      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">',
        '        <h3 style="margin:0;border:none;padding:0">Live Pipeline Console (<code>stdout</code> / <code>stderr</code>)</h3>',
        '        <span id="ap-run-badge" class="asvs-badge">Idle</span>',
        '      </div>',
        '      <div id="ap-terminal" class="asvs-terminal">Configure the CLI options on the left and click "▶ Run Security Scan"...</div>',
        '    </div>',
        '    <div class="asvs-card">',
        '      <h3>Session Execution History</h3>',
        '      <table class="asvs-table">',
        '        <thead><tr><th>ID</th><th>Repo</th><th>Status</th><th>Exit</th><th>Action</th></tr></thead>',
        '        <tbody id="ap-runs-tbody"><tr><td colspan="5">No scans triggered in this session yet.</td></tr></tbody>',
        '      </table>',
        '    </div>',
        '  </div>',
        '</div>'
      ].join('\\n');
    },

    onRender: function () {
      var self = this;
      this.$('.ap-preset').on('click', function (e) {
        self.$('#ap-repo-url').val(e.currentTarget.getAttribute('data-url'));
        self.updatePreview();
      });
      this.$('input, select').on('input change', function () {
        self.syncZapVisibility();
        self.updatePreview();
      });
      this.$('#ap-btn-copy').on('click', function () {
        var txt = self.$('#ap-cmd-preview').text();
        if (navigator.clipboard) navigator.clipboard.writeText(txt);
      });
      this.$('#ap-btn-run').on('click', function () {
        self.startScan();
      });
      this.$('#ap-btn-cancel').on('click', function () {
        self.cancelScan();
      });
      this.$('#ap-btn-switch-proj').on('click', function () {
        var proj = self.$('#ap-active-project').val();
        if (proj) self.switchAllureProject(proj);
      });

      this.syncZapVisibility();
      this.updatePreview();
      this.loadProjectsList();
      this.loadRunsList();
      if (activeRunId) {
        this.pollRun();
      }
    },

    onDestroy: function () {
      if (pollTimer) {
        clearTimeout(pollTimer);
        pollTimer = null;
      }
    },

    syncZapVisibility: function () {
      var zapChecked = this.$('#ap-cb-zap').is(':checked');
      this.$('#ap-zap-box').toggleClass('asvs-hidden', !zapChecked);
      var mode = this.$('#ap-zap-mode').val();
      this.$('#ap-row-openapi').toggleClass('asvs-hidden', mode !== 'openapi');
      this.$('#ap-row-target-url').toggleClass('asvs-hidden', mode === 'openapi');
      this.$('#ap-zap-auth-box').toggleClass('asvs-hidden', mode !== 'auth');
    },

    collectPayload: function () {
      var tools = [];
      this.$('.ap-tool-cb:checked').each(function () {
        tools.push(this.value);
      });
      return {
        repoUrl: (this.$('#ap-repo-url').val() || '').trim(),
        branch: (this.$('#ap-branch').val() || '').trim(),
        useTimer: this.$('#ap-use-timer').val() === 'true',
        tools: tools,
        zapMode: this.$('#ap-zap-mode').val(),
        targetUrl: (this.$('#ap-target-url').val() || '').trim(),
        openapiSpec: (this.$('#ap-openapi').val() || '').trim(),
        zapLoginUrl: (this.$('#ap-zap-login').val() || '').trim(),
        zapAuthUser: (this.$('#ap-zap-user').val() || '').trim(),
        zapAuthPass: this.$('#ap-zap-pass').val() || '',
        zapUserField: (this.$('#ap-zap-ufield').val() || '').trim(),
        zapPassField: (this.$('#ap-zap-pfield').val() || '').trim()
      };
    },

    updatePreview: function () {
      var self = this;
      fetch('/api/preview-cmd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.collectPayload())
      })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
        .then(function (res) {
          var box = self.$('#ap-cmd-preview');
          if (res.ok && res.d.displayCommand) {
            box.css('color', '#80cbc4').text(res.d.displayCommand);
          } else {
            box.css('color', '#ff8a80').text('⚠️ ' + (res.d.error || 'Invalid CLI parameters'));
          }
        })
        .catch(function () {});
    },

    loadProjectsList: function () {
      var self = this;
      fetch('/api/projects')
        .then(function (r) { return r.json(); })
        .then(function (data) {
          var projs = data.projects || [];
          var active = data.activeProject || '';
          var html = projs.map(function (p) {
            var sel = p.repoName === active ? ' selected' : '';
            return '<option value="' + p.repoName + '"' + sel + '>' + p.repoName + '</option>';
          }).join('');
          self.$('#ap-active-project').html(html);
        })
        .catch(function () {});
    },

    switchAllureProject: function (repoName) {
      fetch('/api/active-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoName: repoName })
      }).then(function () {
        window.location.href = '/#';
        window.location.reload();
      });
    },

    startScan: function () {
      var self = this;
      fetch('/api/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.collectPayload())
      })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
        .then(function (res) {
          if (!res.ok) {
            alert(res.d.error || 'Failed to start scan');
            return;
          }
          activeRunId = res.d.run.id;
          self.pollRun();
          self.loadRunsList();
        });
    },

    cancelScan: function () {
      var self = this;
      if (!activeRunId) return;
      fetch('/api/runs/' + encodeURIComponent(activeRunId) + '/cancel', { method: 'POST' })
        .then(function () { self.pollRun(); });
    },

    pollRun: function () {
      var self = this;
      if (pollTimer) clearTimeout(pollTimer);
      if (!activeRunId) return;

      fetch('/api/runs/' + encodeURIComponent(activeRunId))
        .then(function (r) { return r.json(); })
        .then(function (run) {
          var term = self.$('#ap-terminal');
          if (term.length) {
            term.text((run.logs || []).join('\\n'));
            term[0].scrollTop = term[0].scrollHeight;
          }
          var badge = self.$('#ap-run-badge');
          badge.attr('class', 'asvs-badge asvs-badge-' + run.status);
          badge.text(run.status.toUpperCase() + (run.exitCode !== null ? ' (exit=' + run.exitCode + ')' : ''));
          self.$('#ap-btn-cancel').toggleClass('asvs-hidden', run.status !== 'running');
          self.loadRunsList();
          if (run.status === 'running') {
            pollTimer = setTimeout(function () { self.pollRun(); }, 1000);
          } else {
            self.loadProjectsList();
          }
        })
        .catch(function () {});
    },

    loadRunsList: function () {
      var self = this;
      fetch('/api/runs')
        .then(function (r) { return r.json(); })
        .then(function (data) {
          var runs = data.runs || [];
          if (!runs.length) return;
          var rows = runs.map(function (r) {
            return [
              '<tr>',
              '  <td><code>' + r.id + '</code></td>',
              '  <td><strong>' + r.repoName + '</strong></td>',
              '  <td><span class="asvs-badge asvs-badge-' + r.status + '">' + r.status + '</span></td>',
              '  <td>' + (r.exitCode !== null ? r.exitCode : '-') + '</td>',
              '  <td>',
              '    <button type="button" class="asvs-btn ap-view-log" data-id="' + r.id + '" style="padding:2px 6px;font-size:11px">Log</button> ',
              '    <button type="button" class="asvs-btn asvs-btn-success ap-load-allure" data-repo="' + r.repoName + '" style="padding:2px 6px;font-size:11px">Load in Allure</button>',
              '  </td>',
              '</tr>'
            ].join('');
          }).join('');
          self.$('#ap-runs-tbody').html(rows);
          self.$('.ap-view-log').on('click', function (e) {
            activeRunId = e.currentTarget.getAttribute('data-id');
            self.pollRun();
          });
          self.$('.ap-load-allure').on('click', function (e) {
            self.switchAllureProject(e.currentTarget.getAttribute('data-repo'));
          });
        })
        .catch(function () {});
    }
  });

  var AsvsMatrixContentView = Backbone.Marionette.View.extend({
    className: 'asvs-plugin-page',
    template: function () {
      return [
        '<div class="asvs-plugin-header">',
        '  <div>',
        '    <h2>OWASP ASVS v5 Matrix &amp; Severity Rollup (Upstream Artifacts)</h2>',
        '    <div class="asvs-plugin-sub">Direct view of <code>allure-results/&lt;repo&gt;/asvs-summary.csv</code> and <code>severity-rollup.json</code> generated by <code>asvs-unified-to-allure.ts</code></div>',
        '  </div>',
        '  <div class="asvs-btn-row">',
        '    <label style="font-size:12px;font-weight:600;color:#455a64">Project:</label>',
        '    <select id="am-project-select" class="asvs-select" style="width:240px"></select>',
        '  </div>',
        '</div>',
        '<div id="am-kpis" class="asvs-kpis"></div>',
        '<div class="asvs-grid-2">',
        '  <div class="asvs-card">',
        '    <h3>OWASP ASVS v5 Controls Mapped (<code>asvs-summary.csv</code>)</h3>',
        '    <table class="asvs-table">',
        '      <thead><tr><th>ASVS ID</th><th>Chapter</th><th>Levels</th><th>Title</th><th>Findings</th></tr></thead>',
        '      <tbody id="am-asvs-tbody"><tr><td colspan="5">Loading...</td></tr></tbody>',
        '    </table>',
        '  </div>',
        '  <div class="asvs-card">',
        '    <h3>Findings by Scanner Tool (<code>severity-rollup.json</code>)</h3>',
        '    <table class="asvs-table">',
        '      <thead><tr><th>Tool</th><th>Critical</th><th>High</th><th>Medium</th><th>Low</th><th>Unknown</th><th>Total</th></tr></thead>',
        '      <tbody id="am-tools-tbody"><tr><td colspan="7">Loading...</td></tr></tbody>',
        '    </table>',
        '  </div>',
        '</div>'
      ].join('\\n');
    },

    onRender: function () {
      var self = this;
      this.$('#am-project-select').on('change', function (e) {
        self.loadArtifacts(e.currentTarget.value);
      });
      fetch('/api/projects')
        .then(function (r) { return r.json(); })
        .then(function (data) {
          var projs = data.projects || [];
          var active = data.activeProject || (projs[0] && projs[0].repoName) || '';
          var html = projs.map(function (p) {
            var sel = p.repoName === active ? ' selected' : '';
            return '<option value="' + p.repoName + '"' + sel + '>' + p.repoName + '</option>';
          }).join('');
          self.$('#am-project-select').html(html);
          if (active) self.loadArtifacts(active);
        })
        .catch(function () {});
    },

    loadArtifacts: function (repoName) {
      var self = this;
      fetch('/api/projects/' + encodeURIComponent(repoName))
        .then(function (r) { return r.json(); })
        .then(function (d) {
          var t = (d.rollup && d.rollup.totals) || { critical: 0, high: 0, medium: 0, low: 0, unknown: 0, grandTotal: 0 };
          self.$('#am-kpis').html([
            '<div class="asvs-kpi crit"><div class="lbl">Critical</div><div class="val">' + t.critical + '</div></div>',
            '<div class="asvs-kpi high"><div class="lbl">High</div><div class="val">' + t.high + '</div></div>',
            '<div class="asvs-kpi med"><div class="lbl">Medium</div><div class="val">' + t.medium + '</div></div>',
            '<div class="asvs-kpi low"><div class="lbl">Low</div><div class="val">' + t.low + '</div></div>',
            '<div class="asvs-kpi"><div class="lbl">Grand Total</div><div class="val">' + t.grandTotal + '</div></div>'
          ].join(''));

          var rows = d.asvsSummary || [];
          self.$('#am-asvs-tbody').html(rows.length ? rows.map(function (r) {
            return '<tr><td><strong><code>' + r.asvsId + '</code></strong></td><td>' + r.chapter + '</td><td><code>' + r.levels + '</code></td><td>' + r.title + '</td><td><strong>' + r.count + '</strong></td></tr>';
          }).join('') : '<tr><td colspan="5">No mapped ASVS entries in asvs-summary.csv</td></tr>');

          var byTool = (d.rollup && d.rollup.byTool) || {};
          var keys = Object.keys(byTool);
          self.$('#am-tools-tbody').html(keys.length ? keys.map(function (k) {
            var c = byTool[k];
            return '<tr><td><strong>' + k + '</strong></td><td>' + (c.critical || 0) + '</td><td>' + (c.high || 0) + '</td><td>' + (c.medium || 0) + '</td><td>' + (c.low || 0) + '</td><td>' + (c.unknown || 0) + '</td><td><strong>' + (c.total || 0) + '</strong></td></tr>';
          }).join('') : '<tr><td colspan="7">No tool rollup data available</td></tr>');
        })
        .catch(function () {});
    }
  });

  var SecurityScanLayout = allure.components.AppLayout.extend({
    getContentView: function () {
      return new SecurityScanContentView();
    }
  });

  var AsvsMatrixLayout = allure.components.AppLayout.extend({
    getContentView: function () {
      return new AsvsMatrixContentView();
    }
  });

  allure.api.addTab('security-scan', {
    title: 'tab.securityScan.name',
    icon: 'fa fa-shield',
    route: 'security-scan(/)',
    onEnter: function () {
      return new SecurityScanLayout();
    }
  });

  allure.api.addTab('asvs-matrix', {
    title: 'tab.asvsMatrix.name',
    icon: 'fa fa-list-alt',
    route: 'asvs-matrix(/)',
    onEnter: function () {
      return new AsvsMatrixLayout();
    }
  });
})();
`;
}

export function installAllureCliPlugin(workspaceDir: string): void {
  // 1. Install into local Allure CLI distribution if present
  const allureDistDir = path.join(workspaceDir, 'security-reports', '_bin', 'allure-2.29.0');
  if (fs.existsSync(allureDistDir)) {
    const pluginDir = path.join(allureDistDir, 'plugins', 'asvs-pipeline-plugin');
    const staticDir = path.join(pluginDir, 'static');
    fs.mkdirSync(staticDir, { recursive: true });
    fs.writeFileSync(
      path.join(pluginDir, 'allure-plugin.yml'),
      [
        'id: asvs-pipeline',
        'name: ASVS Security Pipeline CLI & Matrix Plugin',
        'description: Native Allure tabs for running security-tests/run_security_scans.sh and viewing ASVS v5 Matrix',
        'jsFiles:',
        '  - index.js',
        'cssFiles:',
        '  - styles.css',
        '',
      ].join('\n'),
      'utf8'
    );
    fs.writeFileSync(path.join(staticDir, 'index.js'), getAllurePluginJs(), 'utf8');
    fs.writeFileSync(path.join(staticDir, 'styles.css'), getAllurePluginCss(), 'utf8');

    const allureYmlPath = path.join(allureDistDir, 'config', 'allure.yml');
    if (fs.existsSync(allureYmlPath)) {
      const yml = fs.readFileSync(allureYmlPath, 'utf8');
      if (!yml.includes('asvs-pipeline-plugin')) {
        fs.writeFileSync(
          allureYmlPath,
          yml.trimEnd() + '\n  - asvs-pipeline-plugin\n',
          'utf8'
        );
      }
    }
  }

  // 2. Also inject into any existing ./allure-report/<repo> directories
  const reportsRoot = path.join(workspaceDir, 'allure-report');
  if (fs.existsSync(reportsRoot)) {
    for (const entry of fs.readdirSync(reportsRoot)) {
      const repDir = path.join(reportsRoot, entry);
      const indexHtmlPath = path.join(repDir, 'index.html');
      if (fs.statSync(repDir).isDirectory() && fs.existsSync(indexHtmlPath)) {
        const plugOut = path.join(repDir, 'plugin', 'asvs-pipeline');
        fs.mkdirSync(plugOut, { recursive: true });
        fs.writeFileSync(path.join(plugOut, 'index.js'), getAllurePluginJs(), 'utf8');
        fs.writeFileSync(path.join(plugOut, 'styles.css'), getAllurePluginCss(), 'utf8');

        let html = fs.readFileSync(indexHtmlPath, 'utf8');
        if (!html.includes('plugin/asvs-pipeline/styles.css')) {
          html = html.replace(
            '</head>',
            '    <link rel="stylesheet" type="text/css" href="plugin/asvs-pipeline/styles.css">\n</head>'
          );
        }
        if (!html.includes('plugin/asvs-pipeline/index.js')) {
          html = html.replace(
            '<script src="plugin/screen-diff/index.js"></script>',
            '<script src="plugin/screen-diff/index.js"></script>\n    <script src="plugin/asvs-pipeline/index.js"></script>'
          );
        }
        fs.writeFileSync(indexHtmlPath, html, 'utf8');
      }
    }
  }
}

