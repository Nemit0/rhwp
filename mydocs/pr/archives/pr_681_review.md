---
PR: #681
제목: Task #680: nested 1x1 wrapper 표 외곽 테두리 누락 정정
컨트리뷰터: @planet6897 (Jaeuk Ryu) — 30+ 사이클 핵심 컨트리뷰터 (Layout / 페이지네이션)
base: devel (BEHIND)
mergeable: MERGEABLE
CI: ALL SUCCESS
변경: +115/-1, 2 files (2 commits)
처리: 2 commits cherry-pick + WASM 빌드 + 시각 판정
처리일: 2026-05-08
---

# PR #681 검토 보고서

## 1. 메타 정보

| 항목 | 값 |
|------|-----|
| PR 번호 | #681 |
| 제목 | Task #680: nested 1x1 wrapper 표 외곽 테두리 누락 정정 |
| 컨트리뷰터 | @planet6897 (Jaeuk Ryu) — 30+ 사이클 핵심 컨트리뷰터 |
| base / head | devel / pr-task680 |
| mergeStateStatus | BEHIND |
| mergeable | MERGEABLE |
| CI | ALL SUCCESS |
| 변경 규모 | +115 / -1, 2 files |
| 커밋 수 | 2 (Task #680 본질 + clippy 정정) |
| closes | #680 |

## 2. Issue #680 본질

`samples/exam_social.hwp` 페이지 1 단 1 의 **4번 자료 박스 (대화체)** 영역의 외곽 테두리 누락 영역.

- 외부 1x1: padding=(850,850,850,850) (3mm), border_fill_id=6
- 내부 6x3: 대화체 셀 16개 (그림 6개 포함, bin_id=1~6)
- 결함: `table_layout.rs::layout_table` 영역의 1x1 wrapper 분기 영역이 외부 1x1 표 영역 무시 영역하고 영역 내부 nested 표만 영역 직접 layout 영역 → 외곽 박스 영역 누락 영역

## 3. PR 의 정정

### 본질 정정 영역
`src/renderer/layout/table_layout.rs:152` 영역 wrapper 분기 영역에 외곽선 추가 영역.

### 3 조건 AND 영역 가드
| # | 조건 | 의도 |
|---|------|------|
| A | `depth == 0` | top-level 표만 |
| B | 외부 셀 padding != 0 (4 방향 OR) | 자료 박스 의미 있음 |
| C | border_fill borders 중 하나라도 not None | 테두리 정의 |

### 외곽 박스 size — nested layout 결과 사용
- width: nested 표 측정 너비
- height: nested layout 실제 결과 (`y_end - y_start`)
- 외부 표 IR size 사용 시 5번 박스 영역 위치 부정합 발생 영역 → nested 측정 결과 영역 사용 영역

## 4. 본 환경 cherry-pick simulation

### 4.1 깨끗한 적용
- `local/pr681-sim` 브랜치, 2 commits cherry-pick
- 충돌 0건 (Auto-merging `table_layout.rs`)

### 4.2 결정적 검증
- `cargo test --release --lib` → 1165 passed (회귀 0)
- `cargo test --release --test svg_snapshot --test issue_546 --test issue_554` → 20/20
- `cargo clippy --release` → clean
- `cargo test --release --test issue_nested_table_border` → ❌ 1 failed (hardcoded 좌표 영역 fragility)

### 4.3 테스트 실패 본질 영역 — hardcoded 좌표 영역 fragility

**4번 박스 외곽선 영역 4개 라인 영역 모두 영역 정상 출력** ✅:
```
좌: x="549.88" y1="324.87" y2="668.75" stroke="#000000" width="0.75"
우: x="940.53" y1="324.87" y2="668.75"
상: y="324.87" x1="549.88" x2="940.53"
하: y="668.75" x1="549.88" x2="940.53"
```

PR 본문 명시 좌표 (y=331.53/675.41) 영역과 본 환경 좌표 (y=324.87/668.75) 영역 차이 ~6.67px 영역 — **PR #679 (Task #676 trailing empty paragraph) 영역 머지 영역 후 영역의 시프트 영역의 부수 영향 영역**. 본 PR 영역의 본질 (외곽선 출력) 영역 정합 영역인데 영역 테스트 영역 hardcoded 좌표 영역 fragility 영역.

→ 본 PR 영역의 본질 영역 영역 정합 영역. 테스트 영역 영역 후속 영역 영역 정정 영역 권장 영역 (별도 영역).

## 5. 시각 검증 (WASM 영역)

### 작업지시자 1차 시각 판정 영역 발견 영역
> "웹 에디터에선 안 보입니다. 선 색이 문제 인가요? 일단 wasm 빌드해보세요"

→ 1차 영역에서 영역 외곽선 영역 부재 영역 발견 영역. WASM 빌드 진행 영역.

### WASM 빌드 + 시각 재판정 영역
- WASM 빌드 완료 (`pkg/rhwp_bg.wasm` 4,597,064 bytes)
- 작업지시자 시각 재판정 ★ 통과:
  > "웹 캔바스로 기존 박스가 안 보이던 문제가 해결되었음을 확인했습니다."

→ WASM 갱신 영역 후 영역 웹 캔바스 영역에서 영역 외곽 박스 영역 정상 표시 영역. 1차 시각 검증 영역 영역 dev server 영역의 stale WASM 영역 영역으로 영역 추정 영역 (Vite hot-reload 영역 영역 WASM 캐시 영역).

## 6. 결정

**2 commits 단계별 보존 no-ff merge** + WASM 빌드 + 작업지시자 시각 판정 ★ 통과.

merge commit: `e8671d62` (local/devel 영역 영역 머지 완료 영역)

## 7. 메모리 룰 적용 결과

### `feedback_visual_judgment_authority` 권위 사례 강화
> 메인테이너 시각 판정 영역의 권위 사례

→ 작업지시자 시각 검증 영역의 1차 영역에서 영역 회귀 발견 영역 → WASM 빌드 영역 후 영역 2차 영역 ★ 통과 영역. 결정적 검증 + 광범위 sweep 영역 통과 영역에도 영역 시각 판정 영역에서만 영역 표시 영역 정합 영역 검증 영역.

### `feedback_image_renderer_paths_separate`
→ SVG 영역 영역 정상 출력 영역 + 웹 캔바스 영역 영역 WASM 갱신 영역 후 영역 정상 영역. SVG / web_canvas / paint/json 영역 영역 별도 사본 영역 정합 영역.

### `feedback_v076_regression_origin`
→ 컨트리뷰터 환경 영역 (sweep 회귀 0) + 작업지시자 환경 영역 (시각 판정 ★ 통과) 영역 모두 정합 영역.

### `feedback_hancom_compat_specific_over_general` + `feedback_rule_not_heuristic`
→ 3 조건 AND 영역의 영향 좁힘 영역 정합 영역.

### `feedback_contributor_cycle_check`
→ @planet6897 영역의 30+ 사이클 PR 영역 정확 표현 영역.

## 8. 잔존 영역 분리

### 테스트 영역 hardcoded 좌표 영역 정정 영역 (별도 후속)
`tests/issue_nested_table_border.rs` 영역의 hardcoded 좌표 영역 영역 PR #679 영역 머지 영역 후 영역 시프트 영역 영향 영역으로 영역 실패 영역. 본 PR 영역 머지 영역 후 영역 별도 영역 영역 정정 영역 권장 영역 (작업지시자 결정 영역).

### padding 정합 영역 (PR 본문 명시)
> 본 정정은 외곽 박스만 추가. 외부 셀 padding (3mm) 영역 적용은 미포함 — 내부 표가 외곽 박스 가장자리까지 닿음. 한컴2022 PDF 는 padding 안쪽으로 내부 표 inset.

→ padding 정합 영역 별도 후속 영역 (wrapper 분기 본질 정정 또는 nested padding inset).

## 9. 산출물

| 산출물 | 경로 |
|--------|------|
| 검토 + 처리 보고서 | `mydocs/pr/archives/pr_681_review.md` + `pr_681_report.md` |
| merge commit | (local/devel 영역 영역 머지 영역 영역 push 예정 영역) |
| 회귀 차단 가드 | `tests/issue_nested_table_border.rs` (hardcoded 좌표 영역 영역 후속 영역 정정 권장 영역) |

작성: 2026-05-08
