---
PR: #760
제목: feat — page:hide-current 현재 쪽만 머리말/꼬리말 감추기 구현
컨트리뷰터: @oksure (Hyunwoo Park) — 20+ 사이클 핵심 컨트리뷰터 (5/10 사이클 26번째 PR)
base / head: devel / contrib/page-hide-current
mergeStateStatus: BEHIND
mergeable: MERGEABLE
CI: SUCCESS
변경 규모: +22 / -0, 1 file
검토일: 2026-05-10
---

# PR #760 검토

## 1. 메타

| 항목 | 값 |
|------|-----|
| PR 번호 | #760 |
| 제목 | feat — page:hide-current 구현 |
| 컨트리뷰터 | @oksure — 20+ 사이클 (5/10 사이클 26번째 PR) |
| base / head | devel / contrib/page-hide-current |
| mergeStateStatus | BEHIND, mergeable: MERGEABLE — 충돌 부재 |
| CI | ✅ Build & Test + CodeQL + Canvas visual diff 통과 |
| 변경 규모 | +22 / -0, 1 file |
| 커밋 수 | 2 (feat + Copilot 리뷰) |
| Issue 연결 | 부재 (메뉴 누락 커맨드 신규 등록, 자기완결) |

## 2. 결함 본질

`index.html` 의 쪽 메뉴에 `data-cmd="page:hide-current"` (현재 쪽만 감추기) 등록되어 있으나 **커맨드 정의 누락** — 클릭해도 미동작.

기존 `page:hide-headerfooter` 와 본질이 다름 (머리말/꼬리말 편집 모드에서만 동작) — 본 PR 은 일반 편집 중에도 사용 가능.

## 3. 채택 접근

`toggleHideHeaderFooter` WASM API 를 두 번 호출 (header + footer) 하여 페이지의 머리말/꼬리말 동시 토글:

```typescript
const headerResult = services.wasm.toggleHideHeaderFooter(pageIndex, true);
const footerResult = services.wasm.toggleHideHeaderFooter(pageIndex, false);
if (headerResult.hidden !== footerResult.hidden) {
  services.wasm.toggleHideHeaderFooter(pageIndex, false);  // 동기화
}
```

## 4. 인프라 재사용

| 인프라 | 활용 |
|--------|------|
| `toggleHideHeaderFooter` WASM API (기존) | 페이지의 hide 토글 |
| `cursor.rect.pageIndex` (기존) | 현재 페이지 인덱스 |
| `services.eventBus.emit('document-changed')` (기존) | 변경 알림 |

→ 신규 인프라 도입 부재.

## 5. PR 의 정정 — 1 file, +22/-0

`rhwp-studio/src/command/commands/page.ts` 에 `page:hide-current` 커맨드 신규 등록:
- 현재 페이지의 머리말 + 꼬리말 동시 토글
- 두 호출 후 상태 차이 발생 시 다시 토글하여 동기화 (Copilot 리뷰 반영)

## 6. Copilot 리뷰 반영 (commit `8af266fd`)
머리말/꼬리말 감추기 상태 동기화 — 두 토글 호출 후 양측 상태가 다른 경우 footer 를 다시 토글하여 일관 상태 유지.

## 7. 충돌 / mergeable

mergeStateStatus = `BEHIND`, mergeable = `MERGEABLE` — 충돌 부재.

본 환경 점검:
- page.ts 에 PR #750 (다단 설정 dialog import) 누적되어 있으나 본 PR 은 import 변경 부재 → 충돌 부재
- `page:hide-current` 는 신규 커맨드를 다른 위치에 추가하므로 정합

## 8. 본 환경 점검

### 8.1 변경 격리
- TypeScript 단일 파일 (rhwp-studio editor)
- Rust / WASM / 렌더링 경로 무관

### 8.2 CI 결과
- 모두 ✅

## 9. 처리 옵션

### 옵션 A — 2 commits 개별 cherry-pick + no-ff merge

```bash
git checkout local/devel
git cherry-pick b59d237e 8af266fd  # auto-merge 정합 예상
git checkout devel
git merge local/devel --no-ff
```

→ **권장**.

## 10. 검증 게이트

### 10.1 자기 검증
- [ ] cherry-pick 충돌 0건
- [ ] tsc + cargo test ALL GREEN
- [ ] 광범위 sweep 170/170 same

### 10.2 시각 판정 게이트 — **WASM 빌드 + 작업지시자 인터랙션 검증 권장**

본 PR 의 본질은 rhwp-studio editor 페이지 머리말/꼬리말 감추기:
- WASM 빌드 후 dev server:
  - 머리말/꼬리말 표시된 페이지에서 메뉴 → "쪽 → 현재 쪽만 감추기" → 머리말/꼬리말 모두 숨김
  - 다시 호출 → 머리말/꼬리말 모두 표시
  - 다른 페이지에는 영향 없음 (현재 페이지만)

## 11. 메모리 룰 적용

| 룰 | 적용 |
|----|------|
| `feedback_contributor_cycle_check` | @oksure 20+ 사이클 (5/10 26번째 PR) |
| `feedback_image_renderer_paths_separate` | TypeScript 단일 영역, Rust 렌더링 경로 무영향 |
| `feedback_process_must_follow` | 인프라 재사용 (toggleHideHeaderFooter + cursor.rect) — 신규 인프라 도입 부재 |
| `feedback_visual_judgment_authority` | rhwp-studio editor 인터랙션이므로 작업지시자 인터랙션 검증 권장 |

## 12. 처리 순서 (승인 후)

1. `local/devel` 에서 옵션 A cherry-pick (auto-merge 정합 예상)
2. 자기 검증 (cargo test + tsc + 광범위 sweep)
3. WASM 빌드 + 작업지시자 인터랙션 검증
4. 인터랙션 검증 통과 → no-ff merge + push + archives 이동 + 5/10 orders 갱신
5. PR #760 close

---

작성: 2026-05-10
