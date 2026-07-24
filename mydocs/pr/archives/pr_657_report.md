---
PR: #657
제목: Task #485: synam-001.hwp 분할 표 셀 마지막 줄 클립 정정
컨트리뷰터: @planet6897 (Jaeuk Ryu) — 15번째 사이클 PR
처리: MERGE (옵션 A — 5 commits 단계별 보존 no-ff merge)
처리일: 2026-05-08
---

# PR #657 최종 보고서

## 1. 결정

**옵션 A (5 commits 단계별 보존 no-ff merge)** + WASM 빌드 + 작업지시자 시각 판정 ★ 통과.

merge commit: `595c02d6`

## 2. 본 환경 검증 결과

### 2.1 cherry-pick simulation
- `local/pr657-sim` 브랜치, 5 commits cherry-pick
- **충돌 0건** (`orders/20260507.md` 영역 자동 머지 영역)

### 2.2 결정적 검증
- `cargo test --release` → ALL PASS, failed 0건
- `cargo test --release --lib` → 1165 passed (회귀 0)
- `cargo clippy --release` → clean

### 2.3 본 PR 정정 효과 영역의 본 환경 직접 재현

| 페이지 | devel md5 | PR md5 | 영향 |
|--------|-----------|--------|------|
| synam-001 p15 | `8e9f717d...` | `e9c0b084...` | 다름 ✅ |
| synam-001 p20 | `637f8012...` | `9a55eda8...` | 다름 ✅ |
| synam-001 p21 | `4c694fb1...` | `d7f04cfb...` | 다름 ✅ |

### 2.4 광범위 회귀 sweep (`scripts/svg_regression_diff.sh`)

7 샘플 170 페이지:
```
2010-01-06: same=6 / diff=0
aift: same=77 / diff=0
exam_eng: same=8 / diff=0
exam_kor: same=20 / diff=0
exam_math: same=20 / diff=0
exam_science: same=4 / diff=0
synam-001: same=31 / diff=4 (p5, p15, p20, p21)
TOTAL: same=166 / diff=4
```

→ 다른 6 샘플 (135 페이지) 회귀 0 ✅

### 2.5 시각 검증
- WASM 빌드 완료 (`pkg/rhwp_bg.wasm` 4,573,826 bytes)
- 작업지시자 시각 판정: **★ 통과**
  - 작업지시자 인용: "메인테이너 시각 검증 통과했습니다"
  - synam-001 p15 / p20 / p21 클립 해소 + p5 추가 영향 영역 (시각 판정 영역의 정합 영역) 통과 영역

## 3. 본질 정정의 정확성

### 정정 영역
`src/renderer/layout/table_layout.rs::compute_cell_line_ranges` 단일 함수 영역의 3 hunk (+28 / -4 LOC).

### 두 버그 영역의 분리 영역의 분석

| 버그 | 영역 | 정정 |
|------|------|------|
| **Bug-1 (out-of-order)** | `compute_cell_line_ranges` inner break 영역의 outer 차단 영역 부재 → 셀 마지막 단락 영역의 abs_limit fit 영역 시각 순서 역전 | `limit_reached` 플래그 + outer 루프 차단 영역 (한 번 도달 영역 후 후속 단락 영역 모두 미렌더 영역) |
| **Bug-2 (boundary epsilon)** | `line_end_pos > abs_limit` 영역의 boundary 케이스 (~0~2px 차이) 영역 fit 영역 cell-clip-rect bottom 침범 | `SPLIT_LIMIT_EPSILON = 2.0px` 도입 → `effective_limit = abs_limit - ε` (descender 여유분 + 부동소수점 오차 흡수) |

### 후보 미적용 영역의 합리화
- 후보 1 (typeset `split_end_limit` 산정 정정) — 미적용
- 후보 3 (layout vpos correction drop) — 미적용
- → 본질이 layout 측 영역에서 충분히 정정 영역. 후속 영역 (typeset/layout height 측정 모델 통일) 영역 별도 이슈 #656 영역 분리

