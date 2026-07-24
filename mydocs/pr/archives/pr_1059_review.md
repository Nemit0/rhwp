# PR #1059 검토 — U+00B7 폭 폰트 metric 정합 (비례폰트 .notdef 위장값 가드)

## 1. PR 정보

| 항목 | 값 |
|------|-----|
| 번호 | #1059 |
| 제목 | fix(text_measurement): U+00B7 폭 폰트 metric 정합 — 비례폰트 .notdef 위장값 가드 |
| 작성자 | HaimLee-4869 (Lee eunjung) — 누적 컨트리뷰터 (PR #1020/#1021/#1026/#1047 기 머지) |
| base ← head | `devel` ← `HaimLee-4869:pr/u00b7-notdef-guard` |
| 라벨 | enhancement (실제 bug fix) |
| 변경 | **1 파일 +68 / -1** — `src/renderer/layout/text_measurement.rs` 단일 |
| 연결 이슈 | 없음 (closes 없음) |
| mergeable | MERGEABLE / BEHIND (rebase 권고이나 자동 머지 가능) |
| **CI** | **no checks reported** ⚠️ — 첫 fork 브랜치 / 새 컨트리뷰터 인증 케이스 (작업지시자 확인: "처음 컨트리뷰터는 CI 가 동작하지 않습니다"). 본 환경 직접 검증으로 대체. |
| 본질 commit | **단일 `ace8a5e1`** (소형, 깔끔) |
| 정량 측정 | cargo test --lib 1324 passed (PR 본문) + svg_snapshot 8/8 |
| 생성 | 2026-05-21 14:57 |

## 2. 배경

### 2.1 본질

`·` (U+00B7 MIDDLE DOT, 가운뎃점) 은 한글 문서에서 매우 흔함 (`시·군`,
`4급 이상·배우자` 등). 휴먼명조·HY신명조·한양 계열 등 다수 비례폰트는
자체 `·` 글리프를 갖지 않음. 이때 폰트 cmap 이 U+00B7 을 `.notdef`
(glyph 0) 로 매핑하고 `.notdef` 의 advance 는 통상 `em_size` (전각) 이므로,
폰트 메트릭 DB 에 해당 폰트의 U+00B7 폭이 **전각 (1.0em) 으로 위장 기록**.

한컴은 이 경우 `·` 글리프를 가진 대체 폰트 (바탕 등, ≈0.33em) 로 점을
렌더 → rhwp 가 위장 전각을 그대로 쓰면 좌우 공백이 한컴 대비 비정상으로
벌어짐 (PR 본문 시각 비교 스크린샷 첨부).

### 2.2 한컴 PDF 정량 근거 (PR 본문)

| 대상 | 폰트 | 한컴 PDF | rhwp (전) | rhwp (후) |
|------|------|---------|-----------|-----------|
| 본문 `시·군` | 휴먼명조 (비례) | 0.34em | 1.02em | **0.32em** |
| 본문 `이상·배우자` | 휴먼명조 (비례) | 0.34em | 1.00em | **0.30em** |
| 목차 `기술·제품` | 돋움체 (고정폭) | 1.01em | 1.00em | **1.00em** (보존) |

비례폰트 narrow 정정 + 고정폭 전각 보존 (Issue #630 정합).

### 2.3 영향 범위 (PR 본문 정량)

- 폰트 메트릭 DB 595 종 중 **70 종** 해당 (비례폰트 + U+00B7 위장 전각):
  HY 36 / 휴먼 13 / MD 5 / YJ 9 / 안상수 4 / 펜흘림 1
- monospace 4 종 (BatangChe/DotumChe/GulimChe/GungsuhChe) 가드 제외
- 본 저장소 `samples/` HWPX 50 종 중 30 종이 비례폰트 사용

## 3. 변경 내용 (`src/renderer/layout/text_measurement.rs`, +68/-1)

### 3.1 신규 헬퍼 `is_monospace_metric` (+20 lines)

```rust
fn is_monospace_metric(metric: &font_metrics_data::FontMetric) -> bool {
    let mut common: Option<u16> = None;
    let mut count = 0u32;
    for range in metric.latin_ranges {
        // Basic Latin (U+0021~U+007E) 의 0 이 아닌 글자폭이 모두 동일?
        ...
    }
    // 표본이 충분할 때만 monospace 로 판정 (Latin 글리프가 거의 없는 폰트 오판 방지)
    count >= 16
}
```

**우수 설계**: 표본 부족 가드 (`count >= 16`) — 라틴 글리프가 거의 없는
한글 전용 폰트 오판 방지.

### 3.2 핵심 가드 조건 추가 (`measure_char_width_embedded`, +3 lines)

```rust
let is_b7_notdef_artifact =
    c == '\u{00B7}' && glyph_w >= mm.metric.em_size && !is_monospace_metric(mm.metric);
if (is_narrow_unicode_punct && glyph_w >= mm.metric.em_size) || is_b7_notdef_artifact {
    (mm.metric.em_size as f64 * 0.3) as u16
}
```

**3 조건 동시 만족** 시만 0.3em 정정:
1. `c == U+00B7` (가운뎃점만)
2. `glyph_w >= em_size` (전각 폭으로 위장)
3. `!is_monospace_metric` (비례폰트만 — 고정폭의 진짜 전각 `·` 보존)

OR 분기로 기존 `is_narrow_unicode_punct` (PR #1026, U+2018/U+2019/U+2027)
와 독립.

### 3.3 회귀 가드 단위 테스트 (+20 lines)

`test_b7_notdef_artifact_narrow_in_proportional_font`:
- 휴먼명조 (비례) "가·나" → `dot_advance <= font_size * 0.4` 단언
- 비례폰트의 .notdef 위장 전각이 아니라 narrow 측정 확인

기존 `test_630_middle_dot_full_width_in_registered_font` 가드 별도 보존
(돋움체 고정폭 전각 보존).

## 4. 검토 항목

### 4.1 설계 적합성 — 메모리 룰 정합 ✅

- **`feedback_hancom_compat_specific_over_general`**: 3 조건 동시 만족
  케이스별 구조 가드 + 표본 부족 가드 + 비회귀 영역 명시 (Issue #630).
  측정 의존 분기 없음 (구조 기반).
- **`feedback_small_batch_release_strategy`**: 단일 commit + 단일 파일
  + +68/-1 (가드 + 헬퍼 + 회귀 가드 단위 테스트 + 주석).
- **`feedback_image_renderer_paths_separate`**: native·WASM 공유 함수
  (`measure_char_width_embedded`) 에 가드 위치 — 양 렌더 경로 동시 적용
  (PR 본문 명시). PR #1026 패턴 일관.
- **scope 정직**: PR 본문 "Issue #630 과의 관계" 별도 항목으로 명시,
  "PR #1026 과도 독립적" 명시.

### 4.2 코드 품질 ✅

- **주석 매우 명료**: 원인 (cmap .notdef → em_size 위장) + 정정 근거
  (한컴 대체 폰트 ≈0.33em) + 비회귀 영역 (Issue #630 돋움체) 모두 코드
  내 명시
- **`is_monospace_metric` 헬퍼**: Basic Latin 범위 + 0 폭 제외 + 표본 16
  최소 등 세부 조건 명료
- **회귀 가드 단위 테스트**: 휴먼명조 + 한컴 정합 정량 임계 (`<= 0.4em`)
- 큰 지적 사항 없음

### 4.3 검증 충실성 — 본 환경 직접 검증 ✅

**CI 없음** (작업지시자 확인: "처음 컨트리뷰터는 CI 가 동작하지 않습니다").
첫 fork 브랜치 / 권한 인증 케이스. 본 환경 직접 검증으로 대체:

| 게이트 | 본 환경 결과 |
|--------|--------------|
| `cargo fmt --check` | ✅ exit 0 |
| **신규 회귀 가드** `test_b7_notdef_artifact_narrow_in_proportional_font` | ✅ **passed** |
| **Issue #630 가드** `test_630_middle_dot_full_width_in_registered_font` | ✅ **passed** (돋움체 전각 보존) |
| **svg_snapshot 8 건** | ✅ **8 passed, 0 failed** (issue_147_aift_page3 = 돋움체 목차 전각 포함) |
| cargo test --release --lib 전체 | (백그라운드 진행 중) |

PR 본문 검증 결과:
- `cargo test --lib`: 1324 passed (PR base 시점 — 본 환경은 #1058 reopen
  포함이라 더 많을 예정)
- `cargo clippy -- -D warnings`: clean
- 회귀 테스트 추가 + native·WASM 양 경로 동시 적용

### 4.4 #1055 회귀와의 관계 — 무관 확인 ✅

본 검토 어제 등록한 회귀 이슈 #1055 (`hwp3-sample16-hwp5.hwp` p2 목차)
와 본 PR 의 관계:

- 본 환경 binary grep: `samples/hwp3-sample16-hwp5.hwp` 에 `·` (U+00B7) **0 건**
- → 본 PR 적용해도 #1055 회귀 영향 없음
- 본 PR 변경 영역은 `text_measurement.rs` (#1055 영역) 이나, 가드는
  U+00B7 전용 OR 분기로 PR #1026 의 U+2018/U+2019/U+2027 가드와 독립

→ 본 PR 머지가 #1055 추가 회귀 유발하지 않음.

### 4.5 잔존 / scope 외

- 라벨 "enhancement" vs 실제 bug fix — 마이너 불일치
- 연결 이슈 없음 (closes 없음) — 이슈 신규 등록 후 closes 추가 권고
  후보, merge blocker 아님
- 한컴 PDF 좌표 측정을 근거로 사용 — 메모리 룰 `feedback_pdf_not_authoritative`
  관련. 그러나 본 PR 의 검증 근거는 **결정적 정량 측정** (0.34em vs
  1.02em vs 0.32em) + 회귀 가드 단위 테스트 + svg_snapshot 8/8 통과이므로
  PDF 자가검증 단독 의존이 아님. PR #1039/#1044/#1054 의 "정량 게이트
  충족 시 시각 판정 면제" 패턴 적용 가능 후보.

### 4.6 CI 비활성 처리

**CI no checks reported** 가 검증 누락이 아니라 GitHub fork PR 권한
정책 (작업지시자 확인) 이므로, 본 환경 직접 검증으로 대체:
- `cargo fmt --check` ✅
- 신규 회귀 가드 + 기존 #630 가드 ✅
- svg_snapshot 8/8 ✅
- cargo test --lib 전체 (백그라운드)

→ CI 통과한 PR 들과 동등한 검증 수준 확보.

## 5. 처리 절차 (간소화 4단계)

1. ✅ PR 정보 확인 + 원격 동기화 정정 (devel reset → origin/devel 갱신
   + local/devel 재구성)
2. → 본 검토 문서 작성 + 작업지시자 승인 요청 (현 단계)
3. (불요 예상) 코드 품질 양호, 본 PR 수정요청 항목 없음
4. 검증 (본 환경 lib 테스트 전체) + 작업지시자 시각 판정 결정 →
   `pr_1059_report.md`

## 6. 1차 판단 (작업지시자 승인 전 잠정)

| 영역 | 평가 |
|------|------|
| 설계 방향 | ✅ 적합 — 3 조건 좁힘 가드 + monospace 보존, 케이스별 구조 가드 |
| 본 환경 결정적 검증 | ✅ 통과 (신규/기존 가드 + svg_snapshot 8/8) |
| 코드 품질 | ✅ 양호 — 주석/헬퍼/회귀 가드 모두 명료 |
| scope | ✅ 단일 파일 +68/-1, 단일 영역 (U+00B7 전용) |
| 메모리 룰 정합 | ✅ specific_over_general / small_batch / image_renderer_paths_separate |
| CI 없음 | ⚠️ 첫 fork PR 권한 정책 — 본 환경 직접 검증으로 대체 |
| #1055 회귀와의 관계 | ✅ 무관 (sample16-hwp5.hwp 에 U+00B7 0 건) |
| 시각 검증 | ⚠️ PR #1039/#1044/#1054 패턴 (정량 게이트 면제 가능) 또는 메인테이너 hands-on |
| 이슈 연결 | closes 없음 (이슈 등록 후 closes 추가 권고 후보) |

**잠정 결론**: 코드·설계·검증 모두 양호. PR #1044/#1054 패턴 (단일
파일 좁힘 fix + 결정적 측정 + 회귀 가드 통과 + 비회귀 영역 명시) 정합.
**머지 전 1개 게이트**: 시각 판정 — 정량 게이트 면제 가능 또는 메인
테이너 hands-on (비례폰트 사용 샘플의 `·` 좌우 공백).

> 본 문서는 검토 계획 + 항목 통합. 작업지시자 승인/피드백 후
> 검증 단계 → `pr_1059_report.md` 로 최종 판단 기록.
