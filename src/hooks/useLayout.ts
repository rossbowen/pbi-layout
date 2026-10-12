import { useState, useCallback, useRef } from "react"
import type { ChromeConfig, ColourTokens, LayoutElement, SidebarCols, SidebarFilters, SidebarSide } from "../types"
import { DEFAULT_CHROME, DEFAULT_COLOURS } from "../constants"
import { contentArea, DEFAULT_GRID } from "./useGrid"
import type { GridConfig } from "./useGrid"
import type { Preset } from "../presets"

/** Where an element's columns sat, and in which content range, before sidebar changes moved it */
export interface ColBase {
  colStart: number
  colSpan: number
  first: number
  last: number
}

export interface LayoutState {
  elements: LayoutElement[]
  rowCount: number
  chrome: ChromeConfig
  colours: ColourTokens
  selectedId: string | null
  /** Per-element remap origin, keyed by element id — see remapElements */
  colBase: Record<string, ColBase>
}

const STORAGE_KEY = "pbi-layout-state"

const DEFAULT_STATE: LayoutState = {
  elements: [],
  rowCount: 2,
  chrome: DEFAULT_CHROME,
  colours: DEFAULT_COLOURS,
  selectedId: null,
  colBase: {},
}

function loadState(): LayoutState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_STATE
    return { ...DEFAULT_STATE, ...JSON.parse(raw), selectedId: null }
  } catch {
    return DEFAULT_STATE
  }
}

function saveState(state: LayoutState) {
  try {
    const { selectedId: _, ...rest } = state
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rest))
  } catch {
    /* ignore */
  }
}

function contentRange(chrome: ChromeConfig): { first: number; last: number } {
  const isRight = chrome.sidebarCols > 0 && chrome.sidebarSide === "right"
  const isLeft = chrome.sidebarCols > 0 && chrome.sidebarSide !== "right"
  return {
    first: isLeft ? chrome.sidebarCols + 1 : 1,
    last: isRight ? 12 - chrome.sidebarCols : 12,
  }
}

/**
 * Refit elements to the content range of a new chrome config.
 * Squeezing columns rounds, so remapping the result back would not always
 * return the original. Each element therefore remembers where it sat before
 * sidebar changes started moving it (colBase), and is always refitted from
 * there — going back to an earlier sidebar setting restores it exactly.
 */
export function remapElements(
  elements: LayoutElement[],
  oldChrome: ChromeConfig,
  newChrome: ChromeConfig,
  prevBase: Record<string, ColBase> = {},
): { elements: LayoutElement[]; colBase: Record<string, ColBase> } {
  const old = contentRange(oldChrome)
  const { first: newFirst, last: newLast } = contentRange(newChrome)
  const newCols = newLast - newFirst + 1
  const colBase: Record<string, ColBase> = {}

  const remapped = elements.map((el) => {
    const base = prevBase[el.id] ?? { colStart: el.colStart, colSpan: el.colSpan, first: old.first, last: old.last }
    colBase[el.id] = base
    const baseCols = base.last - base.first + 1
    const offsetStart = base.colStart - base.first
    const offsetEnd = offsetStart + base.colSpan - 1
    const newOffsetStart = Math.round((offsetStart / baseCols) * newCols)
    const newOffsetEnd = Math.round(((offsetEnd + 1) / baseCols) * newCols) - 1
    const newStart = newFirst + newOffsetStart
    const newSpan = Math.max(1, newOffsetEnd - newOffsetStart + 1)
    const clampedStart = Math.max(newFirst, Math.min(newLast, newStart))
    const clampedSpan = Math.max(1, Math.min(newLast - clampedStart + 1, newSpan))
    return { ...el, colStart: clampedStart, colSpan: clampedSpan }
  })
  return { elements: remapped, colBase }
}

const MAX_HISTORY = 50

interface History {
  past: LayoutState[]
  present: LayoutState
  future: LayoutState[]
}

