# Background images — 3 styles × 3 scenes

Each visual **style** (theme) has the same three **scenes** with different art direction.

## Folder structure

```
public/backgrounds/
├── authentic/
│   ├── sakura-paradise.webp      Cherry blossom paradise
│   ├── waterfall-lagoon.webp     Lagoon & waterfall
│   └── holy-temple.webp          Frontal shrine
├── ghibli/
│   ├── sakura-paradise.webp
│   ├── waterfall-lagoon.webp
│   └── holy-temple.webp
├── cinematic/
│   ├── sakura-paradise.webp
│   ├── waterfall-lagoon.webp
│   └── holy-temple.webp
└── previews/
    ├── authentic/ … (480px wide WebP)
    ├── ghibli/ …
    └── cinematic/ …
```

## Scenes

| Scene ID | Name | Mood |
|----------|------|------|
| `sakura-paradise` | Cherry Blossom Paradise | Sakura trees L/R, falling petals, mountains, sunset |
| `waterfall-lagoon` | Waterfall Lagoon | River lagoon, waterfall in depth |
| `holy-temple` | Holy Temple | Frontal Japanese temple, stone path |

## Styles (themes)

| Theme ID | Label |
|----------|-------|
| `authentic` | Authentic — realistic, photographic |
| `ghibli` | Ghibli — painterly, soft |
| `cinematic` | Cinematic — dramatic light, film look |

Background IDs in code: `{theme}-{scene}` e.g. `ghibli-waterfall-lagoon`.

Register changes in `src/constants/backgrounds.js`. Re-compress with `npm run backgrounds:webp`.
