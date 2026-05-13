import { useState, useRef, useCallback, useEffect } from "react"
import type { ChromeConfig, ColourTokens, LayoutElement } from "../types"
import { HEADER_H, FOOTER_H } from "../constants"
import { colBands, colLeft, elementBounds, contentArea, rowTop, sidebarWidth, DEFAULT_GRID } from "../hooks/useGrid"
import type { GridConfig } from "../hooks/useGrid"

/** Relative luminance of a hex colour (WCAG formula) */
function luminance(hex: string): number {
  const c = hex.replace("#", "")
  const r = parseInt(c.slice(0, 2), 16) / 255
  const g = parseInt(c.slice(2, 4), 16) / 255
  const b = parseInt(c.slice(4, 6), 16) / 255
  const lin = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

/** Return black or white depending on which contrasts better against bg */
function contrastColour(bg: string): string {
  try {
    const l = luminance(bg)
    return l > 0.179 ? "#1a1a1a" : "#ffffff"
  } catch {
    return "#1a1a1a"
  }
}

/** Same as contrastColour — measurements use full strength for legibility */
function contrastDim(bg: string): string {
  return contrastColour(bg)
}

interface Props {
  elements: LayoutElement[]
  rowCount: number
  chrome: ChromeConfig
  colours: ColourTokens
  selectedId: string | null
  onSelect: (id: string | null) => void
  onRemove: (id: string) => void
  onDuplicate: (id: string) => void
  onUpdate: (el: LayoutElement) => void
  showGrid: boolean
  shadow: string
  /** Logical canvas width (e.g. 1280) */
  canvasW: number
  /** Logical canvas height (e.g. 720) */
  canvasH: number
  /** Combined display scale (sizeConfig.scale * fitScale) */
  scale: number
  /** Grid config for the active canvas size */
  grid?: GridConfig
  /** Which grid zone to highlight (from pill hover) */
  highlightZone?: "col" | "gap" | "edge" | null
  theme?: "light" | "dark"
}

/** Grip dots — 3 dots in a line, oriented for the axis */
function GripDots({ axis }: { axis: "h" | "v" }) {
  const dots = [0, 1, 2]
  return (
    <svg
      width={axis === "h" ? 10 : 4}
      height={axis === "h" ? 4 : 10}
      viewBox={axis === "h" ? "0 0 10 4" : "0 0 4 10"}
      aria-hidden="true"
      style={{ display: "block", flexShrink: 0 }}
    >
      {dots.map((i) => (
        <circle
          key={i}
          cx={axis === "h" ? 2 + i * 3 : 2}
          cy={axis === "h" ? 2 : 2 + i * 3}
          r={1}
          fill="rgba(0,0,0,0.35)"
        />
      ))}
    </svg>
  )
}

/** A draggable edge handle that resizes the element on one axis */
function EdgeHandle({
  axis,
  edge,
  el,
  area,
  rowCount,
  chrome,
  grid,
  scale,
  onUpdate,
  onSelect,
  suppressNextCanvasClick,
}: {
  axis: "h" | "v"
  edge: "left" | "right" | "top" | "bottom"
  el: LayoutElement
  area: { firstCol: number; lastCol: number }
  rowCount: number
  chrome: ChromeConfig
  grid: GridConfig
  scale: number
  onUpdate: (el: LayoutElement) => void
  onSelect: (id: string) => void
  suppressNextCanvasClick: React.RefObject<boolean>
}) {
  const dragging = useRef(false)
  const startClient = useRef(0)
  // Freeze the edge's logical position at drag start so delta is always from a stable origin
  const startEdgePos = useRef(0)
  const startEl = useRef(el)

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation()
      e.preventDefault()
      dragging.current = true
      startClient.current = axis === "h" ? e.clientX : e.clientY
      startEl.current = el
      // Record the logical position of the edge being dragged
      if (edge === "left") startEdgePos.current = colLeft(el.colStart, grid)
      else if (edge === "right") startEdgePos.current = colLeft(el.colStart + el.colSpan - 1, grid)
      else if (edge === "top") startEdgePos.current = rowTop(el.row, rowCount, chrome, grid)
      else startEdgePos.current = rowTop(el.row + (el.rowSpan ?? 1) - 1, rowCount, chrome, grid)
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    },
    [axis, edge, el, grid, rowCount, chrome],
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current) return
      const delta = ((axis === "h" ? e.clientX : e.clientY) - startClient.current) / scale
      const target = startEdgePos.current + delta
      const frozen = startEl.current

      if (edge === "left") {
        const colEnd = frozen.colStart + frozen.colSpan - 1
        let best = area.firstCol, bestD = Infinity
        for (let c = area.firstCol; c <= colEnd; c++) {
          const d = Math.abs(target - colLeft(c, grid))
          if (d < bestD) { bestD = d; best = c }
        }
        onUpdate({ ...frozen, colStart: best, colSpan: colEnd - best + 1 })
      } else if (edge === "right") {
        let best = frozen.colStart, bestD = Infinity
        for (let c = frozen.colStart; c <= area.lastCol; c++) {
          const d = Math.abs(target - colLeft(c, grid))
          if (d < bestD) { bestD = d; best = c }
        }
        onUpdate({ ...frozen, colSpan: best - frozen.colStart + 1 })
      } else if (edge === "top") {
        const rowEnd = frozen.row + (frozen.rowSpan ?? 1) - 1
        let best = 1, bestD = Infinity
        for (let r = 1; r <= rowEnd; r++) {
          const d = Math.abs(target - rowTop(r, rowCount, chrome, grid))
          if (d < bestD) { bestD = d; best = r }
        }
        onUpdate({ ...frozen, row: best, rowSpan: rowEnd - best + 1 })
      } else {
        let best = frozen.row, bestD = Infinity
        for (let r = frozen.row; r <= rowCount; r++) {
          const d = Math.abs(target - rowTop(r, rowCount, chrome, grid))
          if (d < bestD) { bestD = d; best = r }
        }
        onUpdate({ ...frozen, rowSpan: best - frozen.row + 1 })
      }
    },
    [axis, edge, area, rowCount, chrome, grid, scale, onUpdate],
  )

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (dragging.current) {
        suppressNextCanvasClick.current = true
        onSelect(el.id)
      }
      dragging.current = false
      ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
    },
    [el.id, onSelect, suppressNextCanvasClick],
  )

  const isH = axis === "h"
  const handleStyle: React.CSSProperties = {
    position: "absolute",
    ...(isH
      ? {
          top: "50%",
          transform: "translateY(-50%)",
          width: 8,
          height: 32,
          [edge]: -4,
          cursor: "ew-resize",
        }
      : {
          left: "50%",
          transform: "translateX(-50%)",
          height: 8,
          width: 32,
          [edge]: -4,
          cursor: "ns-resize",
        }),
    background: "rgba(255,255,255,0.92)",
    border: "1px solid rgba(0,0,0,0.18)",
    borderRadius: 4,
    boxShadow: "0 1px 4px rgba(0,0,0,0.18)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 7,
    touchAction: "none",
  }

  return (
    <div
      data-edge-btn=""
      style={handleStyle}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <GripDots axis={isH ? "v" : "h"} />
    </div>
  )
}

