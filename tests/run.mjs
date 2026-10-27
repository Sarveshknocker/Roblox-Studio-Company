// Roblox Studio Company — test suite (zero dependencies). `npm test`; `npm run test:live` also hits the real public APIs.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { RULES, scopeOf } from '../skills/studio-qa/scripts/rules.mjs';
import { lintText, lint } from '../skills/studio-qa/scripts/lint.mjs';
import { validate, simulate, analyse, xpToNext, toMarkdown as econMd } from '../skills/studio-design/scripts/economy.mjs';
import { DEPARTMENTS, scaffold, sampleEconomy, toLuau, writeConfig, VENDOR, fetchDeps } from '../skills/studio/scripts/scaffold.mjs';
import { readStatus, report, toMarkdown as statusMd } from '../skills/studio/scripts/status.mjs';
import { keywords, relevance, EXPLOIT, research, toMarkdown as researchMd } from '../skills/studio-research/scripts/research.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LIVE = process.argv.includes('--live');
const tests = [];
const test = (name, fn) => tests.push({ name, fn });
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'rsc-'));
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));
const rel = (base, p) => path.relative(base, p).split(path.sep).join('/');
const cli = (...args) => spawnSync(process.execPath, [path.join(ROOT, 'bin', 'studio.mjs'), ...args], { encoding: 'utf8' });

function serve(routes) {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      const u = new URL(req.url, 'http://x');
      const hit = routes[u.pathname];
      if (!hit) { res.writeHead(404); return res.end(); }
      const body = typeof hit === 'function' ? hit(u) : hit;
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(typeof body === 'string' ? body : JSON.stringify(body));
    });
    srv.listen(0, '127.0.0.1', () => resolve({ url: `http://127.0.0.1:${srv.address().port}`, close: () => new Promise((r) => srv.close(r)) }));
  });
}

// ---------------------------------------------------------------- linter: annotated corpus
const CORPUS = path.join(ROOT, 'tests', 'rules');
const ANN = /--\s*(ruleid|ok|ruleid-file|ok-file):\s*([\w.,\s-]+)$/;

test('linter: every annotated corpus case behaves as annotated', () => {
  const failures = []; const covered = new Set();
  for (const abs of walk(path.join(CORPUS, 'src'))) {
    const file = rel(CORPUS, abs); const text = fs.readFileSync(abs, 'utf8');
    const findings = lintText(file, text); const lines = text.split('\n');
    lines.forEach((l, i) => {
      const m = l.trim().match(ANN); if (!m) return;
      const ids = m[2].split(',').map((s) => s.trim()).filter(Boolean);
      for (const id of ids) {
        assert.ok(RULES.some((r) => r.id === id), `${file}:${i + 1} annotates unknown rule ${id}`);
        const fileLevel = m[1].endsWith('-file');
        const hits = findings.filter((f) => f.rule === id && (fileLevel || f.line === i + 2));
        const expect = m[1].startsWith('ruleid');
        if (expect) covered.add(id);
        if (expect !== hits.length > 0) failures.push(`${file}:${i + 1} ${m[1]} ${id} → ${hits.length} finding(s)`);
      }
    });
  }
  // JSON has no comments, so the project-file rule is checked separately.
  const pj = lintText('bad.project.json', fs.readFileSync(path.join(CORPUS, 'bad.project.json'), 'utf8'));
  if (pj.some((f) => f.rule === 'rbx.loadstring-enabled')) covered.add('rbx.loadstring-enabled');
  else failures.push('bad.project.json: rbx.loadstring-enabled not reported');
  assert.deepEqual(failures, []);
  const missing = RULES.map((r) => r.id).filter((id) => !covered.has(id));
  assert.deepEqual(missing, [], `rules without a positive corpus case: ${missing.join(', ')}`);
});

test('linter: rules are well formed and scopes resolve from Rojo file names', () => {
  const ids = new Set();
  for (const r of RULES) {
    assert.ok(!ids.has(r.id), `duplicate ${r.id}`); ids.add(r.id);
    for (const k of ['id', 'severity', 'title', 'why', 'fix']) assert.ok(r[k], `${r.id} missing ${k}`);
    assert.ok(r.re.global, `${r.id} regex must be global`);
  }
  assert.equal(scopeOf('src/server/X.server.luau'), 'server');
  assert.equal(scopeOf('src/client/Hud.client.luau'), 'client');
  assert.equal(scopeOf('src/shared/Pure/Validate.luau'), 'shared');
});

