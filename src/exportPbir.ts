/**
 * PBIR export — generates a .zip containing a Power BI Enhanced Report Format
 * folder structure with one page and one rectangle visual per layout element.
 *
 * The exported zip can be opened in Power BI Desktop (developer mode).
 * Each element becomes a Rectangle visual placeholder pre-positioned on the page.
 * Swap each rectangle for your real visual in PBI Desktop.
 *
 * PBIR spec: https://learn.microsoft.com/en-us/power-bi/developer/projects/projects-report
 */

import type { ChromeConfig, ColourTokens, LayoutElement, CanvasSizeKey } from "./types"
import { elementBounds } from "./hooks/useGrid"
import type { GridConfig } from "./hooks/useGrid"
import { HEADER_H, FOOTER_H, CANVAS_SIZES } from "./constants"
import { sidebarWidth } from "./hooks/useGrid"

// ─── Minimal zip writer ───────────────────────────────────────────────────────
// Implements the ZIP local-file + central-directory format (no compression —
// DEFLATE would require a dependency; Store method is spec-compliant and fine
// for these small JSON files).

function crc32(data: Uint8Array): number {
  const table = crc32Table()
  let crc = 0xffffffff
  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ data[i]) & 0xff]
  }
  return (crc ^ 0xffffffff) >>> 0
}

let _crc32Table: number[] | null = null
function crc32Table(): number[] {
  if (_crc32Table) return _crc32Table
  _crc32Table = []
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    _crc32Table[n] = c
  }
  return _crc32Table
}

interface ZipFile {
  name: string
  data: Uint8Array
}

function buildZip(files: ZipFile[]): Uint8Array {
  const enc = new TextEncoder()
  const parts: Uint8Array[] = []
  const centralDir: Uint8Array[] = []
  const offsets: number[] = []
  let offset = 0

  for (const file of files) {
    const nameBytes = enc.encode(file.name)
    const crc = crc32(file.data)
    const size = file.data.length
    offsets.push(offset)

    // Local file header
    const lh = new DataView(new ArrayBuffer(30 + nameBytes.length))
    lh.setUint32(0, 0x04034b50, true) // sig
    lh.setUint16(4, 20, true) // version needed
    lh.setUint16(6, 0, true) // flags
    lh.setUint16(8, 0, true) // compression: store
    lh.setUint16(10, 0, true) // mod time
    lh.setUint16(12, 0, true) // mod date
    lh.setUint32(14, crc, true)
    lh.setUint32(18, size, true) // compressed size
    lh.setUint32(22, size, true) // uncompressed size
    lh.setUint16(26, nameBytes.length, true)
    lh.setUint16(28, 0, true) // extra len
    const lhBytes = new Uint8Array(lh.buffer as ArrayBuffer)
    for (let i = 0; i < nameBytes.length; i++) lhBytes[30 + i] = nameBytes[i]
    parts.push(lhBytes)
    parts.push(file.data)
    offset += lhBytes.length + size

    // Central directory entry
    const cd = new DataView(new ArrayBuffer(46 + nameBytes.length))
    cd.setUint32(0, 0x02014b50, true) // sig
    cd.setUint16(4, 20, true) // version made by
    cd.setUint16(6, 20, true) // version needed
    cd.setUint16(8, 0, true) // flags
    cd.setUint16(10, 0, true) // compression
    cd.setUint16(12, 0, true) // mod time
    cd.setUint16(14, 0, true) // mod date
    cd.setUint32(16, crc, true)
    cd.setUint32(20, size, true)
    cd.setUint32(24, size, true)
    cd.setUint16(28, nameBytes.length, true)
    cd.setUint16(30, 0, true) // extra
    cd.setUint16(32, 0, true) // comment
    cd.setUint16(34, 0, true) // disk start
    cd.setUint16(36, 0, true) // internal attr
    cd.setUint32(38, 0, true) // external attr
    cd.setUint32(42, offsets[offsets.length - 1], true) // offset
    const cdBytes = new Uint8Array(cd.buffer as ArrayBuffer)
    for (let i = 0; i < nameBytes.length; i++) cdBytes[46 + i] = nameBytes[i]
    centralDir.push(cdBytes)
  }

  // End of central directory
  const cdSize = centralDir.reduce((a, b) => a + b.length, 0)
  const cdOffset = offset
  const eocd = new DataView(new ArrayBuffer(22))
  eocd.setUint32(0, 0x06054b50, true)
  eocd.setUint16(4, 0, true) // disk num
  eocd.setUint16(6, 0, true) // cd start disk
  eocd.setUint16(8, files.length, true)
  eocd.setUint16(10, files.length, true)
  eocd.setUint32(12, cdSize, true)
  eocd.setUint32(16, cdOffset, true)
  eocd.setUint16(20, 0, true) // comment len

  const allParts = [...parts, ...centralDir, new Uint8Array(eocd.buffer as ArrayBuffer)]
  const totalLen = allParts.reduce((a, b) => a + b.length, 0)
  const out = new Uint8Array(totalLen)
  let pos = 0
  for (const p of allParts) {
    out.set(p, pos)
    pos += p.length
  }
  return out
}

// ─── PBIR JSON generators ────────────────────────────────────────────────────

function j(obj: unknown): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(obj, null, 2))
}

function makeDefinitionPbir(reportName: string): Uint8Array {
  return j({
    version: "1.0",
    artifactType: "Report",
    displayName: reportName,
  })
}

function makeVersionJson(): Uint8Array {
  return j({ version: "4.0" })
}

