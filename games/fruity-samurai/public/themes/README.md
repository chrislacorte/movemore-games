# Theme backgrounds — asset guide

Place one folder per theme. The game uses **CSS `object-fit: cover`**, so one landscape image per theme is enough for most screens.

## Folder structure

```
public/themes/
├── ghibli/
│   ├── background.jpg      ← main in-game background (required)
│   └── preview.jpg         ← start-screen thumbnail (optional)
├── authentic/
│   ├── background.jpg
│   └── preview.jpg
├── cinematic/
│   ├── background.jpg
│   └── preview.jpg
└── README.md               ← this file
```

## Recommended sizes

| Asset | Size | Aspect | Format | Notes |
|-------|------|--------|--------|-------|
| **background** (main) | **2560 × 1440 px** | 16∶9 | JPG or WebP | Primary file; scales down for laptops/tablets |
| **background** (minimum) | **1920 × 1080 px** | 16∶9 | JPG or WebP | OK if file size matters |
| **preview** (theme picker) | **640 × 360 px** | 16∶9 | JPG or WebP | Shown on intro screen |
| **background** (optional mobile) | **1080 × 1920 px** | 9∶16 | JPG or WebP | Only if you want a portrait crop; not required |

### File size tips

- Target **200–800 KB** per background (WebP preferred).
- Keep important action in the **center 70%** — edges may be cropped on narrow or ultrawide screens.
- Avoid heavy text in the artwork; UI sits on top.

## File names

Use exactly:

- `background.jpg` or `background.webp`
- `preview.jpg` or `preview.webp`

The app resolves paths as `/themes/{themeId}/background.jpg`.

## Current themes (from design)

| ID | Label | Style |
|----|-------|-------|
| `ghibli` | Ghibli | Soft, painterly, green forest |
| `authentic` | Authentic | Realistic torii, mist, lanterns |
| `cinematic` | Cinematic | Golden hour, dramatic path |

Drop your files into the matching folder and reload the dev server.
