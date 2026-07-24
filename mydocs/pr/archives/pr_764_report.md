---
PR: #764
제목: fix — hwpeq inf 기호(∞) 우선순위 복원 (closes #762)
컨트리뷰터: @oksure (Hyunwoo Park) — 20+ 사이클 핵심 컨트리뷰터 (5/10 사이클 27번째 PR — 이전 abandon 후 재시도)
처리: 옵션 1 — head commit 만 cherry-pick + no-ff merge (commit 6~8 별 본질 영역 별 PR 안내)
처리일: 2026-05-10
머지 commit: 4cf08316
---

# PR #764 처리 보고서

## 1. 처리 결과

✅ **머지 완료** — 옵션 1 (head commit 만 cherry-pick + no-ff merge)

| 항목 | 값 |
|------|-----|
| 머지 commit | `4cf08316` (--no-ff merge) |
| Cherry-pick commit | `0cc3d5c4` (head commit `0eed7a3b` 만, parser.rs +36/-7) |
| Skip commits | commits 1~5 (PR #729 머지 완료 영역 devel 동일 본질) + commits 6~8 (별 본질 영역 별 PR 안내) |
| closes | #762 |
| 시각 판정 | ✅ 작업지시자 웹 에디터 시각 판정 통과 |
| 자기 검증 | cargo build/test/clippy ALL GREEN + 회귀 가드 2건 PASS + sweep 168 same / 2 diff (의도) + WASM 4.66 MB |

## 2. 이전 abandon 본질 (5/10 사이클 시점)

context summary 기록:
- 이전 시도: cherry-pick + WASM 빌드 + Service Worker 캐시 결함 영역 SVG 개선 영역 WASM canvas 영역 미반영 발견
- 작업지시자 결정: "이번 PR 리뷰는 실패입니다. local/devel 로 스위치하고 local/task762 는 삭제합니다."
- abandon 영역 archives 미생성

## 3. 본 PR 본질 (Issue #762)

PR #729 (Task #143 LaTeX 호환 확장 1차, 5/9 머지) 영역 회귀:
- `FUNCTIONS` HashMap 영역 `("inf", "inf")` 추가 영역 기존 hwpeq `inf` → `∞` 매핑이 함수 텍스트 `"inf"` 영역 대체됨
- `samples/exam_math.hwp` 페이지 14/16 영역 `∞` 기호 → `inf` 텍스트 출력 회귀

원인: `parser.rs` 영역 `is_function(cmd)` 영역 `lookup_symbol(cmd)` 영역 먼저 점검 → `inf` 영역 함수 텍스트 영역 처리.

## 4. 정정 본질 (head commit `0eed7a3b`)

`src/renderer/equation/parser.rs` 영역 `lookup_symbol` (Unicode 기호 매핑) 영역 `is_function` (함수명 매칭) 영역 먼저 점검:
- `inf` → `lookup_symbol` → `INF` → `∞` (기존 동작 복원)
- `deg` → `lookup_symbol` → `DEG` → `°` (기존 동작 복원)
- `sin`, `cos`, `log` 등 → 기호 테이블 부재 영역 함수 처리 (정합)

### 4.1 회귀 가드 (테스트 2건)
- `test_hwpeq_inf_remains_symbol` — `lim _{n→inf}` 영역 `∞` 출력
- `test_hwpeq_deg_remains_symbol` — `90 deg` 영역 `°` 출력

## 5. 본 환경 처리 — 옵션 1 (head commit 만 cherry-pick)

### 5.1 8 commits 누적의 본질 분리

| commit | 본질 | 본 환경 처리 |
|--------|------|-------------|
| `d96ddcc4` ~ `0264fe18` (1~5) | Task #143 LaTeX 호환 확장 1차 | PR #729 머지 완료 영역 devel 동일 본질 → **skip** |
| `45fdb335` (6) | Task #143 명령어 대폭 확장 (3차) | **별 본질 영역 별 PR 안내** |
| `d672f954` + `04187512` (7~8) | overset/underset/stackrel + 이스케이프 | **별 본질 영역 별 PR 안내** |
| **`0eed7a3b` (head, 본 PR 본질)** | **Issue #762 정정** (parser.rs +36/-7) | ✅ **cherry-pick** |

### 5.2 컨트리뷰터 안내 (PR comment)
PR 본문 영역 Issue #762 정정만 명시되어 commit 6~8 영역 별 본질 (Task #143 추가 LaTeX 확장) 영역 별 PR 분리 권장 안내 (한국어 댓글).

## 6. 본 환경 검증

| 검증 | 결과 |
|------|------|
| `cherry-pick` (head commit 만) | ✅ auto-merge 충돌 0건 |
| `cargo build --release` | ✅ 통과 |
| `cargo test --release` | ✅ ALL GREEN |
| 회귀 가드 2건 PASS | ✅ test_hwpeq_inf_remains_symbol + test_hwpeq_deg_remains_symbol |
| `cargo clippy --release -- -D warnings` | ✅ 통과 |
| 광범위 sweep (7 fixture / 170 페이지) | **168 same / 2 diff** (exam_math_014/016 — 의도된 시각 변경: ∞ 기호 복원, PR 본문 정합) |
| WASM 빌드 (Docker, 재빌드) | ✅ 4.66 MB |

## 7. 작업지시자 웹 에디터 시각 판정 ✅ 통과

samples/exam_math.hwp 페이지 14/16 영역 `∞` 기호 출력 정합 확인.

이전 abandon 영역 Service Worker 캐시 결함 영역 본 환경 영역 회피 — WASM 재빌드 + 캐시 처리 후 정합 확인.

## 8. sweep 2 diff 분석

### 8.1 exam_math_014.svg + exam_math_016.svg
- **의도된 시각 변경** — PR #729 회귀 영역 `inf` 텍스트 영역 출력되던 것이 `∞` 기호로 복원
- PR 본문 영역 명시 영역 정확히 일치 (`samples/exam_math.hwp` 페이지 14/16)
- 회귀 부재 — 정정의 본질 영역 영역 시각 변경 발생

### 8.2 다른 sweep 영역 (168 same)
- 다른 fixture (exam_kor/eng/science, synam-001, aift, 2010-01-06, hwp3) 영역 회귀 0
- hwpeq 수식 영역 영역 다른 사용 영역 영역 정합 (sin/cos/log 등 함수 영역 영역 기호 부재 영역 영역 정상 처리 입증)

## 9. 영향 범위

### 9.1 변경 영역
- `src/renderer/equation/parser.rs` 영역 lookup_symbol / is_function 우선순위 (단일 파일, +36/-7)

### 9.2 무변경 영역
- WASM 빌드 영역 영역 4.66 MB (parser 변경만 영역 영역 빌드 결과 영향)
- 다른 hwpeq 수식 (sin/cos/log 등 함수) 영역 영역 회귀 0
- 다른 fixture 시각 정합 (sweep 168 same 입증)

## 10. 메모리 룰 적용

| 룰 | 적용 |
|----|------|
| `feedback_contributor_cycle_check` | @oksure **20+ 사이클** (5/10 27번째 PR, 이전 abandon 후 재시도) |
| `feedback_image_renderer_paths_separate` | hwpeq parser 영역 영역 svg/canvas/skia 공통 영역 영역 동기 정정 |
| `feedback_pr_supersede_chain` (c) 패턴 | PR #729 (Task #143 1차) 머지 후 회귀 정정 영역 별 PR (Issue #762) — 동일 패턴 |
| `feedback_process_must_follow` | head commit 만 cherry-pick — 본질 분리 (Issue #762 만), commit 6~8 영역 별 PR 안내 |
| `feedback_visual_judgment_authority` | 작업지시자 시각 판정 영역 영역 ∞ 기호 복원 정합 확인 — 이전 abandon 영역 권위 사례 (Service Worker 캐시 결함 발견) 영역 회피 |
| `feedback_self_verification_not_hancom` | 회귀 가드 2건 + 광범위 sweep + 작업지시자 시각 판정 — 자기 검증 + 시각 판정 게이트 정합 |

## 11. 잔존 후속

- **컨트리뷰터에 commit 6~8 별 PR 안내** (PR comment 영역 영역 명시 영역 영역 완료)
- 별 본질 (Task #143 추가 LaTeX 확장 — \\overset/underset/stackrel + 이스케이프 + 명령어 대폭 확장) 영역 영역 별 PR 등록 대기

---

작성: 2026-05-10
