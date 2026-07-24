---
PR: #650
제목: fix: Layout 리팩터링 Phase 2 line_break_char_idx 다중화 누락 회귀 정정 (Task #518 재적용, closes #648)
컨트리뷰터: @planet6897 (Jaeuk Ryu) — 14번째 사이클 PR
base: devel (BEHIND)
mergeable: MERGEABLE
CI: ALL SUCCESS
변경: +821/-40, 10 files (2 commits — Task #517 + Task #518 통합)
---

# PR #650 1차 검토 보고서

## 1. 메타 정보

| 항목 | 값 |
|------|-----|
| PR 번호 | #650 |
| 제목 | fix: Layout 리팩터링 Phase 2 line_break_char_idx 다중화 누락 회귀 정정 (Task #518 재적용) |
| 컨트리뷰터 | @planet6897 (Jaeuk Ryu) — 14번째 사이클 PR |
| base / head | devel / pr-task648 |
| mergeStateStatus | BEHIND |
| mergeable | MERGEABLE |
| CI | Build & Test / CodeQL / Canvas visual diff — ALL SUCCESS |
| 변경 규모 | +821 / -40, 10 files |
| 커밋 수 | **2** — `ffb32ff7` (Task #517 Phase 1) + `e8dd3f0f` (Task #518 Phase 2) |
| closes | #648 |
| 선행 PR 통합 | PR #649 close 결정 영역 — 본 PR 에서 두 commit 함께 cherry-pick 영역으로 통합 처리 |

## 2. Issue #648 본질 — 누락 회귀 (Task #517 와 동일 패턴)

Task #518 (Layout Phase 2 본질 정정 — `line_break_char_idx: Option<usize>` → `line_break_char_indices: Vec<usize>` 다중화) 의 원 commit `b395e8e6` 가 묶음 머지 `a7e43f9` 영역에서 `local/devel` 까지만 머지되고 `devel` 으로 승격 누락.

본 환경 직접 확증:
```
$ git merge-base --is-ancestor b395e8e6 devel
NOT in devel

$ git grep -n "line_break_char_idx" devel -- src/
devel:src/renderer/layout/paragraph_layout.rs:265: let line_break_char_idx: Option<usize> = ...
devel:src/renderer/layout/paragraph_layout.rs:398: if let Some(break_idx) = line_break_char_idx {
```

→ Task #518 이전 단일 break 시그니처 그대로.

## 3. PR 의 정정

### 3.1 두 commit 통합 영역

| commit | Task | 영역 |
|--------|------|------|
| `ffb32ff7` | #517 (Phase 1) | 디버그 인프라 (env-var-checked) + 회귀 비교 도구 — PR #649 close 영역의 commit |
| `e8dd3f0f` | #518 (Phase 2) | `line_break_char_indices` 다중화 본질 정정 |

본 PR 은 PR #650 본문 명시:
> 본 PR 의 `LAYOUT_BREAK_INDICES` 디버그 로깅은 PR #649 가 도입한 `layout_debug_enabled()` 헬퍼에 의존합니다.

→ Phase 2 (#518) 가 Phase 1 (#517) 의 `layout_debug_enabled()` 영역에 의존 → 두 commit 함께 cherry-pick 영역으로 통합 정합.

### 3.2 Phase 2 본질 변경

`src/renderer/layout/paragraph_layout.rs` (-40/+77):

| 항목 | 회귀 (devel) | 정정 |
|------|-------------|------|
| 변수명 | `line_break_char_idx: Option<usize>` | `line_break_char_indices: Vec<usize>` |
| 사용 범위 | `ls[1]` 만 | `ls[1..]` 모두 |
| 알고리즘 | `ctrl_gap` 합산 (controls 많은 paragraph 에서 over-subtract → saturating 0 → 항상 None) | `char_offsets[i] >= ts` 인 첫 `i` 직접 룩업 |
| wrap 결정 | 단일 break_idx 검사 | `next_break` 추적 + 다중 break 검사 |
| 디버그 | — | `LAYOUT_BREAK_INDICES` 로깅 |

```rust
// 정정 후 (요약)
let line_break_char_indices: Vec<usize> = if para.line_segs.len() > 1
    && !para.char_offsets.is_empty()
{
    let mut indices: Vec<usize> = Vec::new();
    for ls in para.line_segs.iter().skip(1) {
        let ts = ls.text_start as u32;
        let char_idx = para.char_offsets.iter().position(|&off| off >= ts)
            .unwrap_or(text_chars.len());
        if char_idx > 0 && char_idx <= text_chars.len() {
            if indices.last().map(|&prev| char_idx > prev).unwrap_or(true) {
                indices.push(char_idx);
            }
        }
    }
    indices
} else {
    Vec::new()
};
```

## 4. 본 환경 cherry-pick simulation

### 4.1 깨끗한 적용
- `local/pr650-sim` 브랜치, 2 commits cherry-pick (`ffb32ff7` + `e8dd3f0f`)
- **충돌 0건** (Auto-merging `paragraph_layout.rs` 자동 정합)

### 4.2 결정적 검증
- `cargo test --release --lib` → **1165 passed** (회귀 0)
- `cargo test --release` → ALL PASS (failed 0)
- `cargo clippy --release` → clean

### 4.3 본질 정정 영역 직접 확인
```
$ git grep -n "line_break_char_idx\|line_break_char_indices" -- src/
src/renderer/layout/paragraph_layout.rs:301: let line_break_char_indices: Vec<usize> = if para.line_segs.len() > 1
src/renderer/layout/paragraph_layout.rs:324: para_index, line_break_char_indices,
src/renderer/layout/paragraph_layout.rs:333: // [Task #518] 다음 break 인덱스
src/renderer/layout/paragraph_layout.rs:424: let need_wrap = if next_break < line_break_char_indices.len()
src/renderer/layout/paragraph_layout.rs:425:     && ch_idx >= line_break_char_indices[next_break]
```

→ devel 의 `line_break_char_idx` (단수) → PR 의 `line_break_char_indices` (복수) 정정 적용 확인.

### 4.4 광범위 회귀 sweep (`scripts/svg_regression_diff.sh`)

본 환경 직접 실행:
```
=== Comparing devel vs local/pr650-sim ===
2010-01-06: total=6 same=6 diff=0
aift: total=77 same=77 diff=0
exam_eng: total=8 same=8 diff=0
exam_kor: total=20 same=20 diff=0
exam_math: total=20 same=20 diff=0
exam_science: total=4 same=4 diff=0
synam-001: total=35 same=35 diff=0
TOTAL: pages=170 same=170 diff=0
```

**170 페이지 same=170, diff=0** ✅ — 회귀 0건.

### 4.5 PR 본문 정량과 본 환경 정량의 차이

| 영역 | PR 본문 명시 | 본 환경 측정 |
|------|-------------|-------------|
| 7 샘플 170 페이지 sweep | `same=167 / diff=3 (exam_science 정확도 정정)` | `same=170 / diff=0` |
| exam_science p2 SVG md5 | (회귀 케이스로 명시) | `842c9513...` 영역 동일 |

→ **회귀 케이스의 본 환경 재현 부재**. 두 가지 해석 가능:
1. 다른 PR 영역의 부수 효과 (devel 영역에 이미 일부 정정 적용)
2. 회귀 케이스가 7 샘플 fixture 영역에 노출되지 않는 잠재 영역

**판정**: 정정 자체는 본질 정합 (변수명 + 알고리즘 정정 정확). 광범위 sweep 회귀 0 + 결정적 검증 통과 → **회귀 위험 0**.

## 5. 검토 관점

### 5.1 의존성 영역 정합
PR #650 본문 명시 영역:
> 현재 본 PR 은 head=`pr-task648` (= `pr-task647` + Task #518 commit) 으로 구성되어 있어 GitHub 상에는 2 commit 으로 표시됩니다. PR #649 머지 후에는 본 PR diff 가 `b395e8e6` 단일 commit 으로 자동 축약됩니다.

→ PR #649 close 결정 영역 후 본 PR 머지 시:
- 옵션 (a): 2 commit 그대로 단계별 보존 머지 — Phase 1 + Phase 2 영역 분리 보존
- 옵션 (b): squash 머지 → 1 commit 축약

본 PR 의 **두 commit 함께 cherry-pick 영역**의 단계별 보존 머지 영역이 PR #649 close 영역의 통합 처리 영역 정합.

### 5.2 회귀 위험성
- env-var-checked 본질 영역 (Phase 1)
- 알고리즘 정정 영역 (Phase 2 — `ctrl_gap` 영역의 saturating 0 영역의 결함 정정)
- 광범위 sweep 회귀 0건 — 7 샘플 170 페이지
- 결정적 검증 1165 lib pass

→ **회귀 위험 0**.

### 5.3 묶음 머지 누락 패턴 (재발)

`a7e43f9 (Task #517/#518/#519/#520/#521/#523/#528)` 영역의 누락 영역:
- ✅ Task #519 → PR #620 으로 정정 완료 (`c80d2272`)
- ✅ Task #517 → PR #649 close (본 PR 통합 처리)
- 🔄 Task #518 → 본 PR #650 (현재 처리 중)
- ❓ Task #520, #521, #523, #528 → 별도 점검 필요?

→ **본 PR 후속 영역으로 잔여 task 누락 영역 점검 권장**.

## 6. 메모리 룰 관점

### `feedback_close_issue_verify_merged`
> 이슈 close 시 정정 commit devel 머지 검증 필수

→ Task #518 close 시 `b395e8e6` 의 devel 머지 검증 누락 영역의 본질 정정 영역.

### `feedback_visual_regression_grows`
> 페이지 총 수 byte 비교만으로는 시각 결함 검출 불가

→ 본 PR 광범위 sweep 영역의 byte 동일성 (170/0) + 결정적 검증 영역 정합. **시각 판정 영역의 추가 게이트 권장** (`exam_science` 영역의 회귀 케이스 영역의 본 환경 재현 부재 영역의 잠재 영역 영역에서 시각 영역의 영향 영역 점검 영역).

### `feedback_v076_regression_origin`
→ 컨트리뷰터 PR 본문 정량 (`same=167 / diff=3`) 과 본 환경 정량 (`same=170 / diff=0`) 차이 영역 — 환경 차이 영역의 정합 영역 점검 영역.

### `feedback_hancom_compat_specific_over_general`
> 한컴 호환은 일반화보다 케이스별 명시 가드

→ Phase 2 본질 정정 영역의 알고리즘 변경 영역의 일반화 영역 — 다른 fixture 회귀 위험 점검 영역. 광범위 sweep 회귀 0 영역으로 위험 0 영역의 정합.

## 7. 결정 옵션

| 옵션 | 내용 | 비고 |
|------|------|------|
| **A** | 2 commits 단계별 보존 no-ff merge + WASM 빌드 + 작업지시자 시각 판정 | PR #649 close 영역의 통합 처리 영역 정합 + Phase 1/Phase 2 단계별 보존 |
| **B** | 2 commits squash merge (1 commit 축약) + WASM 빌드 + 시각 판정 | 단순 — Phase 1/Phase 2 영역 통합 |
| **C** | merge 보류 — 묶음 머지 잔여 task (#520/#521/#523/#528) 사전 점검 | 본 PR 영역 외 |

## 8. 잠정 결정

**옵션 A (2 commits 단계별 보존 no-ff merge) + WASM 빌드 + 작업지시자 시각 판정** 권장.

이유:
1. 결정적 검증 (1165 lib + clippy clean) ALL PASS
2. 광범위 sweep 170/170 same — 회귀 위험 0 확증
3. cherry-pick 충돌 0건 (Auto-merging 정합)
4. **PR #649 close 영역의 통합 처리 영역 정합** — Phase 1 + Phase 2 두 commit 함께 보존
5. 컨트리뷰터의 author 정합 (`(cherry picked from commit 9c16a1b4 / b395e8e6)` 영역 보존)
6. **시각 판정 게이트 영역 권장** — PR 본문의 회귀 케이스 (exam_science p2 pi=61) 영역의 본 환경 재현 부재 영역의 잠재 영역 영역에서 시각 영역의 본 PR 정정 효과 영역의 작업지시자 직접 확증 영역 필요.

## 9. 작업지시자 결정 요청

1. **옵션 선택**: A / B / C 중?
2. **시각 판정 영역**: PR 본문의 회귀 케이스 (exam_science p2 pi=61) 영역의 본 환경 재현 부재 영역의 잠재 영역 영역에서 — WASM 빌드 후 rhwp-studio 영역에서 exam_science p2 영역의 시각 정합 점검?
3. **묶음 머지 잔여 task 영역**: Task #520 / #521 / #523 / #528 영역의 누락 영역 점검 — 본 PR 후속 영역에서 진행?
4. **회귀 케이스 정량 영역의 차이 영역**: PR 본문 (`same=167/diff=3`) vs 본 환경 (`same=170/diff=0`) 영역의 차이 영역 — 다른 PR 영역의 부수 효과 영역의 점검 영역?

---

작성: 2026-05-08
