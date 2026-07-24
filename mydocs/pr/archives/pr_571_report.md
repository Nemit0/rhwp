---
PR: 571
title: "DIFF update — 문서 비교 (rhwp-studio) + 문서 이력 관리 + 페이지네이션 보조"
author: xogh3198 (rhwp 첫 PR — commit author thlee2)
processed: 2026-05-04
result: closed (옵션 C — 분리 PR + base 동기화 권장)
---

# PR #571 처리 보고서 — 옵션 C (분리 PR + base 동기화 권장)

**처리일**: 2026-05-04
**결정**: ✅ close + 분리 PR + base 동기화 권장 댓글
**컨트리뷰터**: @xogh3198 (rhwp 첫 PR)

## 1. 본질

문서 비교 (compare) + 이력 관리 (IndexedDB) + 페이지네이션 보조 (pagination/typeset 신규 함수 2 + paragraph.rs::stable_id 필드).

| 영역 | 평가 |
|------|------|
| rhwp-studio TS (compare + history + ui) | ✅ 우수 (+6,000 lines, alignment 다층화, 한국어 주석 정합) |
| Rust pagination/typeset 신규 함수 | ⚠ 시각 판정 게이트 필요 |
| paragraph.rs::stable_id | ⚠ parser+WASM 노출 부재 → identity 전략 미동작 |

## 2. 핵심 문제 — base skew

PR base = `b84c5e9` (본 환경 devel 의 9 commit 전). 그 사이 머지된 PR #553/551/562/581/582/583/558 의 본질 정정이 본 PR 의 `aae3c89` merge commit 에 의해 사실상 revert.

| 본 환경 머지 본질 | PR diff 의 deletion |
|-----------------|---------------------|
| Task #555 (PR #562) 옛한글 PUA | composer/tests.rs -69, composer.rs -16, layout.rs -28, table_layout.rs -32 |
| PR #582 분수형 위첨자 베이스라인 | equation/layout.rs -51 |
| PR #583 그룹 내 Picture 직렬화 | serializer/control/tests.rs -79 |
| 회귀 테스트 묶음 | layout/integration_tests.rs -312 |

→ 그대로 머지하면 본질 정정 600+ lines 회귀.

## 3. 처리 옵션 결정

| 옵션 | 평가 |
|------|------|
| A: 전체 머지 | ❌ src/ revert 600+ + 시각 회귀 |
| B: rhwp-studio TS 만 cherry-pick | ⚠ commit Rust+TS 섞여 분리 어려움 + stable_id 미동작 |
| **C: 분리 PR + base 동기화 권장** | ✅ **채택** |

## 4. 컨트리뷰터에게 안내한 분리 PR 구성

1. **rhwp-studio TS (compare + history) 본질** — base 동기화 후 추출
2. **Rust pagination/typeset 변경** — `should_reserve_picture_height` + `normalize_floating_only_paragraph_height` — fixture sweep + 시각 판정
3. **paragraph.rs stable_id + parser + WASM 노출 통합** — identity 전략 동작화

## 5. 본질 평가 — rhwp-studio TS 영역 (보존 권장)

- `compare/diff-engine.ts` (+2,997) — alignment 다층화 (글로벌 앵커 → 구간 정렬 → 상대 구조 근접 → DP 비용)
- `compare/types.ts` (+118) — `CompareStrategy = 'identity' | 'alignment'` 도메인 모델
- `compare/diff-engine-readme.md` (+471) — 한국어 도메인 설명
- `history/idb-store.ts` — IndexedDB 스냅샷 + identity/alignment 폴백
- `ui/compare-dialog.ts` / `compare-result-window.ts` / `history-dialog.ts`

→ 첫 PR 의 모범적 본질. 분리 PR 1 번으로 빠르게 머지 가능 영역.

## 6. 메모리 정합

- ✅ `feedback_visual_regression_grows` — Rust pagination 변경은 시각 판정 게이트 필요
- ✅ `feedback_v076_regression_origin` — base skew 가 회귀 origin 패턴
- ✅ `feedback_essential_fix_regression_risk` — 단순 채택 시 PR #555/582/583 회귀
- ✅ `feedback_pr_comment_tone` — 첫 PR 환영 + 차분 사실 + 분리 PR 권장 톤
- ✅ `feedback_per_task_pr_branch` — Task 별 분리 PR 권장
- ✅ `feedback_no_pr_accumulation` — base 동기화 = PR 누적 방지

## 7. 사후 처리

- [x] 검토 보고서 작성 + 옵션 C 결정
- [x] PR #571 close 안내 댓글 (분리 PR + base 동기화 + 시각 판정 게이트 + stable_id 보강 안내)
- [x] PR #571 close
- [x] 본 보고서 + 검토 문서 archives 이동
- [ ] 컨트리뷰터의 재 PR (3 개 분리) 대기
