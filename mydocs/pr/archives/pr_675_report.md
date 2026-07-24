---
PR: #675
제목: Task #672: TAC 표 비례 축소 임계값 강화 — 작은 차이 (≤2%) 면제 (closes #672)
컨트리뷰터: @jangster77 (Taesup Jang) — 14번째 사이클 PR (HWP 3.0 파서 영역의 핵심 영역 컨트리뷰터)
처리: MERGE (3 commits 단계별 보존 no-ff merge — 자동보정 모드 한정 정합, 그대로 보기 영역의 잔존 영역 PR #678 영역 처리)
처리일: 2026-05-08
---

# PR #675 최종 보고서

## 1. 결정

**3 commits 단계별 보존 no-ff merge** — 자동보정 모드 영역 한정 영역의 정합 영역. 그대로 보기 영역의 잔존 클립핑 영역은 PR #678 (Task #674) 영역에서 영역 별도 영역 처리 영역.

merge commit: `877e020f`

작업지시자 시각 판정 결과:
> "그래도 보기 선택 시 셀내 2줄인 경우 클립핑 현상 그대로 유지됨. 자동보정 선택시 셀내 2줄 컨텐츠 세로 방향 정렬 한컴처럼 변경됨."

작업지시자 결정: **머지 유지** (PR #678 머지 시 그대로 보기 영역의 클립핑 영역 자연 해소 영역).

## 2. 본 PR 영역의 본질 정정

### 정정 영역
`src/renderer/height_measurer.rs:805` 영역 단일 분기 영역.

```rust
const TAC_SHRINK_THRESHOLD_RATIO: f64 = 0.02;
let shrink_threshold = (common_h * TAC_SHRINK_THRESHOLD_RATIO).max(1.0);
let table_height = if table.common.treat_as_char && common_h > 0.0
    && raw_table_height > common_h + shrink_threshold {
    let scale = common_h / raw_table_height;
    for h in &mut row_heights {
        *h *= scale;
    }
    common_h
} else {
    raw_table_height
};
```

### 본질
- 정정 전: `raw > common + 1.0` (절대값 1px 영역) → 1.32% 차이 영역에서도 영역 비례 축소 발동 영역
- 정정 후: `raw > common + max(common * 2%, 1px)` → ≤2% 차이 영역 면제 영역
- 한컴 권위 영역: 작은 차이 영역 비례 축소 안 함 (계획서.hwp 1.32% 차이 영역 3 줄 정상 표시)

### 187 fixture 영역 sweep 분포
- ≤2% 7 건 → 면제 영역 (정정 효과)
- ≥5% 11 건 → 비례 축소 발동 (의도적 압축 영역 그대로)

## 3. 본 환경 검증 결과

### 3.1 cherry-pick simulation
- `local/pr675-sim` 브랜치 영역, Task #672 영역의 3 commits cherry-pick (Task #671 영역의 3 commits 영역은 PR #673 영역에서 머지됨)
- Stage 3 영역의 `orders/20260507.md` 영역 충돌 영역 — ours (devel 보존)

### 3.2 결정적 검증
- `cargo test --release` → ALL PASS, failed 0건
- `cargo test --release --lib` → 1165 passed (회귀 0)
- `cargo test --release --test svg_snapshot --test issue_546 --test issue_554` → 20/20
- `cargo clippy --release` → clean

### 3.3 광범위 회귀 sweep
```
2010-01-06: total=6 same=5 diff=1 (p5)
aift: total=77 same=77 diff=0
exam_eng: total=8 same=8 diff=0
exam_kor: total=20 same=20 diff=0
exam_math: total=20 same=20 diff=0
exam_science: total=4 same=4 diff=0
synam-001: total=35 same=33 diff=2 (p19, p31)
TOTAL: pages=170 same=167 diff=3
```

→ 영향 영역만 (3 페이지). 다른 6 샘플 (135 페이지) 회귀 0 ✅.

### 3.4 inspect_task672 영역의 본 환경 직접 측정
```
samples/계획서.hwp sec=0 pi=0 ci=2 | common=969.53 raw=982.29 diff=+12.76 (+1.32%)
samples/2010-01-06.hwp sec=0 pi=63 ci=0 | common=351.53 raw=358.47 diff=+6.93 (+1.97%)
samples/synam-001.hwp sec=0 pi=153 ci=0 | common=316.39 raw=319.37 diff=+2.99 (+0.94%)
samples/synam-001.hwp sec=0 pi=237 ci=0 | common=994.40 raw=998.16 diff=+3.76 (+0.38%)
samples/hwp-img-001.hwp sec=0 pi=0 ci=2 | common=309.41 raw=313.17 diff=+3.76 (+1.22%)
samples/hwp-3.0-HWPML.hwp sec=3 pi=349 ci=0 | common=699.73 raw=700.83 diff=+1.09 (+0.16%)
samples/hwpspec.hwp sec=4 pi=349 ci=0 | common=699.73 raw=700.83 diff=+1.09 (+0.16%)

# Total TAC tables: 2221, Shrink發動 (정정 후): 7 영역 모두 면제 영역
```

### 3.5 작업지시자 시각 판정 결과

| 모드 | 결과 |
|------|------|
| **자동보정 영역** | ✅ 셀내 2줄 컨텐츠 세로 방향 정렬 한컴처럼 변경 — Task #672 영역의 정정 효과 |
| **그대로 보기 영역** | ❌ 셀내 2줄 영역 클립핑 그대로 유지 — PR #678 영역에서 별도 정정 영역 |

→ Task #672 영역의 본질 영역 (HeightMeasurer 영역의 row_heights 비례 축소 임계값 영역) 영역 영역 정확히 영역 정정 영역. 그대로 보기 영역의 클립핑 영역은 paragraph_layout 영역의 줄 위치 영역의 본질 영역 — 본 PR 영역의 본질 영역과 다른 영역, PR #678 영역에서 영역 자연 영역 해소 영역 예정 영역.

## 4. 작업지시자 가설 영역 점검 결과

### 가설
> "#674 PR 에서 메인테이너가 추가한 자동보정으로 #675 에서 해결하려고 한 문제가 해결된 것 같군요. 확인이 필요합니다."

### 점검 결과 — ❌ 가설 영역 미정합

**그대로 보기 영역 (자동보정 영역 미발동) 영역에서 영역의 SVG 영역 비교 영역**:

| 영역 | md5 | 크기 |
|------|-----|------|
| devel (PR #673 + A1 영역만) | `b66efd77...` | 237,884 bytes |
| PR #675 (Task #672 영역 추가) | `cc174155...` | 237,178 bytes (-706) |

→ Task #672 영역의 정정 영역 영역 그대로 보기 영역에서도 영역 영향 영역 발생 영역. 두 영역 영역 다른 본질 영역.

### 두 영역의 본질 영역 분리 영역

| 영역 | 본질 위치 | 본질 영역 |
|------|----------|----------|
| PR #673 + A1 (자동보정 영역) | `document.rs:270, 425` | LINE_SEG 채움 영역의 셀 폭 영역 정정 영역 |
| **PR #675 (Task #672)** | `height_measurer.rs:805` | HeightMeasurer 영역의 row_heights 비례 축소 영역의 임계값 영역 |
| **PR #678 (Task #674) 잔존** | `paragraph_layout.rs` corrected_line_height | paragraph_layout 영역의 줄 위치 영역의 본질 영역 (그대로 보기 영역의 클립핑 영역) |

→ 세 영역 영역 별도 본질 영역. 컨트리뷰터 영역의 분리 영역 정합 영역.

## 5. 메모리 룰 적용 결과

### `feedback_visual_judgment_authority` 권위 사례 강화
> 결정적 검증만으로 부족, 메인테이너 시각 판정 영역의 권위 사례

→ 본 PR 영역의 작업지시자 영역 정밀 시각 판정 영역 영역 — 자동보정 영역 정합 + 그대로 보기 영역의 잔존 클립핑 영역 분리 영역. 결정적 검증 + 광범위 sweep 통과 영역 영역에도 영역 시각 판정 영역에서만 영역 두 모드 영역의 차이 영역 영역 검출 영역.

### `feedback_pr_supersede_chain` 권위 사례 확장 — 동일 컨트리뷰터 영역의 다단계 영역 본질 영역 분리 영역
@jangster77 영역의 PR #673 (Task #671) → PR #675 (Task #672) → PR #678 (Task #674) 영역의 누적 영역의 봅질 영역 분리 영역. 각 PR 영역의 영역 본질 영역 영역 다른 영역의 정합 영역. 컨트리뷰터 영역의 깔끔한 분리 영역의 정합 영역.

### `feedback_hancom_compat_specific_over_general`
→ 본 PR 영역의 임계값 영역 (2%) 영역 sweep 분포 영역 분석 영역 영역 합리화 영역. 잔존 영역 (Issue #674) 영역 별도 본질 영역 분리 영역의 정합 영역.

### `feedback_contributor_cycle_check`
→ @jangster77 영역의 14번째 사이클 PR 영역 영역 정확 표현 (PR #451 부터 누적, HWP 3.0 파서 핵심 컨트리뷰터). 메모리 룰 영역 정합.

## 6. 산출물

| 산출물 | 경로 |
|--------|------|
| 검토 보고서 | `mydocs/pr/archives/pr_675_review.md` |
| 최종 보고서 | `mydocs/pr/archives/pr_675_report.md` (본 문서) |
| merge commit | `877e020f` (no-ff, 3 commits 단계별 보존) |
| 진단 도구 영구 보존 | `examples/inspect_task672.rs` |
| 잔존 분리 | Issue #674 → PR #678 (그대로 보기 영역의 클립핑 영역) |

## 7. 컨트리뷰터 응대

@jangster77 (Taesup Jang) 14번째 사이클 PR 안내:
- 본질 정정 정확 (HeightMeasurer 영역의 row_heights 비례 축소 임계값 영역)
- 187 fixture sweep 영역의 분포 분석 영역 영역 합리화 영역 (≤2% 7 건 면제, ≥5% 11 건 보존)
- 본 환경 결정적 검증 통과 + 광범위 sweep 영향 영역만 (3 페이지)
- 작업지시자 시각 판정:
  - 자동보정 영역 ★ 정합 (셀내 2줄 컨텐츠 한컴처럼 정렬)
  - 그대로 보기 영역의 잔존 영역 → PR #678 (Task #674) 영역 영역 자연 해소 영역
- 봅질 영역 분리 정합 (PR #673 → #675 → #678 영역의 단계 영역)
- merge 결정

작성: 2026-05-08
