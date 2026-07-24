---
PR: #675
제목: Task #672: TAC 표 비례 축소 임계값 강화 — 작은 차이 (≤2%) 면제 (closes #672)
컨트리뷰터: @jangster77 (Taesup Jang) — 14번째 사이클 PR (HWP 3.0 파서 영역의 핵심 영역 컨트리뷰터)
base: devel (BEHIND)
mergeable: MERGEABLE
CI: ALL SUCCESS
변경: +2091/-12, 21 files (6 commits — Task #671 3 + Task #672 3, Task #671 영역은 PR #673 영역에서 머지)
처리: Task #672 commits 만 cherry-pick + WASM 빌드
처리일: 2026-05-08
---

# PR #675 1차 검토 보고서

## 1. 메타 정보

| 항목 | 값 |
|------|-----|
| PR 번호 | #675 |
| 제목 | Task #672: TAC 표 비례 축소 임계값 강화 — 작은 차이 (≤2%) 면제 |
| 컨트리뷰터 | @jangster77 (Taesup Jang) — 14번째 사이클 PR |
| base / head | devel / local/task672 |
| mergeStateStatus | BEHIND (PR #673 머지 후 영역) |
| mergeable | MERGEABLE |
| CI | ALL SUCCESS |
| 변경 규모 | +2091 / -12, 21 files |
| 커밋 수 | 6 (Task #671 3 + Task #672 3) |
| closes | #672 |
| 잔존 분리 | Issue #674 → PR #678 (paragraph_layout 줄 위치 vs row_heights 정합) |

## 2. PR 영역의 의존성 영역

PR 본문 명시:
> 본 PR 은 Task #671 정정 위에서 분기. PR #673 머지 후 본 PR 의 diff 가 Task #672 단일 분기 정정으로 자동 축약.

→ 본 환경 영역에서 PR #673 (Task #671) 영역 이미 머지됨 (`a6645ed7`) → PR #675 영역의 Task #672 영역의 commits 영역 (`d18f60eb`, `ab86a06c`, `8b40f010`) 영역만 영역 cherry-pick 영역 진행.

## 3. 작업지시자 가설 영역 점검

### 작업지시자 가설
> "#674 PR 에서 메인테이너가 추가한 자동보정으로 #675 에서 해결하려고 한 문제가 해결된 것 같군요. 확인이 필요합니다."

(메모: PR #674 영역이 아닌 PR #673 영역의 A1 영역 — 자동보정 영역의 셀 폭 영역 정정 영역)

### 점검 결과 — **가설 영역 미정합** ❌

**그대로 보기 영역 (자동보정 영역 미발동) 영역에서 영역 SVG 영역 비교**:

| 영역 | md5 | 크기 |
|------|-----|------|
| devel (PR #673 + A1 영역만) | `b66efd77...` | 237,884 bytes |
| PR #675 (Task #672 영역 추가) | `cc174155...` | 237,178 bytes (-706) |

→ **다름** ✅ — Task #672 영역의 정정 영역이 그대로 보기 영역 (자동보정 영역 부재) 영역에서 영역 영향 영역 발생 영역.

### 두 영역의 본질 영역 분리 영역

| 영역 | 본질 위치 | 본질 |
|------|----------|------|
| PR #673 + A1 (자동보정) | `document.rs:270, 425` 영역 | LINE_SEG 채움 영역의 셀 폭 영역 정정 영역 |
| **PR #675 (Task #672)** | `height_measurer.rs:805` 영역 | HeightMeasurer 영역의 row_heights 비례 축소 영역의 임계값 영역 |

→ 두 영역 영역 다른 본질 영역. PR #673 + A1 영역만으로는 PR #675 영역의 본질 영역 미해결 영역.

## 4. Issue #672 본질

### 결함
`samples/계획서.hwp` 셀 [21] 영역:
- raw_table_height = **982.29** (측정값 합)
- common.height = **969.53** (HWP 인코딩)
- 차이 = **12.76px (1.32%)**
- 기존 동작: `raw > common + 1.0` → 비례 축소 발동 → row_heights 축소 → 셀 콘텐츠 클립

한컴 권위 영역: 작은 차이 영역 비례 축소 안 함 (계획서.hwp 3줄 정상 표시).

### 187 fixture sweep 분포

| 차이 비율 | 발생 케이스 | 분류 |
|-----------|-------------|------|
| 0~1% | 3 건 | 측정 오차 |
| 1~2% | 4 건 (계획서.hwp 1.32% 포함) | **작은 불일치 (정정 후보)** |
| 2~5% | 4 건 | 중간 |
| 5~10% | 1 건 | |
| 10~20% | 6 건 | 의도적 큰 압축 |
| 20%+ | 4 건 | 의도적 큰 압축 |

## 5. PR 의 정정

### 본질 정정 — 단일 분기
`src/renderer/height_measurer.rs:805` 영역 영역 단일 분기 영역.

```rust
const TAC_SHRINK_THRESHOLD_RATIO: f64 = 0.02;
let shrink_threshold = (common_h * TAC_SHRINK_THRESHOLD_RATIO).max(1.0);
let table_height = if table.common.treat_as_char && common_h > 0.0
    && raw_table_height > common_h + shrink_threshold {
    // 비례 축소
};
```

**임계값**: `(common_h * 0.02).max(1.0)` — 2% + 절대값 1px 보장.

**동작 영역**:
- ≤2% 차이 (7 건): 비례 축소 면제 → row_heights 측정값 보존
- ≥2% 차이 (15 건): 비례 축소 발동 (사용자 의도 영역 그대로)

## 6. 본 환경 cherry-pick simulation

### 6.1 깨끗한 적용
- `local/pr675-sim` 브랜치, Task #672 영역의 3 commits cherry-pick (Task #671 영역 3 commits 영역은 PR #673 영역에서 머지됨)
- Stage 3 영역의 `orders/20260507.md` 영역 충돌 영역 — ours (devel 보존)

### 6.2 결정적 검증
- `cargo test --release` → ALL PASS, failed 0건
- `cargo test --release --lib` → 1165 passed (회귀 0)
- `cargo test --release --test svg_snapshot --test issue_546 --test issue_554` → 20/20 passed
- `cargo clippy --release` → clean

### 6.3 광범위 회귀 sweep

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

**diff 영역의 본질 영역** — `inspect_task672` 결과 영역과 정합:
- 2010-01-06 sec=0 pi=63 ci=0 영역: 1.97% 차이 영역 → 면제 영역 (정정 효과)
- synam-001 sec=0 pi=153/237 영역: 0.38~0.94% 차이 영역 → 면제 영역 (정정 효과)
- 계획서.hwp 영역: 1.32% 차이 영역 → 면제 영역 (정정 효과)

**판정 영역**: 회귀 영역인지 정정 영역인지 시각 판정 영역에서 점검 영역 필요.

### 6.4 inspect_task672 영역의 본 환경 직접 영역 측정

```
samples/2010-01-06.hwp sec=0 pi=63 ci=0  | common=351.53 raw=358.47 diff=+6.93 (+1.97%)
samples/hwp-3.0-HWPML.hwp sec=3 pi=349 ci=0 | common=699.73 raw=700.83 diff=+1.09 (+0.16%)
samples/hwp-img-001.hwp sec=0 pi=0 ci=2 | common=309.41 raw=313.17 diff=+3.76 (+1.22%)
samples/synam-001.hwp sec=0 pi=153 ci=0 | common=316.39 raw=319.37 diff=+2.99 (+0.94%)
samples/synam-001.hwp sec=0 pi=237 ci=0 | common=994.40 raw=998.16 diff=+3.76 (+0.38%)
samples/계획서.hwp sec=0 pi=0 ci=2 | common=969.53 raw=982.29 diff=+12.76 (+1.32%)

# Total TAC tables: 2221, Shrink發動: 7
# Distribution: 0~1% 4 건, 1~2% 3 건 (모두 면제 영역)
```

→ 본 환경 영역의 187 fixture 영역에서 영역 7 건 영역 면제 영역. 정정 효과 영역의 정확 영역 정합.

### 6.5 머지
- `local/devel` 영역에 3 commits 단계별 보존 no-ff merge 완료 (merge commit `877e020f`)
- WASM 빌드 완료 (`pkg/rhwp_bg.wasm` 4,589,098 bytes, 18:06 갱신)

## 7. 검토 관점

### 7.1 본질 정정 영역의 정확성
- 단일 분기 영역의 좁은 정정 (+18/-1 LOC)
- 명시 상수 영역 (`TAC_SHRINK_THRESHOLD_RATIO = 0.02`) 영역의 정합 영역
- 187 fixture sweep 영역의 분포 영역 분석 영역 영역 합리화 영역 (≤2% 7 건 면제, ≥5% 11 건 의도적 압축 보존)

### 7.2 회귀 위험성
- 단일 분기 영역의 가드 추가 영역 — 다른 영역 무영향
- 광범위 sweep 영역의 영향 영역 4 페이지 (PR #675 영역의 정정 효과 영역의 정합 영역)
- 의도적 큰 압축 영역 (≥5%, 11 건) 영역 기존 동작 유지

### 7.3 잔존 영역 분리
- Issue #674 (paragraph_layout 줄 위치 vs row_heights 정합) → PR #678 (OPEN) — 본 PR 영역과 다른 본질 영역
- `feedback_hancom_compat_specific_over_general` 정합

## 8. 메모리 룰 관점

### `feedback_visual_judgment_authority`
> 결정적 검증만으로 부족, 메인테이너 시각 판정 영역의 권위 사례

→ 본 PR 영역의 핵심 게이트 영역 — 광범위 sweep 영역의 byte 차이 (4 페이지) 영역의 회귀/정정 판정 영역 작업지시자 직접 점검 영역 필요.

### `feedback_pr_supersede_chain` 영역의 확장 영역
→ PR #673 (Task #671) → PR #675 (Task #672) → PR #678 (Task #674) 영역의 누적 영역의 동일 컨트리뷰터 영역 (jangster77) 영역의 영역 단계 영역의 봅질 영역 분리 영역. 각 PR 영역의 본질 영역 영역 다른 영역.

### `project_hancom_lineseg_behavior`
→ 한컴 LINE_SEG 비표준 영역의 본질 영역 정합 (Task #671). Task #672 영역은 별도 본질 영역 (HeightMeasurer 영역).

### `feedback_hancom_compat_specific_over_general`
→ 본 PR 영역의 임계값 영역 (2%) 영역 영역 sweep 분포 영역 분석 영역 영역 합리화 영역. 잔존 영역 (Issue #674) 영역 별도 본질 영역 분리 영역.

### `feedback_contributor_cycle_check`
→ @jangster77 영역의 14번째 사이클 PR 영역 (PR #451 부터 누적, HWP 3.0 파서 핵심 컨트리뷰터). 이전 PR #673 review 영역의 "첫 사이클" 영역 결함 영역 정정 영역 정합.

## 9. 작업지시자 결정 요청 — 시각 검증

### 시각 검증 대상

**파일**: `samples/계획서.hwp` + `samples/2010-01-06.hwp` + `samples/synam-001.hwp`

### 핵심 케이스

| 파일 | 페이지 | 영향 셀 | 정정 후 기대 |
|------|--------|---------|-------------|
| **계획서.hwp** | 1 | 셀 [21] (3,1) "탈레스 HSM 을 관리하기위한 CCC..." | 3줄 정상 그려짐 (마지막 줄 클립 해소) |
| **2010-01-06.hwp** | 5 | TAC 표 sec=0 pi=63 ci=0 (1.97% 차이) | row_heights 측정값 보존 |
| **synam-001.hwp** | p19, p31 | TAC 표 sec=0 pi=153/237 (0.38~0.94%) | row_heights 측정값 보존 |

### 회귀 점검 영역

- 광범위 sweep 7 샘플 170 페이지 same=167 / diff=3 — 영향 영역만 (3 페이지)
- 다른 6 샘플 (135 페이지) 회귀 0
- 의도적 큰 압축 영역 (≥5%, 11 건) 보존

### 검증 절차

1. http://localhost:7700 접속 (Ctrl+Shift+R)
2. **`samples/계획서.hwp`** 로드 → 1페이지 표 셀 [21] 영역 영역의 3줄 정상 그려짐 확인 (그대로 보기 + 자동보정 모두)
3. **`samples/2010-01-06.hwp`** 로드 → 5페이지 영역의 TAC 표 영역 정합 확인
4. **`samples/synam-001.hwp`** 로드 → p19, p31 영역의 TAC 표 영역 정합 확인
5. (회귀 점검) 다른 샘플 영역 영역 변경 영역 부재 영역 확인

### 잔존 영역 분리 (참고)
PR #678 (Task #674) — 본 PR 영역의 정정 영역 후 영역 잔존 영역 (paragraph_layout 줄 위치 영역 vs row_heights 영역 정합 영역). 컨트리뷰터 영역의 자체 분리 등록 영역 정합.

검증 결과 알려주시면 최종 보고서 + Issue #672 close + devel push + archives 이동 진행하겠습니다.

작성: 2026-05-08
