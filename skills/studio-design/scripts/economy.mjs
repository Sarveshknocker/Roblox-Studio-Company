#!/usr/bin/env node
// Roblox Studio Company — economy & progression simulator (zero dependencies, Node >= 18).
//
//   node economy.mjs studio/02-design/economy.json [--days 14] [--out studio/02-design] [--json] [--strict]
//
// Simulates a free player and a paying player (all passes owned) minute by minute across sessions: income from
// sources (scaled by level and upgrades), XP and levels, buying every affordable unlock (cheapest first), and reports
// time-to-unlock, dead zones, inflation, content runway and what each Robux product is worth in play time.
// Format: skills/studio-design/references/economy-design.md. Exit 1 with --strict when any warning is raised.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export function validate(cfg) {
  const errors = [];
  if (!Array.isArray(cfg.currencies) || !cfg.currencies.length) errors.push('currencies: list at least one currency');
  const cur = new Set(cfg.currencies ?? []);
  if (!(cfg.sessionMinutes > 0)) errors.push('sessionMinutes must be > 0');
  for (const s of cfg.sources ?? []) { if (!cur.has(s.currency)) errors.push(`source ${s.id}: unknown currency ${s.currency}`); if (!(s.perMinute > 0) && !(s.perSession > 0)) errors.push(`source ${s.id}: needs perMinute or perSession`); }
  const ids = new Set();
  for (const u of cfg.unlocks ?? []) { if (ids.has(u.id)) errors.push(`unlock ${u.id}: duplicate id`); ids.add(u.id); if (!cur.has(u.currency)) errors.push(`unlock ${u.id}: unknown currency ${u.currency}`); if (!(u.price > 0)) errors.push(`unlock ${u.id}: price must be > 0`); }
  for (const r of cfg.robux ?? []) {
    if (!['product', 'pass'].includes(r.kind)) errors.push(`robux ${r.id}: kind must be product or pass`);
    if (!(r.robux > 0)) errors.push(`robux ${r.id}: robux price must be > 0`);
    // A product that grants an unknown currency can never be delivered in game (Purchases refuses it).
    for (const [c, n] of Object.entries(r.grants ?? {})) { if (!cur.has(c)) errors.push(`robux ${r.id}: grants unknown currency ${c}`); if (!(n > 0)) errors.push(`robux ${r.id}: grant of ${c} must be > 0`); }
    for (const c of Object.keys(r.effect?.multiplier ?? {})) if (!cur.has(c)) errors.push(`robux ${r.id}: multiplier for unknown currency ${c}`);
  }
  if (cfg.levels && !(cfg.levels.base > 0 && cfg.levels.exponent > 0)) errors.push('levels: base and exponent must be > 0');
  return errors;
}

/** XP needed to go from level L to L+1. */
export const xpToNext = (lv, levels) => levels.base * Math.pow(lv, levels.exponent);

export function simulate(cfg, { days = 14, paying = false } = {}) {
  const sessions = Math.max(1, Math.round(days * (cfg.sessionsPerDay ?? 1)));
  const passMult = Object.fromEntries(cfg.currencies.map((c) => [c, 1]));
  if (paying) for (const r of cfg.robux ?? []) if (r.kind === 'pass') for (const [c, m] of Object.entries(r.effect?.multiplier ?? {})) passMult[c] *= m;
  const bal = Object.fromEntries(cfg.currencies.map((c) => [c, 0]));
  const earned = Object.fromEntries(cfg.currencies.map((c) => [c, 0]));
  const owned = new Set(); const events = []; const levelTimes = [];
  let level = 1; let xp = 0; let minute = 0; let incomeBonus = 0;
  const pending = () => (cfg.unlocks ?? []).filter((u) => !owned.has(u.id)).sort((a, b) => a.price - b.price);
  const dayOf = (m) => Math.floor(m / (cfg.sessionMinutes * (cfg.sessionsPerDay ?? 1))) + 1;
  const samples = [];
  for (let s = 0; s < sessions; s++) {
    for (const src of cfg.sources ?? []) if (src.perSession) { const g = src.perSession * passMult[src.currency]; bal[src.currency] += g; earned[src.currency] += g; }
    for (let i = 0; i < cfg.sessionMinutes; i++) {
      minute++;
      for (const src of cfg.sources ?? []) {
        if (!src.perMinute) continue;
        const g = src.perMinute * (1 + (src.growthPerLevel ?? 0) * (level - 1)) * (1 + incomeBonus) * passMult[src.currency];
        bal[src.currency] += g; earned[src.currency] += g;
      }
      if (cfg.levels) {
        xp += cfg.levels.xpPerMinute ?? 0;
        while (level < (cfg.levels.max ?? Infinity) && xp >= xpToNext(level, cfg.levels)) { xp -= xpToNext(level, cfg.levels); level++; levelTimes.push({ level, minute }); }
      }
      for (const u of pending()) {
        if ((u.level ?? 1) <= level && bal[u.currency] >= u.price) { bal[u.currency] -= u.price; owned.add(u.id); incomeBonus += u.effect?.income ?? 0; events.push({ id: u.id, minute, day: dayOf(minute), level }); }
      }
      if (minute % cfg.sessionMinutes === 0) samples.push({ minute, level, ...Object.fromEntries(cfg.currencies.map((c) => [c, Math.round(bal[c])])) });
    }
  }
  return { paying, minutes: minute, level, balances: bal, earned, events, levelTimes, unowned: pending().map((u) => u.id), samples };
}

