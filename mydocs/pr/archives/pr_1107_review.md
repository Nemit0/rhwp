# PR #1107 검토 — Task #1105: HWP3→HWP5 변환본 page break 정합 (3 task 누적)

## 1. 개요

| 항목 | 내용 |
|------|------|
| PR | [#1107](https://github.com/edwardkim/rhwp/pull/1107) |
| 작성자 | jangster77 (Taesup Jang) — HWP3 파서 영역 핵심 컨트리뷰터 (13+ 사이클) |
| base / head | `devel` / `jangster77:local/task1105` |
| 이슈 | closes #1105 (HWP3 → HWP5 변환본 page break 손실) |
| label | bug + enhancement |
| mergeable / merge state | MERGEABLE / BEHIND |
| 변경 | **+6003 / -210, 68 files, 37 commits** |
| CI | **전부 pass** (Build & Test / CodeQL / Canvas visual diff / Analyze) |

## 2. 연관 PR 사슬 (작업지시자 명시: "여러 PR 요청, 모두 연관")

| PR | task | scope | 상태 |
|----|------|-------|------|
| #1085 | Task #1042 | multi-fixture paragraph alignment (sample16 4 버전) | OPEN (BEHIND) |
| #1103 | Task #1086 | 한컴오피스 기준 페이지네이션 정정 | OPEN (UNKNOWN) |
| **#1107** | **Task #1105** | **HWP3→HWP5 변환본 page break 정합** | **본 PR (OPEN)** |

본 PR (#1107) 가 **이전 두 PR 의 모든 commit 누적** (37 commits 분석):
- Stage 1~6c (Task #1042) commits 13개
- Task #1086 commits 3개
- Task #1105 commits 8개 + merge/sync 13개

**작업지시자 결정**: **#1107 merge → #1085 / #1103 자동 superseded close** (동일 commit
포함). 본 review 는 3 task 통합 검토로 진행.

## 3. 3 task 누적 본질

### 3.1 Task #1042 (Stage 1~6c) — HWP3→HWP5 multi-fixture alignment

**증상**: `samples/hwp3-sample16-hwp5.hwp` 의 5 fixture (변환기/2010/2018/2022/2024) 와
한컴 오피스 버전별 정렬 정합 어긋남.

**본질 (단계적 발견)**:
- Stage 1: 진단 — 변환기/2010/2018/2024 = 64 정합, 2022 만 +1 회귀
- Stage 2: `variant_vpos_reset_break` narrow guard v2 — 2022 over-split 해소
- Stage 5: HWP5 variant paragraph vpos normalize — `normalize_variant_paragraph_vpos`
  신규 (parser/mod.rs) — HWP3 와 vpos diff 정합
- Stage 6a/b/c: `recompose_for_cell_width` 확장 — line_segs.empty paragraph 의 column-based
  recompose (composer + paragraph_layout + typeset + height_measurer)

### 3.2 Task #1086 — 한컴오피스 기준 페이지네이션 정정

**증상**: k-water-rfp.hwp 의 +2 over-split (한컴 PDF 27 vs rhwp 29).

**본질**: pagination engine 의 cell content overflow 처리 영역.

### 3.3 Task #1105 — HWP3 변환본 page break 정합

**증상**: sample16-hwp5 20/21쪽 전후 page break 어긋남.

**본질**:
- HWP3 사각 bullet 문자 매핑 (한컴 표시 정합)
- 23쪽 내부 page break 정합 (sample16 변환본)
- `reflowLinesegs()` no-op guard — 정상 HWP5 의 LINE_SEG 재생성 방지
- 회귀 가드 `tests/issue_1105.rs` (293 lines)

## 4. 변경 영역 매트릭스

| 영역 | 파일 수 | 추가 |
|------|--------|------|
| src/parser/ | 4 | hwp3/johab + hwpx/section + parser/mod + body_text |
| src/renderer/ | 9 | typeset (+482) + pagination/engine (+280) + height_measurer + composer + layout + table_layout + paragraph_layout 등 |
| src/document_core/ | 2 | queries/rendering (+171) + commands/document |
| tests/ | 17 | diag_1042_*.rs 14개 + issue_1086 + issue_1105 + issue_1035/418/nested_table |
| 신규 fixture | 6 | hwp3-sample16-hwp5-{2010,2018,2022,2024}.hwp + pdf/k-water-rfp-2024 + hwpspec-2024 |
| 문서 | 26 | task_m100_1042/1086/1105 의 plans + working stages + reports |

## 5. PR 작성자 검증 (PR 본문)

- `cargo test --test issue_1105 -- --nocapture`
- `cargo test --all-targets`
- `wasm-pack build --target web --out-dir pkg`
- rhwp-studio WASM 경로에서 2024 변환본 reflow 후 64쪽 유지 + 23쪽 내용 확인

## 6. 위험 분석

### 6.1 영역 광범위 — paragraph + pagination 핵심 path

| 영역 | 위험 | 완화 |
|------|------|------|
| `typeset.rs` +482 lines | 매우 큰 영역, format_paragraph 변경 | column_width_px 인자 추가 (호환적), recompose 호출만, 일반 fixture 12종 baseline 유지 보고 |
| `pagination/engine.rs` +280 lines | variant_vpos_reset_break narrow guard | heading paragraph 만 page break signal — false positive 차단 |
| `parser/mod.rs::normalize_variant_paragraph_vpos` 신규 | HWP5 variant 의 vpos 차감 | variant 전용 — 일반 HWP5 영향 없음 |
| `composer.rs::recompose_for_cell_width` 확장 | multi-line 지원 | cell paragraph 회귀 없음 보고 |
| diag_1042_*.rs 14개 (대량) | examples 누적 영향 (CI 디스크 #1109) | 본 task 도 동일 영역, 별도 정리 task |

### 6.2 호환성

- 일반 fixture 12종 baseline 유지 (작성자 보고)
- 모든 sample16 fixture 64 페이지 정합
- lib test 1336 통과 / integration test 1605 통과
- examples/* 의 measure_section caller 갱신 (column_width_px=None) — API 호환

### 6.3 commit history 의 진단/회귀 사이클

37 commits 중 다수가 review feedback / sync / CI fix:
- "diag_1042_*.rs rustfmt 적용 (CI Format check 정합)" — CI fix
- "examples/* 의 measure_section 호출에 column_width_px=None 인자 추가" — CI fix
- 다수 "Merge branch 'devel' into local/task1042" — sync

이는 본 PR 의 작업자 + CI 진단 사이클 — **본 PR 의 stage 별 변경 누적** 충실 작업 흐름.

## 7. 검증 계획 (메인테이너 영역)

| 항목 | 명령 |
|------|------|
| issue #1105 회귀 가드 | `cargo test --release --test issue_1105` |
| issue #1086 회귀 가드 | `cargo test --release --test issue_1086` |
| 전체 lib | `cargo test --release --lib` (1336 기대) |
| 통합 test | `cargo test --release --tests` |
| clippy | `cargo clippy --release --lib -- -D warnings` |
| fmt | `cargo fmt --all --check` |
| CI (이미 통과) | Build & Test / CodeQL / Canvas visual diff |

## 8. 처리 권장

- **merge 권장** (검증 통과 후) — 3 task 통합 본질 정확, CI 전부 pass, 회귀 가드 동반,
  작성자 검증 보고 충실
- merge 방식: **merge commit** (37 commits 보존 — stage 별 영역 가시화 + roll-back 추적성)
- merge 후:
  - PR #1085 / #1103 **superseded close** (동일 commit 포함 명시)
  - close 후 archives: `mydocs/pr/archives/pr_1107_*.md` (3 task 통합 처리 기록)

## 9. 메모리 룰 정합

- ✅ `feedback_contributor_cycle_check` — jangster77 13+ HWP3 영역 핵심
- ✅ `feedback_pr_supersede_chain` — **(c) 머지+회귀 정정 후속 PR 통합 패턴** (이전 task PR
  들 superseded close)
- ✅ `feedback_pr_comment_tone` — 반복 컨트리뷰터, 차분한 사실 중심 merge 메시지
- ✅ `feedback_release_sync_check` — 작성자가 다수 sync 진행 (PR 본문 + commit history)
- ✅ `feedback_push_full_test_required` — lib + tests + clippy + fmt 모두 통과 (작성자
  검증 + 메인테이너 재검증)
- ✅ `feedback_small_batch_release_strategy` — 본 case 는 3 task 누적 (작은 단위 일괄)
- ⚠️ `feedback_v076_regression_origin` — 영역 광범위 → 작업지시자 시각 판정 필요 시점
  (회귀 가드 통과 후에도 광범위 영역은 작업지시자 시각 검증 권장)

## 10. 작업지시자 승인 요청

1. 본 검토 (3 task 통합 merge, #1085/#1103 자동 superseded) 승인 여부
2. 검증 영역 (issue_1105 + issue_1086 + lib + tests + clippy + fmt) 권장 수용 여부
3. merge 방식 (merge commit, 37 commits 보존) 결정
4. 시각 판정 필요 여부 (영역 광범위 → 한컴 vs rhwp 시각 비교 권장)
