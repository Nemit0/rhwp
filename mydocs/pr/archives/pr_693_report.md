---
PR: #693
제목: fix — 그리드 모드 click 좌표 단일 컬럼 가정 + getPageAtY X 무시 일괄 정정
컨트리뷰터: @johndoekim (johndoe, amok0316@gmail.com) — 두 번째 사이클
처리: 8 commits 단계별 보존 cherry-pick + no-ff merge (옵션 A)
처리일: 2026-05-09
머지 commit: b784c585
---

# PR #693 처리 보고서

## 1. 처리 결과

✅ **머지 완료** — 옵션 A (8 commits 단계별 보존 cherry-pick + no-ff merge `b784c585`) + 시각 판정 ★ 통과

| 항목 | 값 |
|------|-----|
| 머지 commit | `b784c585` (--no-ff merge) |
| Issue #685 / #689 | close 자동 정합 (closes 매칭) |
| 시각 판정 | ★ 통과 (작업지시자 직접) |
| e2e | **22 PASS / 0 FAIL** (모든 zoom × 모든 col) |

## 2. 정정 본질

### Issue #685 — `pageLeft` 공식 단일 컬럼 가정 (14곳)

`virtual-scroll.ts` 의 그리드 모드 `pageLefts[i] = marginLeft + col * (pw + gap)` 와 `input-handler-mouse.ts` 14곳의 단일 컬럼 가정 공식 `(scrollContent.clientWidth - pageDisplayWidth) / 2` 부정합 → 그리드 모드 click 좌표 ±수백 px 어긋남.

### Issue #689 — `getPageAtY` X 좌표 무시

`virtual-scroll.ts:133` 의 `getPageAtY(docY)` 가 row-shared `pageOffsets[i]` 환경에서 항상 row last page idx 만 반환 → non-last col click 시 last col 페이지로 cursor 처리.

→ 두 결함 결합 정정 필요. #685 단독으로는 last col 만 정합.

## 3. 정정 (PR)

### 3.1 두 헬퍼 도입 (`virtual-scroll.ts`, +46 LOC)

- `getPageLeftResolved(pageIdx, containerWidth)` — 그리드 `pageLefts[i]` / 단일 컬럼 `(cw-pw)/2` fallback (sentinel −1)
- `getPageAtPoint(docX, docY)` — row(Y) 결정 후 X 가 속하는 페이지 / gap 영역 closest fallback

### 3.2 일괄 치환 (Stage 1+2 결합)

| 파일 | `getPageAtY` → `getPageAtPoint` | `(cw-pw)/2` → `getPageLeftResolved` |
|------|---------------------------------|--------------------------------------|
| input-handler-mouse.ts | 12 | 14 |
| input-handler.ts | 4 | 4 |
| input-handler-table.ts | 1 | 3 |
| input-handler-picture.ts | 1 | 1 |
| input-handler-connector.ts | 0 | 2 |

총 **getPageAtPoint 18곳 + getPageLeftResolved 24곳** 일괄 치환.

### 3.3 부수 변경 — `updateCaretDuringDrag` 함수 삭제 + 호출처 `updateCaret` 변경

`input-handler.ts` 의 `private updateCaretDuringDrag()` 함수 삭제 (-22 LOC) + `input-handler-mouse.ts:1107` 호출처 `updateCaret()` 변경. PR 본문에 명시되지 않은 변경이지만 작업지시자 시각 판정 ★ 통과로 영향 부재 확정.

### 3.4 e2e 테스트 강화

- 헬퍼 동치성 assert (max delta < 0.01px)
- zoom=0.25 모든 col click 검증
- zoom=1.0 baseline (단일 컬럼 무회귀)
- CORRECT click → `cursor.rectPageIdx === pageIdx` strict assert

## 4. 본 환경 cherry-pick + 충돌 해결

### 4.1 cherry-pick 8 commits

