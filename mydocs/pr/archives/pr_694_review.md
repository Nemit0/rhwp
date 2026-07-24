---
PR: #694
제목: Task #688 — table-vpos-01.hwpx p.5 nested 11×3 그리드 시각 누락 정정
컨트리뷰터: @planet6897 (Jaeuk Ryu)
base / head: devel / pr-task688-stream
mergeStateStatus: DIRTY (충돌)
mergeable: CONFLICTING
CI: ALL SUCCESS (PR 시점 4 commits)
변경 규모: +662 / -24, 9 files (4 commits)
closes: #688
검토일: 2026-05-09
---

# PR #694 검토

## 1. 메타

| 항목 | 값 |
|------|-----|
| PR 번호 | #694 |
| 제목 | Task #688: table-vpos-01.hwpx p.5 nested 표 외부 셀 height 미반영 |
| 컨트리뷰터 | @planet6897 (Jaeuk Ryu) — 누적 22 머지 + 다수 열린 PR |
| base / head | devel / pr-task688-stream |
| mergeStateStatus | **DIRTY** (충돌, 메인테이너 통합 정정 필요) |
| mergeable | CONFLICTING |
| CI | ALL SUCCESS (Build & Test, CodeQL ×3, Render Diff, Canvas visual diff) |
| 변경 규모 | +662 / -24, 9 files (소스 2 + 문서 7) |
| 커밋 수 | 4 (Stage 1, Stage 2, Stage 3 fix, Stage 3) |
| closes | #688 |

## 2. Issue #688 본질

`samples/table-vpos-01.hwpx` 5쪽 마지막 큰 표 (pi=34, "정부혁신 4대 추진전략 / 12대 추진과제") 의 nested 11×3 그리드가 SVG 출력에서 시각 누락. 외부 1×1 표 height 가 778.8px (권위) → 57.72px (실측) 으로 ~14배 부족하게 잡힘. PDF 권위본 `pdf/table-vpos-01-2022.pdf` 5쪽과 시각 부정합.

## 3. 결함 본질 — 두 곳 동일 코드 결함

외부 1×1 셀 안에 nested 표 2개 (1×1 헤더 + 11×3 그리드) 가 분리된 paragraph 로 들어 있는 구조에서:

