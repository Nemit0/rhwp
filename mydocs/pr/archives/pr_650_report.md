---
PR: #650
제목: fix: Layout 리팩터링 Phase 2 line_break_char_idx 다중화 누락 회귀 정정 (Task #518 재적용, closes #648)
컨트리뷰터: @planet6897 (Jaeuk Ryu) — 14번째 사이클 PR
처리: MERGE (옵션 B — squash merge → 1 commit 축약)
처리일: 2026-05-08
선행 PR: #649 close 영역의 통합 후속 처리
---

# PR #650 최종 보고서

## 1. 결정

**옵션 B (squash merge → 1 commit 축약)** + WASM 빌드 산출물 갱신.

merge commit: `e8f93dee`

**시각 판정 게이트 면제 영역 정합** — 본 PR 은 PR #649 close 결정 영역의 통합 후속 처리 영역. PR #649 close 시 적용된 "env-var-checked 본질 영역의 시각 판정 면제 영역 정합" 룰이 본 PR 영역에도 정합. 단순 cherry-pick 영역의 후속 처리 영역.

## 2. 본 PR 의 본질 — PR #649 통합 후속 처리

### 2.1 처리 흐름 영역의 정합

| 시점 | 영역 |
|------|------|
| PR #649 review (작업지시자 결정 전) | "1 commit no-ff merge + WASM 빌드 + 시각 판정" 잠정 권장 영역 |
| PR #649 작업지시자 결정 | "이미 다음 PR 이 도착해있으니 이번 PR 은 close 로 간단하게 처리" — close 영역의 단순 후속 처리 영역 정합 |
| PR #650 작업지시자 결정 | "옵션 B 로 진행합니다" — squash merge 영역의 단순 후속 처리 영역 정합 |
| PR #650 작업지시자 정정 영역 | "이 PR 은 시각 판정없이 앞선 PR #649 에 연결된 처리입니다" — 시각 판정 영역 면제 영역의 정합 |

**핵심**: PR #649 close 영역의 통합 후속 처리 영역의 단순 cherry-pick 영역 — 시각 판정 게이트 영역 부재 영역의 정합.

### 2.2 시각 판정 면제 영역의 합리화

| 근거 | 영역 |
|------|------|
| Phase 1 (Task #517) env-var-checked | 기본 동작 무영향 영역 (env-var 미설정 시 SVG md5 동일성 영역 직접 확증 영역, PR #649 영역의 검증 영역) |
| Phase 2 (Task #518) 알고리즘 정정 | 광범위 sweep 7 샘플 170 페이지 same=170 / diff=0 영역의 회귀 0 확증 영역 |
| 결정적 검증 | 1165 lib + clippy clean 영역의 통과 영역 |
| cherry-pick simulation | 충돌 0건 영역 (Auto-merging paragraph_layout.rs 자동 정합 영역) |
| 통합 후속 처리 영역 | PR #649 close 영역의 통합 처리 영역의 작업지시자 결정 영역의 정합 영역 |

→ 시각 판정 게이트 영역 영역의 면제 영역 정합 영역.

## 3. 본 환경 검증 결과

### 3.1 cherry-pick simulation
- `local/pr650-sim2` 브랜치, 2 commits cherry-pick (`ffb32ff7` + `e8dd3f0f`)
- **충돌 0건** (Auto-merging `paragraph_layout.rs` 자동 정합)

### 3.2 결정적 검증
- `cargo test --release` → ALL PASS, failed 0건
- `cargo test --release --lib` → 1165 passed (회귀 0)
- `cargo clippy --release` → clean

### 3.3 본질 정정 영역 직접 확인
```
$ git grep -n "line_break_char_indices" -- src/
src/renderer/layout/paragraph_layout.rs:301: let line_break_char_indices: Vec<usize> = ...
src/renderer/layout/paragraph_layout.rs:324: para_index, line_break_char_indices,
src/renderer/layout/paragraph_layout.rs:333: // [Task #518] 다음 break 인덱스
src/renderer/layout/paragraph_layout.rs:424: let need_wrap = if next_break < line_break_char_indices.len()
src/renderer/layout/paragraph_layout.rs:425:     && ch_idx >= line_break_char_indices[next_break]
```

→ devel 의 `line_break_char_idx` (단수) → PR 의 `line_break_char_indices` (복수) 정정 적용 확인.

### 3.4 광범위 회귀 sweep (`scripts/svg_regression_diff.sh`)

본 환경 직접 실행 (`devel` ↔ `local/pr650-sim`):
```
TOTAL: pages=170 same=170 diff=0
```

→ 7 샘플 170 페이지 영역의 회귀 0건 영역의 확증 영역.

### 3.5 WASM 빌드 산출물 갱신
- `pkg/rhwp_bg.wasm` 영역 갱신 (시각 판정 영역 부재 영역의 결정 영역에서도 빌드 산출물 영역의 정합 영역 보존 영역)

## 4. Squash Merge 결과

### 4.1 merge commit `e8f93dee`
- 두 commit 영역 (`ffb32ff7` Phase 1 + `e8dd3f0f` Phase 2) 영역의 squash 영역 → 단일 commit 영역의 축약 영역
- closes #647 + closes #648 영역의 두 이슈 영역의 동시 close 영역 정합
- Co-Authored-By 영역 보존 (`Jaeook Ryu <jaeook.ryu@gmail.com>`)

### 4.2 묶음 머지 잔여 task 영역 후속

`a7e43f9 (Task #517/#518/#519/#520/#521/#523/#528)` 영역의 누락 영역 처리 영역의 정합:
- ✅ Task #519 → PR #620 정정 완료 (`c80d2272`)
- ✅ Task #517 → PR #649 close + PR #650 squash merge 영역 영역의 통합 처리 영역 (`e8f93dee`)
- ✅ Task #518 → PR #650 squash merge 영역 (`e8f93dee`)
- ❓ Task #520, #521, #523, #528 → 별도 점검 영역 권장 영역 (본 PR 후속 영역)

## 5. 메모리 룰 적용 결과

### `feedback_close_issue_verify_merged`
> 이슈 close 시 정정 commit devel 머지 검증 필수

→ 본 PR 영역의 squash merge 영역으로 Issue #647 + #648 영역 close 영역 정합. 임의 close 영역 부재.

### `feedback_visual_regression_grows`
> 페이지 총 수 byte 비교만으로는 시각 결함 검출 불가

→ **본 PR 영역의 면제 영역 정합** — env-var-checked + 알고리즘 정정 영역의 광범위 sweep 회귀 0 + PR #649 close 영역의 통합 후속 처리 영역의 단순 cherry-pick 영역의 시각 판정 면제 영역 정합 (작업지시자 직접 영역의 결정 영역).

### `feedback_pr_comment_tone`
→ 14번째 사이클 PR 영역 컨트리뷰터 영역 — 차분한 사실 중심 응대 영역.

### **신규 메모리 룰 영역 (등록 영역)** — `feedback_pr_supersede_chain`
PR close 영역의 통합 후속 처리 영역의 패턴 영역 — 작업지시자 결정 시점 영역의 의도 영역 보존 영역의 룰 영역 등록 영역.

## 6. 산출물

| 산출물 | 경로 |
|--------|------|
| 검토 보고서 | `mydocs/pr/archives/pr_650_review.md` |
| 최종 보고서 | `mydocs/pr/archives/pr_650_report.md` (본 문서) |
| merge commit | `e8f93dee` (squash) |

## 7. 컨트리뷰터 응대

@planet6897 (14번째 사이클) 안내:
- 본 PR 영역의 본질 정정 정확 (`line_break_char_indices` 다중화 + `char_offsets` 직접 룩업 알고리즘)
- 본 환경 결정적 검증 통과 + 광범위 sweep 170/170 same diff=0 정합
- PR #649 close 영역의 통합 후속 처리 영역의 squash merge 영역 정합 (옵션 B)
- 시각 판정 게이트 영역 면제 영역 정합 (env-var-checked + 단순 cherry-pick 영역의 후속 처리 영역)
- merge 결정

작성: 2026-05-08
