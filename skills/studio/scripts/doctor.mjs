#!/usr/bin/env node
// Roblox Studio Company — toolchain check. Reports which open-source tools are installed and how to install the rest.
//
//   node doctor.mjs [project] [--json]
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export const TOOLS = [
  { name: 'rokit', why: 'installs the pinned tools below', install: 'https://github.com/rojo-rbx/rokit#installation, then `rokit install` inside game/' },
  { name: 'rojo', why: 'syncs code into Roblox Studio and builds place files', install: '`rokit install` (pinned in game/rokit.toml); Studio plugin: `rojo plugin install`' },
  { name: 'selene', why: 'Luau linter', install: '`rokit install`' },
  { name: 'stylua', why: 'Luau formatter', install: '`rokit install`' },
  { name: 'lune', why: 'runs the Luau unit tests outside Roblox', install: '`rokit install`' },
  { name: 'git', why: 'version control', install: 'https://git-scm.com' },
];

function version(cmd) {
  const r = spawnSync(cmd, ['--version'], { encoding: 'utf8', shell: process.platform === 'win32' });
  return r.status === 0 ? (r.stdout || r.stderr).trim().split('\n')[0] : null;
}

export function doctor(project) {
  const root = path.resolve(project);
  const tools = TOOLS.map((t) => ({ ...t, version: version(t.name) }));
  const checks = [
    { what: 'studio/ department folders', ok: fs.existsSync(path.join(root, 'studio', '00-owner')), fix: 'node <kit>/bin/studio.mjs new .' },
    { what: 'game/default.project.json', ok: fs.existsSync(path.join(root, 'game', 'default.project.json')), fix: 'node <kit>/bin/studio.mjs new .' },
    { what: 'ProfileStore vendored', ok: fs.existsSync(path.join(root, 'game', 'src', 'server', 'Vendor', 'ProfileStore.luau')), fix: 'node <kit>/bin/studio.mjs deps game' },
    { what: 'CI workflow', ok: fs.existsSync(path.join(root, '.github', 'workflows', 'roblox-ci.yml')), fix: 'node <kit>/bin/studio.mjs new . (adds it if missing)' },
  ];
  return { tools, checks };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const args = process.argv.slice(2);
  const r = doctor(args.find((a) => !a.startsWith('--')) ?? '.');
  if (args.includes('--json')) { console.log(JSON.stringify(r, null, 2)); process.exit(0); }
  for (const t of r.tools) console.log(`${t.version ? '✔' : '✖'} ${t.name.padEnd(7)} ${t.version ?? `missing: ${t.why}. Install: ${t.install}`}`);
  for (const c of r.checks) console.log(`${c.ok ? '✔' : '✖'} ${c.what}${c.ok ? '' : ` — fix: ${c.fix}`}`);
  console.log('\nRoblox Studio itself is required to play-test and publish (free from create.roblox.com).');
}
