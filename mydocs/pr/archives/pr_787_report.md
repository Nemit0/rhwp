---
PR: #787
제목: fix — 도구 모음 클릭 시 마우스 드래그 선택 보존 (closes #780)
컨트리뷰터: @oksure (Hyunwoo Park) — 20+ 사이클 핵심 컨트리뷰터 (5/11 사이클 2번째 PR)
처리: 옵션 A — 1 commit cherry-pick + no-ff merge
처리일: 2026-05-11
머지 commit: 51712958
---

# PR #787 처리 보고서

## 1. 처리 결과

✅ **머지 완료** — 옵션 A (1 commit cherry-pick + no-ff merge)

| 항목 | 값 |
|------|-----|
| 머지 commit | `51712958` (--no-ff merge) |
| Cherry-pick commit | `644f92e3` |
| closes | #780 |
| 시각 판정 | ✅ 작업지시자 웹 에디터 인터랙션 검증 통과 |
| 자기 검증 | tsc + cargo test ALL GREEN + sweep 170/170 same + WASM 4.68 MB |

## 2. 본질 (Issue #780)

마우스 드래그로 텍스트 블럭 선택 후 서식 도구 모음 / 도구 상자 영역 영역 빈 영역 / 라벨 클릭 시 브라우저 기본 동작 (focus 이동) → hidden textarea blur → `cursor.hasSelection()` false → `format-char` / `adjustFontSize` 조기 종료.

대조 (정상 동작): 키보드 선택 (Shift+Arrow) 후 동일 마커 클릭 시 정상 동작 ✅.

## 3. 정정 본질 — 1 file, +11/-0

`rhwp-studio/src/main.ts` 영역 영역 `initialize()` 안 컨테이너 mousedown listener:

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

## 4. 영역 좁힘 (회귀 부재 가드)

- `<input>` / `<select>` 영역 영역 제외 — 글꼴명 / 크기 입력 필드 사용자 포커스 보존
- 키보드 선택 (Shift+Arrow) 경로 영역 영역 변경 부재

## 5. 인프라 재사용

| 인프라 | 활용 |
|--------|------|
| `#icon-toolbar` / `#style-bar` 컨테이너 (기존) | mousedown listener 등록 |
| 개별 버튼 mousedown preventDefault (기존 패턴) | 정합 |

→ 신규 인프라 도입 부재 — 컨테이너 레벨 보강만.

## 6. 본 환경 검증

| 검증 | 결과 |
|------|------|
| `cherry-pick` (1 commit) | ✅ auto-merge 충돌 0건 |
| `tsc --noEmit` | ✅ 통과 |
| `cargo test --release` | ✅ ALL GREEN |
| 광범위 sweep (7 fixture / 170 페이지) | ✅ **170 same / 0 diff** |
| WASM 빌드 (Docker, 재빌드) | ✅ 4.68 MB |

## 7. 작업지시자 웹 에디터 인터랙션 검증 ✅ 통과
- 마우스 드래그 선택 → 도구 모음 / 서식 도구 모음 폰트 크기 증가 → 정합 동작
- input / select 사용자 포커스 보존
- 키보드 선택 (Shift+Arrow) 경로 회귀 부재

## 8. 영향 범위

### 8.1 변경 영역
- TypeScript 단일 파일 (`main.ts` `initialize()` 안 컨테이너 listener)

### 8.2 무변경 영역
- 개별 버튼 영역 mousedown preventDefault (기존 패턴 유지)
- WASM 코어 (Rust) — 변경 부재
- HWP3/HWPX 변환본 시각 정합 (sweep 170/170 same 입증)

## 9. 메모리 룰 적용

| 룰 | 적용 |
|----|------|
| `feedback_contributor_cycle_check` | @oksure **20+ 사이클** (5/11 사이클 2번째 PR) |
| `feedback_image_renderer_paths_separate` | TypeScript 단일 영역 영역 Rust 렌더링 경로 무영향 |
| `feedback_process_must_follow` | 인프라 재사용 (컨테이너 mousedown listener) — 신규 인프라 도입 부재 |
| `feedback_visual_judgment_authority` | 작업지시자 웹 에디터 인터랙션 검증 ✅ 통과 |

## 10. 잔존 후속

- 본 PR 본질 정정의 잔존 결함 부재
- Issue #780 close 완료

---

작성: 2026-05-11
