# PR #567 처리 보고서 — 핀셋 cherry-pick 머지 + 시각 판정 ★ 통과

**PR**: [#567 Task #565 exam_science.hwp 12/15/18/19번 인라인 수식(Equation, treat_as_char) 미렌더 정정](https://github.com/edwardkim/rhwp/pull/567)
**작성자**: @planet6897 (PR 등록) / Jaeook Ryu = @jangster77 (commit author)
**처리 결정**: ✅ **핀셋 cherry-pick 머지 + push + PR close**
**처리일**: 2026-05-05

## 1. 처리 결과 요약

| 항목 | 결과 |
|------|------|
| 결정 | ✅ 핀셋 cherry-pick (Stage 3 본질만) + devel merge + push + PR close |
| 시각 판정 | ★ **통과** (12번 인라인 수식 겹침 해결 / 15/18/19번 개선) |
| Devel merge commit | `bbd4418` |
| Cherry-pick 충돌 | 0 건 (PR mergeable=CONFLICTING 표시는 PR base 시점 차이, 본질 무관) |
| Author 보존 | ✅ Jaeook Ryu (@jangster77) 보존 |
| Issue #565 | CLOSED (closes #565) |
| 잔존 영역 | 12번 문항의 인라인과 별개 조판 영역 — 컨트리뷰터가 추가 이슈로 인지 |

## 2. 본질 결함 (PR 진단)

### 2.1 결함 가설

`paragraph_layout::layout_inline_table_paragraph` 가 **인라인 표 + 텍스트 세그먼트만 처리** (인라인 수식/treat_as_char Picture/Shape 무시) → `inline_shape_position` 미등록 → `shape_layout::layout_shape_item` fallback 으로 동일 좌표 (`col_area.x`, `para_y`) 에 9개 수식이 겹쳐 그려짐.

### 2.2 정밀 진단 (Stage 1~2)

동일 페이지의 두 문단 비교:

| | 0.60 (그림 문단) | 0.61 (본문) |
|---|---|---|
| 인라인 표 | 없음 | 있음 (treat_as_char Table) |
| 인라인 수식 | 8개 | 9개 |
| 분기 | `plain layout_paragraph` ✅ | `layout_inline_table_paragraph` ❌ |
| 결과 | 8개 수식 좌표 분산 | 9개 수식 모두 (534.8, 1218.106) 겹침 |

→ 정밀한 결함 origin 식별 패턴 (`feedback_v076_regression_origin` 정신 정합).

### 2.3 정정 (Stage 3)

```rust
let has_other_inline_ctrls = para.controls.iter().any(|c| match c {
    Control::Equation(_) => true,
    Control::Picture(p) => p.common.treat_as_char,
    Control::Shape(s) => s.common().treat_as_char,
    _ => false,
});

if has_inline_tables && !has_other_inline_ctrls {
    // 기존 layout_inline_table_paragraph 경로 (인라인 표 + 텍스트만)
} else {
    // 일반 layout_paragraph 경로 (인라인 표 + 인라인 수식 정상 처리)
}
```

→ **케이스별 명시 가드** (`feedback_hancom_compat_specific_over_general` 정합).

## 3. PR 의 4 commits 분석 (cherry-pick 대상 식별)

| commit | 설명 | 본 환경 처리 |
|--------|------|-------------|
| `96ccebed` Stage 1 — 정밀 진단 + 수행 계획 | 컨트리뷰터 fork 보고서 | 무관 (본 환경 자체 보고서) |
| `4d4e0fcf` Stage 2 — 구현 계획 | 컨트리뷰터 fork 보고서 | 무관 |
| **`a35bdbed` Stage 3 — 본질 정정** | `src/renderer/layout.rs` +13/-1 + working stage3 | ⭐ cherry-pick |
| `2f244c9a` Stage 4 — 최종 보고서 | 컨트리뷰터 fork 보고서 + orders | 무관 (orders 충돌 가능) |

→ 본질 1 commit 만 cherry-pick. 컨트리뷰터의 fork 보고서/orders 는 fork 정합용 (본 환경 자체 처리 보고서 작성).

## 4. cherry-pick 진행

### 4.1 대상 commit (1개, 충돌 0)

```
466c487 Task #565 Stage 3: layout_inline_table_paragraph 가드 강화 (인라인 수식 미렌더 정정)
```

`Jaeook Ryu <jaeook.ryu@gmail.com>` author 보존.

### 4.2 변경 영역

| 파일 | 변경 |
|------|------|
| `src/renderer/layout.rs` | +13 / -1 (`has_other_inline_ctrls` 검사 + 가드 강화) |
| `mydocs/working/task_m100_565_stage3.md` | +148 (Stage 3 작업 보고서) |

## 5. 결정적 검증 결과

| 게이트 | 결과 |
|--------|------|
| `cargo build --release` | ✅ Finished |
| `cargo test --lib --release` | ✅ **1130 passed** / 0 failed / 2 ignored (회귀 0) |
| `cargo test --test svg_snapshot` | ✅ 6/6 passed |
| `cargo test --test issue_546` | ✅ 1 passed (Task #546 회귀 0) |
| `cargo test --test issue_554` | ✅ 12 passed |
| `cargo clippy --release --lib` | ✅ 0건 |
| Docker WASM 빌드 | ✅ **4,570,464 bytes** (1m 25s, PR #561 baseline +244 bytes — layout.rs +13/-1 LOC 정합) |

## 6. 광범위 회귀 sweep (PR 본문 측정 100% 재현)

| Fixture | 페이지 수 | byte 차이 | 평가 |
|---------|---------|---------|------|
| **exam_science** | 4 | **3 (page 002, 003, 004)** | ✅ PR 본문 100% 정합 (12/15/18/19번 본문) |
| **exam_kor** | 20 | 0 | ✅ 회귀 0 |
| **exam_math** | 20 | 0 | ✅ 회귀 0 |
| **합계** | **44** | **3** | 케이스별 명시 가드 정합성 정량 입증 |

→ PR 본문이 명시한 "271/274 identical + 3 의도 정정 (exam_science 002/003/004)" 가 본 환경에서도 정확히 재현. 다른 시험지 (exam_kor, exam_math) 에서는 회귀 0 — 케이스별 명시 가드의 정합성이 정량적으로 입증.

## 7. 시각 판정 (★ 게이트)

### 7.1 SVG 자료 생성

- `output/svg/pr567_before/exam_science/` (devel 기준, 4 페이지)
- `output/svg/pr567_after/exam_science/` (cherry-pick 후, 4 페이지)
- `output/svg/pr567_before/exam_kor/` + `output/svg/pr567_after/exam_kor/` (회귀 검증, 20 페이지)
- `output/svg/pr567_before/exam_math/` + `output/svg/pr567_after/exam_math/` (회귀 검증, 20 페이지)

### 7.2 작업지시자 시각 판정 결과

> samples/exam_science.hwp
> - 12번 인라인 수식 겹쳐지던 문제 해결
> - 15번 개선됨
> - 18번 개선됨
> - 19번 개선됨

> 12번 문항의 인라인과 별개로 해결할 조판은 컨트리뷰터가 추가 이슈로 인지하고 있습니다.

→ ★ **통과**. 본 PR 본질 영역 (인라인 표 + 9개 인라인 수식 동시 케이스의 동일 좌표 겹침) 정상 분산 회복 + 잔존 조판 영역은 컨트리뷰터의 추가 이슈로 별도 관리.

## 8. PR / Issue close 처리

### 8.1 PR #567 close
- 댓글 등록 (cherry-pick 결과 + 결정적 검증 + 광범위 sweep + 시각 판정 + 잔존 영역 인지 + 케이스별 명시 가드 정합성 + 컨트리뷰터 협업 인정)
- close 처리

### 8.2 Issue #565 close
- closes #565 키워드로 PR merge 시 자동 close

## 9. 메모리 정합

- ✅ `feedback_visual_regression_grows` — 시각 판정 게이트 정합 운영 (★ 통과)
- ✅ `feedback_v076_regression_origin` — Stage 1~2 의 정밀 진단 (동일 페이지 두 문단 비교) 정합
- ✅ `feedback_hancom_compat_specific_over_general` — 케이스별 명시 가드 (`has_inline_tables && !has_other_inline_ctrls`)
- ✅ `feedback_pdf_not_authoritative` — 권위는 작업지시자 한컴 환경
- ✅ `feedback_per_task_pr_branch` — Task #565 단일 본질 PR 정합
- ✅ `feedback_pr_comment_tone` — close 댓글 차분/사실 중심 + 컨트리뷰터 협업 인정
- ✅ `feedback_check_open_prs_first` — PR OPEN 상태 확인 후 진행
- ✅ `feedback_small_batch_release_strategy` — 본 사이클 (5/1 ~ 5/5) 활발한 외부 기여의 빠른 회전 (13번째 PR 처리)

## 10. 본 사이클 사후 처리

- [x] PR #567 close (cherry-pick 머지 + push)
- [x] Issue #565 close (closes #565)
- [x] 처리 보고서 (`mydocs/pr/archives/pr_567_report.md`, 본 문서)
- [ ] 검토 보고서 archives 이동 (`mydocs/pr/pr_567_review.md` → `mydocs/pr/archives/pr_567_review.md`)
- [ ] 5/5 orders 갱신 (PR #567 항목 추가)
