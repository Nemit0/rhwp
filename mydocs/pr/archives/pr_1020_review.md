# PR #1020 검토 — Task #727: PUA U+F02B1~F02C4 사각 안 숫자 매핑 entry 제거 + fallback chain 함초롬바탕 family 확장

- 작성일: 2026-05-20
- 컨트리뷰터: [@HaimLee-4869](https://github.com/HaimLee-4869) (Lee eunjung) — **첫 기여**
- PR: https://github.com/edwardkim/rhwp/pull/1020
- base/head: `devel` ← `HaimLee-4869:pr/727-pua-boxed-digits` (cross-repo fork)
- 연결 이슈: closes #727 (table-vpos-01.hwpx p.5 PUA U+F02B1~F02BC 매핑 — 사각형 안 숫자가 원문자/두부로 출력)
- 규모: +4421 / -4441, 9 files (소스 2 + golden 7)
- mergeable: **MERGEABLE**
- 본질 커밋: 단일 `51461af1` (작성자 @HaimLee-4869)

## 1. 컨트리뷰터 사이클 (`feedback_contributor_cycle_check`)

@HaimLee-4869 = **첫 기여**. 동시 OPEN PR 2건(#1020 + #1021). devel = `321ffb0d` (#1019 보류 후 docs) 동기화.

## 2. 본질 변경

### A. PUA 매핑 entry 20개 제거 (paragraph_layout.rs)

`0xF02B1~F02C4 → \u{2460}-\u{2473}` (표준 ①~⑳) 매핑 20개 entry **제거** (raw passthrough). 이유: 매핑 결과 표준 ① 가 1순위 폰트(맑은 고딕 등)의 원 안 ① 글리프로 즉시 렌더링 → **글리프 단위 fallback 차단** → 한컴 권위(함초롬바탕 사각 안 ①)와 부정합.

`0xF02EF (·)` / `0xF02FB (▸)` entry **유지** (별도 글리프, scope 외).

### B. generic_fallback() chain 확장 (mod.rs, 4곳)

sans-serif / serif / recovery 4곳에 함초롬바탕 family **6개** (확장B→확장→일반, 한글/영문 family name 둘 다) 추가. 위치: Pretendard 다음, generic fallback 직전.

```
HCR Batang Ext-B, 함초롬바탕 확장B,
HCR Batang Ext, 함초롬바탕 확장,
HCR Batang, 함초롬바탕
```

PR 의도: 1순위 폰트가 글리프 가지면 chain 우선순위에 의해 1순위 사용 → 본문 한글 영향 0. PUA 글리프 부재 시에만 함초롬바탕 매칭.

### C. golden 7개 일괄 갱신

`UPDATE_GOLDEN=1 cargo test --test svg_snapshot` 으로 일괄 갱신. PR 본문 명시: "chain 확장 한 가지 패턴, 좌표/글자 변경 0". 영향 파일: form-002, issue-147(aift), issue-157, issue-267(KTX), issue-617(exam_kor), issue-677(복학원서), table-text.

## 3. 검토 의견

### 강점 (첫 기여로서 모범적)

1. **PR 본문 매우 충실** — Root cause + Fix + 회귀 영향 + 검증 + OVERLAP 10-12 별건 분리 + 정공법 후보 + Investigation PR 가이드 정합. 첫 기여자가 본 프로젝트 절차/위키 정합 우수.
2. **실제 결함 해소** (PR 본문 캡처) — table-vpos-01.hwpx p.5 사각 안 1~9 한컴 정합 + 사용자 작업 영역 정부 공문 hwpx 정합 확인.
3. **CSS font-family chain 정합 동작** — 1순위 폰트 글리프 보유 시 영향 0, PUA만 함초롬바탕 매칭. 한글/영문 family name 둘 다 + 확장B→확장→일반 우선순위.
4. **golden 7개 자기 검증** — UPDATE_GOLDEN 일괄 갱신 + cargo test svg_snapshot 8 passed.
5. **scope 좁힘** — 0xF02B1~F02C4 (20개) 만 제거, 0xF02EF/0xF02FB 유지 (별도 글리프). OVERLAP 10-12 별건 분리 명시.
6. **검증 환경 명시** — 한컴오피스 2024 한글 Windows 편집기 (정답지 framework 정합, `reference_authoritative_hancom`).
7. **테스트 명 정정** — `supplementary_pua_a_maps_circled_digits` → `passthrough_for_boxed_digits` (의미 일치).
8. cargo test 1307 + clippy 0 + fmt 통과 (PR 본문).

### ⚠️ 핵심 쟁점

#### (A) Task #509 mel-001 회귀 가능성 (`feedback_v076_regression_origin`)

`src/main.rs:3415-3423` 에 0xF02B1~F02B9 가 **mel-001 fixture PUA** 로 명시됨. 본 PR 이 매핑(`U+2460-U+2468`)을 제거 → mel-001 sample 에서:

- **함초롬바탕 시스템 설치 환경 (Windows 한컴 PC)**: 사각 안 ① 정합 (PR 의도)
- **함초롬바탕 미설치 환경 (CI Linux, macOS, 일반 사용자 리눅스)**: **.notdef tofu** (회귀 가능)

**검증 필수**: mel-001 sweep + 본 환경 시각 판정. PR 본문이 검증 환경을 "함초롬바탕 시스템 설치" 로 명시 — 작업지시자 환경 정합 확인 필요. SVG 출력은 font-family 문자열만 변경되므로 SVG 자체에는 영향 없으나 **브라우저 렌더 결과**가 환경 의존.

#### (B) golden 7개 변경 — 좌표/글자 무변동 정밀 확인

PR 본문 "chain 확장 한 가지 패턴, 좌표/글자 변경 0" — sweep cmp 로 정밀 확인. font-family 문자열 변경만이라면 일관 패턴.

#### (C) fallback chain 광범위 영향 — 함초롬바탕이 한글 글리프 보유 시

함초롬바탕은 PUA 외 일반 한글 글리프도 보유. chain 에서 generic 직전(Pretendard 뒤) 이라 일반 한글 영향 0 이 합리적 동작이나, **시스템에 1순위 폰트(맑은 고딕/Noto Sans KR) 없고 함초롬바탕만 있는 환경** 에서는 함초롬바탕이 일반 한글에도 매칭. PR 의도는 PUA 한정이나 환경 의존성 명시 필요.

#### (D) golden 7개 sweep 외 fixture 회귀 가능성

본 PR 이 매핑을 제거한 PUA(0xF02B1-F02C4) 가 golden 7개 외 fixture 에 있을 수 있음 — `complete sweep` 으로 확인 권고 (mel-001, kps-ai, biz_plan, 복학원서, KTX, hwpspec, k-water-rfp 등 main.rs:3403-3424 의 PUA 사용 fixture).

#### (E) 첫 기여자 환영 + `feedback_pr_comment_tone` 준수

첫 기여자이므로 머지/수정 요청 시 환영 톤. 과도한 칭찬은 자제(`feedback_pr_comment_tone`), 사실 중심으로 "첫 기여 + 모범적 PR 본문 + 절차 정합" 인정.

### 확인 필요 (검증 단계)

1. cherry-pick `51461af1` (충돌 없음 예상 — 단일 커밋 + 본 PR 영역이 좁음)
2. `cargo test --release --lib` 1307 + `cargo test --test svg_snapshot` 8 + clippy -D + fmt 0
3. **광범위 sweep** — table-vpos-01.hwpx(타깃) + **mel-001(쟁점 A 핵심)** + 일반 fixture (sample16, hy-001, exam_kor/math, aift, biz_plan, 복학원서 등) 회귀 부재. 특히 mel-001 PUA 영역 SVG 출력 + 본 환경 시각 판정
4. WASM 빌드 + 작업지시자 시각 판정 — table-vpos-01.hwpx p.5 사각 안 1~9 정합 + mel-001 PUA 영역 회귀 부재

## 4. 처리 옵션

- **옵션 A (수용 — 권고)**: 실제 결함 해소 + 첫 기여 모범 PR 본문 + scope 좁힘. **쟁점 A(mel-001) sweep + 본 환경 시각 판정 통과** 필수. 첫 기여자 환영.
- **옵션 B (수정 요청)**: mel-001 회귀 또는 다른 fixture 회귀 시 — scope 좁힘 (PUA passthrough 를 특정 sample 조건 가드) 또는 fallback fallback (매핑 유지 + chain 만 확장) 요청.
- **옵션 C (close)**: 본질 결함 시. 해당 낮음.

## 5. 메모리 룰 정합

- `feedback_contributor_cycle_check` — @HaimLee-4869 **첫 기여**
- `feedback_pr_comment_tone` — 첫 기여 환영 + 과도한 칭찬 자제
- `feedback_v076_regression_origin` — mel-001 회귀 가능성 (컨트리뷰터 환경 vs 작업지시자 환경 차이)
- `feedback_hancom_compat_specific_over_general` — scope 좁힘 (0xF02B1-F02C4 한정, 0xF02EF/F02FB 유지). 다만 fallback chain 확장은 광범위 — 매핑 제거가 더 정밀하다는 trade-off
- `feedback_visual_judgment_authority` — table-vpos-01.hwpx + mel-001 시각 판정 게이트
- `feedback_font_alias_sync` — fallback chain 의 함초롬바탕 family 영문/한글 둘 다 포함 (시스템 등록 family name 가변성 대응) — 정합
- `reference_authoritative_hancom` — 검증 환경 한컴오피스 2024 한글 Windows 명시 (정답지 framework 정합)
- `feedback_image_renderer_paths_separate` / `feedback_fix_scope_check_two_paths` — SVG/Canvas/web_canvas 양쪽 generic_fallback() 호출 (PR 본문 명시)
- `project_output_folder_structure` — sweep 산출물 output/poc/pr1020 배치

## 6. 권고

**옵션 A 조건부** — 첫 기여 모범 PR 본문 + 실제 결함 해소 + scope 좁힘. 검증 단계에서 (1) cherry-pick + cargo test/clippy/fmt + svg_snapshot, (2) **광범위 sweep — mel-001 (쟁점 A 핵심) 회귀 부재 + table-vpos-01.hwpx p.5 정합**, (3) WASM + 작업지시자 시각 판정 통과 시 cherry-pick no-ff merge. mel-001 회귀 시 옵션 B 전환. 첫 기여자 환영 + 사실 중심 코멘트.
