---
PR: #657
제목: Task #485: synam-001.hwp 분할 표 셀 마지막 줄 클립 정정
컨트리뷰터: @planet6897 (Jaeuk Ryu) — 15번째 사이클 PR
base: devel (BEHIND)
mergeable: MERGEABLE
CI: ALL SUCCESS
변경: +1063/-4, 10 files (5 commits TDD Stage 1~4)
---

# PR #657 1차 검토 보고서

## 1. 메타 정보

| 항목 | 값 |
|------|-----|
| PR 번호 | #657 |
| 제목 | Task #485: synam-001.hwp 분할 표 셀 마지막 줄 클립 정정 |
| 컨트리뷰터 | @planet6897 (Jaeuk Ryu) — 15번째 사이클 PR |
| base / head | devel / pr/task-485 |
| mergeStateStatus | BEHIND |
| mergeable | MERGEABLE |
| CI | Build & Test / CodeQL / Canvas visual diff — ALL SUCCESS |
| 변경 규모 | +1063 / -4, 10 files |
| 커밋 수 | 5 (Stage 1, 2a, 2b, 3, 4) |
| closes | #485 |
| 후속 분리 | #656 (typeset/layout height 측정 모델 통일) — **본 review 범위 외** |

## 2. Issue #485 본질

`samples/synam-001.hwp` 15·20·21 페이지 영역의 RowBreak 분할 표 (PartialTable) 영역에서 셀 마지막 줄 영역의 본문 영역 하단 경계 영역 시각 영역 겹침 영역 + 글자 descender 영역 클립핑 결함.

### 두 개 분리 버그 영역의 결합

| 버그 | 영역 | 본질 |
|------|------|------|
| **Bug-1 (out-of-order)** | `compute_cell_line_ranges` inner break 영역의 outer 차단 영역 부재 | 셀 마지막 단락 (line_spacing 제외 영역의 line_h 작아짐) 영역의 abs_limit 영역 fit 영역 영역 시각 영역 순서 영역 역전 + 본문 경계 영역 클립 |
| **Bug-2 (boundary epsilon)** | `line_end_pos > abs_limit` 영역의 boundary 케이스 영역 (~0~2px 차이) | 영역 fit 영역 cell-clip-rect bottom 영역 침범 |

## 3. PR 의 정정

### 정정 영역
`src/renderer/layout/table_layout.rs::compute_cell_line_ranges` 단일 함수 영역의 3 hunk 영역 (+28 / -4 LOC).

### 본질 정정 영역

| 영역 | 정정 |
|------|------|
| Bug-1 | `limit_reached` 플래그 + outer 루프 차단 영역 (한 번 도달 영역 후 영역 후속 단락 영역 모두 미렌더 영역) |
| Bug-2 | `SPLIT_LIMIT_EPSILON = 2.0px` 영역 도입 → `effective_limit = abs_limit - ε` 영역의 break/exceed 비교 (descender 여유분 + 부동소수점 오차 흡수) |

### 후보 미적용 영역 (이슈 본문 영역의 다른 영역 후보 영역)
- 후보 1 (typeset `split_end_limit` 산정 정정) — **미적용**
- 후보 3 (layout vpos correction drop) — **미적용**
- → 본질이 layout 측 영역에서 충분히 정정 영역 확증

## 4. 본 환경 cherry-pick simulation

### 4.1 깨끗한 적용
- `local/pr657-sim` 브랜치, 5 commits cherry-pick
- **충돌 0건** (orders/20260507.md 영역 자동 머지 영역)

### 4.2 결정적 검증
- `cargo test --release` → ALL PASS, failed 0건
- `cargo test --release --lib` → 1165 passed (회귀 0)
- `cargo clippy --release` → clean

### 4.3 핵심 케이스 영역의 SVG 영역 차이 영역 (본 환경 영역)

PR 본문 명시 영역 회귀 케이스 영역의 본 환경 직접 측정:

| 페이지 | devel md5 | PR md5 | 영향 |
|--------|-----------|--------|------|
| synam-001 p15 | `8e9f717d...` | `e9c0b084...` | **다름** ✅ (정정 효과) |
| synam-001 p20 | `637f8012...` | `9a55eda8...` | **다름** ✅ (정정 효과) |
| synam-001 p21 | `4c694fb1...` | `d7f04cfb...` | **다름** ✅ (정정 효과) |

→ 본 PR 정정 효과 영역의 본 환경 영역 직접 재현 확인.

### 4.4 광범위 회귀 sweep (`scripts/svg_regression_diff.sh`)

```
2010-01-06: total=6 same=6 diff=0
aift: total=77 same=77 diff=0
exam_eng: total=8 same=8 diff=0
exam_kor: total=20 same=20 diff=0
exam_math: total=20 same=20 diff=0
exam_science: total=4 same=4 diff=0
synam-001: total=35 same=31 diff=4  diff_pages=[synam-001_005.svg, _015.svg, _020.svg, _021.svg]
TOTAL: pages=170 same=166 diff=4
```

**diff 영역의 분석 영역**:
- p15, p20, p21 — PR 본문 명시 회귀 케이스 영역의 정정 영역 ✅
- **p5 — PR 본문 미명시 영역의 추가 영향** (devel 382,188 bytes → PR 375,771 bytes, **-6,417 bytes**)

