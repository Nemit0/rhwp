---
PR: #755
제목: feat — page:new-page-num (새 번호로 시작) 커맨드 구현
컨트리뷰터: @oksure (Hyunwoo Park) — 20+ 사이클 핵심 컨트리뷰터 (5/10 사이클 22번째 PR)
base / head: devel / contrib/new-page-number
mergeStateStatus: DIRTY
mergeable: CONFLICTING — PR #750 영역 영역 page.ts import 라인 영역 영역 단순 충돌
CI: SUCCESS (Build & Test + CodeQL js/ts/py/rust + Canvas visual diff)
변경 규모: +69 / -1, 2 files
검토일: 2026-05-10
---

# PR #755 검토

## 1. 메타

| 항목 | 값 |
|------|-----|
| PR 번호 | #755 |
| 제목 | feat — page:new-page-num (새 번호로 시작) 커맨드 구현 |
| 컨트리뷰터 | @oksure — 20+ 사이클 (5/10 사이클 22번째 PR) |
| base / head | devel / contrib/new-page-number |
| mergeStateStatus | **DIRTY**, mergeable: CONFLICTING — PR #750 import 라인 영역 영역 단순 충돌 |
| CI | ✅ Build & Test + CodeQL (js/ts/py/rust) + Canvas visual diff 통과 |
| 변경 규모 | +69 / -1, 2 files |
| 커밋 수 | 2 (feat + Copilot 리뷰) |
| Issue 연결 | 부재 (쪽 메뉴 stub 활성화 영역 자기완결, PR #745 NewNumber Page 후속) |

## 2. 결함 본질

쪽 > 새 번호로 시작 (`page:new-page-num`) 커맨드 영역 영역 stub 영역 영역 메뉴 비활성. PR #745 (Task #634 NewNumber Page 한컴 호환) 머지 후속 — `setNumberingRestart` WASM API 영역 영역 dialog UI 미구현.

## 3. 채택 접근 — `SectionSettingsDialog` / `ColumnSettingsDialog` 패턴 정합

PR #750 의 `ColumnSettingsDialog` 패턴 + PR #745 의 `setNumberingRestart` WASM API 결합:
1. `getInputHandler.getPosition` → 현재 sec/para 위치
2. `cursor.rect.pageIndex` → 현재 페이지 (default 시작 번호)
3. `NumberingRestartDialog` 표시 → 시작 번호 입력
4. `setNumberingRestart(sec, para, mode=2, startNum)` → mode=2 = NewStart
5. `eventBus.emit('document-changed')`

## 4. 인프라 재사용

| 인프라 | 활용 |
|--------|------|
| `setNumberingRestart` WASM API (기존, `wasm_api.rs:4672`) | 새 번호 시작 적용 |
| `ModalDialog` 베이스 (기존) | `NumberingRestartDialog` 베이스 클래스 |
| `ColumnSettingsDialog` 패턴 (PR #750) | 동일 호출 패턴 |
| EditorContext (기존) | `hasDocument` 가드 |

→ 신규 인프라 도입 부재 (`feedback_process_must_follow` 정합).

## 5. PR 의 정정 — 2 files, +69/-1

### 5.1 `rhwp-studio/src/ui/numbering-restart-dialog.ts` (+47, 신규 파일)

`NumberingRestartDialog extends ModalDialog`:
- 시작 번호 input (number, min=1, default=현재 페이지)
- `onConfirm` 영역 영역 유효성 검사 (NaN / < 1 영역 영역 빨간 outline + 차단)
- show 시 input.select() 영역 영역 자동 선택

### 5.2 `rhwp-studio/src/command/commands/page.ts` (+22/-1)

```typescript
{
  id: 'page:new-page-num',
  label: '새 번호로 시작',
  canExecute: (ctx) => ctx.hasDocument,
  execute(services) {
    const ih = services.getInputHandler();
    if (!ih) return;
    const pos = ih.getPosition();
    const cursor = (ih as any).cursor;
    const currentPage = (cursor?.rect?.pageIndex ?? 0) + 1;
    const dlg = new NumberingRestartDialog(currentPage, (startNum) => {
      try {
        services.wasm.setNumberingRestart(pos.sectionIndex, pos.paragraphIndex, 2, startNum);
        services.eventBus.emit('document-changed');
      } catch (err) {
        console.warn('[page:new-page-num] 새 번호 설정 실패:', err);
      }
    });
    dlg.show();
  },
},
```

stub 영역 영역 실제 구현으로 대체.

## 6. Copilot 리뷰 반영 (commit `e3091b39`)
- 파라미터명 명확화
- 유효성 검사 (NumberingRestartDialog onConfirm 영역 영역 NaN / < 1 차단)
- 현재 페이지 default 전달 (cursor.rect.pageIndex)

## 7. 충돌 분석

### 7.1 본질
PR #755 base = `30351cdf` (5/9 시점). devel HEAD 영역 영역 PR #750 (다단 설정 대화상자) 영역 영역 page.ts 영역 영역 import 라인 추가 영역 영역 동일 위치 영역 영역 누적 변경 → 충돌 발생.

### 7.2 충돌 영역
**1 영역 — import 라인 (page.ts:4-8)**:
```
<<<<<<< HEAD
import { ColumnSettingsDialog } from '@/ui/column-settings-dialog';  // PR #750
=======
import { NumberingRestartDialog } from '@/ui/numbering-restart-dialog';  // PR #755
>>>>>>> a8f06899
```

→ **양 라인 모두 보존** 영역 영역 의도 영역 영역 호환 (PR #750 + PR #755 모두 import 필요).

### 7.3 해결 방식
- 옵션 A 시도 → 충돌 발생 시 수동 해결 (양 라인 보존)
- 매우 단순한 충돌 — 1 줄 양측 보존 영역 영역 정합

## 8. 본 환경 점검

### 8.1 변경 격리
- TypeScript 단일 영역 (rhwp-studio editor)
- Rust / WASM / 렌더링 경로 무관 (`feedback_image_renderer_paths_separate` 정합)

### 8.2 CI 결과
- Build & Test ✅
- CodeQL (js/ts/py/rust) ✅
- Canvas visual diff ✅
- WASM Build SKIPPED (변경 무관)

### 8.3 의도적 제한
- mode=2 (NewStart) 만 영역 영역 — mode=0 (Continue) / mode=1 (Reset) 영역 영역 후속 분리 가능

## 9. 처리 옵션

### 옵션 A — 2 commits 개별 cherry-pick + 충돌 수동 해결 + no-ff merge

```bash
git checkout local/devel
git cherry-pick a8f06899  # 충돌 발생
# 수동 해결: page.ts import 양 라인 보존
git add rhwp-studio/src/command/commands/page.ts
git cherry-pick --continue
git cherry-pick e3091b39  # auto-merge 정합
git checkout devel
git merge local/devel --no-ff -m "Merge PR #755: feat 새 번호로 시작 커맨드"
```

→ **권장**.

## 10. 검증 게이트

### 10.1 자기 검증
- [ ] cherry-pick 충돌 수동 해결 (page.ts import 라인 양측 보존)
- [ ] `cargo build --release` 통과 (Rust 변경 부재)
- [ ] `cargo test --release` ALL GREEN
- [ ] `cd rhwp-studio && npx tsc --noEmit` 통과
- [ ] 광범위 sweep — 7 fixture / 170 페이지 회귀 0

### 10.2 시각 판정 게이트 — **WASM 빌드 + 작업지시자 인터랙션 검증 권장**

본 PR 본질은 **rhwp-studio editor 새 번호 시작 dialog**:
- WASM 빌드 후 dev server 영역 영역:
  - 메뉴 → "쪽 → 새 번호로 시작" → NumberingRestartDialog 표시
  - 시작 번호 입력 → 페이지 번호 적용
  - 유효성 검사 — NaN / < 1 입력 → 빨간 outline + 차단
  - PR #745 NewNumber Page 영역 영역 정합 점검

## 11. 메모리 룰 적용

| 룰 | 적용 |
|----|------|
| `feedback_contributor_cycle_check` | @oksure 20+ 사이클 (5/10 사이클 22번째 PR) |
| `feedback_image_renderer_paths_separate` | TypeScript 단일 영역 영역 Rust 렌더링 경로 무영향 |
| `feedback_process_must_follow` | 인프라 재사용 (`setNumberingRestart` API + `ModalDialog` + `ColumnSettingsDialog` 패턴) — 신규 인프라 도입 부재 |
| `feedback_visual_judgment_authority` | rhwp-studio editor 인터랙션 영역 영역 작업지시자 인터랙션 검증 권장 |

## 12. 처리 순서 (승인 후)

1. `local/devel` 영역 영역 옵션 A cherry-pick + 충돌 수동 해결 (page.ts import 양측 보존)
2. 자기 검증 (cargo test + tsc + 광범위 sweep)
3. WASM 빌드 + 작업지시자 인터랙션 검증 (메뉴 → "쪽 → 새 번호로 시작" + dialog + 페이지 번호 적용)
4. 인터랙션 검증 통과 → no-ff merge + push + archives 이동 + 5/10 orders 갱신
5. PR #755 close

---

작성: 2026-05-10
