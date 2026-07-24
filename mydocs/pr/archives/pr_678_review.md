---
PR: #678
제목: Task #674: paragraph_layout 측정 corrected_line_height 보정 — 마지막 줄 시각 클립 정정 (closes #674)
컨트리뷰터: @jangster77 (Taesup Jang) — 15번째 사이클 PR (HWP 3.0 파서 영역 핵심 컨트리뷰터)
base: devel (CLEAN)
mergeable: MERGEABLE
CI: ALL SUCCESS
변경: +738/-4, 8 files (Task #674 영역 3 commits — Task #671/#672 영역은 PR #673/#675 영역에서 머지됨)
처리: cherry-pick + WASM 빌드 + 시각 판정
처리일: 2026-05-08
---

# PR #678 1차 검토 보고서

## 1. 메타 정보

| 항목 | 값 |
|------|-----|
| PR 번호 | #678 |
| 제목 | Task #674: paragraph_layout 측정 corrected_line_height 보정 — 마지막 줄 시각 클립 정정 |
| 컨트리뷰터 | @jangster77 (Taesup Jang) — 15번째 사이클 PR |
| base / head | devel / local/task674 |
| mergeStateStatus | **CLEAN** ✅ |
| mergeable | MERGEABLE |
| CI | ALL SUCCESS |
| 변경 규모 | +738 / -4, 8 files |
| 커밋 수 | 3 (Task #674 영역만 영역 — Task #671/#672 영역의 commits 영역 영역 PR #673/#675 영역에서 머지됨) |
| closes | #674 |

## 2. Task #671 ~ #674 시리즈 영역의 마지막 영역 단계 영역

@jangster77 영역의 본 환경 영역의 4 단계 영역 본질 분리 영역 시리즈 영역:

| Task | 본질 영역 | 정정 위치 | PR 영역 | 처리 영역 |
|------|----------|-----------|---------|----------|
| #671 | 셀 paragraph line_segs 부재 영역의 단일 ComposedLine 영역 압축 영역 | composer.rs (recompose_for_cell_width) | PR #673 | ✅ 머지 + A1 자동보정 정정 |
| #672 | TAC 표 비례 축소 영역의 임계값 영역 영역 영역 영역 | height_measurer.rs:822 (2% 가드) | PR #675 | ✅ 머지 (자동보정 영역 정합 / 그대로 보기 영역 잔존 영역) |
| **#674** | **calc_para_lines_height 영역의 corrected_line_height 영역 누락** | **table_layout.rs:746 (시그니처 + 보정)** | **PR #678** | **본 영역 review** |

## 3. Issue #674 본질 — 24px 오프셋 영역 결함

### 결함 메커니즘 (PR 본문 명시)
```
calc_composed_paras_content_height
  ↓
calc_para_lines_height (corrected_line_height 누락!)
  → line.line_height (raw 5.33 px) 그대로 사용
  → 3줄 × 5.33 = 16.00 (잘못된 측정)
  ↓
total_content_height = 16.00
  ↓
mechanical_offset = (inner_height 64 - total 16) / 2 = 24.00 (Center 정렬)
  ↓
text_y_start = cell_y + pad_top + 24.00 = 379.37 (24 px 위로 밀림)
  ↓
줄 2 y = 422.04 (cell-clip-81 끝 421.25 초과 → SVG 클립)
```

→ **본 PR 영역의 본질 영역 영역이 PR #675 영역의 잔존 영역의 본질 영역** — "그대로 보기 영역의 클립핑 영역" 영역의 본 위치 영역.

### 한 줄 결함 영역의 본질 영역
- raw line_height (5.33px) — 폰트 보정 영역 미적용 영역
- corrected line_height (21.33px) — 폰트 어센트 영역 보정 영역 적용 영역
- 차이 영역: **16px × 3줄 / 2 (Center 정렬) = 24px** 영역 위로 영역 시프트 영역

## 4. PR 의 정정

### 정정 영역
`src/renderer/layout/table_layout.rs:746` 영역 영역 영역 `calc_para_lines_height` 영역 시그니처 영역에 `styles` 영역 추가 + `corrected_line_height` 영역 보정 적용 영역.

```rust
let raw_lh = hwpunit_to_px(line.line_height, self.dpi);
let max_fs = line.runs.iter()
    .map(|r| styles.char_styles.get(r.char_style_id as usize)
        .map(|cs| cs.font_size).unwrap_or(0.0))
    .fold(0.0f64, f64::max);
let h = crate::renderer::corrected_line_height(
    raw_lh, max_fs, cell_ls_type, cell_ls_val);
```

### 호출자 영역 시그니처 정정
- `calc_cell_paragraphs_content_height` → calc_para_lines_height(styles 추가)
- `calc_composed_paras_content_height` → calc_para_lines_height(styles 추가)

### 정정 효과 (PR 본문)

| 항목 | BEFORE | AFTER |
|------|--------|-------|
| line_height 보정 | 없음 (raw 5.33) | corrected (21.33) ✅ |
| total_content_height (3줄) | 16.00 | **64.00** ✅ |
| mechanical_offset (Center) | 24.00 | **0.00** ✅ |
| text_y_start | 379.37 | **355.37** ✅ |
| 줄 2 y | 422.04 (clip 초과) | **397.71 (clip 안)** ✅ |

## 5. 본 환경 cherry-pick simulation

### 5.1 깨끗한 적용
- `local/pr678-sim` 브랜치 영역, Task #674 영역의 3 commits 영역 cherry-pick (Task #671/#672 영역은 PR #673/#675 영역에서 머지됨)
- Stage 3 영역의 `orders/20260507.md` 영역 충돌 영역 — ours (devel 보존)

### 5.2 결정적 검증
- `cargo test --release` → ALL PASS, failed 0건
- `cargo test --release --lib` → 1165 passed (회귀 0)
- `cargo test --release --test svg_snapshot --test issue_546 --test issue_554` → 20/20
- `cargo clippy --release` → clean

### 5.3 광범위 회귀 sweep
```
2010-01-06: total=6 same=6 diff=0
aift: total=77 same=77 diff=0
exam_eng: total=8 same=8 diff=0
exam_kor: total=20 same=20 diff=0
exam_math: total=20 same=20 diff=0
exam_science: total=4 same=4 diff=0
synam-001: total=35 same=35 diff=0
TOTAL: pages=170 same=170 diff=0 ✅
```

→ **회귀 0건** — 다른 fixture 영역 영향 부재 영역. 본 PR 영역의 본질 영역의 정확성 영역 정합 (line_segs 부재 영역의 셀 paragraph 영역만 영역에 영향 영역).

### 5.4 머지 + WASM 빌드
- `local/devel` 영역에 3 commits 단계별 보존 no-ff merge 완료 (merge commit `f8b38cca`)
- WASM 빌드 완료 (`pkg/rhwp_bg.wasm` 4,589,700 bytes, 19:32 갱신)

## 6. 검토 관점

### 6.1 본질 정정 영역의 정확성
- 단일 함수 영역 (`calc_para_lines_height`) 영역의 시그니처 영역 보정 영역 + 호출자 2 곳 영역의 시그니처 영역 정정 영역
- height_measurer 영역과 동일 로직 영역 — 측정/layout 일관성 영역 정합 영역
- 정상 line_segs 인코딩 영역 paragraph 영역: corrected 결과 영역 raw 영역과 비슷 영역 → 영향 미미 영역
- 광범위 sweep 영역 차이 0 영역 입증 영역

### 6.2 회귀 위험성
- 단일 함수 영역의 시그니처 영역 보정 영역
- 광범위 sweep 7 샘플 170 페이지 영역 same=170 / diff=0 ✅
- height_measurer 영역과 동일 로직 영역 정합 영역

### 6.3 PR #675 영역의 잔존 영역과의 정합 영역

PR #675 영역 처리 영역 시 영역 작업지시자 시각 판정:
> "그래도 보기 선택 시 셀내 2줄인 경우 클립핑 현상 그대로 유지됨."

→ **본 PR 영역의 본질 영역이 PR #675 영역의 잔존 영역의 본질 영역**. PR #675 영역 머지 영역 시 영역의 작업지시자 결정 영역 ("머지 유지 영역 — PR #678 머지 시 그대로 보기 영역의 클립핑 영역 자연 해소 영역") 영역의 정합 영역.

## 7. 메모리 룰 관점

### `feedback_visual_judgment_authority`
→ PR 본문 명시 영역의 시각 판정 ★ 통과 영역 (셀 [13] 회귀 0 + 셀 [21] 3줄 정상 + 셀 [52] 3 paragraph 정상). 작업지시자 환경 영역 시각 판정 게이트 영역 필요 영역.

### `feedback_pr_supersede_chain` 권위 사례 확장 영역 — 동일 컨트리뷰터 영역의 다단계 본질 분리 영역
PR #673 (#671) → PR #675 (#672) → **PR #678 (#674)** 영역의 누적 영역의 본질 분리 영역 영역 정합 영역. 각 PR 영역의 본질 영역 영역 다른 영역 — 컨트리뷰터 영역의 깔끔한 분리 영역의 정합 영역. 본 PR 영역의 머지 영역 시 영역 시리즈 영역 완성 영역.

### `feedback_contributor_cycle_check`
→ @jangster77 영역의 15번째 사이클 PR 영역 영역 정확 표현 영역 (PR #451 부터 누적, HWP 3.0 파서 핵심 컨트리뷰터). 메모리 룰 영역 정합.

### `project_hancom_lineseg_behavior`
→ 본 PR 영역도 영역 한컴 LINE_SEG 비표준 영역의 본질 영역 영역 영역 — line_segs 부재 영역 paragraph 영역의 corrected_line_height 영역 보정 영역의 본질 영역.

## 8. 작업지시자 결정 요청 — 시각 검증

### 시각 검증 대상

**파일**: `samples/계획서.hwp`

### 핵심 케이스 (PR 본문 명시)

| 셀 | r,c | 영역 | BEFORE (PR #675 까지) | AFTER (PR #678) |
|----|-----|------|---------------------|------------------|
| **[13]** | 3,1 | "탈레스 HSM 관리 시스템 및 REST API" | 2줄 정상 | 2줄 정상 (회귀 0) |
| **[21]** | 5,1 | "목적" 영역 영역 | 2줄 (마지막 줄 클립) | **3줄 모두 표시** |
| **[52]** | — | "특허 취득" | 2 paragraph (◦특허의뢰 누락) | **3 paragraph 모두 표시** |

### 두 모드 영역 모두 영역 정합 영역 기대 영역
- **그대로 보기 영역**: PR #675 영역의 잔존 영역 (클립핑 영역) 영역 자연 해소 영역
- **자동보정 영역**: PR #675 영역의 정합 영역 보존 영역

### 검증 절차

1. http://localhost:7700 접속 (Ctrl+Shift+R 강제 새로고침)
2. **`samples/계획서.hwp`** 로드
3. **그대로 보기** 영역 — 셀 [21] 3줄 모두 표시 영역 + 셀 [52] 3 paragraph 모두 표시 영역 (PR #675 영역의 잔존 클립핑 해소 영역)
4. **자동보정** 영역 — 동일 결과 영역 (PR #675 영역 정합 영역 보존 영역)
5. (회귀 점검) 다른 셀 영역 영역 변경 영역 부재 영역 + 다른 샘플 (광범위 sweep 영역 0 정합 영역) 영역 변경 부재 영역

### 회귀 점검 영역
- 광범위 sweep 7 샘플 170 페이지 same=170 / diff=0 ✅
- 1165 lib + svg_snapshot 7/7 + issue_546/issue_554 13/13

검증 결과 알려주시면 최종 보고서 + Issue #674 close + devel push + archives 이동 진행하겠습니다.

작성: 2026-05-08
