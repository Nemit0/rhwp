# PR #1004 검토 — 표·글상자 레이아웃 정합 — 빈 문단 advance 이중 가산 + 분할 표 렌더링 (Task #990, #991)

- 작성일: 2026-05-20
- 컨트리뷰터: [@planet6897](https://github.com/planet6897) (Jaeuk Ryu)
- PR: https://github.com/edwardkim/rhwp/pull/1004
- base/head: `devel` ← `planet6897:feat/table-split-render`
- 연결: Task #990 + Task #991 (closes 명시 없음)
- 규모: +1292 / -26, 23 files
- mergeable: **CONFLICTING**

## 1. 컨트리뷰터 사이클 + 동시 OPEN 시리즈 관계

@planet6897 = 15+ PR 핵심 컨트리뷰터. 동시 OPEN PR 3건:

| PR | 본질 | 상태 |
|----|------|------|
| #1003 | Task #990 단독 | **머지 완료 `c2024ec9` (2026-05-20)** |
| **#1004** | Task #990 + Task #991 통합 | OPEN (본 검토) |
| #1024 | 분할 표 cut 모델(RowCut) + LAYOUT_OVERFLOW 42→12 (closes #1022) | OPEN, **+5912/-1742, 68 files** |

## 2. ⚠️ 핵심 — PR #1004 의 가치 평가

### Task #990 부분 — **이미 PR #1003 으로 해소**

본 PR 의 Task #990 3 커밋 (`69d71897` + `eec4781f` + `d53e31b4`) 는 PR #1003 으로 머지된 동일 커밋. 본 PR 머지 시 중복 발생.

### Task #991 부분 — **PR #1024 와 영역 중복**

본 PR Task #991 3 커밋:
- `b2a212e4` 분할 셀 줄 범위 — 끝 페이지 패스 유도로 중복·누락 해소
- `565c5805` 1행 글자처럼취급 표 분할 금지 — 통째 다음 페이지 이동
- `276b28eb` 쪽 분할 표 직후 문단 vpos 팬텀 해소

소스 파일: `layout.rs` + `layout/table_layout.rs` + `typeset.rs`

**PR #1024 가 동일 3 파일 + `table_partial.rs` / `pagination/*` 등 추가** (총 10+ 파일, +5912/-1742). PR #1024 본문 자인:

> "동일 계열(분할 표 렌더링)인 open PR #1004(#990/#991)와 일부 겹칩니다."

PR #1024 는 **분할 표 cut 모델(`RowCut`) 단일 권위 통합** + **LAYOUT_OVERFLOW 42→12** (71% 감소) + **VPOS_CORR over-correction 제거** + **다중 머리행 overhead 정합** 등 더 깊은 작업. 본 PR Task #991 의 휴리스틱 정정을 RowCut 이산 모델로 일반화.

## 3. 검토 의견

### 강점

1. Task #990 + Task #991 두 작업 묶음 — 의도는 합리적이나 작은 단위 분리(#1003) + 발전형(#1024) 등장으로 본 통합 PR 의 가치 감소
2. Task #991 3 커밋 본질은 정확 (분할 셀 줄 범위 / 1행 표 분할 금지 / vpos 팬텀 해소)
3. PR 본문 충실 + cargo test 1482 + clippy 0 (PR 본문)

### ⚠️ 핵심 쟁점

#### (A) Task #990 영역 중복 (이미 #1003 머지)

본 PR 의 Task #990 3 커밋 = PR #1003 머지본과 동일. cherry-pick 시 충돌 또는 중복 영역 자동 흡수. 본 PR 머지 시 #1003 효과 + 본 PR Task #990 부분 중복.

#### (B) Task #991 영역 — #1024 가 발전·확장 형태로 OPEN

PR #1024 (+5912/-1742, 68 files) 가:
- 본 PR Task #991 영역(`table_layout.rs` / `typeset.rs` / `layout.rs`) 모두 변경
- RowCut 이산 모델 단일 권위 통합 (본 PR 휴리스틱 정정 일반화)
- LAYOUT_OVERFLOW 42→12 (71% 감소) 측정 정합
- closes #1022 (M100 측정 정합)

**#1024 본문이 직접 "본 PR과 일부 겹친다" 인정** — Task #991 영역은 #1024 에 흡수.

#### (C) `feedback_small_batch_release_strategy` + `feedback_pr_supersede_chain` 정합

- 작은 단위 우선 → #1003 (Task #990 단독) 머지
- 발전형 흡수 → #1024 (분할 표 RowCut 모델) 처리
- **본 PR 의 남은 가치는 사실상 없음** (Task #990 중복 + Task #991 #1024 흡수)

## 4. 처리 옵션

- **옵션 A (수용)**: Task #991 3 커밋 만 cherry-pick. #1024 처리 시 동일 영역 충돌·재작업 필요. **권장 안 함**.
- **옵션 B (수정 요청)**: Task #991 부분만 분리 PR 재제출 요청. 그러나 #1024 가 더 발전된 형태로 이미 OPEN — 컨트리뷰터에게 중복 작업 부담.
- **옵션 C (close — 권고)**: Task #990 #1003 머지로 해소 + Task #991 #1024 처리 안내. `feedback_pr_supersede_chain` + `feedback_small_batch_release_strategy` 정합. 가장 단순·명확.

## 5. 메모리 룰 정합

- `feedback_contributor_cycle_check` — @planet6897 동시 OPEN 3건 (#1004 + #1024) 사이클 점검
- `feedback_pr_supersede_chain` — **권위 사례**: 작은 단위(#1003) + 발전형(#1024)이 통합 PR(#1004) 가치 흡수
- `feedback_small_batch_release_strategy` — #1003 작은 단위 머지 + #1024 발전형 처리 + #1004 close 권고
- `feedback_visual_judgment_authority` — 본 PR 영역은 #1003/#1024 가 각각 시각 판정 받음

## 6. 권고

**옵션 C (close)** — Task #990 #1003 머지로 해소 + Task #991 #1024 처리 안내. 본 PR 의 남은 고유 가치는 사실상 없음. `feedback_pr_supersede_chain` + `feedback_small_batch_release_strategy` 정합. 컨트리뷰터에게 향후 통합 PR 보다 작은 단위 분리 권고 (이미 #1003 + #1024 분리 패턴 확립).
