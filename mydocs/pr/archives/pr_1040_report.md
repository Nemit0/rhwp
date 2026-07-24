# PR #1040 최종 보고서 — Task #1037: HWP5 변환본 ParaShape unit normalize + Dialog 한컴 정합 fix

- PR: [#1040](https://github.com/edwardkim/rhwp/pull/1040) (closed, squash merge)
- 작성자: @jangster77 (Taesup Jang) — 30번째 기여
- closes #1037 (M100, v1.0.0)
- merge: devel `c6fb7f26` (squash author Taesup Jang `fd124092` 보존)
- 일시: 2026-05-21
- 검토 문서: [pr_1040_review.md](archives/pr_1040_review.md)

## 1. 처리 결과

**옵션 A 채택** (본질 3 코드 파일 + Task #1037 7 문서 cherry-pick squash + sweep + 시각 판정).

| 항목 | 결과 |
|------|------|
| PR head → origin/devel 본질 적용 | 10 파일 충돌 없음 (3 코드 + 7 문서) |
| squash commit | `fd124092` (author: Taesup Jang) |
| merge commit | `c6fb7f26` (--no-ff) |
| devel push | 완료 (CI Build & Test required check) |
| Issue #1037 close | 완료 |
| PR #1040 close | 완료 (감사 + 시리즈 마무리 코멘트) |

## 2. 검증 결과

### 2.1 자동 검증

| 항목 | 결과 |
|------|------|
| cargo build --release --bin rhwp | OK |
| cargo build --lib | OK |
| cargo test --release --lib | **1319 passed** (PR #1036 회귀 가드 양립) |
| cargo test --release --tests | FAILED 0 (전체 통합) |
| cargo clippy --release --lib -D warnings | clean |
| cargo fmt --check | clean |
| WASM Docker 빌드 | OK (pkg/rhwp_bg.wasm 4.90 MB, PR #1036 동일) |
| rhwp-studio 동기화 | OK (public/rhwp_bg.wasm + rhwp.js) |

### 2.2 광범위 sweep — 10 fixture BEFORE/AFTER diff = 0

```
diff -rq output/poc/pr1040/before/ output/poc/pr1040/after/ = 0
```

→ **전체 1254 SVG 완전 동일** (rendering 무변동 PR 본문 명시 정확 입증)

| Fixture | BEFORE | AFTER | diff |
|---------|--------|-------|------|
| hwp3-sample16.hwp | 64 | 64 | 0 |
| hwp3-sample16-hwp5.hwp | 64 | 64 | 0 |
| hwp3-sample16-hwp5.hwpx | 69 | 69 | 0 |
| hwp3-sample.hwp | 16 | 16 | 0 |
| hwp3-sample10-hwp5.hwp | 763 | 763 | 0 |
| hwp3-sample11-hwp5.hwp | 151 | 151 | 0 |
| exam_kor.hwp | 20 | 20 | 0 |
| aift.hwp | 74 | 74 | 0 |
| biz_plan.hwp | 6 | 6 | 0 |
| KTX.hwp | 27 | 27 | 0 |

→ **PR #1036 alignment 60/64 + 페이지 수 64 완전 보존**.

### 2.3 작업지시자 시각 판정

- Dialog 4 필드 한컴 정합: 왼쪽 40 / 오른쪽 10 / 내어쓰기 20 / 문단위 8.5
- HWP3 + HWP5 변환본 모두 동일 값 표시
- 일반 fixture (aift / KTX / biz_plan) dialog 회귀 부재

## 3. PR 본질 코드 변경 (3 파일)

### 3.1 `src/parser/mod.rs` (+16)

`is_hwp3_variant` 확인 직후 ParaShape margin/indent/spacing 값을 절반으로 normalize:

```rust
// [Task #1037] ParaShape unit semantic normalize — HWP3 → HWP5 변환본은
// 한컴 변환기가 ParaShape 의 margin/indent/spacing 값을 2× 로 저장
for ps in &mut doc.doc_info.para_shapes {
    ps.margin_left /= 2;
    ps.margin_right /= 2;
    ps.indent /= 2;
    ps.spacing_before /= 2;
    ps.spacing_after /= 2;
}
```

### 3.2 `src/renderer/style_resolver.rs` (+5/-4)

종전 case-specific `variant_div=4` (Task #1001) → uniform `variant_div=2`:

```rust
let _ = is_hwp3_variant;
let variant_div = 2.0;
```

→ Task #1001 의 4배 보정이 raw 값 normalize 후 normal HWP5 동등 처리로 통일.

### 3.3 `src/document_core/commands/formatting.rs` (+20/-1)

`build_para_properties_json` 의 dialog margin/indent 산식을 raw_ps 직접 사용 + variant 분기:

```rust
let is_variant = self.document.is_hwp3_variant;
let effective_left_hu = if is_variant {
    raw_left_hu
} else {
    raw_left_hu + raw_indent_hu.min(0)
};
```

## 4. Task #1037 효과 (PR 본문 명시)

sample16 p452 / p97 동일 paragraph 비교:

| 필드 | 한컴 정답 | Task #1037 이전 | Task #1037 완료 |
|------|---------|---------------|-----------------|
| dialog 왼쪽 | 40.0 pt | HWP3 30 / HWP5 20 | 40 / 40 ✓ |
| dialog 오른쪽 | 10.0 pt | 5 / 5 | 10 / 10 ✓ |
| dialog 내어쓰기 | 20.0 pt | 10 / 10 | 20 / 20 ✓ |
| dialog 문단 위 | 8.5 pt | HWP3 8.6 / HWP5 17.0 (2×) | 8.6 / 8.6 ✓ |
| 페이지 수 | 64 | HWP3 64 / HWP5 64 | 64 / 64 ✓ |
| alignment (PR #1036) | — | 60/64 | 60/64 유지 ✓ |

## 5. 잔존 (PR 본문 명시, 별도 task 분리 권고)

- **HWP5 변환본 page_break_before 정보 100% 손실** (한컴 변환기 quirk, 휴리스틱 false negative 위험)
- **HWP5 변환본 p23 외곽선 overflow** (root cause line_seg missing 아님, 다른 영역 조사)

Task #1037 Stage 4 negative result:
- page break vpos==0 휴리스틱: Recall 31.6%, FP 4 (부적합)
- p23 overflow line_seg 합성 옵션 B': Task #1010 회귀 (+24 페이지)

## 6. 메모리 룰 정합 (적용)

- ✅ `feedback_self_verification_not_hancom` — 본 환경 정량 입증 + 작업지시자 시각 판정 게이트 통과
- ✅ `feedback_visual_judgment_authority` — Dialog 4 필드 한컴 정답지 정합 시각 검증
- ✅ `feedback_hancom_compat_specific_over_general` — `is_hwp3_variant` 가드 (일반 HWP 무영향, parser 단계 case-specific)
- ✅ `feedback_pr_supersede_chain` — PR #1036 (Task #1035) 잔존 본질 → PR #1040 (Task #1037) 후속 패턴
- ✅ `feedback_push_full_test_required` — cargo test --tests + clippy + fmt 모두 통과
- ✅ `feedback_diagnosis_layer_attribution` — Task #1037 Stage 1 진단 (composer fallback + corrected_line_height + ParaShape ×2) root cause 정확 식별
- ✅ `feedback_contributor_cycle_check` — @jangster77 30번째 PR, HWP3 시리즈 본질 마무리
- ✅ `feedback_image_renderer_paths_separate` 정신 — parser 단계 normalize 로 모든 후속 path (dialog / rendering / dump) 일괄 정합
- ✅ `feedback_close_issue_verify_merged` — Issue #1037 close 전 devel 머지 확인 (c6fb7f26)

## 7. 컨트리뷰터 사이클

@jangster77 30번째 PR — **HWP3 sample16 정합 시리즈 마무리**:

- PR #1031 (closes #1029) — HWP3 외곽선 paper-edge 회귀 정정
- PR #1034 (closes #1008) — HWP3 sample16 Shape/Text 4 격차
- PR #1036 (closes #1035) — HWP3 vs HWP5 변환본 페이지 alignment 24/64 → 60/64
- **PR #1040 (closes #1037)** — HWP5 변환본 ParaShape 2× quirk + Dialog 한컴 정합 ✓

## 8. 후속 권고

- p23 외곽선 overflow 별도 issue 등록
- HWP5 변환본 page_break_before 100% 손실 별도 issue 등록
- Dialog 회귀 가드 (`tests/issue_1037_dialog.rs`) 후속 PR 권고 (build_para_properties_json 한컴 정합 단언)
