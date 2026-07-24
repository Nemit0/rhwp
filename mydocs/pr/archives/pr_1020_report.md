# PR #1020 처리 보고서 — Task #727: PUA U+F02B1~F02C4 사각 안 숫자 매핑 entry 제거 + fallback chain 함초롬바탕 family 확장

- 처리일: 2026-05-20
- 컨트리뷰터: [@HaimLee-4869](https://github.com/HaimLee-4869) (Lee eunjung) — **첫 기여**
- 결정: **옵션 A (수용)** — 작업지시자 승인 + 시각 판정 통과
- 머지: (no-ff, local/devel → devel)
- closes #727
- 후속 issue: **#1023** (OVERLAP 10~12 두자리 숫자 글자겹치기)

## 1. 결정 사유 — 첫 기여 모범 PR + 실제 결함 해소

@HaimLee-4869 첫 기여. 본 프로젝트 절차/위키 정합 우수한 PR 본문(Root cause + Fix + 회귀 영향 + 검증 + OVERLAP 별건 분리 + 정공법 후보 + Investigation PR 가이드 정합). issue #727 (table-vpos-01.hwpx p.5 사각 안 1~9 한컴 권위 부정합) 의 실제 해소. PR sweep 으로 좌표/내용 무변동 + font-family 패턴만 변경 입증.

## 2. 처리 내역 (단일 본질 커밋, 작성자 @HaimLee-4869)

| 커밋 (cherry-pick 후) | 내용 |
|------|------|
| `1588c1e1` | Task #727 fix (9파일, 본질 51461af1 cherry-pick + fmt amend) |

- **충돌 없음** (cherry-pick auto-merge)
- fmt amend: 테스트 assert 멀티라인 분할 (rustfmt 권장)

## 3. 변경 본질

### A. PUA 매핑 entry 20개 제거 (paragraph_layout.rs)

`0xF02B1~F02C4 → \u{2460}-\u{2473}` (표준 ①~⑳) 매핑 20개 entry **제거** (raw passthrough). 매핑 결과 표준 ① 가 1순위 폰트(맑은 고딕 등) 의 원 안 ① 글리프로 즉시 렌더링 → 글리프 단위 fallback 차단 → 한컴 권위(함초롬바탕 사각 안 ①) 와 부정합. raw passthrough 로 fallback 작동 활성화. `0xF02EF (·)` / `0xF02FB (▸)` entry **유지** (별도 글리프, scope 외).

### B. generic_fallback() chain 확장 (mod.rs, 4곳)

sans-serif / serif / recovery 4곳에 함초롬바탕 family **6개** (확장B→확장→일반, 한글/영문 둘 다) 추가. 위치: Pretendard 다음, generic 직전. 한글/영문 family name 둘 다 (`feedback_font_alias_sync` 정합 — 시스템 등록 family name 가변성 대응).

### C. golden 7개 일괄 갱신

`UPDATE_GOLDEN=1 cargo test --test svg_snapshot`. font-family 문자열만 변경 — 좌표/글자 무변동.

## 4. 자기 검증

| 항목 | 결과 |
|------|------|
| `cargo test --release --lib` | 1307 passed / 0 failed / 2 ignored |
| `cargo test --release --test svg_snapshot` | 8 passed (golden 7개 갱신 정합) |
| `cargo clippy --release --lib -D warnings` | 통과 |
| `cargo fmt --check` | exit 0 (fmt amend) |
| WASM 빌드 (Docker) | 4.83 MB, rhwp-studio/public 동기화 |

## 5. 검토 쟁점 → sweep 검증 결과 (10 fixture, BEFORE devel `321ffb0d` ↔ AFTER)

모든 fixture diff 발생이나 **정밀 분석으로 PR 본문 주장 완벽 입증**:

- 텍스트 좌표/내용/font-size/font-weight/fill **완전 무변동**
- **font-family 문자열만 변경** (Pretendard 뒤에 함초롬바탕 family 6개 추가)
- 비-텍스트 요소(rect/line/path/g) **diff = 0**

| Fixture | 결과 |
|---------|------|
| **mel-001 HWP/HWPX/HWP5 (쟁점 A 핵심)** | font-family 패턴만 변경 — 회귀 없음 |
| **table-vpos-01 HWPX/HWP (PR 타깃)** | font-family 패턴만 변경 (PUA 매핑 제거 효과 발동) |
| biz_plan, 복학원서, exam_kor, aift, sample16-hwp5 | font-family 패턴만 변경 — 회귀 없음 |

- **쟁점 A (`feedback_v076_regression_origin`)**: Task #509 mel-001 fixture (main.rs:3415-3423 에 0xF02B1-F02B9 명시) 회귀 우려를 sweep + 작업지시자 시각 판정으로 회귀 부재 입증
- **쟁점 B**: golden 7개 좌표/글자 무변동 정밀 확인 — 정합 (font-family 패턴만)
- **쟁점 C**: fallback chain 광범위 영향 — CSS chain 우선순위 동작 정합, 함초롬바탕 우선순위는 generic 직전이라 일반 한글 영향 0
- **쟁점 D**: golden 외 fixture sweep — 일반 fixture 8종 + mel-001 3종 + table-vpos-01 2종 모두 font-family 패턴만

## 6. 작업지시자 시각 판정

table-vpos-01.hwpx p.5 사각 안 1~9 한컴 정합 + mel-001 회귀 부재 — **시각 판정 통과**.

## 7. 후속 issue 등록 — **#1023** (OVERLAP 10~12)

작업지시자 추가 명시: "10 이상 2자리 숫자의 경우 한컴의 글자겹치기 처리 구현". 현재 `1`과 `0` 분리 출력 → PR #1020 본문 명시 OVERLAP path 별건과 일치. **이슈 #1023 신규 등록**:

- 제목: PUA U+F02BA~F02C5 두자리 숫자 OVERLAP 글자겹치기 처리 (사각 안 10~12, 후속 #727)
- 본질: `<hp:compose composeType="OVERLAP" composeText="F02BA + F02C3~C5">` HWPX 구조 SVG 미출력
- 가능 원인 (PR #1020 진단): `composer.rs::inject_char_overlap_text` 산출물 SVG 누락, `control_positions` 매핑, `LAYOUT_OVERFLOW (page=4)` 연관, hwpx parser `<hp:compose>` 영역
- 정공법 후보: SVG `<path>` 직접 / 함초롬바탕 확장B woff2 번들 (라이선스 검토)

## 8. 정공법 후보 (PR 본문 인용, 별도 토론 영역)

- SVG `<path>` 직접 그리기 (폰트 의존 0)
- 한컴 PUA 글리프 web 임베딩 (함초롬바탕 확장B woff2 번들, `mydocs/tech/font_fallback_strategy.md` 참조)

본 PR scope 외, 별도 토론.

## 9. 메모리 룰 정합

- `feedback_contributor_cycle_check` — @HaimLee-4869 **첫 기여**
- `feedback_pr_comment_tone` — 첫 기여 환영 + 사실 중심 (과도한 칭찬 자제)
- `feedback_v076_regression_origin` — mel-001 회귀 우려 → sweep + 시각 판정으로 부재 입증
- `feedback_hancom_compat_specific_over_general` — scope 좁힘 (0xF02B1-F02C4 한정, 0xF02EF/F02FB 유지)
- `feedback_visual_judgment_authority` — table-vpos-01.hwpx + mel-001 작업지시자 시각 판정 권위
- `feedback_font_alias_sync` — fallback chain 영문/한글 둘 다 (가변성 대응) 정합
- `feedback_image_renderer_paths_separate` / `feedback_fix_scope_check_two_paths` — SVG/Canvas/web_canvas 양쪽 generic_fallback() 호출 (PR 본문 명시)
- `reference_authoritative_hancom` — 검증 환경 한컴오피스 2024 한글 Windows 명시 (정답지 framework 정합)
- `project_output_folder_structure` — sweep 산출물 output/poc/pr1020 배치
