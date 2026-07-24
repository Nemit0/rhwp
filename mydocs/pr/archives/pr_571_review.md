---
PR: 571
title: "DIFF update — 문서 비교 (rhwp-studio) + 문서 이력 관리 + 페이지네이션 보조"
author: xogh3198 / thlee2 (rhwp 첫 PR)
base: devel (b84c5e9 — 본 환경 PR #553/562/581/582/583 처리 9 commit 전)
head: 3d23c2b (6 commits — 1 merge 포함)
status: BEHIND (mergeable, 그러나 base skew 로 인한 src/ 회귀 위험 큼)
diff_total: +6,375 / -38 표시 (실제 base diff: +6,423 / -4,182 — deletion 의 대부분이 base skew 의 결과)
CI: 미실행
---

# PR #571 검토 보고서 — 본질 우수 + base skew + 페이지네이션 회귀 위험

**PR**: [#571 DIFF update](https://github.com/edwardkim/rhwp/pull/571)
**작성자**: @xogh3198 (rhwp 첫 PR — 환영) / commit author thlee2
**처리 결정**: ⚠ **수정 요청 (rhwp-studio TS 영역만 cherry-pick + Rust 영역은 별도 사이클 + base 동기화 권장)**

## 1. 처리 결과 요약

| 항목 | 결과 |
|------|------|
| 결정 | rhwp-studio TS 본질 (compare + history) 만 cherry-pick 권장 + Rust 페이지네이션 변경은 별도 PR + 시각 판정 게이트 필수 |
| 사유 | (1) base 가 9 commit 뒤져 PR #555/582/583 의 본질 정정이 src/ deletion 으로 표시 (2) Rust pagination/typeset 의 신규 분기가 시각 회귀 위험 영역 (Task #546/#553/#510/#511 와 동일 본질 영역) (3) `paragraph.rs::stable_id` 가 parser 에서 채우지 않아 dead code 가능성 |
| rhwp-studio 영역 평가 | ✅ 본질 우수 (6,000+ lines, alignment 전략 / IndexedDB 스냅샷 / 한국어 주석 정합) |
| Rust pagination/typeset 영역 평가 | ⚠ 별도 사이클 권장 (시각 판정 게이트 필요) |
| Rust paragraph.rs::stable_id 평가 | ⚠ 활용처 부재 (parser 에서 채우지 않음, 항상 빈 문자열) |

## 2. PR 정보

| 항목 | 값 |
|------|-----|
| 분기점 | `b84c5e9` (PR #553/562/581/582/583 머지 직전) |
| commits | 6 (실제 본질 4 + merge 1 + lock 1) |
| changedFiles | 29 (PR diff stat 기준) |
| 실제 PR 변경 (base 무관) | rhwp-studio TS 약 +6,000 / Rust src 약 +120 |
| Rust 변경 영역 | document_core (3 file) + main.rs + model/paragraph.rs + renderer/pagination/engine.rs + renderer/typeset.rs |
| mergeStateStatus | BEHIND |
| CI | 미실행 |

## 3. 본질 평가 — rhwp-studio 영역 (우수)

### 3.1 compare/ 영역 (신규 6 file)

- `compare/diff-engine.ts` (+2,997 — 주석 포함) — alignment 전략을 다층화:
  1. **글로벌 앵커** (양쪽 문서에서 trim 본문이 정확히 한 번씩 등장하는 문단)
  2. **구간 정렬** (재귀 트리, Patience 핀 + DP/그리디)
  3. **상대 구조 근접** (`|Δleft - Δright| ≤ 2`)
  4. **DP 비용** (전역 라벨 아님, 약매칭 방지 가중치)
- `compare/types.ts` (+118) — `CompareStrategy = 'identity' | 'alignment'` / `CompareAnchorTuning` / `ComparePerformanceTuning` / `CompareOptions`. 도메인 모델 명확.
- `compare/diff-engine-readme.md` (+471) — 한국어 도메인 설명 + 단계별 알고리즘.
- `compare/session.ts` / `compare-debug.ts` / `diff-engine-test.md` — 세션/디버그/테스트 가이드.

### 3.2 history/ 영역 (신규 2 file)

- `history/idb-store.ts` — IndexedDB 스냅샷 (IR JSON) 저장/목록/삭제/버전-vs-현재 비교
- 같은 문서 계열 비교 시 `stable_id` identity 전략, 다른 문서 비교 시 alignment fallback

### 3.3 ui/ 영역 (신규 3 file)

- `compare-dialog.ts` / `compare-result-window.ts` / `history-dialog.ts` — 다이얼로그 + 결과 창 + 이력 목록

### 3.4 평가

**한국어 주석 + 도메인 모델 분리 + alignment 전략 단계화** 모두 정합. 본 프로젝트 스타일에 잘 맞음. 첫 PR 의 모범적 본질.

## 4. 핵심 문제 — base skew + Rust 영역의 잠재 회귀

### 4.1 base skew (9 commit 뒤짐)

본 PR 의 base 는 `b84c5e9` 이고, 그 사이 본 환경 devel 에 9 commit 누적:

| 본 환경 머지 | 본질 |
|-------------|------|
| PR #553 | (rollback) HWP3 Square wrap 보완 — 적용 안 됨 |
| PR #551 Task #544 v2 | 21_언어_기출 글상자 우측 시프트 정정 |
| PR #562 Task #555 | 옛한글 PUA → 자모 폰트 매트릭스 (`composer.rs:920` + `layout.rs:3444/3510/3516/3522` + `table_layout.rs:860/...`) |
| PR #581 | iframe RPC race (`main.ts` initPromise) |
| PR #582 | 분수형 위첨자 베이스라인 (`equation/layout.rs` sup_shift 부호 분기 + 신규 회귀 테스트) |
| PR #583 | 그룹 내 Picture 직렬화 (`serializer/control.rs` + `serializer/control/tests.rs::test_roundtrip_group_picture_child`) |
| PR #558 | npm/editor RPC + Wrapper exportHwpx/exportHwpVerify |

본 PR 의 `aae3c89` merge commit 이 컨트리뷰터의 fork main (Apr 30 시점) 을 가져오면서 **위 본질 정정들을 실질적으로 revert**. 이 결과로 PR diff 에 다음이 deletion 으로 표시:

- `src/renderer/composer/tests.rs` (-69, Task #555 신규 단위 테스트)
- `src/renderer/equation/layout.rs` (-51, PR #582 sup_shift 정정)
- `src/renderer/layout/integration_tests.rs` (-312, 대규모 회귀 묶음)
- `src/renderer/composer.rs` (-16) / `src/renderer/layout.rs` (-28)
- `src/renderer/layout/paragraph_layout.rs` (-41) / `src/renderer/layout/table_layout.rs` (-32)
- `src/serializer/control/tests.rs` (-79, PR #583 신규 라운드트립 테스트)

→ **혀재 PR 을 그대로 머지하면 Task #555/PR #582/PR #583 회귀** (도합 약 -600 lines).

### 4.2 Rust 의도된 변경 영역 (7 file, 약 +120)

| 파일 | 변경 | 본질 |
|------|------|------|
| `src/document_core/commands/document.rs` | +1 | `use_legacy_paginator: false` 필드 초기화 |
| `src/document_core/mod.rs` | +3 | `pub(crate) use_legacy_paginator: bool` 신규 필드 + 초기화 |
| `src/document_core/queries/rendering.rs` | +8/- | JSON 에 `pageNumber` 추가 + `use_legacy_paginator` env 분기 |
| `src/main.rs` | +37 | ir_diff CLI 한국어 주석 보강 (본질 무영향) |
| `src/model/paragraph.rs` | +4 | **`stable_id: String` 필드 추가** (그러나 parser 영역 미변경, 항상 빈 문자열) |
| `src/renderer/pagination/engine.rs` | +44/-7 | `should_reserve_picture_height` 신규 함수 — 그림 높이 예약 결정을 InFront/Behind/Square 차단 + Paper 기준 머리말 영역만 무예약 등 새 분기 도입 |
| `src/renderer/typeset.rs` | +64/-7 | `normalize_floating_only_paragraph_height` 신규 함수 — 비-TAC 부유 도형만 있는 빈 문단의 높이를 0 으로 강제 |

### 4.3 회귀 위험

**`pagination/engine.rs` + `typeset.rs`** 두 파일은 본 환경의 Task #546/#553/#510/#511/#418/#530 등 페이지네이션 본질 영역과 동일.

- `should_reserve_picture_height` 의 새 분기 (Square 항상 예약 안 함 + Paper 기준 본문 위쪽 예약 안 함) 는 본 환경의 기존 동작 (Square 예약함) 과 정합 안 됨 → 본 환경 fixture 13 종 수십 페이지에서 시각 회귀 가능성
- `normalize_floating_only_paragraph_height` 의 빈 문단 높이 0 강제는 메인테이너의 시각 정합 영역과 충돌 가능 (예: Task #553 의 page 4/8 결함이 정확히 "그림 + 빈 문단 배치 영역")

**시각 판정 게이트 필수** — 메모리 `feedback_visual_regression_grows` + `feedback_pdf_not_authoritative` + `reference_authoritative_hancom` 정합.

### 4.4 paragraph.rs::stable_id 의 dead code 가능성

`stable_id: String` 필드가 추가되었으나:
- `new_empty()` + 별도 분할 생성에서 **항상 `String::new()`** 로 초기화
- **HWP/HWPX/HWP3 parser 어디에서도 stable_id 를 채우지 않음** (PR diff 에 parser 영역 변경 없음)
- 본 PR 의 사용처는 rhwp-studio 의 `compare/identity` 전략 — **WASM 으로 노출되어야 하지만 wasm_api.rs 변경 영역 부재**

→ 현재 상태로는 **identity 전략이 실제로 동작 안 함** (모든 stable_id 가 빈 문자열). 본 PR 의 사이클 내에서 parser 영역 + WASM 노출 추가 필수.

## 5. 처리 옵션

### 옵션 A: 전체 머지 (cherry-pick 또는 merge)

- ❌ src/ deletion 600+ lines 회귀
- ❌ Task #555 / PR #582 / PR #583 본질 무효화
- ❌ pagination/typeset 시각 회귀 위험 미검증
- ❌ stable_id 필드만 추가 + 활용처 누락
- 채택 불가

### 옵션 B: rhwp-studio TS 영역만 cherry-pick + Rust 영역 분리

- ✅ compare + history UI 본질 보존 (6,000+ lines 우수)
- ✅ 본 환경 PR #555/582/583 회귀 0
- ⚠ stable_id 활용 안 됨 → identity 전략 미동작 (alignment fallback 만 동작)
- ⚠ 컨트리뷰터의 의도된 Rust 페이지네이션 변경 보류
- 검토 후 채택 권장 — 단, 단순 cherry-pick 으로 처리 시 Rust src 변경이 분리되지 않음 (본 PR 의 commit 들이 Rust + TS 가 섞여 있는지 확인 필요)

### 옵션 C: 컨트리뷰터에게 base 동기화 + 분리 PR 요청 (권장)

- ✅ 컨트리뷰터에게 본 환경 devel 와 base 동기화 후 재 PR 요청
- ✅ rhwp-studio TS 영역 (compare + history) 단독 PR
- ✅ Rust pagination/typeset 변경은 별도 PR (시각 판정 게이트 필요)
- ✅ stable_id 의 parser 채우기 + WASM 노출 보강 후 identity 전략 동작 확인
- ✅ 본 PR close (또는 OPEN 유지하며 컨트리뷰터 응답 대기)

## 6. 권장 결정 — 옵션 C

### 6.1 컨트리뷰터에게 안내할 항목

1. **base 동기화 권장** — fork 의 devel 을 본 환경 devel 와 동기화. 그렇지 않으면 PR #555/582/583 본질 정정이 deletion 으로 들어옴.
2. **PR 분리 권장** — rhwp-studio TS (compare + history) 본질 / Rust pagination 본질 / paragraph.rs stable_id + parser + WASM 노출 본질 — 3 개 PR 분리.
3. **Rust pagination 영역 정합 검증 권장** — 본 환경의 `samples/` 13 fixture 에 대해 PR 적용 전후 SVG 비교, 시각 판정 게이트 통과 필수.
4. **stable_id 활용 보강 권장** — parser 에서 stable_id 생성 + WASM 으로 노출 + studio identity 경로 통합.

### 6.2 close 댓글 톤

- 첫 PR 환영
- rhwp-studio TS 영역 본질 (compare + history) 우수 평가 + alignment 전략 설계 인정
- base skew 로 인한 src/ revert 우려 (PR #553/562/582/583 정합 보존 필수)
- Rust pagination/typeset 변경의 시각 판정 게이트 필요성 안내
- stable_id 의 identity 동작 보강 필요성 안내
- 분리 PR + base 동기화 후 재 PR 요청

## 7. 메모리 정합

- ✅ `feedback_visual_regression_grows` — Rust pagination 변경은 시각 판정 게이트 필요
- ✅ `feedback_v076_regression_origin` — base skew 가 회귀의 origin 패턴
- ✅ `feedback_essential_fix_regression_risk` — 본 PR 단순 채택 시 기존 본질 회귀
- ✅ `feedback_pr_comment_tone` — 첫 PR 환영 + 차분한 사실 중심 + 분리 PR 권장 톤
- ✅ `feedback_per_task_pr_branch` — Task 별 PR 분리 권장 (compare / pagination / stable_id)
- ✅ `feedback_no_pr_accumulation` — base skew 처리는 PR 누적 방지의 핵심

## 8. 본 사이클 사후 처리 (옵션 C 채택 시)

- [ ] PR #571 close 안내 + 분리 PR + base 동기화 권장
- [ ] 본 검토 문서 archives 보관
- [ ] 컨트리뷰터의 재 PR 대기
