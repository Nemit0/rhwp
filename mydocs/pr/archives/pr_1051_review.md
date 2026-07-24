# PR #1051 검토 — 다중 para-float 표 lane 정합 (Refs #986)

## 1. PR 정보

| 항목 | 값 |
|------|-----|
| 번호 | #1051 |
| 제목 | Task #986: 다중 para-float 표 lane 정합 |
| 작성자 | postmelee (Taegyu Lee) — 누적 컨트리뷰터 (PR #209/#214/#224 Firefox 확장 등재) |
| base ← head | `devel` ← `postmelee:issue-986-landscape-table-flow` |
| 라벨 | enhancement |
| **변경** | **19 파일 +1692 / -7 (대형)** — 소스 6 + 문서 11 + 신규 fixture 1 + 신규 테스트 1 |
| 연결 이슈 | Refs #986 (OPEN — assignee 없음, closes 없음) |
| mergeable | MERGEABLE / BEHIND (17 commit 전진, **자동 머지 성공** — 충돌 없음) |
| CI | Build & Test ✅ / Analyze rust·js·py ✅ / Canvas visual diff ✅ / CodeQL ✅ / WASM skip |
| 본질 commit | 8 — Stage 1~6 + 최종보고서 + devel merge (Hyper-Waterfall 정합) |
| **작업지시자 사전 시각 확인** | ✅ **PR 본문 명시** ("작업지시자 확인 결과 정상으로 판정되었습니다") + 스크린샷 첨부 |
| 생성 | 2026-05-21 03:04 |

## 2. 배경 (이슈 #986)

가로 방향 `receipt.hwp` 에서 한 빈 host paragraph (pi=0) 안에 비-TAC
para-relative `TopAndBottom` 표 `ci=2..8` 이 함께 있는 구조:
- 왼쪽 큰 표 + 오른쪽 작은 표들이 **서로 다른 x 영역**
- 정답: 같은 y 위치에서 시작 (x-overlap 없음 → 같은 페이지)

**기존 버그**: pagination/layout 이 같은 paragraph 안 비-TAC 표들을
하나의 **전역 vertical cursor** 로만 누적 → 오른쪽 표가 왼쪽 큰 표
아래로 밀리고 `PartialTable` 잘림 + 여러 페이지 분할.

## 3. 변경 내용

### 3.1 신규 모듈 `src/renderer/float_placement.rs` (+271, 신규)

para-float helper 공통 모듈 신규 도입:

```rust
//! Flow reservation helpers for non-inline floating objects.

pub(crate) fn signed_hwpunit(value: HwpUnit) -> i32 { ... }
pub(crate) fn is_para_topbottom_float(common: &CommonObjAttr) -> bool { ... }

pub(crate) struct FloatPlacementContext {
    pub col_area: LayoutRect,
    pub body_area: Option<LayoutRect>,
    pub paper_width: Option<f64>,
    pub host_margin_left: f64,
    pub host_margin_right: f64,
}

impl FloatPlacementContext {
    // 빌더 패턴 — with_body_area / with_paper_width / with_host_margins
}

pub(crate) fn horizontal_range(common, width_px, ctx, dpi) -> ... { ... }
// + FloatLaneSet 등
```

**우수 설계**:
- `pub(crate)` 가시성 — public API 노출 안 함
- 빌더 패턴 — 확장성 + 가독성
- 단일 책임 헬퍼 함수 분리
- **`feedback_image_renderer_paths_separate` 정합** — `typeset.rs` +
  `layout.rs` 양 path 공유

### 3.2 `src/renderer/typeset.rs` (+142/-1, lane pagination)

빈 host paragraph 안에 para-float 표가 2개 이상일 때 horizontal lane
단위로 pagination reservation 수행:

```rust
use crate::renderer::float_placement::{
    horizontal_range, is_para_topbottom_float, signed_hwpunit, FloatLaneSet, FloatPlacementContext,
};
```

### 3.3 `src/renderer/layout.rs` (+62/-4, render-tree)

같은 lane 규칙으로 표의 실제 y 위치 정합.

### 3.4 `src/renderer/pagination/engine.rs` (+50/0)

legacy paginator fallback (`RHWP_USE_PAGINATOR=1`) 도 같은 lane 규칙 적용.

### 3.5 `src/renderer/composer.rs` (+4/-1) + `composer/tests.rs` (+34/0)

debug overlay 생성 중 decreasing LINE_SEG `text_start` panic 방어
+ 단위 테스트.

### 3.6 `tests/issue_986.rs` (+162/0, 신규)

회귀 가드 — receipt 시나리오 2 테스트.

### 3.7 `samples/issue-986-receipt.hwp` (신규 fixture)

본 환경에서 재현 가능한 공개 fixture (PR #1044 패턴 정합 — 공개 fixture
로 회귀 가드 단언).

### 3.8 `mydocs/orders/20260521.md` (+7/-1)

5/21 orders 에 본 PR 처리 기록 추가.

### 3.9 신규 lane path scope 한정 (PR 본문 명시)

- **다중 para-float host paragraph 로 제한** — issue #157 같은 단일
  table-only float 문서의 기존 pagination 보존
- **마지막 빈 paragraph trailing line spacing drift** default/fallback
  pagination 양쪽 보정

## 4. 검토 항목

### 4.1 설계 적합성 — 메모리 룰 정합 ✅

- **`feedback_image_renderer_paths_separate`** (핵심 정합): 신규 모듈
  `float_placement.rs` 가 `typeset.rs` (default paginator) + `layout.rs`
  (render-tree) + `pagination/engine.rs` (legacy fallback) **3 path
  공유**. 메모리 룰의 본질적 권위 사례.
- **`feedback_hancom_compat_specific_over_general`**: 신규 lane path 가
  **다중 para-float host paragraph 로 제한** (issue #157 단일 float 문서
  기존 동작 보존). 일반화 회피 + 케이스별 구조 가드.
- **scope 정직**: PR 본문 "issue #157 같은 단일 table-only float 문서의
  기존 pagination 보존" 명시 + Stage 분리 + 회귀 가드 + fixture 동봉.
- **`feedback_assign_issue_before_work`**: 이슈 #986 assignee 누락 —
  마이너 (외부 PR 작성자가 본인 작성 이슈 아님).

### 4.2 코드 품질 ✅

- **`float_placement.rs` 빌더 패턴** — 확장성 + 가독성
- **`pub(crate)` 가시성** — public API 노출 안 함
- **단일 책임 헬퍼** — `signed_hwpunit`, `is_para_topbottom_float`,
  `horizontal_range`, `FloatLaneSet` 각각 명료
- **debug overlay 방어** — composer 의 panic 차단 (Stage 4)
- **회귀 가드 동봉** — `tests/issue_986.rs` + 본 환경 재현 가능 fixture

### 4.3 검증 충실성 ✅✅ (사전 시각 확인 + 정량 게이트)

PR body 검증:
- `cargo fmt --all --check` ✅
- `cargo test --release --lib`: **1326 passed, 0 failed, 6 ignored** ✅
- `cargo test --test issue_986`: **2 passed** ✅
- 기존 회귀 가드 (`issue_676_trailing_empty_para`, `issue_712`,
  `issue_713`, `issue_775`) 모두 통과 ✅
- `cargo test --test svg_snapshot`: 8 passed ✅
- `dump-pages` (default + `RHWP_USE_PAGINATOR=1` fallback) — 1 페이지에
  ci=2..8 모두 배치 ✅
- **WASM 빌드 + rhwp-studio 로 receipt.hwp 시각 확인 — 작업지시자 정상
  판정** ✅ (PR 본문 명시 + 스크린샷 첨부)

### 4.4 작업지시자 사전 시각 확인 — 핵심 사실 ✅

PR 본문 명시:
> "수정된 WASM 을 로컬에서 빌드한 뒤 `rhwp-studio` 로 `receipt.hwp` 를
> 열어 시각 확인했습니다. **작업지시자 확인 결과 정상으로 판정**되었습니다."

스크린샷 첨부 (https://github.com/user-attachments/assets/9a244730-f0fe-4db6-ac4c-ef57c2ea2008).

→ **작업지시자 시각 게이트 사전 통과**. 본 검토에서 추가 시각 판정
요청 불요.

### 4.5 잔존 / scope 외

- **연결 이슈 — Refs #986 만, closes 없음** — 본 PR 머지로 #986 close
  처리 가능 후보 (작업지시자 결정)
- **이슈 #986 assignee 누락** — postmelee 가 본인 작성 이슈 아니나
  메모리 룰 `feedback_assign_issue_before_work` 안내 후보, merge blocker
  아님
- **라벨 "enhancement" vs 실제 bug fix** — 마이너 불일치
- **`mydocs/orders/20260521.md` 변경** — 외부 컨트리뷰터가 메인테이너의
  orders 파일을 수정하는 점이 거버넌스상 점검 후보. 다만 본 PR 의
  처리 기록 추가만이라 영향 미미

### 4.6 #1055 회귀와의 관계 — 무관 확인 ✅

- #1055 회귀 영역: `text_measurement.rs` (WASM 폰트 폭 정합)
- PR #1051 영역: `float_placement.rs` (신규) + `typeset.rs` + `layout.rs`
  + `pagination/engine.rs` + `composer.rs`
- → 영역 격리, 본 PR 머지가 #1055 추가 회귀 유발 안 함

## 5. 처리 절차 (간소화 4단계)

1. ✅ PR 정보 확인 + 작업지시자 사전 시각 확인 사실 검증
2. → 본 검토 문서 작성 + 작업지시자 승인 요청 (현 단계)
3. (불요 예상) 코드 품질 양호, 본 PR 수정요청 항목 없음
4. 검증 (본 환경 빌드/테스트) + 머지 처리 → `pr_1051_report.md`

## 6. 1차 판단 (작업지시자 승인 전 잠정)

| 영역 | 평가 |
|------|------|
| 설계 방향 | ✅ 적합 — 신규 모듈 `float_placement.rs` + 3 path 공유, scope 한정 |
| CI / 결정적 검증 | ✅ 전부 pass (cargo test 1326, svg_snapshot 8, issue_986 2) |
| 코드 품질 | ✅ 양호 — 빌더 패턴 + pub(crate) + 단일 책임 헬퍼 |
| scope | ✅ 다중 para-float host 한정, 단일 float 문서 (#157) 보존 |
| 메모리 룰 정합 | ✅ image_renderer_paths_separate / hancom_compat_specific / scope 정직 |
| **작업지시자 사전 시각 확인** | ✅ **PR 본문 명시 사실 — 추가 시각 게이트 면제** |
| Hyper-Waterfall | ✅ 수행/구현 계획서 + Stage 1~6 + 최종보고서 (방법론 정합) |
| 머지 가능성 | ✅ 자동 머지 성공 (BEHIND 였으나 ort 전략 흡수) |
| 이슈 연결 | Refs #986 만 (closes 없음 — 머지 후 명시 close 처리 권고) |

**잠정 결론**: 코드·설계·검증·시각 확인 모두 양호. **작업지시자 사전
시각 확인 통과** 가 본 PR 의 결정적 차별점. PR #1057 (정량 게이트 면제)
과 달리 본 PR 은 **사전 시각 판정 완료** 패턴. 머지 권고 방향.

> 본 문서는 검토 계획 + 항목 통합. 작업지시자 승인/피드백 후
> 검증 단계 → `pr_1051_report.md` 로 최종 판단 기록.
