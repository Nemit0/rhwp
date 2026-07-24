# Font Metrics DB Size Comparison (rhwp vs Hancom vs a commercial web office)

## 1. WASM Binary Size

| Item | rhwp (Before Metrics) | rhwp (After Metrics) | Increment |
|------|----------------------|---------------------|-----------|
| rhwp_bg.wasm | 1,436,480 B (1.37 MB) | 1,923,294 B (1.83 MB) | +486,814 B (+475 KB, +34%) |

## 2. Three-Way Comparison

| Item | rhwp | Hancom WebGian | A commercial web office |
|------|------|---------------|------------------------|
| **Total WASM** | **1.83 MB** | N/A (server-side rendering) | **~19 MB** |
| **Metrics Method** | Rust static arrays (WASM embedded) | JS .hft modules (dynamically loaded) | WASM embedded (presumed) |
| **Metrics Size** | ~475 KB (WASM binary) | ~2-5 MB (387 JS modules) | Included in binary |
| **Covered Font Families** | **386** | 342 | Unknown |
| **Covered Font Variants (R/B/I/BI)** | **582** | 387 | Unknown |
| **Korean Metrics Fonts** | 160 | ~120 (estimated) | Unknown |
| **gzip Transfer Size (est.)** | ~600 KB | ~800 KB-1.5 MB (per module) | ~6 MB |

## 3. Internal Data Size Analysis

| Data Type | Item Count | Bytes |
|-----------|-----------|-------|
| Latin width arrays (u16) | ~345,000 values | ~690,000 B |
| Korean width arrays (u16) | ~2,600 values | ~5,200 B |
| Initial/medial/final consonant mappings (u8) | ~10,800 values | ~10,800 B |
| LatinRange structs | ~2,650 | ~42,400 B |
| **Raw data total** | | **~730 KB** |

## 4. Size Projection by Font Count

Current 582 entries result in 475 KB increment. Average ~816 bytes per entry.

| Font Count | WASM Increment (est.) | Total WASM Size |
|-----------|----------------------|-----------------|
| 100 | ~80 KB | ~1.50 MB |
| 200 | ~160 KB | ~1.58 MB |
| 300 | ~240 KB | ~1.66 MB |
| 400 | ~330 KB | ~1.74 MB |
| **582 (current)** | **475 KB** | **1.83 MB** |
| 800 | ~650 KB | ~2.03 MB |
| 1000 | ~816 KB | ~2.20 MB |

## 5. Competitive Advantage Analysis

### rhwp Advantages
- Total WASM size is **1/10 of the comparable commercial web office** (1.83 MB vs 19 MB)
- **13% higher font coverage than Hancom** (386 vs 342 families)
- **Single binary** load (Hancom requires sequential loading of 387 modules)
- Metrics usable in native builds as well (Hancom is browser-only)

### Korean Metrics Quality
- Syllable decomposition compression (cho x jung x jong groups): up to 72 representative widths cover 11,172 syllables
- Most Korean fonts are monospaced (uniform) -> 0 error
- Variable-width fonts (Yj series, etc.): max error 8 em-units (0.8% at em=1000)

### Default Font Priority Ordering
Fonts commonly used in HWP placed at the front of the array to optimize `find_metric()` linear search:
1. HCR Batang/Dotum -- HWP default
2. Malgun Gothic -- Windows system default
3. Haansoft Batang/Dotum -- Hansoft legacy
4. NanumGothic/NanumMyeongjo -- Popular Korean fonts
5. **Noto Sans KR / Noto Serif KR** (R+B) -- Android/Chrome OS/tablet default
6. Arial, Times New Roman, Calibri, Verdana, Tahoma -- Major English fonts
7. Batang, Dotum, Gulim, Gungsuh -- Legacy Korean fonts

### Noto CJK Addition Rationale
- Default Korean font for Android tablets/Chrome OS
- Default font in Google Docs, Slides, etc.
- Open source (OFL license) with no legal burden
- Regular + Bold variants covered (23,174 glyphs, including all 11,172 Korean syllables)
- Monospaced Korean -> minimal metrics data (+3 KB WASM increment per font)
