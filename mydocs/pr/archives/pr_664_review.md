---
PR: #664
제목: rhwp-studio: 드래그 선택 하이라이트 오버플로우 수정
컨트리뷰터: @postmelee (Taegyu Lee)
base: devel (BEHIND)
mergeable: MERGEABLE
CI: ALL SUCCESS
변경: +1345/-67, 15 files (5 commits)
처리: cherry-pick + WASM 빌드 (작업지시자 직접 결정)
처리일: 2026-05-08
---

# PR #664 1차 검토 보고서

## 1. 메타 정보

| 항목 | 값 |
|------|-----|
| PR 번호 | #664 |
| 제목 | rhwp-studio: 드래그 선택 하이라이트 오버플로우 수정 |
| 컨트리뷰터 | @postmelee (Taegyu Lee) |
| base / head | devel / feature/task658-selection-drag-fix |
| mergeStateStatus | BEHIND |
| mergeable | MERGEABLE |
| CI | Build & Test / CodeQL / Canvas visual diff — ALL SUCCESS |
| 변경 규모 | +1345 / -67, 15 files |
| 커밋 수 | 5 (4 Task commits + 1 merge — merge 영역 cherry-pick 영역 제외) |
| closes | #658 |
| 후속 분리 | #661 (드래그 시작 영역 영역 커서/스크롤 위치 튐 영역) → PR #718 영역 |
| 직전 영역 | PR #663 (CLOSED 5/7 — 동일 제목 영역 영역 컨트리뷰터 재제출 영역) |

## 2. Issue #658 본질

`samples/exam_social.hwp` 영역의 드래그 선택 하이라이트 영역이 실제 텍스트/페이지 폭 영역을 넘어 확장 영역.

### 원인
선택 rect 계산 영역의 시작/끝 오프셋 영역 모두 동일한 렌더 트리 hit 탐색 영역 사용 영역. 줄바꿈 경계 영역에서 같은 문자 오프셋 영역이 이전 줄 TextRun 영역의 끝 영역과 다음 줄 TextRun 영역의 시작 영역에 동시에 걸리는 영역 — 선택 시작점 영역이 이전 줄 끝 좌표 영역으로 해석 영역되면서 하이라이트 영역이 오른쪽으로 과도하게 확장 영역.

## 3. PR 의 정정

### 본질 정정 영역

| 영역 | 정정 |
|------|------|
| `src/document_core/queries/cursor_nav.rs` | 선택 rect 시작/끝 위치 영역의 cursor hit bias 영역 추가 (+118/-53 LOC) |
| `rhwp-studio/src/engine/selection-renderer.ts` | highlight div 영역 재사용 + 동일 rect 반복 렌더링 skip (+50/-13) |
| `rhwp-studio/src/engine/caret-renderer.ts` | 드래그 영역 caret 업데이트 영역 가벼운 처리 영역 경로 (+15) |
| `rhwp-studio/src/engine/input-handler.ts` | 드래그 영역 caret 처리 영역 (+22) |
| `tests/issue_658_text_selection_rects.rs` | 회귀 테스트 영역 (2 케이스, +113) |
| `examples/inspect_658_selection.rs` | 진단 영역 도구 (+122) |

### 컨트리뷰터 측정 영역
- 선택 rect 최대 오른쪽 경계: **956.6px**
- 페이지 폭: **1028.0px**
- 선택 레이어 노드 풀 재사용: **18 → 3 → 0 visible nodes** (전체 노드 수 증가 영역 부재)

## 4. 본 환경 cherry-pick simulation

### 4.1 깨끗한 적용
- `local/pr664-sim` 브랜치, 4 commits cherry-pick (merge commit `b1b18c26` 영역 제외)
- **충돌 0건** (`orders/20260507.md` 영역 자동 머지)

### 4.2 결정적 검증
- `cargo test --release` → ALL PASS, failed 0건
- `cargo test --release --test issue_658_text_selection_rects` → **2/2 passed**
  - `issue_658_exam_social_body_multiline_selection_uses_next_line_start` ✅
  - `issue_658_exam_social_data_cell_selection_rects_do_not_overflow_page` ✅
