---
PR: #662
제목: Task #656: typeset/layout 모델 통일 — 분할 표 셀 마지막 visible 줄 클립 본질 정정 (closes #656)
컨트리뷰터: @planet6897 (Jaeuk Ryu) — 16번째 사이클 PR
처리: MERGE (옵션 1 — 메인테이너 충돌 해결 통합 머지)
처리일: 2026-05-08
---

# PR #662 최종 보고서

## 1. 결정

**옵션 1 — 메인테이너 충돌 해결 통합 머지** (작업지시자 직접 결정).

merge commit: `93ddeca7`

## 2. PR #657 ↔ PR #662 영역의 supersede 영역 본질

@planet6897 동일 컨트리뷰터 영역의 두 단계 영역의 정정 영역:

| 단계 | PR | 본질 |
|------|----|----|
| 1단계 | PR #657 (Task #485) | epsilon 2.0px 휴리스틱 마진 + limit_reached 플래그 (Bug-1) |
| 2단계 | **PR #662 (Task #656)** | **epsilon 휴리스틱 → trail_ls 제외 일관 모델 영역의 본질 대체** |

본 PR 본문 명시:
> Task #485 의 epsilon 영역을 본질적으로 대체. 본 PR 머지 후 origin/pr/task-485 의 epsilon 영역 자연 해소.

## 3. 메인테이너 충돌 해결 영역의 본질

PR #662 base 영역이 PR #657 머지 영역 이전 영역. 동일 함수 (`compute_cell_line_ranges`) 영역의 동일 hunk 영역 충돌 영역.

### 통합 정정 정합

| 영역 | PR #657 (devel) | PR #662 | 통합 정정 |
|------|-----------------|---------|----------|
| epsilon 마진 | `effective_limit = abs_limit - 2.0px` | 삭제 | **삭제** |
| break 비교 | `line_end_pos > effective_limit` | `line_break_pos = cum + h; > abs_limit` | **`line_break_pos > abs_limit`** |
| cum 누적 | `cum = line_end_pos` (h+ls) | 동일 | **보존** |
| limit_reached (Bug-1) | 도입 | 명시 부재 | **보존** |
| atomic exceeds_limit | `effective_limit` | — | **`abs_limit`** |

### 정정 commit `85556094`

```rust
// [Task #656] abs_limit 그대로 사용 (epsilon 제거).
let abs_limit = if has_limit { content_offset + content_limit } else { 0.0 };

// [Task #485 Bug-1] abs_limit 도달 후 렌더 차단 플래그 (보존).
let mut limit_reached = false;

// ... line 단위 break 비교 영역 ...
// [Task #656] break 비교 시 마지막 visible 줄의 trail_ls 제외.
let line_break_pos = cum + h;
if has_limit && line_break_pos > abs_limit {
    // [Task #485 Bug-1] outer 루프도 차단 (보존).
    limit_reached = true;
    break;
}
```

## 4. 본 환경 검증 결과

### 4.1 cherry-pick + 충돌 해결
- Stage 1 + Stage 2 — 깨끗한 cherry-pick (충돌 0건)
- Stage 3 — 메인테이너 통합 정정 commit `85556094`
- Stage 4 — orders 영역 ours + report + golden 영역 적용 영역 (commit `30021e5a`)
- cleanup commit (`9b196239`) — skip (orders 영역 ours 정합)

### 4.2 결정적 검증
- `cargo test --release` → ALL PASS, failed 0건
- `cargo test --release --lib` → 1165 passed (회귀 0)
- `cargo test --release --test svg_snapshot` → 7/7 passed (form-002 골든 갱신 적용)
- `cargo clippy --release` → clean

### 4.3 광범위 회귀 sweep (`scripts/svg_regression_diff.sh`)

```
2010-01-06: same=6 / diff=0
aift: same=77 / diff=0
exam_eng: same=8 / diff=0
exam_kor: same=20 / diff=0
exam_math: same=20 / diff=0
exam_science: same=4 / diff=0
synam-001: same=31 / diff=4 (p5, p15, p20, p21)
TOTAL: same=166 / diff=4
```

→ synam-001 영향 영역만. 다른 6 샘플 (135 페이지) 회귀 0 ✅.

### 4.4 본질 정정 영역의 영향 영역 본 환경 직접 재현

| 페이지 | devel md5 (PR #657 머지) | PR #662 통합 머지 md5 |
|--------|-------------------------|----------------------|
| synam-001 p15 | `e9c0b084f645e8ad3a057c4cc044858e` | `f978d183659c8447d7d1decacbac0c89` ✅ |

→ epsilon 제거 + line_break_pos 영역의 본질 정정 영역의 영향 영역 본 환경 직접 재현.

### 4.5 시각 검증
- WASM 빌드 완료 (`pkg/rhwp_bg.wasm` 4,573,882 bytes)
- 작업지시자 시각 판정: **★ 통과** ("통과입니다")
- synam-001 p15 PartialTable OVERFLOW 해소 영역
- form-002 page 0 분할 표 마지막 visible 줄 26 글자 클립 해소 영역

## 5. 메모리 룰 적용 결과

### `feedback_pr_supersede_chain` 영역의 확장 영역
> PR close 영역의 통합 후속 처리 영역의 패턴 영역

→ 본 PR 영역의 supersede 영역의 패턴 영역은 **머지 + 머지** 영역 (close 영역 부재). 두 패턴 영역의 정합 영역:

| 패턴 | 사례 | 본질 |
|------|------|------|
| **close + 통합 머지** | PR #649 close → PR #650 머지 (Task #517 + #518 통합) | 첫 PR close, 후속 PR 영역에서 두 commit 통합 머지 |
| **머지 + supersede 머지** | PR #657 머지 → PR #662 통합 머지 (Task #485 epsilon → Task #656 본질 정정) | 첫 PR 머지 (epsilon 휴리스틱), 후속 PR 영역에서 본질 대체 + 충돌 메인테이너 해결 |

### `feedback_visual_judgment_authority`
→ 작업지시자 시각 판정 ★ 통과 영역의 정합 영역.

### `feedback_v076_regression_origin`
→ 컨트리뷰터 환경 영역 + 작업지시자 환경 영역 모두 통과 영역.

### `feedback_close_issue_verify_merged`
→ Issue #656 close 영역의 본질 정정 commit 영역 (`85556094`) devel 머지 영역 정합.

## 6. 산출물

| 산출물 | 경로 |
|--------|------|
| 검토 보고서 | `mydocs/pr/archives/pr_662_review.md` |
| 최종 보고서 | `mydocs/pr/archives/pr_662_report.md` (본 문서) |
| merge commit | `93ddeca7` (no-ff, 4 commits 통합) |
| 메인테이너 충돌 해결 commit | `85556094` (Stage 3 본질 정정) |

## 7. 컨트리뷰터 응대

@planet6897 16번째 사이클 PR 안내:
- 본질 정정 정확 (epsilon 휴리스틱 → trail_ls 제외 일관 모델)
- 메인테이너 충돌 해결 영역의 통합 정정 영역의 정합
- 결정적 검증 통과 + 광범위 sweep 회귀 영역 부재
- 작업지시자 시각 판정 ★ 통과
- PR #657 + PR #662 영역의 supersede 영역의 정합 영역의 절차 영역 정합
- merge 결정

작성: 2026-05-08
