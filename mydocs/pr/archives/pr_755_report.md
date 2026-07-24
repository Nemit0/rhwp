---
PR: #755
제목: feat — page:new-page-num (새 번호로 시작) 커맨드 구현
컨트리뷰터: @oksure (Hyunwoo Park) — 20+ 사이클 핵심 컨트리뷰터 (5/10 사이클 22번째 PR 시도)
처리: 옵션 1 — cherry-pick reset + PR close + Issue #791 신규 등록
처리일: 2026-05-10
처리 결과: 본질 결함 발견 영역 영역 close (잘못된 WASM API 호출)
---

# PR #755 처리 보고서

## 1. 처리 결과

❌ **PR close** — 본질 결함 발견 (`setNumberingRestart` 영역 영역 paragraph numbering 영역 영역 페이지 번호 영역 영역 무관)

| 항목 | 값 |
|------|-----|
| 처리 방식 | 옵션 1 — cherry-pick reset + PR close + 별 Issue #791 신규 등록 |
| Cherry-pick reset | `9cb3e1ae` + `6d28d653` 영역 영역 git reset --hard 영역 영역 제거 |
| 작업지시자 시각 검증 결과 | "새 번호로 시작 > 대화창에서 특정 페이지 시작번호를 1로 설정해도 기존 쪽번호 업데이트 되지 않습니다" — 본질 결함 입증 |
| 후속 Issue | #791 신규 등록 — NewNumber 컨트롤 삽입 WASM API + dialog UI |
| 시각 판정 | ❌ 미통과 (페이지 번호 미갱신) |

## 2. 결함 본질

PR #755 의 `setNumberingRestart(sec, para, mode=2, startNum)` 영역 영역 **paragraph numbering** (1.1.1, 가, 나 같은 자동 번호 카운터) 영역 영역 재시작하는 API. **페이지 번호 (쪽번호) 영역 영역 무관**.

### 2.1 두 본질 분리

| 영역 | 의미 | 본 환경 영역 영역 API |
|------|------|----------------------|
| **paragraph numbering** | HWP "번호 매기기" 영역 영역 1.1.1, 가, 나 자동 번호 카운터 | `setNumberingRestart` (본 PR 영역 영역 호출, paragraph numbering 영역 영역 무관) |
| **page number (쪽번호)** | footer 의 "1쪽, 2쪽" 영역 영역 페이지 번호 | `NewNumber` 컨트롤 영역 (model 영역 존재, WASM 삽입 API **부재**) |

### 2.2 본 환경 입증
- `src/document_core/commands/formatting.rs:1141` `set_numbering_restart_native` — `paragraph.numbering_restart = NewStart(N)` 설정만 함
- `src/renderer/layout.rs:96` `advance` — paragraph numbering counter 영역 영역 사용 영역 영역, 페이지 번호 영역 영역 미참조
- `src/renderer/page_number.rs` 영역 영역 `numbering_restart` 미참조 — 페이지 번호 영역 영역 무관 입증
- `NewNumber` 컨트롤 (`src/model/control.rs:38`) 영역 영역 model 영역 존재 영역 영역, **WASM 영역 영역 삽입 API 부재**

## 3. 작업지시자 시각 검증 결과

```
새 번호로 시작 > 대화창에서 특정 페이지 시작번호를 1로 설정해도
기존 쪽번호 업데이트 되지 않습니다.
```

→ 페이지 번호 영역 영역 paragraph numbering 영역 영역 잘못 매핑 영역 영역 결함 입증.

## 4. 처리 결정 — 옵션 1

### 4.1 cherry-pick reset
```bash
git reset --hard 6003a02b  # PR #754 후속 commit (PR #755 직전 상태)
```

### 4.2 PR close + 컨트리뷰터에 본질 결함 보고
- 본질 진단 (paragraph numbering vs page number 분리) 영역 영역 명시
- 본 환경 입증 영역 영역 코드 위치 명시
- 별 PR 권장 방향 (NewNumber 컨트롤 삽입 WASM API) 영역 영역 안내
- 보존 영역 영역 `NumberingRestartDialog` UI + `ModalDialog` 패턴

### 4.3 별 Issue 신규 등록 — Issue #791
`feedback_pr_supersede_chain` (a) 패턴 정합 — PR #755 close + 별 PR 영역 영역 본질 정정.

Issue #791 영역 영역:
- WASM API 신규 — `insertNewNumber(sec, para, startNum)` (paragraph 영역 영역 `Control::NewNumber` 삽입)
- dialog UI — PR #755 의 `NumberingRestartDialog` 패턴 정합 (호출 WASM API 만 변경)
- 시각 검증 — PR #745 NewNumber Page 영역 영역 정합 입증

## 5. 보존 영역 (재사용 자산)

PR #755 의 본질 영역 영역 잘못된 API 호출 영역 영역, UI 인프라 영역 영역 정합:
- `NumberingRestartDialog` 클래스 — 시작 번호 input + 유효성 검사 (NaN / < 1 차단) — 별 PR 영역 영역 재사용
- `ModalDialog` 패턴 정합 — `ColumnSettingsDialog` (PR #750) 동일 패턴

## 6. 메모리 룰 적용

| 룰 | 적용 |
|----|------|
| `feedback_contributor_cycle_check` | @oksure 20+ 사이클 정확 표현 |
| `feedback_pr_supersede_chain` (a) 패턴 | PR #755 close + 별 PR 영역 영역 본질 정정 |
| `feedback_process_must_follow` | 본질 결함 발견 영역 영역 단순 머지 영역 영역 회귀 위험 차단 — close 결정 정합 |
| `feedback_visual_judgment_authority` | **작업지시자 시각 판정 영역 영역 본질 결함 발견 영역 영역 권위 사례** — 머지 전 시각 판정 게이트 영역 영역 회귀 차단 |
| `feedback_pr_comment_tone` | 차분하고 사실 중심 본질 진단 + 코드 위치 명시 + 별 PR 권장 방향 안내 |

## 7. 영향 범위

### 7.1 변경 영역
- 본 환경 영역 영역 cherry-pick reset 영역 영역 변경 부재 (PR #754 후속 상태 보존)

### 7.2 후속 영역
- Issue #791 OPEN — 페이지 번호 새 시작 영역 영역 별 PR 진행

## 8. 학습 — `feedback_visual_judgment_authority` 권위 사례

본 PR 영역 영역 모든 자기 검증 (tsc + cargo test + sweep + WASM 빌드) 통과 영역 영역, **작업지시자 웹 에디터 시각 판정 영역 영역 본질 결함 발견**. 자기 검증 영역 영역 발견 부재 영역 영역 회귀 위험 — 시각 판정 게이트 영역 영역 권위 영역 영역 본 사례 영역 영역 입증.

자기 검증 영역 영역 본질:
- tsc / cargo test / sweep / WASM 빌드 — **API 호출 정합 자체** 영역 영역 검증 (호출 형식, 컴파일, 회귀 부재)
- 시각 판정 — **사용자 의도 영역 영역 동작 정합** 영역 영역 검증 (페이지 번호 갱신 여부)

→ 자기 검증 통과 ≠ 사용자 의도 정합. `feedback_visual_judgment_authority` 영역 영역 권위 입증.

---

작성: 2026-05-10
