---
PR: #781
제목: Task #779 — rhwp-studio scrollbar release back-scroll 정정 (closes #779)
컨트리뷰터: @jangster77 (Taesup Jang) — HWP3 핵심 컨트리뷰터 (16+ 사이클)
처리: 옵션 A — 3 commits cherry-pick + no-ff merge
처리일: 2026-05-10
머지 commit: 6c125000
---

# PR #781 처리 보고서

## 1. 처리 결과

✅ **머지 완료** — 옵션 A (3 commits cherry-pick + no-ff merge)

| 항목 | 값 |
|------|-----|
| 머지 commit | `6c125000` (--no-ff merge) |
| Cherry-pick commits | `a90ce16f` (Stage 1) + `e524a0d8` (Stage 2 GREEN) + `3a6e976a` (Stage 3+4) |
| closes | #779 |
| 시각 판정 | ✅ 작업지시자 웹 에디터 시각 판정 통과 (5 시나리오) |
| 자기 검증 | tsc + cargo test/clippy ALL GREEN + sweep 170/170 same + WASM 4.68 MB |

## 2. 본질

rhwp-studio editor 영역 drag-during-scroll 패턴 결함 — 사용자 텍스트 클릭 (caret p.1) → 마우스 보유 상태 영역 scrollbar drag → release 시 mouseup listener (`{ once: true }`) 가 scrollbar release catch → `updateCaret` → `scrollCaretIntoView` → caret 원본 위치 자동 scroll back.

### 2.1 Stage 1 진단 — 가설 A/B/C
- 가설 A (단순 scrollbar) → mouseup chain 발동 부재 영역 영역 무관
- **가설 B (drag-during-scroll) 확정** — 사용자 클릭-앤드-드래그 패턴
- 가설 C (다른 trigger) → 부재

## 3. 정정 본질 — 2 files, +18/-4

### 3.1 `rhwp-studio/src/engine/input-handler.ts` (+11/-3)
```typescript
private updateCaret(skipScroll: boolean = false): void {
    const rect = this.cursor.getRect();
    if (rect) {
      ...
      if (!skipScroll) {
        this.scrollCaretIntoView(rect);
      }
    }
}
```

### 3.2 `rhwp-studio/src/engine/input-handler-mouse.ts` (+7/-1)
```typescript
// onMouseUp 끝
this.updateCaret(true);  // [Task #779] mouseup 영역 의 scroll back 차단
```

## 4. 영역 좁힘 (회귀 부재 가드)

| 호출 영역 | skipScroll | 동작 |
|----------|-----------|------|
| `onMouseUp` (드래그 selection 종료) | **true** | scroll skip → 본 결함 차단 |
| 키보드 (input-handler-keyboard.ts 20+ 곳) | false (기본) | 기존 동작 보존 |
| programmatic cursor move (moveCursorTo 등) | false (기본) | 기존 동작 보존 |
| `onMouseDown` cursor placement (8+ 곳) | false (기본) | 기존 동작 보존 |
| 드래그 selection autoscroll (PR #718) | (별도 path) | 보존 |

→ 30+ 기존 호출 영역 무영향. **opt-in skip** 영역 좁힘 (`feedback_hancom_compat_specific_over_general` 정합).

## 5. 거버넌스 (+617)

- `mydocs/orders/20260510.md` (+6) — Task #779 행 추가 (auto-merge 정합)
- `mydocs/plans/task_m100_779.md` (+149, 수행 계획)
- `mydocs/plans/task_m100_779_impl.md` (+141, 구현 계획)
- `mydocs/working/task_m100_779_stage{1..3}.md` (+98+93+38)
- `mydocs/report/task_m100_779_report.md` (+98, 최종 결과 보고서)

## 6. 본 환경 검증

| 검증 | 결과 |
|------|------|
| `cherry-pick` (3 commits) | ✅ auto-merge 충돌 0건 (orders 자동 정합) |
| `tsc --noEmit` | ✅ 통과 |
| `cargo test --release` | ✅ ALL GREEN |
| `cargo clippy --release -- -D warnings` | ✅ 통과 |
| 광범위 sweep | ✅ **170 same / 0 diff** |
| WASM 빌드 | ✅ 4.68 MB |

## 7. 작업지시자 웹 에디터 시각 판정 ✅ 통과 (5 시나리오)

1. 본 결함 해소 — scrollbar drag → release → 위치 보존
2. cursor click 정상 — 회귀 부재
3. 키보드 navigation 정상 — 회귀 부재
4. 드래그 selection autoscroll (PR #718) 정상 — 회귀 부재
5. Wheel scroll 정상 — 회귀 부재

## 8. 영향 범위

### 8.1 변경 영역
- rhwp-studio editor 영역 cursor refresh 경로 (TypeScript 2 files)

### 8.2 무변경 영역
- WASM 코어 (Rust) — 변경 부재
- HWP3/HWPX 변환본 시각 정합 (sweep 170/170 same 입증)
- 30+ 기존 `updateCaret` 호출 (키보드/programmatic/onMouseDown/PR #718 autoscroll)

## 9. 메모리 룰 적용

| 룰 | 적용 |
|----|------|
| `feedback_contributor_cycle_check` | @jangster77 16+ 사이클 (HWP3 + rhwp-studio editor 영역) |
| `feedback_image_renderer_paths_separate` | TypeScript 단일 영역 영역 Rust 렌더링 경로 무영향 |
| `feedback_pr_supersede_chain` | PR #718 (Task #661) → Task #779 동일 컴포넌트 영역 후속 — 동일 patten (`scrollCaretIntoView`) 다른 trigger (drag-during-scroll) |
| `feedback_hancom_compat_specific_over_general` | **opt-in skip** 영역 좁힘 — 30+ 기존 호출 무영향 |
| `feedback_diagnosis_layer_attribution` | 가설 A/B/C 도출 → 가설 B (drag-during-scroll) 확정 — 정확한 본질 진단 |
| `feedback_process_must_follow` | 단계별 분리 (Stage 1 진단 + Stage 2 GREEN + Stage 3+4 검증/보고서) + 거버넌스 문서 |
| `feedback_visual_judgment_authority` | **권위 사례** — 작업지시자 dev 서버 직접 시각 판정 (5 시나리오 confirm) |

## 10. 잔존 후속 (PR 본문 명시)

- e2e 회귀 가드 (`scroll-page-preserve.test.mjs`) — PR #718 의 `drag-selection-autoscroll.test.mjs` 패턴 정합 — 별도 task

---

작성: 2026-05-10
