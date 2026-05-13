/**
 * URL-based layout sharing.
 *
 * Encodes the full layout state (elements, chrome, colours, rowCount, canvasSize)
 * as a compact base64url query parameter.
 *
 * Strategy: JSON → UTF-8 bytes → compress with DeflateRaw → base64url.
 * Falls back to plain base64url JSON if CompressionStream is unavailable.
 *
 * A typical 6-element layout compresses to ~250 characters.
 */

import type { CanvasSizeKey, ChromeConfig, ColourTokens, LayoutElement } from "./types"

export interface ShareableState {
  elements: LayoutElement[]
  rowCount: number
  chrome: ChromeConfig
  colours: ColourTokens
  canvasSize: CanvasSizeKey
}

const PARAM = "layout"

// ─── Encoding ────────────────────────────────────────────────────────────────

async function compress(data: string): Promise<string> {
  const bytes = new TextEncoder().encode(data)
  if (typeof CompressionStream !== "undefined") {
    const cs = new CompressionStream("deflate-raw")
    const writer = cs.writable.getWriter()
    writer.write(bytes as unknown as Uint8Array<ArrayBuffer>)
    writer.close()
    const chunks: Uint8Array[] = []
    const reader = cs.readable.getReader()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
    }
    const compressed = new Uint8Array(chunks.reduce((acc, c) => acc + c.length, 0))
    let offset = 0
    for (const c of chunks) {
      compressed.set(c, offset)
      offset += c.length
    }
    return toBase64Url(compressed)
  }
  // Fallback: just base64url the raw JSON
  return toBase64Url(bytes)
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = ""
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

export async function encodeLayout(state: ShareableState): Promise<string> {
  const json = JSON.stringify(state)
  return compress(json)
}

export async function buildShareUrl(state: ShareableState): Promise<string> {
  const encoded = await encodeLayout(state)
  const url = new URL(window.location.href)
  url.search = ""
  url.hash = ""
  url.searchParams.set(PARAM, encoded)
  return url.toString()
}

// ─── Decoding ────────────────────────────────────────────────────────────────

function fromBase64Url(b64: string): Uint8Array {
  const padded = b64.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(b64.length / 4) * 4, "=")
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

async function decompress(b64: string): Promise<string> {
  const bytes = fromBase64Url(b64)
  if (typeof DecompressionStream !== "undefined") {
    try {
      const ds = new DecompressionStream("deflate-raw")
      const writer = ds.writable.getWriter()
      writer.write(bytes as unknown as Uint8Array<ArrayBuffer>)
      writer.close()
      const chunks: Uint8Array[] = []
      const reader = ds.readable.getReader()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        chunks.push(value)
      }
      const out = new Uint8Array(chunks.reduce((acc, c) => acc + c.length, 0))
      let offset = 0
      for (const c of chunks) {
        out.set(c, offset)
        offset += c.length
      }
      return new TextDecoder().decode(out)
    } catch {
      // Fall through to plain decode
    }
  }
  // Fallback: treat as plain JSON bytes
  return new TextDecoder().decode(bytes)
}

export async function decodeLayout(b64: string): Promise<ShareableState | null> {
  try {
    const json = await decompress(b64)
    return JSON.parse(json) as ShareableState
  } catch {
    return null
  }
}

export function readLayoutParam(): string | null {
  try {
    return new URLSearchParams(window.location.search).get(PARAM)
  } catch {
    return null
  }
}

export function clearLayoutParam(): void {
  try {
    const url = new URL(window.location.href)
    url.searchParams.delete(PARAM)
    window.history.replaceState(null, "", url.toString())
  } catch {
    /* ignore */
  }
}
