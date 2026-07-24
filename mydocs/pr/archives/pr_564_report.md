# PR #564 처리 보고서 — 핀셋 cherry-pick 머지 + 시각 판정 ★ 통과

**PR**: [#564 Task #521: TAC 표 outer_margin_bottom 누락 정정](https://github.com/edwardkim/rhwp/pull/564)
**작성자**: @planet6897 (PR 등록) / Jaeook Ryu = @jangster77 (commit author)
**관련 PR**: PR #560 (Task #544, CLOSED — stacked dependency, 본 환경 적용 완료)
**처리 결정**: ✅ **핀셋 cherry-pick 머지 + push + PR close**
**처리일**: 2026-05-05

## 1. 처리 결과 요약

| 항목 | 결과 |
|------|------|
| 결정 | ✅ 핀셋 cherry-pick (`04eefd99` 단독) + devel merge + push + PR close |
| 시각 판정 | ★ **통과** (광범위 샘플 파일 페이지네이션 + 분리된 표 검증) |
| Devel merge commit | `47aab48` |
| Cherry-pick 충돌 | 0 건 (PR mergeable=CONFLICTING 표시는 stacked 구조 + PR base 시점 차이) |
| Author 보존 | ✅ Jaeook Ryu (@jangster77) 보존 |
| Issue #521 | CLOSED (수동 close + 안내 댓글) |
| 광범위 페이지네이션 sweep | 164 fixture / 1,614 페이지 / 페이지 수 회귀 0 |

## 2. 본질 결함 (PR 진단)

### 2.1 결함 가설

`src/renderer/layout.rs::layout_table_item` TAC after-spacing 분기 (라인 2497 직후) 가 `outer_margin_bottom` 미적용. `layout_partial_table_item` (라인 2638-2647) 와 정합시키는 단일 룰 적용.

### 2.2 한컴 명세 정합

> `lh = cell_h + outer_margin_bottom` (exam_eng pi=104 lh=22207 = cell_h(21607) + outer_margin_bottom(600))

`cell_h` 만 advance → 다음 paragraph -8 px shortfall (exam_eng p2 18번 ① 위치 PDF 한컴 2010 대비).

### 2.3 정량 측정

- exam_eng p2 18번 ① 위치: **543.95 → 551.95** (+8 px)
- 후속 두 ① 동일 +8 px 일관 시프트 (PR 본문 명시)

## 3. 단일 룰 + 한컴 명세 정합

| 분기 | 기존 산식 | 정정 후 |
|------|---------|--------|
| `layout_partial_table_item` (라인 2638-2647) | `lh = cell_h + outer_margin_bottom` (한컴 명세 정합) | 변경 없음 |
| `layout_table_item` TAC after-spacing (라인 2497) | `cell_h` 만 advance ❌ | `cell_h + outer_margin_bottom` 정합 |

→ 두 분기를 동일 산식으로 통일 (단일 룰 — `feedback_rule_not_heuristic` 정합).

## 4. PR 의 7 commits 분석 (cherry-pick 대상 식별)

| commit | 설명 | 본 환경 처리 |
|--------|------|-------------|
| `457d5f33` Task #544 v2 Stage 2 (Phase A 재적용) | PR #560 본질 | 이미 적용 (devel `a30dca7`) |
| `b146b83e` PR #551 Task #544 핀셋 처리 보고서 | 컨트리뷰터 fork 보고서 | 무관 |
| `f6039f32` Merge local/devel: PR #551 핀셋 cherry-pick | merge | 무관 |
| `f807378a` PR #551 Task #544 후속 archives | 컨트리뷰터 fork archives | 무관 |
| **`04eefd99` Task #521 Stage 3-4 본질** | layout.rs +11/-1 + integration_tests.rs +80 + plans/working 4개 | ⭐ cherry-pick |
| `fa31829a` Task #521 Stage 5 최종 보고서 | 컨트리뷰터 fork report + orders | 무관 (orders 충돌 위험) |
| `a0eb2fe8` Task #521 처리 후속 PR #564 등록 반영 | 컨트리뷰터 fork orders | 무관 |

→ 본질 1 commit 만 cherry-pick. PR #561/#567 와 동일한 stacked 패턴.

## 5. cherry-pick 진행

### 5.1 대상 commit (1개, 충돌 0)

```
fc16acc Task #521 Stage 3-4: TAC 표 outer_margin_bottom 누락 정정
```

`Jaeook Ryu <jaeook.ryu@gmail.com>` author 보존.

### 5.2 변경 영역

| 파일 | 변경 |
|------|------|
| `src/renderer/layout.rs` | +11 / -1 (TAC after-spacing 분기 outer_margin_bottom 정합) |
| `src/renderer/layout/integration_tests.rs` | +80 (`test_521_tac_table_outer_margin_bottom_p2` 회귀 테스트) |
| `mydocs/plans/task_m100_521.md` 외 3개 working | +495 (Stage 1/2/3-4 작업 보고서) |

## 6. 결정적 검증 결과

| 게이트 | 결과 |
|--------|------|
| `cargo build --release` | ✅ Finished |
| `cargo test --lib --release` | ✅ **1131 passed** / 0 failed / 2 ignored (test_521 RED → GREEN) |
| `cargo test --test svg_snapshot` | ✅ 6/6 passed |
| `cargo test --test issue_546` | ✅ 1 passed (Task #546 회귀 0) |
| `cargo test --test issue_554` | ✅ 12 passed |
| `cargo clippy --release --lib` | ✅ 0건 |
| Docker WASM 빌드 | ✅ **4,570,615 bytes** (1m 34s, PR #567 baseline +151 bytes — layout.rs +11 LOC 정합) |

## 7. 광범위 페이지네이션 회귀 sweep

작업지시자 안내:
> 이번 PR 은 광범위한 페이지네이션 변화가 발생하는지 검증을 해야 합니다.
> 메인테이너가 시각 검증 하는 동안 페이지 수변화 회귀테스트를 해주세요.

본 환경 `samples/` 폴더 전체 자동 sweep:

| 통계 | 결과 |
|------|------|
| 총 fixture | **164** (158 hwp + 6 hwpx) |
| 총 페이지 (devel baseline) | **1,614** |
| 총 페이지 (cherry-pick 후) | **1,614** |
| **fixture 별 페이지 수 차이** | **0** |
| Export 실패 fixture | 0 |
| 측정 도구 | `./target/release/rhwp export-svg` (60s timeout / fixture) |

→ **164 fixture / 1,614 페이지 / 페이지 수 회귀 0**. PR 본문 "278 differ / text count 변동 0" 안전성 패턴이 본 환경 광범위 sweep 으로 정량 입증. TAC 표 outer_margin_bottom 가산 (+8 px / 표) 이 페이지 break 를 트리거하는 케이스 없음.

## 8. 시각 판정 (★ 게이트)

### 8.1 메인테이너 직접 검증 환경

- WASM: `pkg/rhwp_bg.wasm` 4,570,615 bytes (cherry-pick 후 빌드)
- 다양한 hwp 문서 WASM 기반 시각 검증
- 분리된 표 영역 (`layout_partial_table_item` 경로) 까지 검증

### 8.2 작업지시자 시각 판정 결과

> 메인테이너의 광범위한 샘플 파일 페이지네이션 및 분리된 표 시각 검증 통과입니다.

→ ★ **통과**. exam_eng p2 18번 ① 위치 (+8 px PDF 한컴 정합) 정정이 광범위 샘플 + 분리된 표 영역까지 일관 정합 회복.

## 9. PR / Issue close 처리

### 9.1 PR #564 close
- 댓글 등록 (cherry-pick 결과 + 결정적 검증 + 광범위 sweep + 시각 판정 + 단일 룰 + stacked PR 협업 인정)
- close 처리

### 9.2 Issue #521 수동 close
- PR close 가 자동 close 트리거하지 않아 (closes #521 키워드는 merge 시 동작) 수동 close + 안내 댓글
- "PR #564 cherry-pick 처리 완료 (devel merge `47aab48`). 시각 판정 ★ 통과 + 광범위 페이지네이션 회귀 sweep 0 (164 fixture / 1,614 페이지)" 안내

## 10. 메모리 정합

- ✅ `feedback_visual_regression_grows` — 시각 판정 게이트 정합 운영 (★ 통과) + 페이지 수 회귀 자동 sweep 보조 자료
- ✅ `feedback_v076_regression_origin` — 정량 측정 (543.95 → 551.95) 으로 결함 origin 식별
- ✅ `feedback_rule_not_heuristic` — 단일 룰 (`layout_partial_table_item` 산식과 일치)
- ✅ `feedback_pdf_not_authoritative` — PR 의 PDF 정합 (한컴 2010 측정) 은 참고이지만 권위는 작업지시자 한컴 환경
- ✅ `feedback_per_task_pr_branch` — Task #521 단일 본질 PR 정합
- ✅ `feedback_pr_comment_tone` — close 댓글 차분/사실 중심 + 컨트리뷰터 협업 인정
- ✅ `feedback_check_open_prs_first` — PR OPEN 상태 확인 후 진행
- ✅ `feedback_small_batch_release_strategy` — 본 사이클 (5/1 ~ 5/5) 활발한 외부 기여의 빠른 회전 (14번째 PR 처리)

## 11. 본 사이클 사후 처리

- [x] PR #564 close (cherry-pick 머지 + push)
- [x] Issue #521 수동 close (안내 댓글)
- [x] 처리 보고서 (`mydocs/pr/archives/pr_564_report.md`, 본 문서)
- [ ] 검토 보고서 archives 이동 (`mydocs/pr/pr_564_review.md` → `mydocs/pr/archives/pr_564_review.md`)
- [ ] 5/5 orders 갱신 (PR #564 항목 추가)