export function analyse(cfg, opts = {}) {
  const errors = validate(cfg);
  if (errors.length) return { errors };
  const days = opts.days ?? 14;
  const free = simulate(cfg, { days }); const paid = simulate(cfg, { days, paying: true });
  const t = { allContentDays: 14, maxDeadZoneMinutes: 15, firstUnlockMinutes: 3, ...cfg.targets };
  const warnings = [];
  const first = free.events[0];
  if (!first) warnings.push('No unlock is reachable at all in the simulated period.');
  else if (first.minute > t.firstUnlockMinutes) warnings.push(`First unlock after ${first.minute} min (target ≤ ${t.firstUnlockMinutes}): new players may leave before their first reward.`);
  let worst = { gap: 0, after: null };
  for (let i = 1; i < free.events.length; i++) { const gap = free.events[i].minute - free.events[i - 1].minute; if (gap > worst.gap) worst = { gap, after: free.events[i - 1].id, next: free.events[i].id }; }
  if (worst.gap > t.maxDeadZoneMinutes) warnings.push(`Dead zone: ${worst.gap} min of play between "${worst.after}" and "${worst.next}" with nothing new (target ≤ ${t.maxDeadZoneMinutes}).`);
  const lastDay = (r) => (r.unowned.length ? null : r.events[r.events.length - 1]?.day);
  if (lastDay(free) !== null && lastDay(free) < t.allContentDays) warnings.push(`Free players own all content by day ${lastDay(free)} (target ${t.allContentDays}): add content or raise prices.`);
  if (lastDay(paid) !== null && lastDay(paid) < Math.ceil(t.allContentDays / 3)) warnings.push(`Paying players own all content by day ${lastDay(paid)}: passes compress the game too much.`);
  for (const c of cfg.currencies) {
    const sinksLeft = (cfg.unlocks ?? []).some((u) => u.currency === c && free.unowned.includes(u.id));
    const hasSinks = (cfg.unlocks ?? []).some((u) => u.currency === c);
    if (!hasSinks && free.earned[c] > 0) warnings.push(`${c} has sources but no sinks: it will pile up (inflation). Add things to spend it on.`);
    else if (!sinksLeft && free.balances[c] > 0) warnings.push(`${c}: nothing left to buy after the last unlock; ${Math.round(free.balances[c]).toLocaleString('en-US')} ${c} piles up by the end (inflation).`);
  }
  for (const r of cfg.robux ?? []) if (r.effect?.competitive || r.competitive) warnings.push(`Robux ${r.kind} "${r.id}" affects PvP or leaderboards (pay-to-win): reconsider, or keep it out of competitive modes.`);
  // What each Robux product is worth in minutes of free play (average income over the simulation).
  const perMinute = (c) => free.minutes ? free.earned[c] / free.minutes : 0;
  const robux = (cfg.robux ?? []).map((r) => {
    if (r.kind === 'product') {
      const mins = Object.entries(r.grants ?? {}).reduce((s, [c, n]) => s + (perMinute(c) ? n / perMinute(c) : 0), 0);
      if (mins && mins < 2) warnings.push(`Product "${r.id}" is worth under 2 minutes of play for ${r.robux} Robux: players will feel cheated.`);
      if (mins > free.minutes / 2) warnings.push(`Product "${r.id}" is worth ${Math.round(mins)} min of play, more than half of the simulated game: it skips the progression.`);
      return { id: r.id, kind: r.kind, robux: r.robux, playMinutes: Math.round(mins), robuxPerHour: mins ? Math.round((r.robux / mins) * 60) : null };
    }
    return { id: r.id, kind: r.kind, robux: r.robux, effect: r.effect, contentDaysPaying: lastDay(paid) };
  });
  return { name: cfg.name ?? 'economy', days, targets: t, free, paid, robux, warnings, errors: [] };
}

