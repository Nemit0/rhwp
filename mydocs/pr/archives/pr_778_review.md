---
PR: #778
제목: Task #775 — Task #703 회귀 정정 (다단 영역 InFrontOfText/BehindText 표 컬럼 분배 복원, closes #775)
컨트리뷰터: @planet6897 — 12+ 사이클 (페이지네이션/표 핵심 컨트리뷰터)
base / head: devel / pr-task775
mergeStateStatus: BEHIND
mergeable: MERGEABLE
CI: SUCCESS (Build & Test + CodeQL js/ts/py/rust + Canvas visual diff)
변경 규모: +781 / -1, 9 files
검토일: 2026-05-10
---

# PR #778 검토

## 1. 메타

| 항목 | 값 |
|------|-----|
| PR 번호 | #778 |
| 제목 | Task #775 — Task #703 회귀 정정 |
| 컨트리뷰터 | @planet6897 — 12+ 사이클 (PR #701/#706/#707/#710/#711/#714/#715/#719/#771/#772/#777/#778) |
| base / head | devel / pr-task775 |
| mergeStateStatus | BEHIND, mergeable: MERGEABLE — 충돌 부재 |
| CI | ✅ Build & Test + CodeQL (js/ts/py/rust) + Canvas visual diff 통과 |
| 변경 규모 | +781 / -1, 9 files |
| 변경 규모 (본질) | **+5/-1, typeset.rs (단일 가드 라인)** + 73 회귀 가드 테스트 + 거버넌스 문서 |
| 커밋 수 | 3 (Stage 0/1 RED + Stage 2 GREEN + Stage 3-5 검증/보고서) |
| closes | #775 |

## 2. 본질

Task #703 / PR #707 (5/9 머지, 동일 컨트리뷰터) 의 회귀 정정. PR #707 영역 InFrontOfText/BehindText 표 영역 본문 흐름 누락 정정 (Issue #703) 영역 도입한 가드 영역 다단 영역 컬럼 분배 영역 변경 → exam_eng.hwp p4 27번 보기 그림 영역 +446.6 px 회귀 발생 (cell-clip y 277.08 → 723.69).

### 2.1 회귀 진원지 (bisect 확정)

| 시점 | 커밋 | cell-clip y | 상태 |
|------|-----|-------------|-----|
| Pre Task#703 (RED) | `afa70578` | 277.08 | ✅ |
| **Post Task#703 GREEN** | **`a759a1c2`** | **723.69** | ❌ **회귀** |
| 현재 devel | `e30e52f4` | 723.69 | ❌ |

## 3. 채택 접근 — 단일 컬럼 한정 가드

`typeset.rs:1550` 영역 InFrontOfText/BehindText 가드 영역 `&& st.col_count == 1` 조건 추가:

```rust
if matches!(
    table.common.text_wrap,
    crate::model::shape::TextWrap::InFrontOfText
        | crate::model::shape::TextWrap::BehindText
) && st.col_count == 1
{
    // Task #703 fix: push-only (cur_h 누적 건너뜀)
    st.current_items.push(PageItem::Shape { ... });
    ...
}
// else: cur_h 누적 (다단 영역 종전 동작 복원)
```

### 3.1 케이스 정합

| 케이스 | column_count | text_wrap | 본 fix 동작 | 결과 |
|--------|--------------|-----------|-------------|------|
| calendar_year.hwp (Task #703 본 케이스) | **1** | BehindText | push-only (Task #703 fix 유지) | ✅ 1 page 유지 |
| **exam_eng.hwp p4 (회귀 케이스)** | **2** | InFrontOfText | cur_h 누적 (종전 동작) | ✅ y=277.08 정상 복원 |

`feedback_hancom_compat_specific_over_general` 정합 — case 가드 영역 일반화 영역 회귀 위험 좁힘.

## 4. PR 의 정정 — 9 files, +781/-1

### 4.1 본질 정정 (typeset.rs +5/-1)
단일 컬럼 한정 가드 추가.

### 4.2 회귀 가드 (tests/issue_775.rs +73)
신규 통합 테스트 — exam_eng.hwp p4 영역 cell-clip y=277.08 검증.

### 4.3 거버넌스 문서 (총 +702)
- `mydocs/plans/task_m100_775.md` (+89, 수행 계획)
- `mydocs/plans/task_m100_775_impl.md` (+106, 구현 계획)
- `mydocs/working/task_m100_775_stage{1..4}.md` (+88+71+86+103, 단계별 보고서)
- `mydocs/report/task_m100_775_report.md` (+159, 최종 결과 보고서)

→ 단계별 분리 + bisect 진원지 명시 + 광범위 sweep + golden SVG 검증 영역 절차 정합.

## 5. 검증

### 5.1 라이브러리 회귀
- cargo test --release: 1338 통과, 0 실패, 5 ignored

### 5.2 다단 광범위 sweep (6 fixture / 164 페이지)
| sample | 페이지 | byte diff | 상태 |
|--------|--------|-----------|------|
| exam_kor | 20 | 0 | ✅ |
| **exam_eng** | **8** | **2** | ⚠️ p4 의도된 정정 + p2 ID 순서만 변경 (시각 회귀 0) |
| exam_science | 4 | 0 | ✅ |
| exam_math | 20 | 0 | ✅ |
| synam-001 | 35 | 0 | ✅ |
| aift | 77 | 0 | ✅ |

→ exam_eng p4 의도된 정정 (cell-clip y 복원) + p2 ID 순서만 변경 (시각 정합 동일).

### 5.3 단일 컬럼 본 케이스 보존
- `tests/issue_703.rs::issue_703_calendar_year_single_page` — GREEN 유지
- `samples/basic/calendar_year.hwp` — 1 page 유지
- `samples/basic/calendar_monthly.hwp` — 1 page 유지

### 5.4 Golden SVG 7건
모두 GREEN (issue_147_aift_page3, issue_157_page_1, issue_267_ktx_toc_page, form_002_page_0, issue_617_exam_kor_page5, table_text_page_0, render_is_deterministic_within_process).

## 6. 충돌 / mergeable

mergeStateStatus = `BEHIND`, mergeable = `MERGEABLE`. typeset.rs 영역 devel 5/10 사이클 영역 PR #745 (NewNumber Page) 영역 누적 — 본 PR 영역 영역 다른 영역 (line 1550) 영역 영역 충돌 부재 예상. cherry-pick 시도 영역 영역 점검 필요.

## 7. 본 환경 점검

### 7.1 변경 격리
- Rust typeset.rs 영역 영역 단일 가드 라인 (col_count == 1)
- 회귀 가드 테스트 신규
- 거버넌스 문서 영역 영역 작업 절차 보존

### 7.2 PDF 권위 자료 정합 (PR 본문 명시)
컨트리뷰터 환경 (macOS) 영역 PDF 직접 비교 불가. 정합 체인:
1. 본 fix 동작 = Task #703 이전 동작 (다단 영역 한정)
2. Task #703 이전 동작 = PDF 권위 자료 정합 (cell-clip y=277.08)
3. 본 fix 후 cell-clip y = 277.08

### 7.3 CI 결과
- 모두 ✅ Build & Test + CodeQL (js/ts/py/rust) + Canvas visual diff 통과

## 8. 처리 옵션

### 옵션 A — 3 commits 개별 cherry-pick + no-ff merge

```bash
git checkout local/devel
git cherry-pick 8fad6d21 3ee7b989 48b01241
git checkout devel
git merge local/devel --no-ff
```

→ **권장**.

## 9. 검증 게이트

### 9.1 자기 검증
- [ ] cherry-pick 충돌 점검
- [ ] cargo build/test --release ALL GREEN (PR 본문 명시 영역 1338 통과)
- [ ] cargo clippy 통과
- [ ] **`cargo test --release --test issue_775`** PASS (회귀 가드)
- [ ] `cargo test --release --test issue_703` PASS (Task #703 본 케이스 보존)
- [ ] 광범위 sweep — 7 fixture / 170 페이지 / 회귀 점검 (PR 본문 영역 영역 exam_eng 영역 영역 의도된 2 diff 명시 — 본 환경 영역 영역 동일 결과 예상)

### 9.2 시각 판정 게이트 — **WASM 빌드 + 작업지시자 시각 판정 권장**

본 PR 본질 영역 영역 다단 영역 InFrontOfText/BehindText 표 컬럼 분배 복원 — 시각 출력 영역 영역 정정. 작업지시자 시각 판정 권위:
- `samples/exam_eng.hwp` p4 27번 보기 영역 영역 cell-clip y=277.08 정합 (PR #707 회귀 정정)
- `samples/basic/calendar_year.hwp` 1 page 유지 (Task #703 본 케이스 보존)
- 다른 다단 sample (`samples/exam_kor.hwp` / `synam-001.hwp` 등) 영역 영역 회귀 부재

`feedback_visual_judgment_authority` 정합 — 다단 영역 영역 시각 정정 영역 영역 작업지시자 시각 판정 게이트 권장.

## 10. 메모리 룰 적용

| 룰 | 적용 |
|----|------|
| `feedback_contributor_cycle_check` | @planet6897 12+ 사이클 (페이지네이션/표 핵심) |
| `feedback_image_renderer_paths_separate` | typeset 영역 영역 단일 영역 정정 (svg/canvas/skia 무영향) |
| `feedback_pr_supersede_chain` (c) 패턴 | PR #707 (Task #703) 머지 후 회귀 정정 영역 별 PR (Task #775) — 동일 패턴 |
| `feedback_hancom_compat_specific_over_general` | **권위 사례** — 단일 컬럼 한정 가드 (`col_count == 1`) 영역 영역 일반화 영역 영역 회귀 위험 좁힘 |
| `feedback_diagnosis_layer_attribution` | bisect 진원지 명시 (`a759a1c2`) + 측정 (cell-clip y 277.08 → 723.69) — 정정 layer 정확화 |
| `feedback_process_must_follow` | 단계별 분리 (Stage 0/1 RED + Stage 2 GREEN + Stage 3-5 검증/보고서) + 거버넌스 문서 + 회귀 가드 테스트 — 위험 좁힘 |
| `feedback_visual_judgment_authority` | 다단 영역 영역 시각 정정 영역 영역 작업지시자 시각 판정 게이트 권장 |
| `feedback_pdf_not_authoritative` | macOS 영역 영역 PDF 직접 비교 불가 영역 영역 정합 체인 명시 (Task #703 이전 동작 = PDF 권위 자료 정합) |

## 11. 처리 순서 (승인 후)

1. `local/devel` 영역 cherry-pick 3 commits (`8fad6d21` + `3ee7b989` + `48b01241`)
2. 자기 검증 (cargo build/test/clippy + issue_775 + issue_703 + 광범위 sweep)
3. WASM 빌드 + 작업지시자 시각 판정 (exam_eng p4 + calendar_year + 다른 다단 sample 회귀 부재)
4. 시각 판정 통과 → no-ff merge + push + archives + 5/10 orders + Issue #775 close
5. PR #778 close

---

작성: 2026-05-10
