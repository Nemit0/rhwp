---
PR: #781
제목: Task #779 — rhwp-studio 스크롤바 드래그 후 마우스 release 시 이전 페이지 자동 복귀 정정 (closes #779)
컨트리뷰터: @jangster77 (Taesup Jang) — HWP3 핵심 컨트리뷰터 (16+ 사이클)
base / head: devel / local/task779
mergeStateStatus: BEHIND
mergeable: MERGEABLE
CI: SUCCESS (Build & Test + CodeQL js/ts/py/rust + Canvas visual diff)
변경 규모: +641 / -4, 9 files
검토일: 2026-05-10
---

# PR #781 검토

## 1. 메타

| 항목 | 값 |
|------|-----|
| PR 번호 | #781 |
| 제목 | Task #779 — scrollbar release back-scroll 정정 |
| 컨트리뷰터 | @jangster77 — 16+ 사이클 (HWP3 + rhwp-studio editor 영역) |
| base / head | devel / local/task779 |
| mergeStateStatus | BEHIND, mergeable: MERGEABLE — 충돌 부재 |
| CI | ✅ Build & Test + CodeQL (js/ts/py/rust) + Canvas visual diff 통과 |
| 변경 규모 | +641 / -4, 9 files |
| **본질 정정** | **+18/-4, 2 files (input-handler.ts + input-handler-mouse.ts)** |
| 거버넌스 | +617 (orders +6 + 계획서 + 단계별 보고서 + 최종 보고서) |
| 커밋 수 | 3 (Stage 1 진단 + Stage 2 GREEN + Stage 3+4 검증/보고서) |
| closes | #779 |

## 2. 본질

rhwp-studio 영역 스크롤바 드래그 후 마우스 release 시 이전 페이지 (caret 원본 위치) 영역 자동 복귀 결함.

### 2.1 재현 시나리오
1. 다중 페이지 문서 로드 (예: hwp3-sample10.hwp 763 페이지)
2. 텍스트 클릭 (caret p.1) → `isDragging=true` + mouseup listener 등록
3. **즉시 mouseup 안 함** — 사용자 가 마우스 버튼 보유 상태로 scrollbar 까지 drag
4. scrollbar 위에서 mouseup → `onMouseUp` 발동 → updateCaret → scrollCaretIntoView → caret p.1 위치로 scroll back ⚠️

### 2.2 Stage 1 본질 진단 (PR 본문)
가설 A (단순 scrollbar) / B (drag-during-scroll) / C (다른 trigger) 도출 → 가설 B (drag-during-scroll 패턴) 확정.

trigger chain: 사용자 클릭-앤드-드래그 → mouseup listener `{ once: true }` 가 scrollbar release 도 catch (브라우저 scrollbar 영역 mouseup document 까지 bubble).

## 3. 채택 접근 — `updateCaret(skipScroll: boolean = false)` opt-in skip

### 3.1 정정 (input-handler.ts +11/-3)
```typescript
private updateCaret(skipScroll: boolean = false): void {
    const rect = this.cursor.getRect();
    if (rect) {
      ...
      if (!skipScroll) {
        this.scrollCaretIntoView(rect);
      }
    }
    ...
}
```

### 3.2 정정 (input-handler-mouse.ts +7/-1)
```typescript
// onMouseUp 끝
this.updateCaret(true);  // [Task #779] mouseup 영역 의 scroll back 차단
```

## 4. 영역 좁힘 (회귀 부재 가드)