test('linter: comments do not trigger rules, suppression needs the exact rule id', () => {
  assert.equal(lintText('src/server/A.server.luau', '-- loadstring("x") in a comment\n--[[ require(123456789) ]]\n').length, 0);
  const wrongId = lintText('src/server/A.server.luau', 'wait(1) -- studio-ignore: rbx.loadstring wrong rule\n');
  assert.ok(wrongId.some((f) => f.rule === 'rbx.deprecated-wait'));
});

test('linter: the shipped Luau template is lint-clean', () => {
  const r = lint(path.join(ROOT, 'skills', 'studio-engineering', 'templates', 'game'));
  assert.ok(r.files >= 15, `only ${r.files} files linted`);
  assert.deepEqual(r.findings.map((f) => `${f.rule} ${f.file}:${f.line}`), []);
});

test('linter: CLI fails on high findings and writes the report', () => {
  const dir = tmp(); fs.mkdirSync(path.join(dir, 'src', 'server'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'src', 'server', 'Bad.server.luau'), 'loadstring("print(1)")()\n');
  const out = path.join(dir, 'qa');
  const r = cli('lint', dir, '--out', out);
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(fs.readFileSync(path.join(out, 'LINT_REPORT.md'), 'utf8'), /rbx\.loadstring/);
  assert.equal(cli('lint', dir, '--fail-on', 'critical').status, 0);
});

