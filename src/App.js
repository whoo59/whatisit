import { useState, useEffect, useRef, useCallback } from 'react';
import { CATEGORIES, getCategoryById } from './categories';
import {
  getApiKey, saveApiKey, clearApiKey,
  getSeen, clearSeen, clearAllSeen,
  getSoloStats, updateSoloStats,
  getKnownPlayers, savePlayerName,
  fetchBatch, scoreGuess, maxPoints,
  getLeaderboard, addLeaderboardEntry, clearLeaderboard,
  getDifficulty, setDifficulty,
  addReport,
} from './gameService';

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  bg: '#07090f', bg2: '#0e1420', bg3: '#111827',
  border: '#1e2535', border2: '#2d3748',
  text: '#ede8dc', muted: '#7a7670', dim: '#4b5563',
  font: "'Palatino Linotype','Book Antiqua',Palatino,serif",
};
const PC = ['#f59e0b', '#ec4899', '#3b82f6', '#10b981'];

function Spinner({ color = '#f59e0b', size = 36 }) {
  return <div style={{ width: size, height: size, border: `2px solid ${T.border}`, borderTopColor: color, borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto' }} />;
}

function Btn({ color = '#f59e0b', fill = false, onClick, children, style = {}, disabled = false, block = false }) {
  const [h, setH] = useState(false);
  return (
    <button disabled={disabled} onClick={onClick}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        background: (h && !fill) ? color : fill ? color : 'transparent',
        border: `1px solid ${color}`,
        color: (h && !fill) ? T.bg : fill ? T.bg : color,
        padding: '12px 28px', fontSize: 11, letterSpacing: 4,
        textTransform: 'uppercase', cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: T.font, transition: 'all .2s', borderRadius: 3,
        fontWeight: fill ? 'bold' : 'normal', opacity: disabled ? 0.4 : 1,
        width: block ? '100%' : undefined, ...style
      }}>
      {children}
    </button>
  );
}

const lbl = { fontSize: 11, letterSpacing: 5, textTransform: 'uppercase', color: '#f59e0b' };

// ── REPORT MODAL ──────────────────────────────────────────────────────────────
const REPORT_REASONS = [
  'Wrong image for this item',
  'Image won\'t load / broken link',
  'Text or watermark covering photo',
  'Inappropriate or offensive content',
  'Other',
];

