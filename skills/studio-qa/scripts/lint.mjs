#!/usr/bin/env node
// Roblox Studio Company — Roblox/Luau security & performance linter (zero dependencies).
//
//   node lint.mjs [game dir] [--out studio/07-qa] [--fail-on high] [--json]
//
// Complements Selene (general Luau lint) with Roblox-specific risks: free-model backdoors, client-trusted remotes,
// unsafe DataStore use, scheduler and performance mistakes, and paid-random-item compliance.
// Suppress a reviewed finding with a comment on the line or the line above:  -- studio-ignore: <rule-id> <reason>
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { RULES, SEVERITIES, scopeOf } from './rules.mjs';

const SKIP = new Set(['node_modules', '.git', 'Packages', 'ServerPackages', 'DevPackages', 'Vendor', '.studio-cache']);
const SOURCE = /\.(lua|luau)$|\.project\.json$/;

function walk(dir, root, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name) || e.isSymbolicLink()) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, root, acc); else if (SOURCE.test(e.name)) acc.push(path.relative(root, full).split(path.sep).join('/'));
  }
  return acc;
}

const lineOf = (text, idx) => text.slice(0, idx).split('\n').length;
// The block a match opens: the rest of its line plus every following line indented deeper (blank lines included).
function blockAt(text, idx) {
  const lines = text.split('\n'); const line = lineOf(text, idx);
  const indent = (s) => s.match(/^[ \t]*/)[0].replace(/\t/g, '    ').length;
  const eol = text.indexOf('\n', idx);
  const base = indent(lines[line - 1]); const body = [text.slice(idx, eol < 0 ? undefined : eol)];
  for (let i = line; i < lines.length && (!lines[i].trim() || indent(lines[i]) > base); i++) body.push(lines[i]);
  return body.join('\n');
}
function suppressed(lines, line, rule) {
  const window = [lines[line - 1] ?? '', lines[line - 2] ?? ''].join('\n');
  return new RegExp(`studio-ignore:?\\s*(${rule.replace(/\./g, '\\.')}|all)\\b`).test(window);
}
// Comments and strings must not trigger code rules (except rules that look for secrets inside strings).
function stripComments(text) {
  return text.replace(/--\[(=*)\[[\s\S]*?\]\1\]/g, (m) => m.replace(/[^\n]/g, ' ')).replace(/--[^\n]*/g, (m) => (/studio-ignore/.test(m) ? m : ' '.repeat(m.length)));
}

export function lintText(file, text) {
  const findings = [];
  const scope = scopeOf(file);
  const lines = text.split('\n');
  const code = file.endsWith('.json') ? text : stripComments(text);
  for (const r of RULES) {
    if (r.files ? !r.files.test(file) : file.endsWith('.json')) continue;
    if (r.scope && r.scope !== 'any' && r.scope !== scope) continue;
    if (r.requires && !r.requires.test(code)) continue;
    if (r.requiresNot && r.requiresNot.test(code)) continue;
    const src = r.id === 'rbx.webhook-secret' || r.id === 'rbx.obfuscated-string' ? text : code;
    r.re.lastIndex = 0;
    let m; let n = 0;
    while ((m = r.re.exec(src)) && n < 20) {
      if (!m[0]) { r.re.lastIndex++; continue; }
      if (r.blockNot && r.blockNot.test(blockAt(src, m.index))) continue;
      n++;
      const line = lineOf(src, m.index + (m[0].length - m[0].trimStart().length));
      if (!suppressed(lines, line, r.id)) findings.push({ rule: r.id, severity: r.severity, title: r.title, file, line, scope, snippet: (lines[line - 1] ?? '').trim().slice(0, 160), why: r.why, fix: r.fix });
      if (r.fileLevel) break;
    }
  }
  return findings;
}

export function lint(root) {
  const files = walk(root, root);
  const findings = files.flatMap((f) => lintText(f, fs.readFileSync(path.join(root, f), 'utf8')));
  findings.sort((a, b) => SEVERITIES.indexOf(a.severity) - SEVERITIES.indexOf(b.severity) || a.file.localeCompare(b.file) || a.line - b.line);
  const counts = Object.fromEntries(SEVERITIES.map((s) => [s, findings.filter((f) => f.severity === s).length]));
  return { root, files: files.length, counts, findings };
}

export function toMarkdown(r) {
  return `# Roblox lint report

_${r.files} files · critical ${r.counts.critical} · high ${r.counts.high} · medium ${r.counts.medium} · low ${r.counts.low}_

${r.findings.length ? `| Severity | Rule | Where | Problem | Fix |\n|---|---|---|---|---|\n${r.findings.map((f) => `| ${f.severity} | \`${f.rule}\` | \`${f.file}:${f.line}\` | ${f.title}: ${f.why} | ${f.fix} |`).join('\n')}` : 'No findings.'}

Run Selene and the unit tests as well; this linter covers Roblox-specific risks only. Reviewed exceptions:
\`-- studio-ignore: <rule-id> <reason>\` on or above the line.
`;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const args = process.argv.slice(2);
  const opt = (n, d) => { const i = args.indexOf(`--${n}`); if (i < 0) return d; const v = args[i + 1]; args.splice(i, 2); return v; };
  const out = opt('out', null); const failOn = opt('fail-on', 'high'); const json = args.includes('--json');
  const root = path.resolve(args.find((a) => !a.startsWith('--')) ?? 'game');
  if (!fs.existsSync(root)) { console.error(`No such folder: ${root}`); process.exit(2); }
  const r = lint(root);
  if (out) { fs.mkdirSync(out, { recursive: true }); fs.writeFileSync(path.join(out, 'LINT_REPORT.md'), toMarkdown(r)); }
  if (json) console.log(JSON.stringify(r, null, 2));
  else {
    console.log(`Roblox lint: ${r.files} files · critical ${r.counts.critical} · high ${r.counts.high} · medium ${r.counts.medium} · low ${r.counts.low}`);
    for (const f of r.findings.slice(0, 60)) console.log(`${f.severity.padEnd(8)} ${f.rule.padEnd(32)} ${f.file}:${f.line}  ${f.title}`);
  }
  const t = SEVERITIES.indexOf(failOn);
  process.exit(failOn !== 'none' && r.findings.some((f) => SEVERITIES.indexOf(f.severity) <= t) ? 1 : 0);
}
