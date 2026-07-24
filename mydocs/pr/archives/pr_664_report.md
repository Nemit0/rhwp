---
PR: #664
제목: rhwp-studio: 드래그 선택 하이라이트 오버플로우 수정
컨트리뷰터: @postmelee (Taegyu Lee)
처리: MERGE (4 commits 단계별 보존 no-ff merge — 작업지시자 직접 결정)
처리일: 2026-05-08
---

# PR #664 최종 보고서

## 1. 결정

**4 commits 단계별 보존 no-ff merge** + WASM 빌드 + 작업지시자 시각 판정 ★ 통과.

merge commit: `c6bf769e`

작업지시자 직접 결정: "체리픽한 후, wasm 빌드해주세요. 이건은 메인테이너도 하려고 했던 작업입니다."

## 2. 본 환경 검증 결과

### 2.1 cherry-pick simulation
- `local/pr664-sim` 브랜치, 4 commits cherry-pick (merge commit `b1b18c26` 영역 제외)
- **충돌 0건** (`orders/20260507.md` 영역 자동 머지)

### 2.2 결정적 검증
- `cargo test --release` → ALL PASS, failed 0건
- `cargo test --release --test issue_658_text_selection_rects` → **2/2 passed**
  - `issue_658_exam_social_body_multiline_selection_uses_next_line_start` ✅
  - `issue_658_exam_social_data_cell_selection_rects_do_not_overflow_page` ✅
- `cargo test --release --lib` → 1165 passed (회귀 0)
- TypeScript 빌드 (`npx tsc --noEmit`) → clean
- `cargo clippy --release` → clean

### 2.3 시각 검증
- WASM 빌드 완료 (`pkg/rhwp_bg.wasm` 4,584,723 bytes)
- 작업지시자 시각 판정: **★ 통과**
  - 작업지시자 인용: "PR 에서 해결하려고 했던 문제가 웹 에디터를 통해 해결되었다는 것을 확인했습니다."
  - `samples/exam_social.hwp` 영역의 드래그 선택 하이라이트 영역의 페이지 폭 안 정합 영역 확인

## 3. 본질 정정의 정확성

### 본질 정정 영역

| 영역 | 정정 |
|------|------|
| `src/document_core/queries/cursor_nav.rs` | 선택 rect 시작/끝 위치 영역의 cursor hit bias 영역 추가 (+118/-53 LOC) — 줄바꿈 경계 영역 영역 같은 문자 오프셋 영역 영역 이전 줄 끝 vs 다음 줄 시작 영역 구분 |
| `rhwp-studio/src/engine/selection-renderer.ts` | highlight div 재사용 + 동일 rect 반복 렌더링 skip (+50/-13) |
| `rhwp-studio/src/engine/caret-renderer.ts` | 드래그 영역 caret 업데이트 영역 가벼운 처리 영역 경로 (+15) |
| `rhwp-studio/src/engine/input-handler.ts` | 드래그 영역 caret 처리 영역 (+22) |

### 회귀 차단 가드 영역
- `tests/issue_658_text_selection_rects.rs` (신규, 2 케이스, +113)
- `examples/inspect_658_selection.rs` (진단 도구, +122)

### 컨트리뷰터 측정 영역
- 선택 rect 최대 오른쪽 경계: **956.6px**
- 페이지 폭: **1028.0px**
- 선택 레이어 노드 풀 재사용: **18 → 3 → 0** visible nodes (전체 노드 수 증가 영역 부재)

## 4. 컨트리뷰터 절차 정합

@postmelee (Taegyu Lee) 영역의 다회 사이클 영역 컨트리뷰터:
- PR #339 (Firefox AMO) — MERGED
- PR #437, #510, #531, #642 — CLOSED
- **PR #663 (CLOSED 5/7) → PR #664 (재제출)** — 동일 제목 영역의 재제출 영역
- **PR #718 (OPEN)** — Task #661 (드래그 시작 영역 영역 커서/스크롤 위치 튐 영역) 후속 영역 분리 영역

TDD Stage 1~4 영역 절차 정합:
- Stage 1: 본질 정밀 측정 + 회귀 테스트 (RED)
- Stage 2: 선택 rect line 경계 영역 정정 (cursor hit bias)
- Stage 3: DOM churn 영역 정정 (highlight div 재사용)
- Stage 4: 최종 보고서

## 5. 메모리 룰 적용 결과

### `feedback_visual_judgment_authority`
> 메인테이너 시각 판정 영역의 권위 사례

→ 본 PR 영역의 드래그 선택 영역의 시각 동작 영역의 작업지시자 직접 영역 점검 영역의 정합 영역. WASM 빌드 영역 + 시각 판정 ★ 통과 영역 정합.

### `feedback_v076_regression_origin`
→ 컨트리뷰터 환경 영역 (로컬 웹 계측) + 작업지시자 환경 영역 (rhwp-studio dev server) 모두 시각 판정 통과 영역.

## 6. 후속 영역 분리

| Issue | 본질 | 상태 |
|-------|------|------|
| #661 | 드래그 시작 영역 영역 커서/스크롤 위치 튐 영역 (Task #658 후속) | PR #718 OPEN — 컨트리뷰터 영역의 자체 분리 영역 |

본 PR 영역과 별건 영역. 컨트리뷰터 영역의 깔끔한 분리 영역의 정합 영역.

## 7. 산출물

| 산출물 | 경로 |
|--------|------|
| 검토 보고서 | `mydocs/pr/archives/pr_664_review.md` |
| 최종 보고서 | `mydocs/pr/archives/pr_664_report.md` (본 문서) |
| merge commit | `c6bf769e` (no-ff, 4 commits 단계별 보존) |
| 회귀 차단 가드 | `tests/issue_658_text_selection_rects.rs` (2 케이스) |
| 진단 도구 영구 보존 | `examples/inspect_658_selection.rs` |

## 8. 컨트리뷰터 응대

@postmelee 안내:
- 본질 정정 정확 (cursor hit bias 영역의 줄바꿈 경계 영역 정합 + DOM churn 영역 정정)
- 본 환경 결정적 검증 통과 (issue_658 2/2 + 1165 lib)
- 작업지시자 시각 판정 ★ 통과 — exam_social.hwp 영역의 드래그 선택 하이라이트 영역 정합
- TDD Stage 1~4 영역 + 후속 영역 분리 영역 (#661 → PR #718) 영역 절차 정합
- merge 결정

작성: 2026-05-08
