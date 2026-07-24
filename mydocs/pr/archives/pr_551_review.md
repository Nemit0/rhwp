# PR #551 검토 문서

**PR**: [#551 156 commits / 39 task accumulating since e585b589](https://github.com/edwardkim/rhwp/pull/551)
**작성자**: @planet6897 (Jaeuk Ryu) — PR #538 와 동일 컨트리뷰터
**Base / Head**: `devel` ← `devel` (컨트리뷰터 fork 의 devel 브랜치)
**Linked Issue**: (PR 본문에 closes 없음, 본문에 50+ task 누적 명시)
**상태**: OPEN
**작성일**: 2026-05-03
**검토일**: 2026-05-03

## 1. 처리 결정

**작업지시자 의도**: ✅ **Task #525 만 우선 cherry-pick** (옵션 C-1).

**근거:**
1. PR #551 은 PR #538 와 동일 패턴 (fork devel 누적 — 248 commits / 50 task) 의 비정상 상태
2. **Task #525 (비-TAC Picture Square wrap 호스트 텍스트 중복 emit)** 가 메인테이너도 인지하고 있던 결함
3. Task #525 의 본질이 본 환경 Task #546 와 다름 (Task #546 = 단의 높이 계산 / Task #525 = 호스트 텍스트 중복 emit) — 두 정정 양립 가능
4. Task #525 의 영향 광범위 (7 샘플 170 페이지 중 37 페이지 / 205 dup-instances)
5. 단일 commit (`35c6c00`) 의 작은 코드 변경 (`layout.rs` +14 / -69) 으로 정합 정정

## 2. PR #551 의 비정상 상태 (Task #525 외)

| 항목 | 값 |
|------|-----|
| changedFiles | **163** |
| additions | **+23,770** |
| commits | 248 commits (devel `e585b58` 분기 후) |
| 누적 task | 50+ (Task #517 ~ #549 등) |
| PR 본문 base note | "main v0.7.3" — **잘못된 정보** (현재 main 은 v0.7.9 `0fb3e675`) |

→ 다른 task 들은 본 PR 처리 후 작업지시자 검토에 따라 결정. 현재는 **Task #525 만 본 PR 의 처리 범위**.

## 3. Task #525 의 본질

### 3.1 결함

`samples/exam_kor.hwp` / `exam_eng.hwp` / `exam_science.hwp` 등 7 샘플 170 페이지 중 **37 페이지에 호스트 텍스트 중복 emit** (총 205 dup-instances):

- exam_kor: 130 / 16 페이지
- exam_eng: 25 / 6 페이지
- exam_science: 35 / 4 페이지
- 그 외 4 샘플 잠복

호스트 paragraph 의 자기 텍스트가 두 다른 col_w (예: 422.6 vs 233.9) 정렬로 distinct x 위치 emit → **시각 중첩**.

### 3.2 근본 원인

`layout_wrap_around_paras` 가 호스트 paragraph 의 자기 텍스트도 다시 layout (Task #295 자가 wrap host 다중 줄 처리). Table Square wrap (호스트 = 표 + 빈 텍스트) 에서는 의도된 동작이지만 **Picture Square wrap (호스트 = 본문 텍스트) 에서는 정상 `PageItem::FullParagraph` 경로 (paragraph_layout.rs:822/973 `has_picture_shape_square_wrap` 분기) 와 중복 emit**.

두 곳에서 호출:
- `layout.rs:3093-3119` (`layout_shape_item` 의 PageItem::Shape 처리 흐름)
- `layout.rs:3496-3550` (`layout_column_shapes_pass` 의 컬럼 레벨 패스)

→ 동일 paragraph 가 `layout_composed_paragraph` 를 3 회 호출 받아 dup 발생.

### 3.3 정정 (`35c6c00` Stage 2)

`src/renderer/layout.rs` (+14 / -69 LOC):

- **layout.rs:3093** (`layout_shape_item`): Picture Square wrap 분기에서 `wrap_around_paras` 호출 제거 (Picture 케이스 한정, Table 케이스의 layout.rs:2555 호출은 유지)
- **layout.rs:3496** (`layout_column_shapes_pass`): wrap_around_paras 호출 제거 (typeset 경로 fallback, 본 본질로 무의미)

근거 주석:
```rust
// [Task #525] Picture Square wrap 의 호스트 paragraph 텍스트는
// 정상 PageItem::FullParagraph 경로 (layout_composed_paragraph 의
// has_picture_shape_square_wrap 분기, paragraph_layout.rs:822/973)
// 가 LINE_SEG.cs/sw 기반으로 그림 옆 (좁은) + 그림 아래 (넓은)
// 모두 처리. Table Square wrap (호스트 = 표 + 빈 텍스트) 과 달리
// Picture Square wrap 의 호스트는 본문 텍스트를 가지므로 본 wrap
// host 호출은 중복 emit (광범위 시각 결함, 7 샘플 37 페이지 영향).
// 정정으로 호출 제거. (Table 케이스의 layout.rs:2555 호출은 유지.)
```

## 4. cherry-pick 대상 (Task #525 만)

| 순서 | commit | 영역 | 변경 |
|------|--------|------|------|
| 1 | `d24a896` | 수행 계획서 | mydocs/plans/task_m100_525.md (+123) |
| 2 | `ba680bc` | Stage 1 진단 | mydocs/working/task_m100_525_stage1.md (+149) |
| 3 | `68f109b` | 구현 계획서 | mydocs/plans/task_m100_525_impl.md (+116) |
| 4 | **`35c6c00`** | **Stage 2 정정 (코드 변경)** | **`src/renderer/layout.rs` (+14 / -69)** |
| 5 | `78af341` | Stage 3 회귀 검증 | mydocs/working/task_m100_525_stage3.md (+100) |
| 6 | `ec9fe47` | Stage 4 최종 보고서 | mydocs/report/task_m100_525_report.md (+147) + orders (+6) |

**총 6 commits**. 코드 변경은 단일 파일 (`layout.rs` +14/-69, net -55 LOC). 다른 모든 commits 는 mydocs 문서.

**제외 commits** (PR #551 의 Task #525 외 영역):
- Task #524 (Square wrap 그림 anchor 위치) — 별도 결정
- Task #546 분석 + close (`94fe887`) — 본 환경 Task #546 와 본질 다름, 분석만이라 제외 정합
- Task #547 / #548 (셀 인라인 TAC Shape) — 별도 결정
- 그 외 Layout 리팩터링 (#517~#523) 과 fix 다수 (#435~#516) 등

## 5. 본 환경 사전 검증 결과

cherry-pick 시뮬레이션 (35c6c00 단독, abort) 결과:

| 게이트 | 결과 |
|--------|------|
| **Auto-merge `layout.rs`** | ✅ 충돌 0 (본 환경 Task #546 revert 와 양립) |
| `cargo build --release` | ✅ Finished |
| `cargo test --lib` | ✅ **1113 passed** (회귀 0) |
| `cargo test --test issue_546` | ✅ 1 passed |
| `cargo test --test issue_530/505/418/501` | ✅ 회귀 0 |
| `cargo test --test svg_snapshot` | ✅ **6/6 passed** |
| `cargo clippy --lib -- -D warnings` | ✅ 0 건 |
| `exam_science.hwp` 페이지 수 | ✅ **4** (Task #546 revert 효과 유지) |
| `exam_science.hwp` p2 단 0 items | ✅ 37 (정상) |

→ Task #525 정정과 Task #546 revert 가 **함께 작동**. 두 정정이 다른 영역 (Task #546 = typeset.rs `wrap_around_pic_bottom_px` / Task #525 = layout.rs `layout_wrap_around_paras` 호출 중복) 이라 양립 정합.

## 6. 검토 항목

### 6.1 코드 품질

- ✅ **본질 정합** — 작업지시자도 인지하고 있던 결함의 root cause 정확 식별
- ✅ **변경 본질 격리** — Picture 케이스만 분기 (`!treat_as_char && wrap=Square`), Table 케이스의 `layout.rs:2555` 호출은 보존
- ✅ **주석 명확** — Task #525 참조 + paragraph_layout.rs:822/973 분기 안내
- ✅ **코드 감소 net -55 LOC** — 중복 영역 제거로 코드 단순화

### 6.2 회귀 테스트 (PR #551 의 Stage 3)

- 7 샘플 170 페이지 중 168 byte-identical
- exam_science 2 페이지 의도된 정정 (회귀 시 dup 35 → 0)
- pi=37 (보고된 케이스): ls[0..7] 모든 dup 0 (직접 측정)

본 환경 sweep 결과 (cherry-pick 시뮬레이션 시점):
- cargo test --lib 1113 passed (회귀 0)
- svg_snapshot 6/6
- 다른 fixture 회귀 0

### 6.3 외부 영역 정합

- ✅ **Task #546 revert 와 양립** — 본 환경의 typeset.rs 정정 (`82e41ba` revert) 과 다른 영역
- ✅ **PR #506 (HWP 3.0 파서 + Square wrap) 와 무관** — Task #295 자가 wrap host 다중 줄 처리의 본질 결함
- ✅ **PR #531 (table_layout TAC Top caption) 와 무관** — Picture wrap=Square 영역만

### 6.4 PR #551 의 Task #525 외 영역 (제외)

PR #551 head 의 other commits (50+ task) 는 본 PR 처리 범위 외. 컨트리뷰터에게 다음 PR 분리 요청 안내.

### 6.5 외부 컨트리뷰터 점검

- ✅ @planet6897 — PR #538 에 이어 두 번째 PR
- ✅ Task #525 의 진단 깊이 정합 (광범위 fixture 검증 + dup-instances 통계)
- ⚠️ **fork devel 동기화 미실행** (PR #538 안내 사항 미적용) — 다음 PR 전 안내 재요청
- ⚠️ PR 본문의 "main v0.7.3" 표현 오류 — fork 환경 정합 점검 필요

## 7. 시각 판정 게이트

### 7.1 fixture 정합

본 환경에 모든 fixture 존재 (`samples/exam_kor.hwp`, `exam_eng.hwp`, `exam_science.hwp` 등).

### 7.2 시각 판정 절차

| 단계 | 자료 |
|------|------|
| **1차 (SVG)** | cherry-pick 후 `rhwp export-svg samples/exam_science.hwp` + `exam_kor.hwp` 등 비교 |
| **2차 (rhwp-studio)** | WASM 재빌드 + studio 동기화 후 web Canvas 시각 확인 |

### 7.3 판정 항목

- exam_kor.hwp / exam_eng.hwp / exam_science.hwp 의 호스트 텍스트 중복 emit (시각 중첩) 해소 확인
- 한컴 2010/2020 출력과 비교
- 본 환경 Task #546 revert 의 효과 (exam_science 4 페이지) 유지 확인

## 8. 위험 정리

| 위험 | 가능성 | 회피책 |
|------|--------|--------|
| `mydocs/orders/20260503.md` 충돌 | 🟥 거의 확실 | 양쪽 일지 통합 (PR #538 / #546 사례 정합) |
| Task #525 정정으로 다른 fixture 회귀 | 🟢 작음 | 본 환경 사전 검증 통과 + 광범위 fixture sweep (Stage 4) |
| Picture Square wrap 호스트 결함 본 정정 후 잠재 잔존 | 🟢 작음 | paragraph_layout.rs 의 has_picture_shape_square_wrap 분기가 정상 처리 (Task #525 본문 명시) |
| Task #524 (Square wrap 그림 anchor) 미적용 영향 | 🟧 중간 | Task #525 단독 적용 후 Task #524 별도 검토 |
| WASM 영향 | 🟧 중간 | 본 PR 은 native lib 변경. WASM 동일 영역 영향 받음 — 머지 전 재빌드 + 시각 판정 2차 필요 |
| 컨트리뷰터 fork 환경 미동기화 | 🟧 중간 | close 댓글에 fork devel 동기화 안내 (재요청) |

## 9. 결정

**권장**: ✅ **Task #525 cherry-pick 진행 (작업지시자 결정 정합)**.

**근거:**
1. 작업지시자도 인지하고 있던 결함의 root cause 정확 식별
2. 코드 변경 매우 작음 (+14 / -69 LOC, 단일 파일)
3. 본 환경 사전 검증 통과 (1113 / clippy 0 / svg_snapshot 6/6 / Task #546 양립)
4. 광범위 영향 (7 샘플 37 페이지 시각 결함 정정)
5. PR #551 의 다른 task (50+) 는 별도 검토 후 결정

**남은 게이트 (작업지시자):**
1. **시각 판정 1차** (SVG, CLI) — `output/svg/pr551_after/` 의 exam_kor / exam_eng / exam_science 시각 비교
2. **시각 판정 2차** (rhwp-studio web Canvas + 한컴 2010/2020) — WASM 재빌드 + studio 동기화 후
3. 시각 판정 통과 후 cherry-pick 머지

**머지 시 추가 정합 사항:**
- 이슈 close 결정 — Task #525 가 GitHub Issue 로 등록되었는지 확인 후 처리
- README 기여자 목록 (@planet6897 PR #551 누적, 본 사이클 일괄)
- 컨트리뷰터에게 fork devel 동기화 + task 별 분리 PR 안내 (close 댓글)

## 10. PR #551 의 다른 영역 처리

본 PR cherry-pick 후 close 시점에 컨트리뷰터에게 안내:
- 본 PR close 처리 (Task #525 정합한 부분만 추출)
- 다음 PR 전 fork devel 동기화 (`git pull --ff-only origin devel`) 부탁
- task 별 분리 PR 권장 (PR #538 / #551 의 큰 묶음 패턴 회피)

## 11. 메모리 정합

- ✅ `feedback_check_open_prs_first` — 본 PR 처리 정합
- ✅ `feedback_pr_comment_tone` — close 댓글 차분/사실 중심
- ✅ `feedback_release_sync_check` — cherry-pick 시점 main 동기화 점검 필수
- ✅ `feedback_v076_regression_origin` — 작업지시자 직접 시각 판정 게이트
- ✅ `feedback_visual_regression_grows` — 시각 판정 게이트 (1차 SVG + 2차 web Canvas)
- ✅ `feedback_pdf_not_authoritative` / `reference_authoritative_hancom` — 한컴 2010/2020 직접 비교
- ✅ `feedback_image_renderer_paths_separate` — 본 정정은 layout 단계, renderer 분기 영향 없음
- ✅ `feedback_hancom_compat_specific_over_general` — case-specific 정정 (Picture wrap=Square 한정)

## 12. 다음 단계

작업지시자 본 검토 문서 승인 후:

1. cherry-pick 6 commits (`d24a896` + `ba680bc` + `68f109b` + `35c6c00` + `78af341` + `ec9fe47`)
2. 충돌 해소 (`mydocs/orders/20260503.md` 양쪽 일지 통합)
3. 결정적 검증 + WASM 빌드 + studio 동기화
4. **시각 판정 1차** (SVG)
5. 통과 시 **시각 판정 2차** (rhwp-studio)
6. 통과 시 devel 머지 + push + PR close + 컨트리뷰터 안내
