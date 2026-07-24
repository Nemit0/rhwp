---
PR: #778
제목: Task #775 — Task #703 회귀 정정 (다단 영역 InFrontOfText/BehindText 표 컬럼 분배 복원, closes #775)
컨트리뷰터: @planet6897 — 12+ 사이클 (페이지네이션/표 핵심)
처리: 옵션 A — 3 commits cherry-pick + no-ff merge
처리일: 2026-05-10
머지 commit: 103bae74
---

# PR #778 처리 보고서

## 1. 처리 결과

✅ **머지 완료** — 옵션 A (3 commits cherry-pick + no-ff merge)

| 항목 | 값 |
|------|-----|
| 머지 commit | `103bae74` (--no-ff merge) |
| Cherry-pick commits | `c46c0a4d` (Stage 0/1) + `8c574bf4` (Stage 2 GREEN) + `3b84a083` (Stage 3-5) |
| closes | #775 |
| 시각 판정 | ✅ 작업지시자 웹 에디터 시각 판정 통과 |
| 자기 검증 | cargo build/test/clippy ALL GREEN + 회귀 가드 PASS + Task #703 보존 PASS + sweep 168/170 + WASM 4.68 MB |

## 2. 본질

@planet6897 자기 PR #707 (Task #703, 5/9 머지) 회귀 정정. PR #707 영역 InFrontOfText/BehindText 표 본문 흐름 누락 정정 영역 도입한 가드 영역 다단 컬럼 분배 영역 변경 → exam_eng.hwp p4 27번 보기 그림 영역 +446.6 px 회귀 (cell-clip y 277.08 → 723.69).

### 2.1 회귀 진원지 (bisect 확정)

