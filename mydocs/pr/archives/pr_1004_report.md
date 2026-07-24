# PR #1004 처리 보고서 — 표·글상자 레이아웃 정합 — Task #990 + Task #991 통합

- 처리일: 2026-05-20
- 컨트리뷰터: [@planet6897](https://github.com/planet6897) (Jaeuk Ryu)
- 결정: **옵션 A (수용)** — 작업지시자 승인 + 시각 판정 통과
- 머지: (no-ff, local/devel → devel)
- 본 PR Task #990 부분 = PR #1003 머지로 흡수, **Task #991 3 커밋 + fmt 1 만 실효 적용**

## 1. 결정 사유

@planet6897 15+ PR. 검토 단계에서 옵션 C(close) 권고했으나 작업지시자 옵션 A 결정. 처리 결과 **Task #991 부분이 case-specific 분할 표 정정 효과 입증** — aift 4 페이지 (p.14/45/56/69) 분할 표 정합 개선, 다른 fixture 무영향. PR #1024 (분할 표 RowCut 모델, +5912/-1742) 처리 전 Task #991 휴리스틱 정정 우선 적용.

## 2. 처리 내역 (4 본질 커밋 cherry-pick)

| 커밋 (cherry-pick 후) | 내용 |
|------|------|
| `99f26958` (Task #991) | 분할 셀 줄 범위 — 끝 페이지 패스 유도로 중복·누락 해소 (table_layout.rs) |
| `35afc779` (Task #991) | 1행 글자처럼취급 표 분할 금지 — 통째 다음 페이지 이동 (typeset.rs) |
| `0f188491` (Task #991) | 쪽 분할 표 직후 문단 vpos 팬텀 해소 (layout.rs) |
| `0d9a7c1d` (fmt) | table_layout.rs rustfmt 정리 |

모두 작성자 @planet6897 메타데이터 보존.

### Task #990 영역 자동 흡수

본 PR head 의 Task #990 3 커밋 (`69d71897` + `eec4781f` + `d53e31b4`) 는 PR #1003 머지 (`c2024ec9`) 본과 동일. cherry-pick 시도하지 않음 (이미 devel 적용).

### 충돌 해소 — task_m100_991 문서 AA 5건 `--ours`

@jangster77 의 이슈 #991 (composer marker synthesis, 이미 CLOSED) 가 같은 task 번호 사용으로 devel 에 `task_m100_991*.md` 5건 존재. @planet6897 의 분할 표 작업은 같은 task 번호인데 본질이 완전 다른 작업. 해소:

- `task_m100_991.md` / `_impl.md` / `_stage1.md` / `_stage2.md` / `_stage3.md` 5건 AA → **`--ours` (jangster77 머지본 보존)**
- @planet6897 신규 문서 (v2/_impl_v2/_impl_v3/_impl_v4/_impl_v5/_stage2_v2/_stage3/_stage4) 는 v 접미사 신규 파일로 추가

같은 task 번호의 두 컨트리뷰터 작업 공존 — 향후 task 번호 충돌 방지 권고 영역.

## 3. 변경 본질

### Task #991 분할 표 렌더링 정합 (PR 본문 인용)

- **분할 셀 줄 범위 중복·누락**: `compute_cell_line_ranges` 를 끝 페이지 패스(prefix 패스) 유도 방식으로 정정. 분할 끝/시작 페이지가 동일 기준 공유.
- **1행 글자처럼취급 표 분할 금지**: 행 경계가 없는 1행 `treat_as_char` 표는 인트라-셀 분할 대신 통째로 다음 페이지/단 이동.
- **쪽 분할 표 직후 문단 vpos 팬텀 해소**: 분할 표 호스트 문단 LINE_SEG 가 표 높이를 반영하지 못해 직후 문단이 표 높이만큼 추가 점프하던 결함을, 직전 항목이 `PartialTable` 이면 vpos 보정 건너뛰어 정정.

## 4. 자기 검증 (`feedback_push_full_test_required` 정합)

| 항목 | 결과 |
|------|------|
| `cargo test --release --lib` | 1307 passed |
| `cargo test --release --tests` | 전체 통합 통과 |
| `cargo clippy --release --lib -D warnings` | 통과 |
| `cargo fmt --check` | exit 0 |
| WASM 빌드 (Docker) | 4.83 MB, rhwp-studio/public 동기화 |

## 5. sweep 검증 (10 fixture, BEFORE devel `c2024ec9` ↔ AFTER) — case-specific 입증

| Fixture | 결과 | 판정 |
|---------|------|------|
| hy-001 HWPX/HWP5, table-vpos-01 HWPX/HWP | **diff=0** | 무회귀 |
| sample16-hwp5/hwp3, exam_kor/math, biz_plan | **diff=0** | 무회귀 |
| **aift (p.14, 45, 56, 69)** | **4 diff** | 의도된 분할 표 정합 개선 (작업지시자 시각 판정 통과) |

**핵심 입증**: PR Task #991 변경이 **분할 표 보유 페이지에만 영향** (aift 4 페이지), 일반 fixture 무영향 — case-specific 동작.

## 6. 작업지시자 시각 판정 — 통과

aift 4 페이지 분할 표 정합 개선 — **시각 판정 통과**.

## 7. PR #1024 관계 안내 (후속)

PR #1024 (closes #1022, 분할 표 RowCut 이산 모델 + LAYOUT_OVERFLOW 42→12, +5912/-1742, 68 files) 가 본 PR Task #991 영역의 발전형. PR #1024 본문 자인:

> "동일 계열(분할 표 렌더링)인 open PR #1004(#990/#991)와 일부 겹칩니다."

본 PR 머지로 Task #991 휴리스틱 정정 적용 → PR #1024 처리 시 RowCut 모델로 일반화 (#1024 의 후속 자동 흡수). **#1024 처리 시 본 PR 변경 영역 충돌 가능성 — 컨트리뷰터에게 #1024 rebase 후 영역 차이만 남기는 형태 권고**.

## 8. 메모리 룰 정합

- `feedback_contributor_cycle_check` — @planet6897 동시 OPEN 시리즈 (#1003 머지 / #1004 본 머지 / #1024 후속)
- `feedback_pr_supersede_chain` — #1003 + 본 PR + #1024 분리 패턴
- `feedback_small_batch_release_strategy` — 작은 단위 우선 (#1003 → 본 PR Task #991 만 → #1024 발전형)
- `feedback_hancom_compat_specific_over_general` — Task #991 휴리스틱 정정 (case-specific) → #1024 RowCut 모델 일반화
- `feedback_visual_judgment_authority` — aift 4 페이지 작업지시자 시각 판정 통과
- `feedback_fix_scope_check_two_paths` — 분할 표 정합 layout/table_layout/typeset 3 경로 모두 정정
- `feedback_push_full_test_required` (신규, 2026-05-20) — cargo test --tests 전체 + fmt --check 필수 정합
- `project_output_folder_structure` — sweep 산출물 output/poc/pr1004 배치

## 9. task 번호 충돌 영역 (메모)

본 PR 처리 중 발견 — @jangster77 (이슈 #991 composer marker, CLOSED) 와 @planet6897 (분할 표 렌더링, 본 PR) 가 **같은 task 번호 `m100_991` 을 다른 본질로 사용**. devel `mydocs/plans/task_m100_991*.md` (jangster77) 와 본 PR (planet6897) 충돌 → `--ours` 로 jangster77 보존 + planet6897 신규 문서는 v2/v3/v4/v5 접미사로 추가. 컨트리뷰터에게 향후 task 번호 충돌 방지 가드 권고.
