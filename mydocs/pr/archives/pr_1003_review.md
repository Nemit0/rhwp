# PR #1003 검토 — Task #990: 빈 문단 위 treat-as-char 글상자 advance 이중 가산 정정

- 작성일: 2026-05-20
- 컨트리뷰터: [@planet6897](https://github.com/planet6897) (Jaeuk Ryu)
- PR: https://github.com/edwardkim/rhwp/pull/1003
- base/head: `devel` ← `planet6897:pr-task990` (cross-repo fork)
- 연결 이슈: closes #990 (빈 문단 위 treat-as-char 글상자 advance 이중 가산)
- 규모: +470 / -24, 8 files (소스 1 + 회귀 테스트 1 + 문서 6)
- mergeable: **CONFLICTING**
- 본질 커밋: 3개 (`69d71897` Stage 2 + `eec4781f` Stage 2 v2 + `d53e31b4` Stage 3) — 모두 작성자 @planet6897

## 1. 컨트리뷰터 사이클

@planet6897 = 15+ PR 핵심 컨트리뷰터. 동시 OPEN PR **3건** (#1003 + #1004 + #1024). #1002(closes #990 동일 이전 제출) **CLOSED** → #1003 재제출. devel = `b5d38346` (#1021 머지 포함).

## 2. ⚠️ PR #1004 와의 관계 (선후 결정 핵심)

| PR | 영역 | 규모 |
|----|------|------|
| **#1003** | Task #990 단독 | +470/-24, 8 파일 |
| **#1004** | Task #990 + Task #991 (분할 표 렌더링) | +1292/-26, 23 파일 |

**#1004 가 #1003 을 완전 포함 + Task #991 추가**. `feedback_small_batch_release_strategy` 정합 (작은 단위 우선) → **#1003 먼저 머지 → #1004 는 #991 부분만 재제출** 권고.

## 3. 본질 변경

### Root cause (PR 본문)

bisect 결과 Task #974 commit `c3e32151` ("Fix textbox picture rendering", 본 환경 PR #1013 머지) 가 `layout_shape_item()` 에 `Control::Shape` 분기를 신규 추가하면서 발생:

- 빈 문단 호스트는 `FullParagraph` PageItem 의 `layout_paragraph()` 가 이미 LINE_SEG advance(`lh+ls`) 마침
- `Shape` PageItem 분기가 `result_y = shape_y + line_advance.max(shape_h)` 로 또 advance → 이중 가산 (132.88px = 66.44px × 2)

### Fix — `has_full_para_item` case-specific 가드

`layout_shape_item()` 의 `!has_real_text` 분기에서 해당 문단에 `PageItem::FullParagraph` 가 발행되었는지 판별:

- **있으면 (빈 문단 호스트)**: 글상자를 호스트 문단 시작에 배치 + `result_y` 재진행 생략 → 이중 가산 제거
- **없으면 (선행 표 등에 이어 붙은 Shape, 예: `hy-001` pi=27)**: Task #974 동작 유지

### 회귀 가드 좌표 정정

`tests/issue_table_vpos_01_page5_cell_hit_test.rs` — `table-vpos-01.hwp` 5쪽 `pi=33` (빈 문단 + treat-as-char 도형) 이 본 정정과 동일 코드 경로. 이중 가산 재발 시 셀 hit-test 실패. `pi=33` 정정으로 `pi=34` 표가 30.84px 상향 이동 → inner 11x3 좌표 8건 정정 (기존 stale 값 = 커밋 `c2d2157d` 가 #974 버그 레이아웃에 박제).

## 4. PR #1005 격차 D 와의 관계 (핵심 인사이트)

PR #1005 (Task #1001 종합 fix) 의 **격차 D 후속 정정 커밋 `4e3ad587`** 이 동일 영역(`layout_shape_item` 의 `result_y` 계산) 을 revert 함. PR #1005 보고서 명시: "격차 D breathing room 은 variant flag 를 layout 까지 thread 한 후 variant-only 분기 적용 (PR #1005 scope 외)".

**본 PR #1003 이 PR #1005 격차 D scope 외 분리의 정밀 해결**:
- PR #1005 (격차 D revert): `result_y = shape_y + line_advance.max(shape_h)` 단순 복원 (table-vpos-01 회귀 차단)
- PR #1003: `has_full_para_item` 조건으로 분기 — 빈 문단 호스트만 차단, 선행 표 이어붙은 Shape 는 Task #974 동작 유지

variant 무관 일반 가드 (`has_full_para_item`) 로 두 케이스 양립 — `feedback_hancom_compat_specific_over_general` 정합.

## 5. 검토 의견

### 강점

1. **bisect 정확** — Task #974 `c3e32151` 회귀 식별 + 박제 stale 값 명시 (회귀 가드 좌표 정정 근거)
2. **case-specific 가드** — `has_full_para_item` 조건으로 두 케이스(빈 문단 호스트 vs 선행 표 Shape) 분리 + Task #974 의도 보존 명시
3. **PR #1005 격차 D scope 외 후속** — variant 무관 일반 가드로 정밀 해결. PR #1005 보고서의 후속 영역 합치
4. **광범위 sweep** — 14 샘플 회귀 0 (PR 본문), hy-001 Task #974 동작 보존 + `issue_table_vpos_01_page5_cell_hit_test` 영구 회귀 가드
5. **회귀 가드 좌표 정정 명시** — stale 값 인정 + 정정 레이아웃 정합 명시 (메인테이너 검증 시 좌표 8건 정합 확인 가능)
6. cargo test 1483 + clippy 0 + fmt clean (PR 본문)

### ⚠️ 핵심 쟁점

#### (A) PR #1004 와 영역 중복 — 선후 결정

#1004 가 #1003 을 완전 포함 + Task #991 추가. `feedback_small_batch_release_strategy` 정합 → **#1003 먼저 머지 권고** (작은 단위, 단일 책임). #1004 는 #991 부분만 재제출.

#### (B) CONFLICTING — devel 적층 (PR #1005/#1018/#1019 보류/#1020/#1021)

devel 에 PR #1005 격차 D revert(`4e3ad587`) 포함. `layout.rs` 의 동일 영역(`layout_shape_item`) 변경 충돌 가능. cherry-pick 시 해소 필요 — PR #1005 revert + PR #1003 case-specific 가드를 결합한 형태 가능 (논리적 양립).

#### (C) 회귀 가드 좌표 정정 — 8건

`tests/issue_table_vpos_01_page5_cell_hit_test.rs` 8건 좌표 정정. PR 본문 stale 값 명시이나 sweep 으로 cell_hit_test 통과 + 다른 fixture 무회귀 확인 필수.

#### (D) 비공개 픽스처

PR 본문 "비공개 문서로 RED 재현, 비공개 자료라 커밋 안 함" — `feedback_self_verification_not_hancom` / `feedback_visual_judgment_authority` 보완. `tests/issue_table_vpos_01_page5_cell_hit_test` 영구 회귀 가드가 대체 역할. 작업지시자 시각 판정 게이트.

#### (E) `feedback_push_full_test_required` 정합 (신규 메모리, 2026-05-20)

cargo test --tests 전체 통합 테스트 + fmt --check 필수 — PR 본문 1483 (lib + integration) 명시 확인.

### 확인 필요 (검증 단계)

1. cherry-pick 3 커밋 순차 — layout.rs PR #1005 영역 충돌 해소 (PR #1003 case-specific 가드로 양립)
2. `cargo test --release --lib` 1307 + `cargo test --release --tests` 전체 통합 + clippy -D + fmt 0 (push 전 필수)
3. **광범위 sweep** — hy-001 (Task #974 동작 보존), table-vpos-01 (회귀 가드), sample16-hwp5 (PR #1005 변환본), 일반 fixture 회귀 부재
4. WASM + 작업지시자 시각 판정 — table-vpos-01 cell_hit_test + 일반 무회귀

## 6. 처리 옵션

- **옵션 A (수용 — 권고)**: bisect 정확 + case-specific 가드 + PR #1005 후속 정밀 해결. 작업지시자 시각 판정 통과 시. #1004 와 영역 중복 → #1003 먼저 머지 후 #1004 재제출 안내
- **옵션 B (수정 요청)**: 다른 fixture 회귀 또는 #1005 와 양립 충돌 시 — 조건 강화 또는 영역 좁힘 요청
- **옵션 C (close)**: 본질 결함 시. 해당 낮음 (실제 결함 + 정확한 진단)

## 7. 메모리 룰 정합

- `feedback_contributor_cycle_check` — @planet6897 15+ PR 핵심 컨트리뷰터, #1002→#1003 재제출, #1004/#1024 시리즈
- `feedback_small_batch_release_strategy` — #1003 < #1004 → 작은 단위 먼저 권고
- `feedback_hancom_compat_specific_over_general` — case-specific 가드 (`has_full_para_item`) 정합
- `feedback_pr_supersede_chain` — #1005 격차 D revert 후속 정밀 해결
- `feedback_fix_scope_check_two_paths` — 빈 문단 호스트 + 선행 표 Shape 두 경로 양립
- `feedback_diagnosis_layer_attribution` — bisect 로 Task #974 `c3e32151` root cause 정확 진단
- `feedback_v076_regression_origin` — Task #974 회귀 정확 식별
- `feedback_visual_judgment_authority` — 비공개 픽스처 부재 → 영구 회귀 가드 + 작업지시자 시각 판정 보완
- `feedback_self_verification_not_hancom` — 비공개 픽스처 + PR 본문 자기 보고 + sweep 보완
- `feedback_push_full_test_required` (신규) — cargo test --tests 전체 + fmt --check 필수
- `project_output_folder_structure` — sweep 산출물 output/poc/pr1003 배치

## 8. 권고

**옵션 A 조건부** — bisect 정확 + case-specific 가드 + PR #1005 후속 정밀 해결 우수. 검증 단계에서 (1) cherry-pick 3 커밋 layout.rs 충돌 해소, (2) cargo test --lib + --tests + clippy + fmt 전체 검증, (3) sweep (hy-001 + table-vpos-01 + sample16-hwp5 + 일반), (4) WASM + 작업지시자 시각 판정 통과 시 cherry-pick no-ff merge. #1004 는 본 PR 머지 후 #991 부분 재제출 안내.
