# Task 124 Execution Plan -- Glyph Path Rendering (Vector Text)

## 1. Goal

Instead of Canvas 2D `fillText()`, **render font glyph outlines (Bezier curves) directly as Canvas Paths** to achieve vector text quality on par with Hancom and other commercial products/PDF.js.

## 2. Current Status Analysis

### Current Text Rendering Flow
```
HWP -> DocInfo.fonts -> ResolvedCharStyle -> TextStyle -> draw_text()
  -> ctx.set_font(CSS font string)
  -> compute_char_positions() / split_into_clusters()
  -> ctx.fillText(cluster_str, x, y)  <- Grayscale AA limitation
```

### Issues
- `fillText()` is dependent on the browser's text rasterizer
- Only supports grayscale antialiasing (no subpixel)
- Text appears softer compared to Hancom and other commercial products at zoom magnification (soft edges)

### Existing Assets
- `ttfs/hamchob-r.ttf` -- HamChoRom Batang (26.5MB)
- `ttfs/hamchod-r.ttf` -- HamChoRom Dotum (17.5MB)
- `TextStyle.font_family` -> font name mapping already exists
- `compute_char_positions()` -> character position calculation already exists

## 3. Core Principle

1. Extract glyph outlines (MoveTo/LineTo/CurveTo) from TTF files using the `ttf-parser` crate
2. Convert glyph outlines to Canvas 2D Path commands: `beginPath()` -> `moveTo/lineTo/bezierCurveTo` -> `fill()`
3. Scale conversion from font coordinate system (em units) -> document coordinate system (px)
4. Glyph path cache ensures repeated rendering performance

## 4. Implementation Scope

### Changed Files

| File | Changes |
|------|---------|
| `Cargo.toml` | Add `ttf-parser` crate |
| `src/renderer/glyph_cache.rs` (new) | Glyph path cache (per-font glyph ID -> Path command sequence) |
| `src/renderer/web_canvas.rs` | Modify `draw_text()`: fillText -> glyph path rendering |
| `src/wasm_api.rs` | Add `load_font()` WASM API |
| `web/editor.js` | Font loading (fetch TTF -> pass to WASM) |

### Unchanged Areas
- Render tree structure (TextRunNode preserved)
- Layout engine (compute_char_positions preserved)
- SVG renderer (native-only)
- Style resolver (used as-is)

## 5. Font Strategy

### Primary: Representative Korean Font Bundle
- HamChoRom Batang (`hamchob-r.ttf`) -- HWP default body font
- HamChoRom Dotum (`hamchod-r.ttf`) -- HWP default heading/UI font
- Fetch from web server -> pass to WASM -> parse with ttf-parser

### Fallback
- Fonts with glyph path rendering available -> path rendering
- Fonts not loaded -> existing `fillText()` fallback

## 6. Performance Considerations

| Item | Approach |
|------|----------|
| Glyph outline parsing | One-time initial, cache reuse |
| Korean glyph count (11,172 syllables) | Lazy cache (parse on use) |
| Path command count | 1 Korean character = ~100-300 path commands (more than basic shapes) |
| Memory | Cache size limit (LRU, etc.) |
| WASM font data | Loaded separately via fetch, no impact on WASM binary size |

## 7. Risks

- Glyph path rendering performance may be slower than fillText -> optimize after profiling
- Complex glyph handling (ligatures, combining characters) -> verify ttf-parser's glyph composition support
- No font hinting applied -> quality comparison needed at low resolution (100% zoom)
- HamChoRom TTF size (26.5MB) -> ~10-12MB with gzip compression, loading time consideration