- `cargo test --release --lib` → 1165 passed (회귀 0)
- TypeScript 빌드 (`npx tsc --noEmit`) → clean
- `cargo clippy --release` → clean

### 4.3 머지 + WASM 빌드
- `local/devel` 영역에 4 commits 단계별 보존 no-ff merge 완료 (merge commit `c6bf769e`)
- WASM 빌드 완료 (`pkg/rhwp_bg.wasm` 4,584,723 bytes, 17:05 갱신)

## 5. 검토 관점

### 5.1 작업지시자 직접 결정 영역
작업지시자 명시 영역: "체리픽한 후, wasm 빌드해주세요. 이건은 메인테이너도 하려고 했던 작업입니다."

→ 본 PR 영역은 **메인테이너 영역도 하려던 작업** 영역 — 빠른 cherry-pick + WASM 빌드 영역의 진행 영역의 정합 영역.

### 5.2 컨트리뷰터 절차 정합
@postmelee 영역의 다회 사이클 영역 컨트리뷰터 영역 (PR #339 / #437 / #510 / #531 / #642 / #663 close → #664 재제출 / #718 후속).

TDD Stage 1~4 영역 절차 정합:
- Stage 1: 본질 정밀 측정 + 회귀 테스트 영역
- Stage 2: 선택 rect line 경계 영역 정정 (cursor hit bias)
- Stage 3: DOM churn 영역 정정 (highlight div 재사용)
- Stage 4: 최종 보고서

### 5.3 회귀 위험성
- Rust 측 변경 영역: `src/document_core/queries/cursor_nav.rs` 영역의 본질 정정 영역 (+118/-53 LOC)
- 회귀 테스트 영역의 단위 영역 보장 영역
- 1165 lib + issue_658 2/2 통과 영역
- TypeScript 측 영역의 변경 영역은 rhwp-studio 영역 영역만 영역 (Rust 영역 무영향)

→ 결정적 검증 영역 통과 영역. 시각 판정 영역에서 드래그 선택 영역 동작 영역 직접 확인 영역 필요.

## 6. 메모리 룰 관점

### `feedback_visual_judgment_authority`
> 메인테이너 시각 판정 영역의 권위 사례

→ 본 PR 영역의 핵심 게이트 영역 — 드래그 선택 영역의 시각 동작 영역의 작업지시자 직접 영역 점검 영역.

### `feedback_pr_supersede_chain`
→ 본 PR 영역은 PR #663 close 영역 (동일 제목, 5/7) 영역의 재제출 영역. 그러나 close 사유 영역의 본문 영역의 정량 영역 부재 → 단순 재제출 영역 가능성 영역. close + 재제출 영역의 패턴 영역 (re-submit, not supersede).

## 7. 작업지시자 결정 요청 — 시각 검증

### 시각 검증 대상
**파일**: `samples/exam_social.hwp`

### 핵심 케이스
| 케이스 | 결함 | 정정 후 기대 |
|--------|------|--------------|
| 본문 multiline 드래그 선택 | 선택 시작점 영역이 이전 줄 끝 좌표로 해석 → 페이지 폭 오버플로우 | 다음 줄 시작 좌표 영역의 정합 → 페이지 폭 안 fit |
| 표 셀 드래그 선택 | 동일 본질 영역 | 다음 줄 시작 좌표 영역 정합 |
| DOM churn 영역 | 매 frame 영역 highlight div 영역 재생성 | div 재사용 영역 + 동일 rect skip |

### 검증 절차
1. http://localhost:7700 접속 (Ctrl+Shift+R)
2. `samples/exam_social.hwp` 로드
3. 본문 영역 multiline 드래그 선택 → 하이라이트 영역이 페이지 폭 안 정합
4. 표 셀 영역 드래그 선택 → 셀 경계 안 정합
5. 드래그 영역의 DOM 노드 영역 churn 영역 부재 (개발자 도구 영역의 영역 점검 영역)

검증 결과 알려주시면 최종 보고서 + Issue #658 close + devel push + archives 이동 진행하겠습니다.

작성: 2026-05-08
