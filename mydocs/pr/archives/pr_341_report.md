# PR #341 처리 결과 보고서

## PR 정보

| 항목 | 내용 |
|------|------|
| PR 번호 | [#341](https://github.com/edwardkim/rhwp/pull/341) |
| 작성자 | [@planet6897](https://github.com/planet6897) (Jaeuk Ryu) |
| 이슈 | [#340](https://github.com/edwardkim/rhwp/issues/340) |
| 처리 | **Merge (admin)** |
| 처리일 | 2026-04-26 |
| Merge commit | `c92b5d2` |

## 변경 요약

`exam_math.hwp` 13페이지 상단의 세 가지 결함을 통합 진단:

1. **머리말 "수학 영역(확률과 통계)" 누출** — typeset 경로의 `PageHide` 컨트롤 수집 누락
2. **본문 라인 중복 렌더링** — `place_table_with_text` 의 `pre_text_exists` 가드 누락
3. **둥근사각형 글상자 "제 2 교시" 미표출** — 인라인 컨트롤 등록의 `Shape` 누락

→ 모두 **typeset.rs 가 engine.rs 의 동일 로직과 정합되지 않아** 발생한 누락. PR 본문에서 한 줄로 본질을 묶어 설명한 분석 정공법.

### 변경 파일 (2개, +40/-9)

| 파일 | 라인 | 내용 |
|------|------|------|
| `src/renderer/typeset.rs` | +40/-6 | `collect_header_footer_controls`/`finalize_pages` 의 PageHide 처리, `place_table_with_text` 의 `pre_text_exists` 가드, `typeset_table_paragraph` 의 Shape 인라인 등록 |
| `tests/golden_svg/issue-147/aift-page3.svg` | -3 | 골든 갱신 (의도) |

### 핵심 변경 (engine.rs 정합)

```rust
// 1. PageHide 수집
Control::PageHide(ph) => {
    page_hides.push((pi, ph.clone()));
}

// 2. pre_text_exists 가드 (engine.rs:1418-1421 와 동일)
let pre_text_exists = post_table_start == 0 && st.current_items.iter().any(|item| {
    matches!(item, PageItem::PartialParagraph { para_index, start_line, .. }
        if *para_index == para_idx && *start_line == 0)
});

// 3. Shape 인라인 컨트롤 등록 확장
Control::Shape(_) | Control::Picture(_) | Control::Equation(_) => {
    st.current_items.push(PageItem::Shape { ... });
}
```

## 메인테이너 검증

| 항목 | 결과 |
|------|------|
| `cargo build --release` | ✅ 25.61s |
| `cargo test --lib` | ✅ 997 passed |
| `cargo test --test svg_snapshot` | ✅ 6/6 (issue-147/aift-page3 갱신 의도) |
| `cargo test --test issue_301` | ✅ z-table 가드 |
| `cargo clippy --lib -D warnings` | ✅ clean |
| `cargo check --target wasm32` | ✅ clean |
| 7 핵심 샘플 페이지 수 | ✅ 무변화 |
| WASM Docker 빌드 + 작업지시자 시각 검증 | ✅ 통과 (page 9, 13 PDF 일치) |

## 처리 흐름

1. PR review 작성 + 작업지시자 승인
2. PR 브랜치 fetch + devel merge (충돌 0)
3. 자동 검증 + WASM 빌드
4. 작업지시자 시각 검증 통과
5. 따뜻한 감사 코멘트 + admin merge
6. 이슈 #340 close

## 외부 기여 가치

| 영역 | 내용 |
|------|------|
| **공통 원인 진단** | 세 결함을 typeset.rs 누락이라는 한 가지 공통 원인으로 묶음 |
| **engine.rs 정합** | 기존 로직 1:1 대응 — 회귀 위험 최소화 |
| **작은 패치 (+40/-9)** | 세 결함의 통합 해결을 작은 코드 변경 안에 담음 |
| **연속 기여** | PR #315/#320/#327 에 이어 #341 — typeset/engine 정합 영역의 깊은 기여 누적 |
| **이슈 OPEN 유지** | PR #324 사례 학습 후 이슈 자체 close 안 함 (메모리 규칙 준수) |

## 작업지시자 평가

> "대단합니다. 집념이!"

작성자의 PR #327 (v1 → v2 → v3 자체 보강) 에 이어 본 PR 의 통합 진단까지, rhwp 프로젝트의 typeset 경로 정합 작업에 깊은 기여 누적.

## 참고 링크

- [PR #341](https://github.com/edwardkim/rhwp/pull/341)
- [감사 코멘트 (작업지시자 평가 인용)](https://github.com/edwardkim/rhwp/pull/341#issuecomment-4321114149)
- 이슈: [#340](https://github.com/edwardkim/rhwp/issues/340)
- 관련 PR (작성자 누적): #303, #305, #308, #315, #320, #327, #341
