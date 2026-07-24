---
PR: #758
제목: feat — 표 셀 높이 / 너비 균등화 커맨드 구현
컨트리뷰터: @oksure (Hyunwoo Park) — 20+ 사이클 핵심 컨트리뷰터 (5/10 사이클 24번째 PR)
base / head: devel / contrib/table-cell-equalize
mergeStateStatus: UNKNOWN
mergeable: UNKNOWN
CI: SUCCESS (Build & Test + CodeQL js/ts/py/rust + Canvas visual diff)
변경 규모: +82 / -2, 1 file
검토일: 2026-05-10
---

# PR #758 검토

## 1. 메타

| 항목 | 값 |
|------|-----|
| PR 번호 | #758 |
| 제목 | feat — 표 셀 높이 / 너비 균등화 커맨드 구현 |
| 컨트리뷰터 | @oksure — 20+ 사이클 (5/10 사이클 24번째 PR) |
| base / head | devel / contrib/table-cell-equalize |
| mergeStateStatus | UNKNOWN (devel 갱신 대기 영역) |
| CI | ✅ Build & Test + CodeQL (js/ts/py/rust) + Canvas visual diff 통과 |
| 변경 규모 | +82 / -2, 1 file |
| 커밋 수 | 2 (feat + Copilot 리뷰) |
| Issue 연결 | 부재 (표 메뉴 stub 활성화 영역 자기완결) |

## 2. 결함 본질

표 메뉴 영역 영역 2 stub 영역 영역 미동작:
- `table:cell-height-equal` — 셀 높이 균등화 (단축키 H)
- `table:cell-width-equal` — 셀 너비 균등화 (단축키 W)

## 3. 채택 접근

1. `getTableDimensions` → 셀 개수 조회
2. 전체 셀 순회 영역 영역 `getCellInfo` (row/col/rowSpan/colSpan) + `getCellProperties` (height/width)
3. 행/열 별 평균 크기 계산 (병합 셀 영역 영역 rowSpan>1 / colSpan>1 영역 영역 건너뜀)
4. 전체 평균 산출 영역 영역 각 셀 delta 계산
5. `resizeTableCells` (cellIdx + widthDelta/heightDelta updates) 영역 영역 일괄 적용
6. `document-changed` emit

## 4. 인프라 재사용

| 인프라 | 활용 |
|--------|------|
| `getTableDimensions` WASM API (기존) | 셀 개수 조회 |
| `getCellInfo` WASM API (기존) | row/col/rowSpan/colSpan |
| `getCellProperties` WASM API (기존) | height/width |
| `resizeTableCells` WASM API (기존) | delta 일괄 적용 |
| `inTable` 가드 (기존) | `canExecute` 가드 |

→ 신규 인프라 도입 부재 (`feedback_process_must_follow` 정합).

## 5. PR 의 정정 — 1 file, +82/-2

`rhwp-studio/src/command/commands/table.ts` 영역 영역 2 stub → 실제 구현 변환. 양 커맨드 거의 동일 패턴 (height/row 영역 영역 width/col 만 다름).

## 6. Copilot 리뷰 반영 (commit `e88bd050`)
셀 정보 캐싱 영역 영역 이중 순회 제거 — `getCellInfo` + `getCellProperties` 호출 영역 영역 한 번 만 + cells 배열 영역 영역 캐시 + rowHeights/colWidths Map 영역 영역 동시 누적.

## 7. 충돌 / mergeable

mergeStateStatus = `UNKNOWN` (devel 갱신 대기 영역). PR #757 (5/10 머지) 영역 영역 동일 파일 (table.ts) 영역 영역 다른 위치 — block-formulas 영역 영역 +103, 본 PR 영역 영역 cell-height/width-equal 영역 영역 +82. 두 영역 영역 다른 stub 영역 영역 인접 영역 영역 가능성 있음.

cherry-pick 시도 영역 영역 점검 필요.

