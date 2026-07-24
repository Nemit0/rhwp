# PR #570 처리 보고서 — 핀셋 cherry-pick 머지 + 시각 판정 ★ 통과

**PR**: [#570 Task #568: 인라인 표(분수)+수식 단락 우측 편위 정정 (closes #568)](https://github.com/edwardkim/rhwp/pull/570)
**작성자**: @planet6897 (PR 등록) / Jaeook Ryu = @jangster77 (commit author)
**처리 결정**: ✅ **핀셋 cherry-pick 머지 + push + PR close**
**처리일**: 2026-05-05

## 1. 처리 결과 요약

| 항목 | 결과 |
|------|------|
| 결정 | ✅ 핀셋 cherry-pick (`1f187cf9` 단독) + devel merge + push + PR close |
| 시각 판정 | ★ **통과** (exam_science 12번 응답 분수 인라인 정합 회복) |
| Devel merge commit | `8719a03` |
| Cherry-pick 충돌 | 0 건 (PR mergeable=CONFLICTING 표시는 PR base 시점 차이) |
| Author 보존 | ✅ Jaeook Ryu (@jangster77) 보존 |
| Issue #568 | CLOSED (수동 close + 안내 댓글) |
| 광범위 페이지네이션 sweep | 164 fixture / 1,614 페이지 / 페이지 수 회귀 0 |

## 2. 본질 결함 (PR 진단)

### 2.1 결함 가설

`paragraph_layout.rs::layout_composed_paragraph` L857 의 `effective_col_x / effective_col_w` 분기가 인라인 TAC 표 보유 줄의 `comp_line.segment_width` 무시. col_area.width(31692 HU)로 `available_width` 산출 → Justify slack 과대 → `extra_word_spacing` 80 px/space 로 부풀어 인라인 표 **+175 px 우측 편위** (exam_science.hwp pi=61 12번 응답 분수).

### 2.2 본질 메커니즘

HWP 는 인라인 TAC 표가 있는 줄의 segment_width 를 표 폭 + 잔여로 좁게 인코딩 (wrap=TopAndBottom 영향). 이 줄에서 layout 이 컬럼 전체 폭(407.5 px)으로 `available_width` 를 잡으면, Justify slack(~160 px)이 선두 공백 2 개에 80 px/space 분배되어 그 다음 인라인 표를 ~175 px 우측으로 민다.

### 2.3 정량 측정

- exam_science.hwp pi=61 인라인 분수 x: **739.87 → 584.93** (편위 +175 px → ±5-10 px 잔여)

## 3. 단일 룰 확장 + 케이스별 명시 가드

### 3.1 분기 조건 확장

| 기존 | 정정 후 |
|------|--------|
| `has_picture_shape_square_wrap` 만 LINE_SEG.cs/sw 분기 진입 | `has_picture_shape_square_wrap \|\| line_has_inline_tac_table` (OR 결합) |

→ Picture/Shape Square wrap 분기와 동일한 LINE_SEG.cs/sw 사용 패턴 재사용 + 인라인 TAC 표 케이스 추가 (단일 룰 확장).

### 3.2 임계값 가드

| 기존 | 정정 후 |
|------|--------|
| `sw < col_w_hu - 200` | `sw + cs < col_w_hu - 200` |

→ 단락 들여쓰기를 LINE_SEG.column_start 로 인코딩한 paragraph 의 정상 full-width line 미진입 보장 (`feedback_rule_not_heuristic` 정합).

## 4. PR 의 5 commits 분석 (cherry-pick 대상 식별)

| commit | 설명 | 본 환경 처리 |
|--------|------|-------------|
| `00011fba` Stage 0 — 수행 계획서 | 컨트리뷰터 fork 보고서 | 무관 |
| `98688cdd` Stage 1 — 정밀 진단 (코드 무수정) | 컨트리뷰터 fork 보고서 | 무관 |
| `8d012074` Stage 2 — 구현 계획서 | 컨트리뷰터 fork 보고서 | 무관 |
| **`1f187cf9` Stage 3 — 본질 정정** | `paragraph_layout.rs` +25/-2 + working stage3 | ⭐ cherry-pick |
| `fa9367de` Stage 4 — 최종 보고서 + orders | 컨트리뷰터 fork report + orders | 무관 |

→ 본질 1 commit 만 cherry-pick. PR #561/#564/#567 와 동일 패턴.

## 5. cherry-pick 진행

### 5.1 대상 commit (1개, 충돌 0)

```
9c6e79f Task #568 Stage 3: layout_composed_paragraph 분기 확장 (인라인 표+수식 단락 우측 편위 정정)
```

`Jaeook Ryu <jaeook.ryu@gmail.com>` author 보존.

### 5.2 변경 영역

| 파일 | 변경 |
|------|------|
| `src/renderer/layout/paragraph_layout.rs` | +25 / -2 (분기 확장 + 임계값 보정 + 줄 단위 인라인 TAC 표 검출) |
| `mydocs/working/task_m100_568_stage3.md` | +166 (Stage 3 작업 보고서) |

## 6. 결정적 검증 결과

| 게이트 | 결과 |
|--------|------|
| `cargo build --release` | ✅ Finished |
| `cargo test --lib --release` | ✅ **1131 passed** / 0 failed / 2 ignored (회귀 0) |
| `cargo test --test svg_snapshot` | ✅ 6/6 passed |
| `cargo test --test issue_546` | ✅ 1 passed (Task #546 회귀 0) |
| `cargo test --test issue_554` | ✅ 12 passed |
| `cargo clippy --release --lib` | ✅ 0건 |
| Docker WASM 빌드 | ✅ **4,570,901 bytes** (1m 29s, PR #564 baseline +286 bytes — paragraph_layout.rs +25/-2 LOC 정합) |

## 7. 광범위 페이지네이션 회귀 sweep

본 환경 `samples/` 폴더 전체 자동 sweep:

| 통계 | 결과 |
|------|------|
| 총 fixture | **164** (158 hwp + 6 hwpx) |
| 총 페이지 (devel baseline) | **1,614** |
| 총 페이지 (cherry-pick 후) | **1,614** |
| **fixture 별 페이지 수 차이** | **0** |
| Export 실패 fixture | 0 |
| 측정 도구 | `./target/release/rhwp export-svg` (60s timeout / fixture) |

→ **164 fixture / 1,614 페이지 / 페이지 수 회귀 0**. 분기 확장 (`line_has_inline_tac_table`) + 임계값 보정 (`sw + cs < col_w_hu - 200`) 의 column_start 인코딩 정상 paragraph 미진입 보장이 광범위 sweep 으로 정량 입증.

## 8. exam_science byte 차이 (PR 본문 100% 재현)

| 페이지 | byte 차이 | 평가 |
|------|---------|------|
| page 1 | identical | ✅ PR 본문 정합 |
| **page 2** | **differ** | ✅ PR 본문 권위 영역 (12번 응답 분수 정정) |
| page 3 | identical | ✅ PR 본문 정합 |
| page 4 | identical | ✅ PR 본문 정합 |

→ PR 본문 "page 1/3/4 byte-identical, page 2 의도된 정정만 diff" 본 환경에서 정확히 재현.

## 9. 시각 판정 (★ 게이트)

### 9.1 SVG 자료 + WASM 환경

- `output/svg/pr570_before/exam_science/` (devel 기준, 4 페이지)
- `output/svg/pr570_after/exam_science/` (cherry-pick 후, 4 페이지)
- WASM: `pkg/rhwp_bg.wasm` 4,570,901 bytes (다양한 hwp 직접 검증용)

### 9.2 작업지시자 시각 판정 결과

> 메인테이너의 시각 검증 통과되었습니다.

첨부 이미지 (exam_science 12번 문항) 의 인라인 분수 (`1g의 A에 들어 있는 중성자수 / 1g의 D에 들어 있는 중성자수`) 가 본문 흐름에 자연스럽게 배치된 정합 회복 확인. PR 본문 측정 (pi=61 x=739.87 → 584.93, +175 px 우측 편위 → ±5-10 px 잔여) 의 시각적 효과 입증.

→ ★ **통과**.

## 10. PR / Issue close 처리

### 10.1 PR #570 close
- 댓글 등록 (cherry-pick 결과 + 결정적 검증 + 광범위 sweep + 시각 판정 + 단일 룰 확장 정합 + 미해결 영역 안내 + 컨트리뷰터 협업 인정)
- close 처리

### 10.2 Issue #568 수동 close
- PR close 가 자동 close 트리거하지 않아 (PR #564 와 동일 패턴) 수동 close + 안내 댓글
- "PR #570 cherry-pick 처리 완료 (devel merge `8719a03`). 시각 판정 ★ 통과 + 광범위 페이지네이션 회귀 sweep 0 (164 fixture / 1,614 페이지). exam_science 12번 응답 분수 인라인 위치 정합 회복 확인" 안내

## 11. 미해결 영역 (PR 본문 명시, 별도 task 후보)

본 PR 은 인라인 표 + 수식 + **narrow segment_width** 조합만 정정. 다음은 다른 메커니즘:

- **Page 1 header sub-tables LEFT-shift** — 외곽 1×1 표 cell halign=Center 미적용
- **Page 3/4 보기 셀 분수 단락 (13/15/16/19번)** — 셀 paragraph segment_width=full → 본 fix 임계값 미충족
- **페이지 쪽번호 색·굵기** — 바탕쪽 CharShape

→ 별도 후속 task 로 다룰 영역.

## 12. 메모리 정합

- ✅ `feedback_visual_regression_grows` — 시각 판정 게이트 정합 운영 (★ 통과)
- ✅ `feedback_v076_regression_origin` — 정밀 진단 (Justify slack 과대 + 80 px/space 메커니즘 명시) 정합
- ✅ `feedback_hancom_compat_specific_over_general` — 단일 룰 확장 (Picture/Shape Square wrap 패턴 재사용) + 케이스별 명시 가드 (line_has_inline_tac_table)
- ✅ `feedback_rule_not_heuristic` — 임계값 가드 명시 (sw+cs < col_w_hu - 200) — 측정 의존 휴리스틱이 아닌 규칙
- ✅ `feedback_pdf_not_authoritative` — 권위는 작업지시자 한컴 환경
- ✅ `feedback_per_task_pr_branch` — Task #568 단일 본질 PR 정합
- ✅ `feedback_pr_comment_tone` — close 댓글 차분/사실 중심 + 컨트리뷰터 협업 인정
- ✅ `feedback_check_open_prs_first` — PR OPEN 상태 확인 후 진행
- ✅ `feedback_small_batch_release_strategy` — 본 사이클 (5/1 ~ 5/5) 활발한 외부 기여의 빠른 회전 (15번째 PR 처리)

## 13. 본 사이클 사후 처리

- [x] PR #570 close (cherry-pick 머지 + push)
- [x] Issue #568 수동 close (안내 댓글)
- [x] 처리 보고서 (`mydocs/pr/archives/pr_570_report.md`, 본 문서)
- [ ] 검토 보고서 archives 이동 (`mydocs/pr/pr_570_review.md` → `mydocs/pr/archives/pr_570_review.md`)
- [ ] 5/5 orders 갱신 (PR #570 항목 추가)
