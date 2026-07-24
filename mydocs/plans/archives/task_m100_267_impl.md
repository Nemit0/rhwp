# Task #267 구현 계획서: 목차 right tab 정렬 — 교차 run 처리 통일

> 구현 계획서 | 2026-04-24
> Issue: [#267](https://github.com/edwardkim/rhwp/issues/267)
> Branch: `local/task267`

---

## 1. 구현 단계 (3단계)

| 단계 | 내용 | 파일 |
|------|------|------|
| Stage 2 | 경로 1 수정 — `compute_char_positions` right tab seg_start 공백 skip + eprintln 제거 | `text_measurement.rs` |
| Stage 3 | 경로 2·3 수정 — `pending_right_tab_est/render` right tab 분기만 trim_start 전달 | `paragraph_layout.rs` |
| Stage 4 | 검증 — cargo test + clippy + KTX visual diff + golden SVG 등록 | — |

---

## 2. Stage 2 상세: text_measurement.rs

### 2.1 수정 방법 — `seg_start` 헬퍼 방식

`measure_segment_from`의 시그니처를 변경하지 않고, **right tab 분기에서만** leading space를 skip한 시작 인덱스를 계산하여 전달한다. center tab(tab_type==2) 분기는 현행 `i + 1` 유지.

**공통 헬퍼 패턴** (호출부마다 적용):
```rust
let seg_start = {
    let mut s = i + 1;
    while s < chars.len() && chars[s] == ' ' && cluster_len[s] != 0 {
        s += 1;
    }
    s
};
let seg_w = measure_segment_from(&chars, &cluster_len, seg_start, &char_width);
```

### 2.2 EmbeddedTextMeasurer::compute_char_positions

#### (a) inline_tabs 분기 — L323-325

현재:
```rust
1 => { // 오른쪽
    let seg_w = measure_segment_from(&chars, &cluster_len, i + 1, &char_width);
    x = (tab_target - seg_w).max(x);
}
```

수정 후:
```rust
1 => { // 오른쪽
    let seg_start = { let mut s = i + 1; while s < chars.len() && chars[s] == ' ' && cluster_len[s] != 0 { s += 1; } s };
    let seg_w = measure_segment_from(&chars, &cluster_len, seg_start, &char_width);
    x = (tab_target - seg_w).max(x);
}
```

#### (b) tab_stops 분기 — L343-350

현재:
```rust
1 => { // 오른쪽
    let seg_w = measure_segment_from(&chars, &cluster_len, i + 1, &char_width);
    if tab_type == 1 {
        eprintln!("[DEBUG_TAB_POS] RIGHT tab: abs_x={:.2}, ...");
    }
    x = (rel_tab - seg_w).max(x);
}
```

수정 후:
```rust
1 => { // 오른쪽
    let seg_start = { let mut s = i + 1; while s < chars.len() && chars[s] == ' ' && cluster_len[s] != 0 { s += 1; } s };
    let seg_w = measure_segment_from(&chars, &cluster_len, seg_start, &char_width);
    x = (rel_tab - seg_w).max(x);
}
```
→ `eprintln!` 3행 완전 제거.

### 2.3 WasmTextMeasurer::compute_char_positions

#### tab_stops 분기 — L654-658

현재:
```rust
1 => {
    let seg_w = measure_segment_from(&chars, &cluster_len, i + 1, &char_width);
    x = (rel_tab - seg_w).max(x);
}
```

수정 후:
```rust
1 => {
    let seg_start = { let mut s = i + 1; while s < chars.len() && chars[s] == ' ' && cluster_len[s] != 0 { s += 1; } s };
    let seg_w = measure_segment_from(&chars, &cluster_len, seg_start, &char_width);
    x = (rel_tab - seg_w).max(x);
}
```

---

## 3. Stage 3 상세: paragraph_layout.rs

### 3.1 pending_right_tab_est — L809-816

center tab(tab_type==2) 현행 유지를 위해 `let run_w` 바인딩 공유 대신 **match arm 내에서 각각 계산**.

현재:
```rust
if let Some((tab_pos, tab_type)) = pending_right_tab_est.take() {
    ts.line_x_offset = est_x;
    let run_w = estimate_text_width(&run.text, &ts);
    match tab_type {
        1 => est_x = tab_pos - run_w,
        2 => est_x = tab_pos - run_w / 2.0,
        _ => {}
    }
}
```

수정 후:
```rust
if let Some((tab_pos, tab_type)) = pending_right_tab_est.take() {
    ts.line_x_offset = est_x;
    match tab_type {
        1 => {
            let run_w = estimate_text_width(run.text.trim_start(), &ts);
            est_x = tab_pos - run_w;
        }
        2 => {
            let run_w = estimate_text_width(&run.text, &ts);
            est_x = tab_pos - run_w / 2.0;
        }
        _ => {}
    }
}
```

### 3.2 pending_right_tab_render — L1177-1184

현재:
```rust
if let Some((tab_pos, tab_type)) = pending_right_tab_render.take() {
    text_style.line_x_offset = x - col_area.x;
    let next_w = estimate_text_width(&run.text, &text_style);
    match tab_type {
        1 => x = col_area.x + tab_pos - next_w,
        2 => x = col_area.x + tab_pos - next_w / 2.0,
        _ => {}
    }
}
```

수정 후:
```rust
if let Some((tab_pos, tab_type)) = pending_right_tab_render.take() {
    text_style.line_x_offset = x - col_area.x;
    match tab_type {
        1 => {
            let next_w = estimate_text_width(run.text.trim_start(), &text_style);
            x = col_area.x + tab_pos - next_w;
        }
        2 => {
            let next_w = estimate_text_width(&run.text, &text_style);
            x = col_area.x + tab_pos - next_w / 2.0;
        }
        _ => {}
    }
}
```

---

## 4. Stage 4 상세: 검증

| 검증 항목 | 명령 | 합격 기준 |
|----------|------|---------|
| 전체 테스트 | `cargo test` | 0 failed (현재 967개 기준) |
| Lint | `cargo clippy --lib -- -D warnings` | 0 warnings |
| KTX SVG 내보내기 | `rhwp export-svg samples/KTX.hwp -o ../visual-diff/rendered/KTX/ --embed-fonts` | — |
| KTX visual diff | `node scripts/compare.mjs KTX` (visual-diff/) | matchRate ≥ 96.58% (현행 유지 또는 개선) |
| Golden SVG 등록 | KTX.hwp 2페이지 snapshot 추가 또는 기존 golden 갱신 | `UPDATE_GOLDEN=1 cargo test` |
| 기존 golden 회귀 | `cargo test --test svg_snapshot` | 전체 pass |

---

## 5. 예상 변경 범위

- `src/renderer/layout/text_measurement.rs`: 총 3곳 right tab seg_start 수정 + eprintln 3행 제거
- `src/renderer/layout/paragraph_layout.rs`: 총 2곳 match arm 구조 변경 + trim_start 적용
- `tests/svg_snapshot.rs`: KTX 2페이지 golden 추가 (선택)
- `tests/golden_svg/`: golden SVG 파일

---
