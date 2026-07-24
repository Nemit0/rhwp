# PR #1003 처리 보고서 — Task #990: 빈 문단 위 treat-as-char 글상자 advance 이중 가산 정정

- 처리일: 2026-05-20
- 컨트리뷰터: [@planet6897](https://github.com/planet6897) (Jaeuk Ryu)
- 결정: **옵션 A (수용)** — 작업지시자 승인 + **비공개 샘플 기반 PR로 시각 판정 생략 수용**
- 머지: (no-ff, local/devel → devel)
- closes #990

## 1. 결정 사유

@planet6897 15+ PR 핵심 컨트리뷰터. Task #974 (`c3e32151`, 본 환경 PR #1013) 회귀 정정 — bisect 정확 + `has_full_para_item` case-specific 가드 + PR #1005 격차 D scope 외 후속 정밀 해결. 작업지시자 명시 "비공개 샘플로 테스트 한 것으로 시각 판정 없이 수용" — `tests/issue_table_vpos_01_page5_cell_hit_test` 13 passed + sweep 정량 입증.

## 2. 처리 내역 (3 본질 커밋 cherry-pick, 모두 작성자 @planet6897)

| 커밋 (cherry-pick 후) | 내용 |
|------|------|
| `d7663dd4` (Stage 2) | 빈 문단 위 글상자 advance 이중 가산 제거 (v1: y_offset 조건) — layout.rs 충돌 `--theirs` 해소 |
| `a4a3647a` (Stage 2 v2) | `has_full_para_item` 정밀화 (FullParagraph 항목 유무) — 충돌 없음 |
| `97c49944` (Stage 3) | 검증 + table-vpos 회귀 테스트 좌표 8건 정정 — 충돌 없음 |

**충돌 해소**: `src/renderer/layout.rs` 1개 (PR #1005 격차 D revert와 동일 영역) → Stage 2 `--theirs` 적용 후 Stage 2 v2가 정밀 가드로 자동 보완.

## 3. 변경 본질

### Root cause (PR 본문, bisect)

Task #974 commit `c3e32151` (본 환경 PR #1013 머지) 가 `layout_shape_item()` 에 `Control::Shape` 분기를 신규 추가하면서 발생:
- 빈 문단 호스트는 `FullParagraph` PageItem 의 `layout_paragraph()` 가 이미 LINE_SEG advance(`lh+ls`) 마침
- `Shape` PageItem 분기가 `result_y = shape_y + line_advance.max(shape_h)` 로 또 advance → **이중 가산 (66.44 → 132.88px)**

### Fix — `has_full_para_item` case-specific 가드

`layout_shape_item()` 의 `!has_real_text` 분기에서 해당 문단에 `PageItem::FullParagraph` 가 발행되었는지 판별:

- **있으면 (빈 문단 호스트)**: 글상자를 호스트 문단 시작에 배치 + `result_y` 재진행 생략 → 이중 가산 제거
- **없으면 (선행 표 등에 이어 붙은 Shape, hy-001 pi=27 등)**: Task #974 동작 유지

Task #974 의 `set_inline_shape_position` 등록 의도 보존.

### PR #1005 격차 D scope 외 후속 (핵심 인사이트)

PR #1005 격차 D revert (`4e3ad587`) 가 동일 영역을 `result_y = shape_y + line_advance.max(shape_h)` 단순 복원 (table-vpos-01 회귀 차단) + "variant flag thread 후 variant-only 분기 (PR #1005 scope 외)" 명시. **본 PR #1003 이 variant 무관 일반 가드 (`has_full_para_item`) 로 두 케이스 양립** — `feedback_pr_supersede_chain` + `feedback_hancom_compat_specific_over_general` 정합.

### 회귀 가드 좌표 정정

`tests/issue_table_vpos_01_page5_cell_hit_test.rs` 8건 좌표 정정 — `pi=33` (빈 문단 + treat-as-char 도형) 정정으로 `pi=34` 표 30.84px 상향 이동. 기존 stale 값 = 커밋 `c2d2157d` 가 #974 버그 레이아웃에 박제. PR 본문 명시.

## 4. 자기 검증 (`feedback_push_full_test_required` 정합)

| 항목 | 결과 |
|------|------|
| `cargo test --release --lib` | 1307 passed |
| `cargo test --release --tests` | 전체 통합 테스트 통과 (FAILED 0) |
| `cargo test --release --test issue_table_vpos_01_page5_cell_hit_test` | **13 passed** (좌표 8건 정정 정확성 입증) |
| `cargo clippy --release --lib -D warnings` | 통과 |
| `cargo fmt --check` | exit 0 |
| WASM 빌드 (Docker) | 4.83 MB, rhwp-studio/public 동기화 |

## 5. sweep 검증 (10 fixture, BEFORE devel `b5d38346` ↔ AFTER)

| Fixture | 결과 | 판정 |
|---------|------|------|
| **hy-001 HWPX/HWP5 (Task #974 동작 보존 핵심)** | **diff=0** | ✅ Task #974 의도 보존 (PR 본문 약속 정합) |
| **table-vpos-01 HWPX/HWP** | 4 same, 1 diff | 의도된 변경 (pi=33→pi=34 30.84px 상향, 회귀 가드 좌표 정정 정합) |
| **sample16-hwp5/hwp3** | 외곽선만 이동, **텍스트 무변동** (비-도형 diff=0) | ✅ PR #1005 격차 D revert 정밀화 효과 |
| **aift** (page 25/36) | 2 diff | 의도된 변경 (빈 문단 위 글상자 advance 정정으로 후속 paragraph 위치 정합) |
| exam_kor / biz_plan / 복학원서 | diff=0 | ✅ 무회귀 |

## 6. 작업지시자 결정 — 시각 판정 생략 수용

작업지시자 명시: "이번 PR은 비공개 샘플로 테스트 한 것으로 메인테이너의 시각판정없이 수용". 근거:
- 비공개 fixture로 PR 본질 RED 재현 + 정정
- 영구 회귀 가드 `issue_table_vpos_01_page5_cell_hit_test` 13 passed
- sweep 무회귀 입증 (hy-001 보존, sample16 외곽선만, 의도된 변동 fixture만 diff)
- cargo test 전체 통합 + clippy + fmt + WASM 빌드 통과
- PR #1005 후속 정밀 해결 (`feedback_pr_supersede_chain` 정합)

## 7. PR #1004 안내 (후속 처리)

PR #1004 (Task #990 + #991 통합, +1292/-26, 23 files) 가 본 PR을 완전 포함. 본 PR 머지 후 **#1004 는 Task #991 부분만 재제출 필요** — 컨트리뷰터 안내. `feedback_small_batch_release_strategy` 정합.

## 8. 메모리 룰 정합

- `feedback_contributor_cycle_check` — @planet6897 15+ PR 핵심 컨트리뷰터, #1002→#1003 재제출, #1004/#1024 시리즈
- `feedback_small_batch_release_strategy` — #1003 작은 단위 먼저 머지 → #1004 #991 부분만 재제출 안내
- `feedback_hancom_compat_specific_over_general` — `has_full_para_item` case-specific 가드 (Task #974 의도 보존)
- `feedback_pr_supersede_chain` — PR #1005 격차 D revert 후속 정밀 해결 (권위 사례)
- `feedback_fix_scope_check_two_paths` — 빈 문단 호스트 + 선행 표 Shape 두 경로 양립
- `feedback_diagnosis_layer_attribution` — bisect 로 Task #974 `c3e32151` root cause 정확 진단
- `feedback_v076_regression_origin` — Task #974 회귀 정확 식별
- `feedback_visual_judgment_authority` — 비공개 픽스처 부재 → 영구 회귀 가드 + sweep 정량 + 작업지시자 결정 생략 수용
- `feedback_self_verification_not_hancom` — 비공개 픽스처 + PR 본문 자기 보고 + sweep 보완
- **`feedback_push_full_test_required`** (신규, 2026-05-20) — cargo test --tests 전체 + fmt --check 필수 정합
- `project_output_folder_structure` — sweep 산출물 output/poc/pr1003 배치
