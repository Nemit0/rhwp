# PR #1107 최종 보고 — Task #1105: 3 task 누적 (HWP3→HWP5 페이지 정합)

## 1. 결정

**merge 수용** — 검증 6/6 통과, CI 전부 pass, 3 task 통합 처리, 회귀 가드 동반.

| 항목 | 내용 |
|------|------|
| PR | [#1107](https://github.com/edwardkim/rhwp/pull/1107) |
| 작성자 | jangster77 (Taesup Jang) — HWP3 영역 핵심 컨트리뷰터 (13+ 사이클) |
| 통합 task | Task #1042 (Stage 1~6c) + Task #1086 + Task #1105 |
| 변경 | +6003 / -210, 68 files, 37 commits |
| merge 방식 | merge commit (37 commits 보존) |
| 자동 처리 | PR #1085 / #1103 superseded close (동일 commit 포함) |

## 2. 검증 결과 (메인테이너 재검증)

PR head (`pr-1107-head`) 직접 체크아웃 후 로컬 검증:

| 항목 | 명령 | 결과 |
|------|------|------|
| issue #1105 회귀 가드 | `cargo test --release --test issue_1105` | ✅ **14/14 PASS** |
| issue #1086 회귀 가드 | `cargo test --release --test issue_1086` | ✅ **4/4 PASS** |
| lib 전체 | `cargo test --release --lib` | ✅ **1382 passed / 0 failed** |
| 통합 tests | `cargo test --release --tests` | ✅ FAILED 없음 |
| clippy | `cargo clippy --release --lib -- -D warnings` | ✅ clean |
| fmt | `cargo fmt --all --check` | ✅ clean |
| CI (GitHub Actions) | Build & Test / CodeQL / Canvas visual diff / Analyze | ✅ 전부 pass |

작성자 검증 보고 (lib 1336) 와 메인테이너 재검증 (lib 1382) 일치 + origin/devel 최근
사이클 통합도 정합 — **회귀 없음 확인**.

## 3. 3 task 통합 본질

### 3.1 Task #1042 (Stage 1~6c) — HWP3→HWP5 multi-fixture alignment

5 fixture (sample16-hwp5 변환기/2010/2018/2022/2024) 의 한컴 정답 정합:

- **Stage 1**: 진단 — 변환기/2010/2018/2024 = 64 정합, 2022 만 +1 회귀
- **Stage 2**: `variant_vpos_reset_break` narrow guard v2 (heading 만 page break)
- **Stage 5**: HWP5 variant paragraph vpos normalize (`parser/mod.rs::normalize_variant_paragraph_vpos`)
- **Stage 6a/b/c**: `recompose_for_cell_width` 확장 (composer + paragraph_layout + typeset + height_measurer)

### 3.2 Task #1086 — 한컴오피스 기준 페이지네이션 정정

- k-water-rfp 페이지 수 정합
- hwpspec 페이지 수 정합
- hwpspec 확장 control figure next page 가드

### 3.3 Task #1105 — HWP3 변환본 page break 정합

- HWP3 사각 bullet 문자 한컴 표시 정합
- sample16 2010/2018/2022/2024 변환본의 23쪽 내부 page break 정합
- 정상 HWP5 의 `reflowLinesegs()` no-op guard (불필요 LINE_SEG 재생성 방지)
- `tests/issue_1105.rs` 293 lines (14 회귀 가드)

## 4. 변경 영역 매트릭스

| 영역 | 파일 수 | 주요 |
|------|--------|------|
| src/parser/ | 4 | hwp3/johab + hwpx/section + parser/mod (variant vpos normalize 신규) + body_text |
| src/renderer/ | 9 | typeset (+482) + pagination/engine (+280) + height_measurer + composer + 등 |
| src/document_core/ | 2 | queries/rendering (+171) + commands/document |
| tests/ | 17 | diag_1042_*.rs 14개 + issue_1086 + issue_1105 + 기존 회귀 가드 갱신 |
| 신규 fixture | 6 | hwp3-sample16-hwp5-{2010,2018,2022,2024}.hwp + pdf 정답 2 |
| 문서 | 26 | task_m100_1042/1086/1105 plans + stages + reports |

## 5. 호환성 평가

- 일반 fixture 12종 baseline 유지 (작성자 보고 + 메인테이너 재검증)
- 모든 sample16 fixture (5종) 64 페이지 정합
- examples/* (measure_section caller) 갱신 — API 호환
- `normalize_variant_paragraph_vpos` 는 HWP5 variant 전용 — 일반 HWP5 영향 없음

## 6. 처리

- PR head 직접 검증 → 모두 통과 → CI 통과 → admin merge (BEHIND 우회)
- GitHub PR merge (merge commit, 37 commits 보존 — stage 별 영역 가시화)
- review/report → `mydocs/pr/archives/` 이동
- **PR #1085 / #1103 superseded close** (동일 commit 포함 명시 comment)
- 이슈 #1105 (+ #1042 / #1086) close

## 7. 메모리 룰 정합

- ✅ `feedback_contributor_cycle_check` — jangster77 HWP3 영역 핵심 컨트리뷰터 (13+ 사이클)
- ✅ `feedback_pr_supersede_chain` — **(c) 머지+회귀 정정 후속 PR 통합 패턴** 적용
- ✅ `feedback_pr_comment_tone` — 반복 컨트리뷰터, 차분한 사실 중심 close 메시지
- ✅ `feedback_release_sync_check` — 작성자가 다수 sync 진행 (commit history)
- ✅ `feedback_push_full_test_required` — lib + tests + clippy + fmt 모두 통과
- ✅ `feedback_small_batch_release_strategy` — 3 task 누적 (작은 단위 일괄 통합)

## 8. 후속

- 본 PR merge 후 `pr/pr_1107_review.md` + `pr_1107_report.md` → `pr/archives/` 이동
- PR #1085 (Task #1042) close + comment
- PR #1103 (Task #1086) close + comment
- 이슈 #1105 / #1042 / #1086 close
- 광범위 영역 → 후속 작업지시자 시각 판정 + 외부 PR 사이클 영역 확인
