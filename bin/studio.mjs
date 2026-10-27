#!/usr/bin/env node
// Roblox Studio Company — installer + CLI. Works with any AI coding tool.
//
//   node bin/studio.mjs init   [dir] [--tools all|claude,cursor,...] [--kit-dir .studio-kit]   install the studio into a folder
//   node bin/studio.mjs update [dir]          refresh the kit and instruction blocks
//   node bin/studio.mjs remove [dir]          uninstall (keeps studio/ and game/)
//   node bin/studio.mjs new | deps | config | status | doctor | lint | economy | research   (see help)
//
// Or without cloning:  npx github:Sarveshknocker/Roblox-Studio-Company init
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const KIT_SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const START = '<!-- roblox-studio:start -->';
const END = '<!-- roblox-studio:end -->';

const [cmd = 'help', ...rest] = process.argv.slice(2);
const flag = (name, def) => { const i = rest.indexOf(name); return i >= 0 ? rest[i + 1] : def; };
const positional = rest.filter((a, i) => !a.startsWith('--') && !rest[i - 1]?.startsWith('--'));

const DESC = 'Roblox Studio Company kit — use to make a Roblox game as a full studio (design, Luau engineering, art, audio, QA, live-ops, publishing) reporting to the owner';
const TOOLS = {
  agents: { file: 'AGENTS.md', block: true, note: 'Codex, Jules, Amp, Aider, Zed, OpenCode, Factory, Devin & other AGENTS.md readers' },
  claude: { file: 'CLAUDE.md', block: true, note: 'Claude Code (+ skills & agents copied into .claude/)' },
  gemini: { file: 'GEMINI.md', block: true, note: 'Gemini CLI' },
  copilot: { file: '.github/copilot-instructions.md', block: true, note: 'GitHub Copilot' },
  cursor: { file: '.cursor/rules/roblox-studio-company.mdc', block: false, note: 'Cursor', wrap: (b) => `---\ndescription: ${DESC}\nglobs:\nalwaysApply: false\n---\n\n${b}` },
  windsurf: { file: '.windsurf/rules/roblox-studio-company.md', block: false, note: 'Windsurf', wrap: (b) => `---\ntrigger: model_decision\ndescription: ${DESC}\n---\n\n${b}` },
  cline: { file: '.clinerules/roblox-studio-company.md', block: false, note: 'Cline / Roo Code' },
};
const KIT_PARTS = ['bin', 'skills', 'agents', 'adapters', 'package.json', 'README.md', 'LICENSE'];

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    e.isDirectory() ? copyDir(s, d) : fs.copyFileSync(s, d);
  }
}
const copyAny = (s, d) => {
  if (!fs.existsSync(s)) return;
  fs.statSync(s).isDirectory() ? copyDir(s, d) : (fs.mkdirSync(path.dirname(d), { recursive: true }), fs.copyFileSync(s, d));
};

function upsertBlock(file, body) {
  const block = `${START}\n${body.trim()}\n${END}\n`;
  const prev = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  const re = new RegExp(`${START}[\\s\\S]*?${END}\\n?`);
  const next = re.test(prev) ? prev.replace(re, block) : (prev ? prev.replace(/\s*$/, '\n\n') : '') + block;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, next);
}
function removeBlock(file) {
  if (!fs.existsSync(file)) return false;
  const prev = fs.readFileSync(file, 'utf8');
  const next = prev.replace(new RegExp(`\\n*${START}[\\s\\S]*?${END}\\n?`), '\n');
  if (next === prev) return false;
  next.trim() ? fs.writeFileSync(file, next.replace(/\n+$/, '\n')) : fs.rmSync(file);
  return true;
}

function resolveTools(spec) {
  if (!spec || spec === 'all') return Object.keys(TOOLS);
  const list = spec.split(',').map((s) => s.trim()).filter(Boolean);
  const bad = list.filter((t) => !TOOLS[t]);
  if (bad.length) { console.error(`Unknown tool(s): ${bad.join(', ')}. Valid: ${Object.keys(TOOLS).join(', ')}`); process.exit(2); }
  return list;
}
function readManifest(target) {
  try { return JSON.parse(fs.readFileSync(path.join(target, flag('--kit-dir', '.studio-kit'), 'manifest.json'), 'utf8')); } catch { return null; }
}

