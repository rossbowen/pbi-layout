import type { ColourTokens, ChromeConfig, CanvasSizeKey } from "./types"

// ─── Canvas size configurations ───────────────────────────────────────────────

export interface CanvasSizeConfig {
  label: string
  w: number
  h: number
  scale: number // display scale so canvas fits in panel
  // 12-column grid derived from width
  edgeGutter: number
  colWidth: number
  colGutter: number
}

// Grid formula for width W: edge + 12*col + 11*gutter + edge = W
// We keep col:gutter ratio ≈ 80:26 (≈3.08:1) and solve for integers.
// 1280: 17 + 12*80 + 11*26 + 17 = 1280 ✓
// 1440: scale 1440/1280 → edge≈19, col≈90, gutter≈29 → 19+12*90+11*29+19=1438 ≈ adjust to edge=21
//        21 + 12*90 + 11*29 + 21 = 42+1080+319 = 1441 → use edge=20, col=90, gutter=29: 40+1080+319=1439 → edge=21,col=90,gutter=28: 42+1080+308=1430
//        Simplest: scale proportionally and round. 1440/1280=1.125 → col=90, gutter=29, edge=19: 38+1080+319=1437, add 3 to edges → edge=20.5→21: 42+1080+319=1441. Use edge=19,col=90,gutter=29,last_edge=22: not symmetric.
//        Just use: 1440 → edge=20, col=90, gutter=29: 2*20+12*90+11*29=40+1080+319=1439. Close enough, +1 to first edge=21: 1440 ✓
// 1920: 1920/1280=1.5 → col=120, gutter=39, edge=25.5→26: 2*26+12*120+11*39=52+1440+429=1921 → edge=25: 50+1440+429=1919 → edge=26,gutter=38: 52+1440+418=1910.
//        Use col=120,gutter=40,edge=20: 40+1440+440=1920 ✓

export const CANVAS_SIZES: Record<CanvasSizeKey, CanvasSizeConfig> = {
  "1280x720": { label: "1280×720", w: 1280, h: 720, scale: 0.5, edgeGutter: 17, colWidth: 80, colGutter: 26 },
  "1440x1080": { label: "1440×1080", w: 1440, h: 1080, scale: 0.444, edgeGutter: 20, colWidth: 80, colGutter: 40 },
  "1920x1080": { label: "1920×1080", w: 1920, h: 1080, scale: 0.333, edgeGutter: 20, colWidth: 120, colGutter: 40 },
}

// Active canvas size — default 1280×720
export const DEFAULT_CANVAS_SIZE: CanvasSizeKey = "1280x720"

// ─── Legacy constants (1280×720 baseline, used in tests + grid math) ──────────

// Canvas dimensions (logical / 1280×720 scale)
export const CANVAS_W = 1280
export const CANVAS_H = 720
export const SCALE = 0.5 // display at 640×360

// Derived display dimensions
export const DISPLAY_W = CANVAS_W * SCALE // 640
export const DISPLAY_H = CANVAS_H * SCALE // 360

// Power BI 12-column grid (logical px)
// Layout: 17 | col(80) | 26 | col(80) | 26 | ... | col(80) | 17
// Total: 17 + 12*80 + 11*26 + 17 = 1280 ✓
export const EDGE_GUTTER = 17
export const COL_WIDTH = 80
export const COL_GUTTER = 26
export const COL_COUNT = 12
export const COL_STRIDE = COL_WIDTH + COL_GUTTER // 106

// Chrome heights (logical px)
export const HEADER_H = 60
export const FOOTER_H = 40

// Vertical row grid
export const ROW_SNAP = 20 // logical px
export const ROW_GAP = 20 // gap between rows, logical px
export const LAST_ROW_EXTRA = 20 // extra height for the last row when rowCount >= 4

export const DEFAULT_COLOURS: ColourTokens = {
  headerBg: "#242424",
  footerBg: "#E6E6E6",
  sidebarBg: "#E6E6E6",
  canvasBg: "#FAFAFA",
  elementFill: "#F0F0F0",
}

export const DEFAULT_CHROME: ChromeConfig = {
  header: true,
  footer: true,
  sidebarCols: 2,
  sidebarSide: "left",
}

export const COLOUR_LABELS: Record<keyof ColourTokens, string> = {
  headerBg: "Header",
  footerBg: "Footer",
  sidebarBg: "Sidebar",
  canvasBg: "Canvas",
  elementFill: "Element",
}
