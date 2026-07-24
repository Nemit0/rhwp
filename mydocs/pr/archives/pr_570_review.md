# PR #570 검토 보고서

**PR**: [#570 Task #568: 인라인 표(분수)+수식 단락 우측 편위 정정 (closes #568)](https://github.com/edwardkim/rhwp/pull/570)
**작성자**: @planet6897 (PR 등록) / Jaeook Ryu = @jangster77 (commit author)
**상태**: OPEN, mergeable=CONFLICTING (PR base 시점 차이 추정, 본질 cherry-pick 충돌 0 확인)
**처리 결정**: ⏳ **검토 중** (1차 검토)
**검토 시작일**: 2026-05-05

## 1. 검토 핵심 질문

1. **본질 결함 식별 정합성** — `effective_col_x / effective_col_w` 분기가 인라인 TAC 표 보유 줄의 `comp_line.segment_width` 무시 → Justify slack 과대 산출 → +175 px 우측 편위가 본 환경에서도 재현되는가?
2. **분기 확장의 회귀 위험 영역** — `has_picture_shape_square_wrap || line_has_inline_tac_table` 으로 분기 진입 케이스 확장 + 임계값 보정 (`sw < col_w_hu - 200` → `sw + cs < col_w_hu - 200`) 이 정상 paragraph 의 full-width line 미진입 보장 정합한가?
3. **광범위 sweep** — PR 본문 "7 fixture / 66 SVG byte-identical + exam_science page 1/3/4 byte-identical, page 2 의도된 정정만" 가 본 환경에서 재현되는가?

## 2. PR 정보

| 항목 | 값 | 평가 |
|------|-----|------|
| 제목 | Task #568 인라인 표(분수)+수식 단락 우측 편위 정정 | 정합 |
| author (PR 등록) | @planet6897 | — |
| commit author | Jaeook Ryu (= @jangster77) | 컨트리뷰터간 협업 흐름 (PR #561/#564/#567 패턴 동일) |
| changedFiles | 7 / +1,007 / -2 | 본질 코드 +25/-2 + 보고서 다수 |
| 본질 변경 | `src/renderer/layout/paragraph_layout.rs` +25/-2 | 단일 파일 |
| mergeable | CONFLICTING | PR base 시점 차이 추정 |
| Issue | closes #568 | ✅ |

## 3. PR 의 5 commits 분석

| commit | 설명 | 본 환경 처리 |
|--------|------|-------------|
| `00011fba` Stage 0 — 수행 계획서 | 컨트리뷰터 fork 보고서 | 무관 (본 환경 자체 보고서) |
| `98688cdd` Stage 1 — 정밀 진단 (코드 무수정) | 컨트리뷰터 fork 보고서 | 무관 |
| `8d012074` Stage 2 — 구현 계획서 | 컨트리뷰터 fork 보고서 | 무관 |
| **`1f187cf9` Stage 3 — 본질 정정** | `paragraph_layout.rs` +25/-2 + working stage3 | ⭐ **cherry-pick 대상** |
| `fa9367de` Stage 4 — 최종 보고서 + orders | 컨트리뷰터 fork report + orders | 무관 (orders 충돌 위험) |

→ **본질 cherry-pick 대상 = `1f187cf9` 단독**. PR #561/#564/#567 와 동일한 단일 본질 commit 패턴.

## 4. 본질 변경 영역

### 4.1 결함 가설

PR 본문:
> `paragraph_layout.rs::layout_composed_paragraph` L857 의 `effective_col_x / effective_col_w` 분기가 인라인 TAC 표 보유 줄의 `comp_line.segment_width` 무시. col_area.width(31692 HU)로 `available_width` 산출 → Justify slack 과대 → `extra_word_spacing` 80 px/space 로 부풀어 인라인 표 **+175 px 우측 편위** (exam_science.hwp pi=61 12번 응답 분수).

### 4.2 본질 메커니즘

> HWP 는 인라인 TAC 표가 있는 줄의 segment_width 를 표 폭 + 잔여로 좁게 인코딩 (wrap=TopAndBottom 영향). 이 줄에서 layout 이 컬럼 전체 폭(407.5 px)으로 `available_width` 를 잡으면, Justify slack(~160 px)이 선두 공백 2 개에 80 px/space 분배되어 그 다음 인라인 표를 ~175 px 우측으로 민다.

### 4.3 정정

```rust
// 기존: has_picture_shape_square_wrap 분기만 LINE_SEG.cs/sw 사용
// 정정: line_has_inline_tac_table (줄 단위, Table tac=true) 도 OR 결합

let line_has_inline_tac_table = /* Table tac=true 줄 단위 검출 */;
if has_picture_shape_square_wrap || line_has_inline_tac_table {
    // sw + cs 임계값 — 단락 들여쓰기 LINE_SEG.column_start 인코딩한
    // 정상 full-width line 미진입 보장
    if sw + cs < col_w_hu - 200 {
        effective_col_x = ...;
        effective_col_w = sw_px;
    }
}
```

**핵심 가드 정합성:**
- 임계값 `sw < col_w_hu - 200` → `sw + cs < col_w_hu - 200` 보정
- 단락 들여쓰기 (column_start 로 인코딩) 정상 paragraph 의 full-width line 미진입 보장
- Picture/Shape Square wrap 분기와 동일한 LINE_SEG.cs/sw 사용 패턴 (단일 룰 확장)

### 4.4 정량 측정

- exam_science.hwp pi=61 인라인 분수 x: **739.87 → 584.93** (편위 +175 px → ±5-10 px 잔여)

## 5. 본 환경 직접 검증 (임시 브랜치 cherry-pick test)

`pr570-cherry-test` 임시 브랜치에서 `1f187cf9` 단독 cherry-pick:

| 단계 | 결과 |
|------|------|
| `1f187cf9` cherry-pick (no-commit) | ✅ Auto-merging src/renderer/layout/paragraph_layout.rs (충돌 0) |
| `cargo test --lib --release` | ✅ **1131 passed** / 0 failed / 2 ignored (회귀 0) |
| `cargo clippy --release --lib` | ✅ 0건 |

→ **CONFLICTING 표시는 PR base 시점 차이로 추정**. 본질 commit (`1f187cf9`) 단독 cherry-pick 시 본 환경 devel 에 깨끗하게 적용 가능.

## 6. PR 본문의 자기 검증 결과

| 검증 | PR 본문 결과 | 본 환경 재검증 (임시) |
|------|---------|----------|
| `cargo test --lib` | 1125 passed, 0 failed | ✅ 1131 passed (본 환경 baseline 정합) |
| `svg_snapshot` | 6/6 passed | ⏳ 본격 검증 |
| `clippy --release` | 신규 결함 0 | ✅ 0건 |
| 광범위 sweep (7 fixture / 66 SVG) | byte-identical | ⏳ 본 환경 sweep 권장 |
| exam_science page 1/3/4 byte-identical | + page 2 의도된 정정만 diff | ⏳ 본 환경 sweep |
| 작업지시자 시각 판정 | (미진행) | ⏳ 작업지시자 시각 판정 게이트 |
| rhwp-studio web Canvas 시각 판정 (WASM) | (미진행) | ⏳ |

## 7. 메인테이너 정합성 평가

### 정합 영역
- ✅ **본질 cherry-pick 깨끗** — 충돌 0 (auto-merge)
- ✅ **결정적 검증 정합** — cargo test --lib 1131 passed (회귀 0)
- ✅ **단일 룰 확장** — Picture/Shape Square wrap 분기와 동일한 LINE_SEG.cs/sw 사용 패턴 + 인라인 TAC 표 케이스 추가 (`feedback_hancom_compat_specific_over_general` 정합 — 일반화 보다 케이스별 명시 가드 + 동일 패턴 재사용)
- ✅ **임계값 가드** — `sw + cs < col_w_hu - 200` 으로 정상 paragraph 의 full-width line 미진입 보장
- ✅ **정밀 진단 (Stage 0~2)** — Justify slack 과대 산출 + 80 px/space 부풀음 메커니즘 명시 (`feedback_v076_regression_origin` 정신 정합)
- ✅ **광범위 회귀 sweep (PR 본문)** — 7 fixture 66 SVG byte-identical (Picture wrap / equation / exam_eng/math/kor)
- ✅ **단일 파일 본질** — `src/renderer/layout/paragraph_layout.rs` +25/-2 의 작은 본질
- ✅ **하이퍼-워터폴 흐름** — Stage 0 수행 → Stage 1 진단 (코드 무수정) → Stage 2 구현 → Stage 3 본질 → Stage 4 보고. 본 환경 워크플로우 정합

### 우려 영역
- ⚠️ **CONFLICTING 표시** — PR base 시점 차이 추정 (본질 cherry-pick 충돌 0 확인됨)
- ⚠️ **분기 확장의 누적 효과** — `line_has_inline_tac_table` 으로 분기 진입 라인 케이스 확장 → narrow segment_width 가 있는 다른 인라인 TAC 표 라인 영향 가능. 광범위 sweep + 시각 판정 필수
- ⚠️ **작업지시자 시각 판정 게이트** — PR 본문 미진행 명시 (`[ ] 작업지시자 시각 판정`). 본 환경 cherry-pick 후 직접 시각 판정 필수
- ⚠️ **PR 본문의 미해결 영역 명시** — Page 1 header sub-tables / Page 3/4 보기 셀 분수 단락 / 페이지 쪽번호 — 본 PR 범위 밖 별도 task 후보

## 8. 1차 검토 결론

### 정합 평가
- ✅ **본질 cherry-pick 가능** — `1f187cf9` 단독 충돌 0
- ✅ **결정적 검증** — 1131 passed / clippy 0
- ✅ **단일 룰 확장** — Picture/Shape Square wrap 패턴 재사용 + 인라인 TAC 표 케이스 추가
- ✅ **임계값 가드** — column_start 인코딩 정상 paragraph 미진입 보장
- ⏳ **시각 판정 별도 진행 필요** — PR 본문 미진행
- ⏳ **광범위 sweep 본격 검증 필요** — 본 환경 자동 sweep 권장 (PR #564 패턴)

### 권장 처리 방향 (작업지시자 결정 대기)

#### 옵션 A — 핀셋 cherry-pick (권장)
- `1f187cf9` 단독 cherry-pick (Stage 0/1/2/4 의 plans/working/report/orders 는 컨트리뷰터 fork 정합 — 본 환경 자체 처리 보고서)
- 본 환경 결정적 재검증 + 광범위 sweep + WASM
- 작업지시자 시각 판정 (★ 게이트) — exam_science page 2 의 12번 응답 분수 위치 (739.87 → 584.93) + 회귀 sweep 영역
- 통과 시 devel merge + push + PR close 처리

#### 옵션 B — 추가 정정 요청
- 시각 판정에서 잔존 결함 발견 시 컨트리뷰터에게 추가 정정 요청

#### 옵션 C — close + 본 환경 직접 처리
- 시각 판정 다수 결함 발견 시 본 환경에서 직접 처리

→ **작업지시자 결정 대기**. 옵션 A 권장 — 본질 cherry-pick 깨끗 + 결정적 검증 통과 + 단일 룰 확장 정합.

## 9. 옵션 A 진행 결과 (작업지시자 승인 후)

### 9.1 핀셋 cherry-pick

| 단계 | 결과 |
|------|------|
| 본질 commit cherry-pick (`1f187cf9`) | ✅ 충돌 0, author Jaeook Ryu 보존 |
| local/devel cherry-pick commit | `9c6e79f` |

### 9.2 결정적 검증 (모두 통과)

| 검증 | 결과 |
|------|------|
| `cargo test --lib --release` | ✅ **1131 passed** / 0 failed / 2 ignored (회귀 0) |
| `cargo test --test svg_snapshot` | ✅ 6/6 passed |
| `cargo test --test issue_546` | ✅ 1 passed (Task #546 회귀 0) |
| `cargo test --test issue_554` | ✅ 12 passed |
| `cargo clippy --release --lib` | ✅ 0건 |
| `cargo build --release` | ✅ Finished |
| Docker WASM 빌드 | ✅ **4,570,901 bytes** (1m 29s, PR #564 baseline +286 bytes — paragraph_layout.rs +25/-2 LOC 정합) |

### 9.3 광범위 페이지네이션 sweep (페이지 수 회귀 자동 검출)

본 환경 `samples/` 폴더 전체 자동 sweep — devel 기준 페이지 수 vs cherry-pick 후 비교:

| 통계 | 결과 |
|---|---|
| 총 fixture | **164** (158 hwp + 6 hwpx) |
| 총 페이지 (devel baseline) | **1,614** |
| 총 페이지 (cherry-pick 후) | **1,614** |
| **fixture 별 페이지 수 차이** | **0** |
| Export 실패 fixture | 0 |

→ **164 fixture / 1,614 페이지 / 페이지 수 회귀 0**. 분기 확장 (`line_has_inline_tac_table`) + 임계값 보정 (`sw + cs < col_w_hu - 200`) 의 column_start 인코딩 정상 paragraph 미진입 보장이 광범위 sweep 으로 정량 입증.

### 9.4 exam_science byte 차이 (PR 본문 명시 영역)

| 페이지 | byte 차이 | 평가 |
|------|---------|------|
| page 1 | identical | ✅ PR 본문 정합 |
| **page 2** | **differ** | ✅ PR 본문 권위 영역 (12번 응답 분수 정정) |
| page 3 | identical | ✅ PR 본문 정합 |
| page 4 | identical | ✅ PR 본문 정합 |

→ PR 본문 "page 1/3/4 byte-identical, page 2 의도된 정정만 diff" 본 환경에서 정확히 재현.

### 9.5 다음 단계

1. ✅ 본 1차 검토 보고서 작성 (현재 문서)
2. ✅ 본 환경 결정적 재검증
3. ✅ SVG 생성 — `output/svg/pr570_before/exam_science/` + `output/svg/pr570_after/exam_science/` (page 2 만 의도된 차이)
4. ✅ Docker WASM 빌드 완료 (4,570,901 bytes)
5. ✅ 광범위 페이지네이션 sweep — 164 fixture 1,614 페이지 / 페이지 수 회귀 0
6. ⏳ **작업지시자 시각 판정** (★ 게이트, exam_science page 2 + WASM 다양한 hwp 검증) — 본 단계 대기 중
7. ⏳ 통과 시 devel merge + push + PR close
8. ⏳ 처리 보고서 (`pr_570_report.md`) 작성 + archives 이동

## 10. 메모리 정합

- ✅ `feedback_visual_regression_grows` — 시각 판정 게이트 정합 운영
- ✅ `feedback_v076_regression_origin` — 정밀 진단 (Justify slack 과대 + 80 px/space 메커니즘 명시) 정합
- ✅ `feedback_hancom_compat_specific_over_general` — 단일 룰 확장 (Picture/Shape Square wrap 패턴 재사용) + 케이스별 명시 가드 (line_has_inline_tac_table)
- ✅ `feedback_rule_not_heuristic` — 임계값 가드 명시 (sw+cs < col_w_hu - 200) — 측정 의존 휴리스틱이 아닌 규칙
- ✅ `feedback_pdf_not_authoritative` — 권위는 작업지시자 한컴 환경
- ✅ `feedback_per_task_pr_branch` — Task #568 단일 본질 PR 정합
- ✅ `feedback_pr_comment_tone` — 본 검토 톤 차분/사실 중심
- ✅ `feedback_check_open_prs_first` — 본 PR OPEN 상태 확인 후 진행
- ✅ `feedback_small_batch_release_strategy` — 본 사이클 (5/1 ~ 5/5) 누적 15번째 PR

---

**검토자**: 클로드 (페어 프로그래밍 파트너)
**1차 검토 단계 — 작업지시자 승인 대기**.
