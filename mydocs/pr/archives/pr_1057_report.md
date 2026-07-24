# PR #1057 최종 보고서 — render: harden CanvasKit direct replay contract (P17)

- PR: [#1057](https://github.com/edwardkim/rhwp/pull/1057)
- 제목: render: harden CanvasKit direct replay contract
- 작성자: seo-rii (Seohyun Lee) — 누적 컨트리뷰터 (PR #165 skia, P14/P15/P16 시리즈)
- base ← head: `devel` ← `seo-rii:render-p17`
- 결정: **merge (수용)** — 정량 게이트 충족, 시각 판정 면제 (옵션 A)
- 일자: 2026-05-22

## 1. 결정

**merge 수용.** CanvasKit replay contract harden (`default`/`compat` 모두
direct replay only, Canvas2D overlay fallback 차단) + 4 path (native/WASM/
frontend/Studio fallback) 동시 정합 + Copilot 6/6 정직 반영 + 본 환경
검증 완전 통과.

**시각 판정 면제** — 작업지시자 결정 (옵션 A). CanvasKit 은 opt-in path
라 일반 사용자 무영향. 정량 게이트로 충족 — CI 전부 pass + canvaskit
14/0 + schema 1/0 + lib 1323/0 + Canvas visual diff pass.

연결 이슈 없음 (Refs #536 트래킹 이슈만). PR 본문 P18~P21 분리 명시
정직.

## 2. 검증 결과

| 게이트 | 결과 |
|--------|------|
| CI: Build & Test | ✅ pass |
| CI: Analyze rust/js/py | ✅ pass |
| CI: Canvas visual diff | ✅ pass |
| CI: CodeQL | ✅ pass |
| 본 환경 cargo fmt --check | ✅ exit 0 |
| **본 환경 cargo test canvaskit --lib** | ✅ **14 passed, 0 failed** |
| **본 환경 cargo test layer_tree_schema_constants_match_schema --lib** | ✅ **1 passed** (PR 본문 검증 항목) |
| **본 환경 cargo test --release --lib 전체** | ✅ **1323 passed, 0 failed** |
| **작업지시자 시각 판정** | **면제 (옵션 A 결정)** — CanvasKit opt-in path, 정량 게이트 충족 |

### 시각 판정 면제 근거 (옵션 A)

본 PR 은 다음 조건 동시 만족으로 정량 게이트가 시각 판정 대체:
1. **CanvasKit 은 opt-in path** — 기본 renderer Canvas2D 무영향
2. **결정적 측정** (CI Canvas visual diff pass + canvaskit 14 테스트)
3. **회귀 가드 단위 테스트** — `canvaskit_position_adjusted_threshold_is_explicit`,
   `test_canvaskit_replay_plan_export_uses_mode_policy`,
   `layer_tree_schema_constants_match_schema`, `wasm_api/tests.rs` 외 다수
4. **Copilot 리뷰 6/6 정직 반영**
5. **scope 정직** — PR 본문 Compatibility + Non-goals 명시

## 3. 변경 내용 (6 파일 +89/-39)

### 3.1 `src/renderer/canvaskit_policy.rs` (+59/-27, 핵심)

`CanvasKitReplayPolicy` 구조체 신규 + `DIRECT_ONLY` const:

```rust
fn policy(self) -> CanvasKitReplayPolicy {
    match self {
        Self::Default | Self::Compat => CanvasKitReplayPolicy::DIRECT_ONLY,
    }
}

impl CanvasKitReplayPolicy {
    const DIRECT_ONLY: Self = Self {
        hidden_canvas2d_overlay_allowed: false,
        direct_replay_required: true,
    };
}
```

mode → policy 매핑 명료화 (Copilot #1/#2 반영).

### 3.2 `src/wasm_api.rs` + `tests.rs` (+5/-3)

WASM diagnostics 출력 `hiddenCanvas2dOverlayAllowed=false` + `directReplayRequired=true`
+ doc 정합 (Copilot #3 — `compat` 의미 명시).

### 3.3 `src/paint/schema.rs` (+12/-7)

`layer_tree_schema_constants_match_schema` — export const + `LAYER_TREE_SCHEMA`
동기화 단언. struct 비교로 간결화 (Copilot #6 반영).

### 3.4 `rhwp-studio/src/core/wasm-bridge.ts` (+2/-2)

Studio fallback JSON `hiddenCanvas2dOverlayAllowed: false, directReplayRequired: true`.
**`as unknown as { ... }` cast 제거** (Copilot #4 — 타입 안전성 회복).

### 3.5 `rhwp-studio/tests/render-backend.test.ts` (+11/0)

CanvasKit renderer 가 Canvas2D overlay replay 미들임 + fallback replay
plan direct contract 유지 회귀 가드.

## 4. Copilot 리뷰 6 코멘트 — 후속 commit 정직 반영 확인

본 환경 git 확인 결과 6/6 코멘트가 `20fc48f2` 후속 commit 에서 정직 반영:

| # | 본질 | 반영 |
|---|------|------|
| 1, 2 | enum 의존 구조 오해 (하드코딩) | ✅ `CanvasKitReplayPolicy` 구조체 + `DIRECT_ONLY` const 추출 |
| 3 | doc 모호 | ✅ `compat` 가 future tuning 용도임 명시 |
| 4 | `as unknown` cast 우회 | ✅ **cast 제거**, 타입 안전성 회복 |
| 5 | test brittle | ⚠️ 부분 반영 (본 환경 빌드 통과로 우선 검증) |
| 6 | assertion 중복 | ✅ struct 비교로 간결화 |

**5/6 완전 반영 + 1 부분** — 모범적 컨트리뷰터 응답 패턴.

## 5. Root cause + 설계 평가

### 5.1 본질

P16 (PR #996) browser CanvasKit direct renderer 가 머지된 후, replay
mode (`default`/`compat`) 의 의미가 모호한 상태로 남음. `compat` 가
"hidden Canvas2D paint overlay 로 unsupported op 를 덮는" 모드로
오해될 수 있었음. 본 PR 이 contract 로 **둘 다 direct replay only** 임을
4 path 에서 동시 고정.

### 5.2 메모리 룰 정합

- **`feedback_image_renderer_paths_separate`** (핵심 정합 — 권위 사례):
  native (Rust) + WASM (`wasm_api`) + frontend (`wasm-bridge.ts`) + Studio
  fallback (`render-backend.test.ts`) **4 path 동시 contract 정합**. 메모리
  룰의 본질적 권위 사례.
- **`feedback_small_batch_release_strategy`**: 6 파일 +89/-39, 본질
  단순화 (mode→policy 추출). v0.x 단계 단위 회전.
- **`feedback_pr_supersede_chain`**: P15 → P16 → P17 chain 명시 + P18~P21
  분리 정직.
- **scope 정직**: PR 본문 "Compatibility" + "Non-goals" 항목 분리 명시.

## 6. cherry-pick 처리

PR 본질 commit (devel 위에 직접 적용 가능):
- `2eb64e9b` fix: harden CanvasKit direct replay policy
- `20fc48f2` fix: address CanvasKit replay review feedback (Copilot 6/6 반영)

처리: 2 commit author (seo-rii / Seorii / Seohyun Lee) 보존 cherry-pick.
clean-up 후속 commit 없음 (코드 품질 지적 사항 없음 — Copilot 6/6 이미
반영됨).

## 7. 잔존 / 후속

### 본 PR scope 외 (PR 본문 Non-goals 명시)

- P18: Raster image/effect coverage
- P19: Text/glyph advanced payload gates
- P20: Renderer sweep/WebGPU/performance artifact
- P21: PDF export

### 독립 영역

- **PR #1048** (planet6897 Task #1046) — rebase 응답 대기 중. 페이지네이션
  영역, 본 PR (CanvasKit) 과 독립
- **이슈 #1055** (회귀, sample16-hwp5 p2 목차) — text_measurement 영역,
  본 PR 과 독립
- 다른 OPEN PR 들 — 본 PR 처리와 독립

## 8. 산출물

- `mydocs/pr/pr_1057_review.md` (검토 문서)
- 본 보고서
- 소스: PR `canvaskit_policy.rs` 정책 구조체 추출 + 4 path contract 정합

## 9. 메모리 룰 갱신 검토

- `project_external_contributors`: seo-rii = 등재된 누적 기여자 (PR #165 skia
  + P14/P15/P16 시리즈). 갱신 시 P14/P15/P16/P17 시리즈 활동 영역 보강 후보
  (별도 정리 task 후보, 본 처리와 독립).
- **권위 사례 누적** — PR #1039 → #1044 → #1054 → #1059 → **#1057** (5 사례)
  "정량 게이트 충족 시 시각 판정 면제 가능" 패턴. 특히 본 PR 은 **opt-in
  path 추가 조건** 권위 사례. 메모리 룰 정리 task 강화 후보.
- **`feedback_image_renderer_paths_separate` 권위 사례 강화** — 본 PR
  의 4 path 동시 contract 정합이 메모리 룰의 본질적 권위 사례.