#### page 5 영역의 본질 영역
```
=== 페이지 5 ===
PartialTable pi=69 ci=0 rows=0..5 cont=false 8x3 vpos=10360 split_start=0.0 split_end=93.0
```
→ split table 영역 (8행x3열 영역의 rows=0..5 영역의 부분 영역). 본 PR 의 epsilon + limit_reached 영역이 page 5 영역의 split table 영역에도 영향 영역.

**판정 영역**: 회귀 영역인지 정정 영역인지 시각 영역에서 영역 직접 점검 영역 필요. 작업지시자 시각 판정 게이트 영역에서 영역 점검 영역 권장.

## 5. 검토 관점

### 5.1 본질 정정 영역의 정확성
- 단일 함수 영역의 좁은 정정 (3 hunk, +28/-4 LOC)
- 두 버그 영역의 분리 영역의 분석 영역 + 각각 정정 영역 영역 명확
- `SPLIT_LIMIT_EPSILON = 2.0px` 영역의 명시 상수 영역 + 주석 영역 정합

### 5.2 회귀 위험성
- 광범위 sweep 영역의 영향 영역 4 페이지 (synam-001 p5, p15, p20, p21)
- 다른 6 샘플 영역 (170 페이지 - 35 = 135 페이지) 영역 회귀 0 ✅
- p5 영역의 추가 영향 영역 — **시각 영역의 본 환경 영역 영역 점검 영역 필요 영역의 게이트 영역**

### 5.3 절차 정합
- TDD Stage 1~4 영역 (본질 정밀 측정 → Bug-1 정정 → Bug-2 정정 → 회귀 검증 + 보고서)
- 후속 영역 (#656) 영역 분리 등록 영역 (컨트리뷰터 영역의 본 PR 범위 영역의 명확한 분리 영역)
- `feedback_pr_supersede_chain` 영역의 정합 — 본 PR 영역의 review 범위 영역에서 후속 영역 (#656) 제외 영역의 작업지시자 영역의 영역 명시 영역

## 6. 메모리 룰 관점

### `feedback_visual_judgment_authority` (핵심 게이트)
> 결정적 검증만으로 부족, 메인테이너 시각 판정 + 본질 결함 발견 영역의 권위 사례

→ **본 PR 영역의 적용 영역**: 작업지시자 직접 결정 — "체리픽으로 진행한 후 wasm 빌드해서 메인테이너가 시각 판정 하겠습니다". 본 PR 영역의 정정 효과 영역 + page 5 영역의 추가 영향 영역 영역 작업지시자 시각 판정 영역의 직접 영역 점검 영역 정합.

### `feedback_v076_regression_origin`
> 외부 PR 컨트리뷰터들이 자기 환경 PDF 를 정답지로 사용 → 작업지시자 환경에서 회귀

→ PR 본문 영역의 검증 (synam-001.pdf 대조 영역) 영역의 컨트리뷰터 환경 영역. 작업지시자 환경 영역 (한컴 편집기) 영역 영역 시각 판정 게이트 필수.

### `feedback_visual_regression_grows`
> 페이지 총 수 byte 비교만으로는 시각 결함 검출 불가

→ 광범위 sweep 영역의 byte 동일성 영역 부재 (4 페이지 영역 차이 영역) — 시각 판정 영역의 영역 게이트 영역의 본질 영역의 정합 영역.

## 7. 결정 옵션

| 옵션 | 내용 | 비고 |
|------|------|------|
| **A** | 5 commits 단계별 보존 no-ff merge + WASM 빌드 + 작업지시자 시각 판정 | 작업지시자 직접 결정 영역의 옵션 영역 |
| **B** | 5 commits squash merge + WASM 빌드 + 시각 판정 | TDD 흔적 압축 |
| **C** | merge 보류 — page 5 영역 추가 영향 영역 사전 점검 | 작업지시자 시각 판정 게이트 영역 외 |

## 8. 잠정 결정 영역

**옵션 A (5 commits 단계별 보존 no-ff merge) + WASM 빌드 + 작업지시자 시각 판정** 권장 영역.

이유:
1. 작업지시자 직접 결정 영역 — "체리픽으로 진행한 후 wasm 빌드해서 메인테이너가 시각 판정 하겠습니다"
2. 결정적 검증 (1165 lib + clippy clean) ALL PASS
3. 본 PR 본문 명시 영역의 회귀 케이스 (p15, p20, p21) 영역의 본 환경 영역 직접 재현 확인 (SVG md5 영역 다름)
4. cherry-pick 영역의 충돌 0건
5. TDD Stage 1~4 영역의 절차 정합
6. 후속 영역 (#656) 분리 영역의 정합 (작업지시자 영역의 영역 review 범위 영역 외 영역 명시)
7. **page 5 영역의 추가 영향 영역**: 작업지시자 시각 판정 게이트 영역에서 영역 직접 점검 영역 필요

## 9. 작업지시자 결정 요청

1. **시각 판정 영역의 핵심 케이스**:
   - synam-001 p15: pi=84 cell-last 영역의 slip 차단 영역
   - synam-001 p20: pi=169 cell-last 영역의 slip 차단 영역
   - synam-001 p21: pi=108 영역의 epsilon 마진 영역
   - **synam-001 p5: PartialTable pi=69 영역의 추가 영향 영역 (PR 본문 미명시)**
2. **회귀 점검 영역**: kps-ai p56/67/68/69/70/72/73 + aift 분할 표 (p10~p14) — 광범위 sweep 영역의 영향 영역 0
3. **WASM 빌드 + 시각 판정 게이트 영역의 본 환경 영역**

---

작성: 2026-05-08
