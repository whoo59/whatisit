// /api/ghosts.js — auto ghost mode: returns all players who answered a given item
// GET /api/ghosts?wikiTitle=...&name=...&exclude=Player1,Player2
//   wikiTitle or name identifies the item
//   exclude is comma-separated list of player names to hide (current game players)

const { kv } = require('@vercel/kv');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { wikiTitle, name, exclude } = req.query;
  const key = (wikiTitle || name || '').trim();
  if (!key) return res.status(400).json({ error: 'Missing wikiTitle or name' });

  const excludeList = exclude
    ? exclude.split(',').map(s => s.toLowerCase().trim()).filter(Boolean)
    : [];

  const itemKey = `wit:item:${key.toLowerCase()}`;

  try {
    const answers = (await kv.get(itemKey)) || [];
    const filtered = answers.filter(a =>
      a.player && !excludeList.includes(a.player.toLowerCase().trim())
    );
    return res.status(200).json(filtered);
  } catch (err) {
    console.error('Ghosts error:', err);
    return res.status(500).json({ error: err.message || 'KV error' });
  }
};
