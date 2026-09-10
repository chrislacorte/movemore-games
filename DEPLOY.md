# MoveMore Games — Deploy Guide

## Prerequisites

- Node.js 18+
- Cloudflare account with Wrangler CLI authenticated (`npx wrangler login`)

## Local development

```bash
npm install

# 1. Build all games once so landing page links work locally
npm run build:all

# 2. Landing page + game links (serves games from dist/)
npm run dev

# Develop a single game in isolation
npm run dev:fruitysamurai
npm run dev:pingpong
npm run dev:shooter
npm run dev:snake
npm run dev:tetris

# Full site preview matching production (_redirects, Wrangler)
npm run pages:dev
```

| Command | Purpose |
|---------|---------|
| `npm run build:all` | Build all games into `dist/` — required before `npm run dev` game links work |
| `npm run dev` | Landing page; clicking a game card opens the built app from `dist/` |
| `npm run pages:dev` | Production-like preview with Cloudflare Pages routing |

## Build

```bash
# Build everything into dist/
npm run build:all

# Build a single app (merges into dist/, preserves other subfolders)
npm run build:landing
npm run build:fruitysamurai
npm run build:pingpong
npm run build:shooter
npm run build:snake
npm run build:tetris
```

## Deploy to Cloudflare Pages

Project name: **movemore-games**

```bash
# First deploy — builds all apps
npm run deploy

# Deploy only one game (requires dist/ from a prior full build)
npm run deploy:pingpong
npm run deploy:fruitysamurai
npm run deploy:fruitninja3d
npm run deploy:shooter
npm run deploy:snake
npm run deploy:tetris
npm run deploy:landing
```

## Live preview

Default Pages URL: **https://movemore-games.pages.dev**

## Custom domain (movemoregames.com)

1. Deploy once with `npm run deploy`
2. In Cloudflare Dashboard → **Workers & Pages** → **movemore-games** → **Custom domains**
3. Add `movemoregames.com` and `www.movemoregames.com`
4. DNS records are created automatically if the domain is on Cloudflare

## URL structure

| Path | App |
|------|-----|
| `/` | Landing page |
| `/fruitysamurai/` | Fruity Samurai |
| `/pingpong/` | Ping Pong |
| `/shooter/` | Hand Shooter |
| `/snake/` | Hand Snake |
| `/pacman/` | Hand Pacman |
| `/tetris/` | Falling Blocks (inspired by tetris) |

## Wavedash (Fruity Samurai)

The Cloudflare Pages build is unchanged (`/fruitysamurai/`). Wavedash needs a **relative** `dist/` (`base: './'`) plus `Wavedash.init()`. Root-absolute `/img/...` URLs 404 inside the play iframe.

Listing: [Fruity Samurai 3D](https://wavedash.com/dev-portal/thechrislacorte/fruity-samurai-3d) (`game_id` in [`games/fruity-samurai/wavedash.toml`](games/fruity-samurai/wavedash.toml)).

```bash
cd games/fruity-samurai
npm run build:wavedash   # Vite base `./`, no PWA, drops Cloudflare `_redirects`/`_headers`
npm run wd:dev           # local sandbox (Wavedash CLI)
wavedash build push -m "Current Fruity Samurai (MoveMore)"
wavedash publish <BUILD_ID> --yes
```

Latest uploaded build: `mn779z9n81ea7g0n6hnbyvf72d8e38g6`  
Playtest: https://wavedash.com/playtest/fruity-samurai-3d/72d4599a-25be-40d7-8d4a-2e61ab931577

`wavedash publish` stays blocked until the store page in the Developer Portal has:

- description (≥ 80 characters)
- square cover art (1:1)
- thumbnail video
- at least one tag, input method, and language

Then run `wavedash publish mn779z9n81ea7g0n6hnbyvf72d8e38g6 --yes` (or publish that build from the Builds tab).

Create a **numeric, descending** leaderboard named `fruity-samurai-highscore` (or set `VITE_WAVEDASH_LEADERBOARD_NAME`). The first `getOrCreateLeaderboard` call can create it — set it **Visible** if it was Hidden.

Do not put a Wavedash API key in the game. The injected SDK authenticates the signed-in player. Highscores still save to `localStorage` when the SDK is missing (local Vite / Cloudflare).

Wavedash allows **one leaderboard entry per account**. Splitscreen uploads the higher of the two scores under the signed-in user and stores both typed names in entry metadata.

## Branding

Edit CSS variables in [`apps/landing/src/styles/brand.css`](apps/landing/src/styles/brand.css) when your design draft is ready.
