import type { Preset } from "../presets"
import { COL_COUNT } from "../constants"

interface Props {
  preset: Preset
  fill: string
  stroke: string
  accent: string
}

// Icon viewBox: 32×18 (16:9, like every canvas size). The icon is drawn from
// the preset's own elements on the same 12-column grid as the canvas, so it
// always matches the layout the button creates.
const W = 32
const H = 18
const HDR = 2.5
const FTR = 2
const EDGE = 1 // edge gutter
const COL_GAP = 0.6 // gap between columns
const ROW_GAP = 0.8 // gap between rows

const COL_W = (W - EDGE * 2 - COL_GAP * (COL_COUNT - 1)) / COL_COUNT

const colLeft = (n: number) => EDGE + (n - 1) * (COL_W + COL_GAP)
const spanWidth = (s: number) => s * COL_W + (s - 1) * COL_GAP

export function PresetIcon({ preset, fill, stroke, accent }: Props) {
  const { chrome, rowCount, elements } = preset
  const chromeTop = chrome.header ? HDR : 0
  const chromeBottom = H - (chrome.footer ? FTR : 0)
  const top = chromeTop + ROW_GAP
  const contentH = chromeBottom - ROW_GAP - top
  const rowH = (contentH - ROW_GAP * (rowCount - 1)) / rowCount

  const sbW = chrome.sidebarCols > 0 ? colLeft(chrome.sidebarCols) + COL_W : 0
  const sbX = chrome.sidebarSide === "right" ? W - sbW : 0

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ display: "block", width: "100%", height: "auto" }} aria-hidden="true">
      {/* Background */}
      <rect x={0} y={0} width={W} height={H} fill={fill} rx={1.5} />

      {/* Header */}
      {chrome.header && <rect x={0} y={0} width={W} height={HDR} fill={accent} rx={1} />}

      {/* Footer */}
      {chrome.footer && <rect x={0} y={H - FTR} width={W} height={FTR} fill={stroke} opacity={0.15} rx={1} />}

      {/* Sidebar */}
      {sbW > 0 && (
        <rect x={sbX} y={chromeTop} width={sbW} height={chromeBottom - chromeTop} fill={stroke} opacity={0.2} />
      )}

      {/* Content panels */}
      {elements.map((el) => {
        const rs = Math.min(el.rowSpan ?? 1, rowCount - el.row + 1)
        return (
          <rect
            key={el.id}
            x={colLeft(el.colStart)}
            y={top + (el.row - 1) * (rowH + ROW_GAP)}
            width={spanWidth(el.colSpan)}
            height={rs * rowH + (rs - 1) * ROW_GAP}
            fill={stroke}
            opacity={0.4}
            rx={0.5}
          />
        )
      })}

      {/* Border */}
      <rect x={0} y={0} width={W} height={H} fill="none" stroke={stroke} strokeWidth={0.5} opacity={0.3} rx={1.5} />
    </svg>
  )
}
