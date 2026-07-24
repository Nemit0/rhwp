---
PR: #757
제목: feat — 표 셀 숫자 서식 커맨드 구현 (천 단위 구분, 자릿점 넣기/빼기)
컨트리뷰터: @oksure (Hyunwoo Park) — 20+ 사이클 핵심 컨트리뷰터 (5/10 사이클 23번째 PR)
base / head: devel / contrib/table-number-format
mergeStateStatus: DIRTY
mergeable: CONFLICTING — PR #754 영역 영역 누적 (table.ts blockCalcCommand 영역 영역 인접 영역)
CI: SUCCESS (Build & Test + CodeQL js/ts/py/rust + Canvas visual diff)
변경 규모: +103 / -3, 1 file
검토일: 2026-05-10
---

# PR #757 검토

## 1. 메타

| 항목 | 값 |
|------|-----|
| PR 번호 | #757 |
| 제목 | feat — 표 셀 숫자 서식 커맨드 구현 |
| 컨트리뷰터 | @oksure — 20+ 사이클 (5/10 사이클 23번째 PR) |
| base / head | devel / contrib/table-number-format |
| mergeStateStatus | **DIRTY**, mergeable: CONFLICTING — PR #754 누적 |
| CI | ✅ Build & Test + CodeQL (js/ts/py/rust) + Canvas visual diff 통과 |
| 변경 규모 | +103 / -3, 1 file |
| 커밋 수 | 2 (feat + Copilot 리뷰) |
| Issue 연결 | 부재 (표 메뉴 stub 활성화 영역 자기완결) |

## 2. 결함 본질

표 메뉴 영역 영역 3 stub 영역 영역 미동작:
- `table:thousand-sep` — 천 단위 구분 쉼표 토글
- `table:decimal-add` — 자릿점 1자리 추가
- `table:decimal-remove` — 자릿점 1자리 제거

## 3. 채택 접근 — read-modify-write 패턴

전용 WASM 포맷 API 부재 영역 영역 텍스트 기반 변환:
1. `getCellParagraphLength` → 셀 텍스트 길이
2. `getTextInCell` → 셀 텍스트 조회
3. 정규식 영역 영역 숫자 파싱 (`^([+-]?)(\d+)(\.?\d*)$`) + 재포맷 (천 단위 구분 영역 영역 `\B(?=(\d{3})+(?!\d))/g, ','`)
4. `deleteTextInCell` + `insertTextInCell` 영역 영역 변환 적용
5. `document-changed` emit

PR 본문 명시: "한컴 오피스의 실제 동작과 동일한 텍스트 기반 변환 방식".

## 4. 인프라 재사용

| 인프라 | 활용 |
|--------|------|
| `getCellParagraphLength` WASM API (기존) | 셀 텍스트 길이 조회 |
| `getTextInCell` WASM API (기존) | 셀 텍스트 조회 |
| `deleteTextInCell` WASM API (기존) | 기존 텍스트 제거 |
| `insertTextInCell` WASM API (기존) | 변환된 텍스트 삽입 |
| `inTable` 가드 (기존) | `canExecute` 가드 |

→ 신규 인프라 도입 부재.

## 5. PR 의 정정 — 1 file, +103/-3

`rhwp-studio/src/command/commands/table.ts` 영역 영역 3 stub → 실제 구현 변환:

### 5.1 `table:thousand-sep` (1,000 단위 구분 쉼표)
- 현재 셀 숫자 텍스트 영역 영역 천 단위 쉼표 추가/제거 토글
- 부호 (`+`/`-`), 소수점 보존
- 정규식: `^([+-]?)(\d+)(\.?\d*)$`

### 5.2 `table:decimal-add` (자릿점 넣기)
- 소수점 자릿수 1자리 추가 (예: `123` → `123.0`, `123.4` → `123.40`)
- 기존 천 단위 쉼표 서식 보존

### 5.3 `table:decimal-remove` (자릿점 빼기)
- 소수점 자릿수 1자리 제거 (예: `123.40` → `123.4`, `123.0` → `123`)
- 소수점 부재 영역 영역 미적용
- 기존 천 단위 쉼표 서식 보존

## 6. Copilot 리뷰 반영 (commit `4af5e393`)
- 숫자 유효성 검증 강화
- `cellParaIndex` 사용 (기존 0 하드코딩 영역 영역 → `pos.cellParaIndex ?? 0`)

## 7. 충돌 분석

### 7.1 본질
PR #757 base = `30351cdf` (5/9 시점). devel HEAD 영역 영역 PR #754 (5/10 머지) 영역 영역 동일 영역 영역 stub 3 개 (block-sum/avg/product) 영역 영역 `blockCalcCommand` 변환 영역 영역 누적.

### 7.2 충돌 영역
table.ts 영역 영역 stub 6 개 영역 영역:
```
HEAD (PR #754):                              | incoming (PR #757):
blockCalcCommand('table:block-sum', ...),    | stub('table:block-sum', ..., 'Ctrl+Shift+S'),
blockCalcCommand('table:block-avg', ...),    | stub('table:block-avg', ..., 'Ctrl+Shift+A'),
blockCalcCommand('table:block-product', ...),| stub('table:block-product', ..., 'Ctrl+Shift+P'),
stub('table:thousand-sep', ...),             | { id: 'table:thousand-sep', ... 신규 구현 },
stub('table:decimal-add', ...),              | { id: 'table:decimal-add', ... 신규 구현 },
stub('table:decimal-remove', ...),           | { id: 'table:decimal-remove', ... 신규 구현 },
```

