# Commercial Products' Canvas Rendering Analysis and DPR Scaling Strategy

Written: 2026-02-21

## 1. Background

After attempting Task 124 (glyph path rendering), we concluded that converting glyph outlines to Canvas Path2D in WASM cannot match the rendering quality of Hancom's web editor (WebGian). This document analyzes how some commercial products actually implement Canvas rendering to inform our product strategy.

## 2. Commercial Product Rendering Approaches Compared

### 2.1 Three Approaches

| Approach | Product | Text Rendering | DPR Handling | WASM Size |
|----------|------|-------------|----------|-----------|
| WASM Bitmap | A commercial web office | WASM internal FreeType | Pass DPR scaling to WASM | 19MB |
| Server JSON + fillText | Hancom WebGian | Canvas fillText | ctx.scale(DPR) | Server-dependent |
| fillText + DPR | Google Docs | Canvas fillText | ctx.scale(DPR) | - |

### 2.2 WASM Bitmap Approach (a commercial web office)

**Architecture**: C++ Emscripten WASM (19MB) -> RGBA bitmap -> putImageData

**Core Code Flow**:
```javascript
// 1. DPR detection
devicePixelRatio = window.devicePixelRatio;
dpi = Math.floor(96 * devicePixelRatio);

// 2. Canvas size setup
canvas.width = logicalWidth * DPR;      // Physical pixels
canvas.height = logicalHeight * DPR;
canvas.style.width = logicalWidth + "px";   // CSS logical pixels
canvas.style.height = logicalHeight + "px";

// 3. WASM initialization (includes DPR scaling)
IR2.initScreen(width * DPR, height * DPR, dpi, locale);

// 4. Rendering: WASM -> RGBA bitmap -> Canvas
ptr = IR2.getScreenBuffer();
rgbaData = new Uint8ClampedArray(IR2.HEAPU8.buffer, ptr, w * h * 4);
imageData = new ImageData(rgbaData, w, h);
context2d.putImageData(imageData, 0, 0);

// 5. Mouse coordinates: screen -> WASM (DPR multiplication)
IR2.hidAction(ACTION_DOWN, x * DPR, y * DPR, ...);
```

**Characteristics**:
- No Canvas drawing APIs like `fillText` are used on the JS side at all
- All rendering (text, shapes, images) is handled inside WASM
- FreeType/HarfBuzz are embedded inside WASM, resulting in 19MB size
- High quality but impractical WASM size

**Why this is not applicable to us**: WASM size 19MB vs. our 1.4MB. Embedding FreeType/HarfBuzz would drastically increase size.

### 2.3 Hancom WebGian (Server JSON + Canvas fillText)

**Architecture**: HWP -> Server "HWP Filter" -> JSON rendering commands (LZ-String compressed) -> Client Canvas 2D

#### 2.3.1 DPR Handling

```javascript
// DPR variable
this.Bs3 = window.devicePixelRatio || 1;

// Main canvas size setup
canvas.width = Math.floor(logicalWidth * this.Bs3);     // Physical pixels
canvas.height = Math.floor(logicalHeight * this.Bs3);
canvas.style.width = logicalWidth + "px";                 // CSS logical pixels
canvas.style.height = logicalHeight + "px";

// Apply ctx.scale before rendering
ctx.save();
ctx.scale(this.Bs3, this.Bs3);     // All subsequent coordinates are in logical units
ctx.clearRect(0, 0, logicalWidth, logicalHeight);
ctx.restore();

// Overlay canvas uses the same approach
overlayCanvas.width = Math.floor(logicalWidth * this.Bs3);
overlayCanvas.height = Math.floor(logicalHeight * this.Bs3);
overlayCtx.scale(this.Bs3, this.Bs3);

// Offscreen tile canvases also apply DPR
tileCanvas = new Canvas(Math.floor(tileW * this.Bs3), Math.floor(tileH * this.Bs3));
tileCtx.scale(this.Bs3, this.Bs3);
```

#### 2.3.2 Rendering Command Dispatch

The first element of the JSON array sent by the server is the command type:

