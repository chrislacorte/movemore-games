import { FRUIT_CONFIGS } from './fruitAssets';

export const FRUIT_3D_APPEARANCE = Object.fromEntries(
  Object.entries(FRUIT_CONFIGS).map(([type, config]) => [
    type,
    { color: config.color, radius: (config.radius || 55) / 100 },
  ])
);
