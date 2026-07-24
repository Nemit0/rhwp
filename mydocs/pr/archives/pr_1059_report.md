# PR #1059 최종 보고서 — U+00B7 폭 폰트 metric 정합 (비례폰트 .notdef 위장값 가드)

- PR: [#1059](https://github.com/edwardkim/rhwp/pull/1059)
- 제목: fix(text_measurement): U+00B7 폭 폰트 metric 정합 — 비례폰트 .notdef 위장값 가드
- 작성자: HaimLee-4869 (Lee eunjung) — 누적 컨트리뷰터 (PR #1020/#1021/#1026/#1047)
- base ← head: `devel` ← `HaimLee-4869:pr/u00b7-notdef-guard`
- 결정: **merge (수용)** — 정량 게이트 충족, 시각 판정 면제 (PR #1044/#1054 패턴)
- 일자: 2026-05-22

## 1. 결정

**merge 수용.** 비례폰트의 U+00B7 `.notdef` 위장 전각을 narrow (0.3em)
로 정정하는 3 조건 좁힘 가드 + monospace 보존 (Issue #630 정합) + 본
환경 결정적 검증 통과로 모든 게이트 충족.

**시각 판정 면제** — 작업지시자 결정 (옵션 A). 본 PR 은 PR #1044/#1054
패턴 (단일 파일 좁힘 fix + 결정적 측정 + 회귀 가드 통과 + 비회귀 영역
명시) 정합으로 정량 게이트만으로 충족.

**이슈 연결 없음 — 그대로 진행** (작업지시자 결정). PR 본문이 본질 정직
명시 + 검증 충실하므로 closes 없이 머지 가능.

## 2. 검증 결과

### 2.1 CI 대체 — 본 환경 직접 검증

**PR #1059 는 CI no checks reported** (첫 fork PR 권한 정책 — 작업지시자
확인). 본 환경 직접 검증으로 대체:

| 게이트 | 결과 |
|--------|------|
| `cargo fmt --check` | ✅ exit 0 |
| **신규 회귀 가드** `test_b7_notdef_artifact_narrow_in_proportional_font` | ✅ **passed** (휴먼명조 비례, U+00B7 narrow) |
| **Issue #630 가드** `test_630_middle_dot_full_width_in_registered_font` | ✅ **passed** (돋움체 고정폭, U+00B7 전각 보존) |
| **svg_snapshot 8 건** | ✅ **8 passed / 0 failed** (issue_147_aift_page3 = 돋움체 목차 전각 포함) |
| **cargo test --release --lib** | ✅ **1324 passed / 0 failed** (PR 본문 수치 정확 재현) |

CI 통과 PR 들과 동등한 검증 수준 확보.

### 2.2 시각 판정 면제 근거 (PR #1044/#1054 패턴)

본 PR 은 다음 4 조건 동시 만족으로 정량 게이트가 시각 판정 대체:
1. **결정적 측정** (PR 본문 한컴 PDF 정량 — 0.34em vs 1.02em vs 0.32em)
2. **회귀 가드 단위 테스트** (`test_b7_notdef_artifact_narrow_in_proportional_font`)
3. **단일 책임 scope** (단일 파일 `text_measurement.rs` +68/-1, U+00B7 전용)
4. **비회귀 영역 명시 + 가드** (`is_monospace_metric` 으로 Issue #630 돋움체
   전각 보존, `test_630_middle_dot_full_width_in_registered_font` 통과)

## 3. 변경 내용

### 3.1 `src/renderer/layout/text_measurement.rs` (+68/-1)

**신규 헬퍼 `is_monospace_metric`** (+20):
- Basic Latin (U+0021~U+007E) 의 0 이 아닌 글자폭이 모두 동일하면 monospace
- 표본 부족 가드 (`count >= 16`) — 한글 전용 폰트 오판 방지

**핵심 가드 조건 추가** (`measure_char_width_embedded`, +3):
```rust
let is_b7_notdef_artifact =
    c == '\u{00B7}' && glyph_w >= mm.metric.em_size && !is_monospace_metric(mm.metric);
if (is_narrow_unicode_punct && glyph_w >= mm.metric.em_size) || is_b7_notdef_artifact {
    (mm.metric.em_size as f64 * 0.3) as u16
}
```

3 조건 동시 만족 시만 0.3em 정정: U+00B7 + 전각 위장 + 비례폰트.

**회귀 가드 단위 테스트** (+20):
`test_b7_notdef_artifact_narrow_in_proportional_font` — 휴먼명조 "가·나"
→ `dot_advance <= font_size * 0.4`.

### 3.2 native·WASM 양 경로 동시 적용

가드가 공유 함수 (`measure_char_width_embedded`) 에 위치 → native·WASM
동시 적용 (PR 본문 명시, PR #1026 패턴 일관).

## 4. Root cause + 한컴 PDF 정량 근거

### 4.1 Root cause

`·` (U+00B7) 글리프 부재 비례폰트의 cmap `.notdef` (glyph 0) 매핑 →
advance 가 `em_size` (전각) 로 위장 기록. 한컴은 점 글리프 있는 대체 폰트
(바탕 ≈0.33em) 로 렌더 → rhwp 가 위장 전각 사용 시 좌우 공백 비정상 확대.

### 4.2 한컴 PDF 정량 표 (PR 본문)

| 대상 | 폰트 | 한컴 PDF | rhwp 전 | rhwp 후 |
|------|------|---------|---------|---------|
| 본문 `시·군` | 휴먼명조 비례 | 0.34em | 1.02em | **0.32em** |
| 본문 `이상·배우자` | 휴먼명조 비례 | 0.34em | 1.00em | **0.30em** |
| 목차 `기술·제품` | 돋움체 고정폭 | 1.01em | 1.00em | **1.00em** (보존) |

### 4.3 영향 범위

- 폰트 메트릭 DB **595 종 중 70 종** 해당 (비례 + U+00B7 위장 전각):
  HY 36 / 휴먼 13 / MD 5 / YJ 9 / 안상수 4 / 펜흘림 1
- monospace 4 종 (BatangChe/DotumChe/GulimChe/GungsuhChe) 가드 제외
- 본 저장소 `samples/` HWPX 50 종 중 30 종이 대상

## 5. 설계 평가

### 메모리 룰 정합

- **`feedback_hancom_compat_specific_over_general`** (권위 사례): 3 조건
  동시 만족 케이스별 구조 가드 + 표본 부족 가드 + 비회귀 영역 명시
  (Issue #630). 측정 의존 분기 없음.
- **`feedback_small_batch_release_strategy`**: 단일 commit + 단일 파일
  + +68/-1. 가드 + 헬퍼 + 회귀 가드 단위 테스트 + 주석.
- **`feedback_image_renderer_paths_separate`**: native·WASM 공유 함수
  가드 위치 — 양 경로 동시 적용. PR #1026 패턴 일관.
- **scope 정직**: PR 본문 "Issue #630 과의 관계", "PR #1026 과도 독립적"
  별도 항목 명시.

### 진단/측정 우수성

PR 본문 한컴 PDF 좌표 정량 측정 (0.34em vs 1.02em) + cmap `.notdef`
→ em_size 위장 메커니즘 정확 식별. `is_monospace_metric` 헬퍼 도입으로
구조 기반 분기.

## 6. cherry-pick 처리

PR 본질 commit:
- `ace8a5e1` fix(text_measurement): U+00B7 폭 폰트 metric 정합 — 비례폰트
  .notdef 위장값 가드

처리: 단일 commit author (HaimLee-4869 / Lee eunjung) 보존 cherry-pick.
clean-up 후속 commit 없음 (코드 품질 지적 사항 없음).

## 7. #1055 회귀와의 관계 — 무관 확인

- 본 환경 binary grep: `samples/hwp3-sample16-hwp5.hwp` 에 `·` (U+00B7) **0 건**
- 본 PR 적용해도 #1055 회귀 영향 없음
- 본 PR 변경 영역은 `text_measurement.rs` (#1055 영역) 이나 가드는
  U+00B7 전용 OR 분기로 PR #1026 의 U+2018/U+2019/U+2027 가드와 독립

→ 본 PR 머지가 #1055 추가 회귀 유발하지 않음.

## 8. 잔존 / 후속

### 본 PR scope 외

- **라벨 "enhancement" vs 실제 bug fix** — 마이너 불일치
- **연결 이슈 없음** — 작업지시자 결정 "그대로 진행"
- **CI no checks reported** — 첫 fork PR 권한 정책, 본 환경 직접 검증으로
  대체. 컨트리뷰터 측 권한 인증 후속 가능.

### 독립 영역 — 본 PR scope 외

- **PR #1048** (planet6897 Task #1046) — rebase 응답 대기 중. typeset/
  layout 영역 (본 PR `text_measurement` 와 독립)
- **이슈 #1055** (회귀, hwp3-sample16-hwp5.hwp p2 목차) — 본 PR 영향
  없음 별도 task 후보
- 다른 OPEN PR 들 (#1051 postmelee 등) — 본 PR 처리와 독립

## 9. 산출물

- `mydocs/pr/pr_1059_review.md` (검토 문서)
- 본 보고서
- 소스: PR `text_measurement.rs` 3 조건 좁힘 가드 + monospace 헬퍼 + 회귀
  가드 단위 테스트

## 10. 메모리 룰 갱신 검토

- `project_external_contributors`: HaimLee-4869 = 등재된 누적 기여자
  (PR #1020/#1021/#1026/#1047). 갱신 불요.
- **권위 사례 누적** — PR #1039 → #1044 → #1054 → #1059 (4 사례) "정량
  게이트 충족 시 시각 판정 면제 가능" 패턴 누적. 메모리 룰 정리 task
  강화 후보 (별도, 본 처리와 독립).
- **CI 부재 시 본 환경 직접 검증 대체 패턴** — 본 PR 이 첫 권위 사례.
  첫 fork PR 의 권한 정책으로 CI 안 도는 경우 본 환경 검증으로 동등 보장
  가능 (메모리 룰 후보).
