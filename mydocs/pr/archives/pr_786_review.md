---
PR: #786
제목: fix — Ctrl+N,M 수식 단축키 + 수식 삭제 오류 수정 (closes #767, closes #766)
컨트리뷰터: @oksure (Hyunwoo Park) — 20+ 사이클 핵심 컨트리뷰터 (5/11 사이클 1번째 PR — PR #739 후속)
base / head: devel / contrib/chord-equation-shortcut
mergeStateStatus: BEHIND
mergeable: MERGEABLE
CI: SUCCESS (Build & Test + CodeQL js/ts/py/rust + Canvas visual diff)
변경 규모: +110 / -0, 7 files
검토일: 2026-05-11
---

# PR #786 검토

## 1. 메타

| 항목 | 값 |
|------|-----|
| PR 번호 | #786 |
| 제목 | fix — Ctrl+N,M 수식 단축키 + 수식 삭제 오류 수정 |
| 컨트리뷰터 | @oksure — 20+ 사이클 (5/11 사이클 1번째 PR — PR #739 후속) |
| base / head | devel / contrib/chord-equation-shortcut |
| mergeStateStatus | BEHIND, mergeable: MERGEABLE — 충돌 부재 |
| CI | ✅ Build & Test + CodeQL (js/ts/py/rust) + Canvas visual diff 통과 |
| 변경 규모 | +110 / -0, 7 files (Rust +91 + TypeScript +19) |
| 커밋 수 | 2 (fix + Copilot 리뷰) |
| closes | #767 + #766 |

## 2. 본질 — PR #739 후속 정정 (2건)

PR #739 (수식 신규 입력, 5/10 머지) 영역 영역 후속 발견 결함 2건:

### 2.1 Issue #767 — Ctrl+N,M 단축키 매핑 누락
- 기존: Ctrl+N 후 M 입력 시 `chordMapN['m']` 미발견 → `preventDefault()` 미호출 → 브라우저 기본 동작 (새 창)
- 정정: `chordMapN` 영역 `m`/`ㅡ` → `insert:equation` 매핑 추가

### 2.2 Issue #766 — 수식 객체 Backspace/Delete 삭제 오류
- 기존: 수식 객체 선택 후 Backspace 시 `deleteShapeControl` 호출 → `Control::Equation` 타입 불일치 → "Shape이 아닙니다" 오류
- 정정: `delete_equation_control_native` + WASM export `deleteEquationControl` 신규 + 키보드 핸들러 4개소 영역 `ref.type === 'equation'` 분기

## 3. 인프라 도입 / 재사용

### 3.1 신규 인프라
| 항목 | 위치 |
|------|------|
| `delete_equation_control_native` (Rust) | `src/document_core/commands/object_ops.rs` (+73) |
| `deleteEquationControl` WASM export | `src/wasm_api.rs` (+18) |
| `WasmBridge.deleteEquationControl` (TypeScript) | `rhwp-studio/src/core/wasm-bridge.ts` (+5) |

### 3.2 재사용
- `chordMapN` (기존, PR #739 영역 영역 도입)
- `executeOperation({ kind: 'snapshot' })` (PR #728 인프라)
- `cursor.getSelectedPictureRef` 영역 영역 `type` 필드 (기존)

→ Equation 컨트롤 전용 삭제 API 신규 도입 — Shape/Picture 영역 영역 정합 (`feedback_image_renderer_paths_separate` 정합).

## 4. PR 의 정정 — 7 files, +110/-0

### 4.1 신규 WASM API (Rust + TypeScript bridge)
- `src/document_core/commands/object_ops.rs` (+73) — `delete_equation_control_native`
- `src/wasm_api.rs` (+18) — `deleteEquationControl` export
- `rhwp-studio/src/core/wasm-bridge.ts` (+5) — WasmBridge 영역 wrapper

### 4.2 키보드 핸들러 4개소 영역 영역 `equation` 분기 추가
- `rhwp-studio/src/engine/input-handler-keyboard.ts` (+8) — Backspace + Ctrl+X (2곳) + onCut (1곳)
- `rhwp-studio/src/engine/input-handler.ts` (+2) — cut handler
- `rhwp-studio/src/engine/input-handler-picture.ts` (+2) — `deleteObjectControl` helper
- `rhwp-studio/src/command/commands/insert.ts` (+2) — object:delete command

### 4.3 chordMapN 매핑 (Ctrl+N,M)
- `rhwp-studio/src/engine/input-handler-keyboard.ts` (+2) — `m` + `ㅡ` (한글 IME)

## 5. Copilot 리뷰 반영 (commit `b376a0d1`)
**`reflow_paragraph_line_segs` 영역 Equation 컨트롤 높이 반영** — 수식 삭제 후 남은 컨트롤 높이 계산 영역 영역 `Control::Equation` 분기 누락 → 수식만 남은 문단의 line_segs 가 0 으로 리셋되는 가능성 정정.

PR 본문 명시 — 셀 내 수식 삭제 (cellIdx/cellParaIdx 전달) 영역 영역 본 PR scope 외 (본문 수식 삭제만 지원).

## 6. 충돌 / mergeable

mergeStateStatus = `BEHIND`, mergeable = `MERGEABLE`. devel 5/10 사이클 영역 영역 PR #752 (deleteObjectControl 래퍼 'line' 타입 추가) + PR #758 (table.ts) 영역 영역 누적 — input-handler-picture.ts 영역 영역 PR #752 동일 영역 영역 점검 필요.

PR #752 영역 영역 `deleteObjectControl` 래퍼 시그니처 영역 'line' 추가, 본 PR 영역 영역 본문 안 'equation' 분기 추가 — 다른 영역 영역 충돌 부재 예상.

## 7. 본 환경 점검

### 7.1 변경 격리
- Rust object_ops + WASM API (delete_equation_control 전용)
- TypeScript 4 파일 영역 'equation' 분기 추가
- Equation 컨트롤 전용 — 다른 컨트롤 (Shape/Picture/Table) 영역 영역 무영향

### 7.2 CI 결과
- 모두 ✅

## 8. 처리 옵션

### 옵션 A — 2 commits 개별 cherry-pick + no-ff merge

```bash
git checkout local/devel
git cherry-pick 1a6c017b b376a0d1  # auto-merge 정합 예상
git checkout devel
git merge local/devel --no-ff
```

→ **권장**.

## 9. 검증 게이트

### 9.1 자기 검증
- [ ] cherry-pick 충돌 0건 (PR #752 deleteObjectControl 래퍼 영역 영역 점검)
- [ ] cargo build/test --release ALL GREEN
- [ ] cargo clippy --release -- -D warnings 통과
- [ ] tsc --noEmit 통과
- [ ] 광범위 sweep — 7 fixture / 170 페이지 회귀 0

### 9.2 시각 판정 게이트 — **WASM 빌드 + 작업지시자 인터랙션 검증 권장**

본 PR 본질 영역 영역 rhwp-studio editor 수식 인터랙션:
- WASM 빌드 후 dev server 영역 영역:
  - **Issue #767**: Ctrl+N → M (또는 ㅡ, 한글 IME) → 수식 입력 dialog (브라우저 기본 동작 미발동)
  - **Issue #766**: 수식 객체 선택 → Backspace / Delete / Ctrl+X → 수식 삭제 정합 (오류 부재)
  - 다른 객체 (Shape/Picture/Table) 삭제 회귀 부재
  - Copilot 리뷰 — 수식 삭제 후 line_segs 0 리셋 부재 (수식만 남은 문단 영역 영역 점검)

## 10. 메모리 룰 적용

| 룰 | 적용 |
|----|------|
| `feedback_contributor_cycle_check` | @oksure 20+ 사이클 (5/11 사이클 1번째 PR — PR #739 후속) |
| `feedback_image_renderer_paths_separate` | Equation 컨트롤 전용 삭제 API 영역 영역 Shape/Picture 영역 영역 정합 |
| `feedback_pr_supersede_chain` (c) 패턴 | PR #739 (수식 신규 입력) 머지 후 후속 결함 정정 영역 별 PR (Issue #766 + #767) |
| `feedback_process_must_follow` | 인프라 추가 (`deleteEquationControl`) — 본질 정확화 (타입 불일치 정정) |
| `feedback_visual_judgment_authority` | rhwp-studio editor 수식 인터랙션 영역 영역 작업지시자 인터랙션 검증 권장 |

## 11. 처리 순서 (승인 후)

1. `local/devel` 영역 cherry-pick 2 commits (`1a6c017b` + `b376a0d1`)
2. 자기 검증 (cargo build/test/clippy + tsc + 광범위 sweep)
3. WASM 빌드 + 작업지시자 인터랙션 검증 (Ctrl+N,M + 수식 객체 삭제 + 회귀 부재)
4. 인터랙션 검증 통과 → no-ff merge + push + archives + 5/10 orders + Issue #766/#767 close
5. PR #786 close

---

작성: 2026-05-11
