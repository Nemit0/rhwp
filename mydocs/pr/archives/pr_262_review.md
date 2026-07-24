---
PR: #262
제목: fix(render): narrow glyph 뒤 advance 과다 + · 중점 시각 중앙 배치 (Task #257)
기여자: @planet6897 (Jaeuk Ryu)
연결 이슈: #257
Base: devel
Head: planet6897:local/task257
작성일: 2026-04-23
---

# PR #262 검토

## 1. PR 정보

| 항목 | 값 |
|---|---|
| PR | [#262](https://github.com/edwardkim/rhwp/pull/262) |
| 기여자 | @planet6897 |
| 제출일 | 2026-04-23 08:30 UTC |
| 크기 | +1410 / −5, 14 파일 |
| Mergeable | `MERGEABLE` / `BEHIND` (rebase 필요) |
| CI | 전 항목 pass (Build & Test · Analyze rust/js/py · CodeQL · WASM skipping) |
| Draft | No |
| 연결 이슈 | [#257](https://github.com/edwardkim/rhwp/issues/257) (by 본인) · `closes #257` |

## 2. 변경 요약

### 2.1 B-1 — Narrow glyph advance 보정 (`text_measurement.rs`)

메트릭 DB 미등록 폰트의 폴백 경로에서 `,` `.` `:` `;` `·` 등이 반각 (`font_size × 0.5`) 폭으로 계산되어 뒷 글자가 2~3px 밀리는 문제.

**수정**:
- `is_narrow_punctuation(c)` 헬퍼 추가 — 화이트리스트 8자 (`,` `.` `:` `;` `'` `"` `` ` `` `·`)
- 폴백 경로 3곳 분기 추가 (`font_size × 0.3`):
  - `EmbeddedTextMeasurer::estimate_text_width` (line 184)
  - `EmbeddedTextMeasurer::compute_char_positions` (line 286)
  - `estimate_text_width_unrounded` (free fn, line 809)
- Task #229 음수 자간 클램프 (`min_w`) 는 유지 (base_w 축소 → 클램프 하한도 자동 축소)

단위 테스트 4건 추가:
- `test_narrow_glyph_comma_base_width`
- `test_narrow_glyph_middle_dot_base_width`
- `test_narrow_glyph_period_and_colon`
- `test_non_narrow_char_unchanged` (회귀 방어)

### 2.2 B-2 — `·` 중점 폰트 독립 렌더 (`svg.rs`)

휴먼명조 → Batang 등 폰트 대체 시 `·` 의 LSB/폭 차이로 시각 쏠림. A안 (shift 보정) 2회 시도 후 폰트 대체 문제는 metric 보정으로 해결 불가로 판단 → **C안** 벡터 도형 렌더로 전환.

**수정**: `draw_text` 에서 `·` (U+00B7) cluster 감지 시 `<text>` 대신 `<circle>` 출력.

```
cx = x + char_positions[char_idx] + advance/2    // advance box 수평 중앙
cy = y − font_size × 0.35                         // CJK x-height 중앙 근사
r  = font_size × 0.08
fill = 텍스트 색상
```

그림자·본문 렌더링 양쪽 루프에 동일 분기 적용.

### 2.3 골든/샘플

- `tests/golden_svg/form-002/page-0.svg` 재생성 (`·` `<text>` → `<circle>` 반영)
- `samples/text-align-2.hwp` + `.pdf` 신규 편입 (회귀 검증 근거)

## 3. #259 와의 상호작용

본 PR 과 동일 주일에 머지된 Task #259 (HY/본한글 폰트 매핑) 와의 영향을 특별 점검.

### 3.1 변경 파일 겹침

| 파일 | #259 | PR #262 | 충돌 가능성 |
|---|---|---|---|
| `mydocs/orders/20260423.md` | 섹션 11 추가 | 섹션 11 추가 | **add/add 충돌 예상** (rebase 시 해결 필요) |
| `tests/golden_svg/form-002/page-0.svg` | 미변경 | 재생성 | 영향 없음 (#259 는 HY 폰트만, form-002 는 휴먼명조) |
| `src/renderer/layout/text_measurement.rs` | 미변경 | 수정 | 충돌 없음 |
| `src/renderer/svg.rs` | 미변경 | 수정 | 충돌 없음 |
| `src/renderer/font_metrics_data.rs` | 수정 | 미변경 | 충돌 없음 |

### 3.2 **중요**: 기능적 상호작용 — HY헤드라인M 이 DB 에 등록됨

PR #262 의 단위 테스트는 `font_family: "HY헤드라인M"` 을 **메트릭 DB 미등록** 가정으로 작성.

```rust
// PR #262 기대 동작 (#259 머지 전 기준):
// "HY헤드라인M" → measure_char_width_embedded() 가 None → fallback → is_narrow_punctuation() 분기 실행
```

그러나 **#259 머지 후** `resolve_metric_alias("HY헤드라인M") = "HYHeadLine-Medium"` → `measure_char_width_embedded` 가 **실측 값 반환** → fallback 경로 미진입 → `is_narrow_punctuation` 분기 우회.

**영향**:
- (a) HY헤드라인M 에서의 narrow glyph advance 는 이제 DB 실측 값 사용 → #262 의 fallback 분기 효과 없음
- (b) 그러나 본 PR 의 `is_narrow_punctuation` 분기는 **다른 미등록 폰트** (예: 한글명조·신명조 일부) 에서 여전히 효과 있음
- (c) **단위 테스트 4건이 #259 머지 후 실패할 가능성** — HY헤드라인M 이 DB 에 있어 실측 폭 (반각 이상) 을 반환할 수 있음

**검증 필요**: rebase 후 단위 테스트 4건 실제 실행 결과 확인.

### 3.3 기여자의 문제 해결 접근

기여자는 이슈 #257 에서 3안 (A/B/C) 을 제시:
- A: narrow 휴리스틱 개선 ← **채택**
- B: min_w 클램프 폐지
- C: 폰트 메트릭 DB 에 실제 값 추가 (**이것이 #259 와 겹치는 영역**)

C안을 선택하지 않은 이유가 이슈에 명시 (유지보수 비용). #259 는 다른 경로 (HY 계열 DB 엔트리는 존재, 매핑만 누락) 로 효과적으로 C안 효과 일부를 달성. 따라서 두 PR 의 접근이 **상호보완적** 이며 충돌 아님.

## 4. 코드 품질 평가

### 4.1 장점

- **단계별 증거 기반**: 샘플 → baseline 측정 → 단위 테스트 → 구현 → 회귀 순서로 4-Stage 진행
- **의사결정 히스토리 보존**: A안 2회 시도 후 C안 전환 근거를 `task_m100_257_stage3.md` 에 기록. 철회된 커밋 (`010647b`) 도 의도적으로 보존
- **Task #229 회귀 방어**: `min_w` 클램프 유지 주석 명시
- **회귀 방어 테스트**: `test_non_narrow_char_unchanged` 로 화이트리스트 밖 문자 영향 0 검증
- **스모크 스위프 광범위**: biz_plan 591 `·` 균일 렌더 + exam_kor/eng/math/footnote-01/field-01 회귀 확인
- **공개 API 영향 0**: `is_narrow_punctuation` crate-private

### 4.2 짚을 점

- **A안 철회 커밋 (`010647b`) 포함 여부**: 의사결정 히스토리 보존 의도는 좋지만, 머지 후 영구적으로 "철회된 시도" 가 히스토리에 남음. PR 설명에 근거 명시는 되어 있음. **squash merge 로 단일 커밋화** 하면 깔끔하지만, 기여자의 의도 (히스토리 투명성) 를 존중하려면 그대로 merge.

- **`<circle>` 반지름 계수 (`font_size × 0.08`)**: PDF 관찰치 기준이라 문서화됨. 하지만 폰트별로 `·` 크기가 다르므로 고정값 선택의 정당성이 **측정값 1건** 에 의존. 추후 피드백 시 조정 가능한 지점.

- **narrow 화이트리스트 확장 경로**: 현재 8자. 한글 `、` `。` 등 CJK 구두점 일부는 전각이라 is_fullwidth_symbol 에 포함되어야 하나, 다른 narrow 후보 (括弧 안쪽 공백 등) 는 필요 시 이슈로 분리.

### 4.3 잠재 회귀 리스크

- **`<circle>` 렌더의 text selection**: SVG `<circle>` 은 브라우저에서 "선택 가능한 텍스트" 가 아님. rhwp-studio 편집 모드에서 `·` 를 선택/커서 이동 대상으로 처리하는 로직이 있는지 확인 필요.

- **`·` 접근성 (a11y)**: 스크린리더가 `<circle>` 을 읽지 못함. 현재 rhwp SVG 가 a11y 고려 범위라면 `<title>` 혹은 `aria-label` 필요. 단, rhwp 는 viewer 중심이라 스크린리더 인터랙션 요구사항이 현재 범위 밖이면 보류 가능.

- **`<circle>` 타입 구분**: biz_plan TOC 의 리더 도트 (line of dots) 도 `·` 를 쓴다면 모두 `<circle>` 로 변환됨. 기여자가 "591개 균일 렌더" 확인 — 이건 **의도된 동작** (TOC 리더 도트도 시각 중앙 배치가 더 자연). 단, 폰트 임베딩 후 TTF 글리프와 맞추려면 추후 재조정 필요 가능.

## 5. 검증 계획

1. **Rebase**: `devel` (14deba9, #259 머지 포함) 로 rebase 후 `orders/20260423.md` 충돌 해결
2. **단위 테스트 실행**: rebase 후 `cargo test --lib text_measurement::` — 특히 #259 영향 받는 4건 test 실제 통과 여부 확인
3. **전체 테스트**: `cargo test --lib` 953+ passed 유지 확인
4. **svg_snapshot**: `cargo test --test svg_snapshot` 3 passed
5. **clippy**: `cargo clippy --lib -- -D warnings` clean
6. **시각 검증**: `samples/text-align-2.hwp` SVG 렌더 확인 (선택)

## 6. 판단 초안

- **기능적 정확성**: ✅ (단위 테스트 + 스모크 + 시각 비교)
- **#259 와의 공존**: ⚠️ — rebase 후 단위 테스트 4건 재확인 필요 (HY헤드라인M 이 이제 DB 등록 폰트)
- **의사결정 투명성**: ✅ (A→C 전환 근거 + 철회 커밋 보존)
- **문서화**: ✅ (plans 2 + working 4 + report 1 + tech 1)
- **회귀 방어**: ✅ (non_narrow_char_unchanged + 스모크 스위프)

**권장**: rebase 후 단위 테스트 4건 실제 실행 결과 확인 → 통과 시 머지 승인. 실패 시 테스트의 `font_family` 를 "정말 DB 미등록 폰트" 로 변경 요청 (예: `"IntentionallyMissingFont"`) 또는 #262 쪽에서 patch.

## 7. 승인 요청

본 검토 문서를 승인하면 Stage 2 (rebase + 코드 검증) 착수.

- 추가 구현 계획서 (`pr_262_review_impl.md`) 필요 여부: **아니오** — 체크리스트가 단순 (rebase + test + 판단)
- Stage 2 결과 후 `pr_262_report.md` 에 최종 판단 기록 (merge / 수정 요청 / close)