| 시점 | 커밋 | cell-clip y | 상태 |
|------|-----|-------------|-----|
| Pre Task#703 (RED) | `afa70578` | 277.08 | ✅ |
| **Post Task#703 GREEN** | **`a759a1c2`** | **723.69** | ❌ **회귀** |
| 현재 devel (PR #778 적용 전) | `4594c90b` | 723.69 | ❌ |

## 3. 정정 본질 — typeset.rs +5/-1 (단일 가드 라인)

`src/renderer/typeset.rs:1550` 영역 InFrontOfText/BehindText 가드 영역 `&& st.col_count == 1` 조건 추가:

```rust
if matches!(
    table.common.text_wrap,
    crate::model::shape::TextWrap::InFrontOfText
        | crate::model::shape::TextWrap::BehindText
) && st.col_count == 1
{
    // Task #703 fix: push-only (cur_h 누적 건너뜀)
}
// else: cur_h 누적 (다단 영역 종전 동작 복원)
```

### 3.1 케이스 정합

| 케이스 | column_count | text_wrap | 본 fix 동작 | 결과 |
|--------|--------------|-----------|-------------|------|
| calendar_year.hwp (Task #703 본 케이스) | 1 | BehindText | push-only (Task #703 fix 유지) | ✅ 1 page 유지 |
| **exam_eng.hwp p4 (회귀 케이스)** | 2 | InFrontOfText | cur_h 누적 (종전 동작) | ✅ y=277.08 정상 복원 |

`feedback_hancom_compat_specific_over_general` **권위 사례** — 단일 컬럼 한정 가드 영역 일반화 영역 회귀 위험 좁힘.

## 4. PR 의 정정 — 9 files, +781/-1

### 4.1 본질 정정 (typeset.rs +5/-1)
단일 컬럼 한정 가드.

### 4.2 회귀 가드 (tests/issue_775.rs +73)
신규 통합 테스트 — exam_eng.hwp p4 영역 cell-clip y=277.08 검증.

### 4.3 거버넌스 문서 (총 +702)
- `mydocs/plans/task_m100_775.md` (+89, 수행 계획)
- `mydocs/plans/task_m100_775_impl.md` (+106, 구현 계획)
- `mydocs/working/task_m100_775_stage{1..4}.md` (+88+71+86+103, 단계별 보고서)
- `mydocs/report/task_m100_775_report.md` (+159, 최종 결과 보고서)

→ 단계별 분리 (Stage 0/1 RED + Stage 2 GREEN + Stage 3-5 검증/보고서) + bisect 진원지 명시 영역 절차 정합 인상적.

## 5. 본 환경 검증

| 검증 | 결과 |
|------|------|
| `cherry-pick` (3 commits) | ✅ auto-merge 충돌 0건 |
| `cargo build --release` | ✅ 통과 |
| `cargo test --release` | ✅ ALL GREEN |
| **회귀 가드 PASS** | ✅ `issue_775_exam_eng_p4_pi181_table_at_column_top` |
| **Task #703 본 케이스 보존 PASS** | ✅ `issue_703_calendar_year_single_page` |
| `cargo clippy --release -- -D warnings` | ✅ 통과 |
| 광범위 sweep (7 fixture / 170 페이지) | **168 same / 2 diff** (`exam_eng_002.svg` ID 순서만 + `exam_eng_004.svg` 의도된 정정, PR 본문 정확 일치) |
| WASM 빌드 (Docker, 재빌드) | ✅ 4.68 MB |

## 6. 작업지시자 웹 에디터 시각 판정 ✅ 통과
- `samples/exam_eng.hwp` p4 27번 보기 영역 cell-clip y=277.08 정합 (PR #707 회귀 정정)
- `samples/basic/calendar_year.hwp` 1 page 유지 (Task #703 본 케이스 보존)
- 다른 다단 sample 회귀 부재

## 7. PDF 권위 자료 정합 (PR 본문 명시)

컨트리뷰터 환경 (macOS) 영역 PDF 직접 비교 불가. 정합 체인:
1. 본 fix 동작 = Task #703 이전 동작 (다단 영역 한정)
2. Task #703 이전 동작 = PDF 권위 자료 정합 (cell-clip y=277.08)
3. 본 fix 후 cell-clip y = 277.08

`feedback_pdf_not_authoritative` 정합 — macOS 환경 영역 PDF 직접 비교 불가 영역 정합 체인 명시.

## 8. 영향 범위

### 8.1 변경 영역
- Rust typeset.rs 영역 영역 단일 가드 라인 (`&& st.col_count == 1`)

### 8.2 무변경 영역
- 단일 컬럼 + InFrontOfText/BehindText 표 (Task #703 fix 유지)
- 그 외 wrap (TopAndBottom/Square/None) 영역 영역 변경 부재

## 9. 메모리 룰 적용

| 룰 | 적용 |
|----|------|
| `feedback_contributor_cycle_check` | @planet6897 **12+ 사이클** (페이지네이션/표 핵심) |
| `feedback_image_renderer_paths_separate` | typeset 영역 영역 단일 영역 정정 (svg/canvas/skia 무영향) |
| `feedback_pr_supersede_chain` (c) 패턴 | PR #707 (Task #703) 머지 후 회귀 정정 영역 별 PR (Task #775) — 동일 패턴 |
| `feedback_hancom_compat_specific_over_general` | **권위 사례 강화** — 단일 컬럼 한정 가드 (`col_count == 1`) 영역 일반화 영역 회귀 위험 좁힘 |
| `feedback_diagnosis_layer_attribution` | bisect 진원지 명시 (`a759a1c2`) + 측정 (cell-clip y 277.08 → 723.69) — 정정 layer 정확화 |
| `feedback_process_must_follow` | 단계별 분리 (Stage 0/1 RED + Stage 2 GREEN + Stage 3-5 검증/보고서) + 거버넌스 문서 + 회귀 가드 테스트 |
| `feedback_visual_judgment_authority` | 작업지시자 웹 에디터 시각 판정 ✅ 통과 |
| `feedback_pdf_not_authoritative` | macOS 환경 PDF 직접 비교 불가 영역 정합 체인 명시 (Task #703 이전 동작 = PDF 권위 정합) |

## 10. 잔존 후속

- 본 PR 본질 정정의 잔존 결함 부재
- Issue #775 close 완료
- 별 영역 — Issue #704 (TopAndBottom TAC + 각주 borderline) 영역 별건 영역 영역 본 PR 영향 부재 (PR 본문 명시)

---

작성: 2026-05-10
