# 타스크 123 최종 결과보고서 — 벡터 품질 줌 구현

## 1. 목표

CSS `transform: scale()` 래스터 줌을 Canvas 2D `ctx.scale()` 벡터 재렌더링으로 교체하여, 줌 확대 시 텍스트/선/이미지가 해당 해상도에서 재래스터화되어 선명한 벡터 품질을 얻는다.

## 2. 구현 내역 (4단계)

### 1단계: WASM render_page_to_canvas에 scale 파라미터 추가 ✅
- `render_page_to_canvas` 시그니처에 `scale: f64` 추가
- scale 정규화: 0 이하/NaN → 1.0, clamp(0.25, 8.0)
- 최대 캔버스 크기 16384px 가드
- `WebCanvasRenderer`에 `scale` 필드, `set_scale()`, `begin_page()`에서 `ctx.scale()` 적용

### 2단계: JS applyZoom 벡터 재렌더링 방식으로 변경 ✅
- `_basePageWidth`, `_basePageHeight`, `_zoomRenderTimer` 모듈 변수 추가
- `renderCurrentPage()`: `renderScale = zoom × dpr`로 WASM 호출, CSS 표시 크기 설정
- `applyZoom()` 재작성: 즉시 CSS transform (빠른 피드백) + 150ms 디바운스 벡터 재렌더
- `_renderAtZoom(zoom)` 신규 함수: 벡터 재렌더링 + 오버레이 동기화
- `zoomFit()` 수정: 기본 페이지 크기 기반 계산

### 3단계: 마우스 좌표 변환 및 오버레이 줌 적용 ✅
- `SelectionRenderer`: `_zoom` 필드, `setZoomScale()`, `clear()`에서 `setTransform` 리셋/재적용
- `SelectionController`: `_zoom`, `setZoomScale()`, 캐럿 폭 줌 보정
- `_toPageCoords()`: `canvas.width / rect.width` 비율 기반 정확한 좌표 변환 (DPR/슈퍼샘플링 무관)
- 컨텍스트 메뉴 히트테스트: `/ zoomLevel` 적용

### 4단계: 통합 테스트 및 검증 ✅
- 571개 테스트 통과
- WASM 빌드 성공
- 줌 100%/200%/300% 렌더링 확인

## 3. 추가 품질 개선 과정

### DPR(devicePixelRatio) 지원
- `renderScale = zoom × dpr` → 고해상도 디스플레이에서 물리 픽셀 1:1 매칭
- 오버레이 캔버스도 동일 scale 적용

### 슈퍼샘플링 시도 및 제거
- `Math.max(2, dpr)` 최소 2x 슈퍼샘플링 시도 → 브라우저 다운스케일 보간으로 텍스트 흐림
- 최종: `renderScale = zoom × dpr` (보간 없는 물리 픽셀 1:1 매칭)

### 한컴 등 상용 제품 비교 분석
- 한컴 등 상용 제품: 글리프 아웃라인 벡터 렌더링 (fillText 미사용)
- Google Docs: Canvas 기반 (2021년 DOM→Canvas 전환)
- PDF.js: 글리프 패스 렌더링으로 품질 향상
- 결론: Canvas 2D `fillText()`의 그레이스케일 AA 한계 → 다음 타스크에서 글리프 패스 렌더링으로 해결 예정

## 4. 핵심 원리

- `canvas.width/height = 페이지크기 × zoom × dpr` (물리 픽셀 해상도)
- `canvas.style.width/height = 페이지크기 × zoom` (CSS 표시 크기)
- `ctx.scale(renderScale, renderScale)` 후 문서 좌표 그대로 렌더링
- 하이브리드 줌: 즉시 CSS transform (시각 피드백) + 150ms 디바운스 벡터 재렌더
- 좌표 변환: `backingRatio = canvas.width / rect.width`, `zoomOnly = _zoom / backingRatio`

## 5. 변경 파일 요약

| 파일 | 변경 내용 |
|------|-----------|
| src/wasm_api.rs | render_page_to_canvas에 scale 파라미터, clamp(0.25, 8.0) |
| src/renderer/web_canvas.rs | scale 필드, set_scale(), begin_page에 ctx.scale() |
| web/editor.js | applyZoom 재작성, _renderAtZoom, renderCurrentPage 줌 전달, zoomFit |
| web/text_selection.js | SelectionRenderer/Controller 줌 스케일, _toPageCoords 비율 기반 |
| .gitignore | target-local/ 추가 |
| mydocs/plans/task_123.md | 수행계획서 |
| mydocs/plans/task_123_impl.md | 구현 계획서 |

## 6. 검증 결과

| 항목 | 결과 |
|------|------|
| 기존 571개 테스트 회귀 | 통과 |
| WASM 빌드 | 성공 |
| 줌 100% 렌더링 | 정상 |
| 줌 300% 렌더링 | 선명 (물리 픽셀 1:1) |
| 하이브리드 줌 동작 | 즉시 CSS → 150ms 벡터 |
| 마우스 좌표 변환 | 정확 |
| 최대 줌 300% | 한컴 등 상용 제품과 동일 제한 |

## 7. 향후 과제

- **글리프 패스 렌더링** (다음 타스크): `fillText()` → 폰트 글리프 아웃라인 직접 렌더링으로 텍스트 품질 한컴 등 상용 제품 수준 달성
- Rust `ttf-parser` + Canvas `beginPath/bezierCurveTo/fill` 방식
- 대표 한글 폰트 번들 (함초롬바탕 등)
