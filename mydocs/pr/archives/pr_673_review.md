---
PR: #673
제목: Task #671: 표 셀 내부 paragraph 줄바꿈 시 다중 LINE_SEG 줄 겹침 정정 (closes #671)
컨트리뷰터: @jangster77 (Taesup Jang) — 13번째 사이클 PR (HWP 3.0 파서 영역의 핵심 영역 컨트리뷰터 — PR #451 부터 누적)
base: devel (DIRTY → 메인테이너 통합 정정 후 정합)
처리: 3 commits 단계별 보존 no-ff merge + 메인테이너 후속 commit (A1 자동보정 정정)
처리일: 2026-05-08
---

# PR #673 검토 보고서

## 1. 메타 정보

| 항목 | 값 |
|------|-----|
| PR 번호 | #673 |
| 제목 | Task #671: 표 셀 내부 paragraph 줄바꿈 시 다중 LINE_SEG 줄 겹침 정정 |
| 컨트리뷰터 | @jangster77 (Taesup Jang) — 13번째 사이클 PR (HWP 3.0 파서 영역의 핵심 영역 컨트리뷰터 — PR #451 부터 누적) |
| base / head | devel / local/task671 |
| mergeStateStatus | DIRTY → 메인테이너 충돌 해결 |
| CI | ALL SUCCESS |
| 변경 규모 | +1218 / -10, 14 files |
| 커밋 수 | 3 (Stage 1, 2, 3) + 메인테이너 후속 1 (A1) |
| closes | #671 |
| 잔존 분리 | Issue #672 (TAC 표 비례 축소 시 셀 콘텐츠 클립) |

## 2. Issue #671 본질

`samples/계획서.hwp` 1페이지 표 셀에서 단일 paragraph 가 셀 너비에 맞춰 다중 줄로 줄바꿈될 때 두 줄 이상이 같은 y 좌표에 겹쳐 그려짐 (글자가 굵게 보이는 시각 결함).

### 본질 진단
모든 셀 paragraph 가 `line_segs.len() == 0` 상태 — 한컴이 PARA_LINE_SEG 영역을 의도적으로 인코딩하지 않은 케이스.

`project_hancom_lineseg_behavior` 메모리 룰 정합:
> 한컴은 LINE_SEG가 비어있어도 자체 조판 엔진으로 재계산하여 렌더링. LINE_SEG 는 캐시일 뿐.

→ 본 환경 영역의 composer fallback 영역 (`composer.rs:296-323`) 영역이 단일 ComposedLine 영역으로 압축 영역 = 자동 보정 영역의 미적용 영역. 작업지시자 가설 정확.

## 3. PR 의 정정 (Stage 1~3)

### 본질 정정 — `recompose_for_cell_width`
`src/renderer/composer.rs` 영역의 신규 함수 영역 (Stage 2):

```rust
pub fn recompose_for_cell_width(
    composed: &mut ComposedParagraph,
    para: &Paragraph,
    cell_inner_width_px: f64,
    styles: &ResolvedStyleSet,
)
```

**3 중 가드 (회귀 0 보장)**:
1. `para.line_segs.is_empty()` — 한컴 인코딩 부재만
2. `composed.lines.len() == 1` — fallback 단일 ComposedLine 만
3. 측정 폭 > `cell_inner_width_px` — 너비 안에 들어가면 분할 불필요

**호출 위치 (6곳)**:
- `composer.rs` (신규 함수)
- `table_layout.rs:1226, 614, 678, 700` (셀 layout 렌더링 + resolve_row_heights 측정)
- `table_partial.rs:94, 358` (분할 표)
- `height_measurer.rs:527, 712` (MeasuredTable row_heights)

## 4. 메인테이너 후속 정정 (A1) — 자동보정 회귀 영역

### 작업지시자 시각 검증에서 발견
> "그대로 보기 하면 2줄로 처리되지만 오히려 자동보정 선택하면 한줄로 겹쳐집니다."

### 본질 영역 점검
- 자동보정 영역은 `wasm.reflowLinesegs()` → `reflow_linesegs_on_demand()` 영역 호출
- `document.rs:270` (자동 경로) + `:425` (사용자 명시 경로) 영역 영역 두 곳 모두 영역:
  ```rust
  reflow_line_segs(cell_para, col_width, &styles, dpi);
                                // ↑ column 폭 영역 (본문 폭) 사용
  ```
- 주석 의도: "셀 너비가 아직 불확정이므로 컬럼 너비를 근사값으로 사용. ... 실제 셀 내 줄바꿈은 테이블 레이아웃이 재수행한다."
- 그러나 layout 영역 (`recompose_for_cell_width`) 영역의 가드 #1 (`line_segs.is_empty()`) 영역이 자동보정 영역 영역 채움 영역 후 거짓 영역 → **재수행 영역 미작동** = 한 줄 겹침 회귀

### A1 정정 (메인테이너 후속 commit `4d354d2e`)

```rust
// 두 곳 영역 모두 영역 동일 본질 영역 정정
let cell_w_px = hwpunit_to_px(cell.width as i32, dpi);
let pad_left = hwpunit_to_px(cell.padding.left as i32, dpi);
let pad_right = hwpunit_to_px(cell.padding.right as i32, dpi);
let cell_inner_width = (cell_w_px - pad_left - pad_right).max(1.0);
reflow_line_segs(cell_para, cell_inner_width, styles, dpi);
```

→ 자동보정 영역 자체 영역에서 셀 폭 영역으로 LINE_SEG 영역 채움 영역 → 한 줄 영역 → 다중 줄 영역 정정 영역 직접 영역 적용 영역.

## 5. 본 환경 검증 결과

### 5.1 cherry-pick + 충돌 해결
- Stage 1, 2 — 깨끗한 cherry-pick (table_partial.rs 자동 머지)
- Stage 3 — orders 영역 ours (devel 보존), report + working 영역만 적용

### 5.2 결정적 검증 (PR + A1 통합)
- `cargo test --release` → ALL PASS, failed 0건
- `cargo test --release --lib` → 1165 passed (회귀 0)
- `cargo test --release --test svg_snapshot` → 7/7
- `cargo test --release --test issue_546` → 1/1
- `cargo test --release --test issue_554` → 12/12
- `cargo clippy --release` → clean

### 5.3 광범위 회귀 sweep
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

→ 회귀 0건. PR 본문 명시 영역 (187 fixture / 2013 pages 영역의 0 차이) 영역 정합.

### 5.4 시각 검증
- WASM 빌드 완료 (`pkg/rhwp_bg.wasm` 4,589,092 bytes — A1 통합)
- 작업지시자 시각 판정:
  - **1차 (PR 영역만)**: 그대로 보기 ★ 통과 / 자동보정 회귀 발견
  - **2차 (PR + A1)**: **★ 성공** ("성공입니다")

## 6. 결정

**3 commits 단계별 보존 no-ff merge** + 메인테이너 후속 commit (A1 자동보정 영역 정정).

merge commit: `a6645ed7` (PR #673 본 영역)
A1 정정 commit: `4d354d2e` (메인테이너 후속 영역)

## 7. 메모리 룰 적용 결과

### `feedback_visual_judgment_authority`
> 결정적 검증만으로 부족, 메인테이너 시각 판정 영역의 권위 사례

→ **본 PR 영역의 권위 사례 강화** — 1차 시각 판정에서 자동보정 회귀 영역 발견 영역, 본질 영역 점검 영역으로 A1 정정 영역 도출 영역. 결정적 검증 (1165 lib + 광범위 sweep 0) 영역 통과 영역에도 시각 판정 영역에서만 검출 영역.

### `project_hancom_lineseg_behavior`
> 한컴은 LINE_SEG가 비어있어도 자체 조판 엔진으로 재계산하여 렌더링

→ 본 PR 영역의 본질 영역 정확 정합. 본 환경 영역의 정정 영역 영역도 동일 본질 영역 — 셀 폭 영역으로 자체 재계산 영역.

### `feedback_hancom_compat_specific_over_general`
→ 본 PR 영역의 3중 가드 영역의 본질 영역 정합 — 한컴 인코딩 부재 영역만 검출 영역하고 영역 정상 인코딩 영역 무영향 영역. Issue #672 (TAC 표 비례 축소) 영역의 별도 본질 영역 분리 영역의 정합 영역.

### `feedback_pr_supersede_chain` 영역의 확장 영역
→ 본 PR 영역의 패턴 영역은 **PR + 메인테이너 후속 정정 영역의 통합 머지** 영역. 작업지시자 시각 판정 영역에서 본질 영역의 추가 결함 영역 발견 영역의 본질 영역 정합 영역. 컨트리뷰터 영역의 본 PR 영역의 본질 영역 영역과 메인테이너 영역의 후속 정정 영역의 본질 영역 영역 정합 영역.

## 8. 산출물

| 산출물 | 경로 |
|--------|------|
| 검토 + 처리 보고서 (본 문서 + report) | `mydocs/pr/archives/pr_673_review.md` + `pr_673_report.md` |
| merge commit (PR 영역) | `a6645ed7` |
| A1 정정 commit (메인테이너 후속) | `4d354d2e` |
| 권위 자료 영구 보존 | `samples/계획서.hwp` (143KB) |
| 진단 도구 영구 보존 | `examples/inspect_task671.rs`, `examples/inspect_task671_v2.rs` |
| 회귀 차단 가드 | `recompose_for_cell_width` 3중 가드 + cell.width 산출 정합 |
| 잔존 분리 | Issue #672 (별건 본질) |

## 9. 컨트리뷰터 응대

@jangster77 (Taesup Jang) 13번째 사이클 PR 안내:
- 본질 정정 정확 (`recompose_for_cell_width` 영역의 본질 진단 + 3중 가드)
- 한컴 LINE_SEG 비표준 영역의 자동 보정 영역의 본질 영역과 정합
- 메인테이너 후속 정정 (A1) — 자동보정 영역의 회귀 영역의 본질 영역 영역 통합 정정 영역
- 본 환경 결정적 검증 통과 + 광범위 sweep 회귀 0
- 작업지시자 시각 판정 ★ 성공
- merge 결정

작성: 2026-05-08
