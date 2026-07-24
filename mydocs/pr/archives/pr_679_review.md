---
PR: #679
제목: Task #676: 통합재정통계 trailing empty paragraph 페이지 분리 정정
컨트리뷰터: @planet6897 (Jaeuk Ryu) — 30+ 사이클 영역 핵심 영역 컨트리뷰터 (Layout / 페이지네이션 영역)
base: devel (BEHIND)
mergeable: MERGEABLE
CI: ALL SUCCESS
변경: +86/-1, 2 files (1 commit)
---

# PR #679 1차 검토 보고서

## 1. 메타 정보

| 항목 | 값 |
|------|-----|
| PR 번호 | #679 |
| 제목 | Task #676: 통합재정통계 trailing empty paragraph 페이지 분리 정정 |
| 컨트리뷰터 | @planet6897 (Jaeuk Ryu) — 30+ 사이클 핵심 컨트리뷰터 |
| base / head | devel / pr-task676 |
| mergeStateStatus | BEHIND |
| mergeable | MERGEABLE |
| CI | ALL SUCCESS |
| 변경 규모 | +86 / -1, 2 files (단일 commit) |
| closes | #676 |

## 2. Issue #676 본질

`samples/통합재정통계(2010.11월).hwp` + `(2011.10월).hwp` 영역의 본문 끝 빈 paragraph 영역이 페이지 2 영역으로 영역 밀려 영역 PAGE_MISMATCH 영역.

### 결함 메커니즘 (DBG_T676 trace)
```
pi=14 cur_h=751.0 + h_for_fit=16.0 = 767.0 > avail 766.2 → FIT FAIL
       (available_height 776.2 - safety 10 = 766.2)
overflow = 0.8px (≈ 0.27mm) ≤ safety_margin 10px
```

→ `LAYOUT_DRIFT_SAFETY_PX = 10.0` 영역 안전마진 영역 내 영역 미세 overflow (0.8px) 영역으로 영역 fit 실패 영역 → split 분기 영역 → 페이지 2 영역 단독 push 영역.

