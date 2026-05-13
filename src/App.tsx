import { useState, useEffect, useRef, useCallback } from "react"
import { useLayout } from "./hooks/useLayout"
import { gridConfigFrom } from "./hooks/useGrid"
import { Canvas } from "./components/Canvas"
import { AppSidebar } from "./components/Sidebar"
import { SpecTable } from "./components/SpecTable"
import { HelpSheet } from "./components/HelpSheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { type Theme } from "./theme"
import { CANVAS_SIZES, DEFAULT_CANVAS_SIZE } from "./constants"
import type { CanvasSizeKey } from "./types"
import { Undo2Icon, Redo2Icon, GridIcon, MoonIcon, SunIcon, Share2Icon, DownloadIcon, CheckIcon } from "lucide-react"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { buildShareUrl, decodeLayout, readLayoutParam, clearLayoutParam } from "./shareLayout"
import { exportPbir } from "./exportPbir"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"

const THEME_KEY = "pbi-layout-theme"
const SIZE_KEY = "pbi-layout-size"

function getInitialTheme(): Theme {
  try {
    const saved = localStorage.getItem(THEME_KEY)
    if (saved === "light" || saved === "dark") return saved
  } catch {
    /* ignore */
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

function getInitialSize(): CanvasSizeKey {
  try {
    const saved = localStorage.getItem(SIZE_KEY)
    if (saved && saved in CANVAS_SIZES) return saved as CanvasSizeKey
  } catch {
    /* ignore */
  }
  return DEFAULT_CANVAS_SIZE
}

export function App() {
  const [canvasSize, setCanvasSizeState] = useState<CanvasSizeKey>(getInitialSize)
  const sizeConfig = CANVAS_SIZES[canvasSize]
  const grid = gridConfigFrom(sizeConfig)
  const layout = useLayout(grid)
  const [themeKey, setThemeKey] = useState<Theme>(getInitialTheme)
  const [showGrid, setShowGrid] = useState(true)
  const [gridHighlight, setGridHighlight] = useState<"col" | "gap" | "edge" | null>(null)
  const [shareCopied, setShareCopied] = useState(false)
  const mainRef = useRef<HTMLElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  // Canvas renders at logical size; display size is logical * BASE_SCALE
  const displayW = sizeConfig.w * sizeConfig.scale
  const displayH = sizeConfig.h * sizeConfig.scale
  // Fit scale: shrink if container is narrower than display size
  const fitScale = containerWidth > 0 && containerWidth < displayW ? containerWidth / displayW : 1
  const renderedW = displayW * fitScale
  const renderedH = displayH * fitScale

  const handleCanvasSize = useCallback(
    (size: CanvasSizeKey) => {
      if (size === canvasSize) return
      setCanvasSizeState(size)
      try {
        localStorage.setItem(SIZE_KEY, size)
      } catch {
        /* ignore */
      }
    },
    [canvasSize],
  )

  // Apply dark class to html element for shadcn
  useEffect(() => {
    document.documentElement.classList.toggle("dark", themeKey === "dark")
    try {
      localStorage.setItem(THEME_KEY, themeKey)
    } catch {
      /* ignore */
    }
  }, [themeKey])

  // Undo/redo keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore when focus is inside a text input
      const tag = (e.target as HTMLElement).tagName
      if (tag === "INPUT" || tag === "TEXTAREA") return

      const mod = e.metaKey || e.ctrlKey
      if (mod) {
        if (e.key === "z" && !e.shiftKey) {
          e.preventDefault()
          layout.undo()
        }
        if ((e.key === "z" && e.shiftKey) || e.key === "y") {
          e.preventDefault()
          layout.redo()
        }
        // Ctrl+Arrow: move selection to nearest element in that direction
        if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key) && layout.selectedId) {
          e.preventDefault()
          const current = layout.elements.find((el) => el.id === layout.selectedId)
          if (current) {
            const colEnd = (el: typeof current) => el.colStart + el.colSpan - 1
            const rowEnd = (el: typeof current) => el.row + (el.rowSpan ?? 1) - 1
            const candidates = layout.elements.filter((el) => {
              if (el.id === current.id) return false
              if (e.key === "ArrowLeft") return colEnd(el) < current.colStart
              if (e.key === "ArrowRight") return el.colStart > colEnd(current)
              if (e.key === "ArrowUp") return rowEnd(el) < current.row
              if (e.key === "ArrowDown") return el.row > rowEnd(current)
              return false
            })
            const nearest = candidates.sort((a, b) => {
              const dist = (el: typeof current) => {
                if (e.key === "ArrowLeft") return current.colStart - colEnd(el)
                if (e.key === "ArrowRight") return el.colStart - colEnd(current)
                if (e.key === "ArrowUp") return current.row - rowEnd(el)
                return el.row - rowEnd(current)
              }
              return dist(a) - dist(b)
            })[0]
            if (nearest) layout.selectElement(nearest.id)
          }
        }
        return
      }

      if (e.key === "Escape") {
        layout.selectElement(null)
      }
      if ((e.key === "Backspace" || e.key === "Delete") && layout.selectedId) {
        e.preventDefault()
        layout.removeElement(layout.selectedId)
      }
      if (e.key === "d" && layout.selectedId) {
        e.preventDefault()
        layout.duplicateElement(layout.selectedId)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [layout.undo, layout.redo, layout.selectedId, layout.selectElement, layout.removeElement, layout.duplicateElement])

  // Follow system dark mode changes (only if no explicit preference saved)
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem(THEME_KEY)) setThemeKey(e.matches ? "dark" : "light")
    }
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  // Measure container width
  useEffect(() => {
    const el = mainRef.current
    if (!el) return
    const update = () => setContainerWidth(el.clientWidth - 48)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Decode shared layout from URL on first load
  useEffect(() => {
    const param = readLayoutParam()
    if (!param) return
    decodeLayout(param).then((state) => {
      if (!state) return
      clearLayoutParam()
      if (state.canvasSize) handleCanvasSize(state.canvasSize)
      layout.loadPreset({
        id: "shared",
        name: "Shared layout",
        chrome: state.chrome,
        rowCount: state.rowCount,
        colours: state.colours,
        elements: state.elements,
      })
    })
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleShare = useCallback(async () => {
    const url = await buildShareUrl({
      elements: layout.elements,
      rowCount: layout.rowCount,
      chrome: layout.chrome,
      colours: layout.colours,
      canvasSize,
    })
    try {
      await navigator.clipboard.writeText(url)
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 2000)
    } catch {
      window.prompt("Copy this link:", url)
    }
  }, [layout.elements, layout.rowCount, layout.chrome, layout.colours, canvasSize])

  const handleExport = useCallback(() => {
    exportPbir({
      elements: layout.elements,
      rowCount: layout.rowCount,
      chrome: layout.chrome,
      colours: layout.colours,
      canvasSize,
      grid,
    })
  }, [layout.elements, layout.rowCount, layout.chrome, layout.colours, canvasSize, grid])

  // Canvas shadow — theme-dependent
  const canvasShadow =
    themeKey === "dark"
      ? "0 0 0 1px rgba(255,255,255,0.08), 0 0 30px rgba(255,255,255,0.06)"
      : "0 4px 24px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)"

  return (
    <SidebarProvider>
    <div className="flex flex-col w-full bg-background text-foreground">
      {/* Top bar */}
      <header
        className="flex items-center justify-between px-4 py-2 border-b shrink-0"
        style={{
          background:
            themeKey === "dark"
              ? "linear-gradient(to right, oklch(0.10 0.04 264), oklch(0.14 0.06 240))"
              : "linear-gradient(to right, oklch(0.20 0.04 264), oklch(0.30 0.08 250))",
        }}
      >
        <div className="flex items-center gap-3">
          <SidebarTrigger className="text-white/80 hover:text-white hover:bg-white/10" />
          <div>
            <h1 className="text-xs font-semibold tracking-wide uppercase text-white leading-none">PBI Layout</h1>
            <p className="text-[10px] text-white/60 leading-tight mt-0.5">Power BI wireframe tool</p>
          </div>
        </div>
        <TooltipProvider>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-white/80 hover:text-white hover:bg-white/10"
                  onClick={layout.undo}
                  disabled={!layout.canUndo}
                  aria-label="Undo (⌘Z)"
                >
                  <Undo2Icon />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Undo <KbdGroup><Kbd>⌘</Kbd><Kbd>Z</Kbd></KbdGroup></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-white/80 hover:text-white hover:bg-white/10"
                  onClick={layout.redo}
                  disabled={!layout.canRedo}
                  aria-label="Redo (⌘⇧Z)"
                >
                  <Redo2Icon />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Redo <KbdGroup><Kbd>⌘</Kbd><Kbd>⇧</Kbd><Kbd>Z</Kbd></KbdGroup></TooltipContent>
            </Tooltip>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs ml-1 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                >
                  Reset
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset everything?</AlertDialogTitle>
                  <AlertDialogDescription>This will restore all settings and elements to their defaults.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction variant="destructive" onClick={layout.reset}>Reset</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <div className="w-px h-4 bg-white/20 mx-1" aria-hidden="true" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-white/80 hover:text-white hover:bg-white/10"
                  onClick={handleShare}
                  aria-label="Copy share link"
                >
                  {shareCopied ? <CheckIcon /> : <Share2Icon />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{shareCopied ? "Link copied!" : "Copy share link"}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-white/80 hover:text-white hover:bg-white/10"
                  onClick={handleExport}
                  aria-label="Export as PBIR"
                >
                  <DownloadIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Export as PBIR</TooltipContent>
            </Tooltip>

            <div className="w-px h-4 bg-white/20 mx-1" aria-hidden="true" />

            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setThemeKey((k) => (k === "light" ? "dark" : "light"))}
              aria-label={`Switch to ${themeKey === "light" ? "dark" : "light"} mode`}
              className="text-white/80 hover:text-white hover:bg-white/10"
            >
              {themeKey === "light" ? <MoonIcon /> : <SunIcon />}
            </Button>

            <HelpSheet />

            <a
              href="https://github.com/rossbowen"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub profile"
              className="flex items-center justify-center size-7 rounded-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.341-3.369-1.341-.454-1.154-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
            </a>
          </div>
        </TooltipProvider>
      </header>

      {/* Body */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <AppSidebar
          chrome={layout.chrome}
          colours={layout.colours}
          canvasSize={canvasSize}
          rowCount={layout.rowCount}
          elements={layout.elements}
          selectedId={layout.selectedId}
          onSelect={layout.selectElement}
          onHeader={layout.setHeader}
          onFooter={layout.setFooter}
          onSidebarCols={layout.setSidebarCols}
          onSidebarSide={layout.setSidebarSide}
          onRowCount={layout.setRowCount}
          onCanvasSize={handleCanvasSize}
          onColour={layout.setColour}
          onResetColours={layout.resetColours}
          onAdd={layout.addElement}
          onClearElements={layout.clearElements}
          onLoadPreset={layout.loadPreset}
          onUpdateElement={layout.updateElement}
          onRemoveElement={layout.removeElement}
          onDuplicateElement={layout.duplicateElement}
        />

        {/* Canvas + spec */}
        <SidebarInset
          ref={mainRef}
          className="flex-1 min-w-0 flex flex-col items-center justify-start gap-4 p-6 overflow-auto"
          style={{
            background:
              themeKey === "dark"
                ? "radial-gradient(ellipse at 60% 10%, oklch(0.22 0.06 240 / 0.6), transparent 60%), oklch(0.12 0.025 264)"
                : "radial-gradient(ellipse at 60% 10%, oklch(0.88 0.06 264 / 0.5), transparent 60%), oklch(0.96 0.008 250)",
          }}
          onClick={() => layout.selectElement(null)}
        >
          {/* Shared column: grid toggle + canvas + table all width=renderedW, ruler overflows right */}
          <div style={{ width: renderedW, overflow: "visible" }} onClick={(e) => e.stopPropagation()}>
            {/* Grid toggle + spec pills */}
            <div className="flex items-center justify-end gap-1.5 mb-1 flex-wrap">
              {showGrid &&
                [
                  ["edge", `edge ${sizeConfig.edgeGutter}px`] as const,
                  ["col", `cols 12 × ${sizeConfig.colWidth}px`] as const,
                  ["gap", `gap ${sizeConfig.colGutter}px`] as const,
                ].map(([zone, label]) => (
                  <Badge
                    key={zone}
                    variant={gridHighlight === zone ? "default" : "outline"}
                    onMouseEnter={() => setGridHighlight(zone)}
                    onMouseLeave={() => setGridHighlight(null)}
                    className="font-mono cursor-default select-none transition-colors"
                    style={
                      gridHighlight !== zone
                        ? {
                            borderColor: themeKey === "dark" ? "rgba(255,255,255,0.2)" : "rgba(30,40,80,0.25)",
                            color: themeKey === "dark" ? "rgba(255,255,255,0.7)" : "rgba(20,30,70,0.75)",
                            background: themeKey === "dark" ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.5)",
                          }
                        : undefined
                    }
                  >
                    {label}
                  </Badge>
                ))}
              <Button
                variant={showGrid ? "default" : "outline"}
                size="sm"
                onClick={() => setShowGrid((g) => !g)}
                aria-pressed={showGrid}
                className="text-xs gap-1.5"
              >
                <GridIcon data-icon="inline-start" />
                Grid
              </Button>
            </div>

            {/* Canvas with rulers */}
            {(() => {
              const sc = sizeConfig.scale * fitScale
              // Ruler colours
              const rulerFg = themeKey === "dark" ? "rgba(255,255,255,0.7)" : "rgba(20,30,70,0.7)"
              const rulerLine = themeKey === "dark" ? "rgba(255,255,255,0.25)" : "rgba(20,30,70,0.3)"

              return (
                <div
                  style={{
                    position: "relative",
                    zIndex: 1,
                    width: renderedW,
                    overflow: "visible",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Width ruler — thin line flush above canvas, label centred */}
                  <div
                    style={{
                      width: renderedW,
                      height: 20,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      marginBottom: 4,
                    }}
                  >
                    <div style={{ flex: 1, height: 1, background: rulerLine }} />
                    <span
                      style={{
                        fontSize: 10,
                        fontFamily: "monospace",
                        color: rulerFg,
                        lineHeight: 1,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {sizeConfig.w}px
                    </span>
                    <div style={{ flex: 1, height: 1, background: rulerLine }} />
                  </div>

                  {/* Canvas row */}
                  <div style={{ display: "flex", alignItems: "stretch", gap: 0 }}>
                    <div
                      style={{
                        width: renderedW,
                        height: renderedH,
                        flexShrink: 0,
                      }}
                    >
                      <Canvas
                        elements={layout.elements}
                        rowCount={layout.rowCount}
                        chrome={layout.chrome}
                        colours={layout.colours}
                        selectedId={layout.selectedId}
                        onSelect={layout.selectElement}
                        onRemove={layout.removeElement}
                        onDuplicate={layout.duplicateElement}
                        onUpdate={layout.updateElement}
                        showGrid={showGrid}
                        shadow={canvasShadow}
                        canvasW={sizeConfig.w}
                        canvasH={sizeConfig.h}
                        scale={sc}
                        grid={grid}
                        highlightZone={showGrid ? gridHighlight : null}
                        theme={themeKey}
                      />
                    </div>
                    {/* Height ruler — vertical line + label to the right */}
                    <div
                      style={{
                        width: 28,
                        flexShrink: 0,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        paddingLeft: 6,
                      }}
                    >
                      <div style={{ flex: 1, width: 1, background: rulerLine }} />
                      <span
                        style={{
                          fontSize: 10,
                          fontFamily: "monospace",
                          color: rulerFg,
                          lineHeight: 1,
                          writingMode: "vertical-rl",
                          transform: "rotate(180deg)",
                          margin: "5px 0",
                        }}
                      >
                        {sizeConfig.h}px
                      </span>
                      <div style={{ flex: 1, width: 1, background: rulerLine }} />
                    </div>
                  </div>
                </div>
              )
            })()}

            {layout.elements.length > 0 && (
              <div className="mt-6">
                <SpecTable
                  elements={layout.elements}
                  rowCount={layout.rowCount}
                  chrome={layout.chrome}
                  grid={grid}
                  selectedId={layout.selectedId}
                  onSelect={layout.selectElement}
                  onDuplicate={layout.duplicateElement}
                  onRemove={layout.removeElement}
                  theme={themeKey}
                />
              </div>
            )}

          </div>
          {/* end shared column */}
        </SidebarInset>
      </div>
    </div>
    </SidebarProvider>
  )
}
