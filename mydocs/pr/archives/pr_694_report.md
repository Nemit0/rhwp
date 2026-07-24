---
PR: #694
제목: Task #688 — table-vpos-01.hwpx p.5 nested 11×3 그리드 시각 누락 정정
컨트리뷰터: @planet6897 (Jaeuk Ryu)
처리: 4 commits cherry-pick + 메인테이너 충돌 해결 통합 정정 + WASM 빌드 + 시각 판정 통과
처리일: 2026-05-09
머지 commit: f3534293
---

# PR #694 처리 보고서

## 1. 처리 결과

✅ **머지 완료** — 메인테이너 충돌 해결 통합 정정 + 시각 판정 ★ 통과

| 항목 | 값 |
|------|-----|
| 머지 commit | `f3534293` (Merge PR #694) |
| 머지 방식 | --no-ff merge (충돌 해결 통합 정정 단일 commit) |
| Issue #688 | close 예정 |
| 시각 판정 | ★ 통과 (table-vpos-01.hwpx p.5) |
| 별건 후속 | 도형 2개 미출력 결함 별도 이슈 등록 예정 |

## 2. 본질 결함

`samples/table-vpos-01.hwpx` 5쪽 마지막 큰 표 (pi=34, 정부혁신 4대 추진전략) 의 외부 1×1 셀이 nested 표 2개 (1×1 헤더 + 11×3 그리드) 를 분리된 paragraph 로 보유. 두 곳의 1×1 wrapper unwrap 분기가 `flat_map(...).find_map(...)` 으로 첫 nested 표만 추출 → paragraphs 2번째 nested 표 누락:

- `src/renderer/layout/table_layout.rs::layout_table()` — 외부 표가 nested 1×1 헤더로 unwrap → 11×3 그리드 누락
- `src/renderer/height_measurer.rs::measure_table_impl()` — `measured_table.row_heights = [57.72px]` (1×1 헤더 height 만) → cell-clip 작게 잡혀 nested 11×3 그리드 (y=295~) 클립 밖

→ 외부 표 height 778.8px (권위) → 57.72px 부족 (~14배), 페이지 5 nested 11×3 그리드 시각 누락.

## 3. 메인테이너 통합 정정

### 3.1 충돌 발견

`git merge --no-ff contrib/pr-task688-stream` 시 두 곳 충돌:

- **`src/renderer/layout/table_layout.rs`** content 충돌 — devel 의 PR #681 (Task #680, 자료 박스 외곽 테두리 추가) 과 PR #694 의 4 조건 가드가 동일 분기 영역
- **`src/renderer/height_measurer.rs`** auto-merge (PR #681 미수정 영역, 충돌 없음)
- **`mydocs/orders/20260508.md`** add/add 충돌 (양쪽 동일 날짜 별도 추가)

### 3.2 회귀 위험 분석

PR #694 의 4 조건 가드 (특히 `controls.len() == 1`) 를 그대로 적용 시:

`exam_social.hwp` pi=15 의 외부 1×1 셀:
- `paragraphs.len() == 1` ✓
- `controls.len() == 1` ✗ — **2** (정렬 마커 + nested 6×3 표)

→ PR #694 가드 미충족 → 1×1 wrapper unwrap 미발동 → **PR #681 외곽선 분기까지 미발동** → 4번 자료 박스 외곽선 회귀 누락.

### 3.3 통합 정정 방향

`controls.len() == 1` 가드 제거 + `paragraphs.len() == 1` 만 본질 가드로 보존 + `find_map` 으로 정렬 마커 등 다른 control 무시하고 첫 nested table 만 추출.

```rust
if cell.paragraphs.len() == 1 {
    let p = &cell.paragraphs[0];
    let has_visible_text = p.text.chars().any(|ch| !ch.is_whitespace() && ch != '\r' && ch != '\n');
    if !has_visible_text {
        if let Some(nested) = p.controls.iter()
            .find_map(|c| if let Control::Table(t) = c { Some(t.as_ref()) } else { None })
        {
            // PR #681 외곽 테두리 분기 + nested unwrap
        }
    }
}
```

두 곳 (table_layout.rs + height_measurer.rs) 모두 동일 정정.

**합리화** (메모리 룰 `feedback_hancom_compat_specific_over_general` 정합):
- Task #688 본질 (다중 paragraph 의 nested 표 누락 방지) → `paragraphs.len() == 1` 가드만으로 충분
- `controls.len() == 1` 은 **과도한 정밀화** — exam_social pi=15 처럼 다른 control 동거 케이스에서 unwrap + 외곽선 모두 보존되어야 함

## 4. 자기 검증

### 4.1 결정적 검증

| 검증 | 결과 |
|------|------|
| `cargo build --release` | ✅ 통과 (26.66s) |
| `cargo test --release --test issue_nested_table_border` | ✅ **1/1 PASS** (PR #681 회귀 가드) |
| `cargo test --release --test svg_snapshot` | ✅ 8/8 PASS |
| `cargo test --release` (전체) | ✅ lib 1166 + 통합 ALL GREEN, failed 0 |
| `cargo clippy --release --all-targets` | ✅ 신규 경고 0 |

### 4.2 광범위 sweep

```
TOTAL: pages=170 same=170 diff=0
```

7 fixture (exam_kor 20p, exam_eng 8p, exam_science 4p, exam_math 20p, synam-001 35p, aift 77p, 2010-01-06 6p) 회귀 0건.

### 4.3 시각 대상 직접 측정

| 파일 | BEFORE (devel) | AFTER (PR-merged) | 비고 |
|------|----------------|-------------------|------|
| `table-vpos-01.hwpx` p.5 | 20,516 bytes | **133,816 bytes** (×6.5) | nested 11×3 그리드 콘텐츠 완전 복원 |
| `exam_social.hwp` p.1 | 826,342 bytes | 826,342 bytes | **byte-identical** — PR #681 외곽선 분기 보존 |

→ PR #681 외곽선 회귀 차단 정합.

## 5. 시각 판정 게이트 (작업지시자)

**판정**: ★ **통과** (p.5 nested 11×3 그리드 시각 정합, PDF 권위본 `pdf/table-vpos-01-2022.pdf` 5쪽 정합)

**별건 결함 발견**: 도형 2개 미출력 — 본 PR 정정으로 인한 회귀가 아닌 **별개 결함** (작업지시자 확정). 본 PR 처리 완료 후 별도 이슈 등록 예정.

## 6. WASM 빌드

```
[INFO]: Optimizing wasm binaries with `wasm-opt`...
[INFO]: :-) Done in 1m 19s
```

산출물: `pkg/rhwp_bg.wasm` 4,594,114 bytes.

## 7. 메모리 룰 적용

| 룰 | 적용 |
|----|------|
| `feedback_pr_supersede_chain` | PR #681 (외곽 테두리) → PR #694 (1×1 unwrap 정밀화) 동일 분기 충돌 → 메인테이너 통합 정정 신규 패턴 |
| `feedback_hancom_compat_specific_over_general` | `controls.len() == 1` 과도한 정밀화 → `paragraphs.len() == 1` 본질 가드만 보존 |
| `feedback_image_renderer_paths_separate` | table_layout.rs + height_measurer.rs 두 경로 동일 정정 적용 |
| `feedback_visual_judgment_authority` | 결정적 검증 + sweep 통과 + ★ 통과. 별건 결함은 시각 판정에서만 발견 (cell-clip 확장 + nested 표시 후 가시화) |
| `feedback_contributor_cycle_check` | @planet6897 30+ 사이클 핵심 컨트리뷰터 정확 표현 |

## 8. 잔존 후속

- **Issue #726 (5/9 신규 등록)** — table-vpos-01.hwpx p.5 nested 11×3 그리드 안 4대 그룹 구분 도형 2개 SVG 미출력. 본 PR 범위 외 별건 결함. 본 환경 IR 권위 (pi=34 셀[18] 다각형 1개 + 셀[6]/셀[13] ctrls=0) + SVG polygon 0건 측정 — 두 결함 후보: (a) SVG renderer 다각형 미출력, (b) HWPX 파서 다각형 누락. 시각 판정에서 nested 11×3 그리드 표시 + cell-clip 확장 후 가시화된 별건.
- 페이지 2/3 hwp_used diff (-791.9px / -1658.3px) — 본 수정과 무관, PR 본문 명시
- 1×1 wrapper unwrap 로직 두 곳 (table_layout.rs + height_measurer.rs) 중복 — 향후 공통 helper 추출 검토

---

작성: 2026-05-09
