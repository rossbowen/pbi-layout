import { render } from "@testing-library/react"
import { configureAxe } from "jest-axe"
import { describe, it, expect } from "vitest"

const axeWithOptions = configureAxe({
  rules: {
    // Colour contrast can't be accurately tested in jsdom (no CSS cascade)
    "color-contrast": { enabled: false },
  },
})

import { Canvas } from "./Canvas"
import { SpecTable } from "./SpecTable"
import { Sidebar } from "./Sidebar"
import { ElementList } from "./ElementList"
import { LIGHT, DARK } from "../theme"
import { DEFAULT_CHROME, DEFAULT_COLOURS } from "../constants"
import type { LayoutElement } from "../types"

// ─── Fixtures ────────────────────────────────────────────────────────────────

const chrome = DEFAULT_CHROME
const colours = DEFAULT_COLOURS

const elements: LayoutElement[] = [
  { id: "a", label: "Chart 1", row: 1, colStart: 3, colSpan: 5 },
  { id: "b", label: "Chart 2", row: 1, colStart: 8, colSpan: 5 },
  { id: "c", label: "Detail", row: 2, colStart: 3, colSpan: 10 },
]

const noop = () => {}

// ─── Canvas ──────────────────────────────────────────────────────────────────

describe("Canvas accessibility", () => {
  it("has no axe violations (light, no selection)", async () => {
    const { container } = render(
      <Canvas
        elements={elements}
        rowCount={2}
        chrome={chrome}
        colours={colours}
        selectedId={null}
        onSelect={noop}
        onRemove={noop}
        showGrid={true}
        shadow=""
        canvasW={1280}
        canvasH={720}
        scale={0.5}
        baseScale={0.5}
      />,
    )
    expect(await axeWithOptions(container)).toHaveNoViolations()
  })

  it("has no axe violations (dark, with selection)", async () => {
    const { container } = render(
      <Canvas
        elements={elements}
        rowCount={2}
        chrome={chrome}
        colours={colours}
        selectedId="a"
        onSelect={noop}
        onRemove={noop}
        showGrid={false}
        shadow=""
        canvasW={1280}
        canvasH={720}
        scale={0.5}
        baseScale={0.5}
      />,
    )
    expect(await axeWithOptions(container)).toHaveNoViolations()
  })

  it("has no axe violations with no elements", async () => {
    const { container } = render(
      <Canvas
        elements={[]}
        rowCount={1}
        chrome={{ header: false, footer: false, sidebarCols: 0, sidebarSide: "left" }}
        colours={colours}
        selectedId={null}
        onSelect={noop}
        onRemove={noop}
        showGrid={false}
        shadow=""
        canvasW={1280}
        canvasH={720}
        scale={0.5}
        baseScale={0.5}
      />,
    )
    expect(await axeWithOptions(container)).toHaveNoViolations()
  })
})

// ─── SpecTable ───────────────────────────────────────────────────────────────

describe("SpecTable accessibility", () => {
  it("has no axe violations (light theme)", async () => {
    const { container } = render(
      <SpecTable
        elements={elements}
        rowCount={2}
        chrome={chrome}
        selectedId={null}
        onSelect={noop}
        onRemove={noop}
        theme={LIGHT}
      />,
    )
    expect(await axeWithOptions(container)).toHaveNoViolations()
  })

  it("has no axe violations (dark theme)", async () => {
    const { container } = render(
      <SpecTable
        elements={elements}
        rowCount={2}
        chrome={chrome}
        selectedId="b"
        onSelect={noop}
        onRemove={noop}
        theme={DARK}
      />,
    )
    expect(await axeWithOptions(container)).toHaveNoViolations()
  })
})

// ─── Sidebar ─────────────────────────────────────────────────────────────────

describe("Sidebar accessibility", () => {
  it("has no axe violations (light, no selection)", async () => {
    const { container } = render(
      <Sidebar
        chrome={chrome}
        colours={colours}
        rowCount={2}
        theme={LIGHT}
        elements={elements}
        selectedId={null}
        onSelect={noop}
        onHeader={noop}
        onFooter={noop}
        onSidebarCols={noop}
        onSidebarSide={noop}
        onRowCount={noop}
        onColour={noop}
        onAdd={noop}
        onClearElements={noop}
        onLoadPreset={noop}
        onUpdateElement={noop}
        onRemoveElement={noop}
      />,
    )
    expect(await axeWithOptions(container)).toHaveNoViolations()
  })

  it("has no axe violations (dark, with selection)", async () => {
    const { container } = render(
      <Sidebar
        chrome={chrome}
        colours={colours}
        rowCount={2}
        theme={DARK}
        elements={elements}
        selectedId={elements[0].id}
        onSelect={noop}
        onHeader={noop}
        onFooter={noop}
        onSidebarCols={noop}
        onSidebarSide={noop}
        onRowCount={noop}
        onColour={noop}
        onAdd={noop}
        onClearElements={noop}
        onLoadPreset={noop}
        onUpdateElement={noop}
        onRemoveElement={noop}
      />,
    )
    expect(await axeWithOptions(container)).toHaveNoViolations()
  })
})

// ─── ElementList ─────────────────────────────────────────────────────────────

describe("ElementList accessibility", () => {
  it("has no axe violations (light, none selected)", async () => {
    const { container } = render(
      <ElementList
        elements={elements}
        rowCount={2}
        chrome={chrome}
        theme={LIGHT}
        selectedId={null}
        onSelect={noop}
        onUpdate={noop}
        onRemove={noop}
        onRowCount={noop}
      />,
    )
    expect(await axeWithOptions(container)).toHaveNoViolations()
  })

  it("has no axe violations (dark, with selection expanded)", async () => {
    const { container } = render(
      <ElementList
        elements={elements}
        rowCount={2}
        chrome={chrome}
        theme={DARK}
        selectedId={elements[0].id}
        onSelect={noop}
        onUpdate={noop}
        onRemove={noop}
        onRowCount={noop}
      />,
    )
    expect(await axeWithOptions(container)).toHaveNoViolations()
  })
})
