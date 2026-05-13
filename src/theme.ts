export type Theme = "light" | "dark"

export interface UITheme {
  // App shell
  appBg: string
  canvasShadow: string
  panelBg: string
  panelBorder: string
  // Text
  textPrimary: string
  textSecondary: string
  textMuted: string
  // Interactive
  buttonBg: string
  buttonHoverBg: string
  buttonText: string
  activeButtonBg: string
  activeButtonText: string
  // Canvas surround
  canvasBg: string
  // Table / list
  rowHoverBg: string
  rowSelectedBg: string
  rowAltBg: string
  inputBg: string
  inputBorder: string
}

export const LIGHT: UITheme = {
  appBg: "#f0f0ef",
  canvasShadow: "0 4px 24px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)",
  panelBg: "#ffffff",
  panelBorder: "#e2e2e0",
  textPrimary: "#1a1a1a",
  textSecondary: "#333",
  textMuted: "#616161",
  buttonBg: "#e8e8e6",
  buttonHoverBg: "#d8d8d6",
  buttonText: "#1a1a1a",
  activeButtonBg: "#1a1a1a",
  activeButtonText: "#ffffff",
  canvasBg: "#e4e4e2",
  rowHoverBg: "#f4f4f2",
  rowSelectedBg: "#ebebea",
  rowAltBg: "#f7f7f6",
  inputBg: "#f4f4f2",
  inputBorder: "#d8d8d6",
}

export const DARK: UITheme = {
  appBg: "#1c1c1e",
  canvasShadow: "0 0 0 1px rgba(255,255,255,0.08), 0 0 30px rgba(255,255,255,0.06)",
  panelBg: "#242426",
  panelBorder: "#333335",
  textPrimary: "#f0f0ee",
  textSecondary: "#c8c8c6",
  textMuted: "#a0a09e",
  buttonBg: "#323234",
  buttonHoverBg: "#3e3e40",
  buttonText: "#e0e0de",
  activeButtonBg: "#e0e0de",
  activeButtonText: "#1c1c1e",
  canvasBg: "#161618",
  rowHoverBg: "#2a2a2c",
  rowSelectedBg: "#323234",
  rowAltBg: "#2e2e30",
  inputBg: "#2a2a2c",
  inputBorder: "#3a3a3c",
}

export function getTheme(t: Theme): UITheme {
  return t === "light" ? LIGHT : DARK
}
