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

## Branding

Edit CSS variables in [`apps/landing/src/styles/brand.css`](apps/landing/src/styles/brand.css) when your design draft is ready.
