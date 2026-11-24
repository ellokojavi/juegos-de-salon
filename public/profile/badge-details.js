/**
 * A badge's detail (lab flag `badge-details`, lab: #seccion-badge-details; the owner approved the proposal 2026-11-24):
 * a tap on a badge whose card hides something opens a sheet with what it hid (which games are left, which one is
 * in its premiere week, the month as a calendar…) and the way to earn it. Badges whose bar says it all, the secret
 * ones and a sheet that would only say «not yet» (`hasDetail`) open nothing.
 *
 * `detailOf(id, f, ctx)` is pure (node tests it): `f` the profile's facts, `ctx` `{ T, lang, games, places, general,
 * today }`. It returns `{ lead, rows: [{ label, right, href }], more, cal, note, go: [href, label] }` or null.
 */
import { weekendsOf, cupsInAWeek, SPECIALIST, EARLY_GAMES, PARTY_CUPS } from './badges.js';

export const DETAIL_FLAG = 'badge-details';
const ROWS = 6;
const DAY = 86400000;
const fmt = (s, v = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v[k] !== undefined ? v[k] : `{${k}}`));
const isoDay = ms => new Date(ms).toISOString().slice(0, 10);
const noon = d => Date.parse(`${d}T12:00:00Z`);

/** The badges that open a sheet. */
export const DETAILED = new Set(['collector', 'explorer', 'premiere', 'specialist', 'number-one', 'all-rounder',
  'streak-10', 'streak-30', 'streak-100', 'month-full', 'early-bird', 'weekends', 'mondays', 'party',
  'month-podium', 'month-champion', 'cup-podium', 'cup-champion']);

/**
 * Whether a badge opens its sheet: a sheet that would only say «not yet» (an unearned podium, a badge with no
 * progress at all) adds nothing to the card's own line, so it opens nothing (the owner, 2026-11-24).
 * Earned badges always open: they show which months, cups or days.
 */
export function hasDetail(id, got, f = {}, ctx = {}) {
  if (!DETAILED.has(id)) return false;
  if (got) return true;
  const d = detailOf(id, f, ctx);
  return !!d && !d.empty;
}

