# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # start dev server at localhost:3000
npm run build    # production build
npm run lint     # eslint
```

No test suite exists in this project.

## Architecture

This project has **two separate layers** that do not share code:

### 1. Next.js Shell (`app/`)
A minimal Next.js 16 app (React 19, TypeScript, Tailwind) that handles:
- **Whop auth/routing** — `middleware.ts` rewrites `/experiences/[id]` → `/research/index.html` so the research hub loads inside the Whop iframe without redirecting the URL. The `Content-Security-Policy: frame-ancestors *` header is set here.
- **API proxy** — `app/api/quote/route.ts` proxies Yahoo Finance quote/search requests to avoid browser CORS restrictions. Called from the research hub JS as `/api/quote?symbols=...` or `/api/quote?q=...`.
- **Whop verification** — `app/api/whop/verify/` and `lib/whop.ts` use `@whop/sdk` for server-side auth checks.
- The `app/page.tsx` root is a placeholder; the real product is the research hub.

Required env vars (`.env.local`): `WHOP_API_KEY`, `NEXT_PUBLIC_WHOP_APP_ID`.

### 2. Static Research Hub (`public/research/`)
A self-contained HTML/CSS/JS app — **no build step, no framework**. Served as static files by Next.js. This is where all product features live.

**Shared design system:**
- `styles.css` — all CSS custom properties and base styles. Dark/light via `html[data-theme]`. Key vars: `--bg`, `--surface`, `--surface2`, `--border`, `--accent` (`#00ff87` dark / `#0553d4` light), `--text`, `--muted`, `--green`, `--red`, `--yellow`. Fonts: `Syne` (body), `IBM Plex Mono` (numbers).
- `components.js` — renders the shared nav header. Load it immediately after `<header data-page="KEY"></header>`. The `KEY` string controls which nav link is highlighted.
- `theme.js` — wires up the theme toggle button (added by `components.js`) and persists to `localStorage` under key `apex-theme`.

**Page pattern** — every research page follows this exact boilerplate:
```html
<link rel="stylesheet" href="/research/styles.css">
<script>document.documentElement.setAttribute("data-theme", localStorage.getItem("apex-theme")||"dark");</script>
<!-- ... page styles ... -->
<header data-page="PAGE_KEY"></header>
<script src="/research/components.js"></script>
<!-- ... page HTML ... -->
<script src="/research/theme.js"></script>
<script src="/research/PAGE.js"></script>  <!-- or inline <script> -->
```

**Nav keys** registered in `components.js`: `index`, `screener`, `macro`, `news`. Add new pages to the `NAV` array there.

**Data files** (`data/*.json`): Static JSON loaded by JS via `fetch('/research/data/FILE.json')`. Updated manually — no backend writes to these.

**Full-page tool layout** (for apps like backtest that need overflow:hidden): Set `body { display:flex; flex-direction:column; overflow:hidden }`, add a `.tool-bar` div for the inner tab nav below the shared header, and wrap all pages in a `.pages-wrapper { flex:1; min-height:0; display:flex; flex-direction:column; overflow:hidden }`.

**CSS variable gaps**: `styles.css` does not define `--surface3`, `--border2`, `--accent2`, `--purple`, or `--muted2`. Pages that need these must declare them locally as supplemental vars (with both `:root` dark defaults and `html[data-theme="light"]` overrides).