- [src/renderer/layout/table_layout.rs:151](src/renderer/layout/table_layout.rs#L151) `layout_table()` 의 1×1 wrapper unwrap
- [src/renderer/height_measurer.rs:456](src/renderer/height_measurer.rs#L456) `measure_table_impl()` 의 1×1 wrapper unwrap

두 곳 모두 `cell.paragraphs.iter().flat_map(|p| p.controls.iter()).find_map(...)` 으로 셀 paragraphs 전체를 훑어 **첫 nested 표만** 가져오는 패턴. paragraphs 가 2개 이상이면 두 번째 nested 표가 통째 누락:

- `layout_table`: 외부 표가 nested 1×1 헤더로 unwrap → 11×3 그리드 누락
- `measure_table`: `measured_table.row_heights = [57.72px]` (1×1 헤더 height 만) → cell-clip 이 작게 잡혀 nested 11×3 셀 (y=295~) 이 클립 밖

두 결함이 결합되어 페이지 5 의 nested 11×3 그리드가 SVG 에 누락.

## 4. PR 의 정정 — 4 조건 가드

두 곳 모두 unwrap 조건을 다음 4가지 모두 충족하는 경우로 좁힘:

1. 외부 표 1×1 단일 셀 (현행)
2. **`cell.paragraphs.len() == 1`** (신규)
3. **그 paragraph 의 `controls.len() == 1` 이고 그 control 이 nested table** (신규)
4. visible text 없음 (현행)

```rust
if table.row_count == 1 && table.col_count == 1 && table.cells.len() == 1 {
    let cell = &table.cells[0];
    if cell.paragraphs.len() == 1 {
        let p = &cell.paragraphs[0];
        let has_visible_text = p.text.chars()
            .any(|ch| !ch.is_whitespace() && ch != '\r' && ch != '\n');
        let only_one_nested_table = p.controls.len() == 1
            && matches!(p.controls.first(), Some(Control::Table(_)));
        if !has_visible_text && only_one_nested_table {
            if let Some(Control::Table(t)) = p.controls.first() {
                return self.layout_table(...t.as_ref()...);
            }
        }
    }
}
```

## 5. 충돌 분석 (mergeStateStatus = DIRTY)

PR 분기 base (`2fe386c4`) 이후 devel 에 다음이 누적 → 충돌 발생:

- **PR #681 (`17877314`, Task #680)** — 동일 1×1 wrapper 분기에 자료 박스 외곽 테두리 추가 분기 삽입 (`exam_social.hwp` pi=15 4번 박스 외곽선 누락 정정)
- PR #678, #675, #676, #679, #687, #691 — 본 충돌 영역과 무관

`git merge-tree` 로 검출한 충돌:

| 파일 | 종류 | 비고 |
|------|------|------|
| `src/renderer/layout/table_layout.rs` | content | PR #681 외곽 테두리 분기와 PR #694 4 조건 가드 동일 영역 |
| `src/renderer/height_measurer.rs` | (auto-merge) | PR #681 미수정 영역 — 충돌 없음 |
| `mydocs/orders/20260508.md` | add/add | 양쪽 동일 날짜 orders 문서 별도 추가 |

## 6. 메인테이너 통합 정정 방향 — `controls.len() == 1` 가드 완화 필요

PR #694 의 4 조건 가드를 그대로 적용하면 PR #681 외곽 테두리 분기까지 회귀 발생.

### 회귀 검증 — `exam_social.hwp` pi=15

본 환경 `cargo run --bin rhwp -- dump samples/exam_social.hwp -s 0 -p 15` 실측:

```
--- 문단 0.15 --- cc=9, text_len=0, controls=1
  [0] 표: 1행×1열, 셀=1, padding=(850,850,850,850)
  [0]   셀[0] r=0,c=0 paras=1 text=""
  [0]     p[0] ps_id=41 ctrls=2 text_len=0 lh=26074
                       ↑ controls=2 (정렬 마커 + nested 표)
  [0]     p[0] 내부표: 6행×3열 (대화체 16셀)
```

- `paragraphs.len() == 1` ✓
- `controls.len() == 1` ✗ — **2** (정렬 마커 + nested 표)

→ PR #694 가드 미충족 → 1×1 wrapper unwrap 미발동 → **PR #681 외곽 테두리 분기 미발동** → 4번 자료 박스 외곽선 회귀 누락.

### 통합 정정 방향

`controls.len() == 1` 조건을 제거하고 `paragraphs.len() == 1` 만 유지. nested table 추출은 `find_map` 으로 첫 Control::Table 만 골라 다른 control (정렬 마커 등) 무시.

```rust
if cell.paragraphs.len() == 1 {
    let p = &cell.paragraphs[0];
    let has_visible_text = p.text.chars().any(|ch| !ch.is_whitespace() && ch != '\r' && ch != '\n');
    if !has_visible_text {
        if let Some(nested) = p.controls.iter()
            .find_map(|c| if let Control::Table(t) = c { Some(t.as_ref()) } else { None })
        {
            // PR #681 외곽 테두리 추가 + nested unwrap
        }
    }
}
```

**합리화** (메모리 룰 `feedback_hancom_compat_specific_over_general` 정합):

- Task #688 본질 (다중 paragraph 의 nested 표 누락 방지) → **`paragraphs.len() == 1`** 가드만으로 충분
- `controls.len() == 1` 은 **과도한 정밀화** — exam_social pi=15 처럼 `paragraphs=1` 이지만 `controls=2` 인 케이스에서 unwrap + 외곽선 모두 보존되어야 함
- `find_map` 으로 다른 control 무시하고 첫 nested table 만 사용 — 안전

두 곳 (table_layout.rs + height_measurer.rs) 모두 동일 정정 (메모리 룰 `feedback_image_renderer_paths_separate` 정합).

## 7. 검증 게이트 (구현 단계 DoD)

### 자기 검증
- [ ] `cargo test --release --lib` 1166+ 전부 통과
- [ ] `cargo test --release --test issue_nested_table_border` 1/1 통과 (PR #681 회귀 가드)
- [ ] `cargo test --release --test svg_snapshot` 8/8
- [ ] `cargo test --release` 전체 GREEN
- [ ] `cargo clippy --release` clean
- [ ] 광범위 회귀 sweep — 페이지 카운트 변동 0

### 작업지시자 시각 판정 게이트 (메모리 룰 `feedback_visual_regression_grows`)
- [ ] `samples/table-vpos-01.hwpx` p.5 — nested 11×3 그리드 (4그룹 + 12 추진과제) 완전 표시, PDF 권위본 `pdf/table-vpos-01-2022.pdf` 정합
- [ ] `samples/exam_social.hwp` p.1 — 4번 자료 박스 외곽선 정상 출력 (PR #681 본질 보존)

## 8. 메모리 룰 적용

| 룰 | 적용 |
|----|------|
| `feedback_pr_supersede_chain` | PR #681 (외곽 테두리) → PR #694 (1×1 unwrap 정밀화) 동일 분기 충돌. 메인테이너 통합 정정 패턴 |
| `feedback_hancom_compat_specific_over_general` | `controls.len() == 1` 가드는 과도한 정밀화. `paragraphs.len() == 1` 만 본질 가드로 보존 |
| `feedback_image_renderer_paths_separate` | table_layout.rs + height_measurer.rs 두 경로 동일 정정 적용 |
| `feedback_visual_regression_grows` | byte 비교 외에 작업지시자 시각 판정 (table-vpos-01 p.5 + exam_social p.1) 게이트 필수 |
| `feedback_contributor_cycle_check` | @planet6897 누적 22 머지 + 다수 열린 PR (핵심 컨트리뷰터) — "첫 사이클" 표현 금지 |

## 9. 보조 관찰 (별개 결함, 본 PR 범위 외)

- 페이지 2 hwp_used diff = -791.9px, 페이지 3 = -1658.3px — 본 수정과 무관, 후속 이슈 분리 권장
- 1×1 wrapper unwrap 로직이 `layout_table` + `height_measurer` 두 곳 중복 — 향후 공통 helper 추출 검토

## 10. 처리 순서 (승인 후)

1. `local/devel` 에서 PR #694 머지 시도 → 충돌 발생
2. `src/renderer/layout/table_layout.rs` 수동 충돌 해결 (PR #681 외곽 테두리 분기 + PR #694 `paragraphs.len() == 1` 가드 통합, `controls.len() == 1` 제외)
3. `src/renderer/height_measurer.rs` 동일 가드 정정 (auto-merge 수용 후 보강)
4. `mydocs/orders/20260508.md` 충돌 해결 (양쪽 내용 통합)
5. 자기 검증 (cargo test / clippy / 회귀 sweep)
6. **작업지시자 시각 판정 요청** (table-vpos-01.hwpx p.5 + exam_social.hwp p.1)
7. 시각 판정 통과 → merge + WASM 빌드 + Issue #688 close + archives 이동 + orders 갱신 + push

---

작성: 2026-05-09
