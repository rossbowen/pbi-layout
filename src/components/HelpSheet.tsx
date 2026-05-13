import { HelpCircleIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[1.5rem] h-5 px-1 rounded text-[10px] font-mono font-medium bg-muted border border-border text-foreground leading-none">
      {children}
    </kbd>
  )
}

function ShortcutRow({ keys, label }: { keys: React.ReactNode[]; label: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1 shrink-0">
        {keys.map((k, i) => (
          <span key={i} className="flex items-center gap-0.5">
            {i > 0 && <span className="text-[10px] text-muted-foreground mx-0.5">/</span>}
            {k}
          </span>
        ))}
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-primary mb-2">{title}</p>
      {children}
    </div>
  )
}


export function HelpSheet() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-white/80 hover:text-white hover:bg-white/10"
          aria-label="Help and keyboard shortcuts"
        >
          <HelpCircleIcon />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80 sm:max-w-80 overflow-y-auto gap-0 p-0">
        <SheetHeader className="px-5 pt-5 pb-4">
          <SheetTitle>Help</SheetTitle>
        </SheetHeader>
        <Separator />

        {/* How it works */}
        <div className="px-5 pt-5">
          <Section title="How it works">
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
              The canvas is a 12-column grid. Everything you drop on it snaps to that grid, so the pixel values you see
              match what Power BI will use.
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
              You can turn the header, footer and sidebar on or off in settings. Use them for things like navigation,
              branding or slicers. The rest of the layout adjusts to fit.
            </p>
          </Section>

          <Section title="Spacing">
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
              If you’re using a sidebar for slicers, give it 17 to 20 pixels of internal padding so the controls don’t
              sit flush against the edge.
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
              The header and footer should use the same left and right padding as the canvas margins. This keeps
              everything lined up with the grid.
            </p>
          </Section>

          <Section title="When you’re ready to build">
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
              The spec table shows the exact X, Y, width and height for every element. Use these values when you place
              visuals in Power BI.
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
              You can also export the layout as a PBIR folder and open it in Power BI Desktop developer mode. Your
              placeholders will already be in the right place — swap them for real visuals.
            </p>
          </Section>

          <Separator className="mb-5" />

          <Section title="Keyboard shortcuts">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Global</p>
              <ShortcutRow
                keys={[
                  <>
                    <Kbd>⌘</Kbd>
                    <Kbd>Z</Kbd>
                  </>,
                ]}
                label="Undo"
              />
              <ShortcutRow
                keys={[
                  <>
                    <Kbd>⌘</Kbd>
                    <Kbd>⇧</Kbd>
                    <Kbd>Z</Kbd>
                  </>,
                  <>
                    <Kbd>⌘</Kbd>
                    <Kbd>Y</Kbd>
                  </>,
                ]}
                label="Redo"
              />
              <ShortcutRow keys={[<Kbd>Esc</Kbd>]} label="Deselect element" />
            </div>

            <div className="mt-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">
                Selected element
              </p>
              <ShortcutRow
                keys={[
                  <>
                    <Kbd>↑</Kbd>
                    <Kbd>↓</Kbd>
                    <Kbd>←</Kbd>
                    <Kbd>→</Kbd>
                  </>,
                ]}
                label="Move one cell"
              />
              <ShortcutRow
                keys={[
                  <>
                    <Kbd>⇧</Kbd>
                    <Kbd>↑</Kbd>
                  </>,
                  <>
                    <Kbd>⇧</Kbd>
                    <Kbd>↓</Kbd>
                  </>,
                ]}
                label="Expand / shrink row span"
              />
              <ShortcutRow
                keys={[
                  <>
                    <Kbd>⇧</Kbd>
                    <Kbd>←</Kbd>
                  </>,
                  <>
                    <Kbd>⇧</Kbd>
                    <Kbd>→</Kbd>
                  </>,
                ]}
                label="Expand / shrink col span"
              />
              <ShortcutRow
                keys={[
                  <>
                    <Kbd>⌘</Kbd>
                    <Kbd>↑</Kbd>
                    <Kbd>↓</Kbd>
                    <Kbd>←</Kbd>
                    <Kbd>→</Kbd>
                  </>,
                ]}
                label="Jump to adjacent element"
              />
              <ShortcutRow keys={[<Kbd>D</Kbd>]} label="Duplicate" />
              <ShortcutRow keys={[<Kbd>Del</Kbd>]} label="Delete" />
            </div>
          </Section>
        </div>
      </SheetContent>
    </Sheet>
  )
}
