#!/usr/bin/env node
// Roblox Studio Company — research collector: how other Roblox developers solved it (zero dependencies).
//
//   node research.mjs "<query>" [--sources devforum,github,wally] [--limit 10] [--out studio/10-research] [--json]
//
// devforum: Roblox Developer Forum topics (public Discourse search)  · github: open-source Roblox/Luau projects
// wally:    packages on the Wally registry.   Top-game charts, Creator Hub docs and videos: use the AI tool's web search.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const UA = 'roblox-studio-company (+https://github.com/Sarveshknocker/Roblox-Studio-Company)';
const API = {
  devforum: () => process.env.STUDIO_DEVFORUM_API ?? 'https://devforum.roblox.com',
  github: () => process.env.STUDIO_GITHUB_API ?? 'https://api.github.com',
  wally: () => process.env.STUDIO_WALLY_API ?? 'https://api.wally.run',
};
const enc = encodeURIComponent;
async function getJSON(url, headers = {}) {
  const r = await fetch(url, { headers: { 'user-agent': UA, accept: 'application/json', ...headers }, signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

const STOP = new Set('a an the and or of to in on for with how do i my is are can make making roblox game system script'.split(' '));
export const keywords = (q) => [...new Set(q.toLowerCase().split(/[^a-z0-9+#]+/).filter((w) => w.length > 1 && !STOP.has(w)))];
/** Share of the query's keywords found in a text (5-letter stems for long words, so "pets" matches "pet"). */
export function relevance(text, q) {
  const k = keywords(q); if (!k.length) return 1;
  const t = String(text).toLowerCase();
  return k.filter((w) => t.includes(w.length >= 6 ? w.slice(0, 5) : w.replace(/s$/, ''))).length / k.length;
}
const relevant = (items, q, min = 0.5) => items.filter((i) => relevance(`${i.title} ${i.summary ?? ''}`, q) >= min);
/** A keyword must start a word ("pet" matches "pets" but not "puppet" or "carpet"). */
const wordMatch = (text, w) => new RegExp(`(^|[^a-z0-9])${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i').test(text);
// Exploit/cheat "script hubs" and executors are a common malware channel on GitHub: never a source for the studio.
export const EXPLOIT = /\b(auto ?farm|script ?hub|executor|exploit|cheat|hack|aimbot|esp\b|unlock all|free robux|keyless|injector|dupe)\b|roblox script for|\bscript\b[^.]{0,40}\b(automation|auto ?(collect|win|buy))\b/i;

export const SOURCES = {
  devforum: async (q, limit) => relevant(((await getJSON(`${API.devforum()}/search.json?q=${enc(q)}`)).topics ?? []).map((t) => ({
    title: t.title, url: `${API.devforum()}/t/${t.slug}/${t.id}`, date: (t.last_posted_at ?? t.created_at ?? '').slice(0, 10), metrics: { replies: t.reply_count ?? t.posts_count ?? 0, likes: t.like_count ?? 0 },
  })), q).slice(0, limit),
  // GitHub needs every word to match: broaden from all keywords down to the first two until something is found.
  github: async (q, limit) => {
    const k = keywords(q); const h = process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {};
    for (const words of [k, k.slice(0, 2), k.slice(0, 1)].filter((w, i, a) => w.length && a.findIndex((x) => x.join() === w.join()) === i)) {
      const items = (await getJSON(`${API.github()}/search/repositories?q=${enc(`${words.join(' ')} roblox`)}&sort=stars&order=desc&per_page=${limit}`, h)).items ?? [];
      const safe = items.filter((r) => !EXPLOIT.test(`${r.full_name} ${r.description ?? ''} ${(r.topics ?? []).join(' ')}`));
      if (safe.length) return safe.map((r) => ({ title: r.full_name, url: r.html_url, date: (r.pushed_at ?? '').slice(0, 10), summary: r.description ?? '', metrics: { stars: r.stargazers_count }, licence: r.license?.spdx_id ?? 'none', archived: !!r.archived, matched: words.join(' '),
        trust: r.stargazers_count >= 20 && r.license ? 'reusable (check licence)' : 'ideas only (few stars or no licence)' }));
    }
    return [];
  },
  // Wally searches package names: query each keyword and merge.
  wally: async (q, limit) => {
    const seen = new Map();
    for (const w of keywords(q).slice(0, 4)) for (const p of await getJSON(`${API.wally()}/v1/package-search?query=${enc(w)}`)) {
      const id = `${p.scope}/${p.name}`;
      if (!wordMatch(`${p.name.replace(/[-_]/g, ' ')} ${p.description ?? ''}`, w)) continue;
      if (!seen.has(id)) seen.set(id, { title: id, url: `https://wally.run/package/${id}`, summary: p.description ?? '', latest: (p.versions ?? [])[0] ?? null, install: `${p.name} = "${id}@${(p.versions ?? [])[0] ?? '*'}"`, matched: w });
    }
    return [...seen.values()].slice(0, limit);
  },
};

export async function research(query, { sources = Object.keys(SOURCES), limit = 10 } = {}) {
  const results = {}; const errors = [];
  await Promise.all(sources.map(async (s) => { try { results[s] = await SOURCES[s](query, limit); } catch (e) { errors.push(`${s}: ${e.message}`); results[s] = []; } }));
  return { query, generatedAt: new Date().toISOString(), results, errors };
}

export function toMarkdown(r) {
  const sect = (title, items, row) => `## ${title}\n${items.length ? items.map(row).join('\n') : '- nothing found'}\n`;
  return `# Research: ${r.query}

_Collected ${r.generatedAt.slice(0, 10)}. Leads to read, not answers: check dates (Roblox APIs change), licences and maintenance before reusing anything. Exploit/cheat repositories are filtered out; never run code from unknown repositories in your place._
${r.errors.length ? `\nUnavailable: ${r.errors.join('; ')}\n` : ''}
${sect('Developer Forum', r.results.devforum ?? [], (t) => `- [${t.title}](${t.url}) — ${t.metrics.replies} replies, last active ${t.date}`)}
${sect('Open-source projects (GitHub)', r.results.github ?? [], (g) => `- [${g.title}](${g.url}) ★${g.metrics.stars} · licence ${g.licence} · ${g.trust}${g.archived ? ' · ⚠ archived' : ''} · updated ${g.date}${g.summary ? ` — ${g.summary}` : ''}`)}
${sect('Wally packages', r.results.wally ?? [], (p) => `- [${p.title}](${p.url})${p.latest ? ` ${p.latest}` : ''}${p.summary ? ` — ${p.summary}` : ''} · \`${p.install}\``)}`;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const args = process.argv.slice(2);
  const opt = (n, d) => { const i = args.indexOf(`--${n}`); if (i < 0) return d; const v = args[i + 1]; args.splice(i, 2); return v; };
  const sources = opt('sources', Object.keys(SOURCES).join(',')).split(',').filter(Boolean);
  const limit = Number(opt('limit', 10)); const out = opt('out', 'studio/10-research'); const json = args.includes('--json');
  const q = args.filter((a) => !a.startsWith('--')).join(' ').trim();
  const bad = sources.filter((s) => !SOURCES[s]);
  if (!q || bad.length) { console.error(`usage: research.mjs "<query>" [--sources ${Object.keys(SOURCES).join(',')}] [--limit 10]${bad.length ? `\nunknown: ${bad.join(', ')}` : ''}`); process.exit(2); }
  const r = await research(q, { sources, limit });
  if (json) { console.log(JSON.stringify(r, null, 2)); process.exit(0); }
  fs.mkdirSync(out, { recursive: true });
  const file = path.join(out, `research-${q.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50)}.md`);
  fs.writeFileSync(file, toMarkdown(r));
  for (const s of sources) console.log(`${s.padEnd(9)} ${r.results[s].length} result(s)`);
  for (const e of r.errors) console.log(`unavailable: ${e}`);
  console.log(`→ ${file}`);
}