export function toMarkdown(a) {
  const fmt = (m) => (m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`);
  const both = new Map(a.free.events.map((e) => [e.id, { free: e }]));
  for (const e of a.paid.events) both.set(e.id, { ...(both.get(e.id) ?? {}), paid: e });
  const levels = a.free.levelTimes.filter((l) => l.level % 5 === 0 || l.level <= 3);
  return `# Economy report: ${a.name}

_${a.days} simulated days · ${a.free.minutes} play minutes · free player vs paying player (all passes)._

${a.warnings.length ? `## Warnings (${a.warnings.length})\n${a.warnings.map((w) => `- ${w}`).join('\n')}` : '## Warnings\nNone: the economy meets its targets.'}

## Unlock timeline
| Unlock | Free: play time | Free: day | Free: level | Paying: play time |
|---|---|---|---|---|
${[...both].map(([id, v]) => `| ${id} | ${v.free ? fmt(v.free.minute) : 'not reached'} | ${v.free?.day ?? '—'} | ${v.free?.level ?? '—'} | ${v.paid ? fmt(v.paid.minute) : 'not reached'} |`).join('\n')}
${a.free.unowned.length ? `\nNot reached by free players within ${a.days} days: ${a.free.unowned.join(', ')} (fine for long-term goals; check it is intended).\n` : ''}
## Levels (free player)
| Level | Reached after |
|---|---|
${levels.map((l) => `| ${l.level} | ${fmt(l.minute)} |`).join('\n') || '| — | no level-ups |'}

## Robux offers
| Offer | Kind | Robux | Worth (free play) | Robux per hour of play saved |
|---|---|---|---|---|
${a.robux.map((r) => `| ${r.id} | ${r.kind} | ${r.robux} | ${r.kind === 'product' ? fmt(r.playMinutes) : `paying players finish content by day ${r.contentDaysPaying ?? 'not within the simulation'}`} | ${r.robuxPerHour ?? '—'} |`).join('\n') || '| — | | | | |'}

## End balances (free player)
${Object.entries(a.free.balances).map(([c, v]) => `- ${c}: ${Math.round(v).toLocaleString('en-US')} (earned ${Math.round(a.free.earned[c]).toLocaleString('en-US')})`).join('\n')}

Model: one player who buys every affordable unlock (cheapest first) as soon as their level allows it. Real players are
slower and less optimal; treat these as best-case times and confirm with playtests and analytics.
`;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const args = process.argv.slice(2);
  const opt = (n, d) => { const i = args.indexOf(`--${n}`); if (i < 0) return d; const v = args[i + 1]; args.splice(i, 2); return v; };
  const days = Number(opt('days', 14)); const outDir = opt('out', null); const json = args.includes('--json'); const strict = args.includes('--strict');
  const file = args.find((x) => !x.startsWith('--')) ?? 'studio/02-design/economy.json';
  let cfg;
  try { cfg = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { console.error(`Cannot read ${file}: ${e.message}`); process.exit(2); }
  const a = analyse(cfg, { days });
  if (a.errors.length) { for (const e of a.errors) console.error(`✖ ${e}`); process.exit(2); }
  const out = outDir ?? path.dirname(file);
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, 'ECONOMY_REPORT.md'), toMarkdown(a));
  if (json) console.log(JSON.stringify({ warnings: a.warnings, robux: a.robux, free: { events: a.free.events, level: a.free.level }, paid: { events: a.paid.events } }, null, 2));
  else {
    console.log(`Simulated ${a.days} days (${a.free.minutes} play minutes). Free player: level ${a.free.level}, ${a.free.events.length}/${(cfg.unlocks ?? []).length} unlocks. Paying: ${a.paid.events.length}.`);
    for (const w of a.warnings) console.log(`⚠ ${w}`);
    console.log(`→ ${path.join(out, 'ECONOMY_REPORT.md')}`);
  }
  process.exit(strict && a.warnings.length ? 1 : 0);
}