| Type Code | Constant | Purpose | Canvas Function |
|-----------|------|------|-------------|
| 0 | tft | Text | Q13 -> J13 (fillText) |
| 1 | ift | Image background | Zn3 (createPattern) |
| 2 | eft | Fill | Zn3 (fillRect/gradient) |
| 3 | nft | Border | an3 (lineTo/stroke) |
| 11-16 | rft~aft | Line | qNt, zNt (moveTo/lineTo) |
| 21-25 | fft~wft | Shape | ns3+Zn3+lOt (path/fill/stroke) |
| 26 | dft | Image | Wn3 (drawImage) |
| 27 | bft | Group object | es3 (clip+recursive) |
| 31-32 | Cft/vft | Clipping | save/clip/restore |
| 33-34 | _ft/yft | Offscreen | Temporary canvas -> drawImage |
| 130 | Fft | Caret/cursor | Kr3 |

#### 2.3.3 Text Rendering (Core Function J13)

**Per-character fillText call** -- each character has its position/font/horizontal scaling individually set:

```javascript
J13: function(ctx, x, y, textCmd, zoom) {
  var fonts = textCmd.fonts;       // Character array
  var lineHeight = textCmd.height * zoom;

  // Text color
  ctx.fillStyle = textCmd.color;   // "#rrggbb" (CREF conversion)

  for (var i = 0; i < fonts.length; i++) {
    var char = fonts[i].char;
    if (char == " ") continue;

    var fontSize = fonts[i].fontSize * zoom;  // Font size
    var hScale = fonts[i].hScale;             // Horizontal scaling (0.5~2.0)
    var dx = fonts[i].dx * zoom;              // Character spacing
    var dt = fonts[i].dt * zoom;              // Start offset
    var vPos = fonts[i].position * zoom;      // Vertical position

    // CSS font string composition
    var fontStr = fontStyle + " " + fontSize + "px " + fontFamily;
    // fontFamily = "'HCR Batang','fallback1','fallback2'"

    ctx.save();
    ctx.scale(hScale, 1);                     // Apply horizontal scaling
    ctx.translate(-(charX - charX / hScale), 0);

    if (ctx.font != fontStr) ctx.font = fontStr;
    ctx.textBaseline = "alphabetic";

    ctx.fillText(char, charX, charY);         // Render single character
    ctx.restore();

    // Underline/strikethrough text decoration
    if (textCmd.decoration) {
      drawDecoration(ctx, charX, charY, ...);
    }
  }
}
```

**Canvas properties set before text rendering**:
- `ctx.font` = `"[bold] [italic] <size>px '<fontFamily>','fallback1','fallback2'"`
- `ctx.fillStyle` = `"#rrggbb"` (CREF color)
- `ctx.textBaseline` = `"alphabetic"` | `"bottom"` | `"hanging"` | `"middle"`
- `ctx.scale(hScale, 1)` -- applies horizontal scaling (width ratio)
- `ctx.globalCompositeOperation` = `"destination-out"` (eraser mode)

**Text transform support**:
- Normal text: single `fillText` call
- Outline text: `fillText` + `strokeText` combination
- 3D emboss: 3-pass (light color -> dark color -> base color) offset
- 3D engrave: 3-pass (dark color -> light color -> base color) offset
- Shadow: separate shadow pass followed by main text

#### 2.3.4 Font Handling

**Font family mapping** (XTt function):
```javascript
// Korean font alias table
qTt: {
  "HY HeadLine M": "'HYHeadLine M','HYHeadline medium','HYHeadline'",
  "HY GungSo B": "'HYGungSo B','HYGungSo black','HYGungSo'",
  // ... many more
}

// Font family string generation
XTt: function(fontName, isSpecial, isSymbol) {
  var alias = qTt[fontName.toUpperCase()];
  return alias
    ? "'" + fontName + "'," + alias + "," + fallbacks
    : "'" + fontName + "'," + fallbacks;
}
```

**Dynamic web font loading** (FontFace API, Chrome only):
```javascript
fontRegistry = {
  "HY HeadLine M":  { url: baseUrl + "/hygtre.woff2" },
  "HY GungGoDic":   { url: baseUrl + "/hygtre.woff2" },
  "SpoqaHanSans":   { url: baseUrl + "/SpoqaHanSans-Regular.woff2" }
};

// Lazy loading
new FontFace(fontName, "url(" + fontUrl + ")")
  .load()
  .then(function() { triggerRerender(); });
```

**Font metrics (embedded .hft files)**:
- Glyph width tables embedded as JS modules
- Width arrays by code point range (emsize 1000 or 1024 basis)
- Used for layout calculations (server-side)

**Font size measurement**:
```javascript
// Hidden span method
span.style.fontFamily = fontFamily;
span.style.fontSize = "400pt";
span.textContent = char;
width = span.getBoundingClientRect().width / 40;

// Canvas measureText method
ctx.font = "1000pt " + fontFamily;
width = ctx.measureText(char).width / 100;
```

