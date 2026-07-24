---
PR: 558
title: "npm/editor RPC + Wrapper에 exportHwpx / exportHwpVerify 노출 (#557, followup #407)"
author: johndoekim (rhwp 첫 PR)
processed: 2026-05-04
result: closed (cherry-pick 통합 완료)
issue: 557 (closed)
merge_commit: 4ae9be3
---

# PR #558 처리 보고서 — cherry-pick 5 commit 통합 + 옵션 C

**처리일**: 2026-05-04
**결정**: ✅ cherry-pick 5 commit + main.ts 옵션 C 통합 → close
**컨트리뷰터**: @johndoekim (rhwp 첫 PR — 환영)

## 1. 본질

npm/editor RPC + Wrapper 에 `exportHwpx` / `exportHwpVerify` 6-layer 통합 노출 (#557, followup #407).

| Layer | 변경 |
|-------|------|
| 1. WASM | (없음) |
| 2. WasmBridge (TS) | `exportHwpx()` / `exportHwpVerify(): string` |
| 3. RPC switch | `case 'exportHwpx'` / `case 'exportHwpVerify'` |
| 4. Wrapper | `RhwpEditor.exportHwpx()` / `exportHwpVerify()` |
| 5. 타입 | `HwpVerifyResult` interface + 두 메서드 타입 |
| 6. README | API 섹션 + 다운로드 예제 + 검증 패턴 |

## 2. cherry-pick 결과

| Stage | commit (PR) | cherry-pick | 충돌 |
|-------|-------------|-------------|------|
| 0 (계획서 + fail-first e2e) | 88101de → bc4bc1d | ✅ | 0 |
| 1 (RPC + WasmBridge) | 91958fb → 911436f | ✅ | **1 (main.ts) — 옵션 C 통합** |
| 2 (Wrapper) | 3149053 → 03a667e | ✅ | 0 |
| 3 (타입 + README) | 73dcdf9 → e5d760b | ✅ | 0 |
| 4 (e2e green + 보고서) | a59f093 → 72af00f | ✅ | 0 |

merge commit: `4ae9be3`

## 3. Stage 1 충돌 — 옵션 C 통합

`rhwp-studio/src/main.ts` 의 RPC switch 영역에서 본 환경 PR #581 (@oksure — iframe race condition, closes #522) 와 본 PR 이 동일 부근 변경.

PR #581 패턴: 모든 RPC case 앞에 `await initPromise` 배치.

PR #558 단순 채택 시 회귀:
- `exportHwpx` / `exportHwpVerify` 두 case 에 `await initPromise` 누락 → race condition 회귀
- `case 'ready': reply(true);` 가 HEAD 의 'ready' (await initPromise 정합) 와 중복 → unreachable

옵션 C 통합:
- 두 신규 case 에 `await initPromise` 추가
- 중복 'ready' 제거

## 4. 결정적 검증

| 게이트 | 결과 |
|--------|------|
| `cargo build --lib --release` | ✅ Finished |
| `cargo test --lib --release` | ✅ 1125 passed (회귀 0) |
| `npx tsc --noEmit` | ✅ 0 errors |

시각 판정은 API 노출 layer 만 변경 (WASM 핵심 + 렌더링 무영향) 으로 생략.

## 5. close 댓글 (요지)

- 첫 PR 환영
- 본질 평가: 6-layer 통합 매트릭스 정합 + Stage 0→4 fail-first 방법론 인정 (TDD + 하이퍼-워터폴 정합)
- Stage 1 충돌 옵션 C 통합 안내 (PR #581 `await initPromise` 패턴 결합 + 중복 'ready' 제거)
- 결정적 검증 결과 요약
- 다음 PR 시 base 동기화 권장 (현재 base `b84c5e9` 가 devel 기준 9 commit 전)

## 6. 메모리 정합

- ✅ `feedback_pr_comment_tone` — 차분 + 사실 + 첫 PR 환영 균형
- ✅ `feedback_essential_fix_regression_risk` — Stage 1 단순 채택 시 race condition 회귀 식별 → 옵션 C
- ✅ `feedback_visual_regression_grows` — API 노출 layer 만 변경, 시각 게이트 적용 영역 아님 정합 판단

## 7. 사후 처리

- [x] cherry-pick 5 commit + Stage 1 옵션 C 통합
- [x] 결정적 검증 (cargo test 1125 + tsc 0)
- [x] devel merge + push (4ae9be3)
- [x] PR #558 close + 환영 댓글
- [x] Issue #557 close
- [x] 검토 문서 archives 이동
