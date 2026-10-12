import "@testing-library/jest-dom"
import { toHaveNoViolations } from "jest-axe"

// Extend vitest expect with jest-axe matchers
expect.extend(toHaveNoViolations)

// jsdom has no matchMedia or ResizeObserver; the sidebar primitives need both
window.matchMedia ??= ((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener: () => {},
  removeEventListener: () => {},
  addListener: () => {},
  removeListener: () => {},
  dispatchEvent: () => false,
})) as typeof window.matchMedia
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
}
// jsdom has no pointer capture; resize handles use it
Element.prototype.setPointerCapture ??= () => {}
Element.prototype.releasePointerCapture ??= () => {}
