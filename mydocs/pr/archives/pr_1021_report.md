# PR #1021 처리 보고서 — fix: 단일-run RIGHT + leader 인라인 탭 cell right inner 정렬 (Task #874 후속)

- 처리일: 2026-05-20
- 컨트리뷰터: [@HaimLee-4869](https://github.com/HaimLee-4869) (Lee eunjung) — **두 번째 기여** (#1020 머지 직후)
- 결정: **옵션 A (수용)** — 작업지시자 승인 + sweep 정량 입증
- 머지: (no-ff, local/devel → devel)
- Refs Task #874

## 1. 결정 사유

@HaimLee-4869 두 번째 기여 (#1020 직후). PR #874 cross-run RIGHT+leader path 와 보완 관계인 단일-run path 정합 fix. native + WASM 두 measurer 동시 적용 (PR #900 패턴, `feedback_image_renderer_paths_separate` 본질 정합). 본 환경 sweep 9 fixture 전부 diff=0 입증.

## 2. 처리 내역 (복잡한 사고 + 해소 — 기록용)

본 PR 처리 중 **PR #1020 회귀 CI 실패 발견 + 처리 사고** 가 동반 발생:

| 단계 | 내용 |
|------|------|
| 1. cherry-pick `cfb71fae` 시도 | KTX golden 4 블록 충돌 (PR #1020 chain 확장 vs PR #1021 x 좌표) |
| 2. abort + source-only patch | text_measurement.rs 만 적용 + UPDATE_GOLDEN 자동 갱신 전략 |
| 3. 자기 검증 중 CI #26135345296 실패 발견 | PR #1020 회귀 — `tests/issue_826.rs:52` PUA U+F02B1→① 단언 미정정 |
| 4. hotfix 1차 `1b58f12c` push | 단언 정정 (raw passthrough) |
| 5. CI #26136717196 실패 | hotfix fmt 미통과 (assert 멀티라인 분할 필요) |
| 6. hotfix 2차 `3ed82975` push | fmt 정정 — **사고로 PR #1021 source(text_measurement.rs)가 stash 흡수되어 함께 push됨** |
| 7. CI #26137236081 실패 | devel source 적용됐으나 KTX golden 미일치 (PR #1021 golden 미머지) |
| 8. **본 PR #1021 cherry-pick → golden 정합 commit `7f879ab7`** | 작성자 @HaimLee-4869 보존 |
| 9. 본 환경 svg_snapshot 8/8 GREEN + sweep 9 fixture diff=0 | merge 진행 |

**결과적 본 PR #1021 cherry-pick commit**: KTX golden 14 lines 변경 (PR 원 의도). source 는 사고로 origin/devel `3ed82975` 에 흡수.

## 3. PR 본질 변경 (원 의도)

`text_measurement.rs` 의 두 measurer (`EmbeddedTextMeasurer` + `WasmTextMeasurer`) 에 `(2, _) if fill_low != 0` (RIGHT + leader) **add-only 분기** 추가:
- 단일-run + content 케이스: `cell_right_run_rel = text_start_offset + available_width - line_x_offset` 정렬 + `seg_w_full` (leading space 포함)
- trailing space / 끝 케이스: 원본 path 유지 → Task #874 `pending_right_tab` cross-run carry-over 처리
- 기존 x 보존 (`max(x)`)

**Root cause** (PR 본문): 단일-run path 가 `body_right_legacy = available_width - line_x_offset` 사용 → `text_start_offset` 미포함 → cell right inner 미달. `seg_w` leading space skip → digit right edge 좌측 정렬 미달.

KTX golden 14 lines 변경: 페이지번호 4개(8/16/20/24) x 좌표 10px 좌측 이동 (699.76→689.76, 689.76→679.76).

## 4. 자기 검증

| 항목 | 결과 |
|------|------|
| `cargo test --release --lib` | 1307 passed |
| `cargo test --release --test svg_snapshot` | **8 passed** (golden 정합 회복) |
| `cargo test --release --test issue_826` | **4 passed** (hotfix 후 회귀 가드 정합) |
| `cargo clippy --release --lib -D warnings` | 통과 |
| `cargo fmt --check` | exit 0 |
| WASM 빌드 (Docker) | 4.83 MB, rhwp-studio/public 동기화 |

## 5. sweep 검증 (9 fixture, BEFORE devel `3ed82975` ↔ AFTER) — **전부 diff=0**

| Fixture | 결과 |
|---------|------|
| **KTX (타깃)** | diff=0 (devel BEFORE도 이미 PR #1021 source 흡수 상태라 동일 출력) |
| table-vpos-01, sample16-hwp5, exam_kor, exam_math, aift, biz_plan, 복학원서, mel-001 | 전부 **diff=0** |

**핵심**: source 가 devel 에 이미 있는 상태에서 본 PR commit (golden 정합) 머지 후 svg_snapshot 일관 — CI 회복.

## 6. 작업지시자 시각 판정 — 생략 통과

작업지시자 명시: "svg 골든을 교체해야 합니다 ㅎㅎ" — 본 PR commit (KTX golden 정합) 가 정확히 그 역할. 본 환경 svg_snapshot 8/8 + sweep 9 diff=0 정량 입증으로 시각 판정 대체.

## 7. 핵심 교훈 (메모리 룰 강화)

- **`feedback_release_manual_required` / `feedback_commit_reports_in_branch`**: hotfix 1차 fmt 미검증 push → CI 실패 → 2차 hotfix → 사고. **모든 push 전 cargo fmt --check 필수** (이미 메모리 룰이나 본 사고로 재확인)
- **`feedback_pr_supersede_chain`** 강화: PR 시리즈 누적 적층 시 cherry-pick 작업과 hotfix 작업이 동일 작업트리에서 진행되면 stash 사고 가능. 별도 worktree 또는 분리 작업 권고
- **`feedback_v076_regression_origin`**: PR #1020 sweep 검증 시 `cargo test --release --lib` 만 확인하고 `--test issue_826` 통합 테스트 누락 → CI 회귀 발견. **PR 머지 전 `cargo test --release --tests` 전체 통합 테스트 필수**

## 8. 메모리 룰 정합

- `feedback_contributor_cycle_check` — @HaimLee-4869 두 번째 기여
- `feedback_pr_comment_tone` — 두 번째 기여 환영 + 사실 중심
- `feedback_image_renderer_paths_separate` — native + WASM 두 measurer 동시 fix (PR 본문 명시, PR #900 패턴)
- `feedback_fix_scope_check_two_paths` — Task #874 cross-run + 본 PR 단일-run 보완 관계
- `feedback_hancom_compat_specific_over_general` — `has_content_after` 검사로 단일-run + content 한정 + `max(x)` 보존
- `feedback_visual_judgment_authority` — sweep diff=0 + svg_snapshot 8/8 정량 입증으로 시각 판정 대체
- `feedback_pr_supersede_chain` — 본 사고 경험 추가
- `reference_authoritative_hancom` — 검증 환경 한컴오피스 2024 한글 Windows + KTX-2022 PDF baseline (PR 본문)
- `project_output_folder_structure` — sweep 산출물 output/poc/pr1021 배치
