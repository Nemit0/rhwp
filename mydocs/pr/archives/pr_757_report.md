---
PR: #757
제목: feat — 표 셀 숫자 서식 커맨드 구현 (천 단위 구분, 자릿점 넣기/빼기)
컨트리뷰터: @oksure (Hyunwoo Park) — 20+ 사이클 핵심 컨트리뷰터 (5/10 사이클 23번째 PR)
처리: 옵션 A — 2 commits cherry-pick + 충돌 수동 해결 + no-ff merge
처리일: 2026-05-10
머지 commit: 0eac69b2
---

# PR #757 처리 보고서

## 1. 처리 결과

✅ **머지 완료** — 옵션 A (2 commits cherry-pick + 충돌 수동 해결 + no-ff merge)

| 항목 | 값 |
|------|-----|
| 머지 commit | `0eac69b2` (--no-ff merge) |
| Cherry-pick commits | `4de92a83` (feat, 충돌 수동 해결) + `3da7f204` (Copilot 리뷰) |
| Issue 연결 | 부재 (표 메뉴 stub 활성화 영역 자기완결) |
| 시각 판정 | ✅ 작업지시자 웹 에디터 인터랙션 검증 통과 |
| 자기 검증 | tsc + cargo test ALL GREEN + sweep 170/170 same + WASM 4.68 MB 재빌드 |

## 2. 정정 본질 — 1 file, +103/-3

`rhwp-studio/src/command/commands/table.ts` 영역 영역 3 stub → read-modify-write 패턴 변환:

| 커맨드 | 동작 |
|--------|------|
| `table:thousand-sep` | 천 단위 구분 쉼표 추가/제거 토글 (부호 + 소수점 보존) |
| `table:decimal-add` | 소수점 1자리 추가 (천 단위 쉼표 보존) |
| `table:decimal-remove` | 소수점 1자리 제거 (천 단위 쉼표 보존, 소수점 부재 영역 영역 미적용) |

read-modify-write 패턴:
1. `getCellParagraphLength` → 셀 텍스트 길이
2. `getTextInCell` → 셀 텍스트 조회
3. 정규식 영역 영역 숫자 파싱 + 재포맷 (`\B(?=(\d{3})+(?!\d))/g, ','`)
4. `deleteTextInCell` + `insertTextInCell` 영역 영역 변환 적용
5. `document-changed` emit

## 3. Copilot 리뷰 반영 (commit `3da7f204`)
- 숫자 유효성 검증 강화
- `cellParaIndex` 사용 (하드코딩 0 → `pos.cellParaIndex ?? 0`)

## 4. 인프라 재사용

| 인프라 | 활용 |
|--------|------|
| `getCellParagraphLength` WASM API (기존) | 셀 텍스트 길이 조회 |
| `getTextInCell` WASM API (기존) | 셀 텍스트 조회 |
| `deleteTextInCell` WASM API (기존) | 기존 텍스트 제거 |
| `insertTextInCell` WASM API (기존) | 변환된 텍스트 삽입 |
| `inTable` 가드 (기존) | `canExecute` 가드 |

→ 신규 인프라 도입 부재 (`feedback_process_must_follow` 정합).

## 5. 충돌 수동 해결

### 5.1 본질
PR #757 base = `30351cdf` (5/9 시점). devel HEAD 영역 영역 PR #754 (5/10 머지) 영역 영역 동일 영역 영역 stub 3 개 (block-sum/avg/product) 영역 영역 `blockCalcCommand` 변환 영역 영역 누적.

### 5.2 해결
HEAD 의 blockCalcCommand 3 줄 보존 + incoming 의 신규 3 구현 보존 — 양쪽 모두 의도 정합 (PR #754 + PR #757 영역 영역 다른 stub 활성화).

```typescript
blockCalcCommand('table:block-sum', ...),        // PR #754 보존
blockCalcCommand('table:block-avg', ...),        // PR #754 보존
blockCalcCommand('table:block-product', ...),    // PR #754 보존
{ id: 'table:thousand-sep', ..., 신규 구현 },   // PR #757
{ id: 'table:decimal-add', ..., 신규 구현 },    // PR #757
{ id: 'table:decimal-remove', ..., 신규 구현 }, // PR #757
```

## 6. 본 환경 검증

| 검증 | 결과 |
|------|------|
| `cherry-pick` (2 commits) | ✅ (1차 충돌 — 양측 보존 수동 해결) |
| `tsc --noEmit` (rhwp-studio) | ✅ 통과 |
| `cargo test --release` | ✅ ALL GREEN |
| 광범위 sweep (7 fixture / 170 페이지) | ✅ **170 same / 0 diff** |
| WASM 빌드 (Docker, 재빌드) | ✅ 4.68 MB |

## 7. 작업지시자 웹 에디터 인터랙션 검증 ✅ 통과
- 표 셀 영역 영역 천 단위 구분 쉼표 토글
- 자릿점 넣기 / 빼기 동작
- 부호 (`+`/`-`) + 쉼표 + 소수점 보존 정합

## 8. 영향 범위

### 8.1 변경 영역
- rhwp-studio editor 영역 영역 표 커맨드 (TypeScript 단일 파일)

### 8.2 무변경 영역
- WASM 코어 (Rust) — 변경 부재 (기존 WASM API 재호출만)
- HWP3/HWPX 변환본 시각 정합 (sweep 170/170 same 입증)

## 9. 의도적 제한 / 점검 영역

- **read-modify-write 영역 영역 SnapshotCommand 미경유** → Ctrl+Z Undo 동작 결함 가능 (PR #754 와 동일 점검 영역, 별 후속 task)
- 정규식 영역 영역 단일 숫자 영역 영역 (`[+-]?\d+\.?\d*`) — 복합 텍스트 (예: "1234원") 영역 영역 미지원

## 10. 메모리 룰 적용

| 룰 | 적용 |
|----|------|
| `feedback_contributor_cycle_check` | @oksure **20+ 사이클** (5/10 사이클 23번째 PR) |
| `feedback_image_renderer_paths_separate` | TypeScript 단일 영역 영역 Rust 렌더링 경로 무영향 |
| `feedback_process_must_follow` | 인프라 재사용 (read-modify-write 패턴 + 기존 WASM API + inTable 가드) — 신규 인프라 도입 부재 |
| `feedback_visual_judgment_authority` | 작업지시자 웹 에디터 인터랙션 검증 ✅ 통과 |

## 11. 잔존 후속

- 본 PR 본질 정정의 잔존 결함 부재
- (점검 항목) Ctrl+Z Undo 동작 — read-modify-write 영역 영역 SnapshotCommand 미경유 영역 영역 결함 가능 영역 영역 별 후속 task (PR #754 와 동일 본질)

---

작성: 2026-05-10