export function useLayout(grid: GridConfig = DEFAULT_GRID) {
  const gridRef = useRef(grid)
  gridRef.current = grid
  const [history, setHistory] = useState<History>(() => ({
    past: [],
    present: loadState(),
    future: [],
  }))

  const state = history.present
  const canUndo = history.past.length > 0
  const canRedo = history.future.length > 0

  // Update that pushes to history (most actions)
  function update(updater: (prev: LayoutState) => LayoutState) {
    setHistory((h) => {
      const next = updater(h.present)
      saveState(next)
      return {
        past: [...h.past.slice(-MAX_HISTORY + 1), h.present],
        present: next,
        future: [],
      }
    })
  }

  // Update that does NOT push to history (selection only)
  function updateSilent(updater: (prev: LayoutState) => LayoutState) {
    setHistory((h) => ({ ...h, present: updater(h.present) }))
  }

  const undo = useCallback(() => {
    setHistory((h) => {
      if (h.past.length === 0) return h
      const prev = h.past[h.past.length - 1]
      saveState(prev)
      return {
        past: h.past.slice(0, -1),
        present: prev,
        future: [h.present, ...h.future],
      }
    })
  }, [])

  const redo = useCallback(() => {
    setHistory((h) => {
      if (h.future.length === 0) return h
      const next = h.future[0]
      saveState(next)
      return {
        past: [...h.past, h.present],
        present: next,
        future: h.future.slice(1),
      }
    })
  }, [])

  const reset = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setHistory({ past: [], present: DEFAULT_STATE, future: [] })
  }, [])

  const addElement = useCallback(() => {
    update((prev) => {
      const { chrome, rowCount } = prev
      const area = contentArea(chrome, gridRef.current)
      const firstCol = area.firstCol
      const lastCol = area.lastCol
      const count = prev.elements.length + 1

      // Try to find a row with free space to the right of existing elements
      let targetRow = 1
      let targetStart = firstCol
      let targetSpan = lastCol - firstCol + 1
      let placed = false

      for (let r = 1; r <= rowCount; r++) {
        const inRow = prev.elements.filter((e) => e.row === r)
        const rightmost = inRow.length === 0 ? firstCol - 1 : Math.max(...inRow.map((e) => e.colStart + e.colSpan - 1))
        const nextCol = rightmost + 1
        const colsAvailable = lastCol - nextCol + 1
        if (colsAvailable >= 4) {
          targetRow = r
          targetStart = nextCol
          targetSpan = colsAvailable
          placed = true
          break
        }
      }

      // No space in any existing row — add a new row if possible
      if (!placed) {
        const newRowCount = Math.min(rowCount + 1, 4)
        targetRow = newRowCount
        targetStart = firstCol
        targetSpan = lastCol - firstCol + 1
        const clamped = prev.elements.map((el) => ({ ...el, row: Math.min(el.row, newRowCount) }))
        const el: LayoutElement = {
          id: crypto.randomUUID(),
          label: `Element ${count}`,
          row: targetRow,
          rowSpan: 1,
          colStart: targetStart,
          colSpan: targetSpan,
        }
        return { ...prev, rowCount: newRowCount, elements: [...clamped, el], selectedId: el.id }
      }

      const el: LayoutElement = {
        id: crypto.randomUUID(),
        label: `Element ${count}`,
        row: targetRow,
        rowSpan: 1,
        colStart: targetStart,
        colSpan: targetSpan,
      }
      return { ...prev, elements: [...prev.elements, el], selectedId: el.id }
    })
  }, [])

  const updateElement = useCallback((updated: LayoutElement) => {
    update((prev) => {
      const before = prev.elements.find((el) => el.id === updated.id)
      const colsChanged = before && (before.colStart !== updated.colStart || before.colSpan !== updated.colSpan)
      // A manual column change is the element's new origin for later sidebar refits
      const { [updated.id]: _, ...restBase } = prev.colBase
      return {
        ...prev,
        elements: prev.elements.map((el) => (el.id === updated.id ? updated : el)),
        colBase: colsChanged ? restBase : prev.colBase,
      }
    })
  }, [])

  const duplicateElement = useCallback((id: string) => {
    update((prev) => {
      const src = prev.elements.find((el) => el.id === id)
      if (!src) return prev
      const copy: LayoutElement = { ...src, id: crypto.randomUUID(), label: `${src.label} copy` }
      const idx = prev.elements.findIndex((el) => el.id === id)
      const elements = [...prev.elements.slice(0, idx + 1), copy, ...prev.elements.slice(idx + 1)]
      const srcBase = prev.colBase[id]
      const colBase = srcBase ? { ...prev.colBase, [copy.id]: srcBase } : prev.colBase
      return { ...prev, elements, colBase, selectedId: copy.id }
    })
  }, [])

  const removeElement = useCallback((id: string) => {
    update((prev) => ({
      ...prev,
      elements: prev.elements.filter((el) => el.id !== id),
      selectedId: prev.selectedId === id ? null : prev.selectedId,
    }))
  }, [])

  const selectElement = useCallback((id: string | null) => {
    updateSilent((prev) => ({ ...prev, selectedId: id }))
  }, [])

  const clearElements = useCallback(() => {
    update((prev) => ({ ...prev, elements: [], colBase: {}, selectedId: null }))
  }, [])

  const setRowCount = useCallback((n: number) => {
    update((prev) => {
      const clamped = prev.elements.map((el) => ({ ...el, row: Math.min(el.row, n) }))
      return { ...prev, rowCount: n, elements: clamped }
    })
  }, [])

  const setHeader = useCallback((v: boolean) => {
    update((prev) => {
      const newChrome = { ...prev.chrome, header: v }
      return { ...prev, chrome: newChrome, ...remapElements(prev.elements, prev.chrome, newChrome, prev.colBase) }
    })
  }, [])

  const setFooter = useCallback((v: boolean) => {
    update((prev) => {
      const newChrome = { ...prev.chrome, footer: v }
      return { ...prev, chrome: newChrome, ...remapElements(prev.elements, prev.chrome, newChrome, prev.colBase) }
    })
  }, [])

  const setSidebarCols = useCallback((v: SidebarCols) => {
    update((prev) => {
      const newChrome = { ...prev.chrome, sidebarCols: v }
      return { ...prev, chrome: newChrome, ...remapElements(prev.elements, prev.chrome, newChrome, prev.colBase) }
    })
  }, [])

  const setSidebarSide = useCallback((v: SidebarSide) => {
    update((prev) => {
      const newChrome = { ...prev.chrome, sidebarSide: v }
      return { ...prev, chrome: newChrome, ...remapElements(prev.elements, prev.chrome, newChrome, prev.colBase) }
    })
  }, [])

  const setSidebarFilters = useCallback((v: SidebarFilters) => {
    update((prev) => ({ ...prev, chrome: { ...prev.chrome, sidebarFilters: v } }))
  }, [])

  const setColour = useCallback((key: keyof ColourTokens, value: string) => {
    update((prev) => ({ ...prev, colours: { ...prev.colours, [key]: value } }))
  }, [])

  const resetColours = useCallback(() => {
    update((prev) => ({ ...prev, colours: DEFAULT_COLOURS }))
  }, [])

  const loadPreset = useCallback((preset: Preset) => {
    update((prev) => ({
      elements: preset.elements,
      rowCount: preset.rowCount,
      // Presets don't specify a filter count — keep the user's choice
      chrome: { ...preset.chrome, sidebarFilters: preset.chrome.sidebarFilters ?? prev.chrome.sidebarFilters },
      colours: prev.colours,
      selectedId: null,
      colBase: {},
    }))
  }, [])

  return {
    ...state,
    canUndo,
    canRedo,
    undo,
    redo,
    addElement,
    duplicateElement,
    updateElement,
    removeElement,
    clearElements,
    selectElement,
    setRowCount,
    setHeader,
    setFooter,
    setSidebarCols,
    setSidebarSide,
    setSidebarFilters,
    setColour,
    resetColours,
    loadPreset,
    reset,
  }
}
