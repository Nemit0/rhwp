---
PR: 563
title: "fix: LaTeX 분수 수식 미리보기 파싱 보정 (#143 1차)"
author: cskwork (donga-csk, rhwp 첫 PR)
processed: 2026-05-04
result: closed (cherry-pick 통합 완료)
issue: 143 (Refs — OPEN 유지, 후속 듀얼 토크나이저 사이클)
merge_commit: 7bdc111
visual_judgment: ★ 통과 (latex_equation_preview.png — 메인테이너 직접 확인)
---

# PR #563 처리 보고서 — 단일 commit cherry-pick + 시각 판정 통과

**처리일**: 2026-05-04
**결정**: ✅ cherry-pick 단일 commit `d5c7a22` (orders 충돌 옵션 C 통합) → close
**컨트리뷰터**: @cskwork (donga-csk, rhwp 첫 PR)

## 1. 본질

Issue #143 (M100 — LaTeX 듀얼 토크나이저 방식, OPEN) 의 **1차 보정** — `\frac{a}{b}` + `\sqrt[n]{x}` 입력을 기존 한컴 AST 에 연결.

**Issue #143 설계** (듀얼 토크나이저, 향후 사이클): `latex_tokenizer.rs` + `latex_parser.rs` 신규 + `ast.rs` FontStyleKind 확장 + UI 모드 토글, **기존 한컴 파서 무수정**.

**PR #563 의 hybrid 접근** (1차 보정): 기존 `tokenizer.rs` 에 `read_latex_command` 추가 (백슬래시 + alphabet) + 기존 `parser.rs` 에 `\frac` (FRAC 분기) / `\sqrt[n]` (LBracket 분기) 추가.

→ PR 본문이 **`Refs #143`** (closes 아님) + "비-목표: Issue #143 전체를 닫지 않는다" 명시 — 설계 차이 인지 정합.

## 2. cherry-pick 결과

| commit | cherry-pick | 충돌 |
|--------|-------------|------|
| `d5c7a22` (Task #143) → `c4a0a04` | ✅ | **1 (orders) — 옵션 C 통합** |

merge commit: `7bdc111`

### orders 충돌 옵션 C 통합

- HEAD: 본 환경 PR 처리 표 (PR #553/551/562/581/582/583/578/579/558/571/586)
- PR #563 측: "수식 파서" 별도 섹션 — 본 환경 컨벤션과 형태 상이

→ HEAD 측 PR 처리 표 채택 + 사후 PR #563 항목 자체로 통합.

## 3. 코드 안전성

✅ **백슬래시 + alphabet 만 LaTeX 인식** — `\\` 단독 / `\` + 비-alphabet 은 기존 동작 유지
✅ **기존 한컴 분기 보존** — `SQRT`/`OVER`/`MATRIX` 모두 그대로
  - `\frac` → `Token("frac")` → `cu = uppercase("frac") = "FRAC"` 새 분기 (대문자 비교 활용 정합)
  - 한컴 `OVER` 분기는 별도, 충돌 0
✅ **`\sqrt[n]{x}` LBracket 분기만 추가** — `SQRT(n) of x` LParen 분기 보존
✅ **회귀 테스트 4개**:
  - `test_latex_command_prefix` (tokenizer)
  - `test_latex_frac` / `test_latex_quadratic_slice` / `test_latex_sqrt_with_bracket_index` (parser)
✅ **작업지시자 절차** — Stage 1 + 계획서/구현계획서/최종보고서 + 시각 검증 스크린샷 완비

## 4. 결정적 검증

| 게이트 | 결과 |
|--------|------|
| `cargo test --lib --release` | ✅ 1129 passed (+4 신규 GREEN, 회귀 0) |
| `cargo test ... equation` | ✅ 77 passed |
| `cargo test ... test_latex` | ✅ 4 passed (신규 LaTeX) |
| `cargo test --test svg_snapshot` | ✅ 6/6 passed (회귀 0) |
| `cargo clippy --lib --release -- -D warnings` | ✅ 0 warnings |
| CI | ✅ All SUCCESS (Build & Test + CodeQL + Canvas visual diff + Render Diff) |

## 5. 시각 판정 — 메인테이너 통과 ★

`mydocs/working/task_m100_143_stage1/latex_equation_preview.png` 의 두 케이스 메인테이너 직접 시각 확인:

- `\frac{1}{2}` — 분수선 정합 렌더링
- `x=\frac{-b \pm \sqrt{b^2}}{2a}` — 분수 + 루트 + ± 모두 정합 렌더링

→ **메인테이너 시각 판정 ★ 통과**.

## 6. base=main 우려 + 다음 PR 안내

본 PR 의 base 가 `main` 이라 본 환경 룰 (PR base=devel) 상 `BLOCKED` 상태였음. cherry-pick 으로 우회 + 다음 PR 시 base=devel 안내.

## 7. close 댓글 (요지)

- 첫 PR 환영
- 본질 평가: 1차 보정 명시적 한정 (`Refs #143`) + 코드 안전성 우수 (한컴 분기 보존) + 회귀 테스트 4개 + 작업지시자 절차 정합
- 결정적 검증 + 메인테이너 시각 판정 ★ 통과 결과
- base=main → 다음 PR 시 base=devel 안내
- Issue #143 후속 듀얼 토크나이저 사이클 권장 (본 PR hybrid 분기는 듀얼로 자연스럽게 마이그레이션 가능)

## 8. 메모리 정합

- ✅ `feedback_pr_comment_tone` — 차분 + 사실 + 첫 PR 환영 균형
- ✅ `feedback_visual_regression_grows` — 시각 판정 게이트 정합 운영 (Canvas visual diff CI + 메인테이너 직접 확인)
- ✅ `feedback_essential_fix_regression_risk` — 1차 보정 본질 한정 (전체 듀얼 파서 미시도) + 한컴 분기 보존
- ✅ `feedback_rule_not_heuristic` — 백슬래시 + alphabet 단일 룰 (분기 없음)

## 9. 사후 처리

- [x] 단일 commit cherry-pick (orders 충돌 옵션 C 통합)
- [x] 결정적 검증 (cargo test 1129 + equation 77 + svg_snapshot 6/6 + clippy 0)
- [x] 메인테이너 시각 판정 ★ 통과
- [x] orders 갱신 (PR #563 항목)
- [x] devel merge + push (`7bdc111`)
- [x] PR #563 close + 환영 댓글
- [x] Issue #143 OPEN 유지 (후속 듀얼 토크나이저 사이클)
- [x] 검토 문서 archives 이동
