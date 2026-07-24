# PR #1026 검토 — fix(text_measurement): 좁은 구두점 (U+2018/U+2019/U+2027) 폭 분류 + native/WASM 동기화

- 작성일: 2026-05-20
- 컨트리뷰터: [@HaimLee-4869](https://github.com/HaimLee-4869) (Lee eunjung) — **세 번째 기여** (#1020 + #1021 머지 직후)
- PR: https://github.com/edwardkim/rhwp/pull/1026
- base/head: `devel` ← `HaimLee-4869:pr/narrow-punctuation-native-wasm-sync` (cross-repo fork)
- 연결: closes 명시 없음 (Task #257 + Task #630 보완)
- 규모: +141 / -117, **3 files** (소스 1 + golden 2)
- mergeable: **CONFLICTING**
- 본질 커밋: 단일 `85e84d4e` (작성자 @HaimLee-4869)

## 1. 컨트리뷰터 사이클

@HaimLee-4869 세 번째 기여 — #1020(closes #727, 첫 기여) + #1021(Refs Task #874, native+WASM 두 measurer 동시 fix) 머지 직후. devel = `77a25471` (#1004 머지 포함). 동시 OPEN 단독.

## 2. 본질 변경 (3 hunks, `src/renderer/layout/text_measurement.rs`)

### Root cause 3-layer (PR 본문)

| Layer | 케이스 | 폴백 결과 | 한컴 정답 |
|---|---|---|---|
| DB fullwidth 잘못 기록 | 휴먼명조 / HY중고딕 / HY신명조 / HY견명조의 U+2018 / U+2019 → 1.0 em | `is_halfwidth_punct` 분기 em/2 = 0.5 em | ~0.3 em |
| DB 글리프 미수록 | 휴먼명조 U+2027 | 폴백 `font_size * 0.5` | ~0.3 em |
| WASM path 동기화 누락 | 3차 JS Canvas 폴백 narrow 분기 부재 | 휴먼명조 U+2027 → 0.5 em (1차 native fix 후도 NG) | ~0.3 em |

### H1. `is_narrow_punctuation` 확장 — DB 미수록 폴백

```rust
fn is_narrow_punctuation(c: char) -> bool {
    matches!(c,
        ',' | '.' | ':' | ';' | '\'' | '"' | '`' |
        '\u{00B7}' |   // · MIDDLE DOT (기존)
        '\u{2018}' |   // ' LEFT SINGLE QUOTATION MARK (추가)
        '\u{2019}' |   // ' RIGHT SINGLE QUOTATION MARK (추가)
        '\u{2027}'     // ‧ HYPHENATION POINT (추가)
    )
}
```

### H2. `measure_char_width_embedded` narrow override — DB fullwidth 정정

```rust
let is_narrow_unicode_punct = matches!(c, '\u{2018}' | '\u{2019}' | '\u{2027}');
if is_narrow_unicode_punct && glyph_w >= mm.metric.em_size {
    (mm.metric.em_size as f64 * 0.3) as u16  // 0.5em → 0.3em
} else if is_halfwidth_punct && glyph_w >= mm.metric.em_size {
    mm.metric.em_size / 2
} else {
    glyph_w
}
```

### H3. `wasm_internals::measure_char_width_hwp` narrow 분기 추가 — WASM path 동기화

```rust
// 2차: 한글 음절
// (추가) narrow punctuation 분기
if super::is_narrow_punctuation(c) {
    return font_size * 0.3;
}
// 3차: JS Canvas 폴백
```

### golden 2개 갱신

- `tests/golden_svg/issue-157/page-1.svg` (82 lines)
- `tests/golden_svg/issue-617/exam-kor-page5.svg` (148 lines)

PR 본문 명시 — 좌표/font/내용 변경 0, narrow override 효과 (advance 감소).

## 3. 검토 의견

### 강점

1. **세 번째 기여도 매우 모범** — PR 본문 충실 (Symptom 표 + Before/After 캡처 + Root cause 3-layer 표 + Fix hunks + 회귀 영향 + 검증 환경 + 관련 영역 + 별도 PR 권장 영역). #1020 + #1021 이어 우수한 패턴 일관.
2. **native + WASM 양쪽 동시 fix** — `feedback_image_renderer_paths_separate` 본질 정합. PR #1021 패턴 정합 (PR 본문 명시), PR #900 패턴.
3. **case-specific 가드** — `is_narrow_unicode_punct` 매칭 U+2018/U+2019/U+2027 한정 + **`glyph_w >= mm.metric.em_size` 가드** (정상 DB 값은 영향 0). 함초롬바탕(0.32) / Pretendard(0.22) 정상 DB 값 영향 없음 명시.
4. **Task #257/#630 보완 관계 명확** — Task #257 (`is_narrow_punctuation` 헬퍼 도입) 확장 + Task #630 (`is_halfwidth_punct` range U+2018..=U+2027 trade-off) 영역 무영향 명시.
5. **scope 좁힘 + 별도 PR 권장 영역 명시** — U+00B7 Middle Dot 본문 NG (Task #630 trade-off), U+2014/U+2016, Latin Extended, Issue #885 모두 분리.
6. **검증 환경 명시** — 한컴오피스 2024 한글 Windows + 한컴 폰트 (`reference_authoritative_hancom` 정합).
7. **결정적 검증** — 본가 sample `samples/2022년 국립국어원 업무계획.hwp` 35 페이지 중 33 페이지 일관 적용 + advance 8.00px → 5.00px (0.48em → 0.30em) 정확 측정.
8. cargo test 1309 + clippy 0 + WASM build OK.

### ⚠️ 핵심 쟁점

#### (A) golden 2개 — PR #1020 chain 확장과 동일 파일 충돌 가능성

`issue-157/page-1.svg` + `issue-617/exam-kor-page5.svg` 둘 다 PR #1020 (font-family chain 함초롬바탕 family 확장) 에서 갱신된 파일. 본 PR 의 advance 변경(x 좌표 등) 과 PR #1020 의 font-family 문자열 변경이 다른 속성이라 양립 가능하나 cherry-pick 시 충돌 가능. PR #1021 패턴(UPDATE_GOLDEN 일괄 갱신) 적용 가능.

#### (B) 매직 상수 `0.3 em`

PR 본문 명시 "한컴은 약 0.25-0.3 em 으로 렌더, 0.3 채택" — 측정 근거 + scope 좁힘 가드(`glyph_w >= em_size`) 로 정상 DB 값 무영향. `feedback_hancom_compat_specific_over_general` 정합 (case-specific). 다만 `0.3` 채택 근거는 컨트리뷰터 환경 한컴오피스 2024 시각 비교 — 작업지시자 환경 시각 판정 게이트.

#### (C) DB 정정의 임시 성격

본질적 해결은 폰트 DB(`font_metrics_data` 영역) 자체 정정. 본 PR 은 측정 단계 override (임시 휴리스틱). PR 본문도 명시적으로 "DB 가 잘못 기록한 케이스 정정" — `feedback_font_alias_sync` 영역의 후속 작업으로 DB 정정 권고 가능 (본 PR 영역 외).

#### (D) `feedback_push_full_test_required` 정합

PR 본문 `cargo test --lib` 1309 만 명시. **본 환경 검증 시 `--tests` 전체 통합 + fmt --check 동시 실행 필요** (PR #1020 사고 기반 신규 메모리, 2026-05-20).

### 확인 필요 (검증 단계)

1. cherry-pick `85e84d4e` — golden 2개 PR #1020 영역 충돌 해소 (UPDATE_GOLDEN 일괄 갱신 가능)
2. `cargo test --release --lib` 1307+ + `cargo test --release --tests` 전체 통합 + clippy -D + fmt 0
3. **광범위 sweep** — issue-157 / issue-617 (golden 갱신) + 휴먼명조/HY family 보유 fixture (가능 시) + 일반 fixture 회귀 부재
4. WASM 빌드 + 작업지시자 시각 판정 — 좁은 구두점 advance 정합

## 4. 처리 옵션

- **옵션 A (수용 — 권고)**: 세 번째 기여 모범 PR + native+WASM 동시 fix + case-specific 가드 + Task #257/#630 보완 관계 명확. 작업지시자 시각 판정 통과 시 cherry-pick no-ff merge.
- **옵션 B (수정 요청)**: 다른 fixture 회귀 또는 시각 판정 실패 시 — 가드 강화 또는 영역 좁힘 요청.
- **옵션 C (close)**: 본질 결함 시. 해당 낮음 (실제 결함 + 정확한 진단).

## 5. 메모리 룰 정합

- `feedback_contributor_cycle_check` — @HaimLee-4869 세 번째 기여 (#1020 + #1021 + #1026), 일관 모범 패턴
- `feedback_pr_comment_tone` — 세 번째 기여 환영 + 사실 중심 (과도한 칭찬 자제)
- `feedback_image_renderer_paths_separate` — **권위 사례 강화**: native (EmbeddedTextMeasurer) + WASM (WasmTextMeasurer) 양쪽 동시 fix (PR #1021 패턴 확립 → 본 PR 정합)
- `feedback_fix_scope_check_two_paths` — H1 + H2 (native) + H3 (WASM) 두 measurer 양쪽 적용
- `feedback_hancom_compat_specific_over_general` — `glyph_w >= em_size` 가드 + 3 codepoint 한정 case-specific (정상 DB 값 영향 0)
- `feedback_font_alias_sync` — DB 정정 임시 휴리스틱 (본질적 해결은 DB 자체 정정, 후속 작업 권고 가능)
- `feedback_visual_judgment_authority` — `samples/2022년 국립국어원 업무계획.hwp` 35 페이지 중 33 일관 적용 + 작업지시자 시각 판정 게이트
- `feedback_push_full_test_required` (신규, 2026-05-20) — cargo test --tests 전체 + fmt --check 필수
- `reference_authoritative_hancom` — 한컴오피스 2024 한글 Windows 명시 (정답지 framework 정합)
- `project_output_folder_structure` — sweep 산출물 output/poc/pr1026 배치

## 6. 권고

**옵션 A** — 세 번째 기여 매우 모범 + native+WASM 동시 fix + case-specific 가드 + 결정적 검증 (35 페이지 중 33). 검증 단계에서 (1) cherry-pick golden 2개 PR #1020 영역 충돌 해소, (2) cargo test --lib + --tests + clippy + fmt 전체, (3) sweep (issue-157/617 + 휴먼명조 보유 fixture + 일반), (4) WASM + 작업지시자 시각 판정(좁은 구두점 advance 정합 + 회귀 부재) 통과 시 cherry-pick no-ff merge. 회귀 시 옵션 B 전환.
