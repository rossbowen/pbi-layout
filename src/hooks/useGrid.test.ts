import { describe, it, expect } from "vitest"
import {
  colLeft,
  colRight,
  spanWidth,
  sidebarWidth,
  contentArea,
  rowHeight,
  rowHeightFor,
  rowTop,
  elementBounds,
  colBands,
} from "./useGrid"
import type { ChromeConfig } from "../types"
import { ROW_GAP } from "../constants"

// ─── Fixtures ────────────────────────────────────────────────────────────────

const BARE: ChromeConfig = { header: false, footer: false, sidebarCols: 0, sidebarSide: "left" }
const HF: ChromeConfig = { header: true, footer: true, sidebarCols: 0, sidebarSide: "left" }
const SB2: ChromeConfig = { header: true, footer: true, sidebarCols: 2, sidebarSide: "left" }
const SB3: ChromeConfig = { header: true, footer: true, sidebarCols: 3, sidebarSide: "left" }
const SB2R: ChromeConfig = { header: true, footer: true, sidebarCols: 2, sidebarSide: "right" }
const HF_ONLY: ChromeConfig = { header: true, footer: false, sidebarCols: 0, sidebarSide: "left" }

// ─── Column geometry ─────────────────────────────────────────────────────────

describe("colLeft", () => {
  it("col 1 starts at edge gutter (17px)", () => {
    expect(colLeft(1)).toBe(17)
  })
  it("col 2 starts at 17 + 106 = 123px", () => {
    expect(colLeft(2)).toBe(123)
  })
  it("col 12 starts at 17 + 11×106 = 1183px", () => {
    expect(colLeft(12)).toBe(1183)
  })
})

describe("colRight", () => {
  it("col 1 right edge = colLeft(1) + 80", () => {
    expect(colRight(1)).toBe(17 + 80)
  })
  it("col 12 right + right gutter = 1280", () => {
    expect(colRight(12) + 17).toBe(1280)
  })
})

describe("spanWidth", () => {
  it("1 column = 80px", () => {
    expect(spanWidth(1)).toBe(80)
  })
  it("2 columns = 80+26+80 = 186px", () => {
    expect(spanWidth(2)).toBe(186)
  })
  it("12 columns fills canvas minus both gutters", () => {
    // 17 + spanWidth(12) + 17 = 1280
    expect(17 + spanWidth(12) + 17).toBe(1280)
  })
})

// ─── Sidebar geometry ────────────────────────────────────────────────────────

describe("sidebarWidth", () => {
  it("0 cols → 0px", () => {
    expect(sidebarWidth(0)).toBe(0)
  })
  it("2 cols → right edge of col 2 = 203px", () => {
    expect(sidebarWidth(2)).toBe(colRight(2))
    expect(sidebarWidth(2)).toBe(203)
  })
  it("3 cols → right edge of col 3 = 309px", () => {
    expect(sidebarWidth(3)).toBe(colRight(3))
    expect(sidebarWidth(3)).toBe(309)
  })
  it("sidebar aligns exactly to a column right edge (whole px)", () => {
    expect(sidebarWidth(2) % 1).toBe(0)
    expect(sidebarWidth(3) % 1).toBe(0)
  })
})

// ─── Content area ────────────────────────────────────────────────────────────

describe("contentArea", () => {
  it("no chrome → top=20 (gap), bottom=700 (gap), height=680", () => {
    const a = contentArea(BARE)
    expect(a.top).toBe(20)
    expect(a.bottom).toBe(700)
    expect(a.height).toBe(680)
    expect(a.left).toBe(0)
    expect(a.firstCol).toBe(1)
  })

  it("header + footer → top=80 (60+20gap), bottom=660 (40footer+20gap), height=580", () => {
    const a = contentArea(HF)
    expect(a.top).toBe(80)
    expect(a.bottom).toBe(660)
    expect(a.height).toBe(580)
  })

  it("2-col sidebar → left=203 (colRight(2)), firstCol=3", () => {
    const a = contentArea(SB2)
    expect(a.left).toBe(203)
    expect(a.firstCol).toBe(3)
  })

  it("3-col sidebar → left=309 (colRight(3)), firstCol=4", () => {
    const a = contentArea(SB3)
    expect(a.left).toBe(309)
    expect(a.firstCol).toBe(4)
  })

  it("right 2-col sidebar → left=0, firstCol=1, lastCol=10", () => {
    const a = contentArea(SB2R)
    expect(a.left).toBe(0)
    expect(a.firstCol).toBe(1)
    expect(a.lastCol).toBe(10)
  })
})

// ─── Row geometry ────────────────────────────────────────────────────────────

describe("rowHeight", () => {
  it("base height is always a multiple of 20px", () => {
    for (const chrome of [BARE, HF, SB2, HF_ONLY]) {
      for (const rows of [1, 2, 3, 4]) {
        expect(rowHeight(rows, chrome) % 20).toBe(0)
      }
    }
  })

  it("1 row, H+F → 580px (full content height)", () => {
    expect(rowHeight(1, HF)).toBe(580)
  })

  it("2 rows, H+F → 280px base (floor(560/2/20)*20)", () => {
    expect(rowHeight(2, HF)).toBe(280)
  })

  it("3 rows, H+F → 180px base (floor(540/3/20)*20)", () => {
    // content=580, gaps=40, (580-40)/3=180 exactly
    expect(rowHeight(3, HF)).toBe(180)
  })

  it("2 rows, no chrome → 320px base", () => {
    // content=680, gaps=20, (680-20)/2=330 → floor(330/20)*20=320
    expect(rowHeight(2, BARE)).toBe(320)
  })
})

