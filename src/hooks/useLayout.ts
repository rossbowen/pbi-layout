import { useState, useCallback, useRef } from "react"
import type { ChromeConfig, ColourTokens, LayoutElement, SidebarCols, SidebarSide } from "../types"
import { DEFAULT_CHROME, DEFAULT_COLOURS } from "../constants"
import { contentArea, DEFAULT_GRID } from "./useGrid"
import type { GridConfig } from "./useGrid"
import type { Preset } from "../presets"

export interface LayoutState {
  elements: LayoutElement[]
  rowCount: number
  chrome: ChromeConfig
  colours: ColourTokens
  selectedId: string | null
}

const STORAGE_KEY = "pbi-layout-state"

const DEFAULT_STATE: LayoutState = {
  elements: [],
  rowCount: 2,
  chrome: DEFAULT_CHROME,
  colours: DEFAULT_COLOURS,
  selectedId: null,
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

function remapElements(elements: LayoutElement[], oldChrome: ChromeConfig, newChrome: ChromeConfig): LayoutElement[] {
  const { first: oldFirst, last: oldLast } = contentRange(oldChrome)
  const { first: newFirst, last: newLast } = contentRange(newChrome)
  const oldCols = oldLast - oldFirst + 1
  const newCols = newLast - newFirst + 1

  return elements.map((el) => {
    const offsetStart = el.colStart - oldFirst
    const offsetEnd = offsetStart + el.colSpan - 1
    const newOffsetStart = Math.round((offsetStart / oldCols) * newCols)
    const newOffsetEnd = Math.round(((offsetEnd + 1) / oldCols) * newCols) - 1
    const newStart = newFirst + newOffsetStart
    const newSpan = Math.max(1, newOffsetEnd - newOffsetStart + 1)
    const clampedStart = Math.max(newFirst, Math.min(newLast, newStart))
    const clampedSpan = Math.max(1, Math.min(newLast - clampedStart + 1, newSpan))
    return { ...el, colStart: clampedStart, colSpan: clampedSpan }
  })
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
    update((prev) => ({
      ...prev,
      elements: prev.elements.map((el) => (el.id === updated.id ? updated : el)),
    }))
  }, [])

  const duplicateElement = useCallback((id: string) => {
    update((prev) => {
      const src = prev.elements.find((el) => el.id === id)
      if (!src) return prev
      const copy: LayoutElement = { ...src, id: crypto.randomUUID(), label: `${src.label} copy` }
      const idx = prev.elements.findIndex((el) => el.id === id)
      const elements = [...prev.elements.slice(0, idx + 1), copy, ...prev.elements.slice(idx + 1)]
      return { ...prev, elements, selectedId: copy.id }
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
    update((prev) => ({ ...prev, elements: [], selectedId: null }))
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
      return { ...prev, chrome: newChrome, elements: remapElements(prev.elements, prev.chrome, newChrome) }
    })
  }, [])

  const setFooter = useCallback((v: boolean) => {
    update((prev) => {
      const newChrome = { ...prev.chrome, footer: v }
      return { ...prev, chrome: newChrome, elements: remapElements(prev.elements, prev.chrome, newChrome) }
    })
  }, [])

  const setSidebarCols = useCallback((v: SidebarCols) => {
    update((prev) => {
      const newChrome = { ...prev.chrome, sidebarCols: v }
      return { ...prev, chrome: newChrome, elements: remapElements(prev.elements, prev.chrome, newChrome) }
    })
  }, [])

  const setSidebarSide = useCallback((v: SidebarSide) => {
    update((prev) => {
      const newChrome = { ...prev.chrome, sidebarSide: v }
      return { ...prev, chrome: newChrome, elements: remapElements(prev.elements, prev.chrome, newChrome) }
    })
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
      chrome: preset.chrome,
      colours: prev.colours,
      selectedId: null,
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
    setColour,
    resetColours,
    loadPreset,
    reset,
  }
}
