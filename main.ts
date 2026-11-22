// The World in One Picture — 22 November 2026.
// Draws a one-page newspaper front page summing up six real stories
// from Sunday 22 November 2026, as a 1024x1024 PNG.
// Node 22, standard library only. No network. Fully deterministic:
// the same bytes are written on every run.
//
// Stories (all happened or first reported on 22 November 2026):
//  1. Gulf — Iran strikes a civilian site in Bahrain; two oil tankers
//     hit near the Strait of Hormuz; Tehran says it hit US defences.
//  2. COP31 — climate talks in Antalya run into overtime, deadlocked
//     over fossil fuels; a new deal text is put to a Sunday vote.
//  3. Israel — President Herzog asks Gadi Eisenkot to form the next
//     government, bypassing Benjamin Netanyahu.
//  4. Florida — the St Johns River breaks a 73-year flood record
//     near Cocoa after days of heavy rain.
//  5. India — toxic alcohol kills at least 11 in Manipur; more than
//     180 people are in hospital.
//  6. Sport — Zverev meets Alcaraz in the ATP Finals title decider
//     in Turin on Sunday night.

import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { Canvas } from './src/png.ts';
import type { RGB } from './src/png.ts';
import { wrapText } from './src/font.ts';

const W = 1024;
const H = 1024;

const PAPER: RGB = [246, 241, 227];
const INK: RGB = [27, 27, 27];
const RED: RGB = [168, 35, 26];
const BLUE: RGB = [32, 80, 126];
const TEAL: RGB = [15, 118, 110];
const ORANGE: RGB = [217, 119, 6];
const GOLD: RGB = [194, 148, 32];
const SKY: RGB = [186, 214, 235];
const SEA: RGB = [38, 84, 124];
const GREEN: RGB = [74, 140, 74];
const BALL: RGB = [163, 198, 22];
const GREY: RGB = [120, 120, 112];
const WHITE: RGB = [255, 255, 255];

const cv = new Canvas(W, H);
cv.fill(PAPER);

// ---------- masthead ----------
cv.rect(0, 0, W, 10, RED);
cv.drawTextCentered('THE WORLD IN ONE PICTURE', 512, 28, 4, INK);
cv.drawTextCentered('SUNDAY, 22 NOVEMBER 2026', 512, 74, 3, RED);
cv.drawTextCentered('SIX STORIES FROM AROUND THE GLOBE', 512, 104, 2, INK);
cv.rect(16, 126, 992, 3, INK);
cv.rect(16, 133, 992, 1, INK);

// ---------- lead story: the Gulf ----------
const LEAD_Y = 146;
const LEAD_H = 272;
cv.frame(16, LEAD_Y, 992, LEAD_H, INK);
cv.drawText('THE GULF', 36, LEAD_Y + 16, 2, RED);
cv.drawText('LEAD STORY', 150, LEAD_Y + 16, 2, INK);
cv.drawText('GULF IN FLAMES', 36, LEAD_Y + 40, 4, INK);

// Illustration: industrial site burning on the shore, tanker at sea.
const IX = 36;
const IY = LEAD_Y + 96;
const IW = 420;
const IH = 152;
cv.rect(IX, IY, IW, IH, SKY);
cv.circle(IX + 350, IY + 30, 20, GOLD);
// factory on the left shore
cv.rect(IX + 18, IY + 92, 70, 60, GREY);
cv.rect(IX + 96, IY + 72, 46, 80, [90, 90, 86]);
cv.rect(IX + 30, IY + 60, 10, 34, GREY);
cv.rect(IX + 52, IY + 52, 10, 42, GREY);
// flames over the factory
cv.triangle(IX + 26, IY + 92, IX + 44, IY + 52, IX + 62, IY + 92, ORANGE);
cv.triangle(IX + 52, IY + 92, IX + 72, IY + 44, IX + 92, IY + 92, RED);
cv.triangle(IX + 100, IY + 92, IX + 118, IY + 56, IX + 136, IY + 92, ORANGE);
// smoke
cv.circle(IX + 40, IY + 44, 12, [150, 150, 142]);
cv.circle(IX + 66, IY + 30, 15, [150, 150, 142]);
cv.circle(IX + 118, IY + 40, 12, [150, 150, 142]);
// sea and tanker on the right
cv.rect(IX, IY + 108, IW, 44, SEA);
cv.rect(IX + 230, IY + 84, 150, 24, [40, 40, 40]);
cv.rect(IX + 238, IY + 62, 34, 22, [200, 60, 40]);
cv.rect(IX + 280, IY + 66, 30, 18, [240, 200, 60]);
cv.rect(IX + 318, IY + 66, 30, 18, [60, 140, 90]);
cv.rect(IX + 352, IY + 58, 20, 26, [220, 220, 210]);
cv.rect(IX + 230, IY + 104, 150, 4, [20, 20, 20]);
// small flame on the tanker deck
cv.triangle(IX + 286, IY + 84, IX + 296, IY + 64, IX + 306, IY + 84, ORANGE);
cv.drawText('BAHRAIN - STRAIT OF HORMUZ', IX + 4, IY + IH - 16, 1, WHITE);

