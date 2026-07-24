# PR #1021 검토 — fix: 단일-run RIGHT + leader 인라인 탭 cell right inner 정렬 (Task #874 후속)

- 작성일: 2026-05-20
- 컨트리뷰터: [@HaimLee-4869](https://github.com/HaimLee-4869) (Lee eunjung) — **두 번째 기여** (#1020 머지 직후)
- PR: https://github.com/edwardkim/rhwp/pull/1021
- base/head: `devel` ← `HaimLee-4869:pr/F4-toc-page-numbers` (cross-repo fork)
- 연결: Task #874 후속 (closes 명시 없음)
- 규모: +83 / -17, **2 files** (소스 1 + golden 1)
- mergeable: **CONFLICTING**
- 본질 커밋: 단일 `cfb71fae` (작성자 @HaimLee-4869)

## 1. 컨트리뷰터 사이클

@HaimLee-4869 두 번째 기여. #1020(closes #727) 머지 직후. devel = `27c05d53` (#1020 머지 포함, KTX golden 이미 갱신됨 — chain 확장 패턴).

## 2. 본질 변경

### text_measurement.rs (2 measurer 동시) — add-only 분기

`EmbeddedTextMeasurer` (line 527-553) + `WasmTextMeasurer` (line 1104-1113) 두 곳에 `(2, _) if fill_low != 0` (RIGHT + leader) 분기 추가:

```rust
let seg_start_skipped = { /* leading space skip */ };
let has_content_after = seg_start_skipped < chars.len();
if has_content_after {
    let seg_w_full = measure_segment_from(&chars, &cluster_len, i + 1, &char_width);
    let cell_right_run_rel = style.text_start_offset + style.available_width - style.line_x_offset;
    x = (cell_right_run_rel - seg_w_full).max(x);
} else {
    let seg_w = measure_segment_from(&chars, &cluster_len, seg_start_skipped, &char_width);
    x = (body_right_legacy - seg_w).max(x);
}
```

**Root cause** (PR 본문): 인라인 `(2, _)` RIGHT + leader 분기의 단일-run path 가 `body_right_legacy = available_width - line_x_offset` 사용 → `text_start_offset` 미포함 으로 cell right inner 미달. `seg_w` 가 leading space skip → digit right edge 좌측 정렬 미달.

**Fix 정밀:**
- 단일-run + content: `cell_right_run_rel = text_start_offset + available_width - line_x_offset` 정렬 + `seg_w_full` (leading space 포함)
- trailing space / 끝 (cross-run 직전): 원본 path 유지 → 다음 run 의 `pending_right_tab` (Task #874) 분기가 처리
- 기존 x 보존 (`max(x)`)

### golden — ktx-toc-page.svg 14 lines 변경

페이지번호 4개(8/16/20/24)의 x 좌표가 **10px 좌측 이동** (699.76→689.76, 689.76→679.76). y/font-family/font-size/글자/fill 무변동 — PR 본문 "text element x 속성만" 정확.

## 3. 검토 의견

### 강점

1. **두 번째 기여 모범** — PR 본문 충실 (Symptom 표 + Before/After 캡처 + Root cause + Fix + Wiki 정합 + 회귀 검증 + 관련 영역 분리). #1020 이어 우수.
2. **native + WASM 양쪽 동시 fix** — PR 본문 명시 `feedback_image_renderer_paths_separate` 본질 정합. PR #900 패턴 정합. EmbeddedTextMeasurer + WasmTextMeasurer 두 곳 동일 분기 적용.
3. **분기 정밀** — `has_content_after` 검사로 단일-run + content 케이스만 catch, trailing space 만일 때 원본 path 유지 (cross-run carry-over Task #874 정합). Task #874 cross-run 분기와 정확히 보완 관계.
4. **scope 좁힘** — RIGHT(no leader)/LEFT/CENTER/DECIMAL 영향 0 (PR 본문 명시). 기존 x 보존(`max(x)`).
5. **검증 환경 명시** — 한컴오피스 2024 한글 Windows + 한컴 폰트 + `pdf/KTX-2022.pdf` baseline (`reference_authoritative_hancom` 정합).
6. **Wiki 정합** — HWP Tab Leader Rendering Wiki 영역 (PR 본문 명시).
7. **별건 분리 명확** — Task #874 (cross-run), Issue #977 (Skia 좌측 별건), PR #980 CLOSED 모두 명시 → 본 PR 은 단일-run + 우측 정합만.
8. cargo test 1307 + clippy 0 + svg_snapshot 8 + WASM build 통과.

### ⚠️ 쟁점

#### (A) CONFLICTING — #1020 KTX golden 갱신과 충돌 가능성

devel = `27c05d53` (#1020 머지) 가 `ktx-toc-page.svg` 의 font-family 패턴 갱신 포함. 본 PR 도 같은 golden 의 x 좌표 변경 (다른 속성) — cherry-pick 시 충돌 가능. 해소: 두 변경 양립 가능 (font-family vs x 좌표) → 수동 충돌 해소 또는 `-X theirs/ours` 후 정밀 확인. 자체 컴파일/테스트 통과 입증 필요.

#### (B) `text_measurement.rs` Task #874 + 본 PR 분기 양립

Task #874 `pending_right_tab` (cross-run carry-over) 가 trailing space 케이스를 처리한다는 PR 본문 명시. 본 PR fix 가 cross-run path 영향 0 확인 (PR 본문 회귀 검증).

#### (C) sweep — KTX (타깃) + 기존 7 golden 영향 확인

PR 본문 "다른 6개 golden 영향 0" — sweep cmp 로 form-002 / issue-147 / issue-157 / issue-617 / issue-677 / table-text + (선택) 다른 RIGHT+leader 보유 fixture 회귀 부재 확인.

### 확인 필요 (검증 단계)

1. cherry-pick `cfb71fae` — KTX golden 충돌 해소 + 컴파일/테스트 통과
2. `cargo test --release --lib` 1307 + `cargo test --test svg_snapshot` 8 + clippy -D + fmt 0
3. **sweep** — KTX(타깃) + 일반 fixture(table-vpos-01, sample16-hwp5, exam_kor, aift, biz_plan, mel-001) 회귀 부재
4. WASM 빌드 + 작업지시자 시각 판정 — KTX 목차 페이지번호 cell right inner 정합

## 4. 처리 옵션

- **옵션 A (수용 — 권고)**: PR 본문 매우 충실 + native+WASM 양쪽 동시 fix (`feedback_image_renderer_paths_separate` 본질 정합) + Task #874 보완 관계 명확 + scope 좁힘. 작업지시자 시각 판정 통과 시.
- **옵션 B (수정 요청)**: KTX 외 fixture 회귀 시 — 분기 가드 강화 요청.
- **옵션 C (close)**: 본질 결함 시. 해당 낮음.

## 5. 메모리 룰 정합

- `feedback_contributor_cycle_check` — @HaimLee-4869 두 번째 기여 (#1020 머지 직후)
- `feedback_pr_comment_tone` — 두 번째 기여 환영 + 사실 중심
- `feedback_image_renderer_paths_separate` — **권위 사례**: native(EmbeddedTextMeasurer) + WASM(WasmTextMeasurer) 두 측정기 양쪽 동시 fix (PR 본문 명시)
- `feedback_fix_scope_check_two_paths` — 동일 분기 두 곳 적용 + Task #874 cross-run path 와 보완 관계 명확
- `feedback_hancom_compat_specific_over_general` — `has_content_after` 검사로 단일-run + content 케이스 한정 (`max(x)` 보존)
- `feedback_visual_judgment_authority` — KTX 작업지시자 시각 판정 + `pdf/KTX-2022.pdf` baseline
- `reference_authoritative_hancom` — 검증 환경 한컴오피스 2024 한글 Windows 명시 + KTX-2022 PDF baseline
- `project_output_folder_structure` — sweep 산출물 output/poc/pr1021 배치

## 6. 권고

**옵션 A** — PR 본문 매우 충실 + native+WASM 양쪽 동시 fix + Task #874 보완 관계 명확 + scope 좁힘. 검증 단계에서 (1) cherry-pick KTX golden 충돌 해소(#1020 font-family 패턴과 양립 가능 — 다른 속성), (2) cargo test 1307 + svg_snapshot 8 + clippy + fmt, (3) sweep — KTX 타깃 + 기존 6 golden + 일반 fixture 회귀 부재, (4) WASM + 작업지시자 시각 판정(KTX 목차 페이지번호 cell right inner 정합) 통과 시 cherry-pick no-ff merge. 회귀 시 옵션 B 전환.