function makeReportJson(): Uint8Array {
  return j({
    $schema:
      "https://developer.microsoft.com/json-schemas/fabric/item/report/definition/report/1.0.0/schema.json",
    themeCollection: { baseTheme: { name: "CY24SU06", reportVersionAtImport: "5.54" } },
    settings: { isPaginatedReportAutoRefreshEnabled: false },
  })
}

function makePageJson(
  canvasW: number,
  canvasH: number,
  _pageName: string,
  displayName: string,
): Uint8Array {
  return j({
    $schema:
      "https://developer.microsoft.com/json-schemas/fabric/item/report/definition/page/1.0.0/schema.json",
    displayName,
    displayOption: 1, // fit to page
    width: canvasW,
    height: canvasH,
  })
}

function makeVisualJson(
  name: string,
  x: number,
  y: number,
  w: number,
  h: number,
  fillHex: string,
  tabOrder: number,
): Uint8Array {
  return j({
    $schema:
      "https://developer.microsoft.com/json-schemas/fabric/item/report/definition/visualContainer/2.4.0/schema.json",
    name,
    position: {
      x: Math.round(x),
      y: Math.round(y),
      z: tabOrder * 1000,
      width: Math.round(w),
      height: Math.round(h),
      tabOrder,
    },
    visual: {
      visualType: "shape",
      objects: {
        general: [
          {
            properties: {
              shapeType: { expr: { Literal: { Value: "'rectangle'" } } },
            },
          },
        ],
        fill: [
          {
            properties: {
              fillColor: {
                solid: { color: { expr: { Literal: { Value: `'${fillHex}'` } } } },
              },
              transparency: { expr: { Literal: { Value: "0D" } } },
            },
          },
        ],
        border: [
          {
            properties: {
              show: { expr: { Literal: { Value: "false" } } },
            },
          },
        ],
      },
      visualContainerObjects: {
        title: [
          {
            properties: {
              show: { expr: { Literal: { Value: "false" } } },
            },
          },
        ],
      },
    },
    filterConfig: { filters: [] },
  })
}

// ─── Public export function ───────────────────────────────────────────────────

export interface PbirExportOptions {
  elements: LayoutElement[]
  rowCount: number
  chrome: ChromeConfig
  colours: ColourTokens
  canvasSize: CanvasSizeKey
  grid: GridConfig
  reportName?: string
}

export function exportPbir(opts: PbirExportOptions): void {
  const {
    elements,
    rowCount,
    chrome,
    colours,
    canvasSize,
    grid,
    reportName = "PBI Layout Export",
  } = opts

  const sizeConfig = CANVAS_SIZES[canvasSize]
  const canvasW = sizeConfig.w
  const canvasH = sizeConfig.h
  const folderName = `${reportName.replace(/[^a-zA-Z0-9_-]/g, "_")}.Report`
  const pageName = "Layout"
  const pageDisplayName = "Page 1"

  const files: ZipFile[] = []

  // definition.pbir
  files.push({ name: `${folderName}/definition.pbir`, data: makeDefinitionPbir(reportName) })

  // definition/version.json
  files.push({ name: `${folderName}/definition/version.json`, data: makeVersionJson() })

  // definition/report.json
  files.push({
    name: `${folderName}/definition/report.json`,
    data: makeReportJson(),
  })

  // definition/pages/Layout/page.json
  files.push({
    name: `${folderName}/definition/pages/${pageName}/page.json`,
    data: makePageJson(canvasW, canvasH, pageName, pageDisplayName),
  })

  // Chrome visuals
  let tabOrder = 0

  if (chrome.header) {
    files.push({
      name: `${folderName}/definition/pages/${pageName}/visuals/Header/visual.json`,
      data: makeVisualJson("Header", 0, 0, canvasW, HEADER_H, colours.headerBg, tabOrder++),
    })
  }

  if (chrome.footer) {
    files.push({
      name: `${folderName}/definition/pages/${pageName}/visuals/Footer/visual.json`,
      data: makeVisualJson(
        "Footer",
        0,
        canvasH - FOOTER_H,
        canvasW,
        FOOTER_H,
        colours.footerBg,
        tabOrder++,
      ),
    })
  }

  if (chrome.sidebarCols > 0) {
    const sw = sidebarWidth(chrome.sidebarCols, grid)
    const sidebarTop = chrome.header ? HEADER_H : 0
    const sidebarH = canvasH - sidebarTop - (chrome.footer ? FOOTER_H : 0)
    const sidebarX = chrome.sidebarSide === "right" ? canvasW - sw : 0
    files.push({
      name: `${folderName}/definition/pages/${pageName}/visuals/Sidebar/visual.json`,
      data: makeVisualJson(
        "Sidebar",
        sidebarX,
        sidebarTop,
        sw,
        sidebarH,
        colours.sidebarBg,
        tabOrder++,
      ),
    })
  }

  // Content elements
  for (const el of elements) {
    const bounds = elementBounds(el, rowCount, chrome, grid)
    const safeName = el.label.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 40) || `Element_${tabOrder}`
    files.push({
      name: `${folderName}/definition/pages/${pageName}/visuals/${safeName}/visual.json`,
      data: makeVisualJson(
        safeName,
        bounds.x,
        bounds.y,
        bounds.width,
        bounds.height,
        colours.elementFill,
        tabOrder++,
      ),
    })
  }

  // Build zip and trigger download
  const zipBytes = buildZip(files)
  const blob = new Blob([zipBytes.buffer as ArrayBuffer], { type: "application/zip" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${folderName}.zip`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
