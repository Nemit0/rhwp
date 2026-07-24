# PR #561 처리 보고서 — 핀셋 cherry-pick 머지 + 시각 판정 ★ 통과

**PR**: [#561 Task #548: 셀 inline TAC Shape margin + indent 정정 (closes #548)](https://github.com/edwardkim/rhwp/pull/561)
**작성자**: @planet6897 (PR 등록) / Jaeook Ryu = @jangster77 (commit author)
**관련 PR**: PR #560 (Task #544, CLOSED — stacked dependency, 본 환경 적용 완료)
**처리 결정**: ✅ **핀셋 cherry-pick 머지 + push + PR close**
**처리일**: 2026-05-05

## 1. 처리 결과 요약

| 항목 | 결과 |
|------|------|
| 결정 | ✅ 핀셋 cherry-pick 2 commits (본질만) + devel merge + push + PR close |
| 시각 판정 | ★ **통과** (한국어/영어 시험지 가독성 개선 인정) |
| Devel merge commit | `84bced9` |
| Cherry-pick 충돌 | 0 건 (PR mergeable=CONFLICTING 표시는 PR base 시점 차이, 본질 무관) |
| Author 보존 | ✅ Jaeook Ryu (@jangster77) 보존 |
| Issue #548 | CLOSED (closes #548) |

## 2. PR 의 stacked 본질 + 핀셋 처리

### 2.1 Stacked dependency 정합

본 PR 은 PR #560 (Task #544) 위에 stack 됨. 처리 시점:
- PR #560 은 **이미 CLOSED** + 본 환경 devel 에 본질 적용 완료 (`a30dca7` = `457d5f33` cherry-pick, PR #551 영역 처리)
- 본 환경 devel 의 `src/renderer/layout/integration_tests.rs:999~1066` 에 `test_548` 가 **RED + #[ignore] 상태로 이미 존재** (PR #560 cherry-pick 시 들어옴)
- 본 PR 의 `3de05051` 본질이 정확히 이 ignore 를 제거 + table_layout.rs +79 LOC 변경으로 RED → GREEN 전환

### 2.2 Cherry-pick 대상 식별 (9 commits → 2 commits)

| commit | 설명 | 본 환경 처리 |
|--------|------|-------------|
| `457d5f33` Task #544 v2 Stage 2 | 본 환경 `a30dca7` 와 동일 | 이미 적용 (PR #560) |
| `b146b83e` PR #551 처리 보고서 | 컨트리뷰터 fork 보고서 | 무관 |
| `f6039f32` Merge | merge | 무관 |
| `f807378a` PR #551 후속 archives | 컨트리뷰터 fork archives | 무관 |
| **`3de05051` Task #548 본질** | effective_margin_left_line + table_layout.rs +79 | ⭐ cherry-pick |
| **`a0dad0d3` Task #548 fixup** | y 범위 [685,690] → [690,710] | ⭐ cherry-pick |
| `4ef1b79c` Task #548 처리 보고서 | 컨트리뷰터 fork 보고서 | 본 환경 미사용 |
| `77b48c7b` Merge | merge | 무관 |
| `55f8c633` Task #548 후속 archives | 컨트리뷰터 fork archives | 무관 |

→ 본질 2 commits 만 cherry-pick. 컨트리뷰터의 처리 보고서/archives 는 fork 내부 정합용 (본 환경 무관).

## 3. 본질 변경 영역

### 3.1 effective_margin_left_line 헬퍼 (table_layout.rs +79)

`paragraph_layout` 의 line_indent 산식과 동일 단일 룰:
- positive indent: line 0 에 +indent (첫줄 들여쓰기)
- negative indent (hanging): line N≥1 에 +|indent|
- indent=0: 모든 line 에 margin_left 만 적용

3 분기에 `line_margin` 가산:
1. paragraph 시작 (line 0)
2. Picture target_line reset (Task #500 정합)
3. Shape target_line reset (Task #500 + #520 정합)

### 3.2 페이지 8 셀 5 line 0 [푸코] 케이스

- ps_id=19: margin_left=1704 HU → 11.36 px, indent=+1980 HU → +13.20 px
- 기대 위치: cell_x (131.04) + 11.36 + 13.20 = **155.60 px** (PDF 한컴 2010 ≈155.6)
- 수정 전: inline_x = inner_area.x = 131.04 (margin/indent 미적용)
- 수정 후: inline_x = inner_area.x + line_margin = 155.60 ✓

### 3.3 test_548 fixup 의 본질

contributor fork 측정 y≈685~690 → 본 devel 측정 y≈698.43.
원인: 본 devel 이 Task #479 미적용 (pre-#479 trailing-ls 항상 가산 모델). y 범위 [685, 690] → [690, 710] 으로 조정 (puko rect 식별).

## 4. cherry-pick 진행

### 4.1 대상 commits (2개, 충돌 0)

```
bee0c77 Task #548: 셀 내부 paragraph 첫줄 inline TAC Shape margin_left + indent
309cfbf Task #548 fixup: test_548 의 y 범위를 본 devel 측정값 기준으로 조정
```

모두 `Jaeook Ryu <jaeook.ryu@gmail.com>` author 보존.

### 4.2 변경 영역

| 파일 | 변경 |
|------|------|
| `src/renderer/layout/table_layout.rs` | +79 (effective_margin_left_line + 3 분기 line_margin 가산 + ParaShape margin/indent 추출) |
| `src/renderer/layout/integration_tests.rs` | -1 (#[ignore] 제거) + y 범위 조정 [685,690] → [690,710] |
| `mydocs/working/task_m100_544_v2_stage3.md` | +113 (작업 보고서) |

## 5. 결정적 검증 결과

| 게이트 | 결과 |
|--------|------|
| `cargo build --release` | ✅ Finished |
| `cargo test --lib --release` | ✅ **1130 passed** / 0 failed / 2 ignored (test_548 RED → GREEN) |
| `cargo test --test issue_546` | ✅ 1 passed (Task #546 회귀 0) |
| `cargo test --test issue_554` | ✅ 12 passed |
| `cargo test --test svg_snapshot` | ✅ 6/6 passed |
| `cargo clippy --release --lib` | ✅ 0건 |
| Docker WASM 빌드 | ✅ **4,570,220 bytes** (1m 25s, PR #589 baseline +447 bytes — table_layout.rs +79 LOC 정합) |

## 6. 광범위 회귀 sweep (본 환경)

| Fixture | 페이지 수 | byte 차이 |
|---------|---------|---------|
| 21_언어_기출_편집가능본 | 15 | **1** (page 8 — PR 본문 권위 영역) |
| exam_kor | 20 | 7 (page 3, 5, 7, 9, 11, 15, 19) |
| exam_science | 4 | 2 |
| **합계** | **39** | **10** |

→ PR 본문 명시 "6 샘플 73 페이지 13 differ" 와 근접. 권위 영역 (page 8) 정합 + 회귀 검출 가능 영역 (paragraph 텍스트 위치, 일반 shape 위치) 변경 검증.

## 7. 시각 판정 (★ 게이트)

### 7.1 SVG 자료 생성

- `output/svg/pr561_before/21_언어_기출/` (devel 기준, 15 페이지)
- `output/svg/pr561_after/21_언어_기출/` (cherry-pick 후, 15 페이지)
- `output/svg/pr561_before/exam_kor/` + `output/svg/pr561_after/exam_kor/` (20 페이지)
- `output/svg/pr561_before/exam_science/` + `output/svg/pr561_after/exam_science/` (4 페이지)

### 7.2 작업지시자 시각 판정 결과

> 메인테이너 시각 판정 통과입니다. 이제 한국어, 영어 시험지는 제법 볼만하다는 느낌이 듭니다. 수고하셨습니다.

→ ★ **통과**. 페이지 8 셀 5 line 0 [푸코] inline rect 의 x=131.04 → 155.60 정정이 시각적으로 회복 + 한국어/영어 시험지 영역의 가독성 개선 효과 인정.

## 8. PR / Issue close 처리

### 8.1 PR #561 close
- 댓글 등록 (cherry-pick 결과 + 결정적 검증 + 광범위 sweep + 시각 판정 + stacked PR 정합 + 단일 룰 정합 + 컨트리뷰터 협업 인정)
- close 처리

### 8.2 Issue #548 close
- closes #548 키워드로 PR merge 시 자동 close
- 이미 CLOSED 상태 확인

## 9. 메모리 정합

- ✅ `feedback_visual_regression_grows` — 시각 판정 게이트 정합 운영 (★ 통과)
- ✅ `feedback_v076_regression_origin` — 작업지시자 직접 시각 판정으로 정합성 확인
- ✅ `feedback_hancom_compat_specific_over_general` — 단일 룰 (effective_margin_left_line) 의 명시 가드
- ✅ `feedback_pdf_not_authoritative` — 본 PR 의 PDF 측정값 (155.6) 은 참고이지만 권위는 작업지시자 한컴 환경
- ✅ `feedback_rule_not_heuristic` — 단일 룰 접근 정합 (paragraph_layout 산식과 동일)
- ✅ `feedback_per_task_pr_branch` — Task #548 단일 본질 PR
- ✅ `feedback_no_pr_accumulation` — PR #551 잔존 누적 회피 (본 PR 본문 명시)
- ✅ `feedback_pr_comment_tone` — close 댓글 차분/사실 중심 + 컨트리뷰터 협업 인정
- ✅ `feedback_check_open_prs_first` — PR OPEN 상태 확인 후 진행
- ✅ `feedback_small_batch_release_strategy` — 본 사이클 활발한 외부 기여의 빠른 회전 (5/1 ~ 5/5 사이 12번째 PR 처리)

## 10. 본 사이클 사후 처리

- [x] PR #561 close (cherry-pick 머지 + push)
- [x] Issue #548 close (closes #548)
- [x] 처리 보고서 (`mydocs/pr/archives/pr_561_report.md`, 본 문서)
- [ ] 검토 보고서 archives 이동 (`mydocs/pr/pr_561_review.md` → `mydocs/pr/archives/pr_561_review.md`)
- [ ] 5/5 orders 갱신 (PR #561 항목 추가)
