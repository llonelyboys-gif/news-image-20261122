// A minimal RGB canvas plus a PNG encoder, written from scratch.
// Standard library only: node:zlib for deflate, node:crypto for nothing
// here — the CRC32 table below is computed at load time.

import { deflateSync } from 'node:zlib';
import { glyphFor, GLYPH_W, GLYPH_H } from './font.ts';

export type RGB = [number, number, number];

function crc32Table(): Uint32Array {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
}

const CRC_TABLE = crc32Table();

export function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, 'ascii'), data])), 8 + data.length);
  return out;
}

export class Canvas {
  readonly width: number;
  readonly height: number;
  private pixels: Uint8Array;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.pixels = new Uint8Array(width * height * 3);
  }

  fill(color: RGB): void {
    for (let i = 0; i < this.pixels.length; i += 3) {
      this.pixels[i] = color[0];
      this.pixels[i + 1] = color[1];
      this.pixels[i + 2] = color[2];
    }
  }

  set(x: number, y: number, color: RGB): void {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
    const i = (y * this.width + x) * 3;
    this.pixels[i] = color[0];
    this.pixels[i + 1] = color[1];
    this.pixels[i + 2] = color[2];
  }

  rect(x: number, y: number, w: number, h: number, color: RGB): void {
    const x0 = Math.max(0, x);
    const y0 = Math.max(0, y);
    const x1 = Math.min(this.width, x + w);
    const y1 = Math.min(this.height, y + h);
    for (let yy = y0; yy < y1; yy++) {
      for (let xx = x0; xx < x1; xx++) {
        const i = (yy * this.width + xx) * 3;
        this.pixels[i] = color[0];
        this.pixels[i + 1] = color[1];
        this.pixels[i + 2] = color[2];
      }
    }
  }

  // Outline of a rectangle, 1px thick.
  frame(x: number, y: number, w: number, h: number, color: RGB): void {
    this.rect(x, y, w, 1, color);
    this.rect(x, y + h - 1, w, 1, color);
    this.rect(x, y, 1, h, color);
    this.rect(x + w - 1, y, 1, h, color);
  }

  // Bresenham line.
  line(x0: number, y0: number, x1: number, y1: number, color: RGB): void {
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    let x = x0;
    let y = y0;
    for (;;) {
      this.set(x, y, color);
      if (x === x1 && y === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y += sy;
      }
    }
  }

  // Thick line: draws parallel offsets for a chunky stroke.
  thickLine(x0: number, y0: number, x1: number, y1: number, thickness: number, color: RGB): void {
    const half = Math.floor(thickness / 2);
    for (let a = -half; a <= half; a++) {
      for (let b = -half; b <= half; b++) {
        this.line(x0 + a, y0 + b, x1 + a, y1 + b, color);
      }
    }
  }

  circle(cx: number, cy: number, r: number, color: RGB): void {
    for (let y = -r; y <= r; y++) {
      const half = Math.floor(Math.sqrt(r * r - y * y));
      for (let x = -half; x <= half; x++) {
        this.set(cx + x, cy + y, color);
      }
    }
  }

  ring(cx: number, cy: number, r: number, thickness: number, color: RGB): void {
    for (let a = 0; a < 360; a++) {
      const rad = (a * Math.PI) / 180;
      for (let t = 0; t < thickness; t++) {
        const rr = r - t;
        this.set(Math.round(cx + rr * Math.cos(rad)), Math.round(cy + rr * Math.sin(rad)), color);
      }
    }
  }

  // Filled triangle.
  triangle(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, color: RGB): void {
    const minX = Math.max(0, Math.min(x0, x1, x2));
    const maxX = Math.min(this.width - 1, Math.max(x0, x1, x2));
    const minY = Math.max(0, Math.min(y0, y1, y2));
    const maxY = Math.min(this.height - 1, Math.max(y0, y1, y2));
    const denom = (y1 - y2) * (x0 - x2) + (x2 - x1) * (y0 - y2);
    if (denom === 0) return;
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const a = ((y1 - y2) * (x - x2) + (x2 - x1) * (y - y2)) / denom;
        const b = ((y2 - y0) * (x - x2) + (x0 - x2) * (y - y2)) / denom;
        const c = 1 - a - b;
        if (a >= 0 && b >= 0 && c >= 0) this.set(x, y, color);
      }
    }
  }

  // Draw one glyph of the 5x7 font at integer scale.
  drawChar(ch: string, x: number, y: number, scale: number, color: RGB): void {
    const glyph = glyphFor(ch);
    for (let row = 0; row < GLYPH_H; row++) {
      for (let col = 0; col < GLYPH_W; col++) {
        if (glyph[row][col] === '#') {
          this.rect(x + col * scale, y + row * scale, scale, scale, color);
        }
      }
    }
  }

  // Draw text left-aligned; returns the x position after the last glyph.
  drawText(text: string, x: number, y: number, scale: number, color: RGB): number {
    let cx = x;
    for (const ch of text) {
      this.drawChar(ch, cx, y, scale, color);
      cx += (GLYPH_W + 1) * scale;
    }
    return cx;
  }

  // Draw text centred on cx.
  drawTextCentered(text: string, cx: number, y: number, scale: number, color: RGB): void {
    let w = 0;
    for (const ch of text) w += (GLYPH_W + 1) * scale;
    w -= scale;
    this.drawText(text, cx - Math.floor(w / 2), y, scale, color);
  }

  // Encode the canvas as a whole PNG (filter 0 on every scanline).
  toPng(): Buffer {
    const raw = Buffer.alloc(this.height * (1 + this.width * 3));
    for (let y = 0; y < this.height; y++) {
      raw[y * (1 + this.width * 3)] = 0;
      raw.set(this.pixels.subarray(y * this.width * 3, (y + 1) * this.width * 3), y * (1 + this.width * 3) + 1);
    }
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(this.width, 0);
    ihdr.writeUInt32BE(this.height, 4);
    ihdr[8] = 8; // bit depth
    ihdr[9] = 2; // colour type 2 = RGB
    ihdr[10] = 0; // compression
    ihdr[11] = 0; // filter
    ihdr[12] = 0; // interlace
    const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    return Buffer.concat([
      signature,
      chunk('IHDR', ihdr),
      chunk('IDAT', deflateSync(raw, { level: 9 })),
      chunk('IEND', Buffer.alloc(0)),
    ]);
  }
}
