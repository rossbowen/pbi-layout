import type { LayoutElement, ChromeConfig } from "../types"
import { elementBounds, sidebarWidth, DEFAULT_GRID, type GridConfig } from "../hooks/useGrid"
import { HEADER_H, FOOTER_H } from "../constants"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontalIcon, CopyIcon, Trash2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  elements: LayoutElement[]
  rowCount: number
  chrome: ChromeConfig
  grid?: GridConfig
  selectedId: string | null
  onSelect: (id: string) => void
  onDuplicate: (id: string) => void
  onRemove: (id: string) => void
  theme: string
}

interface SpecRow {
  key: string
  name: string
  subtitle?: string
  type: "chrome" | "element"
  elementId?: string
  cols?: string
  rows?: string
  x: number
  y: number
  w: number
  h: number
}

export function SpecTable({
  elements,
  rowCount,
  chrome,
  grid = DEFAULT_GRID,
  selectedId,
  onSelect,
  onDuplicate,
  onRemove,
}: Props) {
  const rows: SpecRow[] = []

  if (chrome.header) {
    rows.push({
      key: "header",
      name: "Header",
      type: "chrome",
      x: 0,
      y: 0,
      w: grid.w,
      h: HEADER_H,
    })
  }

  if (chrome.sidebarCols > 0) {
    const sw = sidebarWidth(chrome.sidebarCols, grid)
    const top = chrome.header ? HEADER_H : 0
    const bottom = grid.h - (chrome.footer ? FOOTER_H : 0)
    const isRight = chrome.sidebarSide === "right"
    const sideLabel = chrome.sidebarCols === 3 ? "wide" : "2-col"
    rows.push({
      key: "sidebar",
      name: "Sidebar",
      subtitle: `${sideLabel} · ${isRight ? "right" : "left"}`,
      type: "chrome",
      x: isRight ? grid.w - sw : 0,
      y: top,
      w: sw,
      h: bottom - top,
    })
  }

  for (const el of elements) {
    const b = elementBounds(el, rowCount, chrome, grid)
    const span = el.rowSpan ?? 1
    const rowLabel = span > 1 ? `${el.row}–${el.row + span - 1}` : `${el.row}`
    rows.push({
      key: el.id,
      name: el.label,
      type: "element",
      elementId: el.id,
      cols: `${el.colStart}–${el.colStart + el.colSpan - 1}`,
      rows: rowLabel,
      x: b.x,
      y: b.y,
      w: b.width,
      h: b.height,
    })
  }

  if (chrome.footer) {
    rows.push({
      key: "footer",
      name: "Footer",
      type: "chrome",
      x: 0,
      y: grid.h - FOOTER_H,
      w: grid.w,
      h: FOOTER_H,
    })
  }

  if (rows.length === 0) return null

  return (
    <section aria-label="Component specifications">
      <div className="border border-border rounded overflow-hidden bg-card shadow-sm">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-border bg-card">
              <th className="text-left px-3 py-1.5 font-medium text-muted-foreground w-32">Name</th>
              <th className="text-center px-2 py-1.5 font-medium text-muted-foreground">Row</th>
              <th className="text-center px-2 py-1.5 font-medium text-muted-foreground">Cols</th>
              <th className="text-right px-2 py-1.5 font-medium text-muted-foreground">X</th>
              <th className="text-right px-2 py-1.5 font-medium text-muted-foreground">Y</th>
              <th className="text-right px-2 py-1.5 font-medium text-muted-foreground">W</th>
              <th className="text-right px-3 py-1.5 font-medium text-muted-foreground">H</th>
              <th className="w-10" scope="col">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const isChrome = r.type === "chrome"
              const isSelected = r.elementId === selectedId
              return (
                <tr
                  key={r.key}
                  onClick={() => r.elementId && onSelect(r.elementId)}
                  tabIndex={r.elementId ? 0 : undefined}
                  role={r.elementId ? "row" : undefined}
                  aria-selected={isSelected}
                  onKeyDown={(e) => r.elementId && e.key === "Enter" && onSelect(r.elementId)}
                  className={cn(
                    "border-b border-border transition-colors",
                    r.elementId && "cursor-pointer",
                    isSelected && "bg-muted",
                    !isSelected && isChrome && "bg-muted/25",
                    !isSelected && !isChrome && i % 2 === 1 && "bg-muted/40",
                    !isSelected && r.elementId && "hover:bg-muted/60",
                  )}
                >
                  <td className="px-3 py-1.5 max-w-32">
                    <div className={cn("truncate", isChrome ? "text-muted-foreground" : "text-foreground")}>
                      {isChrome && <span className="mr-1 text-muted-foreground">◇</span>}
                      {r.name}
                    </div>
                    {(r.subtitle || !isChrome) && (
                      <div className="font-mono text-[10px] leading-tight mt-0.5 text-muted-foreground">
                        {r.subtitle ?? `${Math.round(r.w)} × ${Math.round(r.h)}`}
                      </div>
                    )}
                  </td>
                  <td className="px-2 py-1.5 text-center font-mono text-muted-foreground">{r.rows ?? "—"}</td>
                  <td className="px-2 py-1.5 text-center font-mono text-muted-foreground">{r.cols ?? "—"}</td>
                  <td className="px-2 py-1.5 text-right font-mono text-muted-foreground">{Math.round(r.x)}</td>
                  <td className="px-2 py-1.5 text-right font-mono text-muted-foreground">{Math.round(r.y)}</td>
                  <td className="px-2 py-1.5 text-right font-mono text-muted-foreground">{Math.round(r.w)}</td>
                  <td className="px-3 py-1.5 text-right font-mono text-muted-foreground">{Math.round(r.h)}</td>
                  <td className="py-1.5 w-10 text-center">
                    {r.elementId && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Actions for ${r.name}`}
                            onClick={(e) => e.stopPropagation()}
                            className="h-6 w-6 opacity-40 hover:opacity-100 transition-opacity"
                          >
                            <MoreHorizontalIcon className="size-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              onDuplicate(r.elementId!)
                            }}
                          >
                            <CopyIcon className="mr-2 size-3.5" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              onRemove(r.elementId!)
                            }}
                          >
                            <Trash2Icon className="mr-2 size-3.5" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
