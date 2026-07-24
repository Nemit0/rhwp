---
PR: #691
제목: Task #683: pr-149.hwp 빈 paragraph + TopAndBottom 그림 cluster 거리 정정
컨트리뷰터: @planet6897 (Jaeuk Ryu) — 30+ 사이클 핵심 컨트리뷰터 (Layout / 페이지네이션)
처리: MERGE (1 commit cherry-pick + 메인테이너 충돌 해결 통합 머지)
처리일: 2026-05-08
---

# PR #691 최종 보고서

## 1. 결정

**1 commit cherry-pick + 메인테이너 충돌 해결 통합 머지** + WASM 빌드 + 작업지시자 시각 판정 ★ 통과.

merge commit: `22a4b879`

작업지시자 시각 판정: **★ 통과** ("웹 에디터 시각 검증 통과입니다")

## 2. 본질 정정

### 결함
`samples/pr-149.hwp` 영역의 빈 paragraph + Para-relative TopAndBottom 그림 cluster 영역 거리 영역에서 영역 line baseline 누락 영역.
- rhwp pre-fix: cluster = 17280 HU (image_height + 0)
- 한컴 한글 2022 PDF: cluster = 18864 HU (image_height + line(lh+ls))

### 정정 영역
`src/renderer/layout.rs::layout_shape_item` 영역 Picture 비-TAC + Para-relative 분기 영역에 **5 조건 AND 가드** 추가:
- `pic.common.treat_as_char == false`
- `pic.common.text_wrap == TextWrap::TopAndBottom`
- `pic.common.vert_rel_to == VertRelTo::Para`
- `pic.caption.is_none()`
- 부모 paragraph 의 visible 텍스트 0

→ 5 조건 만족 시 `result_y += line_height + line_spacing` 추가.

## 3. 본 환경 검증 결과

### 3.1 cherry-pick + 메인테이너 충돌 해결
- 두 영역 충돌 영역:
  - `integration_tests.rs` — add/add 영역 (Task #634 + Task #683 양쪽 영역 신규 영역) → **양쪽 영역 보존**
  - `orders/20260508.md` — ours (devel 보존)
- merge commit: `22a4b879`

### 3.2 결정적 검증
- `cargo test --release` → ALL PASS, failed 0건
- `cargo test --release --lib` → **1166 passed** (회귀 0)
- `cargo test --release --lib test_task683_pr149_image_cluster_spacing` → **1/1 passed** ✅
- `cargo test --release --test svg_snapshot --test issue_546 --test issue_554` → 21/21
- `cargo clippy --release` → clean

### 3.3 광범위 회귀 sweep
```
TOTAL: pages=170 same=170 diff=0 ✅
```

→ 7 샘플 170 페이지 회귀 0 ✅. 5 조건 AND 가드 영역의 영향 좁힘 영역 정합 영역.

### 3.4 시각 검증
- WASM 빌드 완료 (`pkg/rhwp_bg.wasm` 4,596,222 bytes)
- 작업지시자 시각 판정: **★ 통과** — 그림 cluster 영역 한글 2022 PDF 정합

### 3.5 PR 본문 측정 정합
| 요소 | PDF | rhwp 수정 후 | 차이 |
|------|-----|-------------|------|
| 그림1 top | 273 | 273 | 0 px |
| 그림2 top | 666 | 667 | +1 px |
| 그림3 top | 1059 | 1060 | +1 px |
| Cluster 거리 | 18864 HU | 18896 HU | +32 HU |

**모든 요소 ±1 px 이내 정합** ✅

## 4. 영향 범위 영역 좁힘

| 항목 | 영향 |
|------|------|
| HWP3 / HWPX | 동일 IR 사용 → 자동 적용 |
| 머리말/꼬리말, 바탕쪽 | 영향 부재 |
| 표 셀 내부 그림 | 영향 부재 (cell_ctx.is_some()) |
| TAC, caption, Square/BehindText/InFrontOfText wrap | 영향 부재 (가드) |
| Skia 네이티브 렌더러 | 페이지네이션/레이아웃 결과 사용 → 자동 적용 |

## 5. 메모리 룰 적용 결과

### `feedback_visual_judgment_authority`
→ 작업지시자 시각 판정 ★ 통과 영역 정합 영역.

### `feedback_pr_supersede_chain`
→ PR #690 close → PR #691 재제출 영역의 패턴 영역 정합 영역. 동일 컨트리뷰터 영역의 재제출 영역 — 이전 PR 영역 다수 무관 commits 영역 영역 본 PR 영역 단일 commit 영역으로 영역 정리 영역.

### `feedback_hancom_compat_specific_over_general`
→ 5 조건 AND 가드 영역의 영향 영역 좁힘 영역 정합 영역.

### `feedback_v076_regression_origin`
→ 컨트리뷰터 환경 영역 (8 fixture 시각 회귀 부재) + 작업지시자 환경 영역 (시각 판정 ★) 영역 모두 정합 영역.

### `feedback_contributor_cycle_check`
→ @planet6897 영역의 30+ 사이클 PR 영역 정확 표현 영역.

## 6. 산출물

| 산출물 | 경로 |
|--------|------|
| 검토 보고서 | `mydocs/pr/archives/pr_691_review.md` |
| 최종 보고서 | `mydocs/pr/archives/pr_691_report.md` (본 문서) |
| merge commit | `22a4b879` (no-ff, 1 commit + 메인테이너 충돌 해결) |
| 회귀 차단 가드 | `test_task683_pr149_image_cluster_spacing` (integration_tests.rs) |

## 7. 컨트리뷰터 응대

@planet6897 30+ 사이클 핵심 컨트리뷰터 안내:
- 본질 정정 정확 (5 조건 AND 가드 영역의 영향 좁힘)
- 본 환경 결정적 검증 + 광범위 sweep 회귀 0
- 작업지시자 시각 판정 ★ 통과
- merge 결정

작성: 2026-05-08
