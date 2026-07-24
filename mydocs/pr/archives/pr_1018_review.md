# PR #1018 검토 — Task #1016: Resolve image payloads in PaintOp::Image

- 작성일: 2026-05-20
- 컨트리뷰터: [@postmelee](https://github.com/postmelee) (Taegyu Lee)
- PR: https://github.com/edwardkim/rhwp/pull/1018
- base/head: `devel` ← `postmelee:local/task1016` (cross-repo fork)
- 연결 이슈: Refs #1016, Follows #976, Related #1017
- 규모: **+1861 / -264, 24 files** (소스 16, 문서 7, 1 TS) — 광범위 아키텍처 리팩토링
- mergeable: **CONFLICTING**
- 본질 커밋: 단일 `46a54709` "Resolve baked watermark image payloads" (작성자 @postmelee)

## 1. 컨트리뷰터 사이클 (`feedback_contributor_cycle_check`)

@postmelee = **15+ PR 핵심 컨트리뷰터** (rhwp-studio + 한컴 호환 영역). 직전 #976(Task #938 baked watermark PNG, 머지됨)의 직접 후속. **#1019(Task #975) OPEN** 도 시리즈 연속 (PageBackground fill mode + RealPic watermark tone). devel = `71aedda9` (#1015 머지 포함).

## 2. 본질 — image payload resolver 아키텍처 분리

기존: BMP/PCX→PNG 변환과 워터마크 JPEG→baked PNG bake 판정이 **각 renderer 별 사본**(svg/canvas/web_canvas/skia/paint/json 등)에 분산 — `feedback_image_renderer_paths_separate` 결함 영역.

본 PR: 변환·bake 판정을 `LayerBuilder::RenderNodeType::Image` 하강 시 **단일 `image_resolver::resolve_image_payload()`** 에서 결정. 결과를 `ResolvedImagePayload`(Vec<u8>, mime, kind, suppress_effects) 로 패키지하여 `PaintOp::Image.resolved: Option<Box<...>>` 필드에 부착. 모든 renderer는 resolved payload 를 소비만 — 재판정 없음.

### 핵심 변경

| 영역 | 파일 | 변경 |
|------|------|------|
| **신규 모듈** | `src/renderer/image_resolver.rs` (+255) | resolve_image_payload + helper |
| paint 스키마 | `paint/paint_op.rs` (+15), `paint/schema.rs` (minor 12→13), `paint/json.rs` (+31), `paint/builder.rs` (+2), `paint/mod.rs` | `ResolvedImagePayload` 신규 + `PaintOp::Image.resolved` 옵션 필드 |
| renderer (소비) | `canvas.rs` / `web_canvas.rs` / `skia/renderer.rs` / `svg.rs` / `svg_layer.rs` / `canvaskit_policy.rs` / `mod.rs` (+13~28 each) | resolved payload 우선 사용 |
| document_core | `queries/rendering.rs` (-26 net) | overlay 별도 재판정 제거 |
| 회귀 테스트 | `tests/issue_938.rs` (+72) | PageLayerTree resolved watermark contract |
| Studio | `rhwp-studio/src/core/types.ts` (+1) | `bakedWatermark:true` 필드 |

### 스키마

`schema_minor_version: 12 → 13` (MAJOR 불변). `resolved` 는 옵션 필드로 **하위호환** — 기존 PageLayerTree 소비자 무영향.

## 3. 검토 의견

### 강점

1. **`feedback_image_renderer_paths_separate` 본질적 해소 (권위 사례)** — 5+ renderer 별 사본 → 단일 진입점. 이 메모리 룰 도입(Task #514/#516) 이래 가장 직접적 아키텍처 해소.
2. **단일 책임 분리** — 변환·bake 판정 → `LayerBuilder` 단계, renderer → resolved 소비만. `feedback_diagnosis_layer_attribution` 정합 (interpretation/사용 분리).
3. **scope 좁힘 명시 (#1017 분리)** — z-order replay 일반화는 별도 PR. "renderer 들이 같은 resolved image payload 공유" contract 로 좁힘.
4. **회귀 테스트 영구화** — `tests/issue_938.rs` 가 #976 baked watermark 회귀 가드 + 본 PR 의 contract (resolved payload mime png + bakedWatermark:true) 검증.
5. **legacy SVG helper re-export** — 호환성 보존.
6. **외부 검증** — PR 본문에 cargo test/clippy/fmt + native-skia (skia 빌드 + PNG 산출) + WASM + Studio production build + npm test 전부 통과 명시.

### ⚠️ 핵심 쟁점

#### (A) 광범위 표면 — 7개 renderer 경로 + paint 스키마 변경

24파일 / +1861 / -264. **각 renderer 경로 sweep 으로 회귀 표면 검증 필수** — 워터마크/BMP/PCX 포함 fixture(복학원서, sample16 등) + 일반 fixture 모두. 이미지 없는 일반 fixture 는 resolved=None 이라 무영향이어야 함 (정확 확인).

#### (B) PaintOp::Image 스키마 변경 + schema minor 12→13

`resolved: Option<Box<ResolvedImagePayload>>` 옵션 필드 추가로 **하위호환** 유지. PageLayerTree JSON 외부 소비자(rhwp-studio TS) 변경 1줄 포함됨 (`types.ts`). PR 본문이 `bakedWatermark:true` JSON 출력 명시 — Studio overlay 가 별도 JPEG 재판정 없이 `PaintOp::Image.resolved` 사용하도록 정리.

#### (C) cherry-pick 충돌 예상 — orders/20260519/20260520 + 본 환경 변경

PR 의 본질 커밋이 `mydocs/orders/20260519.md` (+17) + `mydocs/orders/20260520.md` (+11) 변경 포함 → **메인테이너 일지 vs 컨트리뷰터 일지 충돌** (#1005/#1011 동일 패턴). 해소: `--ours` 메인테이너 일지 보존. 본 환경 orders/20260520.md 는 5/20 PR 처리 일지 (PR #1011, #1015) 기록됨.

#### (D) PR 범위 명시 제외 — wrap=behindText z-order (#1017 분리)

PR 본문: "native Skia PNG export 에서 wrap=behindText 워터마크가 글 내용 위에 보이는 문제 확인됐으나 본 PR scope 외, #1017 로 분리". **본 PR 이 z-order 를 건드리지 않음을 sweep 으로 확인** — 워터마크 fixture (복학원서) 의 z-order 가 BEFORE 대비 변동 없는지 검증.

#### (E) 회귀 테스트 1개 추가 — issue_938

`tests/issue_938.rs` +72 — #976 baked watermark contract 회귀 가드. cargo test 통과 확인 필요.

### 확인 필요 (검증 단계)

1. cherry-pick `46a54709` — orders 2건 + 가능한 본 환경 변경 충돌 `--ours` 해소
2. `cargo test --release --lib` (PR: 1306) + `cargo test --test issue_938` + clippy -D + fmt 0
3. **광범위 sweep** — 워터마크/BMP/PCX 포함 fixture (복학원서, sample16) + 일반 fixture (exam_kor/math, aift, biz_plan, hy-001) 회귀 부재 — **이미지 없는 fixture diff=0 (resolved=None) 확인**
4. WASM 빌드 + Studio 통합 (`rhwp-studio/public/rhwp_bg.wasm` 동기화) + 작업지시자 시각 판정 — 워터마크 baked + BMP/PCX 변환 정상 + z-order 변동 없음

## 4. 처리 옵션

- **옵션 A (수용 — 권고)**: `feedback_image_renderer_paths_separate` 본질적 해소 + 단일 책임 분리 + scope 좁힘 + 회귀 테스트 영구화. sweep 회귀 부재 + 작업지시자 시각 판정 통과 시. **광범위 표면이므로 sweep 신중**.
- **옵션 B (수정 요청)**: 특정 renderer 경로 회귀 또는 워터마크 fixture 시각 회귀 시 — 영향 좁히거나 옵션 필드 의무화 요청.
- **옵션 C (close)**: 본질 결함 시. 해당 없음 (PR 본문 외부 검증 충실).

## 5. 메모리 룰 정합

- `feedback_contributor_cycle_check` — @postmelee 15+ PR, #976 → **#1018** → #1019 시리즈
- `feedback_image_renderer_paths_separate` — **권위 사례 해소** (5+ 사본 → 단일 진입점)
- `feedback_diagnosis_layer_attribution` — interpretation(builder)/사용(renderer) 분리
- `feedback_fix_scope_check_two_paths` — 7개 renderer 경로 sweep 필수
- `feedback_visual_judgment_authority` — 워터마크 baked + BMP/PCX 변환 시각 판정 게이트
- `feedback_hancom_compat_specific_over_general` — scope 좁힘 (#1017 분리)
- `feedback_pdf_not_authoritative` / `feedback_v076_regression_origin` — 복학원서 PDF 권위 자료 시각 판정 (PR #976 연장)
- `project_output_folder_structure` — sweep 산출물 output/poc/pr1018 배치

## 6. 권고

**옵션 A 조건부** — 아키텍처 개선 (`feedback_image_renderer_paths_separate` 본질적 해소) + scope 좁힘 + 회귀 테스트 견고. 검증 단계에서 (1) cherry-pick orders 충돌 `--ours` 해소, (2) cargo test 1306 + issue_938 + clippy + fmt, (3) **광범위 sweep** — 워터마크 fixture(복학원서) + BMP/PCX + 일반 fixture + 이미지 없는 fixture diff=0, (4) WASM + Studio 통합 + 작업지시자 시각 판정 통과 시 cherry-pick no-ff merge. **표면 광범위로 sweep 신중**, 특정 renderer 회귀 시 옵션 B 전환.