export function detailOf(id, f = {}, ctx = {}) {
  const { T, lang = 'es', games = [], places = {}, general = {}, today = f.today || isoDay(Date.now()) } = ctx;
  const D = T.detail;
  const name = g => (g.name && typeof g.name === 'object' ? g.name[lang] || g.name.es : g.name) || g.id;
  const label = g => `${g.emoji || ''} ${name(g)}`.trim();
  const href = g => `../${g.path}`;
  const date = d => new Date(noon(d)).toLocaleDateString(lang, { day: 'numeric', month: 'short', timeZone: 'UTC' });
  const place = p => (lang === 'en' ? `#${p}` : `${p}.º`);
  const list = (rows, lead, extra = {}) => ({ lead, rows: rows.slice(0, ROWS), more: rows.slice(ROWS), ...extra });
  const byId = Object.fromEntries(games.map(g => [g.id, g]));
  const counts = Object.fromEntries((f.byGame || []).map(g => [g.id, g.n]));
  const daily = ['../today/', T.dailyGo];
  switch (id) {
    case 'collector': case 'explorer': {
      const played = new Set([...(f.byGame || []).map(g => g.id), ...(f.playedIds || [])]);
      const left = games.filter(g => !played.has(g.id));
      if (!left.length) return { lead: D.allPlayed };
      return list(left.map(g => ({ label: label(g), right: D.play, href: href(g) })), fmt(left.length === 1 ? D.leftOne : D.left, { n: left.length }));
    }
    case 'premiere': {
      const now = games.filter(g => f.launches?.[g.id] && today >= f.launches[g.id] && today <= isoDay(noon(f.launches[g.id]) + 6 * DAY));
      if (!now.length) return { lead: D.noPremiere, go: ['../', T.gamesGo] };
      return list(now.map(g => {
        const left = Math.round((noon(f.launches[g.id]) + 6 * DAY - noon(today)) / DAY) + 1;
        return { label: label(g), right: left === 1 ? D.lastDay : fmt(D.daysLeft, { n: left }), href: href(g) };
      }), D.premiereNow);
    }
    case 'specialist': {
      const top = (f.byGame || []).filter(g => byId[g.id]).slice(0, 3);
      if (!top.length) return { empty: true, lead: D.noGames, go: ['../', T.gamesGo] };
      return list(top.map(g => ({ label: label(byId[g.id]), right: `${Math.min(g.n, SPECIALIST)} / ${SPECIALIST}`, href: href(byId[g.id]) })), D.mostPlayed);
    }
    case 'number-one': {
      const rows = Object.entries(places).map(([g, r]) => ({ g, p: Math.min(r.ever?.puesto || Infinity, r.week?.puesto || Infinity) }))
        .filter(x => byId[x.g] && x.p < Infinity).sort((a, b) => a.p - b.p);
      if (!rows.length) return { lead: D.noPlaces, go: ['../', T.gamesGo] };
      return list(rows.map(x => ({ label: label(byId[x.g]), right: x.p === 1 ? `🥇 ${place(1)}` : place(x.p), href: href(byId[x.g]) })), D.closest, { note: D.closestNote });
    }
    case 'all-rounder': {
      const p = general.ever;
      return { lead: Number.isInteger(p) ? fmt(D.generalAt, { place: place(p) }) : D.generalNone, note: D.generalNote, go: ['../', T.gamesGo] };
    }
    case 'streak-10': case 'streak-30': case 'streak-100': {
      const playedToday = !!f.dailyDays?.[today];
      return { lead: fmt(D.streakNow, { n: f.streak || 0, best: f.bestStreak || 0 }), note: playedToday ? D.todayDone : D.todayPending, go: playedToday ? null : daily };
    }
    case 'month-full': {
      const m = today.slice(0, 7), [y, mo] = m.split('-').map(Number);
      const len = new Date(Date.UTC(y, mo, 0)).getUTCDate();
      const first = (new Date(Date.UTC(y, mo - 1, 1)).getUTCDay() + 6) % 7; // Monday first
      const days = Array.from({ length: len }, (_, i) => {
        const d = `${m}-${String(i + 1).padStart(2, '0')}`;
        return { n: i + 1, s: f.dailyDays?.[d] ? 'on' : d < today ? 'miss' : d === today ? 'today' : 'next' };
      });
      const missed = days.filter(d => d.s === 'miss').length;
      return { lead: missed ? fmt(missed === 1 ? D.monthMissOne : D.monthMiss, { n: missed }) : D.monthOk, cal: { first, days }, go: daily };
    }
    case 'early-bird': {
      const ds = Object.entries(f.hours || {}).filter(([, h]) => (Number(h?.e) || 0) >= EARLY_GAMES).map(([d]) => d).sort().reverse();
      return dates(ds, D.earlyDays, D.earlyNone);
    }
    case 'weekends': {
      const ds = [...new Set([...(Array.isArray(f.marks?.wk) ? f.marks.wk : [])])];
      for (const d of Object.keys(f.dailyDays || {})) if (new Date(noon(d)).getUTCDay() === 6 && f.dailyDays[isoDay(noon(d) + DAY)]) ds.push(d);
      return dates([...new Set(ds)].sort().reverse(), D.weekendDays, D.weekendNone, weekendsOf(f.dailyDays, f.marks?.wk));
    }
    case 'mondays': return dates((Array.isArray(f.marks?.mon) ? [...f.marks.mon] : []).sort().reverse(), D.mondayDays, D.mondayNone);
    case 'party': {
      const now = Number(f.now) || Date.now();
      const last = (f.cupList || []).filter(c => Number(c?.at) > now - 7 * DAY).length;
      return { lead: fmt(D.partyNow, { n: last, goal: PARTY_CUPS, best: cupsInAWeek(f.cupList) }), go: ['../cup/', T.cupGo] };
    }
    // Unearned, these list nothing: only earned months count
    case 'month-podium': case 'month-champion': {
      const ms = (f.months || []).filter(x => x.place >= 1 && x.place <= (id === 'month-champion' ? 1 : 3));
      const nm = p => new Date(noon(`${p.slice(1)}-15`)).toLocaleDateString(lang, { month: 'long', year: 'numeric', timeZone: 'UTC' });
      if (!ms.length) return { empty: true, lead: D.monthsNone, go: daily };
      return list(ms.map(x => ({ label: nm(x.period), right: place(x.place) })), D.monthsWon, { go: daily });
    }
    case 'cup-podium': case 'cup-champion': {
      const ps = (f.podiums || []).filter(x => x.l >= 1 && x.l <= (id === 'cup-champion' ? 1 : 3));
      if (!ps.length) return { empty: true, lead: D.cupsNone, go: ['../cup/', T.cupGo] };
      return list(ps.map(x => ({ label: `${['', '🥇', '🥈', '🥉'][x.l]} ${x.name || x.code}`, right: x.end ? date(isoDay(x.end)) : '' })), D.cupsWon, { go: ['../cup/', T.cupGo] });
    }
    default: return null;
  }

  function dates(ds, lead, none, n = ds.length) {
    if (!ds.length) return { empty: true, lead: none, go: ['../', T.gamesGo] };
    return list(ds.map(d => ({ label: date(d), right: '✓' })), fmt(lead, { n }));
  }
}