// Lead text, right of the illustration.
const TX = 480;
const TW = 992 - (TX - 16) - 20;
const leadLines = wrapText(
  'Iranian missiles set fire to a civilian site in Bahrain late Saturday. Tehran says it hit US air defences. Two oil tankers were struck near the Strait of Hormuz.',
  2,
  TW,
);
let ly = LEAD_Y + 108;
for (const line of leadLines) {
  cv.drawText(line, TX, ly, 2, INK);
  ly += 17;
}
cv.drawText('No injuries reported in Bahrain.', TX, ly + 8, 2, RED);

// ---------- 2x2 grid of stories ----------
type Card = {
  x: number;
  y: number;
  kicker: string;
  headline: string;
  summary: string;
  draw: (x: number, y: number) => void;
};

const CARD_W = 488;
const CARD_H = 196;
const GRID_Y = 434;

function cardFrame(c: Card): void {
  cv.frame(c.x, c.y, CARD_W, CARD_H, INK);
  cv.drawText(c.kicker, c.x + 16, c.y + 12, 2, RED);
  const headLines = wrapText(c.headline, 3, CARD_W - 32 - 132);
  let hy = c.y + 36;
  for (const line of headLines) {
    cv.drawText(line, c.x + 148, hy, 3, INK);
    hy += 23;
  }
  const sumLines = wrapText(c.summary, 2, CARD_W - 32 - 132);
  let sy = hy + 4;
  for (const line of sumLines) {
    cv.drawText(line, c.x + 148, sy, 2, INK);
    sy += 17;
  }
  c.draw(c.x + 16, c.y + 52);
}

