# PR #582 처리 보고서

**PR**: [#582 fix: 수식 위첨자 baseline 배치 개선 — 분수/괄호 base (#532)](https://github.com/edwardkim/rhwp/pull/582)
**작성자**: @oksure (Hyunwoo Park)
**처리 결정**: ✅ **cherry-pick 머지**
**처리일**: 2026-05-04

## 1. 처리 결과 요약

| 항목 | 결과 |
|------|------|
| 결정 | cherry-pick 머지 (충돌 0, 단일 파일) |
| 변경 | `src/renderer/equation/layout.rs` +44 / -7 (단일 파일) |
| Linked Issue | **#532** (closes) |
| author 보존 | ✅ @oksure |
| 충돌 | 0 |
| 결정적 검증 | cargo test --lib 1124 (신규 회귀 테스트 +1 GREEN) / svg_snapshot 6/6 / 회귀 0 / clippy 0 |
| 시각 판정 (작업지시자) | ✅ SVG + web Canvas 모두 통과 |
| WASM 빌드 | ✅ 4,588,360 bytes (+2,362 from PR #562 시점) |

## 2. cherry-pick 결과

| 신 commit | 원본 PR commit | 설명 |
|----------|--------------|------|
| `773ac95` | `391dd6d` | fix: 수식 위첨자 baseline 배치 개선 — 분수/괄호 base 처리 (#532) |

author 보존: @oksure (Hyunwoo Park).

## 3. 본 PR 의 본질

### 3.1 결함

분수형 위첨자 또는 괄호+분수 base 에 위첨자 붙일 때 **지수가 base 기준선 아래로 렌더링**:
- `25^{1/3}` — 분수 `1/3` 의 분모 `3` 이 base `25` 아래로 내려옴
- `(1/5)^{x-3}` — 지수 `x-3` 이 괄호 아래로 배치
- `(x^3+2)^5` — 바깥 지수 `5` 가 아래첨자처럼 배치

### 3.2 원인

`layout_superscript()` 의 `sup_shift` 계산:

```rust
let sup_shift = b.baseline - s.height * 0.7;
```

`s.height` 가 큰 경우 (분수형 sup) → `sup_shift` 음수 → 기존 코드가 `sup_box.y = |sup_shift|` 로 위첨자를 아래로 push.

### 3.3 정정

`sup_shift` 부호에 따른 분기 정리:

- **양수** (일반 case): sup 를 상단(y=0), base 를 적절히 하단 배치
- **음수** (tall sup): sup 를 상단(y=0), base 를 `|sup_shift|` 만큼 하단으로

위첨자는 항상 base 보다 위에 위치하는 것이 수학 조판 규칙. 본 정정으로 수학 조판 규칙 정합.

### 3.4 회귀 테스트 (신규)

`test_superscript_fraction_baseline`:
- sup.y ≤ base.y
- sup baseline < base baseline

본 환경 검증: 1124 passed (PR #562 시점 1123 +1).

## 4. 검증 결과

### 4.1 결정적 검증 (모두 통과)

| 게이트 | 결과 |
|--------|------|
| `cargo test --lib` | ✅ **1124 passed** (PR #562 시점 1123 +1, 신규 `test_superscript_fraction_baseline` GREEN) |
| `cargo test --test issue_505` | ✅ 9/9 (PR #507 회귀 0) |
| `cargo test --test issue_530/546/418/501` | ✅ 회귀 0 |
| `cargo test --test svg_snapshot` | ✅ **6/6 passed** |
| `cargo clippy --lib` | ✅ 0 건 |
| `cargo build --release` | ✅ Finished |

### 4.2 WASM 빌드

| 산출물 | 크기 |
|--------|------|
| `pkg/rhwp_bg.wasm` | 4,588,360 bytes (PR #562 시점 4,585,998 +2,362) |
| `rhwp-studio/public/rhwp_bg.wasm` | ✅ 동기화 |

### 4.3 작업지시자 시각 판정

작업지시자 인용:
> svg 와 웹 에디터 모두에서 지수 처리가 개선되었음을 메인테이너가 확인했습니다.

→ **SVG (1차) + web Canvas (2차) 모두 통과**. 분수형 위첨자 / 괄호+분수 base / 다중 위첨자 모두 정합.

## 5. 컨트리뷰터 정합

@oksure (Hyunwoo Park) — PR #581 에 이어 두 번째 PR. 본 사이클의 정합한 영역:
- ✅ **단일 파일 + 작은 변경** (+44 / -7) — 본질 명확 + 빠른 검토
- ✅ **PR 본문 정합** — 결함 분석 + 원인 코드 영역 + 정정 절차 + 검증 명시
- ✅ **신규 회귀 테스트 추가** — `test_superscript_fraction_baseline`
- ✅ **closes #532** 명시 — 이슈 자동 close 트리거
- ✅ **별도 fork branch** (`contrib/fix-eq-superscript-baseline`) — 본 사이클 패턴 정합

## 6. 머지 절차

### 6.1 cherry-pick + 검증 (완료)

```bash
git cherry-pick 391dd6d  # 충돌 0
cargo test --lib  # 1124 passed
docker compose run --rm wasm  # WASM 4,588,360 bytes
```

### 6.2 commit + devel 머지 + push

```bash
git add mydocs/pr/pr_582_report.md
git commit -m "PR #582 처리 보고서 (cherry-pick @oksure 1 commit — 수식 위첨자 baseline)"

git checkout devel
git merge local/devel --no-ff -m "..."
git push origin devel
```

### 6.3 PR / 이슈 close

- PR #582 close (수동, cherry-pick 머지)
- 이슈 #532 close (closes #532 명시)

## 7. 메모리 정합

- ✅ `feedback_check_open_prs_first` — 본 PR 처리 정합
- ✅ `feedback_pr_comment_tone` — close 댓글 차분/사실 중심
- ✅ `feedback_release_sync_check` — main 동기화 정합
- ✅ `feedback_visual_regression_grows` — 시각 판정 게이트 (SVG + web Canvas) 통과
- ✅ `feedback_pdf_not_authoritative` / `reference_authoritative_hancom` — 작업지시자 시각 판정 권위
- ✅ `feedback_no_pr_accumulation` — PR 본문 명시 본질만, 별도 fork branch
- ✅ `feedback_per_task_pr_branch` — `contrib/fix-eq-superscript-baseline`
- ✅ `feedback_essential_fix_regression_risk` — 신규 회귀 테스트 추가 + 기존 52 equation 테스트 통과
- ✅ `feedback_rule_not_heuristic` — sup_shift 부호 기반 분기 정합 룰
