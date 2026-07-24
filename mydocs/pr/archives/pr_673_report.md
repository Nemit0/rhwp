---
PR: #673
제목: Task #671: 표 셀 내부 paragraph 줄바꿈 시 다중 LINE_SEG 줄 겹침 정정 (closes #671)
컨트리뷰터: @jangster77 (Taesup Jang) — 13번째 사이클 PR (HWP 3.0 파서 영역의 핵심 영역 컨트리뷰터 — PR #451 부터 누적)
처리: MERGE (3 commits 단계별 보존 + 메인테이너 후속 commit A1 자동보정 정정)
처리일: 2026-05-08
---

# PR #673 최종 보고서

## 1. 결정

**3 commits 단계별 보존 no-ff merge** + **메인테이너 후속 commit A1 (자동보정 영역 정정)**.

| commit | 영역 |
|--------|------|
| `a6645ed7` | merge commit (PR #673 본 영역) |
| `4d354d2e` | A1 정정 commit (메인테이너 후속 — 자동보정 셀 폭 영역) |

## 2. 본 PR 영역의 본질 정정 (Stage 1~3)

### 본질 진단
`samples/계획서.hwp` 영역의 모든 셀 paragraph 영역의 `line_segs.len() == 0` — 한컴이 PARA_LINE_SEG 영역을 의도적으로 인코딩하지 않은 케이스. 본 환경 영역의 composer fallback 영역이 단일 ComposedLine 영역으로 압축 → 시각 결함 (한 줄 겹침).

`project_hancom_lineseg_behavior` 메모리 룰 정합.

### 신규 함수 — `recompose_for_cell_width`
`src/renderer/composer.rs` (Stage 2) 영역의 신규 함수 영역 + 3중 가드:
1. `para.line_segs.is_empty()` — 한컴 인코딩 부재만
2. `composed.lines.len() == 1` — fallback 단일 ComposedLine 만
3. 측정 폭 > `cell_inner_width_px` — 너비 안에 들어가면 분할 불필요

호출 위치 6 곳 (table_layout.rs, table_partial.rs, height_measurer.rs).

## 3. 메인테이너 후속 정정 (A1) — 자동보정 회귀

### 작업지시자 시각 검증에서 발견
> "그대로 보기 하면 2줄로 처리되지만 오히려 자동보정 선택하면 한줄로 겹쳐집니다."

### 본질
`document.rs:270` (자동 경로) + `:425` (사용자 명시 영역 자동보정 경로) 영역 모두 영역 셀 paragraph 영역에 **column 폭 (`col_width`)** 영역 사용 영역. 그 결과 영역 셀 paragraph 영역의 LINE_SEG 영역이 column 폭 영역에 맞게 채워져 영역 본 PR 영역의 가드 #1 (`line_segs.is_empty()`) 영역 거짓 영역 → layout 영역의 정정 영역 미적용 영역 → 한 줄 겹침 영역.

### A1 정정 (commit `4d354d2e`)
```rust
// 정정 전
reflow_line_segs(cell_para, col_width, &styles, dpi);

// 정정 후 (A1)
let cell_w_px = hwpunit_to_px(cell.width as i32, dpi);
let pad_left = hwpunit_to_px(cell.padding.left as i32, dpi);
let pad_right = hwpunit_to_px(cell.padding.right as i32, dpi);
let cell_inner_width = (cell_w_px - pad_left - pad_right).max(1.0);
reflow_line_segs(cell_para, cell_inner_width, styles, dpi);
```

→ 자동보정 영역 자체 영역에서 셀 폭 영역으로 LINE_SEG 영역 채움 영역 → 다중 줄 영역 분할 영역 직접 적용 영역.

## 4. 본 환경 검증 결과

### 4.1 cherry-pick simulation
- `local/pr673-sim` 브랜치, 3 commits cherry-pick
- Stage 3 영역의 orders 영역 충돌 영역 영역 ours (devel 보존)

### 4.2 결정적 검증 (PR + A1 통합)
- `cargo test --release` → ALL PASS, failed 0건
- `cargo test --release --lib` → 1165 passed (회귀 0)
- `cargo test --release --test svg_snapshot` → 7/7
- `cargo test --release --test issue_546 --test issue_554` → 13/13
- `cargo clippy --release` → clean

### 4.3 광범위 회귀 sweep
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

### 4.4 시각 검증
- WASM 빌드 완료 (`pkg/rhwp_bg.wasm` 4,589,092 bytes — A1 통합)
- **1차 시각 판정 (PR 영역만)**: 그대로 보기 영역 ★ 통과 / 자동보정 영역 회귀 발견
- **2차 시각 판정 (PR + A1)**: **★ 성공** ("성공입니다")

### 4.5 본 PR 정정 효과 영역
| 셀 | r,c | BEFORE (devel) | AFTER (PR + A1) |
|----|-----|----------------|------------------|
| [13] | 3,1 | 1줄 압축 (글자 겹침) | 2줄 정상 분리 ✅ |
| [21] | 5,1 | 1줄 압축 (글자 겹침) | 3줄 분리 ✅ |

(그대로 보기 + 자동보정 영역 모두 정합)

## 5. 메모리 룰 적용 결과

### `feedback_visual_judgment_authority` 권위 사례 강화
> 결정적 검증만으로 부족, 메인테이너 시각 판정 영역의 권위 사례

→ 1차 시각 판정에서 자동보정 회귀 영역 발견 영역. 결정적 검증 + 광범위 sweep 통과 영역에도 시각 판정 영역에서만 검출 영역의 권위 사례 영역 누적 영역.

### `project_hancom_lineseg_behavior`
> 한컴은 LINE_SEG가 비어있어도 자체 조판 엔진으로 재계산하여 렌더링

→ 본 PR 영역의 본질 영역 정확 정합. 셀 폭 영역으로 자체 재계산 영역.

### `feedback_hancom_compat_specific_over_general`
→ 본 PR 영역의 3중 가드 영역의 본질 영역 정합. Issue #672 (TAC 표 비례 축소) 영역의 별도 본질 영역 분리 영역.

### `feedback_pr_supersede_chain` 영역의 확장 영역 — PR + 메인테이너 후속 정정 영역의 통합 머지 패턴
컨트리뷰터 영역의 본 PR 영역의 본질 영역과 메인테이너 영역의 후속 정정 영역 (A1) 영역의 통합 머지 영역의 신규 패턴 영역. 시각 판정 영역에서 발견된 회귀 영역의 본질 영역 점검 영역 → 메인테이너 직접 영역 정정 영역의 본질 영역 영역.

## 6. 산출물

| 산출물 | 경로 |
|--------|------|
| 검토 보고서 | `mydocs/pr/archives/pr_673_review.md` |
| 최종 보고서 | `mydocs/pr/archives/pr_673_report.md` (본 문서) |
| merge commit (PR) | `a6645ed7` (no-ff, 3 commits 단계별 보존) |
| A1 정정 commit (메인테이너 후속) | `4d354d2e` |
| 권위 자료 영구 보존 | `samples/계획서.hwp` (143KB) |
| 진단 도구 | `examples/inspect_task671.rs`, `examples/inspect_task671_v2.rs` |
| 잔존 분리 | Issue #672 |

## 7. 컨트리뷰터 응대

@jangster77 (Taesup Jang) 13번째 사이클 PR 안내:
- 본질 정정 정확 (`recompose_for_cell_width` + 3중 가드)
- 메인테이너 후속 정정 (A1 자동보정 영역) 영역의 통합 영역 정합
- 본 환경 결정적 검증 + 광범위 sweep 회귀 0
- 작업지시자 시각 판정 ★ 성공 (그대로 보기 + 자동보정 영역 모두 정합)
- merge 결정

작성: 2026-05-08
