---
PR: #693
제목: fix — 그리드 모드 click 좌표 단일 컬럼 가정 + getPageAtY X 무시 일괄 정정 (closes #685, #689)
컨트리뷰터: @johndoekim (johndoe, amok0316@gmail.com)
base / head: devel / feature/issue-685-689-grid-mode-click
mergeStateStatus: BEHIND
mergeable: MERGEABLE
CI: ALL SUCCESS
변경 규모: +2548 / -51, 21 files (소스 6 + 문서 14 + e2e 1)
검토일: 2026-05-09
---

# PR #693 검토

## 1. 메타

| 항목 | 값 |
|------|-----|
| PR 번호 | #693 |
| 제목 | fix — 그리드 모드 click 좌표 단일 컬럼 가정 + getPageAtY X 무시 일괄 정정 |
| 컨트리뷰터 | @johndoekim (johndoe) — **두 번째 사이클** (PR #645 후속, PR #558 close 포함 누적 3 PR) |
| base / head | devel / feature/issue-685-689-grid-mode-click |
| mergeStateStatus | BEHIND (devel 뒤처짐) |
| mergeable | MERGEABLE — 충돌 0건 (auto-merge 정합) |
| CI | ALL SUCCESS (Build & Test, CodeQL ×3, Render Diff, Canvas visual diff) |
| 변경 규모 | +2548 / -51, 21 files (소스 6 + 문서 14 + e2e 1) |
| 커밋 수 | 14 (Stage 1×2, Stage 2×2, Stage 3×2, 최종 보고서×2 + Task #595 commits 5 + 머지 1) |
| closes | #685, #689 |

## 2. 정정 본질 (2 영역)

### Issue #685 — `pageLeft` 공식 단일 컬럼 가정 (14곳)

`virtual-scroll.ts` 의 그리드 모드 `pageLefts[i] = marginLeft + col * (pw + gap)` 와 `input-handler-mouse.ts` 14곳의 단일 컬럼 가정 공식 `(scrollContent.clientWidth - pageDisplayWidth) / 2` 부정합 → 그리드 모드 click 좌표 ±수백 px 어긋남.

정량 측정 (e2e, Issue #685 본문):
- zoom=0.5 (col 2): col 0 +285.6px / col 1 −285.6px
- zoom=0.25 (col 5): col 0 +581.3px / col 4 −581.3px (가운데 col 2 만 우연 0px)

### Issue #689 — `getPageAtY` X 좌표 무시

`virtual-scroll.ts:133-140` 의 `getPageAtY(docY)` 가 Y 좌표만 보고 row 의 last page idx 만 반환. 그리드 모드에서 같은 row 의 모든 페이지 동일 `pageOffsets[i] = rowTop` 이라 X 좌표 무시 → non-last col click 시 last col 페이지로 cursor 처리.

→ 두 결함 결합 정정 필요. #685 단독으로는 last col 만 정합.

## 3. PR 의 정정

### 3.1 두 헬퍼 도입 (`virtual-scroll.ts`, +46 LOC)

- `getPageLeftResolved(pageIdx, containerWidth)` — 그리드 `pageLefts[i]` / 단일 컬럼 `(cw-pw)/2` fallback (sentinel −1)
- `getPageAtPoint(docX, docY)` — row(Y) 결정 후 X 가 속하는 페이지 / gap 영역 closest fallback

### 3.2 일괄 치환 (Stage 1+2 결합)

| 파일 | `getPageAtY` → `getPageAtPoint` | `(cw-pw)/2` → `getPageLeftResolved` |
|------|---------------------------------|--------------------------------------|
| input-handler-mouse.ts | 12곳 | 14곳 |
| input-handler.ts | 4곳 | 4곳 |
| input-handler-table.ts | 1곳 | 3곳 |
| input-handler-picture.ts | 1곳 | 1곳 |
| input-handler-connector.ts | 0 | 2곳 |

총 **getPageAtPoint 18곳 + getPageLeftResolved 24곳** 일괄 치환.

### 3.3 e2e 테스트 강화

- 헬퍼 동치성 assert: `|helperResolved − expected| < 0.01px` 모든 페이지
- zoom=0.25 모든 col click 검증
- zoom=1.0 baseline (단일 컬럼 모드 무회귀)
- CORRECT click → `cursor.rectPageIdx === pageIdx` strict assert

### 3.4 부수 변경 — `updateCaretDuringDrag` 함수 삭제 + 호출처 `updateCaret` 변경

`input-handler.ts` 에서 `private updateCaretDuringDrag()` 함수 **삭제** (-22 LOC) + `input-handler-mouse.ts:1107` 의 호출처 → `this.updateCaret()` 변경. PR 본문에 명시되지 않은 변경. 작업지시자 시각 판정에서 영향 부재 확정.

## 4. 충돌 / mergeable

- `mergeStateStatus: BEHIND` (PR base 가 devel 뒤처짐, 그러나 mergeable=MERGEABLE)
- `git merge-tree --write-tree` 실측: **CONFLICT 0건**, auto-merging 3 파일 정합

## 5. CI 영역

| 검사 | 상태 |
|------|------|
| Build & Test (CI) | ✅ SUCCESS |
| CodeQL ×3 / Render Diff / Canvas visual diff | ✅ SUCCESS |
| WASM Build | ⏭️ SKIPPED (rhwp-studio 변경) |

## 6. Issue assignee 부재

| Issue | assignee | 비고 |
|-------|----------|------|
| #685 | **부재** | @johndoekim self-등록 → self-해결 |
| #689 | **부재** | 동일 |

## 7. 처리 옵션

**옵션 A 추천** — 8 commits 단계별 보존 cherry-pick + no-ff merge.

## 8. 검증 게이트 (구현 단계 DoD)

### 자기 검증
- [ ] `cd rhwp-studio && npm run build` 통과
- [ ] `cd rhwp-studio && npx tsc --noEmit` clean
- [ ] e2e `grid-mode-click-coord.test.mjs` 통과
- [ ] `cargo build --release` / `cargo test --release` ALL GREEN

### 작업지시자 시각 판정 게이트
- [ ] 그리드 모드 click 정합 (zoom=0.5/0.25 모든 col)
- [ ] 단일 컬럼 baseline 무회귀 (zoom=1.0)
- [ ] 드래그 selection 점검 (`updateCaretDuringDrag` → `updateCaret` 변경 영향)

## 9. 메모리 룰 적용

| 룰 | 적용 |
|----|------|
| `feedback_contributor_cycle_check` | @johndoekim 두 번째 사이클 PR |
| `feedback_assign_issue_before_work` | self-등록 → self-해결 패턴, 위험 낮음 |
| `feedback_visual_judgment_authority` | e2e + CI 통과 후 시각 판정 게이트 |
| `feedback_image_renderer_paths_separate` | 5 파일 일괄 sweep 정합 |

---

작성: 2026-05-09
