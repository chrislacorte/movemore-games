# Ping Pong — MediaPipe Hand-Steuerung

First-Person-Tischtennis mit Webcam: Schläger folgt dem Handgelenk (MediaPipe Pose), Ball kommt frontal aus der Tiefe. Split-View — links Spielfeld, rechts Kamera mit Skelett-Overlay.

## Start

```bash
cd PingPong
npm install
npm run dev
```

Öffne die angezeigte URL (localhost) und erlaube Kamerazugriff.

## Steuerung

- **Hand** vor der Kamera bewegen — der Schläger folgt dem sichtbaren Handgelenk (rechte Hand bevorzugt).
- **Kalibrierung:** Hand ~1,5 s sichtbar halten, oder **Leertaste** zum Überspringen.
- **Ziel:** Erste Seite mit **11 Punkten** gewinnt.

## Stack

- React 18 + Vite + Tailwind
- `@mediapipe/tasks-vision` (Pose Landmarker Lite)
- Canvas Pseudo-3D-Tunnel + **Three.js GLB-Schläger** (`public/models/ping_pong_paddle.glb`)
- KI-Gegner

## Konfiguration

Physik und KI in `src/constants/gameConfig.js` (`AI_MISS_CHANCE`, `BALL_SPEED_Z_BASE`, `WIN_SCORE`, …).
