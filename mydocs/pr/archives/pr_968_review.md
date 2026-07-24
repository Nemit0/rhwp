---
PR: #968
제목: fix — 빈 paragraph + 다음 [쪽나누기] case 단독 page 차단 (HWP3 sample18 페이지 수 +2 inflate 해소, closes #967)
컨트리뷰터: @jangster77 (Taesup Jang) — 24+ 사이클 핵심 컨트리뷰터 (연속 5 PR #956~#964 + #966 후 추가 마지막)
base / head: devel / local/task967
mergeStateStatus: BEHIND
mergeable: MERGEABLE
CI: ✅ Build & Test + CodeQL (js-ts/python/rust) + Canvas visual diff
변경 규모: +655 / -0, 9 files (코드 1 / 문서 8)
커밋: 3 (본질 1 + devel merge 2)
검토일: 2026-05-18
---

# PR #968 검토

## 1. 메타

| 항목 | 값 |
|------|-----|
| PR 번호 | #968 |
| 제목 | fix: 빈 paragraph + 다음 [쪽나누기] case 단독 page 차단 (HWP3 sample18 +2 inflate) |
| 컨트리뷰터 | @jangster77 — **24+ 사이클** (연속 5 PR #956~#964 + #966 완료 후 **추가 마지막 #968**) |
| base / head | devel / local/task967 |
| mergeable | MERGEABLE (BEHIND — base 갱신만) |
| CI | ✅ 전 항목 통과 (Build & Test + CodeQL + Canvas visual diff) |
| 변경 규모 | +655 / -0, 9 files (코드 1 / 문서 8) |
| 커밋 수 | 3 (본질 `3c1ea870` + devel merge 2) |
| closes | #967 |

## 2. 본질 (Issue #967)

`samples/hwp3-sample18.hwp` (HWP3) 페이지 수 rhwp **69** vs 한컴 **67** — **+2 inflate**.
빈 paragraph (pi=27, pi=164) 직후 [쪽나누기] (pi=28, pi=165) case 영역 영역
빈 paragraph 가 별도 page 분기 → 단독 빈 페이지 생성.

### Root cause (`src/renderer/typeset.rs:555-584`)
```rust
let next_force_break = next_para.column_type == ColumnBreakType::Page
    || next_para.column_type == ColumnBreakType::Section;
if next_force_break { false }  // ← hwp-multi-001 회귀 차단 목적
```
pi=28/165 [쪽나누기] → next_force_break=true → `next_will_vpos_reset` 가드 미발동
→ pi=27/164 단독 page 생성.

## 3. 정정 본질 — `src/renderer/typeset.rs:581` (별도 분기 추가)

기존 `next_will_vpos_reset` 가드 직후 별도 분기:
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
        if empty_h_px > avail {
            continue;  // 빈 paragraph fit 안 됨 → skip (단독 page 차단)
        }
        // fit 가능 — 정상 emit (기존 동작)
    }
}
```

### v2 정밀화 (CI 회귀 후)
- **v1** (조건 무관 skip): aift.hwp page 3 의 normally-fitting empty paragraph 도
  skip → layout 변경 → snapshot 회귀
- **v2** (현재): 빈 paragraph 가 **실제 fit 안 되는 case (overflow) 만** skip.
  fit 가능 case (aift.hwp 18 case) 는 정상 emit

→ `feedback_hancom_compat_specific_over_general` 정합 (overflow 조건 한정,
일반화 없음). 컨트리뷰터 영역 영역 CI snapshot 회귀 발견 후 자체 v2 정밀화.

## 4. 영역 좁힘 (PR 본문 명시)

| 영역 | 영향 |
|------|------|
| 빈 paragraph + 다음 [쪽나누기] + overflow | skip → +1 page inflate 제거 |
| 빈 paragraph + 다음 [쪽나누기] + fit 가능 | 영향 없음 (정상 emit, aift.hwp 18 case) |
| 비-빈 paragraph + 다음 [쪽나누기] | 영향 없음 (기존 동작) |
| 빈 paragraph + 다음 일반 paragraph | 영향 없음 (기존 vpos-reset 가드) |
| hwp-multi-001 (회귀 차단) | 영향 없음 (변경 없음) |

## 5. 본 환경 충돌 분석

| 파일 | 충돌 | 본질 |
|------|------|------|
| `src/renderer/typeset.rs` | changed in both | devel 영역 영역 Task #836 (Endnote, `6738448f`) + #901/#866 typeset 변경 누적. PR #968 영역 영역 :581 별도 분기 추가 — **충돌 점검 필요** |
| `mydocs/orders/20260518.md` | 신규 (5/18) | PR #968 영역 영역 Task #967 작업 일지 — 본 환경 5/18 orders 미생성 → 충돌 없음 (PR 측 신규) |
| `task_m100_967*` 8 | added in remote | 신규 추가 |

본 세션 PR #956~#966 은 typeset.rs 미변경 (layout.rs/paragraph_layout.rs/
shape_layout.rs/svg/mod.rs) → PR #968 typeset.rs 정정 영역 영역 Task #836 등
devel 변경 영역 영역 다른 라인 → auto-merge 가능성. cherry-pick 시 점검.

## 6. 본 환경 점검

### 6.1 CI 통과
- ✅ Build & Test + CodeQL (js-ts/python/rust) + Canvas visual diff (전 항목)

### 6.2 검증 (PR 본문)
- cargo test --release (전체): 통과 (lib 1288 + integration svg_snapshot 포함)
- sample18.hwp 페이지 수: **69 → 67 ✓** (한컴 정합)
- 다중 sample 16개 회귀 0 — sample, 10/11/13/14/16/19/4/5, table_test*, multi-table-001/002, exam_kor/math/eng
- **hwp-multi-001 (회귀 차단 case): 변경 없음 ✓**
- aift.hwp snapshot test: PASS ✓ (v1 회귀 해소)

### 6.3 잔존 (별도 task)
- HWPX sample18-hwp5.hwpx +7 inflate — 별도 issue (HWPX 특화 pagination)

## 7. 처리 옵션

### 옵션 A (권장) — 본질 commit cherry-pick + 충돌 수동 해결 + 자기 검증 + WASM 재빌드

```bash
git checkout local/devel
git cherry-pick 3c1ea870   # 본질만 (devel merge commit 2개 제외)
# 충돌 수동 해결:
#   - typeset.rs: PR #968 :581 별도 분기 + devel Task #836 변경 보존
#   - orders: 5/18 신규 (PR 측) — 본 환경 5/17 orders 와 별 파일
# cargo test (전체, svg_snapshot 포함) + 광범위 sweep
# WASM 재빌드
git checkout devel
git merge local/devel --no-ff
```

### 옵션 B — squash 3 commits (devel merge 포함, 비권장)

## 8. 검증 게이트

### 8.1 자기 검증
- [ ] cherry-pick `3c1ea870` (본질만) + typeset.rs 충돌 수동 해결
- [ ] devel Task #836 (Endnote) + #901/#866 typeset 변경 보존 확인
- [ ] **cargo test --release (전체)** — lib 1288 + integration svg_snapshot (aift.hwp 회귀 점검 필수)
- [ ] cargo clippy --release -- -D warnings
- [ ] **광범위 sweep 7 fixture / 169 페이지** — typeset pagination 변경 영역 영역 회귀 점검 필수
- [ ] WASM 재빌드 (typeset.rs 변경)

### 8.2 시각 판정 게이트 — **작업지시자 시각 검증 권장**
- sample18 (HWP3) 페이지 수 — 69 → 67 (한컴 정합, +2 inflate 해소)
- hwp-multi-001 — 회귀 부재 (회귀 차단 case, 변경 없음)
- aift.hwp page 3 — normally-fitting empty paragraph 정상 emit (v1 회귀 해소 확인)
- 다중 sample (sample10~16/19, table_test, exam_kor/math/eng) 회귀 부재
- 잔존: HWPX sample18-hwp5.hwpx +7 inflate (본 PR 범위 외, 별도 task)

## 9. 메모리 룰 적용

| 룰 | 적용 |
|----|------|
| `feedback_contributor_cycle_check` | @jangster77 **24+ 사이클** (연속 5 PR + #966 + 추가 마지막 #968) |
| `feedback_image_renderer_paths_separate` | typeset.rs pagination 단일 — 다른 렌더 경로 무관 |
| `feedback_hancom_compat_specific_over_general` 권위 사례 강화 | **v1 (조건 무관 skip) → CI snapshot 회귀 → v2 (overflow 조건 한정)** — 일반화 위험 발견 후 케이스별 정밀화 입증 |
| `feedback_diagnosis_layer_attribution` | `next_force_break` 가드 미발동 (hwp-multi-001 회귀 차단 목적) root cause 정확 진단 |
| `feedback_visual_judgment_authority` | CI snapshot (aift.hwp) 회귀 영역 영역 v2 정밀화 — 결정적 검증 게이트 |
| `feedback_pr_supersede_chain` | Task #927 (sample16 페이지 수 inflate, closed) 와 무관 — 별 결함 분리 진단 |
| `reference_authoritative_hancom` | sample18.hwp 한컴 67 페이지 정합 기준 |

## 10. 처리 순서 (승인 후)

1. `local/devel` 영역 cherry-pick `3c1ea870` (본질만) + typeset.rs 충돌 수동 해결
2. devel Task #836 (Endnote) typeset 변경 보존 확인
3. 자기 검증 — cargo test 전체 (svg_snapshot aift.hwp 포함) + clippy + 광범위 sweep + WASM 재빌드
4. 작업지시자 시각 검증 (sample18 67 페이지 + hwp-multi-001 + aift.hwp page 3 회귀 부재)
5. 검증 통과 → no-ff merge + push + archives + 5/18 orders
6. Issue #967 close + PR #968 close — **@jangster77 연속 PR 시리즈 완결**

---

작성: 2026-05-18
