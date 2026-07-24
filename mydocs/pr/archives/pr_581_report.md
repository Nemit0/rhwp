# PR #581 처리 보고서

**PR**: [#581 fix: iframe postMessage race condition — wasm 초기화 대기 (#522)](https://github.com/edwardkim/rhwp/pull/581)
**작성자**: @oksure (Hyunwoo Park) — 신규 컨트리뷰터
**처리 결정**: ✅ **cherry-pick 머지** (작은 변경 + 명확한 본질)
**처리일**: 2026-05-04

## 1. 처리 결과 요약

| 항목 | 결과 |
|------|------|
| 결정 | cherry-pick 머지 (충돌 0, 단일 파일) |
| 변경 | `rhwp-studio/src/main.ts` +11 / -4 (단일 파일) |
| Linked Issue | **#522** (closes) |
| author 보존 | ✅ @oksure |
| 충돌 | 0 |
| 결정적 검증 | tsc --noEmit 0 errors |
| 시각 판정 | 해당 없음 (race condition 영역, 시각 영향 없음) |
| WASM 영향 | 없음 (rhwp-studio TS 만 변경) |

## 2. cherry-pick 결과

| 신 commit | 원본 PR commit | 설명 |
|----------|--------------|------|
| `de5be58` | `9ecc975` | fix: iframe postMessage race condition — wasm 초기화 대기 (#522) |

author 보존: @oksure (Hyunwoo Park).

## 3. 본 PR 의 본질

### 3.1 결함

`@rhwp/editor` wrapper 의 `_waitReady()` → `loadFile` 호출 시:
1. `__wbindgen_malloc undefined` 즉시 실패
2. `Request timeout: loadFile` (10초 후)

원인: `rhwp-studio/src/main.ts` 의 message handler 가 `initialize()` 완료 여부와 무관하게 즉시 등록되고, `'ready'` 메서드가 wasm 상태 확인 없이 `reply(true)` 반환.

### 3.2 정정

`initialize()` 반환 Promise 를 `initPromise` 로 캡처 + 모든 RPC 메서드에서 `await initPromise` 후 응답:

- `ready`: 초기화 완료 후에만 `true` 응답
- `loadFile`, `pageCount`, `getPageSvg`, `exportHwp`: 초기화 대기 후 실행
- 레거시 `hwpctl-load`: 동일 가드 추가

```typescript
- initialize();
+ const initPromise = initialize();

// 각 case 에 추가:
+ await initPromise;
```

### 3.3 PR 본문 검증

PR 본문 보고:
- ✅ `npx tsc --noEmit` — 기존 `@types/chrome` 누락 1건 외 에러 없음 (기존)
- ✅ `cargo test` + `cargo clippy -- -D warnings` 통과

본 환경 검증:
- ✅ `npx tsc --noEmit` (rhwp-studio): 0 errors
- ✅ cherry-pick 충돌 0

## 4. 컨트리뷰터 정합

@oksure (Hyunwoo Park) — **신규 컨트리뷰터** 의 첫 PR. 본 사이클의 정합한 영역:
- ✅ **단일 파일 + 작은 변경** (+11 / -4) — 명확한 본질 + 빠른 검토 가능
- ✅ **PR 본문 정합** — 결함 분석 + 원인 코드 영역 + 정정 절차 명시
- ✅ **closes #522** 명시 — 이슈 자동 close 트리거
- ✅ **별도 fork branch** (`contrib/fix-iframe-race-condition`) — 본 사이클 패턴 정합

## 5. 머지 절차

### 5.1 cherry-pick + 검증 (완료)

```bash
git cherry-pick 9ecc975  # 충돌 0
cd rhwp-studio && npx tsc --noEmit  # 0 errors
```

### 5.2 commit + devel 머지 + push

```bash
git add mydocs/pr/pr_581_report.md
git commit -m "PR #581 처리 보고서 (cherry-pick @oksure 1 commit — iframe race condition)"

git checkout devel
git merge local/devel --no-ff -m "..."
git push origin devel
```

### 5.3 PR / 이슈 close

```bash
gh pr close 581 --repo edwardkim/rhwp --comment "..."
# 이슈 #522 close (closes #522 명시 + 정정 적용)
```

## 6. 메모리 정합

- ✅ `feedback_check_open_prs_first` — 본 PR 처리 정합
- ✅ `feedback_pr_comment_tone` — close 댓글 차분/사실 중심 + 신규 컨트리뷰터 환영
- ✅ `feedback_release_sync_check` — main 동기화 정합
- ✅ `feedback_no_pr_accumulation` — PR 본문 명시 본질만, 별도 fork branch
- ✅ `feedback_per_task_pr_branch` — 별도 fork branch (`contrib/fix-iframe-race-condition`)
- ✅ `feedback_rule_not_heuristic` — `await initPromise` 단일 패턴 (분기 없음)
