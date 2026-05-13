import { useState, useRef, useCallback, useEffect } from "react"
import type { LayoutElement, ChromeConfig } from "../types"
import { COL_COUNT } from "../constants"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface ListProps {
  elements: LayoutElement[]
  selectedId: string | null
  onSelect: (id: string | null) => void
}

export function ElementList({ elements, selectedId, onSelect }: ListProps) {
  if (elements.length === 0) {
    return <p className="text-xs text-muted-foreground px-3 py-2">No elements yet.</p>
  }

  return (
    <div>
      {elements.map((el) => {
        const colEnd = el.colStart + el.colSpan - 1
        const isSelected = selectedId === el.id
        return (
          <button
            key={el.id}
            type="button"
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-muted/50 border-b last:border-b-0 border-border",
              isSelected && "bg-muted",
            )}
            onClick={() => onSelect(isSelected ? null : el.id)}
            aria-pressed={isSelected}
            aria-label={`${el.label}, row ${el.row}${el.rowSpan > 1 ? `–${el.row + el.rowSpan - 1}` : ""}, cols ${el.colStart}–${colEnd}`}
          >
            <span className="text-xs font-medium flex-1 truncate text-foreground">{el.label}</span>
            <span className="text-[10px] shrink-0 text-muted-foreground">
              R{el.row}
              {el.rowSpan > 1 ? `–${el.row + el.rowSpan - 1}` : ""} · {el.colStart}–{colEnd}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function ColSpinner({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex flex-col gap-0.5 flex-1">
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <div className="flex items-center">
        <Button
          type="button"
          variant="outline"
          size="icon-xs"
          aria-label={`Decrease ${label}`}
          onClick={() => {
            if (value > min) onChange(value - 1)
          }}
          className="rounded-r-none border-r-0"
        >
          −
        </Button>
        <Input
          type="number"
          min={min}
          max={max}
          value={value}
          aria-label={`${label} column`}
          onChange={(e) => {
            const v = parseInt(e.target.value)
            if (!isNaN(v) && v >= min && v <= max) onChange(v)
          }}
          className="h-6 w-full rounded-none text-xs text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <Button
          type="button"
          variant="outline"
          size="icon-xs"
          aria-label={`Increase ${label}`}
          onClick={() => {
            if (value < max) onChange(value + 1)
          }}
          className="rounded-l-none border-l-0"
        >
          +
        </Button>
      </div>
    </div>
  )
}

interface DetailProps {
  element: LayoutElement
  rowCount: number
  chrome: ChromeConfig
  onUpdate: (el: LayoutElement) => void
  onRemove: () => void
  onDuplicate: () => void
  onRowCount: (n: number) => void
}

export function ElementDetail({ element, rowCount, chrome, onUpdate, onRemove, onDuplicate, onRowCount }: DetailProps) {
  const firstCol = chrome.sidebarCols > 0 ? chrome.sidebarCols + 1 : 1

  function set(patch: Partial<LayoutElement>) {
    onUpdate({ ...element, ...patch })
  }

  const colEnd = element.colStart + element.colSpan - 1

  const [pendingStart, setPendingStart] = useState<number | null>(null)
  const [dragRange, setDragRange] = useState<{ anchor: number; current: number } | null>(null)
  const colBarRef = useRef<HTMLDivElement>(null)
  const pointerDownX = useRef<number>(0)
  const DRAG_THRESHOLD = 4

  useEffect(() => {
    setPendingStart(null)
    setDragRange(null)
  }, [element.id])

  const colFromX = useCallback(
    (clientX: number): number => {
      const bar = colBarRef.current
      if (!bar) return firstCol
      const { left, width } = bar.getBoundingClientRect()
      const frac = Math.max(0, Math.min(1, (clientX - left) / width))
      return Math.max(1, Math.min(COL_COUNT, Math.ceil(frac * COL_COUNT)))
    },
    [firstCol],
  )

  const isDragging = dragRange !== null
  const previewStart = isDragging ? Math.max(firstCol, Math.min(dragRange.anchor, dragRange.current)) : element.colStart
  const previewEnd = isDragging ? Math.max(firstCol, Math.max(dragRange.anchor, dragRange.current)) : colEnd

  const cells = Array.from({ length: COL_COUNT }, (_, i) => {
    const col = i + 1
    const inSidebar = col < firstCol
    const inRange = col >= previewStart && col <= previewEnd
    const isPending = !isDragging && pendingStart !== null && col === pendingStart
    return { col, inSidebar, inRange, isPending }
  })

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Label */}
      <div>
        <Label htmlFor={`el-label-${element.id}`} className="text-xs mb-1 block">
          Label
        </Label>
        <Input
          id={`el-label-${element.id}`}
          type="text"
          value={element.label}
          maxLength={40}
          onChange={(e) => set({ label: e.target.value })}
          className="h-7 text-xs"
        />
      </div>

      {/* Row */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <Label className="text-xs">Rows</Label>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon-xs"
              onClick={() => rowCount > 1 && onRowCount(rowCount - 1)}
              disabled={rowCount <= 1}
              title="Remove last row"
            >
              −
            </Button>
            <Button
              variant="outline"
              size="icon-xs"
              onClick={() => rowCount < 4 && onRowCount(rowCount + 1)}
              disabled={rowCount >= 4}
              title="Add row"
            >
              +
            </Button>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex flex-col gap-1 flex-1">
            <span className="text-[10px] text-muted-foreground">Row</span>
            {Array.from({ length: rowCount }, (_, i) => {
              const r = i + 1
              const active = element.row === r
              return (
                <Button
                  key={r}
                  variant={active ? "default" : "outline"}
                  size="sm"
                  onClick={() => set({ row: r, rowSpan: Math.min(element.rowSpan, rowCount - r + 1) })}
                  className="w-full justify-start text-xs"
                >
                  Row {r}
                </Button>
              )
            })}
          </div>
          <div className="flex flex-col gap-1 shrink-0">
            <span className="text-[10px] text-muted-foreground">Span</span>
            {Array.from({ length: rowCount }, (_, i) => {
              const s = i + 1
              const maxSpan = rowCount - element.row + 1
              const active = element.rowSpan === s
              const disabled = s > maxSpan
              return (
                <Button
                  key={s}
                  variant={active ? "default" : "outline"}
                  size="sm"
                  disabled={disabled}
                  onClick={() => set({ rowSpan: s })}
                  className="w-10 text-xs"
                >
                  {s}
                </Button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Columns */}
      <div>
        <Label className="text-xs mb-1.5 block">Columns</Label>
        <div
          ref={colBarRef}
          role="group"
          aria-label={`Column range, ${previewStart} to ${previewEnd}`}
          className="flex gap-px mb-2"
          style={{ cursor: "pointer", touchAction: "none", userSelect: "none" }}
          onPointerDown={(e) => {
            const col = colFromX(e.clientX)
            if (col < firstCol) return
            pointerDownX.current = e.clientX
            e.currentTarget.setPointerCapture(e.pointerId)
          }}
          onPointerMove={(e) => {
            if (!e.currentTarget.hasPointerCapture(e.pointerId)) return
            const col = colFromX(e.clientX)
            if (col < firstCol) return
            if (dragRange === null) {
              if (Math.abs(e.clientX - pointerDownX.current) >= DRAG_THRESHOLD) {
                const anchor = colFromX(pointerDownX.current)
                setPendingStart(null)
                setDragRange({ anchor, current: col })
              }
            } else {
              setDragRange((r) => (r ? { ...r, current: col } : null))
            }
          }}
          onPointerUp={(e) => {
            if (dragRange !== null) {
              const col = Math.max(firstCol, colFromX(e.clientX))
              const newStart = Math.max(firstCol, Math.min(dragRange.anchor, col))
              const newEnd = Math.max(dragRange.anchor, col)
              setDragRange(null)
              set({ colStart: newStart, colSpan: newEnd - newStart + 1 })
            } else {
              const col = colFromX(e.clientX)
              if (col < firstCol) return
              if (pendingStart === null) {
                setPendingStart(col)
              } else {
                const newStart = Math.max(firstCol, Math.min(pendingStart, col))
                const newEnd = Math.max(pendingStart, col)
                setPendingStart(null)
                set({ colStart: newStart, colSpan: newEnd - newStart + 1 })
              }
            }
          }}
          onPointerCancel={() => setDragRange(null)}
          onKeyDown={(e) => {
            if (!["ArrowLeft", "ArrowRight"].includes(e.key)) return
            e.preventDefault()
            if (e.key === "ArrowLeft") {
              if (e.shiftKey) {
                if (element.colStart > firstCol) set({ colStart: element.colStart - 1, colSpan: element.colSpan + 1 })
              } else {
                const newStart = Math.max(firstCol, element.colStart - 1)
                set({ colStart: newStart, colSpan: colEnd - newStart + 1 })
              }
            } else {
              if (e.shiftKey) {
                if (colEnd < 12) set({ colSpan: element.colSpan + 1 })
              } else {
                const newEnd = Math.min(12, colEnd + 1)
                set({ colSpan: newEnd - element.colStart + 1 })
              }
            }
          }}
          tabIndex={0}
        >
          {cells.map(({ col, inSidebar, inRange, isPending }) => (
            <div
              key={col}
              aria-hidden="true"
              className={cn(
                "h-3.5 flex-1 rounded-sm",
                inSidebar && "opacity-30 bg-border",
                !inSidebar && (inRange || isPending) && "bg-primary",
                !inSidebar && !inRange && !isPending && "bg-muted",
                isPending && "opacity-60",
              )}
            />
          ))}
        </div>
        <div className="flex gap-2 items-end">
          <ColSpinner
            label="Start"
            value={element.colStart}
            min={firstCol}
            max={colEnd}
            onChange={(v) => {
              setPendingStart(null)
              set({ colStart: v, colSpan: colEnd - v + 1 })
            }}
          />
          <span className="text-xs text-muted-foreground pb-1">–</span>
          <ColSpinner
            label="End"
            value={colEnd}
            min={element.colStart}
            max={12}
            onChange={(v) => {
              setPendingStart(null)
              set({ colSpan: v - element.colStart + 1 })
            }}
          />
        </div>
        <p className="text-[10px] mt-1 text-muted-foreground" style={{ visibility: pendingStart !== null ? "visible" : "hidden" }}>
          {pendingStart !== null ? `Col ${pendingStart} selected — click end column` : "\u00a0"}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button onClick={onDuplicate} variant="outline" size="sm" className="flex-1 text-xs">
          Duplicate
        </Button>
        <Button onClick={onRemove} variant="destructive" size="sm" className="flex-1 text-xs">
          Remove
        </Button>
      </div>
    </div>
  )
}
