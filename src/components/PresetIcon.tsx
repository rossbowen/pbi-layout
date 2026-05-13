import type { IconLayout } from "../presets"

interface Props {
  layout: IconLayout
  fill: string
  stroke: string
  accent: string
}

// Icon viewBox: 32×20, sidebar=6, content=26, up to 4 cols and 4 rows
const W = 32
const H = 20
const HDR = 3
const FTR = 3
const SB = 7 // sidebar width in icon units
const GAP = 1 // gap between panels
const EDGE = 1 // edge gutter matching real canvas

export function PresetIcon({ layout, fill, stroke, accent }: Props) {
  const top = HDR + EDGE
  const bottom = H - FTR - EDGE
  const left = (layout.sidebar ? SB : 0) + EDGE
  const right = W - EDGE
  const contentW = right - left
  const contentH = bottom - top

  const colW = (contentW - GAP * 3) / 4 // 4 icon columns
  const rowH = (contentH - GAP * (layout.rows - 1)) / layout.rows

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ display: "block", width: "100%", height: "auto" }} aria-hidden="true">
      {/* Background */}
      <rect x={0} y={0} width={W} height={H} fill={fill} rx={1.5} />

      {/* Header */}
      <rect x={0} y={0} width={W} height={HDR} fill={accent} rx={1} />

      {/* Footer */}
      <rect x={0} y={H - FTR} width={W} height={FTR} fill={stroke} opacity={0.15} rx={1} />

      {/* Sidebar */}
      {layout.sidebar && <rect x={0} y={top} width={SB - GAP} height={contentH} fill={stroke} opacity={0.2} rx={0.5} />}

      {/* Content panels */}
      {layout.panels.map((p, i) => {
        const px = left + (p.col - 1) * (colW + GAP)
        const py = top + (p.row - 1) * (rowH + GAP)
        const pw = p.span * colW + (p.span - 1) * GAP
        const rs = p.rowSpan ?? 1
        const ph = rs * rowH + (rs - 1) * GAP
        return <rect key={i} x={px} y={py} width={pw} height={ph} fill={stroke} opacity={0.4} rx={0.5} />
      })}

      {/* Border */}
      <rect x={0} y={0} width={W} height={H} fill="none" stroke={stroke} strokeWidth={0.5} opacity={0.3} rx={1.5} />
    </svg>
  )
}
