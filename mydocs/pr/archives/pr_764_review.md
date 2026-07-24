---
PR: #764
제목: fix — hwpeq inf 기호(∞) 우선순위 복원 (closes #762)
컨트리뷰터: @oksure (Hyunwoo Park) — 20+ 사이클 핵심 컨트리뷰터 (5/10 사이클 27번째 PR — 이전 abandon 후 재시도)
base / head: devel / contrib/fix-inf-symbol-regression
mergeStateStatus: DIRTY
mergeable: CONFLICTING
변경 규모: +771 / -18, 6 files (head commit 만 +36/-7, 1 file)
검토일: 2026-05-10
---

# PR #764 검토

## 1. 메타

| 항목 | 값 |
|------|-----|
| PR 번호 | #764 |
| 제목 | fix — hwpeq inf 기호(∞) 우선순위 복원 |
| 컨트리뷰터 | @oksure — 20+ 사이클 (5/10 27번째 PR, 이전 abandon 후 재시도) |
| base / head | devel / contrib/fix-inf-symbol-regression |
| mergeStateStatus | DIRTY, mergeable: CONFLICTING |
| 변경 규모 (전체 PR) | +771 / -18, 6 files (8 commits 누적 — Task #143 LaTeX 확장 + 후속) |
| **변경 규모 (head commit 만, 본 PR 본질)** | **+36/-7, 1 file (`parser.rs`)** |
| 커밋 수 | 8 (Task #143 commits 7개 + Issue #762 정정 1개) |
| closes | #762 |

## 2. 이전 abandon 본질 (5/10 사이클 시점)

context summary 영역 영역 명시:
- 이전 시도: cherry-pick + WASM 빌드 + Service Worker 캐시 결함 영역 영역 SVG 개선 영역 영역 WASM canvas 영역 영역 미반영 발견
- 작업지시자 결정: "이번 PR 리뷰는 실패입니다. local/devel 로 스위치하고 local/task762 는 삭제합니다."
- abandon 영역 archives 미생성 (검토/처리 보고서 부재)

## 3. 본 PR 의 본질 (Issue #762)

PR #729 (Task #143 LaTeX 호환 확장 1차, 5/9 머지) 영역 영역 회귀:
- `FUNCTIONS` HashMap 영역 `("inf", "inf")` 추가 영역 영역, 기존 hwpeq 영역 `inf` → `∞` 매핑이 함수 텍스트 `"inf"` 영역 영역 대체됨
- `samples/exam_math.hwp` 페이지 14/16 영역 영역 `∞` 기호 영역 영역 `inf` 텍스트 영역 영역 출력

원인: `parser.rs` 영역 영역 `is_function(cmd)` 영역 영역 `lookup_symbol(cmd)` 영역 영역 먼저 점검 → `inf` 영역 영역 함수 텍스트 영역 영역 처리.

## 4. 정정 본질 (head commit `0eed7a3b`)

`src/renderer/equation/parser.rs` 영역 영역 `lookup_symbol` (Unicode 기호 매핑) 영역 영역 `is_function` (함수명 매칭) 영역 영역 먼저 점검:
- `inf` → `lookup_symbol` → `INF` → `∞` (기존 동작 복원)
- `deg` → `lookup_symbol` → `DEG` → `°` (기존 동작 복원)
- `sin`, `cos`, `log` 등 → 기호 테이블 부재 영역 영역 함수 처리 (정합)

### 4.1 회귀 가드 (테스트 2건)
- `test_hwpeq_inf_remains_symbol` — `lim _{n→inf}` 영역 영역 `∞` 출력
- `test_hwpeq_deg_remains_symbol` — `90 deg` 영역 영역 `°` 출력

## 5. 충돌 분석

### 5.1 본질
PR #764 영역 영역 8 commits 누적:
- `d96ddcc4` ~ `0264fe18` (commit 1~5) — Task #143 LaTeX 호환 확장 (PR #729 영역 영역 머지 완료, 5/9)
- `45fdb335` (commit 6) — Task #143 명령어 대폭 확장 (3차)
- `d672f954` + `04187512` (commit 7~8) — overset/underset/stackrel + 이스케이프
- **`0eed7a3b` (head commit) — Issue #762 정정 본질**

devel HEAD 영역 영역 PR #729 (Task #143 1차) 머지 완료 영역 영역 commit 1~5 영역 영역 이미 적용됨. 그러나 commit 6~8 영역 영역 추가 LaTeX 확장 영역 영역 별 본질 (devel 영역 영역 미적용).

### 5.2 처리 옵션

**옵션 A — head commit 만 cherry-pick (Issue #762 정정 본질)**
```bash
git cherry-pick 0eed7a3b
```
- 본 환경 점검: head commit 만 cherry-pick — `parser.rs` +36/-7 영역 영역 auto-merge 정합 (충돌 0건)
- 본 PR 본질 (Issue #762 정정) 영역 영역 정합

**옵션 B — 8 commits 모두 cherry-pick + 충돌 수동 해결**
- commit 1~5 영역 영역 PR #729 영역 영역 이미 devel 영역 영역 동일 본질 영역 영역 충돌 발생 가능성 + empty cherry-pick 가능
- commit 6~8 영역 영역 추가 LaTeX 확장 (Task #143 의 2차/3차 의도)
- 복잡 — 별 PR 영역 영역 분리 권장

**옵션 C — 컨트리뷰터에 PR 정리 요청**
- PR 본문 영역 영역 Issue #762 정정만 명시 (commit 6~8 의 추가 LaTeX 확장 영역 영역 별 본질) — 컨트리뷰터에게 head commit 만 분리 요청 또는 별 PR 분리 요청

## 6. 본 환경 점검

### 6.1 head commit 단일 cherry-pick 시도
- `git cherry-pick 0eed7a3b` → auto-merge 충돌 0건 (`parser.rs` +36/-7 영역 영역 단순 정정)
- 본 PR 본질 (Issue #762 정정) 영역 영역 정합

### 6.2 commit 6~8 영역 영역 별 본질
- 추가 LaTeX 확장 영역 영역 Task #143 의 2차/3차 — 본 PR 본질 (Issue #762 정정) 영역 영역 다른 본질
- PR 본문 영역 영역 명시 부재 영역 영역 의도 불명

### 6.3 이전 abandon 영역 영역 Service Worker 캐시 결함
- 이전 시도 영역 영역 SVG 개선 영역 영역 WASM canvas 영역 영역 미반영 본질 영역 영역 Service Worker 캐시 결함이었음 (context summary)
- 본 PR 영역 영역 동일 결함 영역 영역 다시 발생 가능 — 작업지시자 인터랙션 검증 시 **Service Worker Unregister + Clear site data + hard reload 필수**

## 7. CI

| 항목 | 결과 |
|------|------|
| Build & Test | ❌ 결과 부재 (CI 실행 부재 — DIRTY 상태) |
| 다른 모든 검사 | ❌ 결과 부재 |

CI 미실행 — mergeStateStatus DIRTY 영역 영역 base 갱신 후 CI 실행 필요.

## 8. 처리 옵션 (작업지시자 결정 요청)

### 옵션 1 — 옵션 A 진행 (head commit 만 cherry-pick)
- 본 PR 본질 (Issue #762 정정) 만 적용
- commit 6~8 영역 영역 별 본질 영역 영역 컨트리뷰터에게 별 PR 요청 (명시 안내)

### 옵션 2 — 컨트리뷰터에 PR 정리 요청 (옵션 C)
- PR 본문 영역 영역 Issue #762 정정만 명시 영역 영역 commit 6~8 분리 요청
- abandon 후 신규 PR 등록 요청

### 옵션 3 — 다시 abandon (이전 결정 유지)
- 이전 abandon 결정 (Service Worker 캐시 결함 + local/task762 삭제) 영역 영역 다시 적용
- PR close + 컨트리뷰터에 본질 분리 요청

본 환경 권장 — **옵션 1** (head commit 만 cherry-pick + 자기 검증 + WASM 빌드 + Service Worker 캐시 처리 안내 + 시각 판정).

## 9. 검증 게이트

### 9.1 자기 검증
- [ ] cherry-pick 충돌 0건 (head commit 만, auto-merge 정합 점검 완료)
- [ ] cargo build/test --release ALL GREEN
- [ ] 회귀 가드 테스트 2건 PASS (test_hwpeq_inf_remains_symbol + test_hwpeq_deg_remains_symbol)
- [ ] cargo clippy --release -- -D warnings 통과
- [ ] 광범위 sweep — 7 fixture / 170 페이지 회귀 0
- [ ] WASM 빌드 (Docker, 재빌드)

### 9.2 시각 판정 게이트 — **WASM 빌드 + 작업지시자 인터랙션 검증 + Service Worker 캐시 처리 필수**

본 PR 본질 영역 영역 hwpeq 수식 렌더링 영역 영역 시각 정합:
- WASM 빌드 후 dev server 영역 영역:
  - **Service Worker Unregister + Clear site data + hard reload** (이전 abandon 영역 영역 캐시 결함 회피)
  - `samples/exam_math.hwp` 페이지 14/16 영역 영역 `∞` 기호 출력 (PR #729 회귀 정정)
  - 다른 hwpeq 수식 영역 영역 `sin`/`cos`/`log` 등 함수 정상 출력 (회귀 부재)

## 10. 메모리 룰 적용

| 룰 | 적용 |
|----|------|
| `feedback_contributor_cycle_check` | @oksure 20+ 사이클 (5/10 27번째 PR, 이전 abandon 후 재시도) |
| `feedback_image_renderer_paths_separate` | hwpeq 영역 영역 svg + canvas + skia 영역 영역 동기 정정 (canvas_render.rs +5/-1, parser 영역 영역 공통) |
| `feedback_pr_supersede_chain` (c) 패턴 | PR #729 (Task #143 1차) 머지 후 회귀 정정 영역 영역 별 PR (Issue #762) — 동일 패턴 |
| `feedback_process_must_follow` | head commit 만 cherry-pick — 본질 분리 (Issue #762 만), commit 6~8 영역 영역 별 PR 요청 |
| `feedback_visual_judgment_authority` | 작업지시자 시각 판정 영역 영역 이전 abandon 영역 영역 권위 사례 (Service Worker 캐시 결함 발견) — 본 환경 영역 영역 동일 결함 회피 영역 영역 캐시 처리 안내 필수 |
| `feedback_self_verification_not_hancom` | 회귀 가드 테스트 2건 + 광범위 sweep — 자기 검증 + 시각 판정 게이트 |

## 11. 처리 순서 (승인 후, 옵션 1 영역)

1. `local/devel` 영역 cherry-pick `0eed7a3b` (head commit 만, auto-merge 정합 예상)
2. 자기 검증 (cargo build/test/clippy + 회귀 가드 2건 + 광범위 sweep)
3. WASM 빌드 (Docker, 재빌드)
4. 작업지시자 인터랙션 검증 (**Service Worker 캐시 처리 후** + samples/exam_math.hwp 페이지 14/16 영역 `∞` 기호)
5. 시각 판정 통과 → no-ff merge + push + archives + 5/10 orders + Issue #762 close
6. 컨트리뷰터에 commit 6~8 (Task #143 추가 LaTeX 확장) 영역 영역 별 PR 안내 (PR comment)

---

작성: 2026-05-10
