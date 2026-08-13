# Sounds austauschen

Ersetze einfach diese Dateien durch deine eigenen Sounds (gleiches Format empfohlen: **WAV** oder **MP3**).

| Datei | Wann abgespielt |
|-------|-----------------|
| `shoot.wav` | Bei jedem Schuss (Pinch) |
| `reload.wav` | Wenn du den Pinch löst (Nachladen) |

Pfade ändern in `src/constants/soundConfig.js` → `SOUND_PATHS`.

Neu generieren (Platzhalter):
```bash
node scripts/generate-placeholder-sounds.mjs
```
