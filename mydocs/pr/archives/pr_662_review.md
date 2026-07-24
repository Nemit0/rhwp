---
PR: #662
제목: Task #656: typeset/layout 모델 통일 — 분할 표 셀 마지막 visible 줄 클립 본질 정정 (closes #656)
컨트리뷰터: @planet6897 (Jaeuk Ryu) — 16번째 사이클 PR
base: devel (DIRTY / CONFLICTING)
처리: 메인테이너 충돌 해결 통합 머지 (옵션 1)
처리일: 2026-05-08
---

# PR #662 1차 검토 보고서

## 1. 메타 정보

| 항목 | 값 |
|------|-----|
| PR 번호 | #662 |
| 제목 | Task #656: typeset/layout 모델 통일 — 분할 표 셀 마지막 visible 줄 클립 본질 정정 |
| 컨트리뷰터 | @planet6897 — 16번째 사이클 PR |
| base / head | devel / pr-task656 |
| mergeStateStatus | DIRTY (CONFLICTING) → 메인테이너 통합 정정 |
| CI | ALL SUCCESS |
| 변경 규모 | +968 / -1, 9 files |
| 커밋 수 | 5 (Stage 1, 2, 3, 4, cleanup) |
| closes | #656 |
| 선행 PR | PR #657 (Task #485) — 본 PR 영역의 epsilon 영역 supersede 영역 |

## 2. PR #657 ↔ PR #662 영역의 supersede 영역 본질

@planet6897 영역의 동일 컨트리뷰터 영역의 두 단계 영역의 정정 영역:

| 단계 | PR | 본질 |
|------|----|----|
| 1단계 | **PR #657 (Task #485)** | epsilon 2.0px 휴리스틱 마진 영역 + limit_reached 플래그 (Bug-1) |
| 2단계 | **PR #662 (Task #656)** | epsilon 휴리스틱 영역 → trail_ls 제외 일관 모델 영역의 본질 대체 영역 |

## 3. 충돌 영역의 본질

PR #662 base = `pr-task656` 영역이 PR #657 머지 영역 이전 영역. 동일 함수 (`compute_cell_line_ranges`) 영역의 동일 hunk 영역 충돌 영역 → 메인테이너 통합 정정 영역.

### 통합 정정 영역의 정합

| 영역 | PR #657 영역 (devel) | PR #662 영역 | 통합 정정 |
|------|---------------------|-------------|----------|
| epsilon 마진 | `effective_limit = abs_limit - 2.0px` | 삭제 | **삭제** (epsilon 휴리스틱 본질 대체) |
| break 비교 | `line_end_pos > effective_limit` | `line_break_pos = cum + h; > abs_limit` | **`line_break_pos > abs_limit`** (trail_ls 제외) |
| cum 누적 | `cum = line_end_pos` (h+ls) | 동일 | **보존** |
| limit_reached (Bug-1) | 영역 도입 | 영역 명시 부재 | **보존** (out-of-order 차단) |
| atomic exceeds_limit | `effective_limit` 비교 | — | **`abs_limit`** (epsilon 제거 정합) |

## 4. 본 환경 cherry-pick + 충돌 해결

### 4.1 단계별 진행
- Stage 1 + Stage 2 (mydocs 영역만) — 깨끗한 cherry-pick (충돌 0건)
- **Stage 3** — `compute_cell_line_ranges` 영역 충돌 → 메인테이너 통합 정정 commit `85556094` 영역
- Stage 4 — orders 영역 ours (devel 보존) + report + golden 영역 적용 영역 (commit `30021e5a`)
- cleanup commit (`9b196239`) — orders 영역 제거 영역 → skip 영역 (이미 ours 영역 정합)

### 4.2 결정적 검증
- `cargo test --release` → ALL PASS (1165 lib + svg_snapshot 7/7)
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

→ synam-001 영향 영역만 (4 페이지). 다른 6 샘플 (135 페이지) 회귀 0 ✅.

### 4.4 본질 정정 영역의 본 환경 직접 재현

| 페이지 | devel md5 (PR #657 머지) | PR #662 통합 영역 md5 |
|--------|-------------------------|----------------------|
| synam-001 p15 | `e9c0b084...` | `f978d183...` (다름 ✅) |

→ PR #662 영역의 epsilon 제거 + line_break_pos 영역의 본질 정정 영역의 영향 영역 본 환경 직접 재현.

### 4.5 시각 판정

작업지시자 시각 판정: **★ 통과** ("통과입니다")

## 5. 결정

**옵션 1 — 메인테이너 충돌 해결 통합 머지** (작업지시자 직접 결정).

merge commit: `93ddeca7`

`local/pr662-sim` 영역의 4 commits 영역 통합:
- Stage 1 (`867abd38`) — 본질 정밀 측정 + 회귀 베이스 영역 구축
- Stage 2 (`0b3f5216`) — 단일 모델 통합 시도 영역의 회귀 후퇴 보고서 영역
- Stage 3 (`85556094`) — **본질 정정 (메인테이너 충돌 해결)** ← 통합 정정
- Stage 4 (`30021e5a`) — 광범위 회귀 검증 + 골든 갱신 + 최종 보고서

## 6. 메모리 룰 적용

### `feedback_visual_judgment_authority`
→ 작업지시자 시각 판정 ★ 통과 영역의 정합 영역.

### `feedback_pr_supersede_chain` 영역의 확장 영역
> PR close 영역의 통합 후속 처리 영역의 패턴 영역

→ 본 PR 영역의 supersede 영역의 패턴 영역은 **머지 + 머지** 영역 (close 영역 부재) 영역. 두 패턴 영역의 정합 영역 (close + 통합 머지 vs 머지 + supersede 머지) 영역의 메모리 룰 영역의 확장 영역 필요 영역.

### `feedback_v076_regression_origin`
→ 컨트리뷰터 환경 영역 + 작업지시자 시각 판정 영역 모두 통과 영역.

## 7. 산출물

| 산출물 | 경로 |
|--------|------|
| 검토/보고서 (본 문서) | `mydocs/pr/archives/pr_662_review.md` |
| 처리 보고서 | `mydocs/pr/archives/pr_662_report.md` |
| merge commit | `93ddeca7` (no-ff, 4 commits 통합) |

## 8. 컨트리뷰터 응대

@planet6897 16번째 사이클 PR 안내:
- 본질 정정 정확 (epsilon 휴리스틱 영역 → trail_ls 제외 일관 모델 영역)
- 메인테이너 충돌 해결 영역의 통합 정정 영역 (PR #657 limit_reached 보존 + PR #662 본질 정정)
- 결정적 검증 통과 + 광범위 sweep 회귀 영역 부재
- 작업지시자 시각 판정 ★ 통과
- merge 결정

작성: 2026-05-08
