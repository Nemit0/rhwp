---
PR: #262
제목: fix(render): narrow glyph 뒤 advance 과다 + · 중점 시각 중앙 배치 (Task #257)
기여자: @planet6897 (Jaeuk Ryu)
연결 이슈: #257
작성일: 2026-04-23
상태: 수정 요청 게시 (2026-04-23 14:40 UTC) · 기여자 응답 대기
---

# PR #262 검증 결과 + 판단

## 1. 검증 절차 요약

1. `gh pr checkout 262` — 기여자가 이미 devel (#259 포함) 을 본인 브랜치로 merge 해 둔 상태 (커밋 `9ca9c49`). 별도 rebase 불필요.
2. orders/20260423.md 충돌 해결 상태 확인 — **깔끔함**. §11 (#259 Task) 유지, 구분선 `---` 이후 Task #257 섹션 추가.
3. 빌드: `cargo build --release` 성공
4. 테스트 실행: 아래 §2 참조
5. 시각 확인: `samples/text-align-2.hwp` 렌더

## 2. 테스트 결과

### 2.1 단위 테스트 (#259 상호작용 발견)

`cargo test --lib`:

```
test result: FAILED. 955 passed; 2 failed; 1 ignored; 0 measured
```

**실패 2건 — #259 가 머지된 상태에서 정확히 예측한 회귀**:

**A. `test_non_narrow_char_unchanged`**
```
font_family: "HY헤드라인M"
Latin 'A' advance should remain font_size * 0.5 (6.67), got 7.76
```

원인: #259 머지로 `HY헤드라인M → HYHeadLine-Medium` 매핑 등록 → `measure_char_width_embedded` 가 DB 실측값 (`7.76 = 0.582 * font_size`) 반환 → fallback 분기 (원래 `0.5` 기대) 미진입.

**B. `test_narrow_glyph_middle_dot_base_width`**
```
font_family: "HY헤드라인M"
narrow middle-dot advance should be ≤ font_size * 0.35 (5.83), got 8.33
```

원인: DB HYHeadLine-Medium 의 `·` 글리프 폭이 실측 반각 (`8.33 = 0.5 * font_size`) 으로 기록됨. `is_narrow_punctuation` fallback 분기 미진입 → 실측값 그대로 사용.

**나머지 20건 텍스트 측정 테스트는 모두 통과** (Task #229 회귀 4건 + 기존 12건 + PR 신규 중 2건).

### 2.2 기타 테스트

| 테스트 | 결과 |
|---|---|
| `cargo test --lib` (전체) | 955 passed / 2 failed |
| `cargo test --test svg_snapshot` | 3 passed |
| `cargo clippy --lib -- -D warnings` | clean |

### 2.3 실제 렌더 검증 (B-2 효과)

`samples/text-align-2.hwp` 렌더 결과:
- **7개 `·` 가 `<circle>` 로 렌더됨** ← B-2 정상 작동
- "세대별·지역별" 의 `·` 가 `별` 끝 (170.74) 과 `지` 시작 (179.14) 사이에 **기하학적 정확 중앙** (cx=174.94) 에 배치 ← 의도 달성

```xml
<text ...>별</text>                              <!-- x=152.34, 끝 170.74 -->
<circle cx="174.9422" cy="151.4133" r="1.6000" fill="#000000"/>   <!-- 중앙 -->
<text x="179.14222222222224" ...>지</text>
```

## 3. 문제의 정체

PR #262 의 2건 실패 테스트는 **코드 결함이 아니라 테스트 fixture 가 #259 머지 이후 stale**.

- **테스트 의도**: fallback 경로 진입 → narrow 분기 실행 → advance 축소 확인
- **현실 (#259 후)**: HY헤드라인M 이 DB 등록 폰트 → fallback 경로 미진입 → 테스트 기대값 성립 불가
- **PR #262 의 실제 기능**: **여전히 유효**. 다른 DB 미등록 폰트 (예: 휴먼명조) 에서 narrow 분기 동작

### 3.1 B-1 (narrow fallback) 의 실효성

#259 이후에도 B-1 은 다음 경우에 필요:
- DB 미등록 한글 폰트 (예: 사용자 로컬 TTF)
- 신규 폰트가 추가되었으나 `resolve_metric_alias` 매핑 누락 시 (graceful degradation)
- 웹 폰트 로드 실패 시 시스템 폰트 fallback

### 3.2 B-2 (`·` → `<circle>`) 의 실효성

**100% 유효**. 이 분기는 fallback 여부와 무관하게 모든 `·` 에 적용. #259 와 완전 독립.

## 4. 판단

### 4.0 최종 선택: **A (기여자 수정 요청)** — 2026-04-23 14:40 UTC 게시

작업지시자 지시로 A 채택. 기여자에게 수정 경로 + 이유 구체 설명한 리뷰 코멘트 게시 + GitHub `CHANGES_REQUESTED` 공식 리뷰 등록.

리뷰 링크: https://github.com/edwardkim/rhwp/pull/262#issuecomment-4305325016

### 4.1 권장 조치 (초안): **수정 요청 후 머지**

**수정 내용** (테스트 2건만):

```rust
// Before
font_family: "HY헤드라인M".to_string(),

// After
font_family: "DeliberatelyMissingFontForFallbackTest".to_string(),
```

이유:
- 원래 의도 (fallback 분기 검증) 를 #259 와 독립적으로 유지
- 폰트명을 "의도적으로 존재하지 않는" 이름으로 바꾸면 `resolve_metric_alias` 의 `_ => name` 분기로 passthrough → `find_metric` → None → fallback 경로 보장

### 4.2 대안 평가

| 대안 | 장점 | 단점 | 채택 |
|---|---|---|---|
| A. 기여자에게 수정 요청 | 기여자 학습 기회, 절차 투명 | 하루 더 걸림 | ❌ |
| B. 메인테이너가 직접 수정 후 머지 | 빠름, 오늘 사이클 마무리 | 기여자 동의 없는 수정 | ✅ (권장) |
| C. PR 그대로 머지 + 테스트 2건 삭제 | 최단 경로 | 회귀 방어 기능 상실 | ❌ |
| D. PR 그대로 머지 + 테스트 2건 `#[ignore]` | 임시 차선 | 근본 해결 아님 | ❌ |

**B 가 적절한 이유**: PR 로직 자체는 완전 정상. 테스트 fixture 만 #259 상호작용으로 stale. 2줄 수정이고 기여자 의도 보존. 단 **기여자에게 수정 경위 코멘트로 설명 필수**.

### 4.3 `·` 반지름 계수 (`font_size × 0.08`) 추후 검토 지점

PR 의도 달성은 확인. 다만:
- 폰트마다 `·` 크기가 다름 → 0.08 은 PDF 관찰치 1건 기준
- 추후 이슈로 "폰트별 `·` 크기 프로파일" 분리 가능

현재 PR 범위에서는 **수용** (1건 샘플로도 현실 개선).

### 4.4 `<circle>` 접근성 관련

- text selection: rhwp-studio 편집 모드에서 `·` 를 선택/편집 대상으로 다룰 때 `<circle>` 은 non-text. 하지만 **현재 rhwp-studio 의 편집 단위는 paragraph 또는 run 수준**이라 `·` 를 단독 선택하는 use case 없음. 실용적 영향 없음.
- 스크린리더: `<circle>` 에 의미 없음. 단 rhwp 는 HWP viewer 성격이 강하고, a11y 는 현재 범위 밖. 이슈로 분리 가능.

## 5. 머지 계획

1. 테스트 2건 수정 (font_family 를 의도적으로 존재하지 않는 이름으로 변경)
2. rhwp 로컬에서 `cargo test --lib text_measurement::` 전건 통과 확인
3. `cargo test --lib` 957 passed 기대 (955 + 2 = 기존 947 + #259 6건 + #262 4건)
4. PR 에 admin merge 코멘트 + 기여자 감사 + 수정 경위 설명
5. `pr_262_review{,_report}.md` 를 `pr/archives/` 로 이동
6. 이슈 #257 close (closes 자동 트리거)
7. devel push → CI 재실행

## 6. 최종 판단

**머지 (수정 후)**

- B-2 는 완전 유효, B-1 은 DB 미등록 폰트에 대해 유효
- #259 와 기능적 상호보완 (C안 영역을 #259 가 흡수했고, A안은 #262 가 담당)
- 문서·테스트·스모크 모두 기여자 성실 수행
- 실패 테스트 2건은 PR 결함이 아닌 fixture stale 문제

## 7. 승인 요청

본 보고서의 §4.1 (권장 조치) 와 §5 (머지 계획) 에 대한 승인 요청.
