# Task #688: nested 표 외부 셀 height 미반영 — 구현계획서

## 결함 위치 정밀 분석

`src/renderer/layout/table_layout.rs::layout_table()` 라인 150-168 의 "1×1 래퍼 표 감지" 로직:

```rust
if table.row_count == 1 && table.col_count == 1 && table.cells.len() == 1 {
    let cell = &table.cells[0];
    let has_visible_text = cell.paragraphs.iter()
        .any(|p| p.text.chars().any(|ch| !ch.is_whitespace() && ch != '\r' && ch != '\n'));
    if !has_visible_text {
        if let Some(nested) = cell.paragraphs.iter()
            .flat_map(|p| p.controls.iter())
            .find_map(|c| if let Control::Table(t) = c { Some(t.as_ref()) } else { None })
        {
            return self.layout_table(
                tree, col_node, nested,  // ← 외부 표를 무시하고 첫 nested 만 렌더
                ...
            );
        }
    }
}
```

### 결함 메커니즘

pi=34 외부 1×1 표의 단일 셀 안에:
- `paragraphs[0]` (paras_id=33) controls=1 → nested **1×1 헤더 박스**
- `paragraphs[1]` (paras_id=35) controls=1 → nested **11×3 그리드** (셀 23개)

이 코드는 `flat_map(...).find_map(...)` 로 첫 nested 표(1×1 헤더) 만 찾아 unwrap 한다. **두 번째 nested 표(11×3) 와 외부 표 외곽선 모두 통째로 누락**.

debug overlay 의 `s0:pi=34 ci=0 1x1 y=229.9 width=623.75 height=57.72` 는 사실상 외부 표 자리에 **nested 1×1 헤더 박스**가 그려진 것이며, 외부 표/11×3 그리드는 SVG 어디에도 존재하지 않는다.

### 수정 방향

래퍼 감지 조건을 다음 3가지 모두 충족하는 경우로 좁힌다:

1. `table.row_count == 1 && table.col_count == 1 && table.cells.len() == 1` (현행 유지)
2. `cell.paragraphs.len() == 1` (**신규**: 단일 paragraph)
3. 그 paragraph 의 `controls` 가 정확히 1개의 nested table 만 (다른 control 없음, **신규**)
4. `has_visible_text == false` (현행 유지)

이러면 pi=34 같은 다중 paragraph 셀은 unwrap 대상에서 제외되어 외부 표가 정상 렌더되고, cell 내부 nested 표는 이미 존재하는 셀 렌더 경로 (`layout_table_cells()` 라인 1955-1962, `Control::Table` 재귀 호출) 를 통해 자연스럽게 그려진다.

## 단계 구성 (3단계)

### 1단계: 1×1 래퍼 감지 조건 정밀화 + 대상 샘플 단위 검증

**작업**:
- `src/renderer/layout/table_layout.rs::layout_table()` 라인 150-168 수정
- 조건 추가: `cell.paragraphs.len() == 1 && paragraph.controls.iter().filter(|c| matches!(c, Control::Table(_))).count() == 1 && paragraph.controls.len() == 1`
  - (또는 동등한 좀 더 가독성 좋은 표현)

**검증**:
- `cargo build --release` 성공
- `rhwp dump-pages samples/table-vpos-01.hwpx` 페이지 5의 pi=34 표 height 가 778.8px ± 5px 로 회복
- `rhwp export-svg --debug-overlay samples/table-vpos-01.hwpx` 산출물에서:
  - pi=34 외부 표 rect height ≥ 770px
  - SVG 페이지 5 파일 크기 다른 페이지와 비슷한 수준 (200KB 이상)
  - nested 1×1 헤더 텍스트 ("정부혁신 4대 추진전략, 12대 추진과제") 존재
  - nested 11×3 그리드 셀 텍스트 (4그룹 헤더 + 12개 추진과제) 모두 존재
- PDF 권위본 (`pdf/table-vpos-01-2022.pdf`) 5쪽과 시각 정합 확인

**산출물**: `mydocs/working/task_m100_688_stage1.md`

### 2단계: 광범위 샘플 회귀 검증

**작업**:
- 1×1 래퍼 표를 사용하는 다른 샘플 식별 (`samples/` 하위 grep, `rhwp dump`)
- 해당 샘플들의 SVG 출력을 수정 전/후 비교
- `cargo test` 전체 실행

**검증**:
- 1×1 래퍼 unwrap 의도된 케이스 (paragraphs.len() == 1 + 단일 nested table) 가 여전히 정상 unwrap 됨
- `cargo test` 통과
- SVG diff 에서 의도하지 않은 차이 없음

**회귀 발견 시 처리**:
- 조건 재조정 (예: visible_text 외 다른 control 종류도 허용/거부 정밀화)
- 1단계 산출물 갱신 후 재승인 요청

**산출물**: `mydocs/working/task_m100_688_stage2.md`

### 3단계: 보조 관찰 측정 + 최종 결과보고서

**작업**:
- 수정 전/후 `rhwp dump-pages samples/table-vpos-01.hwpx` 비교:
  - 페이지 1 LAYOUT_OVERFLOW 4.1px 변화 측정
  - 페이지 2 hwp_used diff = -791.9px, 페이지 3 = -1658.3px 변화 측정
- 동일 원인으로 자연 해소되면 보고서에 명시, 별개라면 후속 이슈 후보로 기록 (분리 제안)
- 최종 보고서 작성: 결함 원인 / 수정 내용 / 검증 결과 / 회귀 검증 / 보조 관찰

**산출물**:
- `mydocs/report/task_m100_688_report.md`
- `mydocs/orders/20260508.md` 갱신 (또는 현재 active orders 문서)

## 영향 범위 요약

| 파일 | 변경 내용 | 라인 수 추정 |
|------|----------|------------|
| `src/renderer/layout/table_layout.rs` | 라인 150-168 의 래퍼 감지 조건 정밀화 | +5 / -0 |

수정 라인 수가 작은 단일 위치 결함이므로 구현 자체는 짧다. 회귀 검증과 보조 관찰 측정에 더 많은 시간이 든다.

## 위험도 평가

- **저위험**: 수정은 unwrap 조건을 좁히는 방향이므로, 의도된 1×1 래퍼 케이스는 영향 없음
- **회귀 가능성**: paragraphs.len() == 1 인 단일 nested table 래퍼만 통과시키므로, 기존에 부당하게 unwrap 되던 다른 케이스는 외부 표가 정상 렌더되는 쪽으로 동작 변경
  - 다른 샘플 중 부당 unwrap 으로 정상화되어 있던 표가 있다면 차이 발생 가능 → 2단계 회귀 검증 필수

## 참고

- 수행계획서: `mydocs/plans/task_m100_688.md`
- GitHub Issue: #688