## 4. 컨트리뷰터 절차 정합

@planet6897 15번째 사이클 PR. TDD Stage 1~4 영역 절차 정합:

| Stage | 산출물 |
|-------|--------|
| Stage 1 | 본질 정밀 측정 — out-of-order + boundary epsilon 두 버그 영역 식별 |
| Stage 2a | out-of-order 정정 (`limit_reached` 플래그) |
| Stage 2b | boundary epsilon (2.0px) 적용 |
| Stage 3 | 회귀 검증 — 회귀 없음 + 후보 A/D 진입 불요 |
| Stage 4 | 최종 보고서 + orders 갱신 |

후속 영역 분리 영역의 정합:
- **Issue #656** 별도 등록 (typeset/layout height 측정 모델 통일) — 본 PR 범위 외
- 작업지시자 명시: "후속작업은 이미 컨트리뷰터가 분리했기에 이 리뷰 범위에서 제외"

## 5. 메모리 룰 적용 결과

### `feedback_visual_judgment_authority`
> 결정적 검증만으로 부족, 메인테이너 시각 판정 + 본질 결함 발견 영역의 권위 사례

→ 본 PR 영역의 핵심 게이트 영역. 광범위 sweep 영역의 byte 차이 영역 (4 페이지) 영역의 회귀 / 정정 판정 영역의 작업지시자 시각 판정 영역에서 직접 영역 통과 영역 정합.

### `feedback_v076_regression_origin`
> 외부 PR 컨트리뷰터들이 자기 환경 PDF 를 정답지로 사용 → 작업지시자 환경에서 회귀

→ PR 본문 영역의 검증 (synam-001.pdf 대조) 영역의 컨트리뷰터 환경 영역과 작업지시자 한컴 편집기 환경 영역 모두 시각 판정 통과 영역 — 환경 차이 영역의 회귀 가능성 영역 차단 영역.

### `feedback_visual_regression_grows`
> 페이지 총 수 byte 비교만으로는 시각 결함 검출 불가

→ 광범위 sweep 영역의 byte 차이 영역 (synam-001 p5 영역의 추가 영향 영역) 영역의 본질 영역의 작업지시자 시각 판정 영역에서 직접 영역 통과 영역 정합.

### `feedback_pr_supersede_chain`
> PR close 영역의 통합 후속 처리 영역의 패턴 영역

→ 본 PR 영역의 후속 영역 (#656) 분리 영역의 정합 영역. 작업지시자 영역의 review 범위 영역 외 영역 명시 영역 정합.

## 6. 산출물

| 산출물 | 경로 |
|--------|------|
| 검토 보고서 | `mydocs/pr/archives/pr_657_review.md` |
| 최종 보고서 | `mydocs/pr/archives/pr_657_report.md` (본 문서) |
| merge commit | `595c02d6` (no-ff, 5 commits 단계별 보존) |
| 후속 분리 이슈 | #656 (typeset/layout height 측정 모델 통일) |
| 검증용 PDF 영구 보존 | `samples/synam-001.pdf` (PR 영역에서 추가) |

## 7. 컨트리뷰터 응대

@planet6897 15번째 사이클 PR 안내:
- 본질 정정 (`compute_cell_line_ranges` 단일 함수 영역의 3 hunk) 정확
- 두 버그 영역 (Bug-1 out-of-order + Bug-2 boundary epsilon) 영역의 분리 영역의 분석 영역 정확
- 본 환경 결정적 검증 통과 + 광범위 sweep 6 샘플 회귀 0 확증
- 작업지시자 시각 판정 ★ 통과 — synam-001 p15 / p20 / p21 클립 해소 + p5 영역 추가 영향 영역 정합
- TDD Stage 1~4 절차 정합 + 후속 영역 (#656) 분리 영역의 깔끔한 영역 분리
- merge 결정

작성: 2026-05-08
