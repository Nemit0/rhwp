---
PR: #754
제목: feat — 표 블록 합계/평균/곱 계산 커맨드 구현
컨트리뷰터: @oksure (Hyunwoo Park) — 20+ 사이클 핵심 컨트리뷰터 (5/10 사이클 21번째 PR)
base / head: devel / contrib/table-block-formulas
mergeStateStatus: BEHIND
mergeable: MERGEABLE
CI: SUCCESS (Build & Test + CodeQL js/ts/py/rust + Canvas visual diff)
변경 규모: +37 / -3, 2 files
검토일: 2026-05-10
---

# PR #754 검토

## 1. 메타

| 항목 | 값 |
|------|-----|
| PR 번호 | #754 |
| 제목 | feat — 표 블록 합계/평균/곱 계산 커맨드 구현 |
| 컨트리뷰터 | @oksure — 20+ 사이클 (5/10 사이클 21번째 PR) |
| base / head | devel / contrib/table-block-formulas |
| mergeStateStatus | BEHIND, mergeable: MERGEABLE — 충돌 부재 |
| CI | ✅ Build & Test + CodeQL (js/ts/py/rust) + Canvas visual diff 통과 |
| 변경 규모 | +37 / -3, 2 files |
| 커밋 수 | 2 (feat + Copilot 리뷰) |
| Issue 연결 | 부재 (표 메뉴 stub 활성화 영역 영역 자기완결) |

## 2. 결함 본질

표 > 블록 합계/평균/곱 커맨드 영역 영역 stub 영역 영역 미동작:
- `table:block-sum` (Ctrl+Shift+S)
- `table:block-avg` (Ctrl+Shift+A)
- `table:block-product` (Ctrl+Shift+P)

## 3. 채택 접근 — `FormulaDialog` 패턴 정합 (대화상자 없이 즉시 계산)

기존 `FormulaDialog` (수식 대화상자) 영역 영역 row/col 계산 로직 공유 영역 영역 대화상자 없이 즉시 결과 셀 삽입:
1. `getCursorPosition` → 현재 셀 위치
2. `getCellInfo` → row/col 직접 조회 (Copilot 리뷰 영역 영역 직접 조회 채택)
3. `evaluateTableFormula(=FUNC(above))` → 결과 삽입

## 4. 인프라 재사용

| 인프라 | 활용 |
|--------|------|
| `getCellInfo` WASM API (기존, `wasm_api.rs:1822`) | row/col 직접 조회 |
| `evaluateTableFormula` WASM API (기존, `wasm_api.rs:4557`) | =FUNC(above) 평가 + writeResult |
| `inTable` 가드 (기존, `table.ts:8`) | `canExecute` 가드 |
| FormulaDialog 패턴 (기존) | row/col 계산 로직 공유 |
| EditorContext (기존) | `inTable` 판정 |

→ 신규 인프라 도입 부재 (`feedback_process_must_follow` 정합).

## 5. PR 의 정정 — 2 files, +37/-3

### 5.1 `rhwp-studio/src/command/commands/table.ts` (+34/-3)

`blockCalcCommand` 헬퍼 함수 신규 추가:

```typescript
function blockCalcCommand(id: string, label: string, func: string, shortcut: string): CommandDef {
  return {
    id, label, shortcutLabel: shortcut, canExecute: inTable,
    execute(services) {
      const ih = services.getInputHandler();
      if (!ih) return;
      const pos = ih.getCursorPosition();
      if (pos.parentParaIndex === undefined || pos.controlIndex === undefined || pos.cellIndex === undefined) return;
      try {
        const cellInfo = services.wasm.getCellInfo(pos.sectionIndex, pos.parentParaIndex, pos.controlIndex, pos.cellIndex);
        const formula = `=${func}(above)`;
        const result = services.wasm.evaluateTableFormula(
          pos.sectionIndex, pos.parentParaIndex, pos.controlIndex,
          cellInfo.row, cellInfo.col, formula, true,
        );
        const parsed = JSON.parse(result);
        if (parsed.ok) services.eventBus.emit('document-changed');
      } catch (err) {
        console.warn(`[${id}] 블록 계산 실패:`, err);
      }
    },
  };
}
```

3 stub → blockCalcCommand 호출 변환:
```typescript
blockCalcCommand('table:block-sum', '블록 합계', 'SUM', 'Ctrl+Shift+S'),
blockCalcCommand('table:block-avg', '블록 평균', 'AVERAGE', 'Ctrl+Shift+A'),
blockCalcCommand('table:block-product', '블록 곱', 'PRODUCT', 'Ctrl+Shift+P'),
```

### 5.2 `rhwp-studio/src/command/shortcut-map.ts` (+3)

```typescript
[{ key: 's', ctrl: true, shift: true }, 'table:block-sum'],
[{ key: 'a', ctrl: true, shift: true }, 'table:block-avg'],
[{ key: 'p', ctrl: true, shift: true }, 'table:block-product'],
```

