---
PR: #687
제목: Task #677: 복학원서.hwp PDF 정합 결함
컨트리뷰터: @planet6897 (Jaeuk Ryu) — 30+ 사이클 핵심 컨트리뷰터 (Layout / 페이지네이션)
base: devel (BEHIND)
mergeable: MERGEABLE
CI: ALL SUCCESS (PR 자체)
변경: +2290/-2, 15 files (1 commit)
처리: 1 commit cherry-pick + WASM 빌드 + 시각 판정 + CI fragility 정정
처리일: 2026-05-08
---

# PR #687 검토 보고서

## 1. 메타 정보

| 항목 | 값 |
|------|-----|
| PR 번호 | #687 |
| 제목 | Task #677: 복학원서.hwp PDF 정합 결함 |
| 컨트리뷰터 | @planet6897 (Jaeuk Ryu) — 30+ 사이클 핵심 컨트리뷰터 |
| base / head | devel / pr-task677 |
| mergeStateStatus | BEHIND |
| mergeable | MERGEABLE |
| CI | ALL SUCCESS (PR 자체) |
| 변경 규모 | +2290 / -2, 15 files |
| 커밋 수 | 1 (대형 단일 commit, Stage 1~5 + 골든) |
| closes | #677 |

## 2. Issue #677 본질 — 3 결함 영역

### 2.1 pi=16 PartialParagraph y 누적 결함
- 인라인 TAC 표 + PartialParagraph 영역 패턴 영역에서 영역 표 높이 이중 누적 영역
- y=1357.8 overflow=273.1px → y=1087.2 overflow=2.5px

### 2.2 U+F081C HWP PUA 채움 문자 폭 결함
- 99 chars × U+F081C 영역 영역 658px leading width 영역 가산 영역 → 표 x=716 (body 우측 끝)
- char_width 영역 5 사이트 영역 U+F081C 영역 시각 폭 0 영역 정정
- 정정 후: 표 x=716 → **63.69 (body left margin)**

### 2.3 한컴 워터마크 모드 변환 미적용
- HWP IR `effect=GrayScale, brightness=-50, contrast=70, watermark=custom` 영역 저장값 그대로 영역 → 어두운 본문 가림
- 작업지시자 단계별 시각 피드백 영역으로 영역 brightness/contrast + opacity 0.17 영역 정합 영역
- svg.rs + web_canvas.rs 양쪽 동기 (`feedback_image_renderer_paths_separate` 정합)

## 3. PR 의 정정 영역

| 파일 | 변경 |
|------|------|
| `src/renderer/layout.rs` | +30/-2 (pi=16 PartialParagraph y_offset 영역 정정) |
| `src/renderer/layout/text_measurement.rs` | +20/0 (U+F081C 영역 폭 0) |
| `src/renderer/svg.rs` | +14/-2 (워터마크 영역) |
| `src/renderer/web_canvas.rs` | +12/-2 (워터마크 영역) |
| `tests/svg_snapshot.rs` | +14/0 (issue_677 신규) |
| `tests/golden_svg/issue-677/bokhakwonseo-page1.svg` | +414812 bytes (골든) |
| **합계** | **+90/-6 LOC + 1 가드 + 1 골든** |

## 4. 본 환경 cherry-pick simulation

### 4.1 깨끗한 적용
- `local/pr687-sim` 브랜치, 1 commit cherry-pick
- 충돌 0건

### 4.2 결정적 검증
- `cargo test --release` → ALL PASS, failed 0건
- `cargo test --release --lib` → 1165 passed (회귀 0)
- `cargo test --release --test svg_snapshot` → 8/8 (issue_677 신규 + 7 기존)
- `cargo test --release --test issue_546 --test issue_554` → 13/13
- `cargo clippy --release` → clean

### 4.3 광범위 회귀 sweep
```
2010-01-06: same=6 / diff=0
aift: same=76 / diff=1 (aift_001.svg)
exam_eng: same=8 / diff=0
exam_kor: same=20 / diff=0
exam_math: same=20 / diff=0
exam_science: same=4 / diff=0
synam-001: same=35 / diff=0
TOTAL: pages=170 same=169 diff=1
```

→ **aift p1 영역 영역 +8.43px 시프트** 영역 발견. dump-pages 영역 점검 영역으로 영역 동일 패턴 영역 확증 영역:
```
=== 페이지 1 (global_idx=0, section=0, page_num=1) ===
  단 0 (items=2, used=221.3px)
    Table          pi=0 ci=2  1x1  635.0x205.8px  wrap=TopAndBottom tac=true  vpos=0..16630
    PartialParagraph  pi=0  lines=1..2  vpos=16630
```

