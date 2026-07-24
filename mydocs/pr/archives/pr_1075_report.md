# PR #1075 최종 보고 — F3 문장 단계 확장 (한컴 5단계 정합)

## 1. 결정

**merge** — 한컴 5단계 정합 + 검증 통과 + Copilot 피드백 자체 반영.

| 항목 | 값 |
|------|-----|
| 번호 | #1075 |
| 제목 | feat: F3 문장 단계 확장 추가 — 한컴 5단계 정합 (#839) |
| 작성자 | oksure (Hyunwoo Park) — 기존 컨트리뷰터 (#971/#1074) |
| base ← head | `devel` ← `contrib/f3-sentence-expansion` |
| 연결 이슈 | Closes #839 (PR #811 후속) |
| 처리 | cherry-pick (`55704674` + `4db8aec5` → 최신 local/devel) |

## 2. 검증 결과

cherry-pick `d6f4766e` + `fe5bd4b1`. 충돌 없음.

| 항목 | 결과 |
|------|------|
| cherry-pick | ✅ 충돌 없음 |
| TS 단위 테스트 (strip-types) | ✅ 30 passed, 0 failed |
| `npm run build` (rhwp-studio) | ✅ 성공 (TypeScript 컴파일 OK) |
| Rust 영향 | ✅ 없음 (변경 cursor.ts 단일 파일) |
| CI | ✅ 전부 pass |

## 3. 평가 요약

### 강점
- **한컴 표준 5단계 정합**: 1=word → 2=**sentence(신규)** →
  3=paragraph → 4=section → 5=document(cap).
- 기존 `findWordAt` 패턴과 동일한 양방향 확장 → 유지보수 일관.
- 한/영/CJK 종결부호 6종(`.?!。？！`) Set 분리. 문단 경계 내 동작
  (한컴 일치).
- **Copilot 피드백 자체 반영** (4db8aec5): 후행 공백 제외로 한컴
  표준에 더 가까움. 자체 리뷰 성숙.

### 기록 사항
- **PR 본문과 코드 불일치 (사소)**: 본문 표는 "종결부호 + 후행
  공백 포함" 으로 적혀 있으나 Copilot 피드백 반영 후 코드는
  **후행 공백 제외**. **코드가 정답** (한컴 표준 정합), 본문
  갱신 누락. 동작에 영향 없음.
- **F3/expandSelection 단위 테스트 없음**: PR #811 부터의 잔존
  사항(본 PR 단독 원인 아님). 본질이 편집 동작이라 빌드/타입
  통과로 구조 검증 충분.

## 4. 처리

- cherry-pick → 검증 통과 → `local/devel` merge
- PR #1075 close (cherry-pick 반영 명시) + 이슈 #839 close
- `pr_1075_review.md` / `pr_1075_report.md` → `pr/archives/`