#### 2.3.5 Image Rendering

```javascript
// Image rendering with drawImage (crop/rotation/mirror/shadow support)
Wn3: function(ctx, x, y, w, h, imageCmd, zoom) {
  var img = imageCmd.htmlImage;   // HTMLImageElement
  x *= zoom; y *= zoom; w *= zoom; h *= zoom;

  // Crop -> temporary canvas
  // Mirror -> ctx.transform(-1,0,0,1,...) or ctx.transform(1,0,0,-1,...)
  // Rotation -> ctx.translate(center) + ctx.rotate(angle)
  // Shadow -> multi-pass shadowBlur
  // Skew -> ctx.transform(1, tan(a), tan(b), 1, ...)

  ctx.drawImage(processedImage, x, y);
}
```

**Image effect pipeline**:
1. Crop (Xkt, Jkt properties)
2. Mirror (fkt=horizontal, pkt=vertical)
3. Rotation (rotationAngle)
4. Shadow (10-pass repeated shadowBlur)
5. Skew (transform matrix)
6. Color filter (getImageData/putImageData pixel manipulation)

#### 2.3.6 Line/Border Rendering

**HWP line type dispatch**:
```javascript
switch (lineType) {
  case SOLID: case DASH: case DOT:
    drawSimpleLine(ctx, ...);     // moveTo->lineTo->stroke
    break;
  case DOUBLE: case TRIPLE:
    drawMultiLine(ctx, ...);      // 2-3 parallel lines
    break;
  case THICK_THIN:
    drawThickThin(ctx, ...);      // Double lines with different widths
    break;
  case WAVE:
    drawWaveLine(ctx, ...);       // Wave line
    break;
}
```

**Dash patterns** (proportional to line width `e`):
```javascript
DASH:      [12*e, 2*e]
DOT:       [1.42*e, 2.01*e]
DASH_DOT:  [16*e, 4*e, 1.4*e, 4*e]
DASH_DOT_DOT: [16*e, 4*e, 1.4*e, 4*e, 1.4*e, 4*e]
LONG_DASH: [24*e, 8*e]
```

**Table cell borders** (4 sides independent):
```javascript
// Each of left/right/top/bottom with different line type/width/color
drawBorder(ctx, LEFT,   x1, y1+topW/2, x1, y2-botW/2, leftStyle);
drawBorder(ctx, RIGHT,  x2, y1+topW/2, x2, y2-botW/2, rightStyle);
drawBorder(ctx, TOP,    x1-leftW/2, y1, x2+rightW/2, y1, topStyle);
drawBorder(ctx, BOTTOM, x1-leftW/2, y2, x2+rightW/2, y2, bottomStyle);
```

#### 2.3.7 Background/Fill Rendering

```javascript
// Solid color fill
ctx.fillStyle = color;
ctx.fillRect(x, y, w, h);

// Gradient
var gradient = ctx.createLinearGradient(x1, y1, x2, y2);
gradient.addColorStop(0, startColor);
gradient.addColorStop(1, endColor);
ctx.fillStyle = gradient;
ctx.fillRect(x, y, w, h);

// Pattern image
var pattern = ctx.createPattern(image, "repeat");  // repeat, repeat-x, repeat-y
ctx.fillStyle = pattern;
ctx.fillRect(x, y, w, h);

// Transparency
ctx.globalAlpha = 1 - transparency / 100;
```

#### 2.3.8 Clipping and Offscreen Compositing

```javascript
// Clipping (Cft -> save/clip, vft -> restore)
ctx.save();
ctx.beginPath();
ctx.rect(clipX, clipY, clipW, clipH);
ctx.clip();
// ... rendering ...
ctx.restore();

// Offscreen compositing (_ft -> create, yft -> composite)
offscreen = createCanvas(width, height);
offCtx = offscreen.getContext("2d");
// ... render to offscreen ...
mainCtx.drawImage(offscreen, 0, 0);   // Composite to main
```

#### 2.3.9 Module Structure

