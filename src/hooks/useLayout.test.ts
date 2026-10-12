import { describe, it, expect } from "vitest"
import { remapElements } from "./useLayout"
import type { ColBase } from "./useLayout"
import { PRESETS } from "../presets"
import type { ChromeConfig, LayoutElement, SidebarCols, SidebarSide } from "../types"

/** Apply a sequence of sidebar settings the way the layout state does */
function applySidebarSteps(start: ChromeConfig, elements: LayoutElement[], steps: [SidebarCols, SidebarSide][]) {
  let chrome = start
  let colBase: Record<string, ColBase> = {}
  for (const [sidebarCols, sidebarSide] of steps) {
    const next = { ...chrome, sidebarCols, sidebarSide }
    ;({ elements, colBase } = remapElements(elements, chrome, next, colBase))
    chrome = next
  }
  return elements
}

describe("remapElements", () => {
  it.each(PRESETS.map((p) => [p.name, p] as const))("%s returns to its original layout after sidebar changes", (_, p) => {
    const { sidebarCols, sidebarSide } = p.chrome
    const result = applySidebarSteps(p.chrome, p.elements, [
      [2, "left"],
      [3, "left"],
      [3, "right"],
      [0, "left"],
      [2, "right"],
      [sidebarCols, sidebarSide],
    ])
    expect(result).toEqual(p.elements)
  })

  it.each(PRESETS.map((p) => [p.name, p] as const))("%s retraces Off → 2-col → 3-col → 2-col → Off", (_, p) => {
    const off: ChromeConfig = { ...p.chrome, sidebarCols: 0 }
    const start = applySidebarSteps(p.chrome, p.elements, [[0, "left"]])
    const twoCol = applySidebarSteps(off, start, [[2, "left"]])
    const backToTwoCol = applySidebarSteps(off, start, [
      [2, "left"],
      [3, "left"],
      [2, "left"],
    ])
    const backToOff = applySidebarSteps(off, start, [
      [2, "left"],
      [3, "left"],
      [2, "left"],
      [0, "left"],
    ])
    expect(backToTwoCol).toEqual(twoCol)
    expect(backToOff).toEqual(start)
  })

  it("keeps every element inside the content range", () => {
    for (const p of PRESETS) {
      const result = applySidebarSteps(p.chrome, p.elements, [[3, "right"]])
      for (const el of result) {
        expect(el.colStart).toBeGreaterThanOrEqual(1)
        expect(el.colStart + el.colSpan - 1).toBeLessThanOrEqual(9)
      }
    }
  })
})
