---
PR: #754
제목: feat — 표 블록 합계/평균/곱 계산 커맨드 구현
컨트리뷰터: @oksure (Hyunwoo Park) — 20+ 사이클 핵심 컨트리뷰터 (5/10 사이클 21번째 PR)
처리: 옵션 A — 2 commits cherry-pick + no-ff merge
처리일: 2026-05-10
머지 commit: fcb888d7
---

# PR #754 처리 보고서

## 1. 처리 결과

✅ **머지 완료** — 옵션 A (2 commits cherry-pick + no-ff merge)

| 항목 | 값 |
|------|-----|
| 머지 commit | `fcb888d7` (--no-ff merge) |
| Cherry-pick commits | `829b6520` (feat) + `cb966149` (Copilot 리뷰) |
| Issue 연결 | 부재 (표 메뉴 stub 활성화 영역 자기완결) |
| 시각 판정 | ✅ 작업지시자 웹 에디터 인터랙션 검증 통과 |
| 자기 검증 | tsc + cargo test ALL GREEN + sweep 170/170 same + WASM 4.68 MB 재빌드 |

## 2. 정정 본질 — 2 files, +37/-3

### 2.1 `rhwp-studio/src/command/commands/table.ts` (+34/-3)
`blockCalcCommand` 헬퍼 함수 신규 — 대화상자 없이 즉시 계산:
1. `getCursorPosition` → 현재 셀 위치
2. `getCellInfo` → row/col 직접 조회
3. `evaluateTableFormula(=FUNC(above), writeResult=true)` → 결과 셀 삽입

3 stub → blockCalcCommand 호출 변환 (SUM / AVERAGE / PRODUCT).

### 2.2 `rhwp-studio/src/command/shortcut-map.ts` (+3)
Ctrl+Shift+S/A/P 단축키 매핑.

## 3. Copilot 리뷰 반영 (commit `cb966149`)
`getTableProperties` cell loop 계산 → `getCellInfo()` 직접 조회 — 효율 개선.

## 4. 인프라 재사용

| 인프라 | 활용 |
|--------|------|
| `getCellInfo` WASM API (기존) | row/col 직접 조회 |
| `evaluateTableFormula` WASM API (기존) | =FUNC(above) 평가 + writeResult |
| `inTable` 가드 (기존) | `canExecute` 가드 |
| FormulaDialog 패턴 (기존) | row/col 계산 로직 공유 |
| EditorContext (기존) | `inTable` 판정 |

→ 신규 인프라 도입 부재 (`feedback_process_must_follow` 정합).

## 5. 본 환경 검증

| 검증 | 결과 |
|------|------|
| `cherry-pick` (2 commits) | ✅ auto-merge 충돌 0건 |
| `tsc --noEmit` (rhwp-studio) | ✅ 통과 |
| `cargo test --release` | ✅ ALL GREEN |
| 광범위 sweep (7 fixture / 170 페이지) | ✅ **170 same / 0 diff** |
| WASM 빌드 (Docker, 재빌드) | ✅ 4.68 MB |

## 6. 작업지시자 웹 에디터 인터랙션 검증 ✅ 통과
- Ctrl+Shift+S → SUM(above) 결과 삽입
- Ctrl+Shift+A → AVERAGE(above) 결과 삽입
- Ctrl+Shift+P → PRODUCT(above) 결과 삽입
- 메뉴 → "표 → 블록 합계 / 평균 / 곱" → 동일 동작

## 7. 영향 범위

### 7.1 변경 영역
- rhwp-studio editor 영역 영역 표 커맨드 (TypeScript 단일 영역)

### 7.2 무변경 영역
- WASM 코어 (Rust) — 변경 부재 (기존 WASM API 재호출만)
- HWP3/HWPX 변환본 시각 정합 (sweep 170/170 same 입증)

## 8. 의도적 제한 (PR 본문 명시 영역)

- **`above` 영역 만** — left/right/below 영역 영역 후속 분리 (`feedback_hancom_compat_specific_over_general` 정합)

## 9. 메모리 룰 적용

| 룰 | 적용 |
|----|------|
| `feedback_contributor_cycle_check` | @oksure **20+ 사이클** (5/10 사이클 21번째 PR) |
| `feedback_image_renderer_paths_separate` | TypeScript 단일 영역 영역 Rust 렌더링 경로 무영향 |
| `feedback_process_must_follow` | 인프라 재사용 (`getCellInfo` + `evaluateTableFormula` + `inTable` 가드) — 신규 인프라 도입 부재 |
| `feedback_hancom_compat_specific_over_general` | `above` 만 영역 영역 일반화 영역 영역 후속 분리 |
| `feedback_visual_judgment_authority` | 작업지시자 웹 에디터 인터랙션 검증 ✅ 통과 |

## 10. 잔존 후속

- 본 PR 본질 정정의 잔존 결함 부재
- 후속 분리: left / right / below 영역 영역 블록 계산 (별 task)
- (점검 항목) Ctrl+Z Undo 동작 — `evaluateTableFormula(writeResult=true)` 영역 영역 SnapshotCommand 미경유 영역 영역 결함 가능 영역 영역 별 후속 task

---

작성: 2026-05-10
