---
PR: #787
제목: fix — 도구 모음 클릭 시 마우스 드래그 선택 보존 (closes #780)
컨트리뷰터: @oksure (Hyunwoo Park) — 20+ 사이클 핵심 컨트리뷰터 (5/11 사이클 2번째 PR)
base / head: devel / contrib/toolbar-selection-preserve
mergeStateStatus: BEHIND
mergeable: MERGEABLE
CI: SUCCESS
변경 규모: +11 / -0, 1 file
검토일: 2026-05-11
---

# PR #787 검토

## 1. 메타

| 항목 | 값 |
|------|-----|
| PR 번호 | #787 |
| 제목 | fix — 도구 모음 클릭 시 마우스 드래그 선택 보존 |
| 컨트리뷰터 | @oksure — 20+ 사이클 (5/11 사이클 2번째 PR — PR #786 후속) |
| base / head | devel / contrib/toolbar-selection-preserve |
| mergeStateStatus | BEHIND, mergeable: MERGEABLE — 충돌 부재 |
| CI | ✅ Build & Test + CodeQL + Canvas visual diff 통과 |
| 변경 규모 | +11 / -0, 1 file (`main.ts`) |
| 커밋 수 | 1 |
| closes | #780 |

## 2. 본질 (Issue #780)

마우스 드래그로 텍스트 블럭 선택 후 서식 도구 모음 (#style-bar) / 도구 상자 (#icon-toolbar) 버튼 클릭 시 폰트 크기 변경 등 서식 적용 미동작.

### 2.1 원인
- 개별 버튼 영역 영역 `mousedown` → `preventDefault()` 처리됨 (기존 패턴)
- 그러나 **버튼 간 빈 영역 / 라벨 클릭 시** 브라우저 기본 동작 (focus 이동) → hidden textarea blur → `cursor.hasSelection()` false → `format-char` / `adjustFontSize` 조기 종료

### 2.2 정정
`#icon-toolbar`, `#style-bar` 컨테이너 영역 영역 mousedown `preventDefault` 추가 — `<input>`, `<select>` 요소만 제외 (글꼴명/크기 입력 필드 영역 영역 사용자 포커스 필요).

## 3. 채택 접근

main.ts 영역 영역 컨테이너 레벨 영역 mousedown listener 등록:

```typescript
for (const id of ['icon-toolbar', 'style-bar']) {
  const el = document.getElementById(id);
  if (el) el.addEventListener('mousedown', (e) => {
    if ((e.target as HTMLElement).tagName !== 'INPUT'
     && (e.target as HTMLElement).tagName !== 'SELECT') {
      e.preventDefault();
    }
  });
}
```

## 4. 인프라 재사용

| 인프라 | 활용 |
|--------|------|
| `#icon-toolbar` / `#style-bar` 컨테이너 (기존) | mousedown listener 등록 |
| 개별 버튼 영역 mousedown preventDefault (기존 패턴) | 정합 |

→ 신규 인프라 도입 부재 — 컨테이너 레벨 영역 영역 보강만.

## 5. PR 의 정정 — 1 file, +11/-0

`rhwp-studio/src/main.ts` 영역 영역 `initialize()` 안 컨테이너 mousedown listener 추가.

## 6. 영역 좁힘 (회귀 부재 가드)

- `<input>` / `<select>` 영역 영역 제외 — 글꼴명/크기 입력 필드 영역 영역 사용자 포커스 필요 (기존 동작 보존)
- 키보드 선택 (Shift+Arrow) 경로 영역 영역 변경 부재 (기존 동작 보존)

## 7. 충돌 / mergeable

mergeStateStatus = `BEHIND`, mergeable = `MERGEABLE`. main.ts 영역 영역 5/10 사이클 영역 영역 PR #749 (Ctrl/Cmd+O 단축키) 누적 — 본 PR 영역 영역 다른 영역 (`initialize()` 안 컨테이너 listener) 영역 영역 충돌 부재 예상.

## 8. 본 환경 점검

### 8.1 변경 격리
- TypeScript 단일 파일 (`main.ts` `initialize()` 안)
- Rust / WASM / 렌더링 경로 무관

### 8.2 CI 결과
- 모두 ✅

## 9. 처리 옵션

### 옵션 A — 1 commit cherry-pick + no-ff merge

```bash
git checkout local/devel
git cherry-pick 5cdafe48  # auto-merge 정합 예상
git checkout devel
git merge local/devel --no-ff
```

→ **권장**.

## 10. 검증 게이트

### 10.1 자기 검증
- [ ] cherry-pick 충돌 0건
- [ ] tsc + cargo test ALL GREEN
- [ ] 광범위 sweep — 7 fixture / 170 페이지 회귀 0 (TypeScript 영역 영역 SVG 무영향 자명)

### 10.2 시각 판정 게이트 — **WASM 빌드 + 작업지시자 인터랙션 검증 권장**

본 PR 본질 영역 영역 rhwp-studio editor 도구 모음 인터랙션:
- WASM 빌드 후 dev server 영역 영역:
  - **마우스 드래그** 영역 영역 텍스트 블럭 선택 → 도구 모음 영역 영역 폰트 크기 증가 마커 클릭 → 폰트 크기 증가 정합 동작 (Issue #780 정정)
  - 글꼴명 / 크기 input 영역 영역 사용자 포커스 정상 (제외 영역 영역 보존)
  - 키보드 선택 (Shift+Arrow) 경로 영역 영역 회귀 부재

## 11. 메모리 룰 적용

| 룰 | 적용 |
|----|------|
| `feedback_contributor_cycle_check` | @oksure 20+ 사이클 (5/11 사이클 2번째 PR) |
| `feedback_image_renderer_paths_separate` | TypeScript 단일 영역 영역 Rust 렌더링 경로 무영향 |
| `feedback_process_must_follow` | 인프라 재사용 (컨테이너 mousedown listener) — 신규 인프라 도입 부재 |
| `feedback_visual_judgment_authority` | rhwp-studio editor 인터랙션 영역 영역 작업지시자 인터랙션 검증 권장 |

## 12. 처리 순서 (승인 후)

1. `local/devel` 영역 cherry-pick `5cdafe48`
2. 자기 검증 (tsc + cargo test + 광범위 sweep)
3. WASM 빌드 + 작업지시자 인터랙션 검증 (마우스 드래그 선택 + 도구 모음 클릭 + input/select 보존 + 키보드 선택 회귀 부재)
4. 인터랙션 검증 통과 → no-ff merge + push + archives + 5/11 orders + Issue #780 close
5. PR #787 close

---

작성: 2026-05-11
