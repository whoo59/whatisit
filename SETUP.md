# 🤯 WHAT IS THAT?! — Setup Guide v1.1

## What's new in v1.1
- Fast startup! Loads 3 questions instantly, fetches more in the background
- Indefinite play — game never ends, checkpoint every 10 questions
- Difficulty-based scoring (1-3 pts depending on how obscure the item is)
- Player name memory — picks from previous players automatically
- Image proxy fix — photos load reliably
- Folder properly named "whatisthat"

## What you need
- Node.js (nodejs.org — LTS version)
- Anthropic API key (console.anthropic.com)
- A Vercel account (vercel.com) for live URL

---

## First time setup

**Mac (Terminal):**
```bash
cd ~/Desktop/whatisthat
npm install
npm start
```

**Windows (PowerShell):**
```powershell
cd "C:\Users\Tyler DuBovy\Desktop\whatisthat"
npm install
npm start
```

If PowerShell blocks scripts:
```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

Opens at http://localhost:3000 — enter API key and play!

---

## Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Hit Enter for all defaults, name it `whatisthat`. You'll get:
**https://whatisthat.vercel.app**

## Update after code changes

```bash
vercel --prod
```

---

## Scoring
- Difficulty 1 (easy/famous): max 1pt
- Difficulty 2 (moderate): max 2pts  
- Difficulty 3 (obscure): max 3pts
- Right region/continent: always 1pt regardless of difficulty
