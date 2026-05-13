import { useState } from "react"
import type { CanvasSizeKey, ChromeConfig, ColourTokens, SidebarCols, SidebarSide, LayoutElement } from "../types"
import { CANVAS_SIZES, COLOUR_LABELS, DEFAULT_COLOURS } from "../constants"
import { ColourSwatch } from "./ColourSwatch"
import type { Preset } from "../presets"
import { PRESETS, ICON_LAYOUTS } from "../presets"
import { PresetIcon } from "./PresetIcon"
import { ElementList, ElementDetail } from "./ElementList"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { ChevronDownIcon, XIcon } from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

interface Props {
  chrome: ChromeConfig
  colours: ColourTokens
  canvasSize: CanvasSizeKey
  rowCount: number
  elements: LayoutElement[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  onHeader: (v: boolean) => void
  onFooter: (v: boolean) => void
  onSidebarCols: (v: SidebarCols) => void
  onSidebarSide: (v: SidebarSide) => void
  onRowCount: (n: number) => void
  onCanvasSize: (v: CanvasSizeKey) => void
  onColour: (key: keyof ColourTokens, value: string) => void
  onResetColours: () => void
  onAdd: () => void
  onClearElements: () => void
  onLoadPreset: (p: Preset) => void
  onUpdateElement: (el: LayoutElement) => void
  onRemoveElement: (id: string) => void
  onDuplicateElement: (id: string) => void
}

function Section({
  title,
  defaultOpen = false,
  children,
}: {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-sidebar-accent/40 transition-colors"
        >
          <span className="text-xs font-semibold uppercase tracking-widest text-sidebar-foreground/70">{title}</span>
          <ChevronDownIcon
            className={cn("size-3.5 text-sidebar-foreground/50 transition-transform", open && "rotate-180")}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-3 pb-4">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  )
}

const SIDEBAR_COL_OPTIONS: { label: string; value: string }[] = [
  { label: "Off", value: "0" },
  { label: "2-col", value: "2" },
  { label: "Wide", value: "3" },
]

export function AppSidebar({
  chrome,
  colours,
  canvasSize,
  rowCount,
  elements,
  selectedId,
  onSelect,
  onHeader,
  onFooter,
  onSidebarCols,
  onSidebarSide,
  onRowCount,
  onCanvasSize,
  onColour,
  onResetColours,
  onAdd,
  onClearElements,
  onLoadPreset,
  onUpdateElement,
  onRemoveElement,
  onDuplicateElement,
}: Props) {
  const selectedElement = elements.find((el) => el.id === selectedId) ?? null

  return (
    <Sidebar collapsible="offcanvas">
      {/* Scrollable controls */}
      <SidebarContent className="overflow-hidden">
        <ScrollArea className="flex-1 min-h-0">
          <div className="flex flex-col">
            <SidebarSeparator className="mx-0 w-full" />
            <Section title="Frame">
              <div className="flex flex-col gap-4">
                {/* Canvas size */}
                <div>
                  <p className="text-xs font-medium text-sidebar-foreground/60 mb-1.5">Canvas size</p>
                  <ToggleGroup
                    type="single"
                    orientation="vertical"
                    variant="outline"
                    size="sm"
                    value={canvasSize}
                    onValueChange={(v) => v && onCanvasSize(v as CanvasSizeKey)}
                    className="w-full"
                  >
                    {(Object.keys(CANVAS_SIZES) as CanvasSizeKey[]).map((key) => (
                      <ToggleGroupItem key={key} value={key} className="justify-start text-xs font-mono">
                        {CANVAS_SIZES[key].label}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>
                {/* Header / footer toggles */}
                <div className="flex flex-col gap-2 border border-sidebar-border rounded p-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="toggle-header" className="text-xs cursor-pointer">
                      Header
                    </Label>
                    <Switch id="toggle-header" checked={chrome.header} onCheckedChange={onHeader} size="sm" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="toggle-footer" className="text-xs cursor-pointer">
                      Footer
                    </Label>
                    <Switch id="toggle-footer" checked={chrome.footer} onCheckedChange={onFooter} size="sm" />
                  </div>
                </div>
                {/* Sidebar width */}
                <div>
                  <p className="text-xs font-medium text-sidebar-foreground/60 mb-1.5">Sidebar</p>
                  <ToggleGroup
                    type="single"
                    value={String(chrome.sidebarCols)}
                    onValueChange={(v) => onSidebarCols((v ? Number(v) : 0) as SidebarCols)}
                    className="w-full"
                  >
                    {SIDEBAR_COL_OPTIONS.map((opt) => (
                      <ToggleGroupItem key={opt.value} value={opt.value} variant="outline" size="sm" className="flex-1 text-xs">
                        {opt.label}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                  {chrome.sidebarCols > 0 && (
                    <ToggleGroup
                      type="single"
                      value={chrome.sidebarSide}
                      onValueChange={(v) => v && onSidebarSide(v as SidebarSide)}
                      className="w-full mt-1"
                    >
                      {(["left", "right"] as const).map((side) => (
                        <ToggleGroupItem key={side} value={side} variant="outline" size="sm" className="flex-1 text-xs capitalize">
                          {side}
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                  )}
                </div>
                {/* Row count */}
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <p className="text-xs font-medium text-sidebar-foreground/60">Rows</p>
                    <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 h-4">
                      {rowCount}
                    </Badge>
                  </div>
                  <ToggleGroup
                    type="single"
                    value={String(rowCount)}
                    onValueChange={(v) => v && onRowCount(Number(v))}
                    className="w-full"
                  >
                    {[1, 2, 3, 4].map((n) => (
                      <ToggleGroupItem key={n} value={String(n)} variant="outline" size="sm" className="flex-1 text-xs">
                        {n}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>
              </div>
            </Section>

            <SidebarSeparator className="mx-0 w-full" />
            <Section title="Brand colours">
              <div className="flex flex-col gap-3">
                {(Object.keys(COLOUR_LABELS) as (keyof ColourTokens)[]).map((key) => (
                  <ColourSwatch
                    key={key}
                    label={COLOUR_LABELS[key]}
                    value={colours[key]}
                    defaultValue={DEFAULT_COLOURS[key]}
                    onChange={(v) => onColour(key, v)}
                  />
                ))}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="text-xs w-full mt-1">
                      Reset colours
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reset colours?</AlertDialogTitle>
                      <AlertDialogDescription>This will restore all brand colours to their defaults.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction variant="destructive" onClick={onResetColours}>Reset</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </Section>

            <SidebarSeparator className="mx-0 w-full" />
            <Section title="Layout presets" defaultOpen>
              <div className="grid grid-cols-3 gap-1.5">
                {PRESETS.map((p) => (
                  <Button
                    key={p.id}
                    variant="outline"
                    onClick={() => onLoadPreset(p)}
                    title={p.name}
                    aria-label={`Load preset: ${p.name}`}
                    className="flex flex-col items-center gap-1.5 p-2 h-auto w-full hover:bg-sidebar-accent hover:border-sidebar-ring/40 hover:text-sidebar-accent-foreground"
                  >
                    <PresetIcon layout={ICON_LAYOUTS[p.id]} fill="transparent" stroke="currentColor" accent="currentColor" />
                    <span className="text-[9px] leading-none truncate w-full text-center text-sidebar-foreground/50">{p.name}</span>
                  </Button>
                ))}
              </div>
            </Section>

            <SidebarSeparator className="mx-0 w-full" />
            {/* Elements list */}
            <div>
              <div className="flex items-center justify-between px-3 py-2.5">
                <span className="text-xs font-semibold uppercase tracking-widest text-sidebar-foreground/70">Elements</span>
                <div className="flex gap-1">
                  <Button onClick={onAdd} variant="outline" size="sm" className="text-xs h-6 px-2">
                    + Add
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" className="text-xs h-6 px-2">
                        Clear
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove all elements?</AlertDialogTitle>
                        <AlertDialogDescription>This will delete all elements from the layout.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction variant="destructive" onClick={onClearElements}>Clear</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              <div className="border-t border-sidebar-border">
                <ElementList elements={elements} selectedId={selectedId} onSelect={onSelect} />
              </div>
            </div>
          </div>
        </ScrollArea>
      </SidebarContent>

      {/* Fixed element detail panel — shown when an element is selected */}
      {selectedElement && (
        <SidebarFooter className="p-0 border-t border-sidebar-border">
          <div className="flex flex-col" style={{ maxHeight: "55vh" }}>
            <div className="flex items-center justify-between px-3 py-2 shrink-0">
              <span className="text-xs font-semibold uppercase tracking-widest text-sidebar-foreground/70 truncate pr-2">
                {selectedElement.label}
              </span>
              <button
                type="button"
                onClick={() => onSelect(null)}
                aria-label="Close element controls"
                className="text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors shrink-0"
              >
                <XIcon className="size-3.5" />
              </button>
            </div>
            <SidebarSeparator className="mx-0 w-full" />
            <ScrollArea className="flex-1 min-h-0">
              <ElementDetail
                element={selectedElement}
                rowCount={rowCount}
                chrome={chrome}
                onUpdate={onUpdateElement}
                onRemove={() => onRemoveElement(selectedElement.id)}
                onDuplicate={() => onDuplicateElement(selectedElement.id)}
                onRowCount={onRowCount}
              />
            </ScrollArea>
          </div>
        </SidebarFooter>
      )}

      <SidebarRail />
    </Sidebar>
  )
}
