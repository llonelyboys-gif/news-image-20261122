# The World in One Picture — 22 November 2026

[![make.fun bounty](https://img.shields.io/badge/make.fun-bounty-blue)](https://make.fun/bounty/news-image-20261122)
[![Prize $100](https://img.shields.io/badge/prize-%24100-green)](https://make.fun/bounty/news-image-20261122)
[![News Image 22 Nov 2026](https://img.shields.io/badge/news--image-22%20Nov%202026-orange)](https://make.fun/bounty/news-image-20261122)

A one-page newspaper front page that sums up the world's news of **Sunday, 22 November 2026** in a single 1024×1024 image, drawn from scratch by a deterministic Node 22 program (standard library only, no network).

## The six stories

1. **The Gulf** — Iranian missiles set fire to a civilian site in Bahrain; Tehran says it hit US air defences; two oil tankers struck near the Strait of Hormuz.
2. **COP31, Antalya** — climate talks run into overtime, deadlocked over fossil fuels; a new deal text goes to a Sunday vote.
3. **Israel** — President Herzog asks Gadi Eisenkot to form the next government, bypassing Benjamin Netanyahu.
4. **Florida, USA** — the St Johns River breaks a 73-year flood record near Cocoa after days of heavy rain.
5. **India** — toxic alcohol kills at least 11 people in Manipur; more than 180 are in hospital.
6. **Sport** — Zverev meets Alcaraz in the ATP Finals title decider in Turin on Sunday night.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

This writes `out/entry.png`. Running it twice produces byte-identical output (verified with `sha256sum`).

## How it works

- `main.ts` — the newspaper layout: masthead, lead story, four story cards and a sport strip.
- `src/png.ts` — a small RGB canvas (rectangles, lines, circles, triangles) plus a PNG encoder written from scratch (CRC32, zlib deflate).
- `src/font.ts` — a hand-drawn 5×7 bitmap font (A–Z, a–z, 0–9, punctuation) with word wrapping.

Entry for the [make.fun bounty](https://make.fun/bounty/news-image-20261122) `news-image-20261122`.
