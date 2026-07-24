---
PR: #759
제목: feat — table:block-formula 블록 계산식 커맨드 구현
컨트리뷰터: @oksure (Hyunwoo Park) — 20+ 사이클 핵심 컨트리뷰터 (5/10 사이클 25번째 PR)
base / head: devel / contrib/table-block-formula
mergeStateStatus: DIRTY
mergeable: CONFLICTING — PR #754 영역 영역 인접 영역
CI: SUCCESS
변경 규모: +21 / -14, 1 file
검토일: 2026-05-10
---

# PR #759 검토

## 1. 메타

| 항목 | 값 |
|------|-----|
| PR 번호 | #759 |
| 제목 | feat — table:block-formula 블록 계산식 커맨드 구현 |
| 컨트리뷰터 | @oksure — 20+ 사이클 (5/10 사이클 25번째 PR) |
| base / head | devel / contrib/table-block-formula |
| mergeStateStatus | **DIRTY**, mergeable: CONFLICTING — PR #754 인접 영역 |
| CI | ✅ Build & Test + CodeQL + Canvas visual diff 통과 |
| 변경 규모 | +21 / -14, 1 file |
| 커밋 수 | 2 (feat + Copilot 리뷰) |
| Issue 연결 | 부재 (표 메뉴 stub 활성화 영역 자기완결) |

## 2. 결함 본질

`table:block-formula` (블록 계산식) stub 영역 영역 미동작. PR 본문 명시: "한컴 오피스에서도 '블록 계산식'과 '계산식'은 동일한 대화상자를 공유".

## 3. 채택 접근 — 기존 `FormulaDialog` 재사용

기존 `table:formula` (계산식) 영역 영역 `FormulaDialog` 호출 영역 영역 동일 — `openFormulaDialog` 공통 함수 (Copilot 리뷰 영역 영역 추출) 영역 영역 두 커맨드 영역 영역 호출.

## 4. 인프라 재사용

| 인프라 | 활용 |
|--------|------|
| `FormulaDialog` (기존, `@/ui/formula-dialog`) | 계산식 / 블록 계산식 영역 영역 동일 대화상자 |
| `inTable` 가드 (기존) | `canExecute` 가드 |
| `openFormulaDialog` 공통 함수 (Copilot 리뷰 영역 영역 추출) | 두 커맨드 영역 영역 호출 |

→ 신규 인프라 도입 부재.

## 5. PR 의 정정 — 1 file, +21/-14

`rhwp-studio/src/command/commands/table.ts`:
- `openFormulaDialog` 공통 함수 신규 (Copilot 리뷰 영역 영역 추출 — `table:formula` 본문 영역 영역 위임)
- `stub('table:block-formula', '블록 계산식')` → 실제 구현 (`FormulaDialog` 호출)
- `table:formula` 영역 영역 `openFormulaDialog(services)` 영역 영역 위임 (중복 제거)

## 6. Copilot 리뷰 반영 (commit `6caa14ba`)
계산식 대화상자 공통 함수 추출 — `openFormulaDialog`. `table:formula` + `table:block-formula` 동일 호출 패턴 영역 영역 중복 제거.

## 7. 충돌 분석

### 7.1 본질
PR #759 base = `30351cdf` (5/9 시점). devel HEAD 영역 영역 PR #754 (5/10 머지) 영역 영역 동일 위치 영역 영역:
```
HEAD (PR #754): blockCalcCommand('table:block-sum', ...),
                blockCalcCommand('table:block-avg', ...),
                blockCalcCommand('table:block-product', ...),
                stub('table:thousand-sep', ...) → PR #757 영역 영역 활성화 → 본 PR 영역 영역 PR #757 머지 후 영역
                ...
incoming (본 PR): stub('table:block-sum', ...) ← PR #754 와 다름
                  ...
                  + table:block-formula 활성화
```

또한 PR #757 (5/10 머지) 영역 영역 thousand-sep / decimal-add / decimal-remove 활성화 영역 영역 누적.

### 7.2 해결 방식
- HEAD 의 PR #754 + #757 영역 영역 표 커맨드 보존
- incoming 의 `openFormulaDialog` 공통 함수 + `table:formula` 위임 + `table:block-formula` 활성화 영역 영역 추가

수동 해결 영역 영역 위치 — `table:block-formula` 만 stub → 실제 구현 변환 + `table:formula` 영역 영역 `openFormulaDialog` 위임.

## 8. 본 환경 점검

### 8.1 변경 격리
- TypeScript 단일 파일 (rhwp-studio editor)
- Rust / WASM / 렌더링 경로 무관

### 8.2 CI 결과
- 모두 ✅

### 8.3 의도적 제한
- `block-formula` 영역 영역 `FormulaDialog` 영역 영역 동일 — 한컴 오피스 정합 (PR 본문 명시)
- 별 영역 — `block-sum/avg/product` (PR #754) / `thousand-sep`/`decimal-add`/`decimal-remove` (PR #757) 영역 영역 다른 커맨드

## 9. 처리 옵션

### 옵션 A — 2 commits 개별 cherry-pick + 충돌 수동 해결 + no-ff merge

```bash
git checkout local/devel
git cherry-pick d4b9dd2c  # 충돌 가능
# 수동 해결: HEAD PR #754/#757 보존 + incoming openFormulaDialog 공통 함수 + table:block-formula 활성화
git cherry-pick --continue
git cherry-pick 6caa14ba  # Copilot 리뷰
git checkout devel
git merge local/devel --no-ff
```

→ **권장**.

## 10. 검증 게이트

### 10.1 자기 검증
- [ ] cherry-pick 충돌 수동 해결
- [ ] tsc + cargo test ALL GREEN
- [ ] 광범위 sweep 170/170 same

### 10.2 시각 판정 게이트
- 메뉴 → "표 → 블록 계산식" → FormulaDialog 표시
- 메뉴 → "표 → 계산식" → 동일 FormulaDialog (중복 제거 정합)
- 매우 단순 — 시각 판정 면제 가능 (작업지시자 결정)

## 11. 메모리 룰 적용

| 룰 | 적용 |
|----|------|
| `feedback_contributor_cycle_check` | @oksure 20+ 사이클 (5/10 25번째 PR) |
| `feedback_image_renderer_paths_separate` | TypeScript 단일 영역 영역 Rust 렌더링 경로 무영향 |
| `feedback_process_must_follow` | 인프라 재사용 (`FormulaDialog` + `inTable` 가드 + 공통 함수 추출) — 신규 인프라 도입 부재 |
| `feedback_visual_judgment_authority` | 단순 stub 활성화 영역 영역 시각 판정 면제 가능 (작업지시자 결정) |

## 12. 처리 순서 (승인 후)

1. `local/devel` 영역 영역 옵션 A cherry-pick + 충돌 수동 해결
2. 자기 검증 (cargo test + tsc + 광범위 sweep)
3. (선택) WASM 빌드 + 작업지시자 인터랙션 검증 — 단순 stub 활성화 영역 영역 면제 가능
4. 검증 통과 → no-ff merge + push + archives 이동 + 5/10 orders 갱신
5. PR #759 close

---

작성: 2026-05-10
