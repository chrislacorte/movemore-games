/**
 * Fruit class for Fruit Samurai game
 */
import { FRUIT_CONFIGS } from '../constants/fruitAssets';

export class Fruit {
  constructor(canvasWidth, canvasHeight, type = 'orange', image = null, options = {}) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.type = type;
    this.image = image;

    const config = FRUIT_CONFIGS[type] || FRUIT_CONFIGS.orange;
    this.color = config.color;
    const sizeScale = options.sizeScale ?? 1;
    this.radius = config.radius * sizeScale;
    this.isBomb = config.isBomb || false;
    this.isSliced = false;

    this.sliceAngle = 0;
    this.halves = null;

    this.gravity = 0.25;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 0.1;

    const xRegionStart = options.xRegionStart ?? canvasWidth * 0.2;
    const xRegionWidth = options.xRegionWidth ?? canvasWidth * 0.6;
    this.x = Math.random() * xRegionWidth + xRegionStart;
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
        half.alpha -= 0.01;
      });
    }

    if (this.isSliced) {
      return this.halves[0].y > this.canvasHeight + this.radius * 2;
    }
    return this.y > this.canvasHeight + this.radius * 2;
  }

  draw(ctx) {
    if (this.isSliced) {
      this.drawSliced(ctx);
      return;
    }

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    if (this.image && this.image.complete && this.image.naturalWidth !== 0) {
      const size = this.radius * 2.2;
      ctx.drawImage(this.image, -size / 2, -size / 2, size, size);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(-this.radius * 0.3, -this.radius * 0.3, this.radius * 0.2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fill();
    }

    if (this.isBomb) {
      ctx.beginPath();
      ctx.moveTo(0, -this.radius);
      ctx.quadraticCurveTo(10, -this.radius - 20, 20, -this.radius - 10);
      ctx.strokeStyle = '#8B4513';
      ctx.lineWidth = 3;
      ctx.stroke();

      const sparkSize = 5 + Math.sin(Date.now() * 0.02) * 2;
      ctx.beginPath();
      ctx.arc(20, -this.radius - 10, sparkSize, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFF00';
      ctx.fill();
    }

    ctx.restore();
  }

  drawSliced(ctx) {
    if (!this.halves) return;

    this.halves.forEach((half, index) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, half.alpha);
      ctx.translate(half.x, half.y);
      ctx.rotate(half.rotation);

      if (this.image && this.image.complete && this.image.naturalWidth !== 0) {
        const size = this.radius * 2.2;
        ctx.beginPath();
        if (index === 0) {
          ctx.rect(-size / 2, -size / 2, size, size / 2);
        } else {
          ctx.rect(-size / 2, 0, size, size / 2);
        }
        ctx.clip();
        ctx.drawImage(this.image, -size / 2, -size / 2, size, size);
      } else {
        ctx.beginPath();
        if (index === 0) {
          ctx.arc(0, 0, this.radius, Math.PI, 0);
        } else {
          ctx.arc(0, 0, this.radius, 0, Math.PI);
        }
        ctx.fillStyle = this.color;
        ctx.fill();
      }
      ctx.restore();
    });
  }

  checkCollision(px, py) {
    if (this.isSliced) return false;
    const dx = px - this.x;
    const dy = py - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < this.radius;
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
    const distanceSq = dx * dx + dy * dy;

    const effectiveRadius = this.radius * 1.25;

    if (distanceSq < effectiveRadius * effectiveRadius) {
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
        vx: this.vx - Math.cos(this.sliceAngle + Math.PI / 2) * 5,
        vy: this.vy - Math.sin(this.sliceAngle + Math.PI / 2) * 5,
        rotation: this.rotation,
        rotationSpeed: this.rotationSpeed - 0.1,
        alpha: 1.0,
      },
      {
        x: this.x,
        y: this.y,
        vx: this.vx + Math.cos(this.sliceAngle + Math.PI / 2) * 5,
        vy: this.vy + Math.sin(this.sliceAngle + Math.PI / 2) * 5,
        rotation: this.rotation,
        rotationSpeed: this.rotationSpeed + 0.1,
        alpha: 1.0,
      },
    ];
  }
}