## 6. Copilot 리뷰 반영 (commit `9fa3f3db`)
- `getTableProperties` 영역 영역 cell loop 계산 → `getCellInfo()` 직접 조회 — 효율 개선

## 7. 충돌 / mergeable

mergeStateStatus = `BEHIND`, mergeable = `MERGEABLE`.

본 환경 점검:
- `rhwp-studio/src/command/commands/table.ts` — devel 영역 영역 PR #728/#748 영역 영역 SnapshotCommand 적용 영역 영역 안정 (table.ts 영역 영역 변경 부재 — input-handler-table.ts 영역 영역 다른 영역)
- `rhwp-studio/src/command/shortcut-map.ts` — PR #749/#750/#751/#752 누적 (Ctrl+O / Ctrl+Alt+Enter / Alt+Shift+ㅗ/ㅊ/ㅇ / Ctrl+E) — Ctrl+Shift+S/A/P 영역 영역 다른 영역 영역 충돌 부재

→ cherry-pick 충돌 0건 예상 (auto-merge 정합).

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
- **`above` 영역 만** — 현재 셀 위 셀 SUM/AVERAGE/PRODUCT 영역. `left` / `right` / `below` 영역 영역 본 PR 미포함 (`feedback_hancom_compat_specific_over_general` 정합 — 후속 분리)
- **단축키 영역 영역 Undo 부재 점검 필요** — PR 본문 영역 영역 명시 부재. `evaluateTableFormula` 의 `writeResult=true` 영역 영역 직접 셀 텍스트 영역 영역 변경 영역 영역 SnapshotCommand 미경유 영역 영역 Ctrl+Z 미동작 가능. **주의 영역**.

## 9. 처리 옵션

### 옵션 A — 2 commits 개별 cherry-pick + no-ff merge

```bash
git checkout local/devel
git cherry-pick 9c16044e 9fa3f3db
git checkout devel
git merge local/devel --no-ff -m "Merge PR #754: feat 표 블록 합계/평균/곱 계산 커맨드"
```

→ **권장**.

## 10. 검증 게이트

### 10.1 자기 검증
- [ ] cherry-pick 충돌 0건
- [ ] `cargo build --release` 통과 (Rust 변경 부재)
- [ ] `cargo test --release` ALL GREEN
- [ ] `cd rhwp-studio && npx tsc --noEmit` 통과
- [ ] 광범위 sweep — 7 fixture / 170 페이지 회귀 0 (TypeScript 영역 SVG 무영향 자명)

### 10.2 시각 판정 게이트 — **WASM 빌드 + 작업지시자 인터랙션 검증 권장**

본 PR 본질은 **rhwp-studio editor 표 블록 계산 인터랙션**:
- WASM 빌드 후 dev server 영역 영역:
  - 표 셀 영역 영역 Ctrl+Shift+S → SUM(above) 결과 삽입
  - Ctrl+Shift+A → AVERAGE(above) 결과 삽입
  - Ctrl+Shift+P → PRODUCT(above) 결과 삽입
  - 메뉴 영역 영역 "표 → 블록 합계 / 평균 / 곱" → 동일 동작
  - **Undo 동작 점검 필요** — Ctrl+Z 영역 영역 결과 셀 영역 영역 복원 동작 (SnapshotCommand 미경유 영역 영역 미동작 가능 영역 영역 점검)

> 신규 점검 항목: **Ctrl+Z Undo 동작** — `evaluateTableFormula(writeResult=true)` 영역 영역 SnapshotCommand 미경유 영역 영역 결함 가능. PR #728 (표 편집 SnapshotCommand 패턴) 영역 영역 별 영역.

## 11. 메모리 룰 적용

| 룰 | 적용 |
|----|------|
| `feedback_contributor_cycle_check` | @oksure 20+ 사이클 (5/10 사이클 21번째 PR) |
| `feedback_image_renderer_paths_separate` | TypeScript 단일 영역 영역 Rust 렌더링 경로 무영향 |
| `feedback_process_must_follow` | 인프라 재사용 (`getCellInfo` + `evaluateTableFormula` + `inTable` 가드) — 신규 인프라 도입 부재 |
| `feedback_hancom_compat_specific_over_general` | `above` 만 영역 영역 영역 영역 일반화 (left/right/below) 영역 영역 후속 분리 |
| `feedback_visual_judgment_authority` | rhwp-studio editor 인터랙션 영역 영역 작업지시자 인터랙션 검증 권장 (Ctrl+Z Undo 동작 점검 필수) |

## 12. 처리 순서 (승인 후)

1. `local/devel` 영역 영역 옵션 A cherry-pick (2 commits)
2. 자기 검증 (cargo test + tsc + 광범위 sweep)
3. WASM 빌드 + 작업지시자 인터랙션 검증 (Ctrl+Shift+S/A/P + 메뉴 + **Ctrl+Z Undo 점검**)
4. 인터랙션 검증 통과 → no-ff merge + push + archives 이동 + 5/10 orders 갱신
5. PR #754 close

---

작성: 2026-05-10
