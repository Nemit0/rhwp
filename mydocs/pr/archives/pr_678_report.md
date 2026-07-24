---
PR: #678
제목: Task #674: paragraph_layout 측정 corrected_line_height 보정 — 마지막 줄 시각 클립 정정 (closes #674)
컨트리뷰터: @jangster77 (Taesup Jang) — 15번째 사이클 PR (HWP 3.0 파서 영역 핵심 컨트리뷰터)
처리: MERGE (3 commits 단계별 보존 no-ff merge — Task #671~#674 시리즈 완성)
처리일: 2026-05-08
---

# PR #678 최종 보고서

## 1. 결정

**3 commits 단계별 보존 no-ff merge** — Task #671 ~ #674 영역 시리즈 완성 영역.

merge commit: `f8b38cca`

작업지시자 시각 판정:
> "웹 에디터 검증 통과입니다. 이제 그대로 보기에서도 조판이 정상 동작합니다."

**그대로 보기 영역 + 자동보정 영역 모두 정합** ★ — PR #675 영역의 잔존 영역 (그대로 보기 영역의 클립핑 영역) 영역 자연 해소 영역 정합.

## 2. Task #671 ~ #674 영역 시리즈 완성

@jangster77 영역의 본 환경 영역의 4 단계 영역 본질 분리 영역 시리즈 영역의 완성 영역:

| Task | 본질 영역 | 정정 위치 | PR | 머지 commit |
|------|----------|-----------|-----|-------------|
| #671 | 셀 paragraph line_segs 부재 영역의 단일 ComposedLine 영역 압축 | composer.rs (recompose_for_cell_width + 6 곳 호출) | PR #673 | `a6645ed7` + A1 `4d354d2e` (자동보정 정정) |
| #672 | TAC 표 비례 축소 임계값 영역 | height_measurer.rs:822 (2% 가드) | PR #675 | `877e020f` |
| **#674** | **calc_para_lines_height corrected_line_height 누락** | **table_layout.rs:746** | **PR #678** | **`f8b38cca`** |

**시리즈 본질 영역의 정합**:
- 한컴 PARA_LINE_SEG 영역을 의도적 비표준 영역으로 인코딩한 영역 케이스 영역 (samples/계획서.hwp)
- 본 환경 영역의 자체 재계산 영역의 4 단계 영역 본질 영역 영역 정정 영역
- `project_hancom_lineseg_behavior` 영역 정합 영역 — 한컴 영역의 LINE_SEG 영역 부재 영역에서도 영역 자체 조판 엔진 영역 재계산 영역

## 3. 본 PR 영역의 본질 정정 (Task #674)

### 결함 메커니즘
```
calc_composed_paras_content_height
  ↓
calc_para_lines_height (corrected_line_height 누락!)
  → line.line_height (raw 5.33 px) 그대로 사용
  → 3줄 × 5.33 = 16.00 (잘못된 측정)
  ↓
mechanical_offset = (inner_height 64 - total 16) / 2 = 24.00 (Center 정렬)
  ↓
text_y_start = cell_y + pad_top + 24.00 = 379.37 (24px 위로 밀림)
  ↓
줄 2 y = 422.04 (cell-clip 421.25 초과 → SVG 클립)
```

### 정정 영역
`src/renderer/layout/table_layout.rs:746` 영역의 `calc_para_lines_height` 영역 시그니처 영역에 `styles` 영역 추가 + `corrected_line_height` 영역 보정 적용 영역.

```rust
let raw_lh = hwpunit_to_px(line.line_height, self.dpi);
let max_fs = line.runs.iter()
    .map(|r| styles.char_styles.get(r.char_style_id as usize)
        .map(|cs| cs.font_size).unwrap_or(0.0))
    .fold(0.0f64, f64::max);
let h = crate::renderer::corrected_line_height(
    raw_lh, max_fs, cell_ls_type, cell_ls_val);
```

호출자 시그니처 정정:
- `calc_cell_paragraphs_content_height`
- `calc_composed_paras_content_height`

### 정정 효과 (PR 본문)

| 항목 | BEFORE | AFTER |
|------|--------|-------|
| line_height 보정 | 없음 (raw 5.33) | corrected (21.33) ✅ |
| total_content_height (3줄) | 16.00 | **64.00** ✅ |
| mechanical_offset (Center) | 24.00 | **0.00** ✅ |
| text_y_start | 379.37 | **355.37** ✅ |
| 줄 2 y | 422.04 (clip 초과) | **397.71 (clip 안)** ✅ |

## 4. 본 환경 검증 결과

### 4.1 cherry-pick simulation
- `local/pr678-sim` 브랜치 영역, Task #674 영역의 3 commits cherry-pick (Task #671/#672 영역은 PR #673/#675 영역에서 머지됨)
- Stage 3 영역의 `orders/20260507.md` 영역 충돌 영역 — ours (devel 보존)

### 4.2 결정적 검증
- `cargo test --release` → ALL PASS, failed 0건
- `cargo test --release --lib` → 1165 passed (회귀 0)
- `cargo test --release --test svg_snapshot --test issue_546 --test issue_554` → 20/20
- `cargo clippy --release` → clean

### 4.3 광범위 회귀 sweep
```
TOTAL: pages=170 same=170 diff=0 ✅
```

→ 7 샘플 170 페이지 영역 회귀 0 영역. 본 PR 영역의 본질 영역 영역 정확성 영역 정합 (line_segs 부재 영역의 셀 paragraph 영역만 영역에 영향 영역).

### 4.4 시각 검증
- WASM 빌드 완료 (`pkg/rhwp_bg.wasm` 4,589,700 bytes)
- 작업지시자 시각 판정: **★ 통과**
  - 인용: "웹 에디터 검증 통과입니다. 이제 그대로 보기에서도 조판이 정상 동작합니다."
  - 그대로 보기 영역 + 자동보정 영역 모두 정합 영역
  - PR #675 영역의 잔존 영역 (그대로 보기 영역의 클립핑 영역) 영역 자연 해소 영역

## 5. 시리즈 완성 영역의 본질 영역

### 본질 영역의 4 단계 영역 (한컴 LINE_SEG 비표준 영역 영역)

```
samples/계획서.hwp 영역의 한컴 영역 비표준 영역
  ↓ (셀 paragraph 영역의 PARA_LINE_SEG 의도적 인코딩 부재 영역)
1) line_segs 부재 영역 → composer fallback 영역 단일 ComposedLine 압축 (Task #671)
   ↓ recompose_for_cell_width 영역 (composer.rs)
2) TAC 표 비례 축소 영역 발동 영역 (Task #672)
   ↓ TAC_SHRINK_THRESHOLD_RATIO = 0.02 영역 (height_measurer.rs)
3) 자동보정 영역의 col_width 영역 사용 영역 (메인테이너 후속 A1)
   ↓ cell_inner_width 영역 정정 (document.rs)
4) calc_para_lines_height 영역의 corrected_line_height 누락 영역 (Task #674)
   ↓ styles 시그니처 + 보정 (table_layout.rs)
```

### 한컴 권위 영역과의 정합 영역
- 한컴 영역: LINE_SEG 영역 비어 있어도 영역 자체 조판 엔진 영역 재계산 영역
- 본 환경 영역: 4 단계 영역 본질 영역 정정 영역으로 영역 한컴 영역 정합 영역 도달 영역

## 6. 메모리 룰 적용 결과

### `feedback_visual_judgment_authority` 권위 사례 강화
> 결정적 검증만으로 부족, 메인테이너 시각 판정 영역의 권위 사례

→ Task #671 ~ #674 영역의 4 단계 영역 본질 영역 영역의 작업지시자 시각 판정 영역 영역 정확 영역 — 각 단계 영역에서 영역 시각 판정 영역에서만 영역 회귀 / 잔존 영역 검출 영역. 본 PR 영역에서 시리즈 완성 영역.

### `feedback_pr_supersede_chain` 권위 사례 확장 — 동일 컨트리뷰터 영역의 4 단계 영역 본질 분리 영역 시리즈 영역
- 패턴 (a) close + 통합 머지 — PR #649 → #650
- 패턴 (b) 머지 + supersede 머지 — PR #657 → #662
- 패턴 (c) 메인테이너 후속 정정 영역 — PR #673 + A1
- **패턴 (d) 다단계 본질 분리 시리즈** — PR #673 (#671) → #675 (#672) → **#678 (#674)** 영역의 누적 시리즈 영역. 동일 컨트리뷰터 영역의 본질 영역 영역 다른 영역의 봅질 영역 분리 영역의 정합 영역.

### `project_hancom_lineseg_behavior` 권위 사례 영역
> 한컴은 LINE_SEG가 비어있어도 자체 조판 엔진으로 재계산하여 렌더링

→ 본 시리즈 영역의 핵심 본질 영역. 4 단계 영역 본질 영역 정정 영역 영역으로 영역 본 환경 영역의 자체 재계산 영역 정합 영역 도달 영역.

### `feedback_contributor_cycle_check`
→ @jangster77 영역의 15번째 사이클 PR 영역 영역 정확 표현 영역 (PR #451 부터 누적, HWP 3.0 파서 핵심 컨트리뷰터). 메모리 룰 영역 정합.

### `feedback_fix_scope_check_two_paths`
→ Task #671 영역의 layout 정정 영역만으로 부족 영역 → A1 자동보정 영역 정정 영역 추가 영역. Task #674 영역도 영역 calc_para_lines_height 영역의 다중 호출자 영역 시그니처 영역 정합 영역.

## 7. 산출물

| 산출물 | 경로 |
|--------|------|
| 검토 보고서 | `mydocs/pr/archives/pr_678_review.md` |
| 최종 보고서 | `mydocs/pr/archives/pr_678_report.md` (본 문서) |
| merge commit | `f8b38cca` (no-ff, 3 commits 단계별 보존) |
| 시리즈 완성 정리 | Task #671 ~ #674 영역 4 단계 영역 본질 분리 영역 |

## 8. 컨트리뷰터 응대

@jangster77 (Taesup Jang) 15번째 사이클 PR 안내 — Task #671 ~ #674 시리즈 완성 영역:
- 4 단계 영역 본질 분리 영역의 깔끔한 영역 정합 영역
- 각 PR 영역의 본질 영역 영역 다른 영역 영역 정합 영역
- 본 환경 결정적 검증 + 광범위 sweep 회귀 0
- 작업지시자 시각 판정 ★ 통과 — 그대로 보기 + 자동보정 영역 모두 정합 영역
- 한컴 LINE_SEG 비표준 영역의 자체 재계산 영역 정합 영역 도달 영역
- merge 결정 — 시리즈 완성 영역

작성: 2026-05-08
