export type CanvasSizeKey = "1280x720" | "1440x1080" | "1920x1080"

// Sidebar width in logical px — always aligns to the column grid right edge
// Off=0, 2-col = right edge of col 2 = 17 + 2*106 - 26 = 203px, 3-col = 17 + 3*106 - 26 = 309px
export type SidebarCols = 0 | 2 | 3

export type SidebarSide = "left" | "right"

export interface ChromeConfig {
  header: boolean
  footer: boolean
  sidebarCols: SidebarCols
  sidebarSide: SidebarSide
}

export interface ColourTokens {
  headerBg: string // e.g. '#1A1A1A' — header bar background
  footerBg: string // e.g. '#F1F1F1' — footer bar background
  sidebarBg: string // e.g. '#F1F1F1' — filter sidebar background
  canvasBg: string // e.g. '#FFFFFF' — main canvas background
  elementFill: string // e.g. '#FFFFFF' — content placeholder fill
}

export interface LayoutElement {
  id: string
  label: string
  row: number // 1-based row index
  rowSpan: number // number of rows to span (1 = single row)
  colStart: number // 1-based column index
  colSpan: number // number of columns
}
