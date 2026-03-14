// /api/leaderboard.js — shared leaderboard via Vercel KV
// GET  /api/leaderboard         → returns all entries sorted by score desc
// POST /api/leaderboard         → body: leaderboard entry object
// DELETE /api/leaderboard       → clears all entries

const { kv } = require('@vercel/kv');

const KEY = 'wit:leaderboard';
const MAX_ENTRIES = 500;

module.exports = async function handler(req, res) {
  // Allow requests from any origin (same-site deploy, but let's be explicit)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const board = (await kv.get(KEY)) || [];
      return res.status(200).json(board);
    }

    if (req.method === 'POST') {
      const entry = req.body;
      if (!entry?.player || entry?.score === undefined) {
        return res.status(400).json({ error: 'Missing player or score' });
      }
      const board = (await kv.get(KEY)) || [];
      board.push({ ...entry, date: entry.date || Date.now() });
      board.sort((a, b) => b.score - a.score);
      await kv.set(KEY, board.slice(0, MAX_ENTRIES));
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'DELETE') {
      await kv.del(KEY);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Leaderboard error:', err);
    return res.status(500).json({ error: err.message || 'KV error' });
  }
};
