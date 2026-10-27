#!/usr/bin/env node
// Roblox Studio Company — sets up a project: department folders, the Rojo game project, CI, and pinned dependencies.
//
//   node scaffold.mjs new    [project] [--name "My Game"]   studio/ + game/ + .github/workflows/roblox-ci.yml (never overwrites)
//   node scaffold.mjs deps   [game dir]                     ProfileStore at a pinned commit, SHA-256 verified, with its LICENSE
//   node scaffold.mjs config [project]                      studio/02-design/economy.json → game/src/shared/Config/Economy.luau
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const TEMPLATE = path.join(KIT, 'skills', 'studio-engineering', 'templates', 'game');

export const DEPARTMENTS = [
  { dir: '00-owner', name: 'Studio Manager', lead: 'studio-manager', files: {
    'phase.json': JSON.stringify({ phase: 'Kickoff', nextGate: 'G0' }, null, 2) + '\n',
    'KICKOFF.md': '# Kickoff (G0)\n\nOwner answers to the kickoff interview, recorded verbatim, and the three concepts presented.\n',
    'DECISIONS.md': '# Decisions\n\n| Date | Decision | Options considered | Decided by | Why |\n|---|---|---|---|---|\n',
    'ROADMAP.md': '# Roadmap\n\n| Phase | Exit criteria | Gate | Status |\n|---|---|---|---|\n| Concept | Concept chosen, GDD one-pager, market scan, risks | G1 | todo |\n| Pre-production | Fun greybox, simulated economy, vertical slice, tests | G2 | todo |\n| Production | All features built through the pipeline | — | todo |\n| Alpha → Beta | Feature complete, then content complete and bug-fixed | — | todo |\n| Launch | Launch checklist done | G3 | todo |\n| Live-Ops | Weekly reviews | Live review | todo |\n' } },
  { dir: '01-production', name: 'Production', lead: 'producer', files: {
    'BOARD.md': '# Board\n\n| ID | Ticket | Dept | Owner | Status | Depends on | Acceptance criteria |\n|----|--------|------|-------|--------|------------|---------------------|\n',
    'RISKS.md': '# Risks\n\n| Risk | Likelihood | Impact | Owner | Mitigation | Trigger to act |\n|---|---|---|---|---|---|\n',
    'IDEAS_PARKING.md': '# Ideas parking lot\n\nNew ideas wait here until the Studio Manager schedules them.\n' } },
  { dir: '02-design', name: 'Game Design', lead: 'game-designer', files: { 'GDD.md': '# GDD\n\nStart from skills/studio-design/references/gdd-template.md.\n', 'LEVELS.md': '# Levels\n', 'UX.md': '# UX and HUD\n', 'NARRATIVE.md': '# Narrative\n' } },
  { dir: '03-engineering', name: 'Engineering', lead: 'lead-engineer', files: { 'ARCHITECTURE.md': '# Architecture\n\nModules, interfaces, data model, remotes, libraries (with licences).\n' } },
  { dir: '04-art', name: 'Art', lead: 'art-director', files: { 'ART_BIBLE.md': '# Art bible\n', 'ASSETS.md': '# Asset register\n\n| Asset | Type | Source / author | Licence | File | Uploaded asset id | Status |\n|---|---|---|---|---|---|---|\n' } },
  { dir: '05-tech-art', name: 'Technical Art', lead: 'technical-artist', files: { 'BUDGETS.md': '# Budgets\n\nCopy the defaults from skills/studio-techart/SKILL.md and adjust for this game.\n', 'PERF_REPORT.md': '# Performance report\n' } },
  { dir: '06-audio', name: 'Audio', lead: 'audio-director', files: { 'AUDIO_PLAN.md': '# Audio plan\n', 'CUE_SHEET.md': '# Cue sheet\n\n| Cue | Trigger | Sound | Source / licence | Volume group | Status |\n|---|---|---|---|---|---|\n' } },
  { dir: '07-qa', name: 'QA', lead: 'qa-lead', files: { 'TEST_PLAN.md': '# Test plan\n', 'BUGS.md': '# Bugs\n\n| ID | Severity | Steps to reproduce | Expected | Actual | Build | Status |\n|---|---|---|---|---|---|---|\n' } },
  { dir: '08-liveops', name: 'Live-Ops', lead: 'liveops-lead', files: { 'ANALYTICS_PLAN.md': '# Analytics plan\n', 'LIVE_CALENDAR.md': '# Live calendar\n' } },
  { dir: '09-publishing', name: 'Publishing', lead: 'publishing-lead', files: { 'STORE_PAGE.md': '# Store page\n', 'LAUNCH_CHECKLIST.md': '# Launch checklist\n\nCopy from skills/studio-publishing/references/launch-checklist.md.\n', 'LOCALIZATION.md': '# Localization\n' } },
  { dir: '10-research', name: 'Research', lead: 'research-lead', files: { 'MARKET.md': '# Market scan\n' } },
];

