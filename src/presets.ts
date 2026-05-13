import type { ChromeConfig, ColourTokens, LayoutElement, SidebarCols } from "./types"
import { DEFAULT_COLOURS } from "./constants"

export interface Preset {
  id: string
  name: string
  chrome: ChromeConfig
  rowCount: number
  colours: ColourTokens
  elements: LayoutElement[]
}

// ─── Icon layout descriptor (for PresetIcon SVG) ─────────────────────────────

export interface IconPanel {
  row: number
  col: number
  span: number
  rowSpan?: number // all 1-based, out of 4 cols / N rows in icon space
}
export interface IconLayout {
  sidebar: boolean
  rows: number
  panels: IconPanel[]
}

// ─── Helper ──────────────────────────────────────────────────────────────────

function el(id: string, label: string, row: number, colStart: number, colSpan: number, rowSpan = 1): LayoutElement {
  return { id, label, row, rowSpan, colStart, colSpan }
}

function chrome(sidebarCols: SidebarCols = 0, header = true, footer = true): ChromeConfig {
  return { header, footer, sidebarCols, sidebarSide: "left" }
}

// ─── Presets ─────────────────────────────────────────────────────────────────

export const PRESETS: Preset[] = [
  // ── No sidebar presets ────────────────────────────────────────────────────

  {
    id: "full",
    name: "Full",
    chrome: chrome(0),
    rowCount: 1,
    colours: DEFAULT_COLOURS,
    elements: [el("f1", "Main visual", 1, 1, 12)],
  },
  {
    id: "1x2",
    name: "1×2",
    chrome: chrome(0),
    rowCount: 1,
    colours: DEFAULT_COLOURS,
    elements: [el("a1", "Left", 1, 1, 6), el("a2", "Right", 1, 7, 6)],
  },
  {
    id: "2x1",
    name: "2×1",
    chrome: chrome(0),
    rowCount: 2,
    colours: DEFAULT_COLOURS,
    elements: [el("b1", "Top", 1, 1, 12), el("b2", "Bottom", 2, 1, 12)],
  },
  {
    id: "1x3",
    name: "1×3",
    chrome: chrome(0),
    rowCount: 1,
    colours: DEFAULT_COLOURS,
    elements: [el("c1", "Left", 1, 1, 4), el("c2", "Centre", 1, 5, 4), el("c3", "Right", 1, 9, 4)],
  },
  {
    id: "2x2",
    name: "2×2",
    chrome: chrome(0),
    rowCount: 2,
    colours: DEFAULT_COLOURS,
    elements: [
      el("d1", "Top left", 1, 1, 6),
      el("d2", "Top right", 1, 7, 6),
      el("d3", "Bottom left", 2, 1, 6),
      el("d4", "Bottom right", 2, 7, 6),
    ],
  },
  {
    id: "2x3",
    name: "2×3",
    chrome: chrome(0),
    rowCount: 2,
    colours: DEFAULT_COLOURS,
    elements: [
      el("e1", "Top left", 1, 1, 4),
      el("e2", "Top centre", 1, 5, 4),
      el("e3", "Top right", 1, 9, 4),
      el("e4", "Bottom left", 2, 1, 4),
      el("e5", "Bottom centre", 2, 5, 4),
      el("e6", "Bottom right", 2, 9, 4),
    ],
  },
  {
    id: "3x2",
    name: "3×2",
    chrome: chrome(0),
    rowCount: 3,
    colours: DEFAULT_COLOURS,
    elements: [
      el("f1", "Row 1 left", 1, 1, 6),
      el("f2", "Row 1 right", 1, 7, 6),
      el("f3", "Row 2 left", 2, 1, 6),
      el("f4", "Row 2 right", 2, 7, 6),
      el("f5", "Row 3 left", 3, 1, 6),
      el("f6", "Row 3 right", 3, 7, 6),
    ],
  },
  {
    id: "hero2",
    name: "Hero+2",
    chrome: chrome(0),
    rowCount: 2,
    colours: DEFAULT_COLOURS,
    elements: [
      el("g1", "Hero", 1, 1, 8),
      el("g2", "Top", 1, 9, 4),
      el("g3", "Bottom", 2, 9, 4),
      el("g4", "Wide", 2, 1, 8),
    ],
  },

  {
    id: "tall-left",
    name: "Tall left",
    chrome: chrome(0),
    rowCount: 2,
    colours: DEFAULT_COLOURS,
    elements: [
      el("tl1", "Tall chart", 1, 1, 5, 2), // spans both rows
      el("tl2", "Top right", 1, 6, 7),
      el("tl3", "Bottom right", 2, 6, 7),
    ],
  },
  {
    id: "tall-left-3",
    name: "Tall + 3",
    chrome: chrome(0),
    rowCount: 3,
    colours: DEFAULT_COLOURS,
    elements: [
      el("tr1", "Tall chart", 1, 1, 5, 3), // spans all 3 rows
      el("tr2", "Top right", 1, 6, 7),
      el("tr3", "Mid right", 2, 6, 7),
      el("tr4", "Bot right", 3, 6, 7),
    ],
  },

  // ── Sidebar presets ───────────────────────────────────────────────────────

  {
    id: "sb-2x2",
    name: "Sidebar 2×2",
    chrome: chrome(2),
    rowCount: 2,
    colours: DEFAULT_COLOURS,
    elements: [
      el("s1", "Top left", 1, 3, 5),
      el("s2", "Top right", 1, 8, 5),
      el("s3", "Bottom left", 2, 3, 5),
      el("s4", "Bottom right", 2, 8, 5),
    ],
  },
  {
    id: "sb-kpi-hero",
    name: "KPI + Hero",
    chrome: chrome(2),
    rowCount: 3,
    colours: DEFAULT_COLOURS,
    elements: [
      el("k1", "KPI 1", 1, 3, 2),
      el("k2", "KPI 2", 1, 5, 2),
      el("k3", "KPI 3", 1, 7, 2),
      el("k4", "KPI 4", 1, 9, 2),
      el("k5", "KPI 5", 1, 11, 2),
      el("k6", "Hero", 2, 3, 6),
      el("k7", "Detail top", 2, 9, 4),
      el("k8", "Detail bottom", 3, 9, 4),
      el("k9", "Wide bottom", 3, 3, 6),
    ],
  },
  {
    id: "sb3-hero-triple",
    name: "Wide + triple",
    chrome: chrome(3),
    rowCount: 2,
    colours: DEFAULT_COLOURS,
    elements: [
      el("t1", "Hero", 1, 4, 6),
      el("t2", "YTD total", 1, 10, 3),
      el("t3", "Left", 2, 4, 3),
      el("t4", "Centre", 2, 7, 3),
      el("t5", "Right", 2, 10, 3),
    ],
  },
  {
    id: "sb3-full-21",
    name: "Wide + full",
    chrome: chrome(3),
    rowCount: 2,
    colours: DEFAULT_COLOURS,
    elements: [el("u1", "Full width", 1, 4, 9), el("u2", "Main", 2, 4, 6), el("u3", "Detail", 2, 10, 3)],
  },
]

