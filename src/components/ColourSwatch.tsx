import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { RotateCcwIcon } from "lucide-react"

interface Props {
  label: string
  value: string
  defaultValue: string
  onChange: (hex: string) => void
}

export function ColourSwatch({ label, value, defaultValue, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const isModified = value.toLowerCase() !== defaultValue.toLowerCase()

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="ghost"
        className="group cursor-pointer flex items-center gap-2 flex-1 min-w-0 text-left h-auto px-0 py-0 justify-start rounded-none"
        aria-label={`Edit ${label} colour, current value ${value}`}
        onClick={() => inputRef.current?.click()}
      >
        {/* Swatch with pencil overlay on hover */}
        <div className="relative shrink-0">
          <div className="size-5 rounded border border-border" style={{ background: value }} />
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded"
            style={{ background: "rgba(0,0,0,0.35)" }}
          >
            <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden="true">
              <path d="M6 1.5l1.5 1.5-4.5 4.5H1.5V6L6 1.5z" stroke="#fff" strokeWidth="1" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
        <span className="text-xs flex-1 min-w-0 truncate text-foreground">{label}</span>
        <span className="text-xs font-mono uppercase text-muted-foreground bg-muted border border-border rounded px-1 py-px group-hover:opacity-70 transition-opacity">
          {value}
        </span>
      </Button>
      {/* Per-swatch reset — only shown when modified */}
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onClick={() => onChange(defaultValue)}
        title={`Reset to ${defaultValue}`}
        aria-label={`Reset ${label} to default`}
        className="shrink-0 text-muted-foreground hover:text-foreground transition-opacity"
        style={{ opacity: isModified ? 1 : 0, pointerEvents: isModified ? "auto" : "none" }}
      >
        <RotateCcwIcon className="size-3.5" />
      </Button>
      <input
        ref={inputRef}
        type="color"
        value={value}
        className="sr-only"
        onChange={(e) => onChange(e.target.value)}
        aria-hidden="true"
        tabIndex={-1}
      />
    </div>
  )
}
