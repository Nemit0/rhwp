# PR #1040 검토 — Task #1037: HWP5 변환본 ParaShape unit normalize + Dialog 한컴 정합 fix

- PR: [#1040](https://github.com/edwardkim/rhwp/pull/1040)
- 작성자: @jangster77 (Taesup Jang) — 30번째 기여 (PR #1036 직후 후속)
- closes #1037 (M100, v1.0.0 — HWP5 변환본 paragraph height 과대 측정 p21 alignment + p23 overflow)
- base: devel (PR base 시점 `bbd38e85` = PR #1033 머지 후, 현재 origin/devel = `402e0ce6` = PR #1036 머지 후 + #59efa47e docs)
- head: local/task1037 → fork merge `fefe9849` (merge devel into local/task1037)
- mergeable: **CONFLICTING** (PR #1036 머지 후 회복 필요)
- CI: ✅ 모두 통과 (Build & Test / CodeQL / Canvas visual diff)
- 변경 규모 (PR #1036 본질 차감 후 진짜 신규): **+41/-6**, 3 코드 파일
- 일시: 2026-05-21

## 1. 컨트리뷰터 사이클 + 시리즈 위치 (`feedback_contributor_cycle_check`)

@jangster77 30번째 PR. HWP3 sample16 정합 시리즈 (#1031/#1034/#1036) 후속, Task #1037 잔존 본질 해결:

- PR #1031 (closes #1029) — HWP3 외곽선 paper-edge 회귀 정정
- PR #1034 (closes #1008) — HWP3 sample16 Shape/Text 4 격차
- PR #1036 (closes #1035) — HWP3 vs HWP5 변환본 페이지 alignment 24/64 → 60/64 (방금 머지)
- **PR #1040 (closes #1037)** — HWP5 변환본 paragraph height 본질 정정 + Dialog 한컴 정합

PR #1036 의 잔존 후속 (PR 본문 + Task #1035 stage4 명시 "HWP5 변환본 paragraph height 가 HWP3 의 약 2배" 별도 issue).

## 2. 이슈 #1037 배경 — PR #1036 잔존 본질

PR #1036 (Task #1035) 의 alignment 60/64 (93.75%) 달성 후 잔존:

- 미정합 4 페이지 (p21 등) + p23 외곽선 overflow
- 본질: **HWP5 변환본 paragraph height 가 HWP3 의 약 2배** (font/spacing metric 차이)

Task #1037 Stage 1 진단 (PR commit `028f9788`):
- HWP5 변환본 LineSegs.len() = 0 (모든 paragraph, encoder typeset 안 함)
- CharShape base_size: HWP3 1000 → HWP5 1300 (+30%)
- **ParaShape spacing_before: HWP3 1132 → HWP5 2264 (×2)** ← 본 PR 본질
- composer fallback synth line_height + corrected_line_height Percent → 2× 라인 높이

## 3. 코드 본질 분석 — Task #1037 진짜 신규 (3 파일)

PR head 는 PR #1036 본질 (engine.rs / typeset.rs / pagination.rs / rendering.rs / tests/issue_1035) 을 포함 (Task #1035 Stage 1~4 commits) — **PR #1036 머지 후 본 PR 의 진짜 신규는 3 코드 파일**:

### 3.1 `src/parser/mod.rs` (+16)

`is_hwp3_variant` 확인 직후 ParaShape margin/indent/spacing 값을 절반으로 normalize:

```rust
// [Task #1037] ParaShape unit semantic normalize — HWP3 → HWP5 변환본은
// 한컴 변환기가 ParaShape 의 margin/indent/spacing 값을 2× 로 저장 (raw
// HWPUNIT 의 2배). ... 변환본 식별 직후 ParaShape 의 raw 값을 절반으로
// normalize 하여 모든 후속 코드 (dialog, rendering, dump) 가 일관된 값 사용.
for ps in &mut doc.doc_info.para_shapes {
    ps.margin_left /= 2;
    ps.margin_right /= 2;
    ps.indent /= 2;
    ps.spacing_before /= 2;
    ps.spacing_after /= 2;
}
```

**근거**: 한컴 변환기 quirk — HWP3 → HWP5 변환 시 ParaShape 의 margin/indent/spacing 을 raw 의 2배로 저장. parser 단계 일괄 normalize 로 후속 모든 컴포넌트 (dialog, rendering, dump) 가 일관된 값 사용.

### 3.2 `src/renderer/style_resolver.rs` (+5/-4)

종전 case-specific `variant_div=4` → uniform `variant_div=2`:

```rust
// [Task #1037] HWP5 변환본 의 추가 2배 스케일 (총 4배) 은 parser 단계
// (parser/mod.rs) 에서 normalize (halve) 되어 본 단계에서는 normal HWP5
// 동등 (2배 스케일) — uniform variant_div=2 적용.
let _ = is_hwp3_variant;
let variant_div = 2.0;
```

→ Task #1001 의 4배 보정이 raw 값 normalize 후 normal HWP5 동등 처리로 통일.

### 3.3 `src/document_core/commands/formatting.rs` (+20/-1)

`build_para_properties_json` 의 dialog margin/indent 산식을 raw_ps 직접 사용 + variant 분기:

```rust
// [Task #1037] dialog 표시 한컴 정합:
// - margin/indent 는 raw_ps 직접 사용 (variant_div 미적용)
// - HWP3 native: raw margin_left 는 continuation 라인 position 으로 저장 →
//   한컴 dialog "왼쪽 여백" 은 effective first-line position 으로
//   (margin_left + min(0, indent)) 변환
// - HWP5 변환본 (is_hwp3_variant=true): Task #1037 parser normalize 후 raw 는
//   한컴 dialog 표준 의미로 정합 → 직접 사용
let is_variant = self.document.is_hwp3_variant;
let effective_left_hu = if is_variant {
    raw_left_hu
} else {
    raw_left_hu + raw_indent_hu.min(0)
};
let dialog_margin_left_px = crate::renderer::hwpunit_to_px(effective_left_hu, self.dpi);
```

## 4. 효과 (PR 본문 명시)

sample16 p452 / p97 동일 paragraph 비교:

| 필드 | 한컴 정답 | Task #1037 이전 | Task #1037 완료 |
|------|---------|---------------|-----------------|
| dialog 왼쪽 | 40.0 pt | HWP3 30 / HWP5 20 | 40 / 40 ✓ |
| dialog 오른쪽 | 10.0 pt | 5 / 5 | 10 / 10 ✓ |
| dialog 내어쓰기 | 20.0 pt | 10 / 10 | 20 / 20 ✓ |
| dialog 문단 위 | 8.5 pt | HWP3 8.6 / HWP5 17.0 (2×) | 8.6 / 8.6 ✓ |
| 페이지 수 | 64 | HWP3 64 / HWP5 64 | 64 / 64 ✓ |
| alignment (PR #1036) | — | 60/64 | 60/64 유지 ✓ |

작업지시자 시각 검증 (PR 본문 명시) — "(3) 원격지 재해복구센터(DR: Disaster Recovery) 구축" paragraph 에서 한컴 / rhwp HWP3 / rhwp HWP5 변환본 dialog 완전 정합.

## 5. 본 환경 dry-run 검증 (Stage 2 일부)

| 항목 | 결과 |
|------|------|
| PR head 3 본질 파일 → origin/devel 적용 | 충돌 없음 (formatting.rs / parser/mod.rs / style_resolver.rs) |
| cargo build --lib | OK |

전체 검증 (Stage 3) 은 작업지시자 옵션 승인 후.

## 6. PR 본문 명시 — Stage 4 D 옵션 negative result

Task #1037 Stage 4 평가 후 채택 안 한 옵션 (PR 본문 명시):
- page break vpos==0 휴리스틱: Recall 31.6%, FP 4개 (부적합)
- p23 overflow line_seg 합성 옵션 B': Task #1010 Stage 2 회귀 (88 페이지 +24)
- 잔존 2 이슈 (p23 overflow + page_break_before 손실) 별도 task 분리

코드 변경 없음 — negative result (가치 있는 진단).

## 7. 자동 검증 (PR 본문)

- cargo build --release ✓ warning 0
- cargo clippy --release --lib -- -D warnings ✓ clean
- cargo fmt --all -- --check ✓ clean
- cargo test --release --lib ✓ 1308 passed
- cargo test --release --tests ✓ FAILED 0
- 회귀 sweep 변환본 9종 + HWP3 + 일반 fixture: 페이지 수 무변동
- CI 모두 SUCCESS (Build & Test / CodeQL / Canvas visual diff)

## 8. 코드 품질 평가

### 8.1 강점

- **parser 단계 normalize**: 한컴 변환기 quirk 를 데이터 진입 시점에 일괄 보정 → 후속 컴포넌트 (dialog, rendering, dump) 가 일관된 값 사용 (path 일관성)
- **is_hwp3_variant 가드** (`feedback_hancom_compat_specific_over_general`): 일반 HWP 무영향, 변환본 한정 정정
- **style_resolver case-specific 제거**: 종전 `variant_div=4` (Task #1001) 의 임시 보정 패턴 → uniform `=2` 단순화
- **Dialog 정합 정량 검증**: 한컴 정답지 vs rhwp HWP3/HWP5 변환본 4 필드 (왼쪽/오른쪽/내어쓰기/문단위) 완전 정합 (PR 본문 표)
- **rendering 무변동**: spacing_before /2 + variant_div /2 = 종전 /4 와 동등 (Task #1001 보정 유지) → 페이지 수 64 유지 + alignment 60/64 유지
- **PR #1036 양립**: 본 PR 의 진짜 신규 3 코드 파일이 PR #1036 본질과 분리 — cherry-pick 가능
- **Stage 4 negative result 명시**: D 옵션 평가 후 코드 변경 없음 + 잔존 2 이슈 별도 task 분리 권고

### 8.2 우려

- **mergeable CONFLICTING**: PR #1036 머지 후 회복 필요. 옵션 A (3 코드 파일 cherry-pick squash) 추천
- **PR base 차이**: bbd38e85 (PR #1033 머지 후) → origin/devel 402e0ce6 (#1026/#1032/#1034/#1047/#919/#1036/#59efa47e docs 추가). 본질 3 파일은 충돌 없음
- **회귀 가드 부재**: Task #1037 본질 (dialog 한컴 정합) 의 자동 회귀 가드 없음 (PR #1036 의 `tests/issue_1035_alignment.rs` 는 이미 머지). 후속 dialog 회귀 가드 권고
- **Assignee 부재**: Issue #1037 assignee 비어 있음 (`feedback_assign_issue_before_work` — 단, 외부 컨트리뷰터 PR 이미 진행 중이라 일차 방어선 적용 시점 지남)
- **잔존 후속**: p23 overflow + page_break_before 손실 별도 issue 등록 권고 (PR 본문 명시)

## 9. 옵션 권고

| 옵션 | 설명 | 위험 | 권고 |
|------|------|------|------|
| **A. 본질 3 코드 파일 cherry-pick squash + sweep + 시각 판정** | PR #1036 본질 차감 후 진짜 신규 3 파일 (parser/mod.rs + style_resolver.rs + formatting.rs) + 문서 9 파일 (Task #1037 plans/working/report) 만 origin/devel 위에 squash 적용 | **낮음** — parser 단계 normalize 가 후속 path 일관성 보장, rendering 무변동 입증 (PR 본문) | **권고** |
| B. supersede 요청 (rebase) | 컨트리뷰터에게 PR base 갱신 (origin/devel `402e0ce6`) 후 재제출 | 매우 낮음 — 명시적 base 정합 | 본 PR 본질 3 파일 충돌 없으므로 불필요 절차 |
| C. 보류 (Dialog 회귀 가드 추가까지) | 본 PR 의 dialog 정합 효과를 자동 회귀 가드 (tests/issue_1037_dialog.rs) 추가 요청 후 머지 | 낮음 — 회귀 가드 영구화 가치 있으나 본 PR 효과 지연 | 비권고 — 회귀 가드는 후속 PR 가능 |

## 10. 메모리 룰 정합

- ✅ `feedback_self_verification_not_hancom` — 본 환경 정량 입증 + 작업지시자 시각 판정 필요
- ✅ `feedback_visual_judgment_authority` — PR 본문 명시 "작업지시자 시각 검증 (3) 원격지 재해복구센터 paragraph 한컴/rhwp HWP3/HWP5 변환본 dialog 완전 정합"
- ✅ `feedback_hancom_compat_specific_over_general` — `is_hwp3_variant` 가드 (일반 HWP 무영향, parser 단계 case-specific)
- ✅ `feedback_pr_supersede_chain` — PR #1036 (Task #1035) 잔존 후속 → PR #1040 (Task #1037) 의 잔존 본질 해결 패턴
- ✅ `feedback_push_full_test_required` — cargo test --tests + clippy + fmt 모두 통과 (PR 본문)
- ✅ `feedback_diagnosis_layer_attribution` — Stage 1 진단 (composer fallback + corrected_line_height + ParaShape ×2) root cause 정확 식별
- ✅ `feedback_contributor_cycle_check` — @jangster77 30번째 PR, HWP3 시리즈 본질 마무리
- ✅ `feedback_image_renderer_paths_separate` 정신 — parser 단계 normalize 로 모든 후속 path (dialog / rendering / dump) 일괄 정합

## 11. 작업지시자 결정 요청

| 결정 | 옵션 |
|------|------|
| 진행 여부 | A (본질 3 코드 + 문서 9 cherry-pick squash + sweep + 시각 판정) / B (supersede) / C (보류) |
| sweep 검증 범위 | 변환본 9종 + HWP3 + 일반 fixture / 광범위 |
| 시각 판정 | 본 환경 정량 입증 + 작업지시자 시각 판정 (sample16 paragraph dialog 한컴 정합) |
| 후속 issue | p23 overflow + page_break_before 손실 별도 등록 (PR 본문 명시) |