function CanvasElement({
  el,
  rowCount,
  chrome,
  colours,
  isSelected,
  hasOverlap,
  scale,
  onDuplicate,
  grid,
  onSelect,
  onRemove,
  onUpdate,
  suppressNextCanvasClick,
}: {
  el: LayoutElement
  rowCount: number
  chrome: ChromeConfig
  colours: ColourTokens
  isSelected: boolean
  hasOverlap: boolean
  scale: number
  grid: GridConfig
  onSelect: (id: string | null) => void
  onRemove: (id: string) => void
  onDuplicate: (id: string) => void
  onUpdate: (el: LayoutElement) => void
  suppressNextCanvasClick: React.RefObject<boolean>
}) {
  const [hovered, setHovered] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [editingLabel, setEditingLabel] = useState(false)
  const [labelDraft, setLabelDraft] = useState("")
  const labelInputRef = useRef<HTMLInputElement>(null)
  const didMove = useRef(false)
  const wasSelected = useRef(false)
  const dragStart = useRef({ clientX: 0, clientY: 0, startColLeft: 0, startRowTop: 0 })
  const area = contentArea(chrome, grid)

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if ((e.target as HTMLElement).closest("[data-edge-btn]")) return
      if ((e.target as HTMLElement).tagName === "INPUT") return
      wasSelected.current = isSelected
      setIsDragging(true)
      didMove.current = false
      dragStart.current = {
        clientX: e.clientX,
        clientY: e.clientY,
        startColLeft: colLeft(el.colStart, grid),
        startRowTop: rowTop(el.row, rowCount, chrome, grid),
      }
    },
    [el.colStart, el.row, grid, rowCount, chrome, isSelected],
  )

  useEffect(() => {
    if (!isDragging) return
    const onMove = (e: PointerEvent) => {
      const deltaLogX = (e.clientX - dragStart.current.clientX) / scale
      const deltaLogY = (e.clientY - dragStart.current.clientY) / scale
      const targetLogX = dragStart.current.startColLeft + deltaLogX
      const targetLogY = dragStart.current.startRowTop + deltaLogY

      let bestCol = area.firstCol
      let bestDist = Infinity
      for (let c = area.firstCol; c <= area.lastCol - el.colSpan + 1; c++) {
        const d = Math.abs(targetLogX - colLeft(c, grid))
        if (d < bestDist) {
          bestDist = d
          bestCol = c
        }
      }

      let bestRow = 1
      bestDist = Infinity
      for (let r = 1; r <= rowCount - (el.rowSpan ?? 1) + 1; r++) {
        const d = Math.abs(targetLogY - rowTop(r, rowCount, chrome, grid))
        if (d < bestDist) {
          bestDist = d
          bestRow = r
        }
      }

      if (bestCol !== el.colStart || bestRow !== el.row) {
        didMove.current = true
        onUpdate({ ...el, colStart: bestCol, row: bestRow })
      }
    }
    const onUp = () => {
      if (didMove.current) {
        suppressNextCanvasClick.current = true
        onSelect(el.id)
      }
      setIsDragging(false)
    }
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
    return () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
    }
  }, [isDragging, scale, grid, area, el, rowCount, chrome, onUpdate, onSelect])

  const b = elementBounds(el, rowCount, chrome, grid)
  const dx = b.x * scale,
    dy = b.y * scale,
    dw = b.width * scale,
    dh = b.height * scale
  const isActive = isSelected || isDragging
  const showDelete = isActive
  const stackButtons = dw < 72 // too narrow to fit buttons side by side
  const bg = hovered && !isSelected ? `${colours.elementFill}cc` : colours.elementFill
  const ink = contrastColour(colours.elementFill)
  const borderColor = hasOverlap
    ? "#ea580c"
    : isSelected
      ? ink === "#ffffff"
        ? "rgba(255,255,255,0.7)"
        : "rgba(0,0,0,0.45)"
      : ink === "#ffffff"
        ? "rgba(255,255,255,0.25)"
        : "rgba(0,0,0,0.22)"
  const outlineColor = hasOverlap
    ? "rgba(234,88,12,0.4)"
    : ink === "#ffffff"
      ? "rgba(255,255,255,0.7)"
      : "rgba(0,0,0,0.4)"

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onPointerDown={handlePointerDown}
      onClick={() => {
        if (!didMove.current) onSelect(null)
      }}
      style={{
        position: "absolute",
        left: dx,
        top: dy,
        width: dw,
        height: dh,
        zIndex: isDragging ? 10 : isSelected ? 4 : 3,
        cursor: isDragging ? "grabbing" : "grab",
        opacity: isDragging ? 0.75 : 1,
        transition: isDragging ? "none" : "opacity 0.1s",
        touchAction: "none",
      }}
    >
      <button
        type="button"
        data-element-id={el.id}
        aria-pressed={isSelected}
        aria-label={`${el.label}, row ${el.row}, columns ${el.colStart} to ${el.colStart + el.colSpan - 1}${hasOverlap ? ", overlapping another element" : ""}`}
        onClick={(e) => {
          e.stopPropagation()
          if (!didMove.current) {
            onSelect(el.id)
          }
        }}
        onKeyDown={(e) => {
          if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return
          if (e.metaKey || e.ctrlKey) return // let App handle Ctrl+Arrow for selection change
          e.preventDefault()
          const colEnd = el.colStart + el.colSpan - 1
          const rowEnd = el.row + (el.rowSpan ?? 1) - 1
          if (e.key === "ArrowLeft") {
            if (e.shiftKey) {
              if (el.colSpan > 1) onUpdate({ ...el, colSpan: el.colSpan - 1 })
            } else {
              if (el.colStart > area.firstCol) onUpdate({ ...el, colStart: el.colStart - 1 })
            }
          } else if (e.key === "ArrowRight") {
            if (e.shiftKey) {
              if (colEnd < area.lastCol) onUpdate({ ...el, colSpan: el.colSpan + 1 })
            } else {
              if (colEnd < area.lastCol) onUpdate({ ...el, colStart: el.colStart + 1 })
            }
          } else if (e.key === "ArrowUp") {
            if (e.shiftKey) {
              if ((el.rowSpan ?? 1) > 1) onUpdate({ ...el, rowSpan: (el.rowSpan ?? 1) - 1 })
            } else {
              if (el.row > 1) onUpdate({ ...el, row: el.row - 1 })
            }
          } else if (e.key === "ArrowDown") {
            if (e.shiftKey) {
              if (rowEnd < rowCount) onUpdate({ ...el, rowSpan: (el.rowSpan ?? 1) + 1 })
            } else {
              if (rowEnd < rowCount) onUpdate({ ...el, row: el.row + 1 })
            }
          }
        }}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          background: bg,
          border: `${hasOverlap ? 2 : 1}px solid ${borderColor}`,
          outline: isSelected || hasOverlap ? `2px solid ${outlineColor}` : "none",
          outlineOffset: 1,
          borderRadius: 3,
          boxSizing: "border-box",
          cursor: "inherit",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 4px",
          overflow: "hidden",
          width: "100%",
          height: "100%",
          boxShadow: "0 1px 4px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            pointerEvents: "none",
            maxWidth: "100%",
          }}
        >
          {editingLabel ? (
            <input
              ref={labelInputRef}
              value={labelDraft}
              onChange={(e) => setLabelDraft(e.target.value)}
              onBlur={() => {
                const trimmed = labelDraft.trim()
                if (trimmed) onUpdate({ ...el, label: trimmed })
                setEditingLabel(false)
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur()
                if (e.key === "Escape") {
                  setEditingLabel(false)
                }
                e.stopPropagation()
              }}
              onClick={(e) => e.stopPropagation()}
              style={{
                fontSize: 11,
                fontWeight: 600,
                textAlign: "center",
                lineHeight: 1.3,
                color: contrastColour(colours.elementFill),
                background: "transparent",
                border: "none",
                outline: "none",
                width: "100%",
                padding: 0,
                pointerEvents: "all",
              }}
            />
          ) : (
            <span
              style={{
                fontSize: 11,
                color: contrastColour(colours.elementFill),
                fontWeight: 600,
                textAlign: "center",
                lineHeight: 1.3,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "100%",
                pointerEvents: "all",
              }}
              onDoubleClick={(e) => {
                e.stopPropagation()
                setLabelDraft(el.label)
                setEditingLabel(true)
                setTimeout(() => {
                  labelInputRef.current?.select()
                }, 0)
              }}
            >
              {el.label}
            </span>
          )}
          <span
            style={{
              fontSize: 9,
              color: contrastColour(colours.elementFill),
              lineHeight: 1.5,
              fontVariantNumeric: "tabular-nums",
              opacity: 0.55,
            }}
          >
            {Math.round(b.width)} × {Math.round(b.height)}
          </span>
        </div>
      </button>

      {/* Overlap warning badge — always visible when overlapping, even when selected */}
      {hasOverlap && (
        <div
          aria-hidden="true"
          title="This element overlaps another"
          style={{
            position: "absolute",
            top: 3,
            right: showDelete && !stackButtons ? 53 : 3,
            width: 20,
            height: 20,
            background: "#ea580c",
            borderRadius: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 6,
            pointerEvents: "none",
          }}
        >
          <svg width={12} height={12} viewBox="0 0 10 10" fill="none" aria-hidden="true">
            <path d="M5 1L9.5 9H0.5L5 1z" fill="#fff" opacity="0.9" />
            <line x1="5" y1="4" x2="5" y2="6.5" stroke="#ea580c" strokeWidth="1.2" strokeLinecap="round" />
            <circle cx="5" cy="7.8" r="0.6" fill="#ea580c" />
          </svg>
        </div>
      )}
      {showDelete && (
        <>
          <button
            type="button"
            aria-label={`Duplicate ${el.label}`}
            onClick={(e) => {
              e.stopPropagation()
              onDuplicate(el.id)
            }}
            style={{
              position: "absolute",
              top: stackButtons ? 27 : 3,
              right: stackButtons ? 3 : 27,
              width: 20,
              height: 20,
              background: "rgba(255,255,255,0.85)",
              border: "1px solid rgba(0,0,0,0.15)",
              borderRadius: 4,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
              zIndex: 6,
            }}
          >
            <svg width={10} height={10} viewBox="0 0 8 8" fill="none" aria-hidden="true">
              <rect x="2.5" y="0.5" width="5" height="5" rx="1" stroke="#333" strokeWidth="1" />
              <rect x="0.5" y="2.5" width="5" height="5" rx="1" fill="white" stroke="#333" strokeWidth="1" />
            </svg>
          </button>
          <button
            type="button"
            aria-label={`Delete ${el.label}`}
            onClick={(e) => {
              e.stopPropagation()
              onRemove(el.id)
            }}
            style={{
              position: "absolute",
              top: 3,
              right: 3,
              width: 20,
              height: 20,
              background: "#dc2626",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
              zIndex: 6,
            }}
          >
            <svg width={10} height={10} viewBox="0 0 8 8" fill="none" aria-hidden="true">
              <path d="M1 1l6 6M7 1L1 7" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </>
      )}

      {/* ── Edge resize handles (selected only) ── */}
      {isActive && (
        <>
          <EdgeHandle axis="v" edge="top" el={el} area={area} rowCount={rowCount} chrome={chrome} grid={grid} scale={scale} onUpdate={onUpdate} onSelect={onSelect} suppressNextCanvasClick={suppressNextCanvasClick} />
          <EdgeHandle axis="v" edge="bottom" el={el} area={area} rowCount={rowCount} chrome={chrome} grid={grid} scale={scale} onUpdate={onUpdate} onSelect={onSelect} suppressNextCanvasClick={suppressNextCanvasClick} />
          <EdgeHandle axis="h" edge="left" el={el} area={area} rowCount={rowCount} chrome={chrome} grid={grid} scale={scale} onUpdate={onUpdate} onSelect={onSelect} suppressNextCanvasClick={suppressNextCanvasClick} />
          <EdgeHandle axis="h" edge="right" el={el} area={area} rowCount={rowCount} chrome={chrome} grid={grid} scale={scale} onUpdate={onUpdate} onSelect={onSelect} suppressNextCanvasClick={suppressNextCanvasClick} />
        </>
      )}
    </div>
  )
}

