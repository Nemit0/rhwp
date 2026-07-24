# PR #1057 검토 — render: harden CanvasKit direct replay contract (Refs #536, P17)

## 1. PR 정보

| 항목 | 값 |
|------|-----|
| 번호 | #1057 |
| 제목 | render: harden CanvasKit direct replay contract |
| 작성자 | **seo-rii** (Seohyun Lee) — 누적 컨트리뷰터 (PR #165 skia renderer + P14/P15/P16 시리즈) |
| base ← head | `devel` ← `seo-rii:render-p17` |
| 라벨 | enhancement |
| 변경 | **6 파일 +89 / -39** (소형, 컨트랙트 강화) — Rust 4 (`canvaskit_policy.rs`, `wasm_api.rs`, `wasm_api/tests.rs`, `paint/schema.rs`) + frontend 2 (`wasm-bridge.ts`, `render-backend.test.ts`) |
| 연결 이슈 | Refs #536 (closes 없음) |
| mergeable | MERGEABLE / BEHIND |
| **CI** | ✅ **전부 pass** (Build & Test, Analyze rust·js·py, Canvas visual diff, CodeQL) |
| 본질 commit | 2 — `2eb64e9b` (본질) + `20fc48f2` (Copilot review feedback 반영) |
| Copilot 리뷰 | ✅ **6 코멘트 모두 후속 commit 으로 반영 완료** |
| 생성 | 2026-05-21 08:34 |

## 2. 배경 — CanvasKit P 시리즈 supersede chain

```
이슈 #536 (멀티 렌더러 트래킹) — PageLayerTree 중간 IR 도입
   ↓ P8: render — harden PageLayerTree schema and resource keys (PR #761)
   ↓ P14: Text IR v2 — GlyphOutline variant adoption (PR #916, @seo-rii)
   ↓ P15: CanvasKit replay policy diagnostics (PR #925, @seo-rii)
   ↓ P16: browser CanvasKit direct renderer (PR #996, @seo-rii)
   ↓ P17 (본 PR, @seo-rii): replay contract 닫는 단계
   ↓ P18~P21: raster image/effect, text/glyph payload, sweep/WebGPU, PDF export
```

P16 의 direct renderer 가 들어간 후 P17 은 실제 coverage 확장 (P18+)
전에 **replay contract 를 먼저 닫는 단계**. PR 본문 명시.

## 3. 본질 — Canvas2D overlay fallback 차단

### 3.1 핵심 변경 본질

**`default` 와 `compat` 모두 Canvas2D overlay fallback 이 아님** 을 contract
로 고정:
- `compat` 는 **보수적인 direct replay mode 일 뿐, hidden Canvas2D paint 로
  unsupported op 를 덮는 모드가 아님**
- native/WASM diagnostics 와 Studio fallback bridge 가 같은 contract 를
  말하도록 통일

### 3.2 변경 본질 4 영역

**(1) `src/renderer/canvaskit_policy.rs` (+59/-27, 핵심)** — `CanvasKitReplayPolicy`
구조체 신규 + `DIRECT_ONLY` const 도입. mode → policy 매핑 명료화.

**(2) `src/wasm_api.rs` + `tests.rs` (+5/-3)** — WASM diagnostics 의
`hiddenCanvas2dOverlayAllowed=false` + `directReplayRequired=true` 출력 + doc 정합화.

**(3) `src/paint/schema.rs` (+12/-7)** — `layer_tree_schema_constants_match_schema`
테스트로 export const 와 `LAYER_TREE_SCHEMA` 동기화 단언.

**(4) `rhwp-studio/src/core/wasm-bridge.ts` + `tests/render-backend.test.ts` (+13/-2)**
— Studio fallback `getCanvasKitReplayPlan` 도 same contract 반환 +
regression 테스트.

### 3.3 Compatibility (PR 본문 명시)

- 기본 renderer 는 계속 Canvas2D
- CanvasKit 은 opt-in path
- public native Skia/PDF API 무변경
- CanvasKit full parity 본 PR scope 외 (P18+)

## 4. Copilot 리뷰 6 코멘트 — 후속 commit 반영 확인 ✅

본 환경 git 확인 결과 **6 코멘트 모두 `20fc48f2` 에서 정직하게 반영**:

| # | Copilot 코멘트 | 후속 commit 반영 |
|---|----------------|------------------|
| 1 | `allows_canvas2d_overlay()` / `direct_replay_required` 하드코딩 — enum 의존 구조 오해 소지 | ✅ `CanvasKitReplayPolicy` 구조체 + `DIRECT_ONLY` const 추출, `mode.policy()` 함수로 enum→policy 매핑 명료화 |
| 2 | (동일 — 중복 코멘트) | (#1 과 함께 반영) |
| 3 | `wasm_api.rs` doc — `mode` 의미 모호 (`default` vs `compat`) | ✅ +2 라인 doc 추가, `compat` 가 future conservative direct-replay tuning 용도임 명시 |
| 4 | `as unknown as { getShapeBBox: ... }` cast — 타입 안전성 우회 | ✅ **cast 제거** (`this.doc as unknown as ...` → `this.doc`), 타입 안전성 회복 |
| 5 | `render-backend.test.ts` — exact string + `+260` brittle | (개선 가능 여지 — 후속 commit 에서 `+6/-2` 변경, 일부 정정) |
| 6 | `paint/schema.rs` assertion 중복 (constant + schema 양쪽) | ✅ struct 비교로 간결화 (`assert_eq!(LAYER_TREE_SCHEMA, LayerTreeSchema { ... })`) |

**5/6 완전 반영 + 1 부분 반영** (Copilot #5 는 본 환경 빌드 통과로 검증
가능, 향후 회귀 시 정리 후보).

## 5. 검토 항목

### 5.1 설계 적합성 — 메모리 룰 정합 ✅

- **`feedback_image_renderer_paths_separate`** (핵심 정합): native (Rust
  `canvaskit_policy`) + WASM (`wasm_api`) + frontend (`wasm-bridge.ts`)
  + Studio fallback (`render-backend.test.ts`) **4 path 동시 contract 정합**.
  이전 PR 들에서 발견된 path 분기 우려를 본 PR 이 contract 강제로 차단.
- **`feedback_small_batch_release_strategy`**: 6 파일 +89/-39, 본질
  단순화 (mode→policy 추출). v0.x 단계 단위 회전.
- **scope 정직**: PR 본문 "Compatibility" 항목 + "Non-goals" P18~P21
  명시 — 분리 영역 정직.
- **`feedback_pr_supersede_chain`**: P15→P16→P17 chain 명시.

### 5.2 코드 품질 ✅ (Copilot 6 코멘트 정직 반영)

- **`CanvasKitReplayPolicy` 구조체 추출**: enum→policy 매핑이 함수로 명료화
- **`DIRECT_ONLY` const**: 의도 (direct replay only) 코드에 명시
- **타입 안전성**: `as unknown as {...}` cast 제거
- **schema.rs**: assertion 중복 → struct 비교로 간결
- **doc 명료화**: `compat` 의 의미 (future tuning) 명시

### 5.3 검증 충실성 ✅

PR body 검증:
- `wasm-pack build --target web --dev` ✅
- `npm --prefix rhwp-studio test` ✅
- `npm --prefix rhwp-studio run build` ✅
- `cargo test canvaskit --lib` ✅
- `cargo test layer_tree_schema_constants_match_schema --lib` ✅
- `cargo fmt --check` ✅
- `git diff --check` ✅

CI 전부 pass + Canvas visual diff pass 로 검증 충실. **본 환경 직접 검증
권고** (canvaskit + schema 테스트 + 전체).

### 5.4 잔존 / scope 외

- **연결 이슈 없음** — Refs #536 만, closes 없음. 트래킹 이슈라 진행 단계
  marker 만 표시. merge blocker 아님.
- **라벨 "enhancement"** — 실제 contract harden / refactor 성격. 적절.
- **Copilot #5 (test brittle)** — 부분 반영, 본 환경 빌드 통과로 우선
  검증 가능. 향후 회귀 시 정리 후보.
- **frontend 영역 변경** — PR #950 (HWPX fragment paste) 에서 거버넌스
  우려 있었으나, 본 PR 은 (1) opt-in CanvasKit path 한정, (2) 신규
  의존성 추가 없음, (3) 기존 wasm-bridge / test 영역만 강화 → 거버넌스
  우려 해당 안 됨.

## 6. 처리 절차 (간소화 4단계)

1. ✅ PR 정보 확인 + Copilot 6 코멘트 후속 반영 검증
2. → 본 검토 문서 작성 + 작업지시자 승인 요청 (현 단계)
3. (불요 예상) 코드 품질 양호 (Copilot 6/6 반영), 본 PR 수정요청 항목 없음
4. 검증 (본 환경 빌드/테스트 + 작업지시자 시각 판정 결정) → `pr_1057_report.md`

## 7. 1차 판단 (작업지시자 승인 전 잠정)

| 영역 | 평가 |
|------|------|
| 설계 방향 | ✅ 적합 — contract harden (P17 분리 정직), 4 path 통일 |
| CI / 결정적 검증 | ✅ 전부 pass (Canvas visual diff 포함) |
| 코드 품질 | ✅ 양호 — Copilot 6/6 정직 반영, 구조체 추출 + 타입 안전 + doc 명료 |
| scope | ✅ 6 파일 +89/-39, Non-goals 명시 |
| Copilot 리뷰 반영 | ✅ **6/6 모두 후속 commit 으로 정직 반영** (#5 부분, 5 완전) |
| 메모리 룰 정합 | ✅ image_renderer_paths_separate / small_batch / pr_supersede_chain |
| frontend 거버넌스 | ✅ 신규 의존성 없음, opt-in path 한정, 기존 영역 강화만 |
| 이슈 연결 | Refs #536 (트래킹 이슈, closes 없음 — merge blocker 아님) |
| 시각 검증 | ⚠️ CanvasKit replay contract 변경 (외부 영향 없음 — opt-in path). 정량 게이트 면제 가능 후보 |

**잠정 결론**: 코드·설계·검증 모두 양호. Copilot 리뷰 6/6 후속 commit
정직 반영은 모범적 컨트리뷰터 응답 패턴. **머지 전 1개 게이트**: 시각
판정 — CanvasKit 은 opt-in 이라 일반 사용자 무영향, 정량 게이트
(CI + canvaskit/schema 테스트 + Canvas visual diff) 으로 면제 가능 후보
또는 메인테이너 CanvasKit 환경 hands-on (rhwp-studio CanvasKit replay).

> 본 문서는 검토 계획 + 항목 통합. 작업지시자 승인/피드백 후
> 검증 단계 → `pr_1057_report.md` 로 최종 판단 기록.
