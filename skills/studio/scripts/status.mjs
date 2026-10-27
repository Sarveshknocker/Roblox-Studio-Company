#!/usr/bin/env node
// Roblox Studio Company — the Studio Manager's report: aggregates every department's status.json into
// studio/00-owner/STATUS.md, so what the manager tells the owner is exactly what the departments recorded.
//
//   node status.mjs [project] [--stale-days 7] [--json]
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { DEPARTMENTS } from './scaffold.mjs';

const LISTS = ['done', 'doing', 'next', 'blocked', 'decisionsNeeded', 'risks'];
const SEV = ['high', 'medium', 'low'];

export function readStatus(root) {
  const problems = []; const depts = [];
  for (const d of DEPARTMENTS) {
    const file = path.join(root, 'studio', d.dir, 'status.json');
    if (!fs.existsSync(file)) { problems.push(`${d.dir}: status.json missing`); continue; }
    let s;
    try { s = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { problems.push(`${d.dir}/status.json: invalid JSON (${e.message})`); continue; }
    for (const k of LISTS) if (s[k] !== undefined && !Array.isArray(s[k])) { problems.push(`${d.dir}/status.json: "${k}" must be a list`); s[k] = []; }
    for (const [i, x] of (s.done ?? []).entries()) if (typeof x === 'object' && !x.evidence) problems.push(`${d.dir}: done[${i}] "${x.what ?? ''}" has no evidence (file, test or playtest note)`);
    for (const [i, x] of (s.decisionsNeeded ?? []).entries()) if (typeof x !== 'object' || !x.question || !x.recommendation) problems.push(`${d.dir}: decisionsNeeded[${i}] needs question, options and recommendation`);
    depts.push({ ...d, status: s });
  }
  let phase = null;
  try { phase = JSON.parse(fs.readFileSync(path.join(root, 'studio', '00-owner', 'phase.json'), 'utf8')); } catch {}
  return { depts, problems, phase };
}

const text = (x) => (typeof x === 'string' ? x : [x.what ?? x.question ?? x.risk ?? JSON.stringify(x), x.evidence ? `— evidence: ${x.evidence}` : '', x.waitingOn ? `— waiting on ${x.waitingOn}` : ''].filter(Boolean).join(' '));

export function report(root, { staleDays = 7, now = new Date() } = {}) {
  const { depts, problems, phase } = readStatus(root);
  const stale = depts.filter((d) => d.status.updated && (now - new Date(d.status.updated)) / 864e5 > staleDays && (d.status.doing ?? []).length).map((d) => `${d.name} (last update ${d.status.updated})`);
  const decisions = depts.flatMap((d) => (d.status.decisionsNeeded ?? []).filter((x) => typeof x === 'object').map((x) => ({ dept: d.name, ...x })));
  const risks = depts.flatMap((d) => (d.status.risks ?? []).map((x) => ({ dept: d.name, ...(typeof x === 'string' ? { risk: x, severity: 'medium' } : x) })))
    .sort((a, b) => SEV.indexOf(a.severity ?? 'medium') - SEV.indexOf(b.severity ?? 'medium'));
  const blocked = depts.flatMap((d) => (d.status.blocked ?? []).map((x) => ({ dept: d.name, item: text(x) })));
  return { generatedAt: now.toISOString(), phase, depts, decisions, risks, blocked, stale, problems };
}

export function toMarkdown(r) {
  const list = (items) => (items.length ? items.map((x) => `- ${text(x)}`).join('\n') : '- —');
  return `# Studio status

_Generated ${r.generatedAt.slice(0, 16).replace('T', ' ')} from every department's status.json. Phase: **${r.phase?.phase ?? 'not set'}**${r.phase?.nextGate ? ` · next gate: **${r.phase.nextGate}**` : ''}._

## Decisions needed from the owner (${r.decisions.length})
${r.decisions.length ? r.decisions.map((d, i) => `${i + 1}. **${d.question}** (${d.dept})${d.options ? `\n   Options: ${d.options.join(' · ')}` : ''}\n   Recommendation: ${d.recommendation}${d.blocking ? `\n   Blocking: ${d.blocking}` : ''}`).join('\n') : 'None right now.'}

## Risks
${r.risks.length ? `| Severity | Risk | Department | Mitigation |\n|---|---|---|---|\n${r.risks.map((x) => `| ${x.severity ?? 'medium'} | ${x.risk} | ${x.dept} | ${x.mitigation ?? '—'} |`).join('\n')}` : 'None recorded.'}

## Blocked
${r.blocked.length ? r.blocked.map((b) => `- ${b.dept}: ${b.item}`).join('\n') : '- nothing blocked'}

## Departments
${r.depts.map((d) => `### ${d.name} (${d.status.lead ?? d.lead}) — updated ${d.status.updated ?? 'never'}
**Done:**
${list(d.status.done ?? [])}
**Doing:**
${list(d.status.doing ?? [])}
**Next:**
${list(d.status.next ?? [])}`).join('\n\n')}
${r.stale.length ? `\n## Stale\nThese departments have work in progress but no update for over a week: ${r.stale.join(', ')}.\n` : ''}${r.problems.length ? `\n## Report problems (fix before reporting to the owner)\n${r.problems.map((p) => `- ${p}`).join('\n')}\n` : ''}`;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const args = process.argv.slice(2);
  const opt = (n, d) => { const i = args.indexOf(`--${n}`); if (i < 0) return d; const v = args[i + 1]; args.splice(i, 2); return v; };
  const staleDays = Number(opt('stale-days', 7)); const json = args.includes('--json');
  const root = path.resolve(args.find((a) => !a.startsWith('--')) ?? '.');
  if (!fs.existsSync(path.join(root, 'studio'))) { console.error('No studio/ folder here: run `studio.mjs new` first.'); process.exit(2); }
  const r = report(root, { staleDays });
  fs.writeFileSync(path.join(root, 'studio', '00-owner', 'STATUS.md'), toMarkdown(r));
  if (json) console.log(JSON.stringify(r, null, 2));
  else {
    console.log(`Phase: ${r.phase?.phase ?? 'not set'} · decisions needed: ${r.decisions.length} · risks: ${r.risks.length} · blocked: ${r.blocked.length}${r.stale.length ? ` · stale: ${r.stale.length}` : ''}`);
    for (const p of r.problems) console.log(`⚠ ${p}`);
    console.log('→ studio/00-owner/STATUS.md');
  }
  process.exit(r.problems.length ? 1 : 0);
}