/** Returns a Set of element IDs that overlap with at least one other element */
function computeOverlaps(
  elements: LayoutElement[],
  rowCount: number,
  chrome: ChromeConfig,
  grid: GridConfig,
): Set<string> {
  const bounds = elements.map((el) => ({
    id: el.id,
    ...elementBounds(el, rowCount, chrome, grid),
  }))
  const overlapping = new Set<string>()
  for (let i = 0; i < bounds.length; i++) {
    for (let j = i + 1; j < bounds.length; j++) {
      const a = bounds[i],
        b = bounds[j]
      const hOverlap = a.x < b.x + b.width && a.x + a.width > b.x
      const vOverlap = a.y < b.y + b.height && a.y + a.height > b.y
      if (hOverlap && vOverlap) {
        overlapping.add(a.id)
        overlapping.add(b.id)
      }
    }
  }
  return overlapping
}

export function Canvas({
  elements,
  rowCount,
  chrome,
  colours,
  selectedId,
  onSelect,
  onRemove,
  onDuplicate,
  onUpdate,
  showGrid,
  shadow,
  canvasW,
  canvasH,
  scale,
  grid = DEFAULT_GRID,
  highlightZone = null,
  theme = "dark",
}: Props) {
  const displayW = canvasW * scale
  const displayH = canvasH * scale
  const bands = colBands(scale, grid)
  const overlappingIds = computeOverlaps(elements, rowCount, chrome, grid)
  const suppressNextCanvasClick = useRef(false)
  const canvasRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!selectedId) return
    const btn = canvasRef.current?.querySelector<HTMLButtonElement>(`[data-element-id="${selectedId}"]`)
    btn?.focus({ preventScroll: true })
  }, [selectedId])

  return (
    <div style={{ borderRadius: 6, boxShadow: shadow, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
      <div
        ref={canvasRef}
        data-canvas
        role="region"
        aria-label="Power BI layout preview"
        style={{
          position: "relative",
          width: displayW,
          height: displayH,
          background: colours.canvasBg,
          border: `1px solid ${theme === "dark" ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.18)"}`,
          borderRadius: 6,
          overflow: "hidden",
        }}
        onClick={() => {
          if (suppressNextCanvasClick.current) {
            suppressNextCanvasClick.current = false
            return
          }
          onSelect(null)
        }}
      >
        {/* ── Column grid overlay ── */}
        {showGrid &&
          (() => {
            const eg = grid.edgeGutter * scale
            const cw = grid.colWidth * scale
            const cg = grid.colGutter * scale
            // Grid lines contrast against the canvas background
            const gridInk = contrastColour(colours.elementFill)
            const lineCol = gridInk === "#ffffff" ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.18)"
            const hlCol = colours.headerBg + "cc"
            return (
              <svg
                aria-hidden="true"
                style={{
                  position: "absolute",
                  inset: 0,
                  pointerEvents: "none",
                  zIndex: 5,
                }}
                width={displayW}
                height={displayH}
              >
                {/* Edge gutter shading */}
                <rect
                  x={0}
                  y={0}
                  width={eg}
                  height={displayH}
                  fill={highlightZone === "edge" ? hlCol : colours.headerBg}
                  opacity={highlightZone === "edge" ? 0.18 : 0}
                />
                <rect
                  x={displayW - eg}
                  y={0}
                  width={eg}
                  height={displayH}
                  fill={highlightZone === "edge" ? hlCol : colours.headerBg}
                  opacity={highlightZone === "edge" ? 0.18 : 0}
                />

                {/* Column fills + gap fills */}
                {bands.map((b, i) => (
                  <g key={i}>
                    {/* Column */}
                    <rect
                      x={b.x}
                      y={0}
                      width={cw}
                      height={displayH}
                      fill={colours.headerBg}
                      opacity={highlightZone === "col" ? 0.12 : 0}
                    />
                    {/* Gap (between cols) */}
                    {i < bands.length - 1 && (
                      <rect
                        x={b.x + cw}
                        y={0}
                        width={cg}
                        height={displayH}
                        fill={colours.headerBg}
                        opacity={highlightZone === "gap" ? 0.18 : 0}
                      />
                    )}
                  </g>
                ))}

                {/* Column boundary lines */}
                {bands.map((b, i) => (
                  <g key={`lines-${i}`}>
                    <line
                      x1={b.x}
                      y1={0}
                      x2={b.x}
                      y2={displayH}
                      stroke={lineCol}
                      strokeWidth={0.75}
                      strokeDasharray="3 3"
                    />
                    <line
                      x1={b.x + cw}
                      y1={0}
                      x2={b.x + cw}
                      y2={displayH}
                      stroke={lineCol}
                      strokeWidth={0.75}
                      strokeDasharray="3 3"
                    />
                  </g>
                ))}
              </svg>
            )
          })()}

        {/* ── Header ─────────────────────────────────────────────── */}
        {chrome.header && (
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: displayW,
              height: HEADER_H * scale,
              background: colours.headerBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: `0 ${grid.edgeGutter * scale}px`,
              boxSizing: "border-box",
              zIndex: 2,
            }}
          >
            <span
              style={{
                fontSize: 8,
                color: contrastColour(colours.headerBg),
                fontWeight: 500,
                letterSpacing: 0.4,
              }}
            >
              Dashboard title
            </span>
            <span
              style={{
                fontSize: 7,
                fontFamily: "monospace",
                color: contrastDim(colours.headerBg),
                letterSpacing: 0,
              }}
            >
              h: {HEADER_H}px
            </span>
          </div>
        )}

        {/* ── Footer ─────────────────────────────────────────────── */}
        {chrome.footer && (
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              left: 0,
              top: displayH - FOOTER_H * scale,
              width: displayW,
              height: FOOTER_H * scale,
              background: colours.footerBg,
              borderTop: `0.5px solid ${contrastColour(colours.footerBg) === "#ffffff" ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.10)"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: `0 ${grid.edgeGutter * scale}px`,
              boxSizing: "border-box",
              zIndex: 2,
            }}
          >
            <span style={{ fontSize: 7, color: contrastColour(colours.footerBg) }}>Source · Updated daily</span>
            <span
              style={{
                fontSize: 7,
                fontFamily: "monospace",
                color: contrastDim(colours.footerBg),
              }}
            >
              h: {FOOTER_H}px
            </span>
          </div>
        )}

        {/* ── Sidebar ────────────────────────────────────────────── */}
        {chrome.sidebarCols > 0 &&
          (() => {
            const isRight = chrome.sidebarSide === "right"
            const sw = sidebarWidth(chrome.sidebarCols, grid) * scale
            const sidebarTop = (chrome.header ? HEADER_H : 0) * scale
            const sidebarH = displayH - sidebarTop - (chrome.footer ? FOOTER_H : 0) * scale
            const swLogical = Math.round(sidebarWidth(chrome.sidebarCols, grid))
            return (
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: isRight ? displayW - sw : 0,
                  top: sidebarTop,
                  width: sw,
                  height: sidebarH,
                  background: colours.sidebarBg,
                  borderLeft: isRight
                    ? `0.5px solid ${contrastColour(colours.sidebarBg) === "#ffffff" ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.10)"}`
                    : undefined,
                  borderRight: !isRight
                    ? `0.5px solid ${contrastColour(colours.sidebarBg) === "#ffffff" ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.10)"}`
                    : undefined,
                  boxSizing: "border-box",
                  zIndex: 2,
                }}
              >
                {/* Inner content centred on the column area */}
                {(() => {
                  const ink = contrastColour(colours.sidebarBg)
                  const dim = ink === "#ffffff" ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.45)"
                  const rule = ink === "#ffffff" ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.10)"
                  const inputBg = ink === "#ffffff" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"
                  const dot = colours.headerBg
                  // All sizes in logical px (at 1:1), multiplied by scale for display
                  const s = scale
                  const pad = grid.edgeGutter * scale
                  // Typography rhythm: label=11px text on 16px line, body=12px on 20px line, input=28px tall
                  const labelLineH = 16 * s // compact label line height
                  const bodyLineH = 20 * s // body / option line height
                  const inputH = 28 * s // select box height
                  const textH = 7 * s // bar height representing text
                  const microH = 6 * s // smaller label bar
                  const sectionGap = 16 * s // gap between filter groups
                  const innerGap = 4 * s // gap within a group (label → control)
                  return (
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        width: sw,
                        top: 20 * s,
                        paddingLeft: pad,
                        paddingRight: pad,
                        boxSizing: "border-box",
                        display: "flex",
                        flexDirection: "column",
                        gap: sectionGap,
                      }}
                    >
                      {/* Section heading — "Filters" */}
                      <div>
                        <div style={{ height: 28 * s, display: "flex", alignItems: "center", gap: 5 * s }}>
                          <span style={{ fontSize: 8, fontWeight: 500, color: ink, letterSpacing: 0.4 }}>Filters</span>
                        </div>
                        <div style={{ height: 0.5, background: rule }} />
                      </div>

                      {/* Dropdown filter */}
                      <div style={{ display: "flex", flexDirection: "column", gap: innerGap }}>
                        <div style={{ height: labelLineH, display: "flex", alignItems: "center" }}>
                          <div
                            style={{ height: microH, width: "55%", background: dim, borderRadius: 1 * s, opacity: 0.6 }}
                          />
                        </div>
                        <div
                          style={{
                            height: inputH,
                            background: inputBg,
                            border: `0.5px solid ${rule}`,
                            borderRadius: 3 * s,
                            padding: `0 ${6 * s}px`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            boxSizing: "border-box",
                          }}
                        >
                          <div style={{ display: "flex", gap: 2 * s, alignItems: "center" }}>
                            {[0, 1, 2, 3].map((j) => (
                              <div
                                key={j}
                                style={{
                                  width: 3 * s,
                                  height: 3 * s,
                                  borderRadius: "50%",
                                  background: ink,
                                  opacity: 0.3,
                                }}
                              />
                            ))}
                          </div>
                          <svg width={5 * s} height={5 * s} viewBox="0 0 5 5" fill="none" aria-hidden="true">
                            <path d="M1 2l1.5 1.5L4 2" stroke={dim} strokeWidth="0.8" strokeLinecap="round" />
                          </svg>
                        </div>
                      </div>

                      {/* Radio group */}
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <div style={{ height: labelLineH, display: "flex", alignItems: "center" }}>
                          <div
                            style={{ height: microH, width: "40%", background: dim, borderRadius: 1 * s, opacity: 0.6 }}
                          />
                        </div>
                        {[
                          { w: "50%", sel: true },
                          { w: "40%", sel: false },
                          { w: "45%", sel: false },
                        ].map(({ w, sel }, i) => (
                          <div key={i} style={{ height: bodyLineH, display: "flex", alignItems: "center", gap: 6 * s }}>
                            <div
                              style={{
                                width: 8 * s,
                                height: 8 * s,
                                borderRadius: "50%",
                                flexShrink: 0,
                                border: `${0.75 * s}px solid ${sel ? dot : rule}`,
                                background: sel ? dot : "transparent",
                              }}
                            />
                            <div
                              style={{
                                height: textH,
                                width: w,
                                background: ink,
                                borderRadius: 1 * s,
                                opacity: sel ? 0.7 : 0.3,
                              }}
                            />
                          </div>
                        ))}
                      </div>

                      {/* Slicer — 2×2 button grid */}
                      <div style={{ display: "flex", flexDirection: "column", gap: innerGap }}>
                        <div style={{ height: labelLineH, display: "flex", alignItems: "center" }}>
                          <div
                            style={{ height: microH, width: "45%", background: dim, borderRadius: 1 * s, opacity: 0.6 }}
                          />
                        </div>
                        {[
                          [true, false],
                          [false, false],
                        ].map((row, ri) => (
                          <div key={ri} style={{ display: "flex", gap: 4 * s }}>
                            {row.map((active, ci) => (
                              <div
                                key={ci}
                                style={{
                                  flex: 1,
                                  height: 20 * s,
                                  borderRadius: 2 * s,
                                  border: `0.5px solid ${active ? dot : rule}`,
                                  background: active ? dot : inputBg,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <div
                                  style={{
                                    height: textH,
                                    width: "55%",
                                    borderRadius: 1 * s,
                                    background: active ? contrastColour(dot) : ink,
                                    opacity: active ? 0.9 : 0.3,
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}
                {/* Dimension label at bottom */}
                <span
                  style={{
                    position: "absolute",
                    bottom: 5,
                    left: 0,
                    right: 0,
                    textAlign: "center",
                    fontSize: 7,
                    fontFamily: "monospace",
                    color: contrastDim(colours.sidebarBg),
                    letterSpacing: 0,
                  }}
                >
                  w: {swLogical}px
                </span>
              </div>
            )
          })()}

        {/* ── Empty state ── */}
        {elements.length === 0 &&
          (() => {
            const area = contentArea(chrome, grid)
            const ink = contrastColour(colours.canvasBg)
            const dim = ink === "#ffffff" ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.38)"
            const subtle = ink === "#ffffff" ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.12)"
            const s = scale
            // Centre within the content area (accounts for sidebar offset)
            const cx = (area.left + (grid.w - area.left) / 2) * s
            const cy = (area.top + area.height / 2) * s
            return (
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: cx - 80 * s,
                  top: cy - 34 * s,
                  width: 160 * s,
                  pointerEvents: "none",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8 * s,
                }}
              >
                {/* Mini grid illustration */}
                <svg width={72 * s} height={40 * s} viewBox="0 0 72 40" aria-hidden="true">
                  {[
                    [2, 2, 30, 17],
                    [40, 2, 30, 17],
                    [2, 22, 68, 17],
                  ].map(([x, y, w, h], i) => (
                    <rect key={i} x={x} y={y} width={w} height={h} rx={2} fill={subtle} stroke={dim} strokeWidth={1} />
                  ))}
                </svg>
                <span
                  style={{
                    fontSize: Math.max(9, 10 * s),
                    color: dim,
                    letterSpacing: 0.3,
                    textAlign: "center",
                    lineHeight: 1.4,
                    whiteSpace: "nowrap",
                  }}
                >
                  Load a preset or add an element
                </span>
              </div>
            )
          })()}

        {/* ── Elements ── selected renders last so it paints on top ── */}
        {[...elements]
          .sort((a, b) => (a.id === selectedId ? 1 : b.id === selectedId ? -1 : 0))
          .map((el) => (
            <CanvasElement
              key={el.id}
              el={el}
              rowCount={rowCount}
              chrome={chrome}
              colours={colours}
              isSelected={el.id === selectedId}
              hasOverlap={overlappingIds.has(el.id)}
              scale={scale}
              grid={grid}
              onSelect={onSelect}
              onRemove={onRemove}
              onDuplicate={onDuplicate}
              onUpdate={onUpdate}
              suppressNextCanvasClick={suppressNextCanvasClick}
            />
          ))}
      </div>
    </div>
  )
}