function install(target, { tools, kitDir }) {
  if (path.resolve(target) === KIT_SRC) { console.error('Refusing to install the kit into itself. Pass a target folder.'); process.exit(2); }
  const kitAbs = path.join(target, kitDir);
  const kitRel = kitDir.split(path.sep).join('/');
  fs.rmSync(kitAbs, { recursive: true, force: true });
  for (const p of KIT_PARTS) copyAny(path.join(KIT_SRC, p), path.join(kitAbs, p));
  const version = JSON.parse(fs.readFileSync(path.join(KIT_SRC, 'package.json'), 'utf8')).version;
  const entry = fs.readFileSync(path.join(KIT_SRC, 'adapters', 'entry.md'), 'utf8').replaceAll('{{KIT}}', kitRel);
  const written = [];
  for (const t of tools) {
    const def = TOOLS[t]; const file = path.join(target, def.file);
    if (def.block) upsertBlock(file, entry);
    else { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, def.wrap ? def.wrap(entry) : entry); }
    written.push(`${def.file}  (${def.note})`);
  }
  if (tools.includes('claude')) {
    for (const s of fs.readdirSync(path.join(KIT_SRC, 'skills'))) { const dst = path.join(target, '.claude', 'skills', s); fs.rmSync(dst, { recursive: true, force: true }); copyDir(path.join(KIT_SRC, 'skills', s), dst); }
    for (const a of fs.readdirSync(path.join(KIT_SRC, 'agents'))) copyAny(path.join(KIT_SRC, 'agents', a), path.join(target, '.claude', 'agents', a));
    written.push('.claude/skills/*, .claude/agents/*  (Claude Code native)');
  }
  fs.writeFileSync(path.join(kitAbs, 'manifest.json'), JSON.stringify({ version, kitDir: kitRel, tools, installedAt: new Date().toISOString() }, null, 2));
  console.log(`\n✔ Roblox Studio Company ${version} installed into ${target}`);
  console.log(`  Kit: ${kitRel}/`);
  for (const w of written) console.log(`  + ${w}`);
  console.log(`\nNext: open this folder in your AI tool and say:\n  "Start the studio: let's make a Roblox game."\nThe Studio Manager will interview you about genre and story, then run the departments.\n`);
}

function remove(target) {
  const m = readManifest(target);
  const kitDir = m?.kitDir ?? '.studio-kit';
  const tools = m?.tools ?? Object.keys(TOOLS);
  for (const t of tools) {
    const file = path.join(target, TOOLS[t].file);
    if (TOOLS[t].block) removeBlock(file) && console.log(`  - block removed from ${TOOLS[t].file}`);
    else if (fs.existsSync(file)) { fs.rmSync(file); console.log(`  - ${TOOLS[t].file}`); }
  }
  if (tools.includes('claude')) {
    for (const s of fs.readdirSync(path.join(KIT_SRC, 'skills'))) fs.rmSync(path.join(target, '.claude', 'skills', s), { recursive: true, force: true });
    for (const a of fs.readdirSync(path.join(KIT_SRC, 'agents'))) fs.rmSync(path.join(target, '.claude', 'agents', a), { force: true });
  }
  fs.rmSync(path.join(target, kitDir), { recursive: true, force: true });
  console.log(`✔ Removed Roblox Studio Company from ${target} (kept studio/ and game/).`);
}

function runScript(rel, args) {
  const r = spawnSync(process.execPath, [path.join(KIT_SRC, rel), ...args], { stdio: 'inherit' });
  process.exit(r.status ?? 1);
}

const target = path.resolve(positional[0] ?? process.cwd());
switch (cmd) {
  case 'init': install(target, { tools: resolveTools(flag('--tools', 'all')), kitDir: flag('--kit-dir', '.studio-kit') }); break;
  case 'update': {
    const m = readManifest(target);
    if (!m) { console.error('Kit not installed here — run init first.'); process.exit(1); }
    install(target, { tools: m.tools, kitDir: m.kitDir });
    break;
  }
  case 'remove': remove(target); break;
  case 'new': runScript('skills/studio/scripts/scaffold.mjs', ['new', ...rest]); break;
  case 'deps': runScript('skills/studio/scripts/scaffold.mjs', ['deps', ...rest]); break;
  case 'config': runScript('skills/studio/scripts/scaffold.mjs', ['config', ...rest]); break;
  case 'status': runScript('skills/studio/scripts/status.mjs', rest); break;
  case 'doctor': runScript('skills/studio/scripts/doctor.mjs', rest); break;
  case 'lint': runScript('skills/studio-qa/scripts/lint.mjs', rest); break;
  case 'economy': runScript('skills/studio-design/scripts/economy.mjs', rest); break;
  case 'research': runScript('skills/studio-research/scripts/research.mjs', rest); break;
  default:
    console.log(`Roblox Studio Company — a full Roblox game studio inside your AI coding assistant

Install:
  init     [dir] [--tools all|${Object.keys(TOOLS).join(',')}] [--kit-dir .studio-kit]
  update   [dir]                 refresh kit + instruction files
  remove   [dir]                 uninstall (keeps studio/ and game/)
Studio:
  new      [dir] [--name "Game"] department folders (studio/) + Rojo game project (game/) + CI
  deps     [game dir]            ProfileStore at a pinned commit, checksum-verified
  config   [dir]                 economy.json → game/src/shared/Config/Economy.luau
  status   [dir]                 Studio Manager report → studio/00-owner/STATUS.md
  doctor   [dir]                 toolchain check (Rokit, Rojo, Selene, StyLua, Lune)
  lint     [game dir] [--out studio/07-qa] [--fail-on high]   Roblox security & performance linter
  economy  [economy.json] [--days 14]   economy & progression simulator → ECONOMY_REPORT.md
  research "<query>" [--sources devforum,github,wally]        DevForum + GitHub + Wally research`);
}
