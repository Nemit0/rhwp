# PR #1026 처리 보고서 — fix(text_measurement): 좁은 구두점 폭 분류 + native/WASM 동기화

- 처리일: 2026-05-20
- 컨트리뷰터: [@HaimLee-4869](https://github.com/HaimLee-4869) (Lee eunjung) — **세 번째 기여**
- 결정: **옵션 B (수정 요청 / 보류)** — 작업지시자 결정
- 머지: **하지 않음** (cherry-pick 롤백)
- PR/이슈 OPEN 유지

## 1. 결정 사유 — PR #1021 회귀 부수효과 발견

PR #1026 의 좁은 구두점 (U+2018/U+2019/U+2027) 폭 정합 fix 자체는 의도된 효과를 발휘 (사용자 시각 검증 통과, 도청 공문 가운뎃점 advance 0.5em → 0.3em 정합). 그러나 광범위 sweep 검증 중 **PR #1021 (단일-run RIGHT + leader cell right inner 정렬) 의 KTX 목차 페이지번호 정합이 회귀** 됨을 발견.

### 회귀 정량 입증

| 라인 | devel (PR #1021 적용) | 본 PR 적용 후 | 작업지시자 판정 |
|------|---------------------|--------------|------|
| 페이지번호 "8" | x="689.76" (cell right inner) | **x="699.76" (+10px)** | "이게 틀린겁니다" |
| 페이지번호 "16/20/24" | x="679.76" | **x="689.76" (+10px)** | 동일 회귀 |

`tests/golden_svg/issue-267/ktx-toc-page.svg` 가 PR #1021 적용 상태(`689.76`) 에서 PR #1026 적용 후 `699.76` 으로 10px 우측 이동 → PR #1021 이 달성한 cell right inner 정합이 회귀.

### 회귀 원인 추정

KTX 목차에 좁은 구두점 (U+2018/U+2019/U+2027) 사용 안 됨 확인. 그러나 본 PR 의 H2 분기 순서 변경 (`is_narrow_unicode_punct` 분기를 `is_halfwidth_punct` 앞에 배치) 이 **다른 punctuation 또는 일반 문자의 측정값에 영향** → PR #1021 의 `cell_right_run_rel - seg_w_full` 계산이 영향을 받아 페이지번호 우측 끝이 10px 우측으로 밀림.

## 2. 검증 결과 (cherry-pick 후 롤백됨)

| 항목 | 결과 |
|------|------|
| cherry-pick `85e84d4e` | KTX golden 충돌 1건 → source-only patch + UPDATE_GOLDEN 일괄 갱신 전략 |
| `cargo test --release --lib` | 1307 passed |
| `cargo test --release --tests` | 전체 통합 통과 |
| `cargo clippy --release --lib -D warnings` | 통과 |
| `cargo fmt --check` | exit 0 |
| WASM 빌드 (Docker) | 4.83 MB |
| golden 자동 갱신 | issue-157 (82 lines) + issue-617 (148 lines) + **issue-267 KTX (14 lines, PR #1021 회귀)** |

자기 검증 + 의도 영역 정합은 양호하나 **KTX 회귀가 머지 차단 사유** (`feedback_visual_judgment_authority` + `feedback_v076_regression_origin`).

## 3. 회귀 분석 — H2 분기 순서 변경

본 PR H2:

```rust
let is_narrow_unicode_punct = matches!(c, '\u{2018}' | '\u{2019}' | '\u{2027}');
if is_narrow_unicode_punct && glyph_w >= mm.metric.em_size {
    (mm.metric.em_size as f64 * 0.3) as u16  // 신규 분기 (앞에 위치)
} else if is_halfwidth_punct && glyph_w >= mm.metric.em_size {
    mm.metric.em_size / 2  // 기존 분기
} else {
    glyph_w
}
```

신규 분기를 `is_halfwidth_punct` 앞에 배치 — KTX 목차의 punctuation/space 측정에 영향 가능. **3 codepoint(U+2018/U+2019/U+2027) 한정 가드는 정확하나 매칭 순서나 다른 측정 경로(seg_w_full 계산) 와의 상호작용으로 회귀 발생**.

## 4. 수정 요청 내용 (컨트리뷰터 전달)

### A. PR #1021 KTX 동작 보존 필수

PR #1021 (단일-run RIGHT + leader cell right inner 정렬) 의 KTX 목차 페이지번호 x="689.76" 정합이 회귀하지 않도록:

1. H2 분기를 더 좁게 — `is_narrow_unicode_punct` 매칭 후에도 추가 가드 (예: 특정 폰트 fingerprint 한정) 적용 가능 여부 검토
2. 또는 H2 와 H3 분기 순서 변경 — `is_halfwidth_punct` 먼저, `is_narrow_unicode_punct` 는 fallthrough 형태
3. `seg_w_full` 계산 (PR #1021 cell_right_run_rel) 에 본 PR 변경이 미치는 영향 분석 + 회귀 차단 가드 추가

### B. 회귀 가드 fixture 추가 권고

KTX 목차 페이지번호 cell right inner 정합을 `tests/issue_*.rs` 회귀 가드 영역으로 등록 — `tests/issue_table_vpos_01_page5_cell_hit_test` (PR #1003) 패턴 정합. PR #1021 의 영구 회귀 가드 부재 영역.

### C. 본 PR 의 의도 자체는 정합

좁은 구두점 (U+2018/U+2019/U+2027) advance 0.3em 정합 + native + WASM 동시 fix + case-specific 가드 (`glyph_w >= em_size`) + Task #257/#630 보완 — 설계 자체 우수. **PR #1021 회귀만 차단하면 머지 가능**.

## 5. 처리 절차

- 작업트리 source patch + golden 3개 (issue-157/267/617) 롤백 (`git checkout HEAD -- ...`)
- `pr1026-cherry` 브랜치 삭제
- WASM devel (4.83MB) 복구 + rhwp-studio/public 동기화
- PR #1026 OPEN 유지 (수정 후 재제출 대기)
- 검토/보고서 archives 보관 (재검토 시 참조)
- 산출물 `output/poc/pr1026/` 보존 가능

## 6. 메모리 룰 정합

- `feedback_contributor_cycle_check` — @HaimLee-4869 세 번째 기여, #1020 + #1021 머지 직후
- `feedback_pr_supersede_chain` — PR #1021 의 KTX 정합을 본 PR 이 부수효과로 회귀시킴 — 누적 PR 시리즈 사이드 이펙트 발견
- `feedback_visual_judgment_authority` — 작업지시자 "이게 틀린겁니다" 시각 판정 권위 (정답: PR #1021 의 689.76)
- `feedback_v076_regression_origin` — 컨트리뷰터 환경 검증으로 발견 못 한 회귀를 메인테이너 sweep + 시각 판정으로 발견
- `feedback_fix_scope_check_two_paths` — H2 분기 순서 변경의 의도 영역(U+2018/U+2019/U+2027) 외 영향 (PR #1021 cell_right_run_rel 계산)
- `feedback_push_full_test_required` (신규, 2026-05-20) — cargo test --tests + fmt 통과했으나 golden 회귀는 별도 sweep 으로만 검출 — 통합 회귀 가드 부족

## 7. 결론

PR #1026 의 좁은 구두점 advance 0.3em 정합 + native/WASM 동시 fix 설계는 우수하나, **PR #1021 (단일-run RIGHT + leader cell right inner) KTX 목차 페이지번호 정합 회귀 부수효과** 로 보류. 작업지시자 명시 "tests/golden_svg/issue-267/ktx-toc-page.svg 이게 틀린겁니다". **옵션 B — 컨트리뷰터에게 PR #1021 KTX 동작 보존 + 회귀 가드 추가 요청, PR OPEN 유지**.