const cards: Card[] = [
  {
    x: 16,
    y: GRID_Y,
    kicker: 'CLIMATE - ANTALYA',
    headline: 'COP31 IN OVERTIME',
    summary: 'Climate talks stall on fossil fuels. A new deal text goes to a Sunday vote.',
    draw: (x, y) => {
      // globe with chimneys
      cv.circle(x + 58, y + 58, 52, BLUE);
      cv.circle(x + 44, y + 44, 16, GREEN);
      cv.circle(x + 76, y + 70, 20, GREEN);
      cv.circle(x + 58, y + 92, 12, GREEN);
      cv.ring(x + 58, y + 58, 52, 2, INK);
      cv.line(x + 58, y + 6, x + 58, y + 110, [200, 220, 235]);
      cv.line(x + 8, y + 58, x + 108, y + 58, [200, 220, 235]);
    },
  },
  {
    x: 520,
    y: GRID_Y,
    kicker: 'ISRAEL',
    headline: 'EISENKOT TO FORM GOVT',
    summary: 'President Herzog taps the ex-army chief, bypassing Netanyahu.',
    draw: (x, y) => {
      // parliament building with columns and dome
      cv.rect(x + 8, y + 76, 100, 34, [210, 196, 160]);
      cv.triangle(x + 8, y + 76, x + 58, y + 46, x + 108, y + 76, [190, 170, 130]);
      cv.circle(x + 58, y + 44, 14, [190, 170, 130]);
      for (let i = 0; i < 4; i++) {
        cv.rect(x + 18 + i * 24, y + 80, 8, 26, WHITE);
      }
      cv.rect(x + 4, y + 110, 108, 6, INK);
    },
  },
  {
    x: 16,
    y: GRID_Y + CARD_H + 16,
    kicker: 'USA - FLORIDA',
    headline: 'FLORIDA UNDER WATER',
    summary: 'St Johns River breaks a 73-year flood record near Cocoa.',
    draw: (x, y) => {
      // flooded house under waves
      cv.rect(x + 8, y + 60, 100, 50, [210, 196, 160]);
      cv.triangle(x + 8, y + 60, x + 58, y + 28, x + 108, y + 60, RED);
      cv.rect(x + 48, y + 84, 20, 26, INK);
      cv.rect(x, y + 96, 116, 18, SEA);
      cv.rect(x, y + 88, 116, 4, [140, 190, 220]);
      cv.drawText('73-YEAR RECORD', x + 2, y + 122, 1, BLUE);
    },
  },
  {
    x: 520,
    y: GRID_Y + CARD_H + 16,
    kicker: 'INDIA - MANIPUR',
    headline: 'TOXIC LIQUOR KILLS',
    summary: '11 dead in Manipur; tainted alcohol puts 180+ in hospital.',
    draw: (x, y) => {
      // bottle with a warning cross over it, plus a hospital cross
      cv.rect(x + 40, y + 14, 22, 12, INK);
      cv.rect(x + 46, y + 26, 10, 14, [90, 90, 86]);
      cv.rect(x + 30, y + 40, 42, 66, [200, 190, 170]);
      cv.rect(x + 30, y + 40, 42, 10, RED);
      cv.line(x + 32, y + 54, x + 70, y + 100, RED);
      cv.line(x + 70, y + 54, x + 32, y + 100, RED);
      cv.rect(x + 92, y + 30, 24, 8, TEAL);
      cv.rect(x + 100, y + 22, 8, 24, TEAL);
    },
  },
];

for (const c of cards) cardFrame(c);

// ---------- sport strip: ATP Finals ----------
const SPORT_Y = GRID_Y + CARD_H * 2 + 16 + 16;
const SPORT_H = 118;
cv.frame(16, SPORT_Y, 992, SPORT_H, INK);
cv.drawText('SPORT - TENNIS', 36, SPORT_Y + 12, 2, RED);
// tennis ball
cv.circle(96, SPORT_Y + 66, 34, BALL);
cv.ring(96, SPORT_Y + 66, 34, 2, INK);
cv.thickLine(70, SPORT_Y + 44, 78, SPORT_Y + 66, 3, WHITE);
cv.thickLine(78, SPORT_Y + 66, 70, SPORT_Y + 88, 3, WHITE);
cv.thickLine(122, SPORT_Y + 44, 114, SPORT_Y + 66, 3, WHITE);
cv.thickLine(114, SPORT_Y + 66, 122, SPORT_Y + 88, 3, WHITE);
// racket
cv.ring(196, SPORT_Y + 60, 26, 3, INK);
cv.thickLine(196, SPORT_Y + 86, 196, SPORT_Y + 108, 2, INK);
for (let i = -2; i <= 2; i++) {
  cv.line(196 + i * 9, SPORT_Y + 38, 196 + i * 9, SPORT_Y + 82, [150, 150, 142]);
  cv.line(174, SPORT_Y + 60 + i * 9, 218, SPORT_Y + 60 + i * 9, [150, 150, 142]);
}
cv.drawText('ZVEREV v ALCARAZ', 250, SPORT_Y + 22, 4, INK);
cv.drawText('ATP FINALS TITLE DECIDER IN TURIN TONIGHT', 250, SPORT_Y + 62, 2, INK);
cv.drawText('World No. 1 meets the No. 2 seed for the season-ending crown.', 250, SPORT_Y + 86, 2, INK);

// ---------- footer ----------
const FOOT_Y = SPORT_Y + SPORT_H + 14;
cv.rect(16, FOOT_Y, 992, 2, INK);
cv.drawTextCentered('22 NOVEMBER 2026 - SIX STORIES - THE WORLD IN ONE PICTURE', 512, FOOT_Y + 10, 2, INK);

// ---------- write ----------
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'entry.png'), cv.toPng());
