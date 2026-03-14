import { getCategoryById } from './categories';

// ── Storage ───────────────────────────────────────────────────────────────────
const KEY_API         = 'wit_apiKey';
const KEY_SEEN        = (id) => `wit_seen_${id}`;
const KEY_SOLO        = 'wit_soloStats';
const KEY_PLAYERS     = 'wit_knownPlayers';
const KEY_LEADERBOARD = 'wit_leaderboard';
const KEY_DIFFICULTY  = 'wit_difficulty';
const KEY_REPORTS     = 'wit_reports';
const KEY_CROPPED_BAD = 'wit_croppedBad';

export const getApiKey   = () => localStorage.getItem(KEY_API) || '';
export const saveApiKey  = (k) => localStorage.setItem(KEY_API, k);
export const clearApiKey = () => localStorage.removeItem(KEY_API);

// ── Player name memory ────────────────────────────────────────────────────────
export function getKnownPlayers() {
  try { return JSON.parse(localStorage.getItem(KEY_PLAYERS) || '[]'); }
  catch { return []; }
}
export function savePlayerName(name) {
  if (!name?.trim()) return;
  const current = getKnownPlayers();
  const updated = [...new Set([name.trim(), ...current])].slice(0, 20);
  localStorage.setItem(KEY_PLAYERS, JSON.stringify(updated));
}

// ── Seen tracking ─────────────────────────────────────────────────────────────
export function getSeen(catId) {
  try { return JSON.parse(localStorage.getItem(KEY_SEEN(catId)) || '[]'); }
  catch { return []; }
}
export function addSeen(catId, names) {
  const updated = [...new Set([...getSeen(catId), ...names])].slice(-300);
  localStorage.setItem(KEY_SEEN(catId), JSON.stringify(updated));
}
export function clearSeen(catId) { localStorage.removeItem(KEY_SEEN(catId)); }
export function clearAllSeen() {
  Object.keys(localStorage).filter(k => k.startsWith('wit_seen_')).forEach(k => localStorage.removeItem(k));
}

// ── Solo stats ────────────────────────────────────────────────────────────────
export function getSoloStats() {
  try { return JSON.parse(localStorage.getItem(KEY_SOLO) || '{}'); }
  catch { return {}; }
}
export function updateSoloStats(catId, score, maxPossible) {
  const stats = getSoloStats();
  const cat = stats[catId] || { highScore: 0, gamesPlayed: 0, totalCorrect: 0, totalMax: 0 };
  cat.highScore    = Math.max(cat.highScore, score);
  cat.gamesPlayed += 1;
  cat.totalCorrect += score;
  cat.totalMax    += maxPossible;
  stats[catId] = cat;
  localStorage.setItem(KEY_SOLO, JSON.stringify(stats));
  return stats[catId];
}

// ── Leaderboard ───────────────────────────────────────────────────────────────
export function getLeaderboard() {
  try { return JSON.parse(localStorage.getItem(KEY_LEADERBOARD) || '[]'); }
  catch { return []; }
}
export function addLeaderboardEntry(player, score, maxPossible, questions, categoryId, difficulty = 'medium') {
  const board = getLeaderboard();
  board.push({ player, score, maxPossible, questions, categoryId, difficulty, date: Date.now() });
  localStorage.setItem(KEY_LEADERBOARD, JSON.stringify(board.slice(-200)));
}
export function clearLeaderboard() {
  localStorage.removeItem(KEY_LEADERBOARD);
}

// ── Difficulty ────────────────────────────────────────────────────────────────
export const getDifficulty = () => localStorage.getItem(KEY_DIFFICULTY) || 'medium';
export const setDifficulty = (d) => localStorage.setItem(KEY_DIFFICULTY, d);

// ── Reports (never cleared with history resets) ───────────────────────────────
export function getReports() {
  try { return JSON.parse(localStorage.getItem(KEY_REPORTS) || '[]'); }
  catch { return []; }
}
export function addReport(item, reason, note = '') {
  const reports = getReports();
  reports.push({ name: item.name, wikiTitle: item.wikiTitle, reason, note, date: Date.now() });
  localStorage.setItem(KEY_REPORTS, JSON.stringify(reports.slice(-500)));
}
export function getReportedNames() {
  return getReports().map(r => r.name);
}

// ── Badly cropped images (never cleared) ──────────────────────────────────────
export function getCroppedBadUrls() {
  try { return JSON.parse(localStorage.getItem(KEY_CROPPED_BAD) || '[]'); }
  catch { return []; }
}
export function addCroppedBadUrl(url) {
  if (!url) return;
  const list = getCroppedBadUrls();
  if (!list.includes(url)) {
    list.push(url);
    localStorage.setItem(KEY_CROPPED_BAD, JSON.stringify(list.slice(-500)));
  }
}

// ── Wikipedia thumbnail ───────────────────────────────────────────────────────
// Exported so GameScreen can fetch a replacement after a bad-photo report
const BAD_KEYWORDS = ['map', 'range', 'distribution', 'diagram', 'illustration', 'drawing',
  'sketch', 'logo', 'flag', 'coat_of_arms', 'chart', 'graph', 'blank', 'outline',
  'locator', 'location_', 'territory', 'administrative', 'silhouette'];

function isBadImage(url) {
  const u = url.toLowerCase();
  return BAD_KEYWORDS.some(k => u.includes(k));
}

