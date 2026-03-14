// /api/answers.js — player answer history for cross-device ghost mode
// GET  /api/answers?playerId=X&catId=Y  → returns answer array for that player+category
// POST /api/answers?playerId=X&catId=Y  → body: { item, guess, score } — saves one answer
//   Also writes to wit:item:{wikiTitle} reverse index so /api/ghosts can look up by item

const { kv } = require('@vercel/kv');

const MAX_ANSWERS = 500;
const MAX_ITEM_ANSWERS = 200;

const answerKey = (playerId, catId) =>
  `wit:answers:${playerId.toLowerCase().trim()}:${catId}`;

const itemKey = (title) =>
  `wit:item:${title.toLowerCase().trim()}`;

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { playerId, catId } = req.query;
  if (!playerId || !catId) {
    return res.status(400).json({ error: 'Missing playerId or catId' });
  }

  const key = answerKey(playerId, catId);

  try {
    if (req.method === 'GET') {
      const answers = (await kv.get(key)) || [];
      return res.status(200).json(answers);
    }

    if (req.method === 'POST') {
      const { item, guess, score } = req.body;
      if (!item?.name) return res.status(400).json({ error: 'Missing item.name' });

      const dedupeKey = item.wikiTitle || item.name;

      // ── 1. Write to per-player answer history ──────────────────────────────
      const answers = (await kv.get(key)) || [];
      if (!answers.some(a => (a.wikiTitle || a.name) === dedupeKey)) {
        answers.push({
          name: item.name,
          wikiTitle: item.wikiTitle || '',
          guess: guess || '',
          score: score ?? 0,
          date: Date.now(),
        });
        await kv.set(key, answers.slice(-MAX_ANSWERS));
      }

      // ── 2. Write to item reverse index (for auto-ghost lookup) ─────────────
      const iKey = itemKey(dedupeKey);
      const itemAnswers = (await kv.get(iKey)) || [];
      const playerLower = playerId.toLowerCase().trim();
      if (!itemAnswers.some(a => a.player.toLowerCase().trim() === playerLower)) {
        itemAnswers.push({
          player: playerId.trim(),
          guess: guess || '',
          score: score ?? 0,
          date: Date.now(),
        });
        await kv.set(iKey, itemAnswers.slice(-MAX_ITEM_ANSWERS));
      }

      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Answers error:', err);
    return res.status(500).json({ error: err.message || 'KV error' });
  }
};