function ReportModal({ item, onClose, onSubmit }) {
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [done, setDone] = useState(false);

  const submit = () => {
    if (!reason) return;
    onSubmit(reason, note);
    setDone(true);
    setTimeout(onClose, 1400);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}>
      <div style={{ background: T.bg2, border: `1px solid ${T.border2}`, borderRadius: 6, padding: '24px 22px', maxWidth: 420, width: '100%' }}>
        {done ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>✓</div>
            <div style={{ color: '#4ade80', fontSize: 15 }}>Thanks for the report!</div>
          </div>
        ) : (
          <>
            <div style={lbl}>Report Bad Photo</div>
            <div style={{ color: T.text, fontSize: 15, margin: '6px 0 18px', fontFamily: T.font }}>"{item?.name}"</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 16 }}>
              {REPORT_REASONS.map(r => (
                <div key={r} onClick={() => setReason(r)}
                  style={{ padding: '10px 13px', border: `1px solid ${reason === r ? '#f59e0b' : T.border}`, borderRadius: 3, cursor: 'pointer', background: reason === r ? '#f59e0b12' : 'transparent', color: reason === r ? '#f59e0b' : T.muted, fontSize: 13, transition: 'all .15s' }}>
                  {reason === r ? '◉' : '○'} {r}
                </div>
              ))}
            </div>
            {reason === 'Other' && (
              <textarea value={note} onChange={e => setNote(e.target.value)}
                placeholder="Describe the issue..."
                rows={2}
                style={{ width: '100%', background: T.bg3, border: `1px solid ${T.border2}`, color: T.text, padding: '9px 11px', fontSize: 13, borderRadius: 3, fontFamily: T.font, outline: 'none', resize: 'none', marginBottom: 12, boxSizing: 'border-box' }} />
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
              <Btn color={T.border2} onClick={onClose} style={{ padding: '8px 18px' }}>Cancel</Btn>
              <Btn fill color='#ef4444' onClick={submit} disabled={!reason} style={{ padding: '8px 18px' }}>Submit</Btn>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// API KEY SETUP
// ─────────────────────────────────────────────────────────────────────────────
function SetupScreen({ onSave }) {
  const [key, setKey] = useState('');
  const [err, setErr] = useState('');
  const save = () => {
    if (!key.trim().startsWith('sk-ant-')) { setErr('Should start with sk-ant-'); return; }
    saveApiKey(key.trim()); onSave(key.trim());
  };
  return (
    <div style={{ textAlign: 'center', maxWidth: 460, margin: '0 auto', padding: 20 }}>
      <div style={lbl}>One-time Setup</div>
      <h1 style={{ fontSize: 'clamp(32px,6vw,56px)', fontWeight: 400, letterSpacing: -2, margin: '8px 0 14px', fontFamily: T.font }}>WHAT IS THAT?!</h1>
      <p style={{ color: T.muted, fontSize: 15, lineHeight: 1.75, fontStyle: 'italic', marginBottom: 22 }}>
        Get your API key at <strong style={{ color: T.text, fontStyle: 'normal' }}>console.anthropic.com</strong>
      </p>
      <input value={key} onChange={e => { setKey(e.target.value); setErr(''); }}
        onKeyDown={e => e.key === 'Enter' && save()}
        placeholder="sk-ant-api03-..."
        style={{ width: '100%', background: T.bg3, border: `1px solid ${T.border2}`, color: T.text, padding: '12px 14px', fontSize: 14, borderRadius: 3, fontFamily: 'monospace', outline: 'none', marginBottom: err ? 8 : 14, boxSizing: 'border-box' }} />
      {err && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 10 }}>{err}</p>}
      <Btn fill onClick={save}>Start Playing</Btn>
      <p style={{ color: T.dim, fontSize: 12, marginTop: 12 }}>~$0.01 per game session</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HOME
// ─────────────────────────────────────────────────────────────────────────────
function HomeScreen({ onSelect, onSettings, onLeaderboard }) {
  const stats = getSoloStats();
  const topScores = getLeaderboard().sort((a, b) => b.score - a.score).slice(0, 3);
  return (
    <div style={{ width: '100%', maxWidth: 780, position: 'relative', zIndex: 1 }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={lbl}>A Guessing Game</div>
        <h1 style={{ fontSize: 'clamp(36px,7vw,62px)', fontWeight: 400, letterSpacing: -2, margin: '6px 0 8px', fontFamily: T.font }}>WHAT IS THAT?!</h1>
        <p style={{ color: T.muted, fontStyle: 'italic', fontSize: 14 }}>Pick a category to start 🤯</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 11, marginBottom: 20 }}>
        {CATEGORIES.map(cat => {
          const seen = getSeen(cat.id).length;
          const s = stats[cat.id];
          return (
            <div key={cat.id} onClick={() => onSelect(cat.id)}
              style={{ padding: '16px 12px', border: `1px solid ${cat.color}28`, borderRadius: 6, background: `${cat.color}07`, cursor: 'pointer', transition: 'all .2s', textAlign: 'center' }}
              onMouseEnter={e => { e.currentTarget.style.border = `1px solid ${cat.color}70`; e.currentTarget.style.background = `${cat.color}12`; }}
              onMouseLeave={e => { e.currentTarget.style.border = `1px solid ${cat.color}28`; e.currentTarget.style.background = `${cat.color}07`; }}>
              <div style={{ fontSize: 30, marginBottom: 5 }}>{cat.emoji}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 3 }}>{cat.name}</div>
              <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.4, marginBottom: 6 }}>{cat.description}</div>
              {s && <div style={{ fontSize: 10, color: cat.color, letterSpacing: 2 }}>BEST: {s.highScore}pts</div>}
              {seen > 0 && <div style={{ fontSize: 10, color: T.dim, marginTop: 2 }}>{seen} seen</div>}
            </div>
          );
        })}
      </div>
      {/* Mini leaderboard */}
      {topScores.length > 0 && (
        <div style={{ marginBottom: 16, padding: '12px 16px', border: `1px solid ${T.border}`, borderRadius: 6, background: T.bg2 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', color: '#f59e0b' }}>🏆 Top Scores</div>
            <button onClick={onLeaderboard} style={{ background: 'none', border: 'none', color: T.dim, fontSize: 10, cursor: 'pointer', letterSpacing: 2, textTransform: 'uppercase' }}>See All →</button>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {topScores.map((e, i) => {
              const cat = getCategoryById(e.categoryId);
              const medals = ['🥇','🥈','🥉'];
              return (
                <div key={i} style={{ flex: 1, textAlign: 'center', padding: '8px 6px', borderRadius: 4, background: `${T.bg3}` }}>
                  <div style={{ fontSize: 16 }}>{medals[i]}</div>
                  <div style={{ fontSize: 13, color: T.text, fontFamily: T.font, marginTop: 2 }}>{e.player}</div>
                  <div style={{ fontSize: 18, fontWeight: 300, fontFamily: T.font, color: '#f59e0b' }}>{e.score}</div>
                  <div style={{ fontSize: 10, color: T.dim }}>{cat?.emoji} {cat?.name}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ textAlign: 'center', display: 'flex', gap: 20, justifyContent: 'center' }}>
        {topScores.length === 0 && <button onClick={onLeaderboard} style={{ background: 'none', border: 'none', color: T.dim, fontSize: 11, cursor: 'pointer', letterSpacing: 3, textTransform: 'uppercase' }}>🏆 Leaderboard</button>}
        <button onClick={onSettings} style={{ background: 'none', border: 'none', color: T.dim, fontSize: 11, cursor: 'pointer', letterSpacing: 3, textTransform: 'uppercase' }}>⚙ Settings</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LEADERBOARD
// ─────────────────────────────────────────────────────────────────────────────
function LeaderboardScreen({ onBack }) {
  const [tab, setTab] = useState('overall');
  const [msg, setMsg] = useState('');
  const board = getLeaderboard();

  const entries = (tab === 'overall' ? board : board.filter(e => e.categoryId === tab))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div style={{ maxWidth: 500, margin: '0 auto', width: '100%' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: T.dim, cursor: 'pointer', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 24 }}>← Back</button>
      <div style={lbl}>Hall of Fame</div>
      <h2 style={{ fontSize: 32, fontWeight: 400, letterSpacing: -1, margin: '6px 0 20px', fontFamily: T.font }}>Leaderboard</h2>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        <button onClick={() => setTab('overall')}
          style={{ background: tab === 'overall' ? '#f59e0b' : 'transparent', border: '1px solid', borderColor: tab === 'overall' ? '#f59e0b' : T.border2, color: tab === 'overall' ? T.bg : T.muted, padding: '5px 12px', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer', borderRadius: 3, fontFamily: T.font }}>
          All
        </button>
        {CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => setTab(cat.id)}
            style={{ background: tab === cat.id ? cat.color : 'transparent', border: '1px solid', borderColor: tab === cat.id ? cat.color : T.border2, color: tab === cat.id ? T.bg : T.muted, padding: '5px 10px', fontSize: 13, cursor: 'pointer', borderRadius: 3 }}>
            {cat.emoji}
          </button>
        ))}
      </div>

      {/* Entries */}
      {entries.length === 0 ? (
        <p style={{ color: T.muted, fontStyle: 'italic', textAlign: 'center', marginTop: 40 }}>No scores yet — play a game!</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {entries.map((e, i) => {
            const cat = getCategoryById(e.categoryId);
            const pct = e.maxPossible > 0 ? Math.round(e.score / e.maxPossible * 100) : 0;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', border: `1px solid ${T.border}`, borderRadius: 4, background: i === 0 ? '#f59e0b08' : T.bg2 }}>
                <div style={{ fontSize: i < 3 ? 20 : 14, minWidth: 28, textAlign: 'center', color: T.dim }}>
                  {i < 3 ? medals[i] : `#${i + 1}`}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, color: T.text, fontFamily: T.font }}>{e.player}</div>
                  <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>
                    {cat?.emoji} {cat?.name} · {e.questions} questions
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 22, fontWeight: 300, fontFamily: T.font, color: T.text }}>{e.score}</div>
                  <div style={{ fontSize: 10, color: T.dim, letterSpacing: 1 }}>{pct}% acc</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {board.length > 0 && (
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          {msg && <div style={{ color: '#4ade80', fontSize: 13, marginBottom: 10 }}>{msg}</div>}
          <button onClick={() => { clearLeaderboard(); setMsg('✓ Cleared!'); setTimeout(() => setMsg(''), 2000); }}
            style={{ background: 'none', border: 'none', color: T.dim, fontSize: 11, cursor: 'pointer', letterSpacing: 2, textTransform: 'uppercase', textDecoration: 'underline' }}>
            Clear All Scores
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODE SELECT + PLAYER NAMES
// ─────────────────────────────────────────────────────────────────────────────
function ModeScreen({ categoryId, onStart, onBack }) {
  const cat = getCategoryById(categoryId);
  const [mode, setMode] = useState(null);
  const [playerCount, setPlayerCount] = useState(2);
  const [names, setNames] = useState(['', '', '', '']);
  const [showSuggestions, setShowSuggestions] = useState(null);
  const known = getKnownPlayers();
  const defaults = ['You', 'Heaven', 'Player 3', 'Player 4'];

  const start = () => {
    const finalNames = (mode === 'solo' ? names.slice(0, 1) : names.slice(0, playerCount))
      .map((n, i) => n.trim() || defaults[i]);
    finalNames.forEach(savePlayerName);
    onStart({ mode, players: finalNames, categoryId });
  };

  if (!mode) return (
    <div style={{ textAlign: 'center', maxWidth: 500, margin: '0 auto' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: T.dim, cursor: 'pointer', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 22 }}>← Back</button>
      <div style={{ fontSize: 38, marginBottom: 6 }}>{cat.emoji}</div>
      <div style={lbl}>{cat.name}</div>
      <h2 style={{ fontSize: 'clamp(26px,5vw,44px)', fontWeight: 400, letterSpacing: -1, margin: '6px 0 24px', fontFamily: T.font }}>How are you playing?</h2>
      <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
        {[{ id: 'solo', emoji: '🧠', title: 'Solo', sub: 'High scores & streaks' }, { id: 'vs', emoji: '⚔️', title: 'VS Mode', sub: 'Up to 4 players' }].map(m => (
          <div key={m.id} onClick={() => setMode(m.id)}
            style={{ padding: '22px 28px', border: `1px solid ${cat.color}40`, borderRadius: 6, cursor: 'pointer', minWidth: 150, transition: 'all .2s', background: `${cat.color}07` }}
            onMouseEnter={e => { e.currentTarget.style.border = `1px solid ${cat.color}`; }}
            onMouseLeave={e => { e.currentTarget.style.border = `1px solid ${cat.color}40`; }}>
            <div style={{ fontSize: 30, marginBottom: 7 }}>{m.emoji}</div>
            <div style={{ fontSize: 15, color: T.text, marginBottom: 3 }}>{m.title}</div>
            <div style={{ fontSize: 12, color: T.muted, fontStyle: 'italic' }}>{m.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ textAlign: 'center', maxWidth: 440, margin: '0 auto' }}>
      <button onClick={() => setMode(null)} style={{ background: 'none', border: 'none', color: T.dim, cursor: 'pointer', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 22 }}>← Back</button>
      <div style={{ fontSize: 36, marginBottom: 6 }}>{mode === 'solo' ? '🧠' : '⚔️'}</div>
      <h2 style={{ fontSize: 'clamp(22px,4vw,38px)', fontWeight: 400, letterSpacing: -1, margin: '6px 0 20px', fontFamily: T.font }}>
        {mode === 'solo' ? 'Your Name?' : "Who's Playing?"}
      </h2>
      {mode === 'vs' && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 18 }}>
          {[2, 3, 4].map(n => (
            <Btn key={n} color={playerCount === n ? cat.color : T.border2} fill={playerCount === n}
              onClick={() => setPlayerCount(n)} style={{ padding: '8px 16px', fontSize: 12, letterSpacing: 1 }}>
              {n}P
            </Btn>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 22 }}>
        {Array.from({ length: mode === 'solo' ? 1 : playerCount }).map((_, i) => (
          <div key={i} style={{ position: 'relative' }}>
            <input value={names[i]}
              onChange={e => { const n = [...names]; n[i] = e.target.value; setNames(n); setShowSuggestions(i); }}
              onFocus={() => setShowSuggestions(i)}
              onBlur={() => setTimeout(() => setShowSuggestions(null), 150)}
              placeholder={defaults[i]}
              style={{ width: '100%', background: T.bg3, border: `1px solid ${T.border2}`, color: T.text, padding: '10px 14px', fontSize: 15, borderRadius: 3, fontFamily: T.font, outline: 'none', textAlign: 'center', boxSizing: 'border-box' }} />
            {showSuggestions === i && known.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: T.bg2, border: `1px solid ${T.border2}`, borderRadius: 3, zIndex: 10, maxHeight: 160, overflowY: 'auto' }}>
                {known.filter(k => !names.includes(k) && k.toLowerCase().includes(names[i].toLowerCase())).map(k => (
                  <div key={k} onClick={() => { const n = [...names]; n[i] = k; setNames(n); setShowSuggestions(null); }}
                    style={{ padding: '10px 14px', cursor: 'pointer', fontSize: 14, color: T.text, textAlign: 'left', borderBottom: `1px solid ${T.border}` }}
                    onMouseEnter={e => e.currentTarget.style.background = T.bg3}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    {k}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <Btn fill color={cat.color} onClick={start}>Let's Go {cat.emoji}</Btn>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GAME SCREEN
// ─────────────────────────────────────────────────────────────────────────────
const BATCH_SIZE = 3;
const CHECKPOINT = 10;

function GameScreen({ config, onHome }) {
  const { mode, players, categoryId } = config;
  const cat = getCategoryById(categoryId);
  const isSolo = mode === 'solo';

  const [queue, setQueue]       = useState([]);
  const [fetching, setFetching] = useState(false);
  const [fetchErr, setFetchErr] = useState('');
  const [qIdx, setQIdx]         = useState(0);
  const [localIdx, setLocalIdx] = useState(0);

  const [phase, setPhase]       = useState('loading');
  const [hints, setHints]       = useState(0);
  const [scores, setScores]     = useState(players.map(() => 0));
  const [guesses, setGuesses]   = useState(players.map(() => ''));
  const [locked, setLocked]     = useState(players.map(() => false));
  const [ap, setAp]             = useState(0);
  const [rpts, setRpts]         = useState(null);
  const [imgSt, setImgSt]       = useState('loading');
  const [streak, setStreak]     = useState(0);
  const [bestStreak, setBest]   = useState(0);
  const [maxPoss, setMaxPoss]   = useState(0);
  const [reporting, setReporting] = useState(false);

  const bgFetchRef = useRef(false);

  const loadBatch = useCallback(async (initial = false) => {
    if (bgFetchRef.current) return;
    bgFetchRef.current = true;
    setFetching(true);
    try {
      const items = await fetchBatch(getApiKey(), categoryId, BATCH_SIZE);
      setQueue(q => [...q, ...items]);
      if (initial) setPhase('playing');
    } catch(e) {
      setFetchErr(e.message || 'Failed to load questions');
      if (initial) setPhase('error');
    } finally {
      setFetching(false);
      bgFetchRef.current = false;
    }
  }, [categoryId]);

  useEffect(() => { loadBatch(true); }, [loadBatch]);

  useEffect(() => {
    const remaining = queue.length - localIdx - 1;
    if (remaining <= 1 && !fetching && !bgFetchRef.current && phase === 'playing') {
      loadBatch(false);
    }
  }, [localIdx, queue.length, fetching, phase, loadBatch]);

  useEffect(() => { setImgSt('loading'); }, [localIdx]);

  // Auto-show all hints when image fails
  useEffect(() => {
    if (imgSt === 'error' && item) setHints(item.hints?.length || 4);
  });

  // Enter: reveal when all locked, next question when revealed
  useEffect(() => {
    const handler = (e) => {
      if (e.key !== 'Enter') return;
      if (phase === 'playing' && locked.every(Boolean)) reveal();
      else if (phase === 'revealed') nextQuestion();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  const item = queue[localIdx];

  const lockIn = (pi) => {
    if (!guesses[pi].trim()) return;
    const nl = [...locked]; nl[pi] = true; setLocked(nl);
    const next = players.findIndex((_, i) => i > pi && !nl[i]);
    if (next !== -1) setAp(next);
  };

  const reveal = () => {
    const pts = guesses.map(g => scoreGuess(g, item));
    const mp = maxPoints();
    setRpts(pts);
    setScores(s => s.map((v, i) => v + pts[i]));
    setMaxPoss(m => m + mp);
    if (isSolo) {
      const got = pts[0] >= mp;
      const ns = got ? streak + 1 : 0;
      setStreak(ns);
      setBest(b => Math.max(b, ns));
    }
    setPhase('revealed');
  };

  const nextQuestion = () => {
    const newQIdx = qIdx + 1;
    setQIdx(newQIdx);
    if (newQIdx > 0 && newQIdx % CHECKPOINT === 0) {
      setPhase('checkpoint');
      return;
    }
    advanceItem();
  };

  const advanceItem = () => {
    const nextLocal = localIdx + 1;
    if (nextLocal >= queue.length && !fetching) {
      setPhase('loading');
      return;
    }
    setLocalIdx(nextLocal);
    setHints(0);
    setGuesses(players.map(() => ''));
    setLocked(players.map(() => false));
    setAp(0); setRpts(null);
    setPhase('playing');
  };

  const endGame = () => {
    if (isSolo) {
      updateSoloStats(categoryId, scores[0], maxPoss);
      addLeaderboardEntry(players[0], scores[0], maxPoss, qIdx, categoryId);
    } else {
      players.forEach((p, i) => addLeaderboardEntry(p, scores[i], maxPoss, qIdx, categoryId));
    }
    setPhase('over');
  };

  useEffect(() => {
    if (phase === 'loading' && queue.length > localIdx) setPhase('playing');
  }, [queue, localIdx, phase]);

  const ptLabel = (p) =>
    p >= 3 ? { t: '🎯 Nailed it! +3', c: '#4ade80' } :
    p === 2 ? { t: '👍 Close! +2', c: '#a3e635' } :
    p === 1 ? { t: '🌍 Ballpark! +1', c: '#f59e0b' } :
              { t: '❌ Missed +0', c: T.dim };

  const winIdx = scores.indexOf(Math.max(...scores));
  const tied   = scores.filter(s => s === scores[winIdx]).length > 1;

  if (phase === 'error') return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ color: '#ef4444', marginBottom: 16 }}>{fetchErr}</p>
      <Btn onClick={() => { setQueue([]); setLocalIdx(0); setPhase('loading'); loadBatch(true); }}>Try Again</Btn>
      <br /><br />
      <Btn color={T.border2} onClick={onHome}>Home</Btn>
    </div>
  );

  if (phase === 'loading') return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
      <Spinner color={cat.color} size={42} />
      <div style={{ ...lbl, color: T.muted }}>
        {queue.length === 0 ? `Claude is picking your ${cat.name.toLowerCase()}...` : 'Loading next batch...'}
      </div>
    </div>
  );

  if (phase === 'checkpoint') return (
    <div style={{ textAlign: 'center', maxWidth: 500, margin: '0 auto' }}>
      <div style={lbl}>🎯 {qIdx} Questions In</div>
      <h2 style={{ fontSize: 'clamp(26px,5vw,46px)', fontWeight: 400, letterSpacing: -1, margin: '8px 0 24px', fontFamily: T.font }}>
        {!isSolo ? (tied ? "It's close! 🤝" : `${players[winIdx]} is winning!`) : `${streak > 0 ? `🔥 ${streak} streak!` : 'Keep going!'}`}
      </h2>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 30, flexWrap: 'wrap' }}>
        {players.map((p, i) => (
          <div key={i} style={{ padding: '18px 28px', border: `2px solid ${PC[i % 4]}`, borderRadius: 4, background: `${PC[i % 4]}0c`, minWidth: 110, textAlign: 'center' }}>
            <div style={{ color: PC[i % 4], fontSize: 10, letterSpacing: 3, textTransform: 'uppercase' }}>{p}</div>
            <div style={{ fontSize: 42, fontWeight: 300, lineHeight: 1.1, margin: '4px 0 2px', fontFamily: T.font }}>{scores[i]}</div>
            <div style={{ color: T.dim, fontSize: 11 }}>pts</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Btn fill color={cat.color} onClick={() => advanceItem()}>Keep Playing! {cat.emoji}</Btn>
        <Btn color={T.border2} onClick={endGame}>End Game</Btn>
      </div>
    </div>
  );

  if (phase === 'over') return (
    <div style={{ textAlign: 'center', maxWidth: 500, margin: '0 auto' }}>
      <div style={lbl}>Game Over · {qIdx} Questions</div>
      <h2 style={{ fontSize: 'clamp(26px,5vw,48px)', fontWeight: 400, letterSpacing: -1, margin: '8px 0 6px', fontFamily: T.font }}>
        {isSolo ? 'Nice work!' : tied ? "It's a Tie! 🤝" : `${players[winIdx]} Wins!`}
      </h2>
      {isSolo && bestStreak > 1 && <div style={{ color: '#f97316', fontSize: 13, letterSpacing: 3, marginBottom: 6 }}>BEST STREAK: {bestStreak} 🔥</div>}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', margin: '22px 0 28px', flexWrap: 'wrap' }}>
        {players.map((p, i) => (
          <div key={i} style={{ padding: '18px 30px', border: `2px solid ${PC[i % 4]}`, borderRadius: 4, background: `${PC[i % 4]}0c`, minWidth: 110 }}>
            <div style={{ color: PC[i % 4], fontSize: 10, letterSpacing: 3, textTransform: 'uppercase' }}>{p}</div>
            <div style={{ fontSize: 46, fontWeight: 300, lineHeight: 1.1, margin: '4px 0 2px', fontFamily: T.font }}>{scores[i]}</div>
            <div style={{ color: T.dim, fontSize: 11 }}>pts</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Btn fill color={cat.color} onClick={() => window.location.reload()}>Play Again {cat.emoji}</Btn>
        <Btn color={T.border2} onClick={onHome}>Home</Btn>
      </div>
    </div>
  );

  const mp = maxPoints();

  return (
    <div style={{ width: '100%', maxWidth: 740 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={onHome} style={{ background: 'none', border: 'none', color: T.dim, cursor: 'pointer', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase' }}>← Home</button>
          <span style={{ color: T.border2 }}>|</span>
          <span style={{ fontSize: 13 }}>{cat.emoji} <span style={{ color: T.muted, fontSize: 11 }}>{cat.name}</span></span>
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          {isSolo && streak > 1 && <span style={{ color: '#f97316', fontSize: 12 }}>🔥 {streak}</span>}
          <span style={{ color: T.dim, fontSize: 11 }}>Q{qIdx + 1}</span>
          {players.map((p, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ color: PC[i % 4], fontSize: 9, letterSpacing: 3, textTransform: 'uppercase' }}>{p}</div>
              <div style={{ fontSize: 20, lineHeight: 1, fontFamily: T.font }}>{scores[i]}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Difficulty badge */}
      {item && (
        <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: T.dim }}>Difficulty:</span>
          {[1,2,3].map(d => (
            <div key={d} style={{ width: 8, height: 8, borderRadius: '50%', background: d <= (item.difficulty || 2) ? cat.color : T.border }} />
          ))}
          <span style={{ fontSize: 10, color: cat.color, letterSpacing: 2 }}>MAX {mp}PTS</span>
        </div>
      )}

      {/* Photo */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: 4, overflow: 'hidden', background: T.bg3, marginBottom: 16 }}>
        {imgSt !== 'loaded' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10 }}>
            {imgSt === 'loading' && <Spinner color={cat.color} />}
            {imgSt === 'error' && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 36 }}>{cat.emoji}</div>
                <div style={{ color: T.dim, fontSize: 13, marginTop: 6 }}>Photo unavailable — hints shown below!</div>
                {item?.imageAlt && <div style={{ color: T.border2, fontSize: 11, marginTop: 4, fontStyle: 'italic', maxWidth: 280, padding: '0 14px' }}>{item.imageAlt}</div>}
              </div>
            )}
          </div>
        )}
        {item && <img src={item.image} alt={item.imageAlt || ''}
          onLoad={() => setImgSt('loaded')} onError={() => setImgSt('error')}
          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: imgSt === 'loaded' ? 1 : 0, transition: 'opacity .6s' }} />}
        {imgSt === 'loaded' && phase === 'playing' && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent,rgba(0,0,0,.7))', padding: '24px 14px 10px', fontSize: 10, letterSpacing: 3, color: '#9ca3af', textTransform: 'uppercase' }}>
            {cat.emoji} What / Where Is This?
          </div>
        )}
        {phase === 'revealed' && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent,rgba(0,0,0,.85))', padding: '24px 14px 10px' }}>
            <div style={{ color: T.muted, fontSize: 10, letterSpacing: 3, textTransform: 'uppercase' }}>The Answer</div>
            <div style={{ color: T.text, fontSize: 'clamp(13px,2.5vw,20px)', fontFamily: T.font }}>{item?.name}</div>
          </div>
        )}
      </div>

      {/* Hints */}
      {phase === 'playing' && item && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
            <div style={{ fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', color: T.border2 }}>Hints: {hints}/{item.hints?.length || 4}</div>
            {hints < (item.hints?.length || 4) && (
              <Btn color={T.border2} onClick={() => setHints(h => h + 1)} style={{ padding: '4px 11px', fontSize: 10 }}>+ Hint</Btn>
            )}
          </div>
          {(item.hints || []).slice(0, hints).map((h, i) => (
            <div key={i} style={{ padding: '8px 13px', background: T.bg2, borderLeft: `2px solid ${['#f59e0b','#f97316','#ef4444','#dc2626'][i]}`, fontStyle: 'italic', color: '#b8b2a6', fontSize: 14, lineHeight: 1.5, marginBottom: 6 }}>
              "{h}"
            </div>
          ))}
        </div>
      )}

      {/* Player inputs */}
      {phase === 'playing' && (
        <>
          {players.map((player, pi) => {
            const isActive = ap === pi && !locked[pi];
            const isDone = locked[pi];
            const pc = PC[pi % 4];
            return (
              <div key={pi} style={{ padding: '11px 13px', border: `1px solid ${isDone ? pc + '50' : isActive ? pc + '35' : T.border}`, borderRadius: 3, background: isActive ? `${pc}07` : T.bg, marginBottom: 9, opacity: isDone ? .6 : 1, transition: 'all .25s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: isDone || isActive ? pc : T.border2 }} />
                  <span style={{ color: pc, fontSize: 10, letterSpacing: 3, textTransform: 'uppercase' }}>
                    {player}{isDone ? ' ✓' : isActive ? ' — Your Turn' : ' — Waiting...'}
                  </span>
                </div>
                {isActive && (
                  <div style={{ display: 'flex', gap: 7 }}>
                    <input autoFocus={pi === ap} value={guesses[pi]}
                      onChange={e => { const v = [...guesses]; v[pi] = e.target.value; setGuesses(v); }}
                      onKeyDown={e => e.key === 'Enter' && lockIn(pi)}
                      placeholder="Your guess..."
                      style={{ flex: 1, background: T.bg3, border: `1px solid ${T.border2}`, color: T.text, padding: '9px 11px', fontSize: 15, borderRadius: 2, fontFamily: T.font, outline: 'none' }} />
                    <Btn fill color={pc} onClick={() => lockIn(pi)} style={{ padding: '9px 14px' }}>Lock In</Btn>
                  </div>
                )}
                {isDone && <div style={{ color: T.muted, fontStyle: 'italic', paddingLeft: 13, fontSize: 14 }}>"{guesses[pi]}"</div>}
                {!isActive && !isDone && <div style={{ color: T.border2, fontStyle: 'italic', paddingLeft: 13, fontSize: 13 }}>Waiting for {players[ap]}...</div>}
              </div>
            );
          })}
          {locked.every(Boolean) && (
            <div style={{ textAlign: 'center', marginTop: 12 }}>
              <Btn fill color={cat.color} onClick={reveal}>Reveal Answer</Btn>
            </div>
          )}
        </>
      )}

      {/* Report button */}
      {(phase === 'playing' || phase === 'revealed') && item && (
        <div style={{ textAlign: 'right', marginBottom: 4 }}>
          <button onClick={() => setReporting(true)}
            style={{ background: 'none', border: 'none', color: T.dim, fontSize: 10, cursor: 'pointer', letterSpacing: 2, textTransform: 'uppercase' }}>
            ⚑ Report Photo
          </button>
        </div>
      )}

      {/* Report modal */}
      {reporting && item && (
        <ReportModal
          item={item}
          onClose={() => setReporting(false)}
          onSubmit={(reason, note) => addReport(item, reason, note)}
        />
      )}

      {/* Revealed */}
      {phase === 'revealed' && rpts && (
        <>
          <div style={{ display: 'flex', gap: 9, marginBottom: 12, flexWrap: 'wrap' }}>
            {players.map((player, pi) => {
              const l = ptLabel(rpts[pi]);
              const pc = PC[pi % 4];
              return (
                <div key={pi} style={{ flex: 1, minWidth: 150, padding: '11px 13px', border: `1px solid ${pc}40`, borderRadius: 3, background: `${pc}07` }}>
                  <div style={{ color: pc, fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 4 }}>{player}</div>
                  <div style={{ fontStyle: 'italic', color: T.muted, fontSize: 13, marginBottom: 4 }}>"{guesses[pi]}"</div>
                  <div style={{ color: l.c, fontSize: 13 }}>{l.t}</div>
                  <div style={{ color: T.dim, fontSize: 11, marginTop: 2 }}>Total: {scores[pi]}pts</div>
                </div>
              );
            })}
          </div>
          {/* Fun fact — always shown */}
          <div style={{ padding: '13px 15px', background: T.bg2, borderLeft: `2px solid ${cat.color}`, marginBottom: 12, fontStyle: 'italic', color: '#b8b2a6', lineHeight: 1.65, fontSize: 14 }}>
            ✦ {item?.funFact}
          </div>
          <div style={{ textAlign: 'center' }}>
            <Btn onClick={nextQuestion}>Next → <span style={{ fontSize: 9, opacity: 0.5 }}>(Enter)</span></Btn>
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SETTINGS
// ─────────────────────────────────────────────────────────────────────────────
function SettingsScreen({ onBack }) {
  const [msg, setMsg] = useState('');
  const [diff, setDiff] = useState(getDifficulty());
  const act = (fn, m) => { fn(); setMsg(m); setTimeout(() => setMsg(''), 2000); };

  const changeDiff = (d) => { setDifficulty(d); setDiff(d); setMsg('✓ Difficulty saved!'); setTimeout(() => setMsg(''), 2000); };
  return (
    <div style={{ maxWidth: 460, margin: '0 auto' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: T.dim, cursor: 'pointer', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 24 }}>← Back</button>
      <div style={lbl}>Settings</div>
      <h2 style={{ fontSize: 32, fontWeight: 400, letterSpacing: -1, margin: '6px 0 22px', fontFamily: T.font }}>Game Settings</h2>
      {msg && <div style={{ color: '#4ade80', fontSize: 13, marginBottom: 14, textAlign: 'center' }}>{msg}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Difficulty */}
        <div style={{ padding: '14px', border: `1px solid ${T.border}`, borderRadius: 4 }}>
          <div style={{ color: T.text, fontSize: 14, marginBottom: 3 }}>Difficulty</div>
          <div style={{ color: T.muted, fontSize: 12, marginBottom: 12 }}>Controls how famous/obscure items Claude picks</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[{ id: 'easy', label: '😊 Easy' }, { id: 'medium', label: '🧠 Medium' }, { id: 'hard', label: '💀 Hard' }].map(d => (
              <button key={d.id} onClick={() => changeDiff(d.id)}
                style={{ flex: 1, padding: '9px 8px', border: `1px solid ${diff === d.id ? '#f59e0b' : T.border2}`, borderRadius: 3, background: diff === d.id ? '#f59e0b18' : 'transparent', color: diff === d.id ? '#f59e0b' : T.muted, fontSize: 12, cursor: 'pointer', fontFamily: T.font, letterSpacing: 1 }}>
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: '14px', border: `1px solid ${T.border}`, borderRadius: 4 }}>
          <div style={{ color: T.text, fontSize: 14, marginBottom: 3 }}>Clear All History</div>
          <div style={{ color: T.muted, fontSize: 12, marginBottom: 10 }}>See previously seen items again</div>
          <Btn color='#ef4444' onClick={() => act(clearAllSeen, '✓ All history cleared!')}>Clear All</Btn>
        </div>
        {CATEGORIES.map(cat => {
          const n = getSeen(cat.id).length;
          return (
            <div key={cat.id} style={{ padding: '10px 14px', border: `1px solid ${T.border}`, borderRadius: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13 }}>{cat.emoji} {cat.name} <span style={{ color: T.dim }}>({n})</span></span>
              {n > 0 && <button onClick={() => act(() => clearSeen(cat.id), `✓ ${cat.name} cleared!`)} style={{ background: 'none', border: 'none', color: T.dim, cursor: 'pointer', fontSize: 11, textDecoration: 'underline' }}>clear</button>}
            </div>
          );
        })}
        <div style={{ padding: '14px', border: `1px solid ${T.border}`, borderRadius: 4 }}>
          <div style={{ color: T.text, fontSize: 14, marginBottom: 3 }}>API Key</div>
          <div style={{ color: T.muted, fontSize: 12, marginBottom: 10 }}>Reset your Anthropic API key</div>
          <Btn color={T.border2} onClick={() => { clearApiKey(); window.location.reload(); }}>Reset Key</Btn>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [apiKey, setApiKey] = useState(() => getApiKey());
  const [screen, setScreen] = useState('home');
  const [catId, setCatId]   = useState(null);
  const [config, setConfig] = useState(null);

  if (!apiKey) return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: T.font, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <SetupScreen onSave={k => setApiKey(k)} />
      <style>{css}</style>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: T.font, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 16, position: 'relative', overflow: 'hidden' }}>
      {screen === 'home' && <div className="home-bg" />}
      {screen === 'home'        && <HomeScreen onSelect={id => { setCatId(id); setScreen('mode'); }} onSettings={() => setScreen('settings')} onLeaderboard={() => setScreen('leaderboard')} />}
      {screen === 'leaderboard' && <LeaderboardScreen onBack={() => setScreen('home')} />}
      {screen === 'mode'        && <ModeScreen categoryId={catId} onStart={cfg => { setConfig(cfg); setScreen('game'); }} onBack={() => setScreen('home')} />}
      {screen === 'game'        && <GameScreen config={config} onHome={() => setScreen('home')} />}
      {screen === 'settings'    && <SettingsScreen onBack={() => setScreen('home')} />}
      <style>{css}</style>
    </div>
  );
}

const css = `
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes bgDrift {
    0%   { transform: translate(0%, 0%) scale(1); }
    33%  { transform: translate(2%, -3%) scale(1.05); }
    66%  { transform: translate(-2%, 2%) scale(0.97); }
    100% { transform: translate(0%, 0%) scale(1); }
  }
  .home-bg {
    position: fixed; inset: -20%; pointer-events: none; z-index: 0;
    background:
      radial-gradient(ellipse at 20% 40%, #10b98122 0%, transparent 55%),
      radial-gradient(ellipse at 80% 25%, #f59e0b18 0%, transparent 50%),
      radial-gradient(ellipse at 55% 80%, #3b82f618 0%, transparent 50%),
      radial-gradient(ellipse at 10% 85%, #ec489914 0%, transparent 45%);
    animation: bgDrift 12s ease-in-out infinite;
  }
  * { box-sizing: border-box; }
  body { margin: 0; }
  input::placeholder { color: #374151; }
  input:focus { border-color: #4b5563 !important; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #2d3748; border-radius: 2px; }
`;
