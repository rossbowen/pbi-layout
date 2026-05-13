import { HEADER_H, FOOTER_H, ROW_SNAP, ROW_GAP, COL_COUNT, CANVAS_SIZES, DEFAULT_CANVAS_SIZE } from "../constants"
import type { ChromeConfig, LayoutElement, SidebarCols } from "../types"
import type { CanvasSizeConfig } from "../constants"

// ─── Grid config ─────────────────────────────────────────────────────────────

/**
 * Subset of CanvasSizeConfig used for grid math.
 * Pass this to all grid functions so they work for any canvas size.
 */
export interface GridConfig {
  /** Canvas logical width (px) */
  w: number
  /** Canvas logical height (px) */
  h: number
  /** Left/right edge gutter (px) */
  edgeGutter: number
  /** Column width (px) */
  colWidth: number
  /** Inter-column gutter (px) */
  colGutter: number
}

/** Derive GridConfig from a CanvasSizeConfig */
export function gridConfigFrom(cfg: CanvasSizeConfig): GridConfig {
  return { w: cfg.w, h: cfg.h, edgeGutter: cfg.edgeGutter, colWidth: cfg.colWidth, colGutter: cfg.colGutter }
}

/** Default grid config (1280×720) */
export const DEFAULT_GRID: GridConfig = gridConfigFrom(CANVAS_SIZES[DEFAULT_CANVAS_SIZE])

// ─── Column geometry ─────────────────────────────────────────────────────────

/** Left edge of column n (1-based), logical px from canvas left */
export function colLeft(n: number, g: GridConfig = DEFAULT_GRID): number {
  return g.edgeGutter + (n - 1) * (g.colWidth + g.colGutter)
}

/** Right edge of column n (1-based), logical px */
export function colRight(n: number, g: GridConfig = DEFAULT_GRID): number {
  return colLeft(n, g) + g.colWidth
}

/** Pixel width of a span of s columns, logical px */
export function spanWidth(s: number, g: GridConfig = DEFAULT_GRID): number {
  return s * g.colWidth + (s - 1) * g.colGutter
}

/**
 * Sidebar pixel width: occupies the first sidebarCols columns including the
 * right gutter, so content elements can start cleanly at col (sidebarCols+1).
 */
export function sidebarWidth(sidebarCols: SidebarCols, g: GridConfig = DEFAULT_GRID): number {
  if (sidebarCols === 0) return 0
  return colRight(sidebarCols, g)
}

// ─── Content area ─────────────────────────────────────────────────────────────

export interface ContentArea {
  top: number // logical px from canvas top
  bottom: number
  left: number // logical px from canvas left
  height: number
  firstCol: number // first column available for elements
  lastCol: number // last column available for elements
}

export function contentArea(chrome: ChromeConfig, g: GridConfig = DEFAULT_GRID): ContentArea {
  const top = (chrome.header ? HEADER_H : 0) + ROW_GAP
  const bottom = g.h - (chrome.footer ? FOOTER_H : 0) - ROW_GAP
  const isRight = chrome.sidebarCols > 0 && chrome.sidebarSide === "right"
  const isLeft = chrome.sidebarCols > 0 && chrome.sidebarSide !== "right"
  const left = isLeft ? sidebarWidth(chrome.sidebarCols, g) : 0
  const firstCol = isLeft ? chrome.sidebarCols + 1 : 1
  const lastCol = isRight ? COL_COUNT - chrome.sidebarCols : COL_COUNT
  return { top, bottom, left, height: bottom - top, firstCol, lastCol }
}

// ─── Row geometry ─────────────────────────────────────────────────────────────

/**
 * Base row height: snap all rows to ROW_SNAP, derived from equal division.
 * The last row(s) receive the remainder to fill the content area exactly.
 *
 * Strategy: first (rowCount-1) rows are equal and ROW_SNAP-aligned.
 * For 4 rows: first 2 snapped, last 2 share remainder (snapped + residual).
 * This guarantees no wasted space at the bottom regardless of rounding.
 */
export function rowHeight(rowCount: number, chrome: ChromeConfig, g: GridConfig = DEFAULT_GRID): number {
  const area = contentArea(chrome, g)
  const totalGaps = (rowCount - 1) * ROW_GAP
  return Math.floor((area.height - totalGaps) / rowCount / ROW_SNAP) * ROW_SNAP
}

/** Height of row r (1-based). Last row(s) absorb rounding remainder to fill content exactly. */
export function rowHeightFor(r: number, rowCount: number, chrome: ChromeConfig, g: GridConfig = DEFAULT_GRID): number {
  const area = contentArea(chrome, g)
  const totalGaps = (rowCount - 1) * ROW_GAP
  const base = Math.floor((area.height - totalGaps) / rowCount / ROW_SNAP) * ROW_SNAP

  if (rowCount <= 2) {
    // Last row gets the exact remainder
    return r === rowCount ? area.height - base * (rowCount - 1) - totalGaps : base
  }
  if (rowCount === 3) {
    // Rows 1–2 are base; row 3 gets remainder
    return r === 3 ? area.height - base * 2 - totalGaps : base
  }
  // 4 rows: rows 1–2 are base; rows 3–4 share remainder
  const remainder = area.height - base * 2 - totalGaps
  const eachLast = Math.floor(remainder / 2 / ROW_SNAP) * ROW_SNAP
  if (r <= 2) return base
  if (r === 3) return eachLast
  return remainder - eachLast // row 4 picks up any residual
}