export const emptyStatus = (d) => ({ department: d.name, lead: d.lead, updated: new Date().toISOString().slice(0, 10), done: [], doing: [], next: [], blocked: [], decisionsNeeded: [], risks: [] });

function copyTree(src, dst, written) {
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name); const d = path.join(dst, e.name);
    if (e.isDirectory()) { fs.mkdirSync(d, { recursive: true }); copyTree(s, d, written); }
    else if (!fs.existsSync(d)) { fs.copyFileSync(s, d); written.push(d); }
  }
}

export function scaffold(project, { name = path.basename(path.resolve(project)) } = {}) {
  const root = path.resolve(project); const written = []; const kept = [];
  for (const d of DEPARTMENTS) {
    const dir = path.join(root, 'studio', d.dir);
    fs.mkdirSync(dir, { recursive: true });
    const files = { ...d.files, 'status.json': JSON.stringify(emptyStatus(d), null, 2) + '\n' };
    for (const [f, content] of Object.entries(files)) {
      const p = path.join(dir, f);
      if (fs.existsSync(p)) kept.push(p); else { fs.writeFileSync(p, content); written.push(p); }
    }
  }
  const econ = path.join(root, 'studio', '02-design', 'economy.json');
  if (!fs.existsSync(econ)) { fs.writeFileSync(econ, JSON.stringify(sampleEconomy(name), null, 2) + '\n'); written.push(econ); }
  const game = path.join(root, 'game');
  fs.mkdirSync(game, { recursive: true });
  copyTree(TEMPLATE, game, written);
  const projectFile = path.join(game, 'default.project.json');
  const pj = JSON.parse(fs.readFileSync(projectFile, 'utf8'));
  if (pj.name === 'Game') { pj.name = name; fs.writeFileSync(projectFile, JSON.stringify(pj, null, 2) + '\n'); }
  const ci = path.join(root, '.github', 'workflows', 'roblox-ci.yml');
  if (!fs.existsSync(ci)) { fs.mkdirSync(path.dirname(ci), { recursive: true }); fs.copyFileSync(path.join(TEMPLATE, 'ci', 'roblox-ci.yml'), ci); written.push(ci); }
  return { written: written.map((p) => path.relative(root, p).split(path.sep).join('/')), kept: kept.map((p) => path.relative(root, p).split(path.sep).join('/')) };
}

export function sampleEconomy(name) {
  return {
    name, sessionMinutes: 25, sessionsPerDay: 1.5, currencies: ['Coins', 'Gems'],
    sources: [{ id: 'collect', currency: 'Coins', perMinute: 120, growthPerLevel: 0.08 }, { id: 'daily', currency: 'Gems', perSession: 5 }],
    levels: { xpPerMinute: 60, base: 100, exponent: 1.45, max: 60 },
    unlocks: [{ id: 'backpack2', currency: 'Coins', price: 1500, level: 2, effect: { income: 0.25 } }, { id: 'zone2', currency: 'Coins', price: 12000, level: 6, effect: { income: 0.6 } }],
    robux: [{ id: 'gems_small', kind: 'product', productId: 0, robux: 49, grants: { Gems: 100 } }, { id: 'coins2x', kind: 'pass', gamePassId: 0, robux: 199, effect: { multiplier: { Coins: 2 } } }],
    targets: { allContentDays: 14, maxDeadZoneMinutes: 15, firstUnlockMinutes: 3 },
  };
}