describe("rowHeightFor — fills content area with no wasted space", () => {
  it("all rows fill the content area exactly", () => {
    for (const chrome of [BARE, HF, HF_ONLY, SB2]) {
      for (const rows of [1, 2, 3, 4]) {
        const area = contentArea(chrome)
        const totalGaps = (rows - 1) * ROW_GAP
        const totalH = Array.from({ length: rows }, (_, i) => rowHeightFor(i + 1, rows, chrome)).reduce(
          (a, b) => a + b,
          0,
        )
        expect(totalH + totalGaps).toBe(area.height)
      }
    }
  })

  it("3 rows, H+F → all three rows are 180px (no gap to footer)", () => {
    // Regression: old LAST_ROW_EXTRA approach left a 40px gap at bottom
    expect(rowHeightFor(1, 3, HF)).toBe(180)
    expect(rowHeightFor(2, 3, HF)).toBe(180)
    expect(rowHeightFor(3, 3, HF)).toBe(180)
  })

  it("last row is always >= base row height (never shorter)", () => {
    for (const chrome of [BARE, HF, HF_ONLY]) {
      for (const rows of [1, 2, 3, 4]) {
        const base = rowHeight(rows, chrome)
        expect(rowHeightFor(rows, rows, chrome)).toBeGreaterThanOrEqual(base)
      }
    }
  })
})

describe("rowTop", () => {
  it("row 1 starts at content top", () => {
    expect(rowTop(1, 2, HF)).toBe(80) // 60 header + 20 gap
    expect(rowTop(1, 2, BARE)).toBe(20) // no chrome, still 20px inset
  })

  it("row 2 starts at content top + rowHeightFor(1) + gap", () => {
    const rh = rowHeightFor(1, 2, HF)
    expect(rowTop(2, 2, HF)).toBe(80 + rh + ROW_GAP)
  })

  it("adjacent rows are exactly rowHeight(base) + gap apart", () => {
    const rh = rowHeight(3, HF)
    expect(rowTop(2, 3, HF) - rowTop(1, 3, HF)).toBe(rh + ROW_GAP)
    expect(rowTop(3, 3, HF) - rowTop(2, 3, HF)).toBe(rh + ROW_GAP)
  })
})

// ─── elementBounds ───────────────────────────────────────────────────────────

describe("elementBounds", () => {
  it("derives x from colStart", () => {
    const el = { id: "x", label: "", row: 1, colStart: 3, colSpan: 4 }
    const b = elementBounds(el, 2, HF)
    expect(b.x).toBe(colLeft(3))
  })

  it("derives width from colSpan", () => {
    const el = { id: "x", label: "", row: 1, colStart: 3, colSpan: 4 }
    const b = elementBounds(el, 2, HF)
    expect(b.width).toBe(spanWidth(4))
  })

  it("derives y from row", () => {
    const el = { id: "x", label: "", row: 2, colStart: 1, colSpan: 12 }
    const b = elementBounds(el, 2, HF)
    expect(b.y).toBe(rowTop(2, 2, HF))
  })

  it("derives height from rowHeightFor", () => {
    const el = { id: "x", label: "", row: 1, colStart: 1, colSpan: 12 }
    const b = elementBounds(el, 3, HF)
    expect(b.height).toBe(rowHeightFor(1, 3, HF))
  })

  it("element does not overlap sidebar", () => {
    const el = { id: "x", label: "", row: 1, colStart: 3, colSpan: 5 }
    const b = elementBounds(el, 2, SB2)
    expect(b.x).toBeGreaterThanOrEqual(sidebarWidth(2))
  })
})

// ─── colBands ────────────────────────────────────────────────────────────────

describe("colBands", () => {
  it("returns 12 bands", () => {
    expect(colBands(1).length).toBe(12)
  })

  it("at scale 1, first band starts at colLeft(1)", () => {
    expect(colBands(1)[0].x).toBe(colLeft(1))
  })

  it("at scale 0.5, band positions are halved", () => {
    const full = colBands(1)
    const half = colBands(0.5)
    full.forEach((b, i) => {
      expect(half[i].x).toBe(b.x * 0.5)
      expect(half[i].w).toBe(b.w * 0.5)
    })
  })

  it("bands do not overlap (each band ends before the next starts)", () => {
    const bands = colBands(1)
    for (let i = 0; i < bands.length - 1; i++) {
      expect(bands[i].x + bands[i].w).toBeLessThan(bands[i + 1].x)
    }
  })

  it("last band right edge + right gutter = 1280", () => {
    const bands = colBands(1)
    const last = bands[bands.length - 1]
    expect(last.x + last.w + 17).toBe(1280)
  })
})
