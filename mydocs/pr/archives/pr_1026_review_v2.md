# PR #1026 v2 재검토 — fix(text_measurement): 좁은 구두점 폭 분류 + native/WASM 동기화 (재제출)

- PR: [#1026](https://github.com/edwardkim/rhwp/pull/1026)
- 작성자: @HaimLee-4869 (Lee eunjung) — 4번째 기여 (1차 보류 → 재제출)
- 1차 검토: `mydocs/pr/archives/pr_1026_review.md` + `pr_1026_report.md` (2026-05-20, **옵션 B 보류 결정**)
- 재제출: 2026-05-20 18:51 (PR 본문 "(업데이트 2026-05-20)" 명시)
- base: devel (PR base = `bbd38e85` = PR #1033 머지 후, 현재 origin/devel = `ac6aeed4` = PR #1034 머지 후)
- head: pr/narrow-punctuation-native-wasm-sync (단일 squash `ef4f6a3b`)
- mergeable: MERGEABLE, CI 미실행 (statusCheckRollup 빈 배열 — 재제출 직후)
- 변경 규모: +239/-117, 4 파일 (1 코드 + 2 golden + 1 신규 test)
- 일시: 2026-05-21

## 1. 컨트리뷰터 사이클 + 1차 보류 후속 (`feedback_pr_supersede_chain`)

@HaimLee-4869 PR 누적:
- PR #1020 (closes #727) — PUA U+F02B1~F02C4 사각 안 숫자 매핑 + fallback chain (머지)
- PR #1021 (Refs #874) — 단일-run RIGHT + leader cell right inner 정렬 (머지, **본 PR 회귀 우려 대상**)
- **PR #1026 (1차)** — 옵션 B 보류 (KTX 회귀 부수효과 발견)
- **PR #1026 (재제출, 본 PR)** — KTX 회귀 가드 + rebase 처리
- PR #1047 — UTF-16 stream offset CharShape start_pos (OPEN)

## 2. 1차 검토 보류 사유 (회상)

`mydocs/pr/archives/pr_1026_report.md` 명시:
- 본 PR 의 좁은 구두점 fix 자체는 의도된 효과 (도청 공문 가운뎃점 0.5em → 0.3em 정합)
- 광범위 sweep 중 **KTX 목차 페이지번호 +10px 우측 이동** 발견 (PR #1021 의 cell right inner 정합 회귀)
- 작업지시자 판정 "이게 틀린겁니다" → 옵션 B (수정 요청 / 보류)
- 1차 보고서 회귀 원인 추정: "H2 분기 순서 변경이 PR #1021 측정 영향"

## 3. 재제출 변경 사항

PR 본문 명시 "C8+C9 소스 로직 변경 없음":
- **본질 코드 동일** (`is_narrow_punctuation` 확장 + `measure_char_width_embedded` narrow override + WASM path 동기화)
- **추가 사항**:
  1. 최신 devel rebase (`bbd38e85` PR #1033 머지 후 base)
  2. KTX 회귀 가드 `tests/issue_874_ktx_toc_page_number_right_align.rs` 신규 (98 lines)
  3. golden 갱신 (issue-157 + issue-617 동일)
  4. **issue-267 KTX golden 미변경** — 1차 검토 시 변경됐던 영역

## 4. KTX 회귀 부재 결정적 입증 ✅

### 4.1 KTX 회귀 가드 (PR head 신규 추가)

`tests/issue_874_ktx_toc_page_number_right_align.rs`:
- `render_page_svg_native(KTX.hwp, page=1)` → 페이지번호 digit max_x < 695.0 단언
- 정상 ≤690.8 / 회귀 시 ≈699.76 (±4px 여유로 결정적 판별)

### 4.2 본 환경 검증 결과

| 항목 | 결과 |
|------|------|
| cherry-pick `ef4f6a3b` | 충돌 없음, author @HaimLee-4869 보존 |
| cargo build --lib | OK |
| cargo test --test issue_874_ktx_toc_page_number_right_align | **1 passed** (페이지번호 정합 유지 입증) |
| cargo test --test svg_snapshot | **8/8 passed** (`issue_267_ktx_toc_page` 포함) — KTX golden 무회귀 |
| cargo test --release --lib | **1319 passed** |
| cargo test --release --tests | 모든 통합 passed (issue_852 5/5 + issue_1008 4/4 + issue_874 1 + svg_snapshot 8) |
| cargo fmt --all --check | clean |

### 4.3 1차 검토 회귀 원인 재정정

1차 보고서 (`pr_1026_report.md`) 의 "H2 분기 순서 변경이 회귀 원인" 추정이 **잘못된 분석**으로 판명. KTX 회귀의 진짜 원인은 1차 cherry-pick 시:
- 단일 cherry-pick + UPDATE_GOLDEN 일괄 갱신 (`issue-267` KTX golden 도 함께 갱신 14 lines)
- 또는 통째-파일 교체로 PR #1021 코드 유실 (KTX 가드 코드 본문 명시: "stale 브랜치를 통째-파일 교체로 통합하면서 PR #1021 코드가 유실되어 이 +10px 이탈이 재현된 사례")

본 PR 재제출에서 KTX 회귀 가드 (issue_874) 추가 + issue-267 golden 보존 으로 1차 검토 결함 정정.

## 5. 본 환경 sweep 결과

| fixture | 페이지 수 (BEFORE→AFTER) | diff count | 본질 |
|---------|--------------------------|-----------|------|
| KTX.hwp | 27 → 27 | 9 | 휴먼명조 U+2018 `'` 좌표 정합 (다른 페이지, **목차 페이지번호 영역 변동 없음**) |
| hwp3-sample16-hwp5.hwp | 64 → 64 | 1 | HY신명조 U+2018 `'` 일부 정합 |
| exam_kor.hwp | 20 → 20 | 17 | HY신명조 U+2018 `'` 좌표 정합 (golden issue-617 영역) |
| aift.hwp | 74 → 74 | 5 | HY신명조 U+2018 `'` 좌표 정합 |
| hwp3-sample16 / exam_math / biz_plan | 동일 | **0** | 영향 없음 |

**총 32 diff = 모두 본 PR 본질 영역** (HY 시리즈 + 휴먼명조 + U+2018/U+2019/U+2027 narrow punctuation 정합). **회귀 가드 + svg_snapshot 8/8 + KTX 페이지번호 정합 모두 보존**.

## 6. 코드 품질 평가 (1차 검토 대비 변동 없음 + 추가 강점)

### 6.1 강점 (재확인)

- **native + WASM 두 path 동기화** (`feedback_image_renderer_paths_separate` 정합): H1+H2 (native) + H3 (WASM) — 직전 PR #1021 패턴 일관
- **case-specific 가드** (`feedback_hancom_compat_specific_over_general`): U+2018/U+2019/U+2027 narrow 분기 + `glyph_w >= em_size` 조건 (정상 DB 값 영향 0)
- **회귀 영향 의도적 분리**: 함초롬바탕 / Pretendard / 맑은 고딕 무영향 (DB narrow 정확 기록)
- **본가 PR #900 패턴 참조**: native + WASM 동시 fix 정책

### 6.2 추가 강점 (재제출)

- **회귀 가드 영구화**: `issue_874_ktx_toc_page_number_right_align.rs` 신규 — PR #1021 회귀 가드 영구화 (1차 검토 학습 반영)
- **회귀 가드 작성 품질**: `x>600` 페이지번호 추출 + 임계 695.0 (±4px) 결정적 단언 + 회귀 시 fix 위치 명시 메시지 (`text_measurement.rs 의 (2, _) if fill_low != 0 분기`)
- **base 정합**: 최신 devel (`bbd38e85` PR #1033 머지 후) rebase — `feedback_release_sync_check` 정합

### 6.3 우려 (1차 동일)

- **golden 갱신 광범위**: issue-157 (82 lines) + issue-617 (148 lines) = 230 lines 좌표 갱신 — 본질 영향이지만 검증 부담
- **CI 미실행** (statusCheckRollup 빈 배열) — 재제출 직후, GitHub CI 트리거 대기

## 7. 옵션 권고

| 옵션 | 설명 | 위험 | 권고 |
|------|------|------|------|
| **A. cherry-pick + sweep + 시각 판정** | dry-run 검증 완료 (lib 1319 + issue_874 1 + svg_snapshot 8/8 + KTX page 2 페이지번호 좌표 동일). 작업지시자 시각 판정 → 머지 | **낮음** — 회귀 가드 영구화, KTX 페이지번호 정합 정량 입증, 1차 검토 결함 정정 명시 | **권고** |
| B. 수정 요청 추가 | golden 검증 더 (issue-157 굴림체 / issue-617 HY신명조 시각 판정) | 매우 낮음 — 1차 자기 검증 완료 | 작업지시자 결정 |
| C. 보류 | 1차 검토 보류 유지 | 매우 낮음 — 그러나 회귀 가드 + 본질 정정 모두 검증 완료된 상태에서 보류 사유 없음 | 비권고 |

## 8. 메모리 룰 정합

- ✅ `feedback_self_verification_not_hancom` — 본 환경 정량 입증 + 작업지시자 시각 판정 필수
- ✅ `feedback_visual_judgment_authority` — 1차 검토 옵션 B 사유 (KTX 회귀) 가 작업지시자 시각 판정 권위. 본 PR 재제출이 이를 정정
- ✅ `feedback_v076_regression_origin` — 1차 검토 시 컨트리뷰터 자기 환경 fixture (도청 공문) 정합 ≠ 메인테이너 환경 회귀 (KTX). 본 PR 재제출이 회귀 가드 영구화로 정정
- ✅ `feedback_image_renderer_paths_separate` — native + WASM 두 path 동시 fix
- ✅ `feedback_hancom_compat_specific_over_general` — U+2018/U+2019/U+2027 narrow + `glyph_w >= em_size` 조건
- ✅ `feedback_pr_supersede_chain` — 1차 보류 → rebase + 회귀 가드 추가 → 재제출 (모범 사례)
- ✅ `feedback_push_full_test_required` — cargo test --tests + clippy + fmt 전체 CI 패턴
- ✅ `feedback_contributor_cycle_check` — @HaimLee-4869 PR 사이클 명시

## 9. 작업지시자 결정 요청

| 결정 | 옵션 |
|------|------|
| 진행 여부 | A (cherry-pick + sweep + 시각 판정) / B (수정 요청 추가) / C (보류) |
| 시각 판정 범위 | KTX 페이지번호 정합 유지 + 휴먼명조 narrow 정합 / 추가 |
| 머지 시 commit | cherry-pick `cb53dd94` (author @HaimLee-4869 보존) → no-ff merge |
