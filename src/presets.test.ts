import { describe, it, expect } from "vitest"
import { PRESETS } from "./presets"
import { CANVAS_SIZES, COL_COUNT } from "./constants"
import { contentArea, elementBounds, gridConfigFrom } from "./hooks/useGrid"
import type { CanvasSizeKey } from "./types"

describe("canvas sizes", () => {
  it.each(Object.keys(CANVAS_SIZES) as CanvasSizeKey[])("%s grid fills the canvas width exactly", (key) => {
    const c = CANVAS_SIZES[key]
    expect(c.edgeGutter * 2 + c.colWidth * COL_COUNT + c.colGutter * (COL_COUNT - 1)).toBe(c.w)
    expect(c.w * c.scale).toBeCloseTo(640)
  })
})

describe("presets", () => {
  it("have unique ids", () => {
    expect(new Set(PRESETS.map((p) => p.id)).size).toBe(PRESETS.length)
  })

  it.each(PRESETS.map((p) => [p.id, p] as const))("%s tiles the content area without overlap", (_id, p) => {
    const firstCol = p.chrome.sidebarCols + 1
    const cells = new Set<string>()
    for (const el of p.elements) {
      expect(el.colStart).toBeGreaterThanOrEqual(firstCol)
      expect(el.colStart + el.colSpan - 1).toBeLessThanOrEqual(COL_COUNT)
      expect(el.row + el.rowSpan - 1).toBeLessThanOrEqual(p.rowCount)
      for (let r = el.row; r < el.row + el.rowSpan; r++) {
        for (let c = el.colStart; c < el.colStart + el.colSpan; c++) {
          expect(cells.has(`${r}:${c}`)).toBe(false)
          cells.add(`${r}:${c}`)
        }
      }
    }
    expect(cells.size).toBe(p.rowCount * (COL_COUNT - p.chrome.sidebarCols))
  })

  it.each(Object.keys(CANVAS_SIZES) as CanvasSizeKey[])("fit inside the content area at %s", (key) => {
    const g = gridConfigFrom(CANVAS_SIZES[key])
    for (const p of PRESETS) {
      const area = contentArea(p.chrome, g)
      for (const el of p.elements) {
        const b = elementBounds(el, p.rowCount, p.chrome, g)
        expect(b.height).toBeGreaterThan(0)
        expect(b.y).toBeGreaterThanOrEqual(area.top)
        expect(b.y + b.height).toBeLessThanOrEqual(area.bottom)
        expect(b.x + b.width).toBeLessThanOrEqual(g.w - g.edgeGutter)
      }
    }
  })
})
