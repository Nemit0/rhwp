---
PR: 558
title: "npm/editor RPC + Wrapper에 exportHwpx / exportHwpVerify 노출 (#557, followup #407)"
author: johndoekim (첫 PR)
base: devel (b84c5e9 — 본 환경 PR #553/562/581/582/583 처리 9 commit 전)
head: a59f093
commits: 5 (Stage 0 fail-first → Stage 4 green)
mergeable: CONFLICTING (rhwp-studio/src/main.ts — PR #581 initPromise 와 동일 영역)
CI: 미실행 (statusCheckRollup 비어있음)
---

# PR #558 검토 보고서 — cherry-pick 진행 + 옵션 C 통합

**PR**: [#558 npm/editor RPC + Wrapper에 exportHwpx / exportHwpVerify 노출](https://github.com/edwardkim/rhwp/pull/558)
**작성자**: @johndoekim (rhwp 첫 PR — 환영)
**처리 결정**: ✅ **cherry-pick 5 commit 진행 + 충돌 1 영역 옵션 C 통합 (PR #581 initPromise 패턴 정합)**

## 1. 처리 결과 요약

| 항목 | 결과 |
|------|------|
| 결정 | cherry-pick 5 commit 진행 + Stage 1 충돌 옵션 C 통합 |
| 사유 | 본질 정합 (RPC + Wrapper API 노출 분할 정복) + Stage 0→4 fail-first 방법론 우수 |
| 충돌 영역 | `rhwp-studio/src/main.ts` (PR #581 의 `await initPromise` 패턴과 결합 필수) |
| 충돌 정정 | PR #558 의 `exportHwpx` / `exportHwpVerify` case 에 `await initPromise` 추가 + `case 'ready'` 중복 제거 (HEAD 의 'ready' 가 위에 이미 정합) |
| 결정적 검증 | `cargo test --lib`: 1125 passed (회귀 0), `npx tsc --noEmit`: 0 errors |
| 시각 판정 | 불필요 (API 노출 layer, 렌더링 무영향) |

## 2. PR 본질 평가

### 2.1 6-layer 통합 매트릭스 (PR 본문 인용)

| Layer | 변경 | 비고 |
|-------|------|------|
| 1. WASM | (없음) | 기존 `WasmRhwp::export_hwpx()` / `export_hwp_verify()` 활용 |
| 2. WasmBridge (TS) | `exportHwpx()` / `exportHwpVerify(): string` 추가 | wasm-bridge.ts |
| 3. RPC switch | `case 'exportHwpx'` / `case 'exportHwpVerify'` 추가 | main.ts |
| 4. Wrapper (npm/editor) | `RhwpEditor.exportHwpx()` / `exportHwpVerify()` 메서드 + JSDoc | index.js |
| 5. 타입 (`index.d.ts`) | `HwpVerifyResult` interface + 두 메서드 타입 | TypeScript 사용자 |
| 6. README | API 섹션 + 다운로드 예제 + 검증 패턴 | 사용자 안내 |

**평가**: 정합. WASM 핵심을 건드리지 않고 노출만 진행 — 회귀 위험 0.

### 2.2 Stage 0 → 4 fail-first 방법론

- **Stage 0**: 수행/구현 계획서 + fail-first e2e (`export-hwpx.test.mjs` RED — RPC 갭 캡처)
- **Stage 1**: RPC switch + WasmBridge
- **Stage 2**: Wrapper 메서드
- **Stage 3**: 타입 + README
- **Stage 4**: e2e green 전환 + 회귀 점검 + 최종 보고서

→ TDD 정합 + 본 프로젝트 하이퍼-워터폴 단계 절차 준수. **첫 PR 컨트리뷰터로서 모범 사례**.

## 3. 충돌 영역 — 옵션 C 통합

### 3.1 충돌 본질

`rhwp-studio/src/main.ts` 의 RPC switch 영역에서 PR #558 과 본 환경 (PR #581) 이 동일 부근을 변경:

- **HEAD (devel)**: PR #581 의 `await initPromise` 패턴이 모든 RPC case 앞에 배치 (race condition 정정 — closes #522)
- **PR #558**: `exportHwpx` / `exportHwpVerify` 추가 (그러나 `await initPromise` 누락) + `case 'ready': reply(true);` 추가 (HEAD 의 'ready' 가 위에 이미 있음)

### 3.2 단순 채택 시 회귀 위험

- PR #558 측을 그대로 채택: race condition 회귀 (PR #581 의 effort 무효화) + `case 'ready'` 중복으로 unreachable 코드
- HEAD 측을 그대로 유지: PR #558 의 본질 (exportHwpx / exportHwpVerify 노출) 미반영

→ **옵션 C 통합 필수**.

### 3.3 옵션 C 통합 결과

```ts
case 'exportHwp':
  await initPromise;
  reply(Array.from(wasm.exportHwp()));
  break;
case 'exportHwpx':
  await initPromise;                     // ← PR #581 패턴 정합 추가
  reply(Array.from(wasm.exportHwpx()));
  break;
case 'exportHwpVerify':
  await initPromise;                     // ← PR #581 패턴 정합 추가
  reply(JSON.parse(wasm.exportHwpVerify()));
  break;
default:                                 // ← 'ready' 중복 제거 (HEAD 의 'ready' 가 위에 정합)
```

## 4. 결정적 검증 (모두 통과)

| 게이트 | 결과 |
|--------|------|
| `cargo build --lib --release` | ✅ Finished |
| `cargo test --lib --release` | ✅ 1125 passed (회귀 0, 직전 PR #583 와 동일) |
| `cd rhwp-studio && npx tsc --noEmit` | ✅ 0 errors |
| 충돌 정정 정합 | ✅ `await initPromise` 패턴 적용 + 중복 'ready' 제거 |

## 5. 시각 판정 — 불필요

PR #558 은 **API 노출 layer 만** 변경 (WASM 핵심 + 렌더링 무변경). 메모리 `feedback_visual_regression_grows` 의 시각 게이트 적용 영역 아님 — 결정적 검증 (cargo test + tsc) 으로 충분.

## 6. 컨트리뷰터 안내 (close 댓글)

- **첫 PR 환영** + **Stage 0→4 fail-first 방법론 인정**
- **충돌 정정 안내** — `rhwp-studio/src/main.ts` 의 PR #581 `await initPromise` 패턴 정합 결합 (단순 채택 시 race condition 회귀 위험)
- **재 PR 시 base 동기화 권장** — fork 의 devel 을 본 환경 devel 와 동기화 후 분기

## 7. 본 사이클 사후 처리

- [x] Stage 0-4 cherry-pick 5 commit 진행 (Stage 1 충돌 옵션 C 통합)
- [x] 결정적 검증 (cargo test 1125 + tsc 0 errors)
- [ ] local/devel → devel merge + push
- [ ] PR #558 close (cherry-pick 안내 + 환영 댓글)
- [ ] 본 검토 문서 archives 보관