| Module | Role |
|------|------|
| hc_k | Constant definitions ($at command enumerations) |
| hc_mG | Canvas wrapper class (Yr3=canvas, Vr3=ctx, _Nt=zoom) |
| hc_mH | Page renderer: DPR setup, dispatch loop, tile management |
| hc_e$ | Text rendering: J13, Q13, z13 (fillText core) |
| hc_fe | Fill/background: Zn3, qn3, Qn3, $n3 |
| hc_ff | Shape polygon drawing: lOt |
| hc_fd | Image drawing: Wn3, Un3 + effect pipeline |
| hc_fc | Image pixel effects: grayscale, color filter |
| hc_fa~hc_fg | Fill details: solid, gradient, hatching, image pattern |
| hc_fh | Border drawing |
| hc_fj~hc_mr | Embedded font metrics (.hft) |
| hc_mx~hc_mB | UI widget rendering |

## 3. Key Findings

### 3.1 Hancom Also Uses Canvas fillText

Although Hancom's web editor is server-based, the client-side text rendering method is **Canvas 2D `fillText`**. This is the same approach as Google Docs. This means:

- No need to embed FreeType in WASM
- Leverages the browser's text rendering engine (ClearType/CoreText/FreeType)
- Applying DPR scaling correctly is sufficient for sharp text rendering

### 3.2 DPR Scaling Is the Key to Sharpness

All three products use the same DPR pattern:
```
canvas.width  = logicalWidth  x DPR    (physical pixels)
canvas.style.width  = logicalWidth + "px"  (CSS logical pixels)
ctx.scale(DPR, DPR)                       (automatic coordinate conversion)
```

### 3.3 Per-Character Individual Rendering

Hancom renders text **one character at a time** with `fillText`. The reasons:
- Per-character horizontal scaling: `ctx.scale(hScale, 1)`
- Per-character position/offset individually specified
- HWP's character spacing (charSpacing) can differ per character

### 3.4 Zoom Is Handled by Coordinate Multiplication

Zoom scaling is applied by multiplying all coordinates by `x zoom`. This uses **Canvas coordinate scaling**, not CSS transform.

## 4. Current State of Our Product (rhwp)

### 4.1 Current Rendering Pipeline

```
HWP -> Rust Parser -> Render Tree -> WASM renderPageToCanvas() -> Canvas 2D
```

- Rust `WebCanvasRenderer` calls Canvas 2D API directly
- Text rendered with `fillText` (same as Hancom)
- Scale parameter available (added in Task 123)
- **DPR not applied** -> blurry on high-resolution displays

### 4.2 Current Zoom Handling

```typescript
// canvas-view.ts -- CSS scaling approach
if (zoom !== 1.0) {
  canvas.style.width = `${canvas.width * zoom}px`;
  canvas.style.height = `${canvas.height * zoom}px`;
} else {
  canvas.style.width = '';
  canvas.style.height = '';
}
```

- Zooms using CSS `width/height` -> raster stretching -> blurry
- Scale parameter was added to WASM in Task 123, but not applied on the JS side

## 5. Strategy for rhwp

We apply the proven approach from Hancom/Google Docs to our product.

### 5.1 Strategy Overview -- "DPR in WASM, Zoom as Instant-CSS + Deferred-WASM"

```
┌────────────────────────────────────────────────┐
│  Target rendering formula                       │
│                                                │
│  canvas.width  = pageWidth  x zoom x DPR       │
│  canvas.height = pageHeight x zoom x DPR       │
│  canvas.style.width  = pageWidth  x zoom + "px"│
│  canvas.style.height = pageHeight x zoom + "px"│
│  ctx.scale(zoom x DPR, zoom x DPR)             │
│  -> All rendering coordinates use document      │
│     units (HWPUNIT->px) from this point on      │
└────────────────────────────────────────────────┘
```

### 5.2 Changes by Layer

#### Rust WASM Layer

| File | Change | Notes |
|------|------|------|
| `src/wasm_api.rs` | Scale max 8.0 -> 12.0 | Support zoom 3.0 x DPR 3.0 = 9.0 |
| `src/renderer/web_canvas.rs` | No change | `ctx.scale(scale)` already works correctly |

WASM simply receives `scale = zoom x DPR` as-is. The `set_scale()` -> `ctx.scale()` pipeline is already working correctly.

#### TypeScript Layer

**`page-renderer.ts`** -- Core change:
```typescript
// [Current] scale parameter not passed
this.wasm.renderPageToCanvas(pageIdx, canvas);

// [Changed] Pass zoom x DPR
const dpr = window.devicePixelRatio || 1;
const scale = zoom * dpr;
this.wasm.renderPageToCanvas(pageIdx, canvas, scale);
```

