let fruitIdCounter = 0;

/**
 * Fruit class for 3D mode — same 2D physics/collision, adds depth for rendering.
 */
import { FRUIT_CONFIGS } from '../constants/fruitAssets';

export class Fruit3D {
  constructor(canvasWidth, canvasHeight, type = 'orange') {
    this.id = ++fruitIdCounter;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.type = type;

    const config = FRUIT_CONFIGS[type] || FRUIT_CONFIGS.orange;
    this.color = config.color;
    this.radius = config.radius;
    this.isBomb = config.isBomb || false;
    this.isSliced = false;

    this.sliceAngle = 0;
    this.halves = null;

    this.gravity = 0.25;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 0.1;
    this.z = (Math.random() - 0.5) * 3;
    this.spinX = (Math.random() - 0.5) * 0.08;
    this.spinY = (Math.random() - 0.5) * 0.08;

    this.x = Math.random() * (canvasWidth * 0.6) + (canvasWidth * 0.2);
    this.y = canvasHeight + this.radius;
    this.vx = (Math.random() - 0.5) * 6;
    this.vy = -(Math.random() * 5 + 15);
  }

  update() {
    if (!this.isSliced) {
      this.x += this.vx;
      this.y += this.vy;
      this.vy += this.gravity;
      this.rotation += this.rotationSpeed;
    }

    if (this.isSliced && this.halves) {
      this.halves.forEach((half) => {
        half.x += half.vx;
        half.y += half.vy;
        half.vy += this.gravity;
        half.rotation += half.rotationSpeed;
        half.spinX += half.spinXSpeed;
        half.spinY += half.spinYSpeed;
        half.alpha -= 0.01;
      });
    }

    if (this.isSliced) {
      return this.halves[0].y > this.canvasHeight + this.radius * 2;
    }
    return this.y > this.canvasHeight + this.radius * 2;
  }

  checkCollision(px, py) {
    if (this.isSliced) return false;
    const dx = px - this.x;
    const dy = py - this.y;
    return Math.sqrt(dx * dx + dy * dy) < this.radius;
  }

  checkSlice(x1, y1, x2, y2) {
    if (this.isSliced) return false;

    const acx = this.x - x1;
    const acy = this.y - y1;
    const abx = x2 - x1;
    const aby = y2 - y1;

    const lineLengthSq = abx * abx + aby * aby;
    if (lineLengthSq === 0) return this.checkCollision(x1, y1);

    let t = (acx * abx + acy * aby) / lineLengthSq;
    t = Math.max(0, Math.min(1, t));

    const closestX = x1 + t * abx;
    const closestY = y1 + t * aby;
    const dx = this.x - closestX;
    const dy = this.y - closestY;
    const effectiveRadius = this.radius * 1.25;

    if (dx * dx + dy * dy < effectiveRadius * effectiveRadius) {
      this.slice(x1, y1, x2, y2);
      return true;
    }
    return false;
  }

  slice(x1, y1, x2, y2) {
    this.isSliced = true;
    this.sliceAngle = Math.atan2(y2 - y1, x2 - x1);

    this.halves = [
      {
        x: this.x,
        y: this.y,
        z: this.z,
        vx: this.vx - Math.cos(this.sliceAngle + Math.PI / 2) * 5,
        vy: this.vy - Math.sin(this.sliceAngle + Math.PI / 2) * 5,
        rotation: this.rotation,
        rotationSpeed: this.rotationSpeed - 0.1,
        spinX: this.spinX,
        spinY: this.spinY,
        spinXSpeed: this.spinX - 0.05,
        spinYSpeed: this.spinY + 0.05,
        alpha: 1,
        halfIndex: 0,
      },
      {
        x: this.x,
        y: this.y,
        z: this.z,
        vx: this.vx + Math.cos(this.sliceAngle + Math.PI / 2) * 5,
        vy: this.vy + Math.sin(this.sliceAngle + Math.PI / 2) * 5,
        rotation: this.rotation,
        rotationSpeed: this.rotationSpeed + 0.1,
        spinX: this.spinX,
        spinY: this.spinY,
        spinXSpeed: this.spinX + 0.05,
        spinYSpeed: this.spinY - 0.05,
        alpha: 1,
        halfIndex: 1,
      },
    ];
  }
}
