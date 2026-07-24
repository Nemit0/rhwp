---
PR: #679
제목: Task #676: 통합재정통계 trailing empty paragraph 페이지 분리 정정
컨트리뷰터: @planet6897 (Jaeuk Ryu) — 30+ 사이클 핵심 컨트리뷰터 (Layout / 페이지네이션)
처리: MERGE (옵션 A — 1 commit cherry-pick no-ff merge)
처리일: 2026-05-08
---

# PR #679 최종 보고서

## 1. 결정

**옵션 A — 1 commit cherry-pick no-ff merge** + WASM 빌드 + 작업지시자 시각 판정 ★ 통과.

merge commit: `bd3b63dd`

작업지시자 시각 판정:
> "웹 에디터 시각 판정 통과입니다."

## 2. 본질 정정

### 결함 본질
`samples/통합재정통계(2010.11월).hwp` + `(2011.10월).hwp` 영역의 본문 끝 빈 paragraph 영역이 `LAYOUT_DRIFT_SAFETY_PX = 10.0` 영역 안전마진 영역 내 미세 overflow (0.8px) 영역으로 fit 실패 영역 → 단독 빈 페이지 발생 영역.

### 정정 영역
`src/renderer/typeset.rs::typeset_paragraph` 영역 시그니처 영역에 `is_last_in_section: bool` 영역 인자 추가 + `hide_empty_line` 분기 다음 가드.

### 5 조건 AND 영역
| # | 조건 | 의도 |
|---|------|------|
| A | `is_last_in_section` | trailing 만 흡수 |
| B | `is_empty_para` | hide_empty_line 분기와 동일 시멘틱 |
| C | `!current_items.is_empty()` | 단독 항목 페이지 자기참조 회피 |
| D | `col_count == 1` | 다단의 단 끝 분리는 의도적 보존 |
| E | `total_h <= available + LAYOUT_DRIFT_SAFETY_PX` | 안전마진 내 미세 overflow 만 |

**기존 상수 활용 — 신규 휴리스틱 0** ✅.

## 3. 본 환경 검증 결과

### 3.1 cherry-pick simulation
- `local/pr679-sim` 브랜치, 1 commit cherry-pick
- 충돌 0건 (Auto-merging `typeset.rs`)

### 3.2 결정적 검증
- `cargo test --release` → ALL PASS, failed 0건
- `cargo test --release --lib` → 1165 passed (회귀 0)
- `cargo test --release --test issue_676_trailing_empty_para` → **3/3 passed**
- `cargo test --release --test svg_snapshot --test issue_546 --test issue_554` → 20/20
- `cargo clippy --release` → clean

### 3.3 핵심 fixture 영역 페이지 수 영역 측정

| 파일 | devel | PR #679 | 한글2022 PDF |
|------|-------|---------|--------------|
| 통합재정통계(2010.11월).hwp | 2p ❌ | **1p ✅** | 1p |
| 통합재정통계(2011.10월).hwp | 2p ❌ | **1p ✅** | 1p |
| 통합재정통계(2014.8월).hwp | 1p | **1p ✅** | 1p (무회귀) |
| table-ipc.hwp | 13p | **11p** (부수 진전) | 10p |

### 3.4 광범위 회귀 sweep
```
TOTAL: pages=170 same=170 diff=0 ✅
```

### 3.5 시각 검증
- WASM 빌드 완료 (`pkg/rhwp_bg.wasm` 4,596,007 bytes)
- 작업지시자 시각 판정: **★ 통과** ("웹 에디터 시각 판정 통과입니다")

## 4. 작업지시자 PAGE_MISMATCH 19건 진전

본 PR 영역으로 영역의 진전 영역:
- ✅ **2건 완전 정정** (통합재정통계 2010.11월 / 2011.10월)
- 🔄 **1건 부분 진전** (table-ipc 13p → 11p, 정답지 10p)
- 🔄 **잔존 16건** (별도 task 영역 — 후속 영역)

## 5. 메모리 룰 적용 결과

### `feedback_visual_judgment_authority`
> 메인테이너 시각 판정 영역의 권위 사례

→ 결정적 검증 + 광범위 sweep 영역 통과 영역에도 영역 페이지네이션 본질 변경 영역이라 영역 시각 판정 게이트 영역 권장 영역. 작업지시자 ★ 통과 영역 정합.

### `feedback_v076_regression_origin`
→ 컨트리뷰터 환경 영역 (187 fixture 회귀 0) + 작업지시자 환경 영역 (시각 판정 통과) 영역 모두 정합 영역 — 환경 차이 회귀 가능성 차단 영역.

### `feedback_hancom_compat_specific_over_general` + `feedback_rule_not_heuristic`
→ 5 조건 AND 영역의 영향 영역 좁힘 영역 + 신규 휴리스틱 0 영역 (기존 상수 활용) 영역 정합 영역.

### `feedback_contributor_cycle_check`
→ @planet6897 영역의 30+ 사이클 PR (Layout / 페이지네이션 핵심 컨트리뷰터) 영역 정확 표현 영역.

## 6. 산출물

| 산출물 | 경로 |
|--------|------|
| 검토 보고서 | `mydocs/pr/archives/pr_679_review.md` |
| 최종 보고서 | `mydocs/pr/archives/pr_679_report.md` (본 문서) |
| merge commit | `bd3b63dd` (no-ff, 1 commit) |
| 회귀 차단 가드 | `tests/issue_676_trailing_empty_para.rs` (3 케이스) |

## 7. 컨트리뷰터 응대

@planet6897 (Jaeuk Ryu) 30+ 사이클 핵심 컨트리뷰터 안내:
- 본질 정정 정확 (5 조건 AND 영역의 영향 좁힘 + 신규 휴리스틱 0)
- 본 환경 결정적 검증 + 광범위 sweep 회귀 0
- 작업지시자 시각 판정 ★ 통과
- PAGE_MISMATCH 진전 (2 완전 + 1 부분, 잔존 16 후속)
- merge 결정

작성: 2026-05-08