`hide_empty_line` 분기 (Task #362) 영역은 `SectionDef bit 19` 영역 미설정 영역으로 영역 미진입 영역.

## 3. PR 의 정정 — trailing empty paragraph 가드

### 본질 정정 영역
`src/renderer/typeset.rs::typeset_paragraph` 영역 시그니처 영역에 `is_last_in_section: bool` 영역 인자 추가 + `hide_empty_line` 분기 영역 다음 영역 가드 영역 추가 영역.

### 5 조건 AND 영역 영역 (영향 영역 좁힘)

| # | 조건 | 의도 |
|---|------|------|
| A | `is_last_in_section` | trailing 만 흡수 (중간 빈 줄 의도 보존) |
| B | `is_empty_para` (text trim empty + no controls) | hide_empty_line 분기와 동일 시멘틱 |
| C | `!st.current_items.is_empty()` | 단독 항목 페이지 자기참조 회피 |
| D | `st.col_count == 1` | 다단의 단 끝 분리는 의도적 |
| E | `total_h > available && total_h <= available + LAYOUT_DRIFT_SAFETY_PX` | 안전마진 영역 내 미세 overflow 만 |

**기존 `LAYOUT_DRIFT_SAFETY_PX` 상수 영역 그대로 활용** — 신규 휴리스틱 / 허용오차 영역 0 ✅.

### 회귀 차단 가드
`tests/issue_676_trailing_empty_para.rs` 영역 (3 통합 테스트 신규):
- `issue_676_t재정통계_2010_11_single_page` — 1p 검증 영역
- `issue_676_t재정통계_2011_10_single_page` — 1p 검증 영역
- `issue_676_t재정통계_2014_08_no_regression` — 무회귀 검증 영역

## 4. 본 환경 cherry-pick simulation

### 4.1 깨끗한 적용
- `local/pr679-sim` 브랜치, 1 commit cherry-pick
- **충돌 0건** (Auto-merging `typeset.rs`)

### 4.2 결정적 검증
- `cargo test --release` → ALL PASS, failed 0건
- `cargo test --release --lib` → 1165 passed (회귀 0)
- `cargo test --release --test issue_676_trailing_empty_para` → **3/3 passed** ✅
- `cargo test --release --test svg_snapshot --test issue_546 --test issue_554` → 20/20
- `cargo clippy --release` → clean

### 4.3 핵심 fixture 영역 페이지 수 영역 직접 측정

| 파일 | devel | PR #679 | 한글2022 PDF |
|------|-------|---------|--------------|
| `통합재정통계(2010.11월).hwp` | 2p ❌ | **1p ✅** | 1p |
| `통합재정통계(2011.10월).hwp` | 2p ❌ | **1p ✅** | 1p |
| `통합재정통계(2014.8월).hwp` | 1p | **1p ✅** | 1p (무회귀) |
| `table-ipc.hwp` | 13p | **11p** | 10p (부수 진전) |

→ PR 본문 명시 영역과 정합 영역. `table-ipc.hwp` 영역의 부수 진전 영역 (13p → 11p) 영역도 영역 정답지 (10p) 방향 영역 정합 영역.

### 4.4 광범위 회귀 sweep

```
2010-01-06: same=6 / diff=0
aift: same=77 / diff=0
exam_eng: same=8 / diff=0
exam_kor: same=20 / diff=0
exam_math: same=20 / diff=0
exam_science: same=4 / diff=0
synam-001: same=35 / diff=0
TOTAL: pages=170 same=170 diff=0 ✅
```

→ 7 핵심 fixture 영역 회귀 0 ✅ (sweep 영역의 fixture 영역에 통합재정통계 / table-ipc 영역 영역 부재 영역이라 영역 영향 영역 부재 영역).

### 4.5 PR 본문 영역의 광범위 sweep (187 fixture)
```
diff /tmp/sweep_before.txt /tmp/sweep_after.txt
148c148
< samples/table-ipc.hwp|13
> samples/table-ipc.hwp|11
160,161c160,161
< samples/통합재정통계(2010.11월).hwp|2
< samples/통합재정통계(2011.10월).hwp|2
> samples/통합재정통계(2010.11월).hwp|1
> samples/통합재정통계(2011.10월).hwp|1
```

| 영역 | 결과 |
|------|------|
| 의도된 정정 | 2 fixture (통합재정통계 2010.11/2011.10) |
| 의도된 부수 진전 | 1 fixture (table-ipc 13→11p) |
| 무변동 | 184 fixture |
| **회귀** | **0** ✅ |

## 5. 검토 관점

### 5.1 본질 정정 영역의 정확성
- 단일 commit 영역 (+26/-1 LOC) 영역 + 회귀 차단 가드 (+60 LOC)
- 5 조건 AND 영역의 영향 영역 좁힘 영역 — 다른 fixture 영역 영향 부재 영역 입증
- 기존 상수 (`LAYOUT_DRIFT_SAFETY_PX = 10.0`) 영역 활용 영역 — 신규 휴리스틱 0
- `hide_empty_line` 분기 (Task #362) 영역 다음 영역 가드 영역 — 본질 정합 영역

### 5.2 회귀 위험성 영역 점검
PR 본문 영역의 9 task 영역 회귀 영역 점검 영역:
- Task #321 / #359 / #361 (vpos-reset, next-vpos-reset, PartialTable) — sweep 무회귀
- Task #362 (hide_empty_line) — 분기 다음 가드 영역 정합
- Task #391 (다단/단단) — D 조건 영역 차단 (col_count == 1)
- Task #404 (heading-orphan) — sweep 무회귀
- kps-ai p67~70 / k-water-rfp p3 / hwp-multi-001 (다단) — 무회귀

### 5.3 시각 영향 영역
PR 본문 명시:
- 페이지 1 items: 14 → 15 (pi=14 흡수)
- used: 751.0px **불변** (height=0 흡수, pi=0~13 영역 동일)
- 시각 회귀 없음

## 6. 메모리 룰 관점

### `feedback_visual_judgment_authority`
> 메인테이너 시각 판정 영역의 권위 사례

→ PR 본문 영역의 Test plan 영역 마지막 항목 영역: "메인테이너 시각 판정 (rhwp-studio web editor 또는 SVG 출력)" 영역 미체크 영역.

### `feedback_v076_regression_origin`
→ 컨트리뷰터 환경 영역의 sweep (187 fixture 회귀 0) + 본 환경 영역의 sweep (170 페이지 회귀 0) 영역 영역 정합 영역.

### `feedback_hancom_compat_specific_over_general`
→ 5 조건 AND 영역의 영향 영역 좁힘 영역 — `feedback_rule_not_heuristic` + `feedback_hancom_compat_specific_over_general` 정합 영역. 휴리스틱 / 허용오차 영역 0 ✅.

### `feedback_contributor_cycle_check`
→ @planet6897 영역의 30+ 사이클 PR 영역 (Layout / 페이지네이션 영역 핵심 컨트리뷰터). 메모리 룰 영역 정합 (PR #451 영역 시점 영역의 16+ 영역 → 현재 30+ 영역 누적 영역).

## 7. 결정 옵션

| 옵션 | 내용 | 비고 |
|------|------|------|
| **A** | 1 commit cherry-pick + WASM 빌드 + 작업지시자 시각 판정 | PR Test plan 영역의 마지막 영역 미체크 영역 처리 영역 |
| **B** | 1 commit cherry-pick + 시각 판정 게이트 면제 영역 | 결정적 검증 + 광범위 sweep 영역 회귀 0 + PR 본문 영역의 정량 영역 정합 영역 |
| **C** | merge 보류 — 작업지시자 PAGE_MISMATCH 19 건 영역의 잔존 16 건 영역 사전 점검 | 본 PR 영역 외 |

## 8. 잠정 결정

**옵션 A (1 commit cherry-pick + WASM 빌드 + 작업지시자 시각 판정)** 권장.

이유:
1. 결정적 검증 (1165 lib + 3 issue_676 + clippy clean) ALL PASS
2. 광범위 sweep 영역 회귀 0 + 의도된 정정 / 부수 진전 영역의 정확성 정합
3. PR 본문 영역의 5 조건 AND 영역의 영향 좁힘 영역
4. 페이지네이션 영역의 본질 변경 영역이라 영역 시각 판정 영역의 게이트 영역 권장 영역
5. PR Test plan 영역의 마지막 항목 영역 (메인테이너 시각 판정) 영역 처리 영역

## 9. 작업지시자 결정 요청

1. **옵션 선택**: A / B / C 중?
2. **시각 판정 영역**: WASM 빌드 후 rhwp-studio 영역에서 통합재정통계 + table-ipc 영역 시각 정합 점검?
3. **PAGE_MISMATCH 잔존 16 건 영역 영역**: 본 PR 후속 영역에서 별도 task 영역 진행 영역?

---

작성: 2026-05-08
