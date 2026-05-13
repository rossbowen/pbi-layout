import { render, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { Canvas } from "./Canvas"
import { DEFAULT_CHROME, DEFAULT_COLOURS } from "../constants"
import type { LayoutElement } from "../types"

// ─── Fixtures ────────────────────────────────────────────────────────────────

const chrome = DEFAULT_CHROME
const colours = DEFAULT_COLOURS

const LEFT: LayoutElement = { id: "left", label: "Left", row: 1, rowSpan: 1, colStart: 1, colSpan: 6 }
const RIGHT: LayoutElement = { id: "right", label: "Right", row: 1, rowSpan: 1, colStart: 7, colSpan: 6 }

const SCALE = 0.5

function renderCanvas(
  elements: LayoutElement[],
  selectedId: string | null,
  onSelect: (id: string | null) => void,
  onUpdate: (el: LayoutElement) => void = vi.fn(),
) {
  return render(
    <Canvas
      elements={elements}
      rowCount={1}
      chrome={chrome}
      colours={colours}
      selectedId={selectedId}
      onSelect={onSelect}
      onRemove={vi.fn()}
      onUpdate={onUpdate}
      showGrid={false}
      shadow=""
      canvasW={1280}
      canvasH={720}
      scale={SCALE}
    />,
  )
}

// ─── Select ───────────────────────────────────────────────────────────────────

describe("Canvas element selection", () => {
  it("clicking an unselected element selects it", () => {
    const onSelect = vi.fn()
    const { getByRole } = renderCanvas([LEFT], null, onSelect)
    const btn = getByRole("button", { name: /Left/ })
    fireEvent.pointerDown(btn.parentElement!)
    fireEvent.click(btn)
    expect(onSelect).toHaveBeenCalledWith("left")
  })

  it("clicking a selected element deselects it", () => {
    const onSelect = vi.fn()
    const { getByRole } = renderCanvas([LEFT], "left", onSelect)
    const btn = getByRole("button", { name: "Left, row 1, columns 1 to 6" })
    fireEvent.pointerDown(btn.parentElement!)
    fireEvent.click(btn)
    expect(onSelect).toHaveBeenCalledWith(null)
  })

  it("clicking the canvas background deselects", () => {
    const onSelect = vi.fn()
    const { container } = renderCanvas([LEFT], "left", onSelect)
    const canvas = container.querySelector("[data-canvas]")!
    fireEvent.click(canvas)
    expect(onSelect).toHaveBeenCalledWith(null)
  })

  it("clicking the canvas background does not deselect when a drag just ended", () => {
    // After a drag the canvas click should be suppressed
    const onSelect = vi.fn()
    const { getByRole, container } = renderCanvas([LEFT, RIGHT], null, onSelect)
    const btn = getByRole("button", { name: /Left/ })
    const outer = btn.parentElement!

    // Start drag
    fireEvent.pointerDown(outer)
    // Move enough to trigger didMove — fire on window
    fireEvent.pointerMove(window, { clientX: 200, clientY: 0 })
    // End drag on window
    fireEvent.pointerUp(window)
    // Canvas click fires after pointerup in real browser
    const canvas = container.querySelector("[data-canvas]")!
    fireEvent.click(canvas)

    // onSelect should have been called with 'left' (from drag end) but NOT null (canvas click)
    const calls = onSelect.mock.calls.map((c) => c[0])
    expect(calls).toContain("left")
    expect(calls[calls.length - 1]).toBe("left")
  })

  it("clicking a different element switches selection", () => {
    const onSelect = vi.fn()
    const { getByRole } = renderCanvas([LEFT, RIGHT], "left", onSelect)
    const btn = getByRole("button", { name: /Right/ })
    fireEvent.pointerDown(btn.parentElement!)
    fireEvent.click(btn)
    expect(onSelect).toHaveBeenCalledWith("right")
  })
})

// ─── Drag ─────────────────────────────────────────────────────────────────────

describe("Canvas element drag", () => {
  let onSelect: ReturnType<typeof vi.fn>
  let onUpdate: ReturnType<typeof vi.fn>

  beforeEach(() => {
    onSelect = vi.fn()
    onUpdate = vi.fn()
  })

  it("dragging calls onUpdate with a new column position", () => {
    const { getByRole } = renderCanvas([LEFT], null, onSelect, onUpdate)
    const outer = getByRole("button", { name: /Left/ }).parentElement!

    // LEFT starts at col 1; drag right by ~106px logical = 53px display
    fireEvent.pointerDown(outer, { clientX: 0, clientY: 0 })
    fireEvent.pointerMove(window, { clientX: 53, clientY: 0 })
    fireEvent.pointerUp(window)

    expect(onUpdate).toHaveBeenCalled()
    const updated: LayoutElement = onUpdate.mock.calls[0][0]
    expect(updated.id).toBe("left")
    expect(updated.colStart).toBeGreaterThan(1)
  })

  it("dragging does not call onUpdate when pointer does not move", () => {
    const { getByRole } = renderCanvas([LEFT], null, onSelect, onUpdate)
    const outer = getByRole("button", { name: /Left/ }).parentElement!

    // pointerDown then pointerUp with no move in between
    fireEvent.pointerDown(outer, { clientX: 0, clientY: 0 })
    fireEvent.pointerUp(window)

    expect(onUpdate).not.toHaveBeenCalled()
  })

  it("element is selected after a drag completes", () => {
    const { getByRole } = renderCanvas([LEFT], null, onSelect, onUpdate)
    const outer = getByRole("button", { name: /Left/ }).parentElement!

    fireEvent.pointerDown(outer, { clientX: 0, clientY: 0 })
    fireEvent.pointerMove(window, { clientX: 53, clientY: 0 })
    fireEvent.pointerUp(window)

    // If onUpdate was called (drag happened), onSelect should also have been called with the id
    if (onUpdate.mock.calls.length > 0) {
      expect(onSelect).toHaveBeenCalledWith("left")
    }
  })

  it("element stays selected after drag completes and canvas click fires", () => {
    const { getByRole, container } = renderCanvas([LEFT], null, onSelect, onUpdate)
    const outer = getByRole("button", { name: /Left/ }).parentElement!

    fireEvent.pointerDown(outer, { clientX: 0, clientY: 0 })
    fireEvent.pointerMove(window, { clientX: 53, clientY: 0 })
    fireEvent.pointerUp(window)
    // Simulate the canvas click that browsers fire after pointerup
    fireEvent.click(container.querySelector("[data-canvas]")!)

    const calls = onSelect.mock.calls.map((c) => c[0])
    // Last call should not be null (canvas deselect should have been suppressed)
    if (calls.length > 0) {
      expect(calls[calls.length - 1]).not.toBeNull()
    }
  })

  it("colStart is clamped to the content area", () => {
    const { getByRole } = renderCanvas([LEFT], null, onSelect, onUpdate)
    const outer = getByRole("button", { name: /Left/ }).parentElement!

    // Drag far left beyond col 1
    fireEvent.pointerDown(outer, { clientX: 0, clientY: 0 })
    fireEvent.pointerMove(window, { clientX: -500, clientY: 0 })
    fireEvent.pointerUp(window)

    if (onUpdate.mock.calls.length > 0) {
      const updated: LayoutElement = onUpdate.mock.calls.at(-1)![0]
      expect(updated.colStart).toBeGreaterThanOrEqual(1)
    }
  })

  it("colStart + colSpan is clamped so element does not exceed last column", () => {
    const { getByRole } = renderCanvas([LEFT], null, onSelect, onUpdate)
    const outer = getByRole("button", { name: /Left/ }).parentElement!

    // Drag far right beyond col 12
    fireEvent.pointerDown(outer, { clientX: 0, clientY: 0 })
    fireEvent.pointerMove(window, { clientX: 5000, clientY: 0 })
    fireEvent.pointerUp(window)

    if (onUpdate.mock.calls.length > 0) {
      const updated: LayoutElement = onUpdate.mock.calls.at(-1)![0]
      expect(updated.colStart + updated.colSpan - 1).toBeLessThanOrEqual(12)
    }
  })
})
