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
  {
    id: "1x4",
    name: "1×4",
    chrome: chrome(0),
    rowCount: 1,
    colours: DEFAULT_COLOURS,
    elements: [
      el("h1", "Left", 1, 1, 3),
      el("h2", "Centre left", 1, 4, 3),
      el("h3", "Centre right", 1, 7, 3),
      el("h4", "Right", 1, 10, 3),
    ],
  },
  {
    id: "2x4",
    name: "2×4",
    chrome: chrome(0),
    rowCount: 2,
    colours: DEFAULT_COLOURS,
    elements: [
      el("i1", "Row 1 col 1", 1, 1, 3),
      el("i2", "Row 1 col 2", 1, 4, 3),
      el("i3", "Row 1 col 3", 1, 7, 3),
      el("i4", "Row 1 col 4", 1, 10, 3),
      el("i5", "Row 2 col 1", 2, 1, 3),
      el("i6", "Row 2 col 2", 2, 4, 3),
      el("i7", "Row 2 col 3", 2, 7, 3),
      el("i8", "Row 2 col 4", 2, 10, 3),
    ],
  },
  {
    id: "3x3",
    name: "3×3",
    chrome: chrome(0),
    rowCount: 3,
    colours: DEFAULT_COLOURS,
    elements: [
      el("j1", "Row 1 col 1", 1, 1, 4),
      el("j2", "Row 1 col 2", 1, 5, 4),
      el("j3", "Row 1 col 3", 1, 9, 4),
      el("j4", "Row 2 col 1", 2, 1, 4),
      el("j5", "Row 2 col 2", 2, 5, 4),
      el("j6", "Row 2 col 3", 2, 9, 4),
      el("j7", "Row 3 col 1", 3, 1, 4),
      el("j8", "Row 3 col 2", 3, 5, 4),
      el("j9", "Row 3 col 3", 3, 9, 4),
    ],
  },
  {
    id: "wide-3",
    name: "Wide + 3",
    chrome: chrome(0),
    rowCount: 2,
    colours: DEFAULT_COLOURS,
    elements: [
      el("w1", "Wide", 1, 1, 12),
      el("w2", "Left", 2, 1, 4),
      el("w3", "Centre", 2, 5, 4),
      el("w4", "Right", 2, 9, 4),
    ],
  },
  {
    id: "3-wide",
    name: "3 + wide",
    chrome: chrome(0),
    rowCount: 2,
    colours: DEFAULT_COLOURS,
    elements: [
      el("x1", "Left", 1, 1, 4),
      el("x2", "Centre", 1, 5, 4),
      el("x3", "Right", 1, 9, 4),
      el("x4", "Wide", 2, 1, 12),
    ],
  },
  {
    id: "tall-right",
    name: "Tall right",
    chrome: chrome(0),
    rowCount: 2,
    colours: DEFAULT_COLOURS,
    elements: [
      el("tt1", "Top left", 1, 1, 7),
      el("tt2", "Bottom left", 2, 1, 7),
      el("tt3", "Tall chart", 1, 8, 5, 2), // spans both rows,
    ],
  },
  {
    id: "kpi-main",
    name: "KPI + main",
    chrome: chrome(0),
    rowCount: 4,
    colours: DEFAULT_COLOURS,
    elements: [
      el("m1", "KPI 1", 1, 1, 3),
      el("m2", "KPI 2", 1, 4, 3),
      el("m3", "KPI 3", 1, 7, 3),
      el("m4", "KPI 4", 1, 10, 3),
      el("m5", "Main visual", 2, 1, 12, 3), // spans rows 2–4,
    ],
  },
  {
    id: "kpi-2",
    name: "KPI + 2",
    chrome: chrome(0),
    rowCount: 4,
    colours: DEFAULT_COLOURS,
    elements: [
      el("n1", "KPI 1", 1, 1, 3),
      el("n2", "KPI 2", 1, 4, 3),
      el("n3", "KPI 3", 1, 7, 3),
      el("n4", "KPI 4", 1, 10, 3),
      el("n5", "Left", 2, 1, 6, 3),
      el("n6", "Right", 2, 7, 6, 3),
    ],
  },
  {
    id: "kpi-3",
    name: "KPI + 3",
    chrome: chrome(0),
    rowCount: 4,
    colours: DEFAULT_COLOURS,
    elements: [
      el("o1", "KPI 1", 1, 1, 2),
      el("o2", "KPI 2", 1, 3, 2),
      el("o3", "KPI 3", 1, 5, 2),
      el("o4", "KPI 4", 1, 7, 2),
      el("o5", "KPI 5", 1, 9, 2),
      el("o6", "KPI 6", 1, 11, 2),
      el("o7", "Left", 2, 1, 4, 3),
      el("o8", "Centre", 2, 5, 4, 3),
      el("o9", "Right", 2, 9, 4, 3),
    ],
  },
  {
    id: "kpi-2x2",
    name: "KPI + 2×2",
    chrome: chrome(0),
    rowCount: 3,
    colours: DEFAULT_COLOURS,
    elements: [
      el("q1", "KPI 1", 1, 1, 3),
      el("q2", "KPI 2", 2, 1, 3),
      el("q3", "KPI 3", 3, 1, 3),
      el("q4", "Top left", 1, 4, 5),
      el("q5", "Top right", 1, 9, 4),
      el("q6", "Main", 2, 4, 9, 2), // spans rows 2–3,
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
  {
    id: "sb-full",
    name: "Sidebar full",
    chrome: chrome(2),
    rowCount: 1,
    colours: DEFAULT_COLOURS,
    elements: [el("sf1", "Main visual", 1, 3, 10)],
  },
  {
    id: "sb-1x2",
    name: "Sidebar 1×2",
    chrome: chrome(2),
    rowCount: 1,
    colours: DEFAULT_COLOURS,
    elements: [el("sa1", "Left", 1, 3, 5), el("sa2", "Right", 1, 8, 5)],
  },
  {
    id: "sb-2x1",
    name: "Sidebar 2×1",
    chrome: chrome(2),
    rowCount: 2,
    colours: DEFAULT_COLOURS,
    elements: [el("sc1", "Top", 1, 3, 10), el("sc2", "Bottom", 2, 3, 10)],
  },
  {
    id: "sb-tall",
    name: "Sidebar tall",
    chrome: chrome(2),
    rowCount: 2,
    colours: DEFAULT_COLOURS,
    elements: [
      el("sd1", "Tall chart", 1, 3, 4, 2), // spans both rows,
      el("sd2", "Top right", 1, 7, 6),
      el("sd3", "Bottom right", 2, 7, 6),
    ],
  },
  {
    id: "sb-kpi-2",
    name: "Sidebar KPI",
    chrome: chrome(2),
    rowCount: 4,
    colours: DEFAULT_COLOURS,
    elements: [
      el("se1", "KPI 1", 1, 3, 2),
      el("se2", "KPI 2", 1, 5, 2),
      el("se3", "KPI 3", 1, 7, 2),
      el("se4", "KPI 4", 1, 9, 2),
      el("se5", "KPI 5", 1, 11, 2),
      el("se6", "Left", 2, 3, 5, 3),
      el("se7", "Right", 2, 8, 5, 3),
    ],
  },
  {
    id: "sb3-2x3",
    name: "Wide 2×3",
    chrome: chrome(3),
    rowCount: 2,
    colours: DEFAULT_COLOURS,
    elements: [
      el("sg1", "Row 1 col 1", 1, 4, 3),
      el("sg2", "Row 1 col 2", 1, 7, 3),
      el("sg3", "Row 1 col 3", 1, 10, 3),
      el("sg4", "Row 2 col 1", 2, 4, 3),
      el("sg5", "Row 2 col 2", 2, 7, 3),
      el("sg6", "Row 2 col 3", 2, 10, 3),
    ],
  },
]