## 8. 본 환경 점검

### 8.1 변경 격리
- TypeScript 단일 파일 (rhwp-studio editor)
- Rust / WASM / 렌더링 경로 무관

### 8.2 CI 결과
- Build & Test ✅
- CodeQL (js/ts/py/rust) ✅
- Canvas visual diff ✅
- WASM Build SKIPPED (변경 무관)

### 8.3 의도적 제한
- **`resizeTableCells` 직접 호출 영역 영역 SnapshotCommand 미경유** → Ctrl+Z Undo 결함 가능 (PR #748 closes #158 영역 영역 표 크기 조절 SnapshotCommand 패턴 영역 영역 본 PR 미적용 영역 영역 일관성 결함). 점검 필요.
- 병합 셀 (rowSpan>1 / colSpan>1) 영역 영역 평균 계산 영역 영역 제외 — 정합 (병합 셀 영역 영역 균등화 의도 영역 영역 모호)

## 9. 처리 옵션

### 옵션 A — 2 commits 개별 cherry-pick + no-ff merge

```bash
git checkout local/devel
git cherry-pick c0d9f132 e88bd050  # 충돌 발생 가능 (PR #757 영역 영역 인접)
git checkout devel
git merge local/devel --no-ff
```

→ **권장**.

## 10. 검증 게이트

### 10.1 자기 검증
- [ ] cherry-pick (충돌 발생 시 수동 해결)
- [ ] `cargo build --release` 통과
- [ ] `cargo test --release` ALL GREEN
- [ ] `cd rhwp-studio && npx tsc --noEmit` 통과
- [ ] 광범위 sweep — 7 fixture / 170 페이지 회귀 0

### 10.2 시각 판정 게이트 — **WASM 빌드 + 작업지시자 인터랙션 검증 권장**

본 PR 본질은 **rhwp-studio editor 표 셀 균등화**:
- WASM 빌드 후 dev server 영역 영역:
  - 표 영역 영역 다양한 행/열 크기 영역 영역 메뉴 → "표 → 셀 높이를 같게" → 모든 행 영역 영역 평균 높이 적용
  - "표 → 셀 너비를 같게" → 모든 열 영역 영역 평균 너비 적용
  - 병합 셀 영역 영역 균등화 영역 영역 미포함 영역 영역 정합 점검
  - **Ctrl+Z Undo 점검 — `resizeTableCells` 직접 호출 영역 영역 SnapshotCommand 미경유 영역 영역 결함 가능** (PR #748 와 다른 패턴)

## 11. 메모리 룰 적용

| 룰 | 적용 |
|----|------|
| `feedback_contributor_cycle_check` | @oksure 20+ 사이클 (5/10 사이클 24번째 PR) |
| `feedback_image_renderer_paths_separate` | TypeScript 단일 영역 영역 Rust 렌더링 경로 무영향 |
| `feedback_process_must_follow` | 인프라 재사용 (모든 WASM API 기존) — 신규 인프라 도입 부재. **그러나** PR #748 SnapshotCommand 패턴 영역 영역 미적용 영역 영역 일관성 결함 — 점검 필요 |
| `feedback_visual_judgment_authority` | rhwp-studio editor 인터랙션 영역 영역 작업지시자 인터랙션 검증 권장 (Ctrl+Z Undo 점검 포함) |

## 12. 처리 순서 (승인 후)

1. `local/devel` 영역 영역 옵션 A cherry-pick (충돌 발생 시 수동 해결)
2. 자기 검증 (cargo test + tsc + 광범위 sweep)
3. WASM 빌드 + 작업지시자 인터랙션 검증 (셀 높이/너비 균등화 + 병합 셀 + **Ctrl+Z Undo 점검**)
4. 인터랙션 검증 통과 → no-ff merge + push + archives 이동 + 5/10 orders 갱신
5. PR #758 close

---

작성: 2026-05-10
