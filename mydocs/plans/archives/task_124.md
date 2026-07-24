# 타스크 124 수행계획서 — 글리프 패스 렌더링 (벡터 텍스트)

## 1. 목표

Canvas 2D `fillText()` 대신 **폰트 글리프 아웃라인(베지어 곡선)을 직접 Canvas Path로 렌더링**하여, 한컴 등 상용 제품/PDF.js 수준의 벡터 텍스트 품질을 달성한다.

## 2. 현재 상태 분석

### 현재 텍스트 렌더링 흐름
```
HWP → DocInfo.fonts → ResolvedCharStyle → TextStyle → draw_text()
  → ctx.set_font(CSS font string)
  → compute_char_positions() / split_into_clusters()
  → ctx.fillText(cluster_str, x, y)  ← 그레이스케일 AA 한계
```

### 문제점
- `fillText()`는 브라우저의 텍스트 래스터라이저에 종속
- 그레이스케일 안티앨리어싱만 지원 (서브픽셀 불가)
- 줌 확대 시 한컴 등 상용 제품 대비 텍스트가 부드러워 보임 (soft edges)

### 기존 자산
- `ttfs/hamchob-r.ttf` — 함초롬바탕 (26.5MB)
- `ttfs/hamchod-r.ttf` — 함초롬돋움 (17.5MB)
- `TextStyle.font_family` → 폰트 이름 매핑 이미 존재
- `compute_char_positions()` → 글자 위치 계산 이미 존재

## 3. 핵심 원리

1. `ttf-parser` 크레이트로 TTF 파일에서 글리프 아웃라인(MoveTo/LineTo/CurveTo) 추출
2. 글리프 아웃라인을 Canvas 2D Path 명령으로 변환: `beginPath()` → `moveTo/lineTo/bezierCurveTo` → `fill()`
3. 폰트 좌표계(em 단위) → 문서 좌표계(px) 스케일 변환
4. 글리프 패스 캐시로 반복 렌더링 성능 보장

## 4. 구현 범위

### 변경 파일

| 파일 | 변경 내용 |
|------|-----------|
| `Cargo.toml` | `ttf-parser` 크레이트 추가 |
| `src/renderer/glyph_cache.rs` (신규) | 글리프 패스 캐시 (폰트별 글리프 ID → Path 명령 시퀀스) |
| `src/renderer/web_canvas.rs` | `draw_text()` 수정: fillText → glyph path 렌더링 |
| `src/wasm_api.rs` | `load_font()` WASM API 추가 |
| `web/editor.js` | 폰트 로딩 (fetch TTF → WASM 전달) |

### 비변경 영역
- 렌더트리 구조 (TextRunNode 유지)
- 레이아웃 엔진 (compute_char_positions 유지)
- SVG 렌더러 (네이티브 전용)
- 스타일 리졸버 (그대로 사용)

## 5. 폰트 전략

### 1차: 대표 한글 폰트 번들
- 함초롬바탕 (`hamchob-r.ttf`) — HWP 기본 본문 폰트
- 함초롬돋움 (`hamchod-r.ttf`) — HWP 기본 제목/UI 폰트
- 웹 서버에서 fetch → WASM에 전달 → ttf-parser로 파싱

### 폴백
- 글리프 패스 렌더링 가능한 폰트 → 패스 렌더링
- 미로드 폰트 → 기존 `fillText()` 폴백

## 6. 성능 고려

| 항목 | 대응 |
|------|------|
| 글리프 아웃라인 파싱 | 최초 1회, 캐시 재사용 |
| 한글 글리프 수 (11,172자) | Lazy 캐시 (사용 시 파싱) |
| Path 명령 수 | 한글 1글자 = ~100-300 path 명령 (기본 도형 대비 많음) |
| 메모리 | 캐시 크기 제한 (LRU 등) |
| WASM 폰트 데이터 | fetch로 별도 로딩, WASM 바이너리 크기 영향 없음 |

## 7. 위험 요소

- 글리프 패스 렌더링 성능이 fillText 대비 느릴 수 있음 → 프로파일링 후 최적화
- 복합 글리프 (리거처, 결합 문자) 처리 → ttf-parser의 glyph composition 지원 확인
- 폰트 힌팅 미적용 → 저해상도(줌 100%)에서 품질 비교 필요
- 함초롬체 TTF 용량 (26.5MB) → gzip 압축 시 ~10-12MB, 로딩 시간 고려