// ---------------------------------------------------------------- economy simulator
test('economy: the sample design validates and the formulas match the Luau Progression module', () => {
  const cfg = sampleEconomy('Test');
  assert.deepEqual(validate(cfg), []);
  assert.equal(xpToNext(1, cfg.levels), 100);
  assert.ok(Math.abs(xpToNext(4, cfg.levels) - 100 * Math.pow(4, 1.45)) < 1e-9);
  const lua = fs.readFileSync(path.join(ROOT, 'skills', 'studio-engineering', 'templates', 'game', 'src', 'shared', 'Pure', 'Progression.luau'), 'utf8');
  assert.match(lua, /base\s*\*\s*\(?\s*level\s*\^\s*\(?\s*\w*\.?exponent/i, 'Progression.luau must use base * level ^ exponent');
});

test('economy: invalid designs are rejected with readable errors', () => {
  const errs = validate({ currencies: ['Coins'], sources: [{ id: 's', currency: 'Gold', perMinute: 1 }], levels: { base: 1, exponent: 1, xpPerMinute: 1, max: 2 }, sessionMinutes: 10, sessionsPerDay: 1 });
  assert.ok(errs.some((e) => /Gold/.test(e)), errs.join('; '));
});

test('economy: simulation is deterministic, paying players progress faster', () => {
  const cfg = sampleEconomy('Test');
  const a = simulate(cfg, { days: 7 }); const b = simulate(cfg, { days: 7 });
  assert.deepEqual(a.events, b.events);
  const paid = simulate(cfg, { days: 7, paying: true });
  assert.ok(paid.earned.Coins > a.earned.Coins);
  assert.ok(a.minutes === Math.round(7 * cfg.sessionMinutes * cfg.sessionsPerDay) || a.minutes > 0);
});

test('economy: analysis catches the deliberate problems in the sample design', () => {
  const a = analyse(sampleEconomy('Test'));
  assert.deepEqual(a.errors, []);
  assert.ok(a.warnings.length >= 3, a.warnings.join('\n'));
  assert.ok(a.warnings.some((w) => /inflation|piles up/.test(w)));
  const pvp = sampleEconomy('Test'); pvp.robux.push({ id: 'sword', kind: 'pass', robux: 400, effect: { competitive: true } });
  assert.ok(analyse(pvp).warnings.some((w) => /pay-to-win/.test(w)));
  assert.match(econMd(a), /Warnings|warnings/);
});

test('economy: CLI --strict fails when there are warnings', () => {
  const dir = tmp(); const f = path.join(dir, 'economy.json');
  fs.writeFileSync(f, JSON.stringify(sampleEconomy('T')));
  const r = cli('economy', f, '--strict');
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.ok(fs.existsSync(path.join(dir, 'ECONOMY_REPORT.md')));
});

// ---------------------------------------------------------------- scaffold, config, deps
test('scaffold: creates every department folder, the game project and CI, and never overwrites', () => {
  const dir = tmp();
  const r = scaffold(dir, { name: 'Pet Tycoon' });
  for (const d of DEPARTMENTS) {
    const s = JSON.parse(fs.readFileSync(path.join(dir, 'studio', d.dir, 'status.json'), 'utf8'));
    assert.equal(s.department, d.name);
    for (const f of Object.keys(d.files)) assert.ok(fs.existsSync(path.join(dir, 'studio', d.dir, f)), `${d.dir}/${f}`);
  }
  assert.equal(DEPARTMENTS.length, 11);
  assert.equal(JSON.parse(fs.readFileSync(path.join(dir, 'game', 'default.project.json'), 'utf8')).name, 'Pet Tycoon');
  for (const f of ['rokit.toml', 'selene.toml', 'stylua.toml', 'tests/run.luau', 'src/server/Services/Purchases.luau']) assert.ok(fs.existsSync(path.join(dir, 'game', f)), f);
  assert.ok(fs.existsSync(path.join(dir, '.github', 'workflows', 'roblox-ci.yml')));
  assert.ok(r.written.length > 40);
  fs.writeFileSync(path.join(dir, 'studio', '02-design', 'GDD.md'), 'MY GDD');
  const again = scaffold(dir, { name: 'Pet Tycoon' });
  assert.equal(again.written.length, 0);
  assert.equal(fs.readFileSync(path.join(dir, 'studio', '02-design', 'GDD.md'), 'utf8'), 'MY GDD');
});

test('config: economy.json becomes valid Luau without design-only fields', () => {
  assert.equal(toLuau({ a: 1, 'b-c': [true, 'x'] }), '{\n\ta = 1,\n\t["b-c"] = {\n\t\ttrue,\n\t\t"x",\n\t},\n}');
  assert.throws(() => toLuau(NaN));
  const dir = tmp(); scaffold(dir, { name: 'G' });
  const out = writeConfig(dir);
  const lua = fs.readFileSync(path.join(dir, out), 'utf8');
  assert.match(lua, /^--!strict/);
  assert.match(lua, /perMinute = 120/);
  assert.doesNotMatch(lua, /targets|allContentDays/);
});

test('deps: installs the pinned module only when the checksum matches', async () => {
  const dep = VENDOR[0]; const good = Buffer.from('return {}\n');
  const fakeFetch = (body) => async (url) => ({ ok: true, status: 200, arrayBuffer: async () => (url.endsWith('LICENSE') ? Buffer.from('Apache') : body) });
  const dir = tmp();
  await assert.rejects(fetchDeps(dir, { base: 'http://x', fetchImpl: fakeFetch(good) }), /checksum mismatch/);
  assert.ok(!fs.existsSync(path.join(dir, 'src', 'server', 'Vendor', 'ProfileStore.luau')));
  const saved = dep.files[0].sha256;
  try {
    dep.files[0].sha256 = crypto.createHash('sha256').update(good).digest('hex');
    const crlf = Buffer.from('return {}\r\n'); // CRLF checkouts must hash the same as LF
    const done = await fetchDeps(dir, { base: 'http://x', fetchImpl: fakeFetch(crlf) });
    assert.equal(done.length, 2);
    assert.ok(fs.existsSync(path.join(dir, 'src', 'server', 'Vendor', 'ProfileStore.LICENSE.txt')));
  } finally { dep.files[0].sha256 = saved; }
  assert.match(dep.commit, /^[0-9a-f]{40}$/);
});

// ---------------------------------------------------------------- status aggregation
test('status: aggregates decisions, risks by severity, blocked and stale work; rejects claims without evidence', () => {
  const dir = tmp(); scaffold(dir, { name: 'G' });
  const set = (d, s) => { const f = path.join(dir, 'studio', d, 'status.json'); fs.writeFileSync(f, JSON.stringify({ ...JSON.parse(fs.readFileSync(f, 'utf8')), ...s })); };
  set('02-design', { updated: '2026-01-01', doing: ['Economy v2'], done: [{ what: 'Loop', evidence: 'studio/07-qa/p.md' }],
    decisionsNeeded: [{ question: 'Eggs or direct?', options: ['eggs', 'direct'], recommendation: 'direct', blocking: 'shop' }],
    risks: [{ risk: 'low thing', severity: 'low' }, { risk: 'big thing', severity: 'high', mitigation: 'simulate' }] });
  set('04-art', { blocked: [{ what: 'Pet art', waitingOn: 'art bible' }] });
  const r = report(dir, { now: new Date('2026-02-01') });
  assert.equal(r.decisions.length, 1);
  assert.equal(r.risks[0].risk, 'big thing');
  assert.equal(r.blocked.length, 1);
  assert.equal(r.stale.length, 1);
  assert.deepEqual(r.problems, []);
  assert.equal(r.phase.nextGate, 'G0');
  const md = statusMd(r);
  assert.match(md, /Eggs or direct\?[\s\S]*Recommendation: direct/);
  set('03-engineering', { done: [{ what: 'Shop' }], decisionsNeeded: [{ question: 'x' }] });
  set('05-tech-art', { done: 'oops' });
  const bad = readStatus(dir).problems;
  assert.ok(bad.some((p) => /no evidence/.test(p)));
  assert.ok(bad.some((p) => /recommendation/.test(p)));
  assert.ok(bad.some((p) => /must be a list/.test(p)));
  assert.equal(cli('status', dir).status, 1);
  assert.ok(fs.existsSync(path.join(dir, 'studio', '00-owner', 'STATUS.md')));
});

// ---------------------------------------------------------------- research
test('research: keyword extraction, relevance and the exploit filter', () => {
  assert.deepEqual(keywords('How do I make a pet simulator game in Roblox'), ['pet', 'simulator']);
  assert.ok(relevance('Pet simulator egg hatching tutorial', 'pet simulator') >= 0.5);
  assert.ok(relevance('Weekly Roblox news', 'pet simulator') < 0.5);
  for (const bad of ['Pet Sim X auto farm script hub', 'Free Robux generator', 'Blox Fruits executor', 'roblox script for pet simulator']) assert.ok(EXPLOIT.test(bad), bad);
  for (const ok of ['ProfileStore: session-locked saving', 'Pet simulator template (MIT)', 'Rojo project scripts']) assert.ok(!EXPLOIT.test(ok), ok);
});

test('research: queries all sources, filters exploits and labels trust (mock servers)', async () => {
  const srv = await serve({
    '/search.json': { topics: [{ id: 1, slug: 'pet-sim', title: 'Pet simulator egg system tutorial', reply_count: 12, last_posted_at: '2026-09-01T00:00:00Z' }, { id: 2, slug: 'news', title: 'Weekly news roundup', reply_count: 3 }] },
    '/search/repositories': { items: [
      { full_name: 'good/pet-sim', html_url: 'https://github.com/good/pet-sim', description: 'Open-source pet simulator', stargazers_count: 120, license: { spdx_id: 'MIT' }, pushed_at: '2026-08-01' },
      { full_name: 'tiny/pet', html_url: 'https://github.com/tiny/pet', description: 'pet simulator test', stargazers_count: 2, license: null },
      { full_name: 'evil/hub', html_url: 'https://github.com/evil/hub', description: 'Pet simulator auto farm script hub', stargazers_count: 900, license: { spdx_id: 'MIT' } }] },
    '/v1/package-search': (u) => (u.searchParams.get('query') === 'pet' ? [{ scope: 'a', name: 'pet-follow', description: 'Pets that follow you', versions: ['1.2.0'] }, { scope: 'b', name: 'puppet', description: 'Puppet strings', versions: ['0.1.0'] }] : []),
  });
  const env = { ...process.env };
  try {
    Object.assign(process.env, { STUDIO_DEVFORUM_API: srv.url, STUDIO_GITHUB_API: srv.url, STUDIO_WALLY_API: srv.url });
    const r = await research('pet simulator');
    assert.deepEqual(r.errors, []);
    assert.deepEqual(r.results.devforum.map((t) => t.title), ['Pet simulator egg system tutorial']);
    assert.deepEqual(r.results.github.map((g) => g.title), ['good/pet-sim', 'tiny/pet']);
    assert.match(r.results.github[0].trust, /^reusable/);
    assert.match(r.results.github[1].trust, /^ideas only/);
    assert.deepEqual(r.results.wally.map((p) => p.title), ['a/pet-follow']);
    assert.match(researchMd(r), /a\/pet-follow/);
    process.env.STUDIO_WALLY_API = 'http://127.0.0.1:1';
    const partial = await research('pet simulator', { sources: ['wally', 'devforum'] });
    assert.equal(partial.errors.length, 1);
    assert.equal(partial.results.devforum.length, 1);
  } finally { process.env = env; await srv.close(); }
});

if (LIVE) test('research (live): DevForum, GitHub and Wally answer', async () => {
  const r = await research('datastore session locking');
  assert.deepEqual(r.errors, []);
  assert.ok(Object.values(r.results).some((x) => x.length));
});

// ---------------------------------------------------------------- installer
test('installer: init → update → remove round-trip keeps the user’s own files', () => {
  const dir = tmp();
  fs.writeFileSync(path.join(dir, 'AGENTS.md'), '# My project\n\nMy own rules.\n');
  let r = cli('init', dir);
  assert.equal(r.status, 0, r.stderr);
  const agents = fs.readFileSync(path.join(dir, 'AGENTS.md'), 'utf8');
  assert.match(agents, /My own rules\./);
  assert.match(agents, /roblox-studio:start[\s\S]*\.studio-kit\/skills\/studio\/SKILL\.md[\s\S]*roblox-studio:end/);
  assert.doesNotMatch(agents, /\{\{KIT\}\}/);
  for (const f of ['CLAUDE.md', 'GEMINI.md', '.github/copilot-instructions.md', '.cursor/rules/roblox-studio-company.mdc', '.windsurf/rules/roblox-studio-company.md', '.clinerules/roblox-studio-company.md', '.claude/skills/studio/SKILL.md', '.claude/agents/studio-manager.md', '.studio-kit/bin/studio.mjs', '.studio-kit/manifest.json']) assert.ok(fs.existsSync(path.join(dir, f)), f);
  assert.match(fs.readFileSync(path.join(dir, '.cursor/rules/roblox-studio-company.mdc'), 'utf8'), /^---\ndescription:/);
  r = cli('update', dir); assert.equal(r.status, 0, r.stderr);
  assert.equal((fs.readFileSync(path.join(dir, 'AGENTS.md'), 'utf8').match(/roblox-studio:start/g) ?? []).length, 1);
  // the installed copy works on its own
  const own = spawnSync(process.execPath, [path.join(dir, '.studio-kit', 'bin', 'studio.mjs'), 'new', dir, '--name', 'Obby'], { encoding: 'utf8' });
  assert.equal(own.status, 0, own.stderr);
  r = cli('remove', dir); assert.equal(r.status, 0, r.stderr);
  assert.equal(fs.readFileSync(path.join(dir, 'AGENTS.md'), 'utf8'), '# My project\n\nMy own rules.\n');
  for (const f of ['CLAUDE.md', '.cursor/rules/roblox-studio-company.mdc', '.studio-kit', '.claude/skills/studio']) assert.ok(!fs.existsSync(path.join(dir, f)), f);
  assert.ok(fs.existsSync(path.join(dir, 'studio', '00-owner', 'phase.json')), 'studio/ must survive remove');
  assert.ok(fs.existsSync(path.join(dir, 'game', 'default.project.json')), 'game/ must survive remove');
});

test('installer: --tools limits what is written; bad tools and self-install are refused', () => {
  const dir = tmp();
  assert.equal(cli('init', dir, '--tools', 'gemini').status, 0);
  assert.ok(fs.existsSync(path.join(dir, 'GEMINI.md')));
  assert.ok(!fs.existsSync(path.join(dir, 'CLAUDE.md')));
  assert.equal(cli('init', dir, '--tools', 'notepad').status, 2);
  assert.equal(cli('init', ROOT).status, 2);
});

// ---------------------------------------------------------------- skills, agents, docs, manifests
const SKILLS = fs.readdirSync(path.join(ROOT, 'skills'));
const front = (text) => Object.fromEntries((text.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '').split('\n').map((l) => l.match(/^(\w+):\s*(.*)$/)).filter(Boolean).map((m) => [m[1], m[2]]));

test('skills: frontmatter is valid and every referenced bundled file exists', () => {
  assert.equal(SKILLS.length, 11);
  for (const s of SKILLS) {
    const text = fs.readFileSync(path.join(ROOT, 'skills', s, 'SKILL.md'), 'utf8');
    const fm = front(text);
    assert.equal(fm.name, s, `${s}: name must equal folder`);
    assert.ok(fm.description && fm.description.length > 40 && fm.description.length <= 1024, `${s}: description`);
    for (const m of text.matchAll(/`((?:references|templates|scripts)\/[\w./-]+)`/g)) assert.ok(fs.existsSync(path.join(ROOT, 'skills', s, m[1])), `${s} → ${m[1]}`);
    for (const m of text.matchAll(/`<kit>\/([\w./-]+)`/g)) assert.ok(fs.existsSync(path.join(ROOT, m[1].replace(/\/$/, ''))), `${s} → <kit>/${m[1]}`);
  }
});

test('routing: the Studio Manager, entry.md and AGENTS.md reach every department', () => {
  const manager = fs.readFileSync(path.join(ROOT, 'skills', 'studio', 'SKILL.md'), 'utf8');
  const entry = fs.readFileSync(path.join(ROOT, 'adapters', 'entry.md'), 'utf8');
  const agentsMd = fs.readFileSync(path.join(ROOT, 'AGENTS.md'), 'utf8');
  for (const s of SKILLS.filter((x) => x !== 'studio')) {
    assert.ok(manager.includes(`\`${s}\``), `studio/SKILL.md does not route to ${s}`);
    assert.ok(agentsMd.includes(`\`${s}\``), `AGENTS.md does not mention ${s}`);
  }
  for (const s of SKILLS) assert.ok(entry.includes(`{{KIT}}/skills/${s}/SKILL.md`), `entry.md does not route to ${s}`);
  for (const d of DEPARTMENTS) assert.ok(manager.includes(`studio/${d.dir}/`), `studio/SKILL.md does not list folder ${d.dir}`);
});

test('agents: every brief has frontmatter, points at a real skill and keeps the owner-approval rule', () => {
  const files = fs.readdirSync(path.join(ROOT, 'agents'));
  assert.equal(files.length, 12);
  for (const f of files) {
    const text = fs.readFileSync(path.join(ROOT, 'agents', f), 'utf8'); const fm = front(text);
    assert.equal(`${fm.name}.md`, f);
    assert.ok(fm.description, `${f}: description`);
    const skills = [...text.matchAll(/skills\/([\w-]+)\/SKILL\.md/g)].map((m) => m[1]);
    assert.ok(skills.length && skills.every((s) => SKILLS.includes(s)), `${f}: skill references ${skills}`);
    assert.match(text, /never publish/i, `${f}: missing the never-publish rule`);
  }
});

test('docs: the Luau template has a Lune spec for every pure module', () => {
  const tpl = path.join(ROOT, 'skills', 'studio-engineering', 'templates', 'game');
  const runner = fs.readFileSync(path.join(tpl, 'tests', 'run.luau'), 'utf8');
  for (const m of fs.readdirSync(path.join(tpl, 'src', 'shared', 'Pure'))) {
    const name = m.replace(/\.luau$/, '');
    assert.ok(fs.existsSync(path.join(tpl, 'tests', `${name}.spec.luau`)), `missing tests/${name}.spec.luau`);
    assert.ok(runner.includes(name), `run.luau does not run ${name}`);
  }
});

test('manifests: versions agree and every package file exists', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  for (const f of ['.claude-plugin/plugin.json', '.codex-plugin/plugin.json']) assert.equal(JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8')).version, pkg.version, f);
  JSON.parse(fs.readFileSync(path.join(ROOT, '.claude-plugin', 'marketplace.json'), 'utf8'));
  JSON.parse(fs.readFileSync(path.join(ROOT, '.agents', 'plugins', 'marketplace.json'), 'utf8'));
  for (const f of pkg.files) assert.ok(fs.existsSync(path.join(ROOT, f)), `package.json files: ${f}`);
  assert.ok(fs.existsSync(path.join(ROOT, pkg.bin['roblox-studio'])));
  assert.match(fs.readFileSync(path.join(ROOT, 'CHANGELOG.md'), 'utf8'), new RegExp(`## ${pkg.version.replace(/\./g, '\\.')}`));
});

test('evals: cases are well formed and name real skills', () => {
  const cases = JSON.parse(fs.readFileSync(path.join(ROOT, 'evals', 'cases.json'), 'utf8'));
  assert.ok(cases.length >= 10);
  for (const c of cases) {
    assert.ok(c.id && c.prompt && Array.isArray(c.expect) && c.expect.length, JSON.stringify(c));
    assert.ok(SKILLS.includes(c.skill), `${c.id}: unknown skill ${c.skill}`);
  }
});

test('scripts: every script parses', () => {
  for (const f of [...walk(path.join(ROOT, 'skills')), ...walk(path.join(ROOT, 'bin'))].filter((p) => p.endsWith('.mjs'))) {
    const r = spawnSync(process.execPath, ['--check', f], { encoding: 'utf8' });
    assert.equal(r.status, 0, `${rel(ROOT, f)}: ${r.stderr}`);
  }
});

// ---------------------------------------------------------------- runner
let failed = 0;
for (const t of tests) {
  try { await t.fn(); console.log(`✔ ${t.name}`); }
  catch (e) { failed++; console.log(`✘ ${t.name}\n  ${String(e.message).split('\n').join('\n  ')}`); }
}
console.log(`\n${tests.length - failed}/${tests.length} passed`);
process.exit(failed ? 1 : 0);