**`canvas-view.ts` renderPage()** -- CSS size setup:
```typescript
// [Current] CSS zoom (raster stretching)
canvas.style.width = `${canvas.width * zoom}px`;

// [Changed] Display canvas rendered at zoom x DPR by WASM via CSS
// canvas.width = pageWidth x zoom x DPR (set by WASM)
// CSS display size = pageWidth x zoom
const dpr = window.devicePixelRatio || 1;
canvas.style.width  = `${canvas.width / dpr}px`;
canvas.style.height = `${canvas.height / dpr}px`;
```

**`page-renderer.ts` drawMarginGuides()** -- DPR correction:
```typescript
// [Current] Coordinates used as-is
ctx.moveTo(left, top - L);

// [Changed] Since WASM already applied ctx.scale(zoom x DPR),
// drawMarginGuides draws separately after WASM rendering,
// so the same scale must be applied via ctx.setTransform
const scale = zoom * dpr;
ctx.setTransform(scale, 0, 0, scale, 0, 0);
```

**`canvas-view.ts` onZoomChanged()** -- Instant-CSS + Deferred-WASM:
```typescript
// Step 1: Instant CSS scale for fast feedback (<150ms)
const cssRatio = newZoom / oldZoom;
for (const canvas of activeCanvases) {
  canvas.style.width  = `${parseFloat(canvas.style.width) * cssRatio}px`;
  canvas.style.height = `${parseFloat(canvas.style.height) * cssRatio}px`;
}

// Step 2: Debounced WASM vector re-rendering (150~300ms)
this.scheduleVectorRerender(newZoom);
```

This "Instant-CSS + Deferred-WASM" pattern is identical to what Hancom's web editor uses.

### 5.3 Overlay Canvas Synchronization

The same DPR pattern is applied to the selection/caret overlay canvas:

```typescript
overlay.width  = logicalWidth  * zoom * dpr;
overlay.height = logicalHeight * zoom * dpr;
overlay.style.width  = logicalWidth  * zoom + "px";
overlay.style.height = logicalHeight * zoom + "px";
overlayCtx.scale(zoom * dpr, zoom * dpr);
```

### 5.4 Mouse Coordinate Conversion

```
screen coordinates -> document coordinates:
  docX = (event.clientX - canvasRect.left) / zoom
  docY = (event.clientY - canvasRect.top)  / zoom

  * DPR is handled by CSS, so JS only divides by zoom
  * Hancom uses the same approach (coordinates / zoom, DPR absorbed by Canvas/CSS)
```

### 5.5 Virtual Scroll Layout

`virtual-scroll.ts` requires **no changes**. Reason:
- Virtual scroll calculates layout using CSS display size (logical size x zoom)
- DPR only affects the canvas internal resolution, not the CSS layout

### 5.6 Changed Files Summary

| File | Changes | Difficulty |
|------|-----------|--------|
| `src/wasm_api.rs` | Adjust scale max (8->12) | Low |
| `rhwp-studio/src/view/page-renderer.ts` | Pass zoom x DPR, margin guides DPR correction | Medium |
| `rhwp-studio/src/view/canvas-view.ts` | CSS size calculation change, debounced zoom | Medium |
| `rhwp-studio/src/view/viewport-manager.ts` | DPR detection/storage/events | Low |
| `rhwp-studio/src/ui/selection-overlay.ts` (if applicable) | Overlay DPR synchronization | Medium |

### 5.7 Expected Results

| Item | Current | After Implementation |
|------|------|---------|
| 100% zoom sharpness | DPR 1x rendering (blurry on high-res displays) | DPR-scaled rendering (sharp) |
| 200% zoom sharpness | CSS 2x stretch (pixels visible) | 2xDPR resolution re-rendering (sharp) |
| Zoom response speed | Wait for full re-rendering | Instant CSS -> deferred vector (smooth UX) |
| WASM size | 1.4MB (unchanged) | 1.4MB (unchanged) |

### 5.8 Architecture Comparison with Hancom

```
[Hancom WebGian]
  HWP -> Server (HWP Filter) -> JSON commands -> JS Canvas 2D fillText
  DPR: ctx.scale(DPR) + canvas size x DPR

[rhwp (after implementation)]
  HWP -> Rust WASM Parser -> Render Tree -> Rust Canvas 2D fillText
  DPR: ctx.scale(zoom x DPR) + canvas size x zoom x DPR

  * Difference: Hancom calls fillText from JS, rhwp calls from Rust/WASM
  * Similarity: Both use browser Canvas 2D fillText, same DPR scaling
  * Advantage: No server required, performance advantage with WASM rendering
```