```
1230d1d9 Task #685 Stage 1: getPageLeftResolved 헬퍼 추가 + formBboxToOverlayRect 단순화
37eca310 Task #685 Stage 2: input-handler-mouse 14곳 헬퍼 치환
a724841e Task #685 Stage 3: e2e assert 강화 + 후속 결함 #689 분리
2f8eac6f Task #685: 최종 결과보고서 + 5/8 orders
90847860 Task #689 Stage 1: getPageAtPoint 헬퍼 도입
aafd49d9 Task #689 Stage 2: getPageAtY 18곳 + buggy pageLeft 10곳 동반 정정
cbdfee32 Task #689 Stage 3: e2e strict assert 활성화
688b06cd Task #689: 최종 결과보고서 + orders 갱신 (closes #689)
```

머지 commit (`9aa0fc57`) 은 cherry-pick 대상 아님 (devel into PR 머지).

### 4.2 충돌 해결

`mydocs/orders/20260508.md` add/add 충돌 1건 — 본 환경 5/8 orders (PR #694 처리 + 누적 사이클) 보존하면서 컨트리뷰터 Task #685/#689 본문은 별도 섹션으로 추가.

소스 영역 충돌 0건 (auto-merge 정합).

### 4.3 결정적 검증

| 검증 | 결과 |
|------|------|
| `cargo build --release` | ✅ 통과 (27.07s) |
| `cargo test --release` | ✅ lib **1166** + 통합 ALL GREEN, failed 0 |
| `cargo clippy --release --all-targets` | ✅ 본 변경 신규 경고 0 |
| `npx tsc --noEmit` (rhwp-studio) | ✅ clean |
| `npm run build` (rhwp-studio) | ✅ PWA 빌드 정상 (498ms) |
| **e2e grid-mode-click-coord** | ✅ **22 PASS / 0 FAIL** |

### 4.4 e2e 정량 측정 결과 (PR 본문 정합)

| zoom | columns | delta_px (col별) |
|------|---------|------------------|
| 0.5 | 2 | col 0 +285.6 / col 1 −285.6 |
| 0.25 | 5 | col 0 +581.3 / col 4 −581.3 (col 2 우연 0) |
| 1.0 | 1 (baseline) | 모든 페이지 0 (단일 컬럼 무회귀) |

CORRECT click (헬퍼 사용) → 모든 col 의 cursor.rectPageIdx 정합. PR 정정 효과 정량 입증.

### 4.5 WASM 빌드

산출물: `pkg/rhwp_bg.wasm` 4,594,114 bytes.

### 4.6 머지 commit

`b784c585` — `git merge --no-ff local/task693` 로 단일 머지 commit 묶기. 8 commits 단계별 보존 + PR 단위 추적성 정합.

### 4.7 작업지시자 시각 판정 ★ 통과

작업지시자 시각 판정 — "시각 판정 통과입니다" (2026-05-09).

## 5. 메모리 룰 적용

| 룰 | 적용 |
|----|------|
| `feedback_contributor_cycle_check` | @johndoekim 두 번째 사이클 PR (PR #645 → PR #693) — "두 번째" 정확 표현 |
| `feedback_assign_issue_before_work` | #685/#689 self-등록 → self-해결 패턴, 위험 낮음. close 자동 정합 |
| `feedback_visual_judgment_authority` | 결정적 검증 (e2e 22/0 + CI ALL SUCCESS + Rust ALL GREEN) 통과 후 작업지시자 시각 판정 ★ 통과 |
| `feedback_v076_regression_origin` | 컨트리뷰터 환경 (macOS + Chrome) + 작업지시자 환경 (Linux + WSL2 + 호스트 Chrome CDP) 두 영역 모두 시각 판정 통과 |
| `feedback_image_renderer_paths_separate` | 5 파일 일괄 sweep 정합 |
| `feedback_pr_supersede_chain` | PR #645 (Task #595) → PR #693 (Task #685+#689 후속 sweep) 신규 사례 — 동일 컨트리뷰터의 후속 사이클 본질 분리 패턴 |

## 6. 잔존 후속

- 잔존 결함 부재. PR #693 본질 정정으로 #685 + #689 두 결함 결합 정정 완료.
- `updateCaretDuringDrag` 함수 삭제 영역 — 시각 판정에서 영향 부재 확정. 향후 드래그 selection 회귀 발견 시 재점검 가능.

---

작성: 2026-05-09