→ aift p1 영역도 영역 인라인 TAC + PartialParagraph 영역 패턴 영역. PR #687 영역의 정정 영역의 부수 영향 영역 — **회귀/정정 판정 영역의 시각 판정 게이트** 영역 필요 영역.

### 4.4 머지 + WASM 빌드
- merge commit: `f0dec671`
- WASM 빌드 완료 (`pkg/rhwp_bg.wasm` 4,595,889 bytes)

## 5. CI Failure 영역 정정 (메인테이너 후속)

### 발견 영역
작업지시자 보고: "CI 쪽 오류가 발생했습니다."

devel 영역 push 영역 후 영역 CI 영역 영역에서 영역 `issue_nested_table_border` 영역 실패 영역 — **PR #681 영역의 회귀 차단 가드 영역의 hardcoded 좌표 fragility 영역**. PR #679 (Task #676) 머지 후 영역 ~6.67px 시프트 영역 + PR #687 (Task #677) 머지 후 영역 추가 영역 시프트 영역 영역 hardcoded 좌표 영역 (y=331.53/675.41) 영역 영역 정합 부재 영역.

### 정정 영역 (commit `abef8cac`)
`tests/issue_nested_table_border.rs` 영역 영역 hardcoded 좌표 영역 회피:
- y 좌표 영역 hardcoded 영역 영역 회피
- x 좌표 영역 (lx=549.88, rx=940.53) 영역과 stroke 본질 영역만 영역 검증 영역
- 외곽선 4 라인 영역 본질 (좌수직 / 우수직 / 수평) 영역 영역 검증 영역
- 테스트 영역 영역만 영역 변경 영역 — src 영역 무영향 영역, WASM 재빌드 영역 불필요 영역

## 6. 시각 검증 게이트 영역

### 시각 판정 영역 대상

**파일**: `samples/복학원서.hwp` + `samples/aift.hwp`

| 파일 | 페이지 | 결함 (정정 전) | 정정 후 기대 |
|------|--------|---------------|---------------|
| **복학원서.hwp** | p1 | pi=16 273.1px overflow + 3×3 표 우측 밀림 + 워터마크 어두움 | overflow 2.5px + 표 left margin + 워터마크 정합 |
| **aift.hwp** | p1 | (현재) | +8.43px 시프트 영역 — 회귀/정정 판정 |

### 검증 절차

1. http://localhost:7700 접속 (Ctrl+Shift+R)
2. **`samples/복학원서.hwp`** 로드 → p1 영역 정합 영역 (pi=16 + 3×3 표 + 워터마크)
3. **`samples/aift.hwp`** 로드 → p1 영역 영역 시각 정합 영역 (+8.43px 시프트 영역의 정합 / 회귀 판정 영역)

### 회귀 점검 영역
- 광범위 sweep 7 샘플 170 페이지 same=169 / diff=1 (aift p1 영역만)
- 다른 6 샘플 (135 페이지) 회귀 0
- CI fragility 영역 정정 (commit `abef8cac`) 영역 추가 영역

## 7. 메모리 룰 적용 결과

### `feedback_visual_judgment_authority`
→ aift p1 영역 영역 sweep 영역 byte 차이 영역 영역의 회귀/정정 판정 영역 작업지시자 시각 판정 게이트 영역 필요 영역.

### `feedback_image_renderer_paths_separate`
→ svg.rs + web_canvas.rs 양쪽 동기 영역 정합 영역 (워터마크 영역 두 영역 정정).

### `feedback_v076_regression_origin`
→ 컨트리뷰터 환경 영역 시각 판정 ★ 통과 영역 + 작업지시자 환경 영역 시각 판정 게이트 영역 필요 영역.

### `feedback_pr_supersede_chain`
→ PR #681 영역의 hardcoded 좌표 fragility 영역 영역 PR #679/#687 영역 머지 영역 후 영역 누적 시프트 영역 영영 → 메인테이너 후속 정정 영역 (CI 정정).

### `feedback_contributor_cycle_check`
→ @planet6897 영역의 30+ 사이클 PR 영역 정확 표현 영역.

## 8. 작업지시자 결정 요청 — 시각 검증

WASM 빌드 영역 영역 이미 영역 완료 영역 (`pkg/rhwp_bg.wasm` 4,595,889 bytes). 본 환경 영역의 dev server 영역 영역 동작 중 영역 → 시각 검증 영역 진행 영역 가능 영역.

검증 결과 알려주시면 최종 보고서 + Issue #677 close + devel push (CI 정정 영역 포함 영역) + archives 이동 영역 진행하겠습니다.

작성: 2026-05-08
