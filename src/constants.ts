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
  // Vertical metrics, scaled with the canvas so proportions hold at every size
  headerH: number
  footerH: number
  rowGap: number
  rowSnap: number
}

// Grid formula for width W: edge + 12*col + 11*gutter + edge = W
// 1280: 17 + 12*80  + 11*26 + 17 = 1280 ✓
// 1920: 20 + 12*120 + 11*40 + 20 = 1920 ✓ (1.5× of 1280 isn't integral, so edge/gutter are rounded)
// 2560: 34 + 12*160 + 11*52 + 34 = 2560 ✓ (2× of 1280)
// 3840: 51 + 12*240 + 11*78 + 51 = 3840 ✓ (3× of 1280)
// Display scale is 640 / w so every size previews at 640×360.

export const CANVAS_SIZES: Record<CanvasSizeKey, CanvasSizeConfig> = {
  "1280x720": {
    label: "1280×720",
    w: 1280,
    h: 720,
    scale: 640 / 1280,
    edgeGutter: 17,
    colWidth: 80,
    colGutter: 26,
    headerH: 60,
    footerH: 40,
    rowGap: 20,
    rowSnap: 20,
  },
  "1920x1080": {
    label: "1920×1080",
    w: 1920,
    h: 1080,
    scale: 640 / 1920,
    edgeGutter: 20,
    colWidth: 120,
    colGutter: 40,
    headerH: 90,
    footerH: 60,
    rowGap: 30,
    rowSnap: 30,
  },
  "2560x1440": {
    label: "2560×1440",
    w: 2560,
    h: 1440,
    scale: 640 / 2560,
    edgeGutter: 34,
    colWidth: 160,
    colGutter: 52,
    headerH: 120,
    footerH: 80,
    rowGap: 40,
    rowSnap: 40,
  },
  "3840x2160": {
    label: "3840×2160",
    w: 3840,
    h: 2160,
    scale: 640 / 3840,
    edgeGutter: 51,
    colWidth: 240,
    colGutter: 78,
    headerH: 180,
    footerH: 120,
    rowGap: 60,
    rowSnap: 60,
  },
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

// Chrome heights (logical px, 1280×720 — other sizes use CANVAS_SIZES)
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
