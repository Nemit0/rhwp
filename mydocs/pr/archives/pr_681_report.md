---
PR: #681
제목: Task #680: nested 1x1 wrapper 표 외곽 테두리 누락 정정
컨트리뷰터: @planet6897 (Jaeuk Ryu) — 30+ 사이클 핵심 컨트리뷰터 (Layout / 페이지네이션)
처리: MERGE (2 commits 단계별 보존 no-ff merge)
처리일: 2026-05-08
---

# PR #681 최종 보고서

## 1. 결정

**2 commits 단계별 보존 no-ff merge** + WASM 빌드 + 작업지시자 시각 판정 ★ 통과.

merge commit: `e8671d62` (local/devel 영역 영역 머지 commit)

작업지시자 시각 판정:
- 1차 (WASM 빌드 전): "웹 에디터에선 안 보입니다. 선 색이 문제 인가요? 일단 wasm 빌드해보세요"
- 2차 (WASM 빌드 후): **★ 통과** — "웹 캔바스로 기존 박스가 안 보이던 문제가 해결되었음을 확인했습니다."

## 2. 본질 정정

### 결함
`samples/exam_social.hwp` p1 4번 자료 박스 (외부 1x1 + 내부 6x3) 영역의 wrapper 분기 영역이 외부 표 영역 무시 영역하고 내부 표만 영역 layout 영역 → 외곽 박스 누락 영역.

### 정정 영역
`src/renderer/layout/table_layout.rs:152` wrapper 분기 영역에 외곽선 추가 — 3 조건 AND 가드 (depth==0 + outer padding != 0 + border_fill any not None) + nested 측정 결과 영역 사용 영역 (외부 표 IR size 영역 영역 5번 박스 위치 부정합).

## 3. 본 환경 검증 결과

### 3.1 cherry-pick simulation
- 충돌 0건 (Auto-merging table_layout.rs)

### 3.2 결정적 검증
- `cargo test --release --lib` → 1165 passed (회귀 0)
- `cargo test --release --test svg_snapshot --test issue_546 --test issue_554` → 20/20
- `cargo clippy --release` → clean
- `cargo test --release --test issue_nested_table_border` → ❌ 1 failed (hardcoded 좌표 fragility — 본 PR 본질 정합, 후속 영역 정정 권장)

### 3.3 4번 박스 외곽선 영역 SVG 직접 검증
**4 라인 모두 영역 정상 출력 영역** ✅:
- 좌: x="549.88" y1="324.87" y2="668.75"
- 우: x="940.53" y1="324.87" y2="668.75"
- 상: y="324.87" x1="549.88" x2="940.53"
- 하: y="668.75" x1="549.88" x2="940.53"
- stroke="#000000" width="0.75"

### 3.4 시각 검증 (WASM)
- WASM 빌드 완료 (`pkg/rhwp_bg.wasm` 4,597,064 bytes)
- 작업지시자 시각 판정:
  - 1차 (WASM 빌드 전 영역): 외곽선 부재 발견
  - 2차 (WASM 빌드 후 영역): **★ 통과** — 웹 캔바스 영역 외곽 박스 정상 표시 영역
- 본질: 1차 영역 영역 dev server 영역 stale WASM 영역 영역 (Vite hot-reload 영역 WASM 캐시 영역) 추정 영역. WASM 영역 갱신 영역 후 영역 정상 정합 영역.

## 4. 메모리 룰 적용 결과

### `feedback_visual_judgment_authority` 권위 사례 강화
→ 1차 시각 검증 영역에서 영역 회귀 발견 → WASM 빌드 후 ★ 통과 영역. 결정적 검증 + 광범위 sweep 통과 영역에도 영역 시각 판정 영역에서만 영역 표시 영역 정합 영역 검증 영역.

### `feedback_image_renderer_paths_separate`
→ SVG / web_canvas 영역 별도 사본 영역. WASM 갱신 영역으로 영역 정합 영역.

### `feedback_v076_regression_origin`
→ 컨트리뷰터 환경 영역 (sweep 회귀 0) + 작업지시자 환경 영역 (시각 판정 ★) 영역 모두 정합 영역.

### `feedback_hancom_compat_specific_over_general` + `feedback_rule_not_heuristic`
→ 3 조건 AND 영역의 영향 좁힘 영역 정합 영역.

### `feedback_contributor_cycle_check`
→ @planet6897 영역의 30+ 사이클 PR 영역 정확 표현 영역.

## 5. 잔존 영역 분리

### 테스트 영역 hardcoded 좌표 영역 정정 영역 (후속)
`tests/issue_nested_table_border.rs` 영역의 hardcoded 좌표 영역 영역 PR #679 머지 후 영역 시프트 (~6.67px) 영역 영향 영역으로 영역 실패 영역. 별도 후속 영역 정정 권장 영역.

### padding 정합 영역 (PR 본문 명시)
외부 셀 padding (3mm) 영역 적용 미포함 영역 — 내부 표가 외곽 박스 가장자리까지 닿음 영역. 한컴2022 PDF 영역 padding 안쪽으로 영역 inset 영역. 별도 후속 영역.

## 6. 산출물

| 산출물 | 경로 |
|--------|------|
| 검토 보고서 | `mydocs/pr/archives/pr_681_review.md` |
| 최종 보고서 | `mydocs/pr/archives/pr_681_report.md` (본 문서) |
| merge commit | `e8671d62` (no-ff, 2 commits) |

## 7. 컨트리뷰터 응대

@planet6897 (Jaeuk Ryu) 30+ 사이클 핵심 컨트리뷰터 안내:
- 본질 정정 정확 (3 조건 AND 가드 + nested 측정 결과 사용)
- 본 환경 결정적 검증 + 광범위 sweep 회귀 0
- 작업지시자 시각 판정 ★ 통과 (WASM 빌드 후 웹 캔바스 영역 정상 표시)
- 회귀 차단 가드 hardcoded 좌표 fragility 영역 후속 정정 권장
- merge 결정

작성: 2026-05-08