async function getWikiThumbnail(wikiTitle, excludeUrl = '') {
  try {
    // Try media-list first to find a real photo
    const mediaRes = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/media-list/${encodeURIComponent(wikiTitle)}`,
      { headers: { Accept: 'application/json' } }
    );
    if (mediaRes.ok) {
      const mediaData = await mediaRes.json();
      const images = (mediaData.items || []).filter(item => {
        if (item.type !== 'image') return false;
        const title = (item.title || '').toLowerCase();
        if (!title.match(/\.(jpg|jpeg|png|webp)$/i)) return false;
        return !isBadImage(title);
      });
      for (const img of images) {
        const srcset = img.srcset || [];
        const best = srcset[srcset.length - 1]?.src || srcset[0]?.src;
        if (best && !isBadImage(best)) {
          const url = best.startsWith('//') ? 'https:' + best : best;
          const final = `https://images.weserv.nl/?url=${url.replace('https://', '')}&w=800`;
          if (excludeUrl && final === excludeUrl) continue;
          return final;
        }
      }
    }

    // Fall back to summary thumbnail
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiTitle)}`,
      { headers: { Accept: 'application/json' } }
    );
    if (!res.ok) return '';
    const data = await res.json();
    const src = data.originalimage?.source || data.thumbnail?.source || '';
    if (!src || isBadImage(src)) return '';
    const final = `https://images.weserv.nl/?url=${src.replace('https://', '')}&w=800`;
    if (excludeUrl && final === excludeUrl) return '';
    return final;
  } catch {
    return '';
  }
}

export async function fetchFreshImage(wikiTitle, excludeUrl = '') {
  return getWikiThumbnail(wikiTitle, excludeUrl);
}

// ── Fetch a batch of items ────────────────────────────────────────────────────
const DIFFICULTY_INSTRUCTIONS = {
  easy:   'DIFFICULTY BIAS: Generate mostly famous, well-known items that most people would recognize. At least 2 out of every 3 items should be difficulty 1. Max 1 difficulty 3 item per batch.',
  medium: 'DIFFICULTY BIAS: Mix of difficulties — roughly equal split between difficulty 1, 2, and 3.',
  hard:   'DIFFICULTY BIAS: Lean toward obscure and challenging items. At least 2 out of every 3 items should be difficulty 2 or 3.',
};

export async function fetchBatch(apiKey, categoryId, count = 3) {
  const cat = getCategoryById(categoryId);
  if (!cat) throw new Error('Unknown category');

  const seen = getSeen(categoryId);
  const reported = getReportedNames();
  const blocklist = [...new Set([...seen.slice(-80), ...reported])];
  const seenNote = blocklist.length > 0
    ? `\n\nCRITICAL: Do NOT include any of these items: ${blocklist.join(', ')}.`
    : '';

  const difficultyNote = '\n\n' + (DIFFICULTY_INSTRUCTIONS[getDifficulty()] || DIFFICULTY_INSTRUCTIONS.medium);

  const prompt = cat.prompt.replace('{count}', count) + seenNote + difficultyNote + `

Respond with ONLY a valid JSON array. No markdown, no explanation, no code fences. Each object must have EXACTLY these keys:
{
  "name": "Display name shown after reveal",
  "wikiTitle": "Exact Wikipedia article title (e.g. 'Machu_Picchu', 'Snow_leopard', 'Injera')",
  "country": "Country or region",
  "region": "One of: Europe / Asia / North America / South America / Africa / Oceania / Middle East / Ocean",
  "subject": "What players are guessing",
  "difficulty": 1,
  "exact": ["specific correct answers", "exact name", "common alternate names"],
  "close": ["country name", "closely related terms", "near-correct answers"],
  "ballpark": ["continent", "broad category", "vague but related terms"],
  "imageAlt": "One sentence describing what the photo shows",
  "hints": ["vague hint", "slightly more specific", "more specific", "nearly gives it away"],
  "funFact": "2-3 sentence genuinely surprising fact."
}`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `API error ${res.status}`);
  }

  const data = await res.json();
  const raw = data.content[0].text.trim()
    .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

  const items = JSON.parse(raw);

  // Fetch real Wikipedia thumbnails for each item
  const withImages = await Promise.all(
    items.map(async item => ({
      ...item,
      image: await getWikiThumbnail(item.wikiTitle || item.name),
    }))
  );

  addSeen(categoryId, withImages.map(i => i.name));
  return withImages;
}

// ── Scoring ───────────────────────────────────────────────────────────────────
export function scoreGuess(guess, item) {
  const g = guess.toLowerCase().trim();
  if (!g) return 0;

  const check = (arr) => (arr || []).some(a => {
    const al = a.toLowerCase();
    return g.includes(al) || al.includes(g);
  });

  // 3 pts — nailed it
  if (check(item.exact)
    || (item.country && g.includes(item.country.toLowerCase()))
    || (item.subject && g.includes(item.subject.toLowerCase()))) return 3;

  // 2 pts — close
  if (check(item.close)) return 2;

  // 1 pt — ballpark
  if (check(item.ballpark)) return 1;

  const regionMap = {
    'Europe':        ['europe','european'],
    'Asia':          ['asia','asian'],
    'South America': ['south america','latin america','latin'],
    'North America': ['north america','america','american'],
    'Africa':        ['africa','african'],
    'Oceania':       ['oceania','pacific','australia'],
    'Middle East':   ['middle east','arab'],
    'Ocean':         ['ocean','sea','marine','deep sea'],
  };
  if ((regionMap[item.region] || []).some(t => g.includes(t))) return 1;

  return 0;
}

export function maxPoints() {
  return 3;
}