### 7.3 해결 방식
**HEAD blockCalcCommand 3 줄 보존 + incoming 신규 3 구현 보존** — 양쪽 모두 의도 정합 (PR #754 + PR #757 영역 영역 다른 영역 영역 다른 stub 활성화).

수동 해결:
```typescript
blockCalcCommand('table:block-sum', '블록 합계', 'SUM', 'Ctrl+Shift+S'),  // PR #754 보존
blockCalcCommand('table:block-avg', '블록 평균', 'AVERAGE', 'Ctrl+Shift+A'),  // PR #754 보존
blockCalcCommand('table:block-product', '블록 곱', 'PRODUCT', 'Ctrl+Shift+P'),  // PR #754 보존
{ id: 'table:thousand-sep', ..., 신규 구현 },  // PR #757
{ id: 'table:decimal-add', ..., 신규 구현 },  // PR #757
{ id: 'table:decimal-remove', ..., 신규 구현 },  // PR #757
```

## 8. 본 환경 점검

### 8.1 변경 격리
- TypeScript 단일 파일 (rhwp-studio editor)
- Rust / WASM / 렌더링 경로 무관 (`feedback_image_renderer_paths_separate` 정합)

### 8.2 CI 결과
- Build & Test ✅
- CodeQL (js/ts/py/rust) ✅
- Canvas visual diff ✅
- WASM Build SKIPPED (변경 무관)

### 8.3 의도적 제한
- **read-modify-write 영역 영역 SnapshotCommand 미경유** → Ctrl+Z Undo 동작 점검 필요 (PR #754 와 동일 점검 영역)
- 정규식 영역 영역 단일 숫자 영역 영역 ([+-]?\d+\.?\d*) — 복합 텍스트 (예: "1234원") 영역 영역 미지원

## 9. 처리 옵션

### 옵션 A — 2 commits 개별 cherry-pick + 충돌 수동 해결 + no-ff merge

```bash
git checkout local/devel
git cherry-pick 10b0ebdb  # 충돌 발생 (table.ts)
# 수동 해결: HEAD blockCalcCommand 3 줄 + incoming 신규 3 구현 보존
git add rhwp-studio/src/command/commands/table.ts
git cherry-pick --continue
git cherry-pick 4af5e393  # Copilot 리뷰 (cellParaIndex)
git checkout devel
git merge local/devel --no-ff
```

→ **권장**.

## 10. 검증 게이트

### 10.1 자기 검증
- [ ] cherry-pick 충돌 수동 해결 (table.ts blockCalcCommand 3 줄 + 신규 3 구현 보존)
- [ ] `cargo build --release` 통과
- [ ] `cargo test --release` ALL GREEN
- [ ] `cd rhwp-studio && npx tsc --noEmit` 통과
- [ ] 광범위 sweep — 7 fixture / 170 페이지 회귀 0

### 10.2 시각 판정 게이트 — **WASM 빌드 + 작업지시자 인터랙션 검증 권장**

본 PR 본질은 **rhwp-studio editor 표 셀 숫자 서식 인터랙션**:
- WASM 빌드 후 dev server 영역 영역:
  - 표 셀 영역 영역 숫자 입력 → 메뉴 → "표 → 1,000 단위 구분 쉼표" → 토글
  - "표 → 자릿점 넣기" → 소수점 1자리 추가
  - "표 → 자릿점 빼기" → 소수점 1자리 제거
  - 부호 / 천 단위 쉼표 / 소수점 보존 정합
  - **Ctrl+Z Undo 동작 점검** — read-modify-write 영역 영역 SnapshotCommand 미경유 영역 영역 결함 가능

## 11. 메모리 룰 적용

| 룰 | 적용 |
|----|------|
| `feedback_contributor_cycle_check` | @oksure 20+ 사이클 (5/10 사이클 23번째 PR) |
| `feedback_image_renderer_paths_separate` | TypeScript 단일 영역 영역 Rust 렌더링 경로 무영향 |
| `feedback_process_must_follow` | 인프라 재사용 (`getCellParagraphLength` + `getTextInCell` + `deleteTextInCell` + `insertTextInCell` + `inTable` 가드) — 신규 인프라 도입 부재 |
| `feedback_visual_judgment_authority` | rhwp-studio editor 인터랙션 영역 영역 작업지시자 인터랙션 검증 권장 (Ctrl+Z Undo 점검 포함) |

## 12. 처리 순서 (승인 후)

1. `local/devel` 영역 영역 옵션 A cherry-pick + 충돌 수동 해결
2. 자기 검증 (cargo test + tsc + 광범위 sweep)
3. WASM 빌드 + 작업지시자 인터랙션 검증 (3 커맨드 + 부호/쉼표/소수점 보존 + Ctrl+Z Undo 점검)
4. 인터랙션 검증 통과 → no-ff merge + push + archives 이동 + 5/10 orders 갱신
5. PR #757 close

---

작성: 2026-05-10
