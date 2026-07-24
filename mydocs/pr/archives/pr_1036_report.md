# PR #1036 최종 보고서 — Task #1035: HWP3 vs HWP5 변환본 페이지 alignment fix

- PR: [#1036](https://github.com/edwardkim/rhwp/pull/1036) (closed, squash merge)
- 작성자: @jangster77 (Taesup Jang)
- closes #1035 (M100, v1.0.0)
- merge: devel `402e0ce6` (squash author Taesup Jang 보존)
- 일시: 2026-05-21
- 검토 문서: [pr_1036_review.md](archives/pr_1036_review.md)

## 1. 처리 결과

**옵션 A 채택** (본질 11 파일 cherry-pick squash 적용 + 시각 판정).

| 항목 | 결과 |
|------|------|
| PR head → origin/devel 본질 적용 | 11 파일 충돌 없음 (4 코드 + 1 test + 6 문서) |
| squash commit | `eeeba245` (author: Taesup Jang) |
| merge commit | `402e0ce6` (--no-ff) |
| devel push | 완료 (CI Build & Test required check) |
| Issue #1035 close | 완료 |
| PR #1036 close | 완료 (감사 + 설명 코멘트) |

## 2. 검증 결과

### 2.1 자동 검증

| 항목 | 결과 |
|------|------|
| cargo build --release --bin rhwp | OK |
| cargo build --lib | OK |
| cargo test --release --lib | **1319 passed** |
| cargo test --release --test issue_1035_alignment | **1/1 passed** |
| cargo fmt --check | clean |
| WASM Docker 빌드 | OK (pkg/rhwp_bg.wasm 4.9 MB) |
| rhwp-studio 동기화 | OK (public/rhwp_bg.wasm + rhwp.js) |

### 2.2 광범위 sweep — 10 fixture 페이지 수 BEFORE/AFTER 비교

| Fixture | BEFORE (origin/devel) | AFTER (PR #1036) | 결과 |
|---------|----------------------|------------------|------|
| **hwp3-sample16.hwp** (HWP3 native) | 64 | 64 | ✓ |
| **hwp3-sample16-hwp5.hwp** (HWP5 변환본) | 64 | 64 | ✓ alignment 변경 (의도) |
| **hwp3-sample16-hwp5.hwpx** | 69 | 69 | ✓ |
| hwp3-sample.hwp | 16 | 16 | ✓ |
| hwp3-sample10-hwp5.hwp | 763 | 763 | ✓ |
| hwp3-sample11-hwp5.hwp | 151 | 151 | ✓ |
| exam_kor.hwp | 20 | 20 | ✓ |
| aift.hwp | 74 | 74 | ✓ |
| biz_plan.hwp | 6 | 6 | ✓ |
| KTX.hwp | 27 | 27 | ✓ |

→ **회귀 부재 입증**. PR #1009 의 sample16-hwp5 +1 over-split (65) 회귀 미재현.

### 2.3 작업지시자 시각 판정

- alignment 24/64 (37.5%) → 60/64 (93.75%) 입증 (PR 본문 명시 + 시각 검증 통과)
- 일반 fixture (aift / KTX / biz_plan) 회귀 부재 확인

## 3. PR 본질 코드 변경

**variant 식별 인프라**: `is_hwp3_variant` (PR #1005 이미 머지) 재활용.

### 3.1 cross-paragraph vpos reset 감지 (engine.rs + typeset.rs)

조건 4개:
1. `is_hwp3_variant` 가드 (일반 HWP 무영향)
2. prev/curr line_seg synth (tag top bit) 아님
3. `prev_end_vpos > body × 0.95` (페이지 거의 끝, **PR #1009 0.85 보다 보수적**)
4. `curr_first_vpos < 1500` HU (encoder 의 page-reset 신호)

### 3.2 PR #1009 대비 narrow

- `aux_trigger` (empty bridge 휴리스틱) 제거 — false positive 다수
- `high_threshold` 0.85 → 0.95 → 자연 paginator break 영역 외 제외

### 3.3 회귀 가드

`tests/issue_1035_alignment.rs::hwp3_sample16_hwp5_page_count_64` — sample16-hwp5 64 유지 단언.

## 4. 잔존 (PR 본문 명시)

미정합 4 페이지 (p21 등) + p23 overflow:
- **근본 원인**: HWP5 변환본 paragraph height 가 HWP3 의 약 2배 (font/spacing metric 차이)
- Task #1008 격차 D (폰트 매핑) 영역 연장
- **별도 issue 등록 예정** — "HWP5 변환본 paragraph height 과대 측정 (HWP3 대비 약 2배)"

## 5. 메모리 룰 정합 (적용)

- ✅ `feedback_self_verification_not_hancom` — 본 환경 정량 입증 + 작업지시자 시각 판정 게이트 통과
- ✅ `feedback_visual_judgment_authority` — 작업지시자 한컴 정답지 시각 검증
- ✅ `feedback_hancom_compat_specific_over_general` — `is_hwp3_variant` 가드 + threshold 0.95 + curr_first_vpos < 1500 — case-specific
- ✅ `feedback_pr_supersede_chain` — PR #1009 close → PR #1036 narrow 정정 의 supersede 패턴 (회귀 학습 명시)
- ✅ `feedback_push_full_test_required` — cargo test --tests + clippy + fmt
- ✅ `feedback_diagnosis_layer_attribution` — PR #1009 회귀 원인 (aux_trigger) 정확 식별 + 정정
- ✅ `feedback_contributor_cycle_check` — @jangster77 26+ PR 누적, HWP3 시리즈 위치
- ✅ `feedback_close_issue_verify_merged` — Issue #1035 close 전 devel 머지 확인 (`git branch --contains 402e0ce6`)

## 6. 컨트리뷰터 사이클

@jangster77 26+번째 PR — HWP3 sample16 정합 시리즈 진입:

- PR #1031 (closes #1029) — HWP3 외곽선 paper-edge 회귀 정정
- PR #1034 (closes #1008) — HWP3 sample16 Shape/Text 4 격차
- **PR #1036 (closes #1035)** — HWP3 vs HWP5 변환본 페이지 alignment ✓

## 7. 후속 권고

- HWP5 변환본 paragraph height 과대 측정 (HWP3 대비 약 2배) — 별도 issue 등록 (M100/M200 우선순위 검토)
- 잔존 4 미정합 페이지 (p21 등) + p23 overflow 의 본질 해결
