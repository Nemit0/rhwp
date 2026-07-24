---
PR: #759
제목: feat — table:block-formula 블록 계산식 커맨드 구현
컨트리뷰터: @oksure (Hyunwoo Park) — 20+ 사이클 핵심 컨트리뷰터 (5/10 사이클 25번째 PR)
처리: 옵션 A — 2 commits cherry-pick + 충돌 수동 해결 + no-ff merge
처리일: 2026-05-10
머지 commit: ad8cbba2
---

# PR #759 처리 보고서

## 1. 처리 결과

✅ **머지 완료** — 옵션 A (2 commits cherry-pick + 충돌 수동 해결 + no-ff merge)

| 항목 | 값 |
|------|-----|
| 머지 commit | `ad8cbba2` (--no-ff merge) |
| Cherry-pick commits | `5fdf5415` (feat, 충돌 수동 해결) + `ffcc1cb9` (Copilot 리뷰, 충돌 수동 해결) |
| Issue 연결 | 부재 (표 메뉴 stub 활성화 영역 자기완결) |
| 시각 판정 | 면제 (작업지시자 결정 — 단순 stub 활성화) |
| 자기 검증 | tsc + cargo test ALL GREEN + sweep 170/170 same |

## 2. 정정 본질 — 1 file, +21/-14

### 2.1 변경
- `openFormulaDialog` 공통 함수 신규 (Copilot 리뷰 영역 영역 추출)
- `stub('table:block-formula', '블록 계산식')` → 실제 구현 (`FormulaDialog` 호출)
- `table:formula` 영역 영역 `openFormulaDialog` 위임 (중복 제거)

### 2.2 본질
`table:block-formula` (블록 계산식) stub 활성화 — 기존 `FormulaDialog` 재사용. PR 본문 명시: "한컴 오피스에서도 '블록 계산식'과 '계산식'은 동일한 대화상자를 공유".

## 3. Copilot 리뷰 반영 (commit `ffcc1cb9`)
계산식 대화상자 공통 함수 추출 — `openFormulaDialog`. `table:formula` + `table:block-formula` 동일 호출 패턴 영역 영역 중복 제거.

## 4. 인프라 재사용

| 인프라 | 활용 |
|--------|------|
| `FormulaDialog` (기존) | 계산식 / 블록 계산식 영역 영역 동일 대화상자 |
| `inTable` 가드 (기존) | `canExecute` 가드 |
| `openFormulaDialog` 공통 함수 (Copilot 리뷰 영역 영역 추출) | 두 커맨드 영역 영역 호출 |

→ 신규 인프라 도입 부재.

## 5. 충돌 수동 해결

### 5.1 본질
PR #759 base = `30351cdf` (5/9 시점). devel HEAD 영역 영역 PR #754 (5/10 머지) + PR #757 (5/10 머지) 영역 영역 동일 위치 영역 영역 활성화 영역 누적.

### 5.2 첫번째 commit 충돌
- HEAD 영역 영역 PR #754 (block-sum/avg/product blockCalcCommand) + PR #757 (thousand-sep/decimal-add/decimal-remove 활성화) 보존
- incoming 영역 영역 `table:block-formula` stub → 실제 구현 (FormulaDialog 호출)
- 해결: HEAD 모두 보존 + incoming `table:block-formula` 활성화만 추가

### 5.3 두번째 commit 충돌 (Copilot 리뷰)
- HEAD 영역 영역 `blockCalcCommand` 함수 (PR #754)
- incoming 영역 영역 `openFormulaDialog` 함수 (Copilot 리뷰 추출)
- 해결: 양측 함수 모두 보존 (다른 본질 — block 계산 vs Formula 대화상자)

## 6. 본 환경 검증

| 검증 | 결과 |
|------|------|
| `cherry-pick` (2 commits) | ✅ (양 commit 충돌 — 양측 보존 수동 해결) |
| `tsc --noEmit` (rhwp-studio) | ✅ 통과 |
| `cargo test --release` | ✅ ALL GREEN |
| 광범위 sweep (7 fixture / 170 페이지) | ✅ **170 same / 0 diff** |

## 7. 시각 판정 면제 (작업지시자 결정)
단순 stub 활성화 + 기존 `FormulaDialog` 동일 호출 영역 영역 시각 판정 게이트 면제.

## 8. 영향 범위

### 8.1 변경 영역
- rhwp-studio editor 영역 영역 표 커맨드 (TypeScript 단일 파일)

### 8.2 무변경 영역
- WASM 코어 (Rust) — 변경 부재
- 기존 `FormulaDialog` (재사용 만)
- HWP3/HWPX 변환본 시각 정합 (sweep 170/170 same 입증)

## 9. 메모리 룰 적용

| 룰 | 적용 |
|----|------|
| `feedback_contributor_cycle_check` | @oksure **20+ 사이클** (5/10 사이클 25번째 PR) |
| `feedback_image_renderer_paths_separate` | TypeScript 단일 영역 영역 Rust 렌더링 경로 무영향 |
| `feedback_process_must_follow` | 인프라 재사용 (`FormulaDialog` + `inTable` 가드 + 공통 함수 추출) — 신규 인프라 도입 부재 |
| `feedback_visual_judgment_authority` | 단순 stub 활성화 영역 영역 시각 판정 면제 (작업지시자 결정) |

## 10. 잔존 후속

- 본 PR 본질 정정의 잔존 결함 부재

---

작성: 2026-05-10
