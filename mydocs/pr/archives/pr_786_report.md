---
PR: #786
제목: fix — Ctrl+M,M 수식 단축키 + 수식 삭제 오류 수정 (closes #767, closes #766)
컨트리뷰터: @oksure (Hyunwoo Park) — 20+ 사이클 핵심 컨트리뷰터 (5/11 사이클 1번째 PR — PR #739 후속)
처리: 옵션 A — 2 commits cherry-pick + 자기 정정 4 commits + no-ff merge
처리일: 2026-05-11
머지 commit: ea9531d0
---

# PR #786 처리 보고서

## 1. 처리 결과

✅ **머지 완료** — 옵션 A (2 commits cherry-pick + 자기 정정 4 commits + no-ff merge)

| 항목 | 값 |
|------|-----|
| 머지 commit | `ea9531d0` (--no-ff merge) |
| Cherry-pick commits | `4a8772b6` (fix Issue #767+#766) + `a86668e9` (Copilot 리뷰 reflow Equation 높이) |
| 자기 정정 commits | `7bc2dc08` + `fb1a22cb` (revert) + `924ca0f4` (Ctrl+N→Ctrl+M) + `e906c1b8` (IME 합성 중 chord) |
| closes | #767 + #766 |
| 시각 판정 | ✅ 작업지시자 웹 에디터 시각 검증 통과 |
| 자기 검증 | cargo build/test/clippy ALL GREEN + tsc + sweep 170/170 same + WASM 4.68 MB |

## 2. 본 PR 본질 — PR #739 후속 정정 2건

### 2.1 Issue #767 — Ctrl+N,M 단축키 매핑 누락
- 기존: `chordMapN['m']` 미발견 → 브라우저 새 창 발동
- 정정: `chordMapN` 영역 `m` + `ㅡ` (한글 IME) → `insert:equation` 매핑 추가

### 2.2 Issue #766 — 수식 객체 삭제 오류
- 기존: `deleteShapeControl` 호출 → `Control::Equation` 타입 불일치 → "Shape이 아닙니다" 오류
- 정정: `delete_equation_control_native` + WASM export `deleteEquationControl` 신규 + 키보드 핸들러 4개소 영역 `equation` 분기

### 2.3 Copilot 리뷰 (`a86668e9`)
`reflow_paragraph_line_segs` 영역 Equation 컨트롤 높이 반영 — 수식만 남은 문단의 line_segs 0 리셋 정정.

## 3. 본 환경 자기 정정 4 commits

작업지시자 웹 에디터 시각 검증 영역 영역 발견된 결함 영역 영역:

### 3.1 1차 시도 — `7bc2dc08` (효과 없음)
**setupGlobalShortcuts Ctrl+N chord 시작 보강 시도** — InputHandler 활성 시점 영역 영역도 Ctrl+N 차단 + chord 활성화. 그러나 **Chrome / Edge 영역 영역 Ctrl+N (새 창) 영역 영역 OS-level reserved shortcut 영역 영역 JS preventDefault() 차단 불가** 영역 영역 효과 없음.

### 3.2 Revert — `fb1a22cb`
1차 시도 영역 영역 효과 없음 영역 영역 정합성 회복 영역 영역 revert.

### 3.3 본 정정 — `924ca0f4` (chord 키 Ctrl+N → Ctrl+M 변경)
**작업지시자 결정** — Chrome reserved shortcut 회피 영역 영역 chord 키 영역 영역 Ctrl+N → Ctrl+M 변경:
- `chordMapN` → `chordMapM`
- `_pendingChordN` → `_pendingChordM`
- chord 1번째 키 영역 영역 `'m'` / `'M'` / `'ㅡ'`
- shortcutLabel 갱신: `Ctrl+N,M` → `Ctrl+M,M` (수식) / `Ctrl+N,F` → `Ctrl+M,F` (계산식) / `Ctrl+N,K` → `Ctrl+M,K` (누름틀 고치기) / `Ctrl+N,S` → `Ctrl+M,S` (감추기)

### 3.4 IME 합성 중 chord 활성화 — `e906c1b8`
**작업지시자 영역 영역 한글 IME 영역 영역도 적용 요청** — 한글 IME 영역 영역 `e.key === 'Process'` (Chrome 영역 영역 IME 합성 중 영역 영역 일관) 영역 영역 line 201 영역 영역 IME 합성 중 영역 영역 즉시 return → chord 활성화 부재.

정정:
- chord 1번째 키 영역 영역 IME 합성 중 영역 영역 `e.code === 'KeyM'` 영역 영역 활성화
- chord 2번째 키 영역 영역 `_pendingChordM` 활성화 시 `e.code` 영역 영역 chordMapM lookup (KeyM/KeyN/KeyS/KeyF/KeyK → 'm'/'n'/'s'/'f'/'k')

## 4. 인프라 도입 / 재사용

### 4.1 신규 인프라
| 항목 | 위치 |
|------|------|
| `delete_equation_control_native` (Rust) | `src/document_core/commands/object_ops.rs` (+73) |
| `deleteEquationControl` WASM export | `src/wasm_api.rs` (+18) |
| `WasmBridge.deleteEquationControl` (TypeScript) | `rhwp-studio/src/core/wasm-bridge.ts` (+5) |

### 4.2 재사용
- `chordMapN` (PR #739 영역 영역 도입) → `chordMapM` 영역 영역 갱신
- `executeOperation({ kind: 'snapshot' })` (PR #728 인프라)
- `cursor.getSelectedPictureRef.type` 필드 (기존)

## 5. 본 환경 검증

| 검증 | 결과 |
|------|------|
| `cherry-pick` (2 commits) | ✅ auto-merge 충돌 0건 |
| `cargo build --release` | ✅ 통과 |
| `cargo test --release` | ✅ ALL GREEN |
| `cargo clippy --release -- -D warnings` | ✅ 통과 |
| `tsc --noEmit` (rhwp-studio) | ✅ 통과 (WASM 빌드 후 신규 deleteEquationControl API type 갱신) |
| 광범위 sweep (7 fixture / 170 페이지) | ✅ **170 same / 0 diff** |
| WASM 빌드 (Docker, 재빌드) | ✅ 4.68 MB |

## 6. 작업지시자 웹 에디터 시각 검증 ✅ 통과
1. **수식 객체 삭제** — Backspace/Delete/Ctrl+X 영역 영역 정합 동작 (Issue #766 정정)
2. **Ctrl+M,M (영문 상태)** — 수식 dialog (Issue #767 정정 + chord 키 변경)
3. **Ctrl+M,M (한글 IME 상태)** — 동일 동작 (e.code 판별 영역 영역 chord 활성화)

## 7. 학습

### 7.1 Chrome reserved shortcut 영역 영역 JS 차단 불가
Chrome / Edge 영역 영역 OS-level reserved shortcut (`Ctrl+N` / `Ctrl+T` / `Ctrl+W` / `Ctrl+Shift+N`) 영역 영역 JS `preventDefault()` 차단 불가능. 향후 chord 키 영역 영역 reserved shortcut 회피 영역 영역 의도적 선택 필수.

### 7.2 한글 IME chord 키 처리 패턴
한글 IME 영역 영역 `e.key === 'Process'` (Chrome 영역 영역 IME 합성 중 영역 영역 일관) 영역 영역 `e.code` (KeyM/KeyN/KeyS 등) 판별 — 본 PR 영역 영역 도입 영역 영역 향후 chord 키 영역 영역 정합 패턴.

## 8. 영향 범위

### 8.1 변경 영역
- Rust object_ops + WASM API (`delete_equation_control_native` + `deleteEquationControl`)
- TypeScript 6 파일 — chord 키 변경 (Ctrl+N → Ctrl+M) + 'equation' 분기 + IME 합성 중 chord 활성화

### 8.2 무변경 영역
- HWP3/HWPX 변환본 시각 정합 (sweep 170/170 same 입증)
- 다른 컨트롤 (Shape/Picture/Table) 삭제 정합

## 9. 메모리 룰 적용

| 룰 | 적용 |
|----|------|
| `feedback_contributor_cycle_check` | @oksure **20+ 사이클** (5/11 1번째 PR — PR #739 후속) |
| `feedback_image_renderer_paths_separate` | Equation 컨트롤 전용 삭제 API 영역 영역 Shape/Picture 영역 정합 |
| `feedback_pr_supersede_chain` (c) 패턴 | PR #739 (수식 신규 입력) 머지 후 후속 결함 정정 영역 별 PR |
| `feedback_diagnosis_layer_attribution` | Chrome reserved shortcut 영역 영역 JS 차단 불가 영역 영역 본질 진단 + chord 키 변경 회피 |
| `feedback_visual_judgment_authority` | **권위 사례 강화** — 작업지시자 시각 검증 영역 영역 결함 발견 + 자기 정정 4 commits 영역 영역 정합 회복 |
| `feedback_process_must_follow` | 본질 분리 (cherry-pick 2 commits 영역 본 PR 본질 + 자기 정정 4 commits 영역 후속 정정 — PR #740 자기 정정 패턴) |

## 10. 잔존 후속

- 본 PR 본질 정정의 잔존 결함 부재
- Issues #766 + #767 close 완료
- 향후 chord 키 영역 영역 Chrome reserved shortcut 회피 영역 영역 의도적 선택 (학습)

---

작성: 2026-05-11
