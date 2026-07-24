---
PR: #758
제목: feat — 표 셀 높이 / 너비 균등화 커맨드 구현
컨트리뷰터: @oksure (Hyunwoo Park) — 20+ 사이클 핵심 컨트리뷰터 (5/10 사이클 24번째 PR)
처리: 옵션 A — 2 commits cherry-pick + no-ff merge + 후속 Issue #792
처리일: 2026-05-10
머지 commit: b555739a
---

# PR #758 처리 보고서

## 1. 처리 결과

✅ **머지 완료** — 옵션 A (2 commits cherry-pick + no-ff merge + 후속 Issue #792)

| 항목 | 값 |
|------|-----|
| 머지 commit | `b555739a` (--no-ff merge) |
| Cherry-pick commits | `dcdba52f` (feat) + `c9ebee5c` (Copilot 리뷰) |
| 후속 Issue | #792 — 메뉴 hotkey 인프라 (H/W 단축키 활성) |
| Issue 연결 | 부재 (표 메뉴 stub 활성화 영역 자기완결) |
| 시각 판정 | ✅ 작업지시자 웹 에디터 인터랙션 검증 통과 (커맨드 본질) |
| 자기 검증 | tsc + cargo test ALL GREEN + sweep 170/170 same + WASM 4.68 MB 재빌드 |

## 2. 정정 본질 — 1 file, +82/-2

`rhwp-studio/src/command/commands/table.ts` 영역 영역 2 stub → 실제 구현:

| 커맨드 | 단축키 (메뉴 라벨) | 동작 |
|--------|-------------------|------|
| `table:cell-height-equal` | H | 표 내 모든 행 높이 영역 영역 평균값 영역 영역 균등화 |
| `table:cell-width-equal` | W | 표 내 모든 열 너비 영역 영역 평균값 영역 영역 균등화 |

### 알고리즘
1. `getTableDimensions` → 셀 개수
2. 전체 셀 순회 + `getCellInfo` (row/col/rowSpan/colSpan) + `getCellProperties` (height/width)
3. 행/열 별 평균 크기 계산 (병합 셀 영역 영역 rowSpan>1 / colSpan>1 제외)
4. 전체 평균 → 각 셀 delta
5. `resizeTableCells` 일괄 적용

## 3. Copilot 리뷰 반영 (commit `c9ebee5c`)
셀 정보 캐싱 영역 영역 이중 순회 제거 — `getCellInfo` + `getCellProperties` 호출 영역 영역 한 번 만 + cells 배열 영역 영역 캐시 + rowHeights/colWidths Map 영역 영역 동시 누적.

## 4. 인프라 재사용

| 인프라 | 활용 |
|--------|------|
| `getTableDimensions` WASM API (기존) | 셀 개수 조회 |
| `getCellInfo` WASM API (기존) | row/col/rowSpan/colSpan |
| `getCellProperties` WASM API (기존) | height/width |
| `resizeTableCells` WASM API (기존) | delta 일괄 적용 |
| `inTable` 가드 (기존) | `canExecute` 가드 |

→ 신규 인프라 도입 부재 (`feedback_process_must_follow` 정합).

## 5. 본 환경 검증

| 검증 | 결과 |
|------|------|
| `cherry-pick` (2 commits) | ✅ auto-merge 충돌 0건 |
| `tsc --noEmit` (rhwp-studio) | ✅ 통과 |
| `cargo test --release` | ✅ ALL GREEN |
| 광범위 sweep (7 fixture / 170 페이지) | ✅ **170 same / 0 diff** |
| WASM 빌드 (Docker, 재빌드) | ✅ 4.68 MB |

## 6. 작업지시자 웹 에디터 인터랙션 검증 ✅ 통과 (커맨드 본질)

- 메뉴 → "표 → 셀 높이를 같게" → 행 높이 균등화 동작 정합
- 메뉴 → "표 → 셀 너비를 같게" → 열 너비 균등화 동작 정합
- 병합 셀 영역 영역 균등화 미포함 정합

### 발견 — 단축키 H / W 미동작 (별 후속 Issue #792)

`shortcutLabel: 'H' / 'W'` 영역 영역 한컴 메뉴 hotkey (메뉴 열린 후 H 영역 영역 항목 활성) 정합 의도 영역 영역 **rhwp-studio 영역 영역 메뉴 hotkey 인프라 미구현** 영역 영역 단축키 미동작.

### 본질 분리

| 영역 | 의미 | 본 환경 처리 |
|------|------|-------------|
| `shortcutLabel: 'H' / 'W'` | 메뉴 라벨 표시만 (UI) | command-palette / context-menu 영역 영역 표시 |
| `shortcut-map.ts` 등록 | 전역 단축키 매핑 (modifier 영역) | 본 PR 영역 영역 미등록 (정합 — modifier 없는 단일 키 영역 영역 텍스트 입력 충돌) |
| 메뉴 hotkey | 메뉴 열린 상태 영역 영역 단일 키 항목 활성 | **인프라 미구현 → Issue #792** |

## 7. 처리 결정 — 옵션 3 (`feedback_pr_supersede_chain` (c) 패턴)

본 PR 머지 유지 + 별 후속 Issue 영역 영역 본질 정정:
- 본 PR 본질 (커맨드 구현) ✅ 정합 — 메뉴 항목 영역 영역 동작
- 단축키 영역 영역 별 본질 (메뉴 hotkey 인프라) → Issue #792
- `shortcutLabel` 영역 영역 보존 — Issue #792 영역 영역 인프라 도입 후 활성 정합

## 8. 영향 범위

### 8.1 변경 영역
- rhwp-studio editor 영역 영역 표 커맨드 (TypeScript 단일 파일)

### 8.2 무변경 영역
- WASM 코어 (Rust) — 변경 부재 (기존 WASM API 재호출만)
- HWP3/HWPX 변환본 시각 정합 (sweep 170/170 same 입증)

## 9. 의도적 제한 / 점검 영역

- **`resizeTableCells` 직접 호출 영역 영역 SnapshotCommand 미경유** → Ctrl+Z Undo 결함 가능 (PR #748 closes #158 영역 영역 표 크기 조절 SnapshotCommand 패턴 영역 영역 본 PR 미적용 영역 영역 일관성 결함). 별 후속 task 영역 영역 점검 (PR #754 / #757 와 동일 본질 영역 영역 통합 처리 가능).
- **단축키 H / W 영역 영역 미동작** — Issue #792 영역 영역 메뉴 hotkey 인프라

## 10. 메모리 룰 적용

| 룰 | 적용 |
|----|------|
| `feedback_contributor_cycle_check` | @oksure **20+ 사이클** (5/10 사이클 24번째 PR) |
| `feedback_image_renderer_paths_separate` | TypeScript 단일 영역 영역 Rust 렌더링 경로 무영향 |
| `feedback_process_must_follow` | 인프라 재사용 (모든 WASM API 기존) — 신규 인프라 도입 부재 |
| `feedback_pr_supersede_chain` (c) 패턴 | 본 PR 머지 유지 + Issue #792 영역 영역 본질 정정 |
| `feedback_visual_judgment_authority` | 작업지시자 웹 에디터 인터랙션 검증 영역 영역 단축키 미동작 발견 영역 영역 후속 task 분리 결정 |

## 11. 잔존 후속

- **Issue #792 OPEN** — 메뉴 hotkey 인프라 + H/W 단축키 활성 (메뉴 열린 후 단일 키 항목 활성)
- 본 PR 본질 정정의 잔존 결함 부재
- (점검 항목) Ctrl+Z Undo 동작 — `resizeTableCells` 직접 호출 영역 영역 SnapshotCommand 미경유 영역 영역 결함 가능 영역 영역 별 후속 task (PR #754 / #757 와 동일 본질)

---

작성: 2026-05-10
