import { getCategoryById } from './categories';

// ── Storage ───────────────────────────────────────────────────────────────────
const KEY_SEEN        = (id) => `wit_seen_${id}`;
const KEY_SEEN_PLAYER = (playerId, catId) => `wit_seen_${playerId}_${catId}`;
const KEY_ANSWERS     = (playerId, catId) => `wit_answers_${playerId}_${catId}`;
const KEY_SOLO        = 'wit_soloStats';
const KEY_PLAYERS     = 'wit_knownPlayers';
const KEY_DIFFICULTY  = 'wit_difficulty';
const KEY_REPORTS     = 'wit_reports';
const KEY_CROPPED_BAD = 'wit_croppedBad';

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
export function clearSeen(catId) {
  Object.keys(localStorage)
    .filter(k => {
      if (!k.startsWith('wit_seen_')) return false;
      const rest = k.slice('wit_seen_'.length);
      return rest === catId || rest.endsWith(`_${catId}`);
    })
    .forEach(k => localStorage.removeItem(k));
}
export function clearAllSeen() {
  Object.keys(localStorage).filter(k => k.startsWith('wit_seen_')).forEach(k => localStorage.removeItem(k));
}

// ── Per-player seen tracking ───────────────────────────────────────────────────
export function getPlayerSeen(playerId, catId) {
  try { return JSON.parse(localStorage.getItem(KEY_SEEN_PLAYER(playerId, catId)) || '[]'); }
  catch { return []; }
}
export function addPlayerSeen(playerId, catId, names) {
  const updated = [...new Set([...getPlayerSeen(playerId, catId), ...names])].slice(-300);
  localStorage.setItem(KEY_SEEN_PLAYER(playerId, catId), JSON.stringify(updated));
}
export function countSeenForCategory(catId) {
  const allItems = new Set();
  Object.keys(localStorage)
    .filter(k => k.startsWith('wit_seen_'))
    .forEach(k => {
      const rest = k.slice('wit_seen_'.length);
      if (rest === catId || rest.endsWith(`_${catId}`)) {
        try { JSON.parse(localStorage.getItem(k) || '[]').forEach(n => allItems.add(n)); }
        catch {}
      }
    });
  return allItems.size;
}

// ── Per-player answer history (for ghost mode) ────────────────────────────────
function getLocalAnswers(playerId, catId) {
  try { return JSON.parse(localStorage.getItem(KEY_ANSWERS(playerId, catId)) || '[]'); }
  catch { return []; }
}
function setLocalAnswers(playerId, catId, answers) {
  localStorage.setItem(KEY_ANSWERS(playerId, catId), JSON.stringify(answers.slice(-500)));
}

