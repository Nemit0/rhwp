---
PR: #691
제목: Task #683: pr-149.hwp 빈 paragraph + TopAndBottom 그림 cluster 거리 정정
컨트리뷰터: @planet6897 (Jaeuk Ryu) — 30+ 사이클 핵심 컨트리뷰터 (Layout / 페이지네이션)
base: devel (DIRTY → 메인테이너 충돌 해결 통합)
mergeable: MERGEABLE
CI: ALL SUCCESS
변경: +522/-0, 9 files (1 commit, PR #690 재제출 영역)
처리: 1 commit cherry-pick + 메인테이너 충돌 해결 + WASM 빌드 + 시각 판정
처리일: 2026-05-08
---

# PR #691 검토 보고서

## 1. 메타 정보

| 항목 | 값 |
|------|-----|
| PR 번호 | #691 |
| 제목 | Task #683: pr-149.hwp 빈 paragraph + TopAndBottom 그림 cluster 거리 정정 |
| 컨트리뷰터 | @planet6897 (Jaeuk Ryu) — 30+ 사이클 핵심 컨트리뷰터 |
| base / head | devel / task683-image-paragraph-spacing-v2 |
| mergeStateStatus | DIRTY (CONFLICTING) → 메인테이너 통합 정정 |
| mergeable | MERGEABLE |
| CI | ALL SUCCESS |
| 변경 규모 | +522 / -0, 9 files |
| 커밋 수 | 1 |
| closes | #683 |
| 선행 PR | #690 close 영역의 재제출 영역 |

## 2. Issue #683 본질

`samples/pr-149.hwp` 영역의 빈 paragraph + Para-relative TopAndBottom 그림 cluster 영역 거리 영역 결함 영역.

### 결함 메커니즘
- 빈 paragraph (text_len=0) 영역이 Para-relative TopAndBottom 그림 (treat_as_char=false, caption 없음) 영역만 영역 포함 영역
- **rhwp pre-fix**: `result_y = pic_y + image_height` (그림 paragraph 영역의 line baseline 누락)
- **한컴 한글 2022 PDF**: `result_y = pic_y + image_height + line(lh+ls)` (그림 다음 1줄 추가)

## 3. PR 의 정정

### 본질 정정 영역
`src/renderer/layout.rs::layout_shape_item` 영역 Picture 비-TAC + Para-relative 분기 영역.

```rust
// result_y = self.layout_body_picture(...) 직후
// 다음 가드 모두 만족 시 line baseline 추가
if pic.common.treat_as_char == false
    && pic.common.text_wrap == TextWrap::TopAndBottom
    && pic.common.vert_rel_to == VertRelTo::Para
    && pic.caption.is_none()
    && parent_paragraph.has_no_visible_text()
{
    result_y += line_height + line_spacing;
}
```

## 4. 본 환경 cherry-pick simulation

### 4.1 충돌 영역 발견 영역
PR base 영역이 devel 영역의 어느 시점 영역인지 영역의 차이 영역으로 영역 두 영역 충돌 영역:
- `src/renderer/layout/integration_tests.rs` — add/add 영역 (Task #634 + Task #683 영역 양쪽 영역 신규 영역)
- `mydocs/orders/20260508.md` — 본 환경 영역의 누적 영역과 PR 영역의 영역 차이 영역

### 4.2 메인테이너 충돌 해결 영역
- **integration_tests.rs**: 양쪽 영역 보존 영역 (Task #634 영역의 6 테스트 + `count_text_at_y` 헬퍼 + Task #683 영역의 `test_task683_pr149_image_cluster_spacing`)
- **orders/20260508.md**: ours (devel 보존)

### 4.3 결정적 검증 (충돌 해결 후)
- `cargo test --release` → ALL PASS, failed 0건
- `cargo test --release --lib` → **1166 passed** (회귀 0)
- `cargo test --release --lib test_task683_pr149_image_cluster_spacing` → **1/1 passed** ✅
- `cargo test --release --test svg_snapshot --test issue_546 --test issue_554` → 21/21
- `cargo clippy --release` → clean

### 4.4 광범위 회귀 sweep
```
2010-01-06: same=6 / diff=0
aift: same=77 / diff=0
exam_eng: same=8 / diff=0
exam_kor: same=20 / diff=0
exam_math: same=20 / diff=0
exam_science: same=4 / diff=0
synam-001: same=35 / diff=0
TOTAL: pages=170 same=170 diff=0 ✅
```

→ 회귀 0건. 본 PR 영역의 가드 5 조건 영역 영향 좁힘 영역 정합 영역.

### 4.5 머지 + WASM 빌드
- merge commit: `22a4b879`
- WASM 빌드 완료 (`pkg/rhwp_bg.wasm` 4,596,222 bytes)

## 5. 검토 관점

### 5.1 본질 정정 영역의 정확성
- 단일 분기 영역 가드 추가 — 영향 영역 좁힘 영역
- 5 조건 AND 가드 (TAC=false + TopAndBottom + Para + caption=None + visible 텍스트 0)
- HWP3 / HWPX 영역 동일 IR 사용 영역 → 자동 적용 영역
- 머리말/꼬리말, 표 셀 내부, TAC, caption, 다른 wrap 영역 → 영향 부재 영역

### 5.2 PR 본문 측정 정합

| 요소 | PDF | rhwp 수정 후 | 차이 |
|------|-----|-------------|------|
| 그림1 top | 273 | 273 | 0 px |
| 그림2 top | 666 | 667 | +1 px |
| 그림3 top | 1059 | 1060 | +1 px |
| Cluster 거리 | 18864 HU | 18896 HU | +32 HU (sub-pixel) |

**모든 요소 ±1 px 이내 정합** ✅.

### 5.3 회귀 위험성
- 광범위 sweep 회귀 0
- 동일 패턴 8 fixture 시각 회귀 부재 (PR 본문 명시)
- 5 조건 AND 가드로 영향 좁힘

## 6. 메모리 룰 적용 결과

### `feedback_visual_judgment_authority`
→ 작업지시자 시각 판정 게이트 영역 진행 영역 권장 영역.

### `feedback_pr_supersede_chain`
→ PR #690 close → PR #691 재제출 영역의 패턴 영역 정합 영역. 동일 컨트리뷰터 영역의 재제출 영역.

### `feedback_hancom_compat_specific_over_general`
→ 5 조건 AND 가드 영역의 영향 영역 좁힘 영역 정합 영역.

### `feedback_contributor_cycle_check`
→ @planet6897 영역의 30+ 사이클 PR 영역 정확 표현 영역.

## 7. 시각 검증 대상

**파일**: `samples/pr-149.hwp`

| 요소 | 결함 (정정 전) | 정정 후 기대 |
|------|---------------|---------------|
| 그림1, 그림2, 그림3 cluster 거리 | 17280 HU (line 누락) | **18864 HU** (한글 2022 PDF 정합) |
| "회색조:" 텍스트 y | (시프트) | 634 (PDF 정합) |
| "흑백:" 텍스트 y | (시프트) | 1027 (PDF 정합) |
| "입니다." 텍스트 y | (시프트) | 1454 (PDF 정합) |

### 검증 절차
1. http://localhost:7700 접속 (Ctrl+Shift+R)
2. **`samples/pr-149.hwp`** 로드 → 그림 cluster 영역 한글 2022 PDF (`pdf/pr-149-2022.pdf` 영역 영역) 영역 정합 영역 확인
3. (회귀 점검) 동일 패턴 fixture 영역 (exam_science / exam_eng / hwp-img-001 / k-water-rfp / kps-ai / mel-001 / hwpspec / hwp-3.0-HWPML) 영역 시각 회귀 부재 영역

검증 결과 알려주시면 최종 보고서 + Issue #683 close + devel push + archives 이동 진행하겠습니다.

작성: 2026-05-08
