# MoveMore Games

Motion-controlled webcam games hosted on Cloudflare Pages.

## Games

| URL | Game |
|-----|------|
| `/` | Landing page |
| `/fruitysamurai/` | Fruity Samurai — slice fruits with hand tracking |
| `/pingpong/` | Ping Pong — wrist-controlled pong vs AI |
| `/shooter/` | Hand Shooter — aim and pinch to fire |
| `/snake/` | Hand Snake — finger-controlled cinematic snake |
| `/pacman/` | Hand Pacman — steer through the maze with your finger |
| `/tetris/` | Falling Blocks — two-hand palm control, open→close rotate, down swipe soft drop |

**Live:** [https://movemore-games.pages.dev](https://movemore-games.pages.dev)

## Quick start

```bash
npm install
npm run build:all      # build all games once (required for local game links)
npm run dev            # landing page + game links from dist/
npm run pages:dev      # full production preview (Wrangler + redirects)
npm run deploy         # deploy all to Cloudflare
```

| Command | Purpose |
|---------|---------|
| `npm run build:all` | Build all games into `dist/` (run once before local link testing) |
| `npm run dev` | Landing page; game cards open built apps from `dist/` |
| `npm run pages:dev` | Full site preview matching production routing |
| `npm run dev:snake` | Develop a single game in isolation |

See [DEPLOY.md](DEPLOY.md) for per-game deploys and custom domain setup.

## Project structure

```
apps/landing/           Landing page
games/fruity-samurai/   Fruity Samurai
games/pingpong/         Ping Pong
games/shooter/          Hand Shooter
games/snake/            Hand Snake
games/pacman/           Hand Pacman
games/tetris/           Falling Blocks (inspired by tetris)
scripts/                Build & deploy orchestration
dist/                   Merged Cloudflare output (generated)
```

## Branding

Edit `apps/landing/src/styles/brand.css` to apply your design colors.