// Save locally + fire-and-forget POST to server
export function addPlayerAnswer(playerId, catId, item, guess, score) {
  if (!playerId) return;
  const answers = getLocalAnswers(playerId, catId);
  const key = item.wikiTitle || item.name;
  if (!answers.some(a => (a.wikiTitle || a.name) === key)) {
    answers.push({ name: item.name, wikiTitle: item.wikiTitle || '', guess, score, date: Date.now() });
    setLocalAnswers(playerId, catId, answers);
  }
  // Sync to server (fire-and-forget)
  fetch(`/api/answers?playerId=${encodeURIComponent(playerId)}&catId=${encodeURIComponent(catId)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ item, guess, score }),
  }).catch(() => {}); // silently ignore if offline
}

// Fetch all players who have previously answered a specific item (auto ghost mode).
// excludePlayers: array of player names currently in the game (exclude their own answers).
// Returns [{ player, guess, score }, ...]
export async function fetchGhostsForItem(item, excludePlayers = []) {
  const wikiTitle = item.wikiTitle || item.name;
  const exclude = excludePlayers.map(p => encodeURIComponent(p)).join(',');
  try {
    const res = await fetch(
      `/api/ghosts?wikiTitle=${encodeURIComponent(wikiTitle)}&exclude=${exclude}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
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

// ── Leaderboard (server-backed, shared across devices) ────────────────────────
export async function fetchLeaderboard() {
  try {
    const res = await fetch('/api/leaderboard');
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function addLeaderboardEntry(player, score, maxPossible, questions, categoryId, difficulty = 'medium', bestStreak = 0) {
  const entry = { player, score, maxPossible, questions, categoryId, difficulty, bestStreak, date: Date.now() };
  try {
    await fetch('/api/leaderboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
  } catch {} // silently ignore if offline
}

export async function clearLeaderboard() {
  try {
    await fetch('/api/leaderboard', { method: 'DELETE' });
  } catch {}
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
const BAD_KEYWORDS = ['map', 'range', 'distribution', 'diagram', 'illustration', 'drawing',
  'sketch', 'logo', 'flag', 'coat_of_arms', 'chart', 'graph', 'blank', 'outline',
  'locator', 'location_', 'territory', 'administrative', 'silhouette'];

function isBadImage(url) {
  const u = url.toLowerCase();
  return BAD_KEYWORDS.some(k => u.includes(k));
}

async function getWikiThumbnail(wikiTitle, excludeUrl = '') {
  try {
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

// ── iNaturalist thumbnail (fallback for creature categories) ──────────────────
async function getINaturalistImage(speciesName) {
  try {
    const res = await fetch(
      `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(speciesName)}&rank=species,subspecies,genus&photos=true&per_page=3`,
      { headers: { Accept: 'application/json' } }
    );
    if (!res.ok) return '';
    const data = await res.json();
    const taxon = data.results?.[0];
    if (!taxon) return '';
    const photos = taxon.taxon_photos?.map(tp => tp.photo) || [];
    const photo = photos[0] || taxon.default_photo;
    if (!photo?.url) return '';
    return photo.url.replace('/square.', '/large.').replace('square.', 'large.');
  } catch {
    return '';
  }
}

// ── Fetch a batch of items ────────────────────────────────────────────────────
const DIFFICULTY_INSTRUCTIONS = {
  easy:   'DIFFICULTY BIAS: Generate mostly famous, well-known items that most people would recognize. At least 2 out of every 3 items should be difficulty 1. Max 1 difficulty 3 item per batch.',
  medium: 'DIFFICULTY BIAS: Mix of difficulties — roughly equal split between difficulty 1, 2, and 3.',
  hard:   'DIFFICULTY BIAS: Lean toward obscure and challenging items. At least 2 out of every 3 items should be difficulty 2 or 3.',
};

// apiKey param removed — all calls go through /api/claude server-side proxy
export async function fetchBatch(categoryId, count = 3, playerId = null) {
  const cat = getCategoryById(categoryId);
  if (!cat) throw new Error('Unknown category');

  const seen = playerId ? getPlayerSeen(playerId, categoryId) : getSeen(categoryId);
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
  "exact": ["specific correct answers — ONLY the full specific name and direct synonyms. NEVER include generic geographic or biological terms like 'island', 'lake', 'mountain', 'river', 'peninsula', 'animal', 'fish', 'bird', etc."],
  "close": ["country name", "closely related terms — nearby countries, closely related species or dish type"],
  "ballpark": ["continent", "broad category — must be genuinely vague/broad, like 'big cat' or 'reef' or 'South American food' or 'island'"],
  "imageAlt": "One sentence describing what the photo shows",
  "hints": ["vague hint", "slightly more specific", "nearly gives it away"],
  "tags": ["3-5 short descriptor chips, e.g. Mammal | Endangered | East Africa | Felidae family"],
  "funFact": "2-3 punchy sentences max. Hit: what kind of thing it is and where, one key fact about why it matters or what makes it special, and one genuinely surprising detail. No filler."
}`;

  // Call our server-side proxy instead of Anthropic directly
  const res = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || err.error || `API error ${res.status}`);
  }

  const data = await res.json();
  const raw = data.content[0].text.trim()
    .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

  const items = JSON.parse(raw);

  const INAT_CATEGORIES = ['animals'];

  const withImages = await Promise.all(
    items.map(async item => {
      let image = await getWikiThumbnail(item.wikiTitle || item.name);
      if (!image && INAT_CATEGORIES.includes(categoryId)) {
        image = await getINaturalistImage(item.name);
      }
      return { ...item, image };
    })
  );

  if (playerId) addPlayerSeen(playerId, categoryId, withImages.map(i => i.name));
  else addSeen(categoryId, withImages.map(i => i.name));
  return withImages;
}

// ── Scoring ───────────────────────────────────────────────────────────────────
// Generic geographic/biological words that should NEVER score full points alone.
// These are "ballpark" words at best, not exact answers.
const GENERIC_TERMS = new Set([
  'island', 'islands', 'lake', 'river', 'mountain', 'mountains', 'volcano',
  'ocean', 'sea', 'bay', 'gulf', 'peninsula', 'plateau', 'desert', 'forest',
  'waterfall', 'canyon', 'valley', 'beach', 'reef', 'cave', 'glacier',
  'animal', 'fish', 'bird', 'mammal', 'reptile', 'insect', 'plant', 'tree',
  'flower', 'snake', 'cat', 'dog', 'bear', 'deer', 'monkey', 'frog',
  'food', 'dish', 'bread', 'meat', 'soup', 'rice', 'noodle', 'curry',
  'castle', 'church', 'temple', 'bridge', 'tower', 'palace', 'fort',
  'city', 'town', 'village', 'country', 'continent',
]);

function isGeneric(word) {
  return GENERIC_TERMS.has(word.toLowerCase().trim());
}

export function scoreGuess(guess, item) {
  const g = guess.toLowerCase().trim();
  if (!g) return 0;

  // A guess word is "too generic" if it's a single generic term — block it from exact matches
  const gWords = g.split(/\s+/);
  const guessIsGeneric = gWords.length === 1 && isGeneric(gWords[0]);

  // Match helper: guess fully contains the answer term (always OK if not generic),
  // OR the answer contains the guess — only if guess is ≥5 chars AND not a generic term.
  const check = (arr) => (arr || []).some(a => {
    const al = a.toLowerCase();
    if (g.includes(al)) return true;                                        // guess contains the full answer term
    if (al.includes(g) && g.length >= 5 && !guessIsGeneric) return true;   // answer contains the guess (but must be specific)
    return false;
  });

  const countryMatch = item.country && g.includes(item.country.toLowerCase());
  const subjectMatch = item.subject && g.includes(item.subject.toLowerCase())
    && guess.trim().length >= 5 && !guessIsGeneric;

  // 3 pts — nailed it
  if (check(item.exact) || countryMatch || subjectMatch) return 3;

  // 2 pts — close
  if (check(item.close)) return 2;

  // 1 pt — ballpark (generic terms like "island", "lake" can score here)
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
