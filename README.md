# g0v Slack Archive Viewer

A Slack-style frontend and Node/Express BFF proxy for viewing [g0v-slack-archive](https://g0v-slack-archive.g0v.ronny.tw/) ([`ronnywang/g0v-slack-archive`](https://github.com/ronnywang/g0v-slack-archive)).

## Features

- **Classic Slack 3-Pane Layout**: Workspace sidebar with starred, recent, and popular channels; central message feed; collapsible right-hand **Thread** and **Channel Details** drawers.
- **Chronological Feed & Bidirectional Infinite Loading**: Opens channels scrolled to the latest messages at the bottom, and seamlessly prepends/appends adjacent months as you scroll with pixel-accurate scroll anchoring (plus an `Oldest → Latest` / `Latest → Oldest` toggle).
- **Channel Directory**: Browse, search, and sort all 1,131+ archived public channels by members, message count, recent activity, or name.
- **Year / Month Timeline Bar**: Jump across years and months with per-month message counts, Previous/Next navigation, and quick filtering across loaded messages.
- **Threads, Reactions & Rich Content**: Threaded replies slide-out drawer, reaction emoji counts with user tooltips, clickable internal `#channel` links, link unfurl / forwarded message cards, and image lightbox previews.
- **Global Search (`⌘K` / `Ctrl+K`)**: Queries the upstream archive search, enriches user profiles from the server cache, filters results by channel, and jumps directly to the matching message timestamp.
- **Light & Dark Themes**: Persisted in `localStorage`.

## How Upstream Data Is Accessed

`https://g0v-slack-archive.g0v.ronny.tw/` exposes partial JSON APIs (`/index/count`, `/index/getmessage`), while full channel lists, monthly pagination, search, threads, reactions, and `title` JSON metadata live in server-rendered HTML (`IndexController.php` / `channel.phtml` / `message.phtml` / `search.phtml`).

The Express backend ([`server/scraper.ts`](./server/scraper.ts) & [`server/index.ts`](./server/index.ts)):
- Proxies `/index/count` -> `GET /api/stats`
- Parses `/` channel index -> `GET /api/channels`
- Parses `/index/channel/:id[/:month]` -> `GET /api/channel/:id[/:month]`
- Parses `/index/search?q=...` -> `GET /api/search?q=...` (enriching user profiles from cached channel visits)
- Proxies `/index/file?url=...` -> `GET /api/file?url=...` with magic-byte `Content-Type` detection (since upstream serves Slack files without an image MIME header)

## Integrating as a Beta Frontend for `ronnywang/g0v-slack-archive`

The React frontend (`src/`) only talks to the five `/api/*` endpoints defined in [`src/api.ts`](./src/api.ts) and [`src/types.ts`](./src/types.ts). If `ronnywang/g0v-slack-archive` exposes matching JSON endpoints (or accepts static build output from `vite build`), the React frontend can run directly against the PHP backend without the HTML-scraping BFF layer.

## Getting Started

```bash
npm install
npm run dev
```

- Frontend dev server: `http://localhost:5173` (proxies `/api/*` to `:3456`)
- Backend API server: `http://localhost:3456`

### Production Build

```bash
npm run build
npm start
```

Serves both the compiled React app and `/api/*` from `http://localhost:3456` (configurable via `PORT`).