// ---------- economy.json → Luau config ----------
const ident = (k) => (/^[A-Za-z_]\w*$/.test(k) ? k : `[${JSON.stringify(k)}]`);
export function toLuau(value, indent = 1) {
  const pad = '\t'.repeat(indent); const end = '\t'.repeat(indent - 1);
  if (value === null || value === undefined) return 'nil';
  if (typeof value === 'number') { if (!Number.isFinite(value)) throw new Error(`not a finite number: ${value}`); return String(value); }
  if (typeof value === 'boolean') return String(value);
  if (typeof value === 'string') return JSON.stringify(value);
  if (Array.isArray(value)) return value.length ? `{\n${value.map((v) => `${pad}${toLuau(v, indent + 1)},`).join('\n')}\n${end}}` : '{}';
  const entries = Object.entries(value);
  return entries.length ? `{\n${entries.map(([k, v]) => `${pad}${ident(k)} = ${toLuau(v, indent + 1)},`).join('\n')}\n${end}}` : '{}';
}
export function writeConfig(project) {
  const root = path.resolve(project);
  const src = path.join(root, 'studio', '02-design', 'economy.json');
  const cfg = JSON.parse(fs.readFileSync(src, 'utf8'));
  const { targets, name, ...runtime } = cfg; void targets; void name;
  const out = path.join(root, 'game', 'src', 'shared', 'Config', 'Economy.luau');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, `--!strict\n-- GENERATED from studio/02-design/economy.json by \`studio.mjs config\`. Edit the JSON (and re-run the simulator), not this file.\nreturn ${toLuau(runtime)}\n`);
  return path.relative(root, out).split(path.sep).join('/');
}

// ---------- pinned third-party modules ----------
export const VENDOR = [{
  name: 'ProfileStore', licence: 'Apache-2.0', repo: 'MadStudioRoblox/ProfileStore', commit: '45c9847cbcf1fc260369c50eb335aba7c35aecdd',
  files: [{ from: 'ProfileStore.luau', to: 'ProfileStore.luau', sha256: 'ad43737203688b8e88cab34ebe8c483000c157e53bfb41e35f1b49ee89d0c95f' }, { from: 'LICENSE', to: 'ProfileStore.LICENSE.txt' }],
}];
export async function fetchDeps(gameDir, { base = process.env.STUDIO_RAW_BASE ?? 'https://raw.githubusercontent.com', fetchImpl = globalThis.fetch } = {}) {
  const vendor = path.join(path.resolve(gameDir), 'src', 'server', 'Vendor');
  fs.mkdirSync(vendor, { recursive: true });
  const done = [];
  for (const dep of VENDOR) for (const f of dep.files) {
    const url = `${base}/${dep.repo}/${dep.commit}/${f.from}`;
    const r = await fetchImpl(url, { headers: { 'user-agent': 'roblox-studio-company' } });
    if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
    const buf = Buffer.from(await r.arrayBuffer());
    if (f.sha256) {
      const got = crypto.createHash('sha256').update(buf.toString('utf8').replace(/\r\n/g, '\n')).digest('hex');
      if (got !== f.sha256) throw new Error(`${dep.name}/${f.from}: checksum mismatch (got ${got}); refusing to install`);
    }
    fs.writeFileSync(path.join(vendor, f.to), buf);
    done.push(`${dep.name} ${f.to} @ ${dep.commit.slice(0, 7)}`);
  }
  return done;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const args = process.argv.slice(2);
  const opt = (n, d) => { const i = args.indexOf(`--${n}`); if (i < 0) return d; const v = args[i + 1]; args.splice(i, 2); return v; };
  const name = opt('name', undefined);
  const [cmd, target] = args;
  try {
    if (cmd === 'new') {
      const r = scaffold(target ?? '.', { name });
      console.log(`✔ Studio set up: ${r.written.length} files created${r.kept.length ? `, ${r.kept.length} existing files kept` : ''}.`);
      console.log('  studio/00-owner … studio/10-research   department folders with status.json');
      console.log('  game/                                  Rojo project (Luau), tests, toolchain pins');
      console.log('Next: `studio.mjs deps game`, then `rokit install` inside game/, then the G0 kickoff interview.');
    } else if (cmd === 'deps') {
      for (const d of await fetchDeps(target ?? 'game')) console.log(`✔ ${d}`);
    } else if (cmd === 'config') {
      console.log(`✔ ${writeConfig(target ?? '.')}`);
    } else { console.error('usage: scaffold.mjs new [project] [--name "Game"] | deps [game dir] | config [project]'); process.exit(2); }
  } catch (e) { console.error(`✖ ${e.message}`); process.exit(1); }
}
