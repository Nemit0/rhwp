---
PR: #756
제목: feat — 보기 메뉴 도구 상자 / 서식 도구 모음 표시 토글 구현
컨트리뷰터: @oksure (Hyunwoo Park) — 20+ 사이클 핵심 컨트리뷰터 (5/10 사이클 22번째 PR)
base / head: devel / contrib/view-toolbar-toggles
mergeStateStatus: BEHIND
mergeable: MERGEABLE
CI: SUCCESS (Build & Test + CodeQL js/ts/py/rust + Canvas visual diff)
변경 규모: +34 / -12, 1 file
검토일: 2026-05-10
---

# PR #756 검토

## 1. 메타

| 항목 | 값 |
|------|-----|
| PR 번호 | #756 |
| 제목 | feat — 보기 메뉴 도구 상자 / 서식 도구 모음 표시 토글 구현 |
| 컨트리뷰터 | @oksure — 20+ 사이클 (5/10 사이클 22번째 PR — PR #755 close 후속) |
| base / head | devel / contrib/view-toolbar-toggles |
| mergeStateStatus | BEHIND, mergeable: MERGEABLE — 충돌 부재 |
| CI | ✅ Build & Test + CodeQL (js/ts/py/rust) + Canvas visual diff 통과 |
| 변경 규모 | +34 / -12, 1 file |
| 커밋 수 | 2 (feat + Copilot 리뷰) |
| Issue 연결 | 부재 (보기 메뉴 stub 활성화 영역 자기완결) |

## 2. 결함 본질

보기 메뉴의 기본 (도구 상자) + 서식 (서식 도구 모음) 영역 영역 stub 영역 영역 비활성:
- `view:toolbox-basic` → `#icon-toolbar` (도구 상자) 영역 영역 표시/숨기기 토글
- `view:toolbox-format` → `#style-bar` (서식 도구 모음) 영역 영역 표시/숨기기 토글

## 3. 채택 접근 — 기존 IIFE 클로저 토글 패턴 정합

기존 `view:para-mark` (`view.ts:96`) / `view:toggle-clip` (`view.ts:128`) 영역 영역 동일 패턴:
- IIFE 내부 closure `visible: boolean | null` 영역 영역 toggle 상태 보존
- 첫 호출 시 DOM 영역 영역 `getComputedStyle().display` 영역 영역 초기 상태 복원 (Copilot 리뷰 영역 영역 추가)
- `el.style.display` 토글 + `[data-cmd]` 영역 영역 active 클래스 토글

## 4. 인프라 재사용

| 인프라 | 활용 |
|--------|------|
| 기존 IIFE 클로저 토글 패턴 (view:para-mark / view:toggle-clip) | 동일 패턴 정합 |
| `[data-cmd]` 메뉴 active 클래스 (기존) | 메뉴 항목 영역 영역 시각 정합 |

→ 신규 인프라 도입 부재 (`feedback_process_must_follow` 정합).

## 5. PR 의 정정 — 1 file, +34/-12

`rhwp-studio/src/command/commands/view.ts` 영역 영역 2 stub → IIFE 클로저 토글 변환:

```typescript
(() => {
  let visible: boolean | null = null;
  return {
    id: 'view:toolbox-basic',
    label: '기본',
    execute() {
      const el = document.getElementById('icon-toolbar');
      if (!el) return;
      if (visible === null) visible = getComputedStyle(el).display !== 'none';
      visible = !visible;
      el.style.display = visible ? '' : 'none';
      document.querySelectorAll('[data-cmd="view:toolbox-basic"]').forEach(btn => {
        btn.classList.toggle('active', visible!);
      });
    },
  } satisfies CommandDef;
})(),
```

## 6. Copilot 리뷰 반영 (commit `f00f5874`)
도구 상자 초기 표시 상태를 DOM 영역 영역 읽기 (`getComputedStyle` 활용) — 첫 호출 시 정확한 toggle 동작.

## 7. 충돌 / mergeable

mergeStateStatus = `BEHIND`, mergeable = `MERGEABLE`. cherry-pick 충돌 0건 예상 (auto-merge 정합).

## 8. 본 환경 점검

### 8.1 변경 격리
- TypeScript 단일 파일 단일 영역 (rhwp-studio editor)
- Rust / WASM / 렌더링 경로 무관 (`feedback_image_renderer_paths_separate` 정합)

### 8.2 CI 결과
- Build & Test ✅
- CodeQL (js/ts/py/rust) ✅
- Canvas visual diff ✅
- WASM Build SKIPPED (변경 무관)

## 9. 처리 옵션

### 옵션 A — 2 commits 개별 cherry-pick + no-ff merge

```bash
git checkout local/devel
git cherry-pick 6862f590 f00f5874
git checkout devel
git merge local/devel --no-ff -m "Merge PR #756: feat 보기 메뉴 도구 상자 / 서식 도구 모음 표시 토글"
```

→ **권장**.

## 10. 검증 게이트

### 10.1 자기 검증
- [ ] cherry-pick 충돌 0건
- [ ] `cargo build --release` 통과 (Rust 변경 부재)
- [ ] `cargo test --release` ALL GREEN
- [ ] `cd rhwp-studio && npx tsc --noEmit` 통과
- [ ] 광범위 sweep — 7 fixture / 170 페이지 회귀 0 (TypeScript 영역 영역 SVG 무영향 자명)

### 10.2 시각 판정 게이트 — **WASM 빌드 + 작업지시자 인터랙션 검증 권장**

본 PR 본질은 **rhwp-studio editor UI 토글**:
- WASM 빌드 후 dev server 영역 영역:
  - 메뉴 → "보기 → 기본" → 도구 상자 (#icon-toolbar) 토글 + 메뉴 active 클래스 정합
  - 메뉴 → "보기 → 서식" → 서식 도구 모음 (#style-bar) 토글 + 메뉴 active 클래스 정합
- 매우 단순 변경 (UI 토글) — 시각 판정 게이트 면제 가능 (작업지시자 결정)

## 11. 메모리 룰 적용

| 룰 | 적용 |
|----|------|
| `feedback_contributor_cycle_check` | @oksure 20+ 사이클 (5/10 사이클 22번째 PR) |
| `feedback_image_renderer_paths_separate` | TypeScript 단일 영역 영역 Rust 렌더링 경로 무영향 |
| `feedback_process_must_follow` | 인프라 재사용 (기존 IIFE 클로저 토글 패턴) — 신규 인프라 도입 부재 |
| `feedback_visual_judgment_authority` | 단순 UI 토글 영역 영역 시각 판정 면제 가능 (작업지시자 결정) |

## 12. 처리 순서 (승인 후)

1. `local/devel` 영역 영역 옵션 A cherry-pick (2 commits)
2. 자기 검증 (cargo test + tsc + 광범위 sweep)
3. (선택) WASM 빌드 + 작업지시자 인터랙션 검증 — 단순 UI 토글 영역 영역 면제 가능
4. 검증 통과 → no-ff merge + push + archives 이동 + 5/10 orders 갱신
5. PR #756 close

---

작성: 2026-05-10
