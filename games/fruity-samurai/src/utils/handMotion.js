import { SWIPE_SOUND_MIN_DISTANCE } from '../constants/gameConfig';

export function getHandMotion(lastPos, currentPos) {
  if (!lastPos || !currentPos) return null;

  const distance = Math.hypot(currentPos.x - lastPos.x, currentPos.y - lastPos.y);
  const durationMs = Math.max(
    8,
    (currentPos.timestamp ?? performance.now()) - (lastPos.timestamp ?? performance.now() - 16)
  );

  return { distance, durationMs };
}

export function detectHandMotion(lastPos, currentPos) {
  const motion = getHandMotion(lastPos, currentPos);
  if (!motion) return false;
  return motion.distance >= SWIPE_SOUND_MIN_DISTANCE;
}
