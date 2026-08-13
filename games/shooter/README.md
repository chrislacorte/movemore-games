# Handpistole Shooter — MediaPipe Hand-Steuerung

Moorhuhn-inspirierter Webcam-Shooter: Ziele mit deiner **Zeigefingerspitze**, schieße durch **Anlegen des Daumens** wie bei einer echten Handpistole. Umschaltbar zwischen Vollbild (mit Kamera-Thumbnail) und Split-View.

## Start

```bash
cd Shooter
npm install
npm run dev
```

Öffne die angezeigte URL (localhost) und erlaube Kamerazugriff.

## Steuerung

- **Zielen:** Die **Zeigefingerspitze** bewegt das Fadenkreuz (Erweiterung gegenüber Chicken Shooter AR).
- **Schießen:** **Pinch-Geste** (Daumen- und Zeigefingerspitze zusammen), wie in `mediapipeexperiments/chickenshooter` — max. ein Schuss alle 300 ms.
- **Kalibrierung:** Schusshand ~1,2 s sichtbar halten, oder **Leertaste** zum Überspringen.
- **Layout:** Unten links zwischen **Vollbild** und **Split-View** umschalten.

## Stack

- React 18 + Vite + Tailwind
- `@mediapipe/tasks-vision` (Hand Landmarker, 21 Punkte — modernes Äquivalent zu chickenshooter `@mediapipe/hands`)
- Canvas-2D-Szene, prozedurale Platzhalter-Sprites

## Sound austauschen

Platzhalter liegen in `public/sounds/`:

- `shoot.wav` — Schuss
- `reload.wav` — Nachladen (wenn Pinch gelöst wird)

Eigene Dateien einfach ersetzen (WAV/MP3). Pfade in `src/constants/soundConfig.js` anpassen. Lautstärke: `SOUND_VOLUME`.

Neu generieren:
```bash
node scripts/generate-placeholder-sounds.mjs
```

## Konfiguration

Tracking-, Ziel- und Gesten-Parameter in `src/constants/gameConfig.js`:

- `PINCH_THRESHOLD` / `PINCH_COOLDOWN_MS` — Pinch-Schuss aus chickenshooter (`src/utils/chickenShooterTracking.js`).
- `CROSSHAIR_GAIN` — wie stark die Handbewegung auf die Bildschirmfläche skaliert wird.
- `TARGET_SPAWN_INTERVAL_MS`, `TARGET_MAX`, `TARGET_MIN_SPEED` / `TARGET_MAX_SPEED` — Ziel-Spawn und -Tempo.
- `TARGET_HIT_RADIUS_SCALE` — Trefferradius (Aim-Assist).

## Sprites austauschen

Die Ziele werden prozedural in `drawTarget()` in `src/canvas/shooterRenderer.js` gezeichnet (markiert mit `PLACEHOLDER TARGET SPRITE`). Für echte Moorhuhn-Grafiken dort den Funktionskörper durch einen `ctx.drawImage(...)` ersetzen.
