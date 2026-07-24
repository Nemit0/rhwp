---
PR: #760
제목: feat — page:hide-current 현재 쪽만 머리말/꼬리말 감추기 구현
컨트리뷰터: @oksure (Hyunwoo Park) — 20+ 사이클 핵심 컨트리뷰터 (5/10 사이클 26번째 PR)
처리: 옵션 A — 2 commits cherry-pick + no-ff merge
처리일: 2026-05-10
머지 commit: 60899a3c
---

# PR #760 처리 보고서

## 1. 처리 결과

✅ **머지 완료** — 옵션 A (2 commits cherry-pick + no-ff merge)

| 항목 | 값 |
|------|-----|
| 머지 commit | `60899a3c` (--no-ff merge) |
| Cherry-pick commits | `09dcf029` (feat) + `2b5251c3` (Copilot 리뷰) |
| Issue 연결 | 부재 (메뉴 누락 커맨드 신규 등록, 자기완결) |
| 시각 판정 | ✅ 작업지시자 웹 에디터 인터랙션 검증 통과 |
| 자기 검증 | tsc + cargo test ALL GREEN + sweep 170/170 same + WASM 4.68 MB 재빌드 |

## 2. 정정 본질 — 1 file, +22/-0

`rhwp-studio/src/command/commands/page.ts` 에 `page:hide-current` 커맨드 신규 등록.

`index.html` 쪽 메뉴에 `data-cmd="page:hide-current"` 등록되어 있으나 커맨드 정의 누락이라 클릭해도 미동작이었음. 기존 `page:hide-headerfooter` 와 본질이 다름 (편집 모드에서만 동작) — 본 PR 은 일반 편집 중에도 사용 가능.

### 알고리즘
```typescript
const headerResult = services.wasm.toggleHideHeaderFooter(pageIndex, true);
const footerResult = services.wasm.toggleHideHeaderFooter(pageIndex, false);
if (headerResult.hidden !== footerResult.hidden) {
  services.wasm.toggleHideHeaderFooter(pageIndex, false);  // 동기화
}
services.eventBus.emit('document-changed');
```

## 3. Copilot 리뷰 반영 (commit `2b5251c3`)
머리말/꼬리말 감추기 상태 동기화 — 두 토글 호출 후 양측 상태 다른 경우 footer 다시 토글하여 일관 상태 유지.

## 4. 인프라 재사용

| 인프라 | 활용 |
|--------|------|
| `toggleHideHeaderFooter` WASM API (기존) | 페이지의 hide 토글 |
| `cursor.rect.pageIndex` (기존) | 현재 페이지 인덱스 |
| `services.eventBus.emit('document-changed')` (기존) | 변경 알림 |

→ 신규 인프라 도입 부재.

## 5. 본 환경 검증

| 검증 | 결과 |
|------|------|
| `cherry-pick` (2 commits) | ✅ auto-merge 충돌 0건 |
| `tsc --noEmit` (rhwp-studio) | ✅ 통과 |
| `cargo test --release` | ✅ ALL GREEN |
| 광범위 sweep (7 fixture / 170 페이지) | ✅ **170 same / 0 diff** |
| WASM 빌드 (Docker, 재빌드) | ✅ 4.68 MB |

## 6. 작업지시자 웹 에디터 인터랙션 검증 ✅ 통과
- 머리말/꼬리말 표시된 페이지에서 메뉴 → "쪽 → 현재 쪽만 감추기" → 머리말/꼬리말 모두 숨김
- 다시 호출 → 머리말/꼬리말 모두 표시 (토글)
- 다른 페이지에는 영향 없음 (현재 페이지만)

## 7. 영향 범위

### 7.1 변경 영역
- rhwp-studio editor 페이지 커맨드 (TypeScript 단일 파일)

### 7.2 무변경 영역
- WASM 코어 (Rust) — 변경 부재
- HWP3/HWPX 변환본 시각 정합 (sweep 170/170 same 입증)

## 8. 메모리 룰 적용

| 룰 | 적용 |
|----|------|
| `feedback_contributor_cycle_check` | @oksure **20+ 사이클** (5/10 26번째 PR) |
| `feedback_image_renderer_paths_separate` | TypeScript 단일 영역, Rust 렌더링 경로 무영향 |
| `feedback_process_must_follow` | 인프라 재사용 (toggleHideHeaderFooter + cursor.rect) — 신규 인프라 도입 부재 |
| `feedback_visual_judgment_authority` | 작업지시자 웹 에디터 인터랙션 검증 ✅ 통과 |

## 9. 잔존 후속

- 본 PR 본질 정정의 잔존 결함 부재

---

작성: 2026-05-10