| 호출 영역 | skipScroll | 동작 |
|----------|-----------|------|
| `onMouseUp` (드래그 selection 종료) | **true** | scroll skip → 본 결함 차단 |
| 키보드 입력 (input-handler-keyboard.ts 20+ 곳) | false (기본) | 기존 동작 보존 |
| programmatic cursor move (moveCursorTo 등) | false (기본) | 기존 동작 보존 |
| `onMouseDown` cursor placement (8+ 곳) | false (기본) | 기존 동작 보존 |
| 드래그 selection autoscroll (PR #718) | (별도 path) | 보존 |

→ 30+ 기존 호출 영역 무영향. **opt-in skip** 영역 좁힘 (`feedback_hancom_compat_specific_over_general` 정합).

## 5. PR 의 정정 — 9 files, +641/-4

### 5.1 본질 정정 (+18/-4, 2 files)
- `rhwp-studio/src/engine/input-handler.ts` (+11/-3) — `updateCaret(skipScroll)` 시그니처 확장
- `rhwp-studio/src/engine/input-handler-mouse.ts` (+7/-1) — `onMouseUp` 영역 `updateCaret(true)` 변경

### 5.2 거버넌스 문서 (+617, 7 files)
- `mydocs/orders/20260510.md` (+6) — Task #779 행 추가 ⚠️ **본 환경 갱신 영역 영역 충돌 가능**
- `mydocs/plans/task_m100_779.md` (+149, 수행 계획)
- `mydocs/plans/task_m100_779_impl.md` (+141, 구현 계획)
- `mydocs/working/task_m100_779_stage{1..3}.md` (+98+93+38)
- `mydocs/report/task_m100_779_report.md` (+98, 최종 결과 보고서)

### 5.3 ⚠️ orders 영역 영역 충돌 가능

PR #781 영역 영역 `mydocs/orders/20260510.md` +6 영역 영역 컨트리뷰터 (jangster77) 가 자기 PR 영역 영역 행 추가. 본 환경 영역 영역 5/10 사이클 영역 영역 27 PR 누적 갱신 영역 영역 다른 영역 영역 충돌 가능.

해결 방식:
- 옵션 A1: 본질 정정 (input-handler.ts + input-handler-mouse.ts) + 거버넌스 (계획서/보고서) 만 cherry-pick
- 옵션 A2: orders 갱신 영역 영역 본 환경 영역 영역 별도 갱신 (메인테이너 영역 영역 PR #781 행 추가)

## 6. 검증 (PR 본문 명시)

### 6.1 결정적 검증
- `tsc --noEmit` clean
- `npm run build` 성공 (4.6 MB WASM, 707 KB index.js)
- `cargo test --lib --release`: 1217 passed
- `cargo clippy --release --lib`: 신규 경고 0

### 6.2 작업지시자 시각 판정 ★ 통과 (5 시나리오)
1. **본 결함 해소** ✅ (scrollbar drag → release → 위치 보존)
2. **cursor click 정상** ✅ (회귀 부재)
3. **키보드 navigation 정상** ✅ (회귀 부재)
4. **드래그 selection autoscroll (PR #718) 정상** ✅ (회귀 부재)
5. **Wheel scroll 정상** ✅ (회귀 부재)

→ 작업지시자 dev 서버 직접 시각 판정 — 결함 해소 + 회귀 부재 양측 confirm.

## 7. 충돌 / mergeable

mergeStateStatus = `BEHIND`, mergeable = `MERGEABLE`. PR base 영역 영역 devel HEAD 영역 영역 PR #753 (5/10 머지) 후속 영역 영역 누적 갱신 영역 영역 cherry-pick 충돌 가능 점검 필요:

- 본질 정정 영역 영역 input-handler.ts / input-handler-mouse.ts → devel 5/10 사이클 영역 영역 PR #748/#752 (table.ts 영역) + PR #758 (table.ts 영역) 영역 영역 다른 파일 영역 영역 충돌 부재 예상
- **orders 영역 영역 충돌 발생 가능** — Task #779 행 추가 영역 영역 본 환경 영역 영역 27 PR 누적 갱신 영역 영역 위치 영역 영역 충돌

## 8. 본 환경 점검

### 8.1 변경 격리
- TypeScript 단일 영역 (rhwp-studio editor)
- Rust / WASM / 렌더링 경로 무관 (`feedback_image_renderer_paths_separate` 정합)

### 8.2 CI 결과
- 모두 ✅

## 9. 처리 옵션

### 옵션 A — 3 commits cherry-pick + orders 충돌 수동 해결

```bash
git checkout local/devel
git cherry-pick cead11f4 2e6a8326 6718333b
# orders 영역 영역 충돌 발생 시 수동 해결 (HEAD 27 PR 누적 + incoming Task #779 행 추가)
git checkout devel
git merge local/devel --no-ff
```

→ **권장**.

### 옵션 B — 본질 정정 commit 만 cherry-pick + 거버넌스 별도 처리
- Stage 2 GREEN (`2e6a8326`) 만 cherry-pick — 본질 정정 (+18/-4)
- Stage 1/3+4 (계획서/보고서/orders) 별도 처리

→ 거버넌스 손실 영역 — 옵션 A 권장.

## 10. 검증 게이트

### 10.1 자기 검증
- [ ] cherry-pick 충돌 점검 (orders 영역 영역 가능)
- [ ] tsc + cargo test + clippy ALL GREEN
- [ ] 광범위 sweep 170/170 same (TypeScript 만 영역 영역 SVG 무영향 자명)

### 10.2 시각 판정 게이트 — **WASM 빌드 + 작업지시자 시각 판정 권장**

본 PR 본질 영역 영역 rhwp-studio editor 인터랙션 (scrollbar drag/release):
- WASM 빌드 후 dev server 영역 영역:
  - hwp3-sample10.hwp (763 페이지) 등 다중 페이지 문서 로드
  - 텍스트 클릭 → 마우스 보유 상태 영역 scrollbar drag → release → 위치 보존 정합
  - cursor click / 키보드 navigation / 드래그 selection autoscroll / wheel scroll 회귀 부재

PR 본문 영역 영역 작업지시자 시각 판정 ★ 통과 명시 — 본 환경 영역 영역 다시 시각 판정.

## 11. 메모리 룰 적용

| 룰 | 적용 |
|----|------|
| `feedback_contributor_cycle_check` | @jangster77 16+ 사이클 |
| `feedback_image_renderer_paths_separate` | TypeScript 단일 영역 영역 Rust 렌더링 경로 무영향 |
| `feedback_pr_supersede_chain` | PR #718 (Task #661) → Task #779 동일 컴포넌트 영역 후속 정정 — 동일 patten (`scrollCaretIntoView` 영역) 다른 trigger (drag-during-scroll) |
| `feedback_hancom_compat_specific_over_general` | **opt-in skip** 영역 좁힘 (`updateCaret(skipScroll: false)` 기본) — 30+ 기존 호출 무영향 |
| `feedback_diagnosis_layer_attribution` | 가설 A/B/C 도출 → 가설 B (drag-during-scroll) 확정 — 정확한 본질 진단 |
| `feedback_process_must_follow` | 단계별 분리 (Stage 1 진단 + Stage 2 GREEN + Stage 3+4 검증/보고서) + 거버넌스 문서 |
| `feedback_visual_judgment_authority` | **권위 사례** — 작업지시자 dev 서버 직접 시각 판정 (5 시나리오 confirm) |

## 12. 처리 순서 (승인 후)

1. `local/devel` 영역 cherry-pick 3 commits (`cead11f4` + `2e6a8326` + `6718333b`)
2. orders 영역 영역 충돌 발생 시 수동 해결 (HEAD 27 PR 누적 + incoming Task #779 행 보존 — 양측 보존)
3. 자기 검증 (tsc + cargo test + clippy + 광범위 sweep)
4. WASM 빌드 + 작업지시자 시각 판정 (5 시나리오)
5. 시각 판정 통과 → no-ff merge + push + archives + 5/10 orders + Issue #779 close
6. PR #781 close

## 13. 후속 분리 (PR 본문 명시)
- e2e 회귀 가드 (`scroll-page-preserve.test.mjs`) — PR #718 의 `drag-selection-autoscroll.test.mjs` 패턴 정합 — 별도 task

---

작성: 2026-05-10
