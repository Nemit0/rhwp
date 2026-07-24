---
PR: #968
제목: fix — 빈 paragraph + 다음 [쪽나누기] case 단독 page 차단 (HWP3 sample18 페이지 수 +2 inflate 해소, closes #967)
컨트리뷰터: @jangster77 (Taesup Jang) — 24+ 사이클 핵심 컨트리뷰터 (@jangster77 PR 시리즈 마지막)
처리: 옵션 A — 본질 commit cherry-pick + 자기 검증 + WASM 재빌드 + no-ff merge
처리일: 2026-05-18
머지 commit: d0c25754
---

# PR #968 처리 보고서

## 1. 처리 결과

✅ **머지 완료** — 옵션 A (본질 commit `3c1ea870` 만 cherry-pick, devel merge 2 제외).
**@jangster77 PR 시리즈 (5/17~18, 7 PR) 완결**.

| 항목 | 값 |
|------|-----|
| 머지 commit | `d0c25754` (--no-ff merge) |
| Cherry-pick commit | `fbdd4430` (본질만, 충돌 0건) |
| closes | #967 |
| 시각 판정 | ✅ 작업지시자 시각 검증 통과 (기존 다른 HWP3 샘플 회귀 부재) |
| 자기 검증 | cargo test 전체 (lib 1288 + svg_snapshot 8) + clippy + sweep 169/169 same + WASM 4.4 MB |

## 2. 본질 (Issue #967)

HWP3 sample18 페이지 수 rhwp 69 vs 한컴 67 (+2 inflate). 빈 paragraph
(pi=27/164) 직후 [쪽나누기] (pi=28/165) → 빈 paragraph 별도 page 분기 → 단독 빈 페이지.

### Root cause (`src/renderer/typeset.rs:555-584`)
`next_force_break` (쪽나누기) 시 `next_will_vpos_reset` 가드 미발동
(hwp-multi-001 회귀 차단 목적) → 빈 paragraph 단독 page 생성.

## 3. 정정 본질 — `src/renderer/typeset.rs:585` (별도 분기)

```rust
} else if !st.current_items.is_empty() && para_idx + 1 < paragraphs.len() {
    let next_force_break = next_para.column_type == ColumnBreakType::Page
        || next_para.column_type == ColumnBreakType::Section;
    let is_curr_empty = para.text.is_empty() && para.controls.is_empty();
    if next_force_break && is_curr_empty {
        let empty_h_px = para.line_segs.first().map(|s|
            hwpunit_to_px((s.line_height + s.line_spacing) as i32, self.dpi)
        ).unwrap_or(0.0);
        let avail = st.available_height() - st.current_height;
        if empty_h_px > avail { continue; }  // overflow → skip
        // fit 가능 — 정상 emit
    }
}
```

### v2 정밀화 (CI 회귀 후)
- **v1** (조건 무관 skip) → aift.hwp page 3 normally-fitting empty paragraph 도
  skip → snapshot 회귀
- **v2** (overflow 한정) → aift.hwp 18 case 정상 emit + sample18 fix

→ `feedback_hancom_compat_specific_over_general` 권위 사례 강화 — 일반화 위험
발견 후 케이스별 정밀화. 컨트리뷰터 영역 영역 CI snapshot 회귀 발견 후 자체 v2.

## 4. 영역 좁힘 (PR 본문 명시)

| 영역 | 영향 |
|------|------|
| 빈 paragraph + 다음 [쪽나누기] + overflow | skip → +1 page inflate 제거 |
| 빈 paragraph + 다음 [쪽나누기] + fit 가능 | 영향 없음 (aift.hwp 18 case) |
| 비-빈 paragraph + 다음 [쪽나누기] | 영향 없음 |
| 빈 paragraph + 다음 일반 paragraph | 영향 없음 (기존 vpos-reset 가드) |
| hwp-multi-001 (회귀 차단) | 영향 없음 |

## 5. 본 환경 충돌 분석

| 파일 | 충돌 | 정합 |
|------|------|------|
| `src/renderer/typeset.rs` | **auto-merge** | devel Task #836 (Endnote :1064/1091) + #901/#866 변경 영역 영역 PR #968 :585 분기 다른 라인 → 자동 병합, 양립 확인 |
| `mydocs/orders/20260518.md` | 신규 (5/18) | PR #968 Task #967 작업 일지 — 본 환경 5/18 orders 미생성 → 충돌 없음 |
| `task_m100_967*` 8 | added in remote | 신규 추가 |

devel merge commit (`ddab74d9`/`8aed95f6`) cherry-pick 제외 — 본질 `3c1ea870` 만.

## 6. ⚠️ fixture 부재 — samples/hwp3-sample18.hwp

| 점검 | 결과 |
|------|------|
| `samples/hwp3-sample18.hwp` 본 환경 | ❌ 부재 |
| git 전체 history 추가 commit | ❌ 부재 (`--diff-filter=A` 결과 없음) |
| PR #968 branch (pr-968-tmp) | ❌ 부재 |
| PR #968 diff fixture 포함 | ❌ 미포함 (코드 1 + 문서 8) |

→ PR #968 영역 영역 sample18 페이지 수 69→67 핵심 검증 fixture 가 PR 미포함 + 본 환경
부재. PR 본문 영역 영역 fixture 추가 명시 부재 — 본질적 누락.

### 작업지시자 결정 — 옵션 2 (회귀 부재 입증 + PR 본문 신뢰)
- sweep 169/169 same + cargo test 전체 통과 → 회귀 부재 입증
- 기존 다른 HWP 3.0 샘플 (sample10~16/19 등) 작업지시자 시각 판정 통과 → 회귀 가드 보완
- sample18 자체 페이지 수 69→67 → 컨트리뷰터 PR 본문 신뢰 (`feedback_self_verification_not_hancom` 영역 영역 컨트리뷰터 환경 한컴 검증 신뢰)

→ 잔존: samples/hwp3-sample18.hwp fixture 별도 추가 권장 (회귀 가드).

## 7. 본 환경 검증

| 검증 | 결과 |
|------|------|
| `cherry-pick` 본질 commit | ✅ 충돌 0건 |
| PR #968 정정 적용 | ✅ Task #967 :585 + next_force_break && is_curr_empty :597 + empty_h_px > avail :606 |
| devel Task #836 Endnote 보존 | ✅ Control::Endnote :1064/1091 |
| `cargo test --release` 전체 | ✅ lib **1288 passed** + integration svg_snapshot 8 ALL GREEN |
| `cargo clippy --release --lib -- -D warnings` | ✅ 통과 |
| **광범위 sweep 7 fixture / 169 페이지** | ✅ **169 same / 0 diff** (aift.hwp 74 same — v1 회귀 해소 입증) |
| WASM 재빌드 | ✅ 4.4 MB |
| 작업지시자 시각 판정 | ✅ **통과** (기존 다른 HWP 3.0 샘플 회귀 부재) |

## 8. 작업지시자 시각 판정 ✅ 통과

- 기존 다른 HWP 3.0 샘플 (sample10~16/19 등) — 회귀 부재 확인
- sample18 자체 영역 영역 fixture 부재 → sweep 169/169 same + cargo test 전체 +
  기존 HWP3 샘플 시각 판정 영역 영역 회귀 가드 보완 (작업지시자 결정)
- aift.hwp page 3 — normally-fitting empty paragraph 정상 emit (v1 회귀 해소,
  sweep aift 74 same 입증)

## 9. CI 통과

✅ Build & Test + CodeQL (js-ts/python/rust) + Canvas visual diff (전 항목)

## 10. 메모리 룰 적용

| 룰 | 적용 |
|----|------|
| `feedback_contributor_cycle_check` | @jangster77 **24+ 사이클** (PR 시리즈 마지막 — 연속 5 + #966 + #968) |
| `feedback_image_renderer_paths_separate` | typeset.rs pagination 단일 |
| `feedback_hancom_compat_specific_over_general` 권위 사례 강화 | v1 (조건 무관 skip) → CI snapshot 회귀 → v2 (overflow 한정) — 일반화 위험 발견 후 케이스별 정밀화 |
| `feedback_diagnosis_layer_attribution` | next_force_break 가드 미발동 (hwp-multi-001 회귀 차단 목적) root cause 정확 진단 |
| `feedback_visual_judgment_authority` 권위 사례 강화 | fixture (sample18) 부재 영역 영역 sweep + cargo test 전체 + 기존 HWP3 샘플 시각 판정 영역 영역 회귀 가드 보완 (작업지시자 결정) |
| `feedback_self_verification_not_hancom` | fixture 부재 영역 영역 sample18 자체 한컴 검증 영역 영역 컨트리뷰터 환경 신뢰 + 본 환경 회귀 부재 입증 보완 |
| `reference_authoritative_hancom` | sample18.hwp 한컴 67 페이지 정합 기준 |

## 11. @jangster77 PR 시리즈 완결 총평

| PR | Issue | 본질 | 진단 도구 | 머지 |
|----|-------|------|----------|------|
| #956 | #952 Issue 1 | page border paper/body | bisect (`4bb11289`) | `b31e38ff` |
| #958 | #957 (Issue 2) | sample16 p18 빈 caption phantom | RHWP_DEBUG_TAC_CURSOR | `0b630773` |
| #961 | #959 (Issue 3) | 시험지 p1 문9 column picture advance | RHWP_DEBUG_TAC_CURSOR | `586e3cc0` |
| #963 | #960 (Issue 4) | 시험지 p2 cases off-by-one | RHWP_DEBUG_PARA_TAC | `415b9d8d` |
| #964 | #962 (Issue 5) | 시험지 p2 보기 textbox duplicate | SVG 분석 | `808f419e` |
| #966 | #965 | WMF SetTextAlign vertical bits | PR #918 Stage 33-A 포팅 | `235e049c` |
| **#968** | **#967** | **HWP3 sample18 +2 inflate** | **next_force_break 가드 v2** | **`d0c25754`** |

- 7 PR 모두 옵션 A — cherry-pick + 자기 검증 + 작업지시자 시각 판정 + no-ff merge
- 원 Issue #952 (1 통합 → 5 분리 결함) 완결 + WMF/HWP3 추가 2개
- 정정 모두 다른 파일/영역 (layout.rs ×3 + paragraph_layout.rs + shape_layout.rs + svg/mod.rs + typeset.rs)
- 환경변수 진단 도구 (RHWP_DEBUG_*) 영구화
- 매 PR cargo test 1288 + sweep 169 + 작업지시자 시각 판정 일관
- fixture 부재 (#963 exam_math p18 / #968 sample18) — 작업지시자 한컴 직접 확인 / 회귀 가드 보완 (`feedback_visual_judgment_authority` 권위)
- PR #918 (CLOSED, +5082 거대 PR) → #966 (root cause ~60 lines) 작은 단위 분리

## 12. 잔존 후속

- 본 PR 본질 정정 (Issue #967) 의 잔존 결함 부재
- Issue #967 close 완료
- HWPX sample18-hwp5.hwpx +7 inflate — 별도 task (HWPX 특화 pagination)
- `samples/hwp3-sample18.hwp` fixture 별도 추가 권장 — 회귀 가드 (본 PR 미포함)

---

작성: 2026-05-18