// ─── Icon layout map ─────────────────────────────────────────────────────────
// Icon space: 4 content columns, up to 4 rows, optional sidebar block

export const ICON_LAYOUTS: Record<string, IconLayout> = {
  full: { sidebar: false, rows: 1, panels: [{ row: 1, col: 1, span: 4 }] },
  "1x2": {
    sidebar: false,
    rows: 1,
    panels: [
      { row: 1, col: 1, span: 2 },
      { row: 1, col: 3, span: 2 },
    ],
  },
  "2x1": {
    sidebar: false,
    rows: 2,
    panels: [
      { row: 1, col: 1, span: 4 },
      { row: 2, col: 1, span: 4 },
    ],
  },
  "1x3": {
    sidebar: false,
    rows: 1,
    panels: [
      { row: 1, col: 1, span: 1 },
      { row: 1, col: 2, span: 1 },
      { row: 1, col: 3, span: 1 },
      { row: 1, col: 4, span: 1 },
    ],
  },
  "2x2": {
    sidebar: false,
    rows: 2,
    panels: [
      { row: 1, col: 1, span: 2 },
      { row: 1, col: 3, span: 2 },
      { row: 2, col: 1, span: 2 },
      { row: 2, col: 3, span: 2 },
    ],
  },
  "2x3": {
    sidebar: false,
    rows: 2,
    panels: [
      { row: 1, col: 1, span: 1 },
      { row: 1, col: 2, span: 1 },
      { row: 1, col: 3, span: 1 },
      { row: 1, col: 4, span: 1 },
      { row: 2, col: 1, span: 1 },
      { row: 2, col: 2, span: 1 },
      { row: 2, col: 3, span: 1 },
      { row: 2, col: 4, span: 1 },
    ],
  },
  "3x2": {
    sidebar: false,
    rows: 3,
    panels: [
      { row: 1, col: 1, span: 2 },
      { row: 1, col: 3, span: 2 },
      { row: 2, col: 1, span: 2 },
      { row: 2, col: 3, span: 2 },
      { row: 3, col: 1, span: 2 },
      { row: 3, col: 3, span: 2 },
    ],
  },
  hero2: {
    sidebar: false,
    rows: 2,
    panels: [
      { row: 1, col: 1, span: 3 },
      { row: 1, col: 4, span: 1 },
      { row: 2, col: 1, span: 3 },
      { row: 2, col: 4, span: 1 },
    ],
  },
  "tall-left": {
    sidebar: false,
    rows: 2,
    panels: [
      { row: 1, col: 1, span: 1, rowSpan: 2 },
      { row: 1, col: 2, span: 3 },
      { row: 2, col: 2, span: 3 },
    ],
  },
  "tall-left-3": {
    sidebar: false,
    rows: 3,
    panels: [
      { row: 1, col: 1, span: 1, rowSpan: 3 },
      { row: 1, col: 2, span: 3 },
      { row: 2, col: 2, span: 3 },
      { row: 3, col: 2, span: 3 },
    ],
  },
  "sb-2x2": {
    sidebar: true,
    rows: 2,
    panels: [
      { row: 1, col: 1, span: 2 },
      { row: 1, col: 3, span: 2 },
      { row: 2, col: 1, span: 2 },
      { row: 2, col: 3, span: 2 },
    ],
  },
  "sb-kpi-hero": {
    sidebar: true,
    rows: 3,
    panels: [
      { row: 1, col: 1, span: 1 },
      { row: 1, col: 2, span: 1 },
      { row: 1, col: 3, span: 1 },
      { row: 1, col: 4, span: 1 },
      { row: 2, col: 1, span: 3 },
      { row: 2, col: 4, span: 1 },
      { row: 3, col: 1, span: 3 },
      { row: 3, col: 4, span: 1 },
    ],
  },
  "sb3-hero-triple": {
    sidebar: true,
    rows: 2,
    panels: [
      { row: 1, col: 1, span: 3 },
      { row: 1, col: 4, span: 1 },
      { row: 2, col: 1, span: 1 },
      { row: 2, col: 2, span: 1 },
      { row: 2, col: 3, span: 1 },
      { row: 2, col: 4, span: 1 },
    ],
  },
  "sb3-full-21": {
    sidebar: true,
    rows: 2,
    panels: [
      { row: 1, col: 1, span: 4 },
      { row: 2, col: 1, span: 3 },
      { row: 2, col: 4, span: 1 },
    ],
  },
}
