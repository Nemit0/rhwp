# PR #1051 최종 보고서 — 다중 para-float 표 lane 정합 (Refs #986)

- PR: [#1051](https://github.com/edwardkim/rhwp/pull/1051)
- 제목: Task #986: 다중 para-float 표 lane 정합
- 작성자: postmelee (Taegyu Lee) — 누적 컨트리뷰터 (PR #209/#214/#224 Firefox 확장 등재)
- base ← head: `devel` ← `postmelee:issue-986-landscape-table-flow`
- 결정: **merge (수용)** — 작업지시자 사전 시각 확인 + 본 환경 시각 판정 + 정량 게이트 모두 통과
- 일자: 2026-05-22

## 1. 결정

**merge 수용.** 다중 para-float 표를 한 host paragraph 안에서 x-overlap
lane 단위로 reservation 하는 신규 모듈 (`float_placement.rs`) + 3 path
공유 + 정량 게이트 통과 + 작업지시자 사전 시각 확인 + 본 환경 재시각
판정 모두 통과로 모든 게이트 충족.

이슈 #986 은 OPEN, postmelee 가 본인 작성 이슈 아님 (외부 컨트리뷰터
참여). PR merge 처리 후 명시 close 처리 (`feedback_close_issue_verify_
merged` 정합).

## 2. 검증 결과

### 2.1 게이트 종합

| 게이트 | 결과 |
|--------|------|
| CI: Build & Test | ✅ pass |
| CI: Analyze rust/js/py | ✅ pass |
| CI: Canvas visual diff | ✅ pass |
| CI: CodeQL | ✅ pass |
| 본 환경 cargo fmt --check | ✅ exit 0 |
| **본 환경 `tests/issue_986.rs`** | ✅ **2 passed** (회귀 가드) |
| **본 환경 svg_snapshot 8 건** | ✅ **8 passed, 0 failed** (golden 무회귀) |
| **본 환경 cargo test --release --lib** | ✅ **1331 passed, 0 failed** |
| WASM Docker 빌드 (release + wasm-opt) | ✅ pkg/rhwp_bg.wasm 4.7M (1m 35s) |
| **PR 본문: 작업지시자 사전 시각 확인** | ✅ 정상 판정 (스크린샷 첨부) |
| **본 환경 작업지시자 재시각 판정** | ✅ **통과** |

### 2.2 시각 판정 — 이중 통과 (사전 + 재시각)

본 PR 은 다른 PR 들과 차별점: **이중 시각 판정 통과**
- PR 본문 명시: "수정된 WASM 을 로컬에서 빌드한 뒤 rhwp-studio 로
  receipt.hwp 를 열어 시각 확인했습니다. 작업지시자 확인 결과 정상으로
  판정되었습니다."
- 본 환경 재시각 판정: ✅ 통과 (작업지시자 결정)

→ 작업지시자가 두 번 시각 확인. 정량 게이트 면제 패턴 (PR #1039/#1044/
#1054/#1059/#1057) 과 차별 — **풀 검증 모범 사례**.

## 3. 변경 내용

### 3.1 신규 모듈 `src/renderer/float_placement.rs` (+271)

para-float helper 공통 모듈:
- `pub(crate)` 가시성 (public API 노출 안 함)
- 빌더 패턴 (`FloatPlacementContext`)
- 단일 책임 헬퍼: `signed_hwpunit`, `is_para_topbottom_float`,
  `horizontal_range`, `FloatLaneSet`

### 3.2 3 path 공유

- `src/renderer/typeset.rs` (+142/-1) — default paginator lane reservation
- `src/renderer/layout.rs` (+62/-4) — render-tree y 정합
- `src/renderer/pagination/engine.rs` (+50/0) — legacy fallback (`RHWP_USE_PAGINATOR=1`)

**`feedback_image_renderer_paths_separate` 핵심 정합** — 3 path 동시
공유 모듈.

### 3.3 부수 정정

- `src/renderer/composer.rs` (+4/-1) + `composer/tests.rs` (+34/0) —
  debug overlay decreasing LINE_SEG `text_start` panic 방어
- 마지막 빈 paragraph trailing line spacing drift 양쪽 보정

### 3.4 회귀 가드 + fixture

- `tests/issue_986.rs` (+162/0, 신규):
  - `issue_986_receipt_right_tables_keep_independent_float_lanes`
  - `issue_986_receipt_tables_do_not_split_to_later_pages`
- `samples/issue-986-receipt.hwp` (신규, 84992 bytes) — 본 환경 재현 가능

### 3.5 scope 한정 (PR 본문 명시)

- 신규 lane path = **다중 para-float host paragraph 로 제한**
- issue #157 단일 table-only float 문서 기존 pagination 보존

## 4. Root cause + 설계 평가

### 4.1 Root cause

가로 방향 `receipt.hwp` — 빈 host paragraph (pi=0) 안에 비-TAC
`TopAndBottom` 표 `ci=2..8` 함께 있는 구조. 기존 pagination/layout 이
같은 paragraph 안 비-TAC 표들을 하나의 **전역 vertical cursor** 로만
누적 → 오른쪽 표 (다른 x 영역) 가 왼쪽 큰 표 아래로 밀리고 `PartialTable`
잘림 + 여러 페이지 분할.

### 4.2 설계 평가 — 메모리 룰 정합

- **`feedback_image_renderer_paths_separate`** (핵심 정합 — 권위 사례):
  신규 모듈이 3 path (typeset/layout/pagination) 공유. 메모리 룰의
  본질적 권위 사례.
- **`feedback_hancom_compat_specific_over_general`**: 신규 lane path 의
  scope 한정 (다중 para-float host 만, #157 단일 float 보존). 케이스별
  구조 가드.
- **scope 정직**: PR 본문 잔여 영역 + 비회귀 영역 명시.
- **`feedback_pr_supersede_chain`**: 본 PR 후속 영역 (단일 float, TAC
  float 등) 별도 분리 가능.

### 4.3 코드 품질

- 빌더 패턴 + `pub(crate)` 가시성 + 단일 책임 헬퍼
- debug overlay 방어 (Stage 4) 부수효과 정정
- 신규 fixture + 회귀 가드 동봉

## 5. cherry-pick 처리

PR 본질 commit (devel merge 제외 7 commit):
- `08bb95a2` Task #986: 수행 및 구현 계획서 작성
- `0ddc8130` Task #986 Stage 1: para-float lane helper 추가
- `5da4a4a6` Task #986 Stage 2: typeset lane pagination 적용
- `aa496534` Task #986 Stage 3: layout lane placement 정합
- `687e7cfc` Task #986 Stage 4: debug overlay composer 방어
- `cacba890` Task #986 Stage 5: receipt 회귀 테스트 추가
- `83ef7a42` Task #986 Stage 6: fallback 및 trailing empty 보정
- `d026fab6` Task #986: 최종 보고서 및 PR 정리

처리: 7 commit author (postmelee / Taegyu Lee) 보존 cherry-pick. clean-up
후속 commit 없음 (코드 품질 지적 사항 없음).

## 6. Hyper-Waterfall 방법론 정합 (모범 사례)

외부 컨트리뷰터 postmelee 가 메인테이너의 Hyper-Waterfall 방법론을
완전히 따른 사례:
- 수행 계획서 + 구현 계획서 + Stage 1~6 단계별 보고서 + 최종 보고서
- 회귀 가드 + 공개 fixture 동봉
- 작업지시자 사전 시각 확인 통과
- CI 전체 pass + 비회귀 가드 (#676/#712/#713/#775) 동시 통과

PR #1044 (jangster77 회귀 가드 + 공개 fixture) + PR #1054 (가설 반증 +
진짜 원인 식별) 패턴과 함께 외부 컨트리뷰터의 모범 사례 누적.

## 7. 잔존 / 후속

### 본 PR scope 외

- **연결 이슈 — Refs #986 만, closes 없음** — 본 PR 머지로 #986 명시
  close 처리
- **이슈 #986 assignee 누락** — postmelee 가 본인 작성 이슈 아님 (마이너)
- **라벨 "enhancement"** — 실제 bug fix 성격
- **`mydocs/orders/20260521.md` 변경** — 외부 컨트리뷰터가 메인테이너
  orders 수정. 영향 미미 (본 PR 처리 기록만 추가)
- **debug overlay LINE_SEG decreasing 방어** (Stage 4) — 본 PR 부수효과
  정정, 별도 이슈 없음

### 독립 영역 — 본 PR scope 외

- 다른 OPEN PR 들 (#1019 postmelee, #1048 planet6897 rebase 응답 대기) —
  본 PR 처리와 독립
- 이슈 #1055 (회귀, sample16-hwp5 p2 목차) — text_measurement 영역,
  본 PR (float_placement/typeset/layout) 과 독립

## 8. 산출물

- `mydocs/pr/pr_1051_review.md` (검토 문서)
- 본 보고서
- 소스: PR `float_placement.rs` 신규 + 3 path 공유 + 회귀 가드 + 공개 fixture

## 9. 메모리 룰 갱신 검토

- `project_external_contributors`: postmelee = 등재된 누적 기여자
  (PR #209/#214/#224 Firefox 확장). 본 PR 로 활동 영역 확장 (renderer
  파이프라인 신규 모듈). 갱신 시 본 PR 추가 후보 (별도 정리 task 후보).
- **권위 사례 — Hyper-Waterfall 외부 컨트리뷰터 모범**: postmelee 의
  계획서 + Stage 분리 + 회귀 가드 + 공개 fixture + 작업지시자 사전
  확인 패턴. PR #1044/#1054 와 함께 외부 컨트리뷰터 모범 사례 누적.
- **권위 사례 — `feedback_image_renderer_paths_separate`**: 본 PR 의
  신규 모듈 3 path 공유 패턴이 메모리 룰의 본질적 권위 사례 강화.
- **권위 사례 — "이중 시각 판정 통과"**: PR 본문 사전 + 본 환경 재시각
  이중 통과 패턴. PR #1039/#1044/#1054/#1059/#1057 의 정량 게이트 면제
  와 차별 — 풀 검증 모범 사례.
