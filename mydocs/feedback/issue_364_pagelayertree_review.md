# 이슈 #364 검토 — PageLayerTree 생성 API 추가 제안

## 이슈 정보

| 항목 | 값 |
|------|-----|
| 이슈 번호 | [#364](https://github.com/edwardkim/rhwp/issues/364) |
| 제목 | 다양한 렌더러 지원을 위한 PageLayerTree 생성 API 추가 제안 |
| 작성자 | [@postmelee](https://github.com/postmelee) |
| 라벨 | (없음) |
| state | OPEN |
| createdAt | 2026-04-26 |
| 처리 상태 | **PR 미연결** — 제안 단계, 코드/문서/git 흔적 없음 |
| 참조 | PR #165 (skia renderer, @seo-rii, CLOSED 미머지), 이슈 #363 (완료, PR #385 흡수) |

## 작성자 제안 정리

`PageRenderTree` 보다 더 renderer-friendly 한 **`PageLayerTree`** 새 중간 표현 추가. paint operation / group / clip 중심으로 평탄화된 형태.

```
Document / Section / Paragraph / Control
  → compose / paginate / layout
  → PageRenderTree         (semantic, 본 저장소 기존)
  → PageLayerTree          (paint operation 중심, 신규 제안)
  → renderer backend replay
```

### 작성자가 명시한 #363 vs #364

작성자 댓글 (2026-04-26 18:13):

| 이슈 | 초점 |
|------|------|
| #363 | 기존 `PageRenderTree` 를 native bridge API 로 노출 (단기) |
| **#364** | `PageRenderTree` → `PageLayerTree` 변환 API 신설 (장기 구조 개선) |

→ #363 의 **후속** 으로 작성자 자신이 자리매김.

### 제안 API 형태

**Rust native**:
```rust
pub fn build_page_layer_tree(&self, page_num: u32) -> Result<PageLayerTree, HwpError>
pub fn get_page_layer_tree_native(&self, page_num: u32) -> Result<String, HwpError>  // JSON
```

**WASM**:
```rust
#[wasm_bindgen(js_name = getPageLayerTree)]
pub fn get_page_layer_tree(&self, page_num: u32) -> Result<String, JsValue>
```

**C ABI**:
```c
char *rhwp_render_page_layer_tree(RhwpDocument *doc, uint32_t page);
void rhwp_free_string(char *s);
```

### JSON 스키마 예시

```json
{
  "schemaVersion": 1,
  "coordinateSystem": "top-left",
  "unit": "pt",
  "pageWidth": 595.0,
  "pageHeight": 842.0,
  "root": { "kind": "group", "bounds": {...}, "children": [] }
}
```

## 본 저장소 현황 점검

### 이미 존재하는 PageRenderTree

[`src/renderer/render_tree.rs:695`](src/renderer/render_tree.rs#L695)

```rust
#[derive(Debug, Clone, Serialize)]
pub struct PageRenderTree {
    pub root: RenderNode,
    next_id: NodeId,
    inline_shape_positions: HashMap<(usize, usize, usize), (f64, f64)>,
}
```

`RenderNodeType` enum:
- semantic 노드: `Page`, `PageBackground`, `MasterPage`, `Header`, `Footer`, `Body { clip_rect }`, `Column(u16)`, `FootnoteArea`, `TextLine`, `TextRun`, `Table`, `TableCell`
- shape 노드: `Line`, `Rectangle`, `Ellipse`, `Path`, `Image`, `Group`

→ semantic + shape 혼합 형태. 작성자 지적대로 **renderer 가 다시 해석해야 하는 구조**.

### 존재하지 않는 것

- `PageLayerTree` 식별자: grep 결과 0건
- `page_layer_tree` 함수 / 모듈: 없음
- 관련 PR / 커밋 / docs: 없음

### 관련 PR (정보 정합성)

- **PR #385** (postmelee, 머지됨 cherry-pick): #363 처리 (PageRenderTree native bridge API 노출)
- **PR #165** (seo-rii, CLOSED 미머지): skia renderer + layered renderer 일괄 — 본 이슈에서 작성자가 언급한 "리뷰 범위 큰 PR"

→ #363 → #385 (완료) → **#364 후속 단계** 가 자연스러운 흐름.

## 변경 평가 (제안 단계)

### 강점

1. **#363 의 자연스러운 후속** — PageRenderTree native bridge 가 이미 노출되어 있어 그 위에 layer tree 변환을 얹는 구조
2. **renderer backend 다양화의 기반** — Skia / CanvasKit / ThorVG / CoreGraphics 등 future-proofing
3. **렌더러 구현으로부터의 분리** — PR #165 가 skia renderer + 공통 layer 구조를 함께 포함해 리뷰 부담이 컸던 정황을 분리하자는 합리적 제안
4. **JSON / FFI / WASM 다중 surface** — native bridge 사용처 (alhangeul-macos 등) 와 정합
5. **작성자 신뢰도** — PR #385 (이미 흡수) + 다수 머지 이력 + #363/#364 단계 분리 의식

### 약점 / 점검 필요

#### 1. 구체적 schema 합의 필요

현재 제안된 JSON 은 outline 만 (root.kind / bounds / children). PR 시점에 다음을 합의해야:
- `kind` 종류: `group`, `clip`, `text`, `path`, `shape`, `image`, `equation`, `transform` 등
- `style` 표현: stroke / fill / opacity / blend / shadow
- text 표현: glyph run vs string + font
- transform 표현: matrix 2D vs decomposed (translate/rotate/scale)
- coordinate system: `top-left` 명시 (HWP 의 vpos / 페이지 좌표계와 정합)

#### 2. PageRenderTree → PageLayerTree 변환 정확성

- `Header`, `Footer`, `Body { clip_rect }`, `Column` 등 semantic 영역을 `clip` + `group` 으로 평탄화
- `TextLine` / `TextRun` 을 `text` paint op 로 변환 — 글꼴 폴백 / 한글 / 형광펜 / 이탤릭 등 정확히 보존되는지
- `TableCell` 의 inner clip / nested table / Square wrap 등 복잡한 경우 회귀 위험

#### 3. 책임 범위 — 변환만 vs 렌더 동등성

- 변환만 제공 시 각 backend 의 결과 차이는 backend 책임
- 렌더 동등성 보장 시 reference renderer (SVG) 와 cross-check 필요 → 범위 커짐
- **PR 단계에서 명확히** — 본 이슈는 "변환 API 추가" 로 좁게 해석 권장

#### 4. schemaVersion 정책

- 작성자가 `schemaVersion: 1` 명시 → 향후 변경 정책 (semver / 호환성 / migration) 미리 합의
- 외부 backend (alhangeul-macos 등) 가 기존 버전 의존 시 breaking 회피

#### 5. 회귀 테스트

- 신규 API 라 기존 동작 영향 없음 — 안전
- 단 `PageRenderTree` 와의 1:1 변환 정확성을 검증할 단위 테스트 / svg_snapshot 동등성 비교 필요

#### 6. 본 시점 우선순위

- **v0.7.x 페이지네이션 회귀 정정 작업이 우선** (exam_eng, k-water-rfp 등)
- #364 는 **추가 가치형 (additive)** — 핵심 가치 (HWP 호환) 와 별도
- v1.0 이후로 미루는 선택지도 합리적

## 처리 방향 후보

### 옵션 A: PR 권유

작성자 의향 / 신뢰도 / #363 후속 자연스러움 정황으로 PR 권유. PR 단계에서 schema 합의 + 변환 정확성 검증.

### 옵션 B: 사전 설계 합의 후 PR

이슈 댓글로 schema 종류 (kind / style / text 표현 등) 먼저 합의 → 합의 후 PR. 리뷰 부담 분산.

### 옵션 C: v1.0 이후로 미룸

페이지네이션 회귀 정정 작업이 우선. 작성자에게 정중히 미루고 v1.0 마일스톤 등록.

### 옵션 D: 거절 / close

PageRenderTree 만으로 충분하다고 판단 시. 다만 작성자가 #363 후속으로 자리매김했고 PR 분리 의식이 양호하므로 **거절 사유 약함** — 추천 안 함.

## 권장

**옵션 A (PR 권유)** + **옵션 B 일부 (PR 본문에 schema 사전 정리 포함)** 권장.

이유:
1. #363 → #385 흐름의 자연스러운 후속
2. 작성자 신뢰도 양호 (PR #385 흡수 / 단계 분리 의식)
3. 변경 범위가 신규 API 추가라 기존 동작 회귀 위험 적음
4. JSON schema 만 잘 합의하면 외부 backend (alhangeul-macos / Skia / CanvasKit 등) 가 즉시 활용 가능
5. 본 이슈는 **변환 API 추가** 로 좁게 해석하면 PR 범위 관리 가능

PR 권유 시 단계별 점검 항목:
- PR 본문에 schema 정리 (kind / style / text / transform / coordinate system / unit)
- `schemaVersion` 정책 (semver / 호환성)
- `PageRenderTree → PageLayerTree` 변환 정확성 단위 테스트
- 외부 surface (Rust / WASM / C ABI) 중 본 PR 의 범위 명확히 (예: native + WASM 만, C ABI 후속)
- 회귀 테스트 (svg_snapshot 동등성)
- 본 PR 은 변환 API 만 — 신규 backend 구현은 별도 PR

## 다음 단계 — 작업지시자 결정

A / B / C / D 중 결정 부탁드립니다.

권장 — **A**: PR 권유 + PR 본문에 schema 사전 정리 / 범위 좁히기 안내.

## 참고

- 이슈: [#364](https://github.com/edwardkim/rhwp/issues/364) (OPEN, 미연결)
- 관련 이슈: [#363](https://github.com/edwardkim/rhwp/issues/363) (완료 — PR #385 흡수)
- 관련 PR: [#165](https://github.com/edwardkim/rhwp/pull/165) (CLOSED 미머지, @seo-rii) — 작성자가 언급한 "리뷰 범위 큰" 사례
- 관련 파일: [`src/renderer/render_tree.rs:695`](src/renderer/render_tree.rs#L695), `src/wasm_api.rs:233` (`getPageRenderTree`)
- 작성자 history: PR #339 (#338 Firefox AMO), PR #224 (#222 Safari init), PR #214 (#207 download), PR #209 (#205 vite define), PR #169 (Firefox extension), PR #168 (Chrome 정리), PR #385 (#363 native bridge, cherry-pick 흡수)