/** Top edge of row r (1-based), logical px from canvas top */
export function rowTop(r: number, rowCount: number, chrome: ChromeConfig, g: GridConfig = DEFAULT_GRID): number {
  const area = contentArea(chrome, g)
  let top = area.top
  for (let i = 1; i < r; i++) {
    top += rowHeightFor(i, rowCount, chrome, g) + ROW_GAP
  }
  return top
}

// ─── Element pixel bounds (fully derived) ────────────────────────────────────

export interface ElementBounds {
  x: number
  y: number
  width: number
  height: number
}

export function elementBounds(
  el: LayoutElement,
  rowCount: number,
  chrome: ChromeConfig,
  g: GridConfig = DEFAULT_GRID,
): ElementBounds {
  const span = el.rowSpan ?? 1
  const lastRow = Math.min(el.row + span - 1, rowCount)
  // Sum heights of all spanned rows plus the gaps between them
  let height = 0
  for (let r = el.row; r <= lastRow; r++) {
    height += rowHeightFor(r, rowCount, chrome, g)
    if (r < lastRow) height += ROW_GAP
  }
  return {
    x: colLeft(el.colStart, g),
    y: rowTop(el.row, rowCount, chrome, g),
    width: spanWidth(el.colSpan, g),
    height,
  }
}

// ─── Snap helpers for drag-resize ────────────────────────────────────────────

/**
 * Given a display-px X position, return the nearest column index (1-based).
 * Snaps to whichever column boundary (left or right edge) is closest.
 * Used for left-edge drags (snap to colStart) and right-edge drags (snap to colEnd).
 */
export function snapXToCol(displayX: number, scale: number, g: GridConfig = DEFAULT_GRID): number {
  const logicalX = displayX / scale
  // Find the column whose left or right edge is nearest
  let bestCol = 1
  let bestDist = Infinity
  for (let c = 1; c <= COL_COUNT; c++) {
    const dl = Math.abs(logicalX - colLeft(c, g))
    const dr = Math.abs(logicalX - colRight(c, g))
    if (dl < bestDist) {
      bestDist = dl
      bestCol = c
    }
    if (dr < bestDist) {
      bestDist = dr
      bestCol = -c
    } // negative = right edge of col c
  }
  return bestCol
}

/**
 * Snap display-px X to nearest column left edge → returns column index (1-based).
 */
export function snapXToColStart(displayX: number, scale: number, g: GridConfig = DEFAULT_GRID): number {
  const logicalX = displayX / scale
  let bestCol = 1
  let bestDist = Infinity
  for (let c = 1; c <= COL_COUNT; c++) {
    const d = Math.abs(logicalX - colLeft(c, g))
    if (d < bestDist) {
      bestDist = d
      bestCol = c
    }
  }
  return bestCol
}

/**
 * Snap display-px X to nearest column right edge → returns column index (1-based).
 */
export function snapXToColEnd(displayX: number, scale: number, g: GridConfig = DEFAULT_GRID): number {
  const logicalX = displayX / scale
  let bestCol = 1
  let bestDist = Infinity
  for (let c = 1; c <= COL_COUNT; c++) {
    const d = Math.abs(logicalX - colRight(c, g))
    if (d < bestDist) {
      bestDist = d
      bestCol = c
    }
  }
  return bestCol
}

/**
 * Snap display-px Y to nearest row top edge → returns row index (1-based).
 */
export function snapYToRow(
  displayY: number,
  scale: number,
  rowCount: number,
  chrome: ChromeConfig,
  g: GridConfig = DEFAULT_GRID,
): number {
  const logicalY = displayY / scale
  let bestRow = 1
  let bestDist = Infinity
  for (let r = 1; r <= rowCount; r++) {
    const d = Math.abs(logicalY - rowTop(r, rowCount, chrome, g))
    if (d < bestDist) {
      bestDist = d
      bestRow = r
    }
  }
  return bestRow
}

/**
 * Snap display-px Y to nearest row bottom edge → returns row index (1-based).
 */
export function snapYToRowEnd(
  displayY: number,
  scale: number,
  rowCount: number,
  chrome: ChromeConfig,
  g: GridConfig = DEFAULT_GRID,
): number {
  const logicalY = displayY / scale
  let bestRow = 1
  let bestDist = Infinity
  for (let r = 1; r <= rowCount; r++) {
    const bottom = rowTop(r, rowCount, chrome, g) + rowHeightFor(r, rowCount, chrome, g)
    const d = Math.abs(logicalY - bottom)
    if (d < bestDist) {
      bestDist = d
      bestRow = r
    }
  }
  return bestRow
}

// ─── Column grid bands for canvas overlay ────────────────────────────────────

export interface ColBand {
  x: number // display px
  w: number // display px
}

export function colBands(scale: number, g: GridConfig = DEFAULT_GRID): ColBand[] {
  return Array.from({ length: COL_COUNT }, (_, i) => ({
    x: colLeft(i + 1, g) * scale,
    w: g.colWidth * scale,
  }))
}
