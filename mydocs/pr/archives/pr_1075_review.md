# PR #1075 검토 — F3 문장 단계 확장 추가 (한컴 5단계 정합)

## 1. PR 정보

| 항목 | 값 |
|------|-----|
| 번호 | #1075 |
| 제목 | feat: F3 문장 단계 확장 추가 — 한컴 5단계 정합 (#839) |
| 작성자 | oksure (Hyunwoo Park) — 기존 컨트리뷰터 (#971/#1074) |
| base ← head | `devel` ← `contrib/f3-sentence-expansion` |
| 연결 이슈 | Closes #839 (PR #811 후속), assignee 본인 지정 완료 |
| mergeable | MERGEABLE / BEHIND (cherry-pick 으로 해소) |
| CI | Build & Test ✅ / Analyze ✅ / Canvas diff ✅ / CodeQL ✅ |
| 커밋 | 2 (55704674 feat + 4db8aec5 Copilot 피드백) |

## 2. 배경 (이슈 #839)

PR #811 에서 F3 영역 확장 4단계(단어→문단→구역→문서) 구현. 한컴
표준은 **5단계 (단어→문장→문단→구역→문서)** — 문장 단계 누락.
본 PR 이 문장 phase 추가로 한컴 정합.

## 3. 변경 내용

**순수 rhwp-studio TS**, `cursor.ts` 단일 파일.

### 3.1 `findSentenceAt(text, offset)` 신규
- `SENTENCE_TERMINATORS = Set(['.', '?', '!', '。', '？', '！'])`
- 양방향 확장: 이전 종결부호 직후 → 현재 종결부호+1
- 선행 공백 skip, **후행 공백 제외** (Copilot 피드백 반영)

### 3.2 `expandSelection` phase 시프트
- 기존: 1=word, 2=paragraph, 3=section, 4=document
- 신규: 1=word, **2=sentence(신규)**, 3=paragraph, 4=section, 5=document(cap)

## 4. 검토 의견

### 4.1 강점

- **한컴 표준 5단계 정합** (이슈 #839 목표 정확 달성).
- 패턴 일관: `findWordAt` 와 동일한 양방향 확장 방식 →
  유지보수 부담 낮음.
- 한/영/CJK 종결부호 6종(. ? ! 。 ？ ！) 명시적 Set 분리 —
  향후 확장 용이.
- 문단 경계 내에서만 동작 (한컴 동작과 일치).
- **Copilot 피드백 자체 반영** (4db8aec5): 후행 공백 제외로
  한컴 표준 동작에 더 가까움. 자체 리뷰 성숙.

### 4.2 검토 포인트

- **PR 본문 표와 코드 불일치**: 본문은 "종결부호 + 후행 공백
  포함" 으로 적혀 있으나 Copilot 피드백 반영 후 코드는 **후행
  공백 제외**. 코드가 정답(한컴 표준 동작과 정합). 본문 갱신
  누락일 뿐 — 보고서에 기록.
- **단위 테스트 없음**: `tests/` 에 F3/expandSelection 테스트 없음
  (PR #811 도 동일했을 가능성). 동작 본질이라 수동 검증
  (PR 본문의 5단계 시나리오) 의존.
- 순수 프론트엔드 — Rust/WASM 영향 없음.

## 5. 검증 계획

- [ ] cherry-pick (`55704674` + `4db8aec5` → 최신 devel)
- [ ] TS 단위 (strip-types) + `npm run build`
- [ ] Rust 영향 없음 확인 (변경 파일 cursor.ts 한정)
- [ ] 동작 검증: F3 5단계 시나리오 — 구조적 검증 충분.
      본질이 표시 아닌 편집 동작이라 시각 판정 부담 낮음.

## 6. 판단 (잠정)

한컴 5단계 정합 + 기존 `findWordAt` 패턴 일관 + Copilot 피드백
자체 반영. 본질이 표시·시각 아닌 편집 동작 → 빌드/타입 통과 +
구조 검증으로 충분. 단위 테스트 부재는 PR #811 부터의 영역 잔존 사항 — 본 PR 단독
원인 아님. 검증 통과 시 수용 권고.

검증 결과에 따라 `pr_1075_report.md` 작성.