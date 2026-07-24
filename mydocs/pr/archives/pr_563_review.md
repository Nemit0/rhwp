---
PR: 563
title: "fix: LaTeX 분수 수식 미리보기 파싱 보정 (#143 1차)"
author: cskwork (donga-csk, rhwp 첫 PR)
issue: 143 (Refs — 1차 보정, M100, OPEN, no-assignee)
base: main (0fb3e67 — 본 환경 main 시점)
head: d5c7a22 (단일 commit)
mergeable: BLOCKED (base=main → 본 환경 룰: PR 은 devel 로 와야 함)
CI: All SUCCESS (Build & Test, CodeQL, Canvas visual diff, Render Diff)
---

# PR #563 검토 보고서 — 단일 commit cherry-pick + 시각 판정 정합

**PR**: [#563 fix: LaTeX 분수 수식 미리보기 파싱 보정 (#143 1차)](https://github.com/edwardkim/rhwp/pull/563)
**작성자**: @cskwork (donga-csk, rhwp 첫 PR — 환영)
**처리 결정**: ✅ **cherry-pick 단일 commit `d5c7a22` + 충돌 1 (orders) 정정**

## 1. 처리 결과 요약

| 항목 | 결과 |
|------|------|
| 결정 | cherry-pick 단일 commit + orders 충돌 옵션 C 통합 |
| 사유 | (1) 기존 한컴 수식 동작 무영향 (백슬래시 + alphabet 만 LaTeX 인식) (2) 회귀 테스트 4개 + Canvas visual diff CI 통과 (3) Issue #143 의 1차 보정으로 명시 (전체 듀얼 토크나이저는 후속) |
| base 문제 | base 가 `main` 인 상태 — 본 환경 룰: PR 은 devel 로 와야 함. cherry-pick 으로 우회 + 다음 PR 시 base=devel 안내 |
| 충돌 영역 | `mydocs/orders/20260504.md` (HEAD 의 PR 처리 표 + 컨트리뷰터의 "수식 파서" 섹션) — HEAD 측 채택 + 사후 PR #563 항목 추가 |
| 결정적 검증 | ✅ cargo test --lib 1129 (+4 신규 GREEN, 회귀 0) + svg_snapshot 6/6 + clippy 0 + Canvas visual diff CI 통과 |
| 시각 판정 | 컨트리뷰터 본문 스크린샷 + CI Canvas visual diff 통과 — 추가 메인테이너 시각 점검 권장 (equation 영역, PR #582 회귀 이력) |

## 2. PR 정보

| 항목 | 값 |
|------|-----|
| 분기점 | `0fb3e67` (Merge PR #504, v0.7.9 릴리즈 시점, 본 환경 main) |
| commits | 1 (`d5c7a22` "Task #143: LaTeX 분수 입력 미리보기 지원") |
| changedFiles | 8 (Stage 1 + 계획서/구현계획서/최종보고서 + 스크린샷 + tokenizer.rs + parser.rs + orders) |
| additions | 333 / deletions 0 |
| Issue 연결 | #143 (M100 v1.0.0, label 없음, no-assignee) — Refs (1차 보정, closes 가 아님) |
| 작업지시자 절차 정합 | ✅ Stage 1 + 계획서 + 구현계획서 + 최종보고서 + 시각 검증 스크린샷 |
| CI | All SUCCESS (특히 Canvas visual diff + Render Diff 통과) |
| base | `main` (BLOCKED — 본 환경 룰은 PR base=devel) |

## 3. 본질 평가 — Hybrid 접근의 1차 보정

### 3.1 Issue #143 의 설계 의도 vs PR #563 의 접근

**Issue #143 (M100)**: 듀얼 토크나이저 방식 (전략 A) — `latex_tokenizer.rs` + `latex_parser.rs` 신규 + `ast.rs` FontStyleKind 확장 + UI 모드 토글. **기존 한컴 파서는 무수정**.

**PR #563 의 접근**: Hybrid 단일 토크나이저 — 기존 `tokenizer.rs` 에 백슬래시 prefix 인식 추가 (`read_latex_command`) + 기존 `parser.rs` 에 `\frac` / `\sqrt[n]` 분기 추가. **기존 한컴 파서를 직접 수정 (FRAC 분기 + sqrt LBracket 분기)**.

### 3.2 1차 보정의 정합성

PR 본문에서 명시:
> "이 PR은 전체 LaTeX 파서를 구현하지 않고, 미리보기에서 가장 눈에 띄는 기본 구조인 분수와 제곱근 입력만 기존 AST에 연결하는 **1차 보정**이다."
> "비-목표: 이 PR은 Issue #143 전체를 닫지 않는다."

→ **설계 차이 인지 정합**. `Refs #143` (closes 가 아님), 1차 보정으로 명시. 향후 듀얼 토크나이저로 전환 가능성 보존.

### 3.3 코드 안전성

✅ **백슬래시 + alphabet 만 LaTeX 인식** — `\\` 단독 (백슬래시) 또는 `\` + 비-alphabet (예: `\1`) 은 기존 동작 유지
✅ **기존 명령어 (`SQRT`, `OVER`, `MATRIX`) 동작 보존** — `\frac` → `Token("frac")` 가 `cu = uppercase("frac") = "FRAC"` 로 매칭. 한컴 `OVER` 분기와 별도
✅ **`\sqrt[n]{x}` 의 indexed sqrt** — 기존 `SQRT(n) of x` 동작 보존 (LBracket 분기만 추가)
✅ **회귀 테스트 4개** — `test_latex_command_prefix` (tokenizer), `test_latex_frac` / `test_latex_quadratic_slice` / `test_latex_sqrt_with_bracket_index` (parser)

## 4. cherry-pick 결과

### 4.1 진행

| commit | cherry-pick | 충돌 |
|--------|-------------|------|
| `d5c7a22` (Task #143 LaTeX) → cherry-picked | ✅ | **1 (orders) — 옵션 C 통합** |

### 4.2 orders 충돌 옵션 C 통합

- HEAD 측: PR 처리 표 (PR #553/551/562/581/582/583/578/579/558/571/586) — 본 환경 orders 컨벤션
- PR #563 측: "수식 파서" 별도 섹션 — 본 환경 컨벤션과 상이

→ HEAD 측 PR 처리 표 채택 + 사후 PR #563 항목 추가.

## 5. 결정적 검증 (모두 통과)

| 게이트 | 결과 |
|--------|------|
| `cargo test --lib --release` | ✅ 1129 passed (+4 from 1125 baseline, 회귀 0) |
| `cargo test --lib --release equation` | ✅ 77 passed (PR #582 의 76 + 신규 1) |
| `cargo test --lib --release test_latex` | ✅ 4 passed (PR 의도 신규) |
| `cargo test --release --test svg_snapshot` | ✅ 6/6 passed (회귀 0) |
| `cargo clippy --lib --release -- -D warnings` | ✅ 0 warnings |
| CI (Build & Test + CodeQL + Canvas visual diff + Render Diff) | ✅ All SUCCESS |

## 6. 시각 판정 — Canvas visual diff CI 통과 + 추가 메인테이너 점검 권장

PR 본문 + CI Canvas visual diff 통과는 결정적 자동 게이트로 정합. 다만 **equation 영역은 PR #582 (분수형 위첨자 베이스라인) 에서 회귀가 발현된 이력 영역** 이므로 메모리 `feedback_visual_regression_grows` + `feedback_v076_regression_origin` 정합으로 추가 메인테이너 시각 점검 권장:

- 본 환경 fixture 의 수식 포함 페이지 (특히 분수/제곱근 포함) sweep
- `\frac` / `\sqrt` 입력 자체가 본 환경에서 우선 발생하지 않으므로 (기존 한컴 수식 만), **회귀 위험은 한컴 수식 → 새 분기 분기 → 기존 분기로 안 돌아가는 케이스** 만 점검 영역

### 6.1 점검 우선 영역

- 한컴 수식 `1 over 2` 입력 시 (기존 동작) — 회귀 0 (테스트 통과)
- 한컴 수식 `SQRT x` / `SQRT(n) of x` 입력 시 — 회귀 0 (LBracket 분기는 LaTeX 만 이동)
- 한컴 수식 `OVER` / `MATRIX` 등 — 회귀 0 (FRAC 분기는 백슬래시 시작 시만)

→ **결정적 검증 + Canvas visual diff CI 통과 + 본질적으로 회귀 위험 0 영역** 으로 본 PR 채택 적합.

## 7. base=main 문제 — 다음 PR 시 안내

본 환경 룰: PR 은 `devel` 로 와야 머지 가능. 본 PR 은 `main` base — `BLOCKED` 상태. cherry-pick 으로 우회 처리 + 다음 PR 시 컨트리뷰터에게 안내:

```bash
git fetch upstream
git checkout devel
git merge --ff-only upstream/devel  # 또는 git reset --hard upstream/devel
git push origin devel
git checkout -b local/task{N}
```

## 8. 컨트리뷰터 안내 (close 댓글)

- **첫 PR 환영** + **하이퍼-워터폴 단계 절차 정합** (Stage 1 + 계획서/구현계획서/최종보고서 + 시각 검증 스크린샷)
- **본질 평가**: 1차 보정으로 명시 + 기존 한컴 동작 보존 + 회귀 테스트 4개
- **Issue #143 후속 권장**: 전체 듀얼 토크나이저 (`latex_tokenizer.rs` + `latex_parser.rs`) 는 별도 사이클
- **base 안내**: 다음 PR 은 `devel` 로 (현재 base=main 이라 BLOCKED 였음)
- **Refs #143 유지** (closes 아님 — 1차 보정 정합)

## 9. 본 사이클 사후 처리

- [x] cherry-pick `d5c7a22` 단일 commit (orders 충돌 옵션 C 통합)
- [x] 결정적 검증 (cargo test 1129 + equation 77 + svg_snapshot 6/6 + clippy 0)
- [ ] orders 갱신 (PR #563 항목 추가)
- [ ] local/devel → devel merge + push
- [ ] PR #563 close + 환영 댓글
- [ ] 본 검토 문서 archives 보관
