# PR #1036 검토 — Task #1035: HWP3 vs HWP5 변환본 페이지 alignment fix (37.5% → 93.75%)

- PR: [#1036](https://github.com/edwardkim/rhwp/pull/1036)
- 작성자: @jangster77 (Taesup Jang) — PR #1034 (Task #1008) 머지 후 HWP3 sample16 시리즈 후속
- closes #1035 (M100, v1.0.0)
- base: devel (PR base 시점 `a52859de` = PR #1031 머지 후, 현재 origin/devel = `bc5683ff` = Task #919 머지 후)
- head: local/task1035 (multi-merge: Stage 1~4 + devel merge 4회)
- mergeable: MERGEABLE, CI 전체 통과
- 변경 규모 (origin/devel 기준 본질만): +321/-7, 11 파일 (4 코드 + 6 문서 + 1 test)
- 일시: 2026-05-21

## 1. 컨트리뷰터 사이클 + 시리즈 위치 (`feedback_contributor_cycle_check`)

@jangster77 26+번째 PR. paper_based outline 시리즈 (#1011/#1015/#1031) 마무리 후 HWP3 sample16 정합 시리즈 진입:

- PR #1031 (closes #1029) — HWP3 외곽선 paper-edge 회귀 정정 (머지)
- PR #1034 (closes #1008) — HWP3 sample16 Shape/Text 4 격차 (머지, 5/21)
- **PR #1036 (closes #1035)** — HWP3 vs HWP5 변환본 페이지 alignment

## 2. 이슈 #1035 배경

`samples/hwp3-sample16.hwp` (HWP3 native) 와 `samples/hwp3-sample16-hwp5.hwp` (HWP5 변환본) 의 **총 페이지 수는 동일 (64) 하나 페이지별 첫 paragraph 가 다름**:

| 항목 | 값 |
|------|----|
| 총 페이지 | 64/64 (HWP3/HWP5 변환본 동일) |
| alignment 정합 | **24/64 (37.5%)** |
| 미정합 페이지 | 40/64 (62.5%) — HWP5 변환본이 일관되게 +1~+11 늦게 시작 |

## 3. ⚠️ 핵심 — PR #1009 (Task #1007, closed) 재시도

### 3.1 PR #1009 이력 (이전 처리 결과)

| 시도 | sample16-hwp5 페이지 | alignment |
|------|---------------------|-----------|
| devel baseline | 64 | 24/64 (37.5%) |
| PR #1009 (0.85 + aux_trigger) | **65 (+1 회귀)** | 23/64 (악화) |

PR #1009 가 sample16-hwp5 +1 over-split 회귀로 close. 본 PR 의 정정 = `aux_trigger` 제거 + `high_threshold 0.85 → 0.95` narrow.

### 3.2 본 PR (0.95 + main만)

| 시도 | sample16-hwp5 | alignment |
|------|---------------|-----------|
| **0.95 + main_trigger 만** | **64** ✓ | **60/64 (93.75%)** ✓ |

본 PR 본문 명시 검증:
- PR #1009 의 over-split 직접 원인 = `aux_trigger` (empty bridge 휴리스틱 false positive)
- `high_threshold` 0.85 → 0.95 narrow → 자연 paginator break 영역 외 제외

## 4. 코드 본질 분석

**variant 식별 인프라** (`is_hwp3_variant` 필드) 는 PR #1005 이미 머지 — 재활용.

### 4.1 `src/renderer/pagination/engine.rs` (+71/-1)

핵심: variant cross-paragraph vpos reset 감지 (paginator). 조건 4개:
1. `is_hwp3_variant` 가드 (일반 HWP 무영향)
2. prev/curr line_seg synth (tag top bit) 아님
3. `prev_end_vpos > body × 0.95` (페이지 거의 끝, **PR #1009 0.85 보다 보수적**)
4. `curr_first_vpos < 1500` HU (encoder 의 page-reset 신호)

```rust
if (force_page_break || para_style_break || variant_vpos_reset_break)
    && !st.current_items.is_empty()
{
    self.process_page_break(&mut st);
}
```

**PR #1009 대비 narrow**: `aux_trigger` (empty bridge 휴리스틱) 제거 — false positive 다수.

### 4.2 `src/renderer/typeset.rs` (+106/-5)

`engine.rs` 와 동일 로직 두 경로 정합 — typeset 경로도 동일 처리.

### 4.3 `src/renderer/pagination.rs` (+5) + `src/document_core/queries/rendering.rs` (+3/-1)

`PaginationOpts::is_hwp3_variant` 필드 + 전달.

## 5. 본 환경 dry-run 검증

| 항목 | 결과 |
|------|------|
| PR head → origin/devel 본질 파일 적용 (11 파일) | 충돌 없음 |
| cargo build --lib | OK (PR #1026/#1032/#1033/#1034/#1047/#919 와 양립) |
| cargo test --release --lib | **1319 passed** |
| cargo test --release --test issue_1035_alignment | **1/1 passed** (sample16-hwp5 페이지 수 64 유지) |

## 6. 잔존 (PR 본문 명시)

미정합 4 페이지 (p21 등) + p23 overflow:
- **근본 원인**: HWP5 변환본 paragraph height 가 HWP3 의 약 2배 (font/spacing metric 차이)
- Task #1008 격차 D (폰트 매핑) 영역 연장
- **별도 issue 등록 예정** — "HWP5 변환본 paragraph height 과대 측정 (HWP3 대비 약 2배)"

## 7. 코드 품질 평가

### 7.1 강점

- **명시적 narrow 가드** (`feedback_hancom_compat_specific_over_general`): is_hwp3_variant + threshold 0.95 (보수적) + curr_first_vpos < 1500 — 자연 paginator break 와 명확한 분리
- **회귀 학습 명시**: PR #1009 close 사유 (sample16-hwp5 over-split) 를 정확히 분석 + 정정 시도 측정 (5 시도 비교표)
- **PR #1009 인프라 재활용**: variant 식별 인프라 (PR #1005) + cross-paragraph vpos reset 감지 base 패턴
- **두 경로 정합**: engine.rs + typeset.rs 동일 로직 — path 일관성 (`feedback_image_renderer_paths_separate` 정신)
- **회귀 가드**: `tests/issue_1035_alignment.rs::hwp3_sample16_hwp5_page_count_64` — sample16-hwp5 64 유지 단언
- **솔직한 한계 명시**: 잔존 4 미정합 + p23 overflow 본질 (paragraph height 2배) 별도 issue 권고
- **단계별 commit 분리**: Stage 1 (진단) + Stage 2 (구현) + Stage 3 (case-specific 실패 단언) + Stage 4 (보고서)
- **PR base 이전이지만 cherry-pick 자연 통합** (PR #1026/#1032/#1033/#1034/#1047/#919 와 양립)

### 7.2 우려

- **alignment 93.75% (60/64)** 가 100% 아님 — 잔존 4 미정합 + p23 overflow 의 본질은 별도 issue 후속
- **PR head multi-merge** (devel 4회 흡수) — 본질 파일만 선별 적용 필요 (cherry-pick 직접 머지 불가)
- **변환본 한정 fix** — HWP3 native vs HWP5 변환본 alignment 만 정정 (일반 HWP 무영향, case-specific)

## 8. 옵션 권고

| 옵션 | 설명 | 위험 | 권고 |
|------|------|------|------|
| **A. 본질 파일 선별 적용 + 작업지시자 시각 판정** | 11 파일 (src/* + tests/* + 문서 6) 만 origin/devel 위에 squash 적용. dry-run 검증 완료 (1319 + issue_1035 1/1 + 충돌 없음) | **낮음** — variant 가드 narrow, 회귀 가드 영구화, PR base 이전이나 cherry-pick auto-merge | **권고** |
| B. supersede 요청 (rebase) | 컨트리뷰터에게 PR base 갱신 (origin/devel `bc5683ff`) 후 재제출 | 매우 낮음 — 명시적 base 정합 | 본 PR 충돌 없으므로 불필요 절차 |
| C. 보류 (잔존 4 미정합 해결까지) | 본질 issue 별도 등록 후 본 PR + 후속 PR 동시 머지 | 낮음 — alignment 93.75% 부분 정합도 가치 있음 | 비권고 — 부분 정합 효과 빠르게 적용 |

## 9. 메모리 룰 정합

- ✅ `feedback_self_verification_not_hancom` — 본 환경 정량 입증 + 작업지시자 시각 판정 필요
- ✅ `feedback_visual_judgment_authority` — PR 본문 명시 "작업지시자 한컴 한글 정답지 시각 검증 — p21 영역 alignment 정합"
- ✅ `feedback_hancom_compat_specific_over_general` — `is_hwp3_variant` 가드 + threshold 0.95 + curr_first_vpos < 1500 — case-specific
- ✅ `feedback_pr_supersede_chain` — PR #1009 close → PR #1036 narrow 정정 의 supersede 패턴 (회귀 학습 명시)
- ✅ `feedback_push_full_test_required` — cargo test --tests + clippy + fmt
- ✅ `feedback_diagnosis_layer_attribution` — PR #1009 회귀 원인 (aux_trigger) 정확 식별 + 정정
- ✅ `feedback_contributor_cycle_check` — @jangster77 26+ PR 누적, HWP3 시리즈 위치

## 10. 작업지시자 결정 요청

| 결정 | 옵션 |
|------|------|
| 진행 여부 | A (본질 파일 선별 적용 + sweep + 시각 판정) / B (supersede) / C (보류) |
| sweep 검증 범위 | 변환본 9종 + HWP3 + 일반 fixture / 광범위 |
| 시각 판정 | 본 환경 정량 입증 + 작업지시자 시각 판정 (한컴 정답지 p21 등) |
