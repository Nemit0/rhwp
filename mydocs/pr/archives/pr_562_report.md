# PR #562 처리 보고서

**PR**: [#562 Task #555: 옛한글 PUA → 자모 변환 후 폰트 매트릭스 갱신](https://github.com/edwardkim/rhwp/pull/562)
**작성자**: @planet6897 (Jaeuk Ryu) — PR #551 의 컨트리뷰터
**처리 결정**: ✅ **머지 (옵션 A — 7 commits 모두 cherry-pick)**
**처리일**: 2026-05-04

## 1. 처리 결과 요약

| 항목 | 결과 |
|------|------|
| 결정 | 옵션 A — 7 commits 모두 cherry-pick (작업지시자 결정) |
| cherry-pick 적용 | 6 commits (merge commit `f6039f3` 1건 skip — 이미 적용된 영역) |
| author 보존 | ✅ @planet6897 |
| 충돌 | 3건 — `mydocs/orders/20260504.md` (3 단계 cherry-pick 시 모두 양쪽 통합) |
| 결정적 검증 | 모두 통과 |
| 시각 판정 (작업지시자) | ✅ 통과 ("웹 에디터에서 옛한글 매트릭스 개선이 시각적으로 확인되었습니다") |
| WASM 빌드 | ✅ 4,585,998 bytes (Task #528 시점 4,543,430 +42,568, Task #544 v2 + #555 반영) |
| 이슈 close | #555 (closes #555 명시) |

## 2. cherry-pick 결과

### 2.1 적용된 commits (local/devel 기준)

| 신 commit | 원본 PR commit | 설명 |
|----------|--------------|------|
| `a30dca7` | `457d5f3` | Task #544 v2 Stage 2: Phase A 재적용 (paragraph border 좌표/inset 산식) |
| `f30b352` | `b146b83` | PR #551 Task #544 핀셋 처리 보고서 + 검토 문서 + orders |
| (skip) | `f6039f3` | merge commit — 이미 적용된 영역 |
| `f45f6a0` | `f807378` | PR #551 Task #544 처리 후속: archives 이동 |
| `af556a5` | `096b573` | Task #555 수행/구현 계획서 + Stage 1 진단 |
| `f44a721` | `beade38` | Task #555 Stage 2-4: 옛한글 PUA 폰트 매트릭스 정정 (옵션 A) |
| `4af03b7` | `eac36f2` | Task #555 최종 보고서 + orders 갱신 |

### 2.2 변경 파일 (PR #562 의 본질)

#### Task #544 v2 (paragraph border 산식)

| 파일 | 변경 |
|------|------|
| `src/renderer/layout/paragraph_layout.rs` | +14 / -27 (inner_pad 분기 제거 + box_x/w 산식 정정) |
| `src/renderer/layout/integration_tests.rs` | +312 (test_544 / test_547 GREEN 전환 + 회귀 가드) |

#### Task #555 (옛한글 PUA 폰트 매트릭스)

| 파일 | 변경 |
|------|------|
| `src/renderer/composer.rs` | +16 (`effective_text_for_metrics` 헬퍼) |
| `src/renderer/composer/tests.rs` | +69 (단위 테스트 3건 GREEN) |
| `src/renderer/layout.rs` | +28 / -? (Square wrap host est_x + TAC leading width 영역 매트릭스 사용) |
| `src/renderer/layout/table_layout.rs` | +32 / -? (셀 max width / inline shape text_before 영역) |
| `src/renderer/layout/paragraph_layout.rs` | (Task #544 v2 와 통합) |

#### 문서

- `mydocs/plans/task_m100_555{,_impl}.md` (신규)
- `mydocs/working/task_m100_555_stage{1,2,4}.md` (신규)
- `mydocs/report/task_m100_555_report.md` (신규)
- `mydocs/working/task_m100_544_v2_stage2.md` (신규)
- `mydocs/pr/archives/pr_551_review_v3_544_a2.md` + `pr_551_v3_544_a2_report.md` (신규, 컨트리뷰터의 자체 처리 보고서)

## 3. 검증 결과

### 3.1 결정적 검증 (모두 통과)

| 게이트 | 결과 |
|--------|------|
| `cargo test --lib` | ✅ **1123 passed** (Task #528 시점 1118 +5 — Task #544 v2 GREEN +2 + Task #555 GREEN +3) |
| `cargo test --test issue_546` | ✅ Task #546 양립 |
| `cargo test --test issue_530` | ✅ PR #531 회귀 0 |
| `cargo test --test issue_505` | ✅ 9/9 (PR #507 회귀 0) |
| `cargo test --test issue_418/501` | ✅ 회귀 0 |
| `cargo test --test svg_snapshot` | ✅ **6/6 passed** |
| `cargo clippy --lib` | ✅ 0 건 |
| `cargo build --release` | ✅ Finished |

### 3.2 Task #555 단위 테스트

```
test_555_effective_text_for_metrics_uses_display_text_when_present ... ok
test_555_effective_text_for_metrics_no_display_text_falls_back_to_text ... ok
test_555_effective_text_for_metrics_multi_jamo_cluster ... ok
```

→ Task #555 의 본질 (display_text 기반 매트릭스 측정 + fallback 패턴) 결정적 검증 통과.

### 3.3 WASM 빌드

| 산출물 | 크기 | 비고 |
|--------|------|------|
| `pkg/rhwp_bg.wasm` | 4,585,998 bytes | Task #528 시점 4,543,430 +42,568 (Task #544 v2 + #555 정정 반영) |
| `pkg/rhwp.js` | 변동 없음 | |
| `rhwp-studio/public/rhwp_bg.wasm` | ✅ 동기화 | |
| `rhwp-studio/public/rhwp.js` | ✅ 동기화 | |

### 3.4 작업지시자 시각 판정

작업지시자 인용:
> 웹 에디터에서 옛한글 매트릭스 개선이 시각적으로 확인되었습니다. 아직 미진한 점이 있지만 분할 정복 전략에 맞는 접근법입니다.

→ Task #555 의 옵션 A (Conservative fix) 효과 web Canvas 에서 확인. 미진한 영역은 향후 별도 task 로 분할 정복 진행.

## 4. 본 PR 의 본질

### 4.1 Task #555 (PR 본문 명시 본질, closes #555)

**결함**: Task #528 (옛한글 PUA → KS X 1026-1 자모 변환) 의 후속 결함. Stage 3 의 Option A (렌더러 시점 변환) 의 인덱싱 불변성 trade-off 로 **`run.text` 가 PUA char 1글자** 보존 → 폰트 매트릭스 측정 (`estimate_text_width` 등 10건 호출처) 이 자모 시퀀스 (3-4 char) 와 정합 안 됨.

**정정 (옵션 A)**:
- `effective_text_for_metrics(run)` 헬퍼 (`run.display_text.as_deref().unwrap_or(&run.text)`) — 매트릭스 측정 시 display_text 우선
- 호출처 10건 패치:
  - `composer.rs:920` (LineSeg 검증)
  - `layout.rs:3444` (Square wrap host est_x: char-by-char PUA → jamo 변환)
  - `layout.rs:3510/3522` (TAC leading width full run: 헬퍼)
  - `layout.rs:3516` (TAC leading width partial run: partial PUA → jamo 변환)
  - `table_layout.rs:860/1825/1851` (셀 max width / 분할 추적: 헬퍼)
  - `table_layout.rs:1659/1935` (셀 inline shape text_before: text PUA → jamo 변환)

**검증 (PR #562 본문 + 본 환경)**:
- 13 fixture 481 페이지 광범위 sweep — 481/481 byte-identical (PR #562 본문 보고)
- visual char positioning 은 IR 기반 → 본 fix 는 conservative (현재 visual 영향 없음, 잠재적 결함 차단)
- 인덱싱 불변성 유지 (Task #528 의 trade-off 보존)

### 4.2 Task #544 v2 (PR 본문 미명시, fork branch 누적)

**결함**: 21_언어_기출 passage 글상자 우측 시프트 (이슈 #544) — paragraph border outline 산식 + inner_pad 이중 적용

**정정** (`457d5f3` Stage 2):
- `paragraph_layout.rs::box_x = col_area.x` / `box_w = col_area.width` (margin 미적용, paragraph border outline = col_area 전체)
- `inner_pad` 분기 제거 (visible-stroke + bs=0 인 경우 `margin_left = box_margin_left` 단일 적용)

**측정 (PR #560 사이클의 시각 판정 결과)**:
- 페이지 4 [7~9]: 박스 left 128.51→117.17 (PDF 117.0), width 402.5→425.17 (PDF 425.1)
- 본문 첫 글자 '평' x 153.12→128.51 (PDF 128.5)
- 9 박스 모두 PDF 정합

→ Task #544 v2 는 PR #560 사이클에서 작업지시자 시각 판정 통과한 영역. 본 환경에 처음 적용 (PR #562 의 fork branch 가 자체 cherry-pick 한 영역).

## 5. 분할 정복 전략 정합

작업지시자 평가:
> 분할 정복 전략에 맞는 접근법입니다.

본 PR 의 정합한 영역:
1. **Task #528 → Task #555 의 분할** — Task #528 의 본질 정정 (PUA → 자모 매핑) 후 후속 결함 (폰트 매트릭스 정합) 을 별도 task 로 분리 진행
2. **Conservative fix** — 481/481 byte-identical 로 현재 visual 영향 없이 잠재적 결함 차단
3. **인덱싱 불변성 유지** — Task #528 의 trade-off 보존
4. **fallback 패턴** (`run.display_text.as_deref().unwrap_or(&run.text)`) — 비-PUA 영역은 이전 동작 유지, PUA 만 정합 향상

미진한 영역은 향후 별도 task 로 단계적 정정 (작업지시자의 분할 정복 전략).

## 6. 컨트리뷰터 정합

### 6.1 정합 사항

@planet6897 의 PR #562 — 본 사이클의 메모리 룰 적용:
- ✅ `feedback_no_pr_accumulation` — 새 PR 로 등록 (PR #551 잔존 누적 회피)
- ✅ `feedback_per_task_pr_branch` — 별도 fork branch (`pr-task555`)
- ✅ `feedback_essential_fix_regression_risk` — 13 fixture 481 페이지 광범위 검증
- ✅ `feedback_rule_not_heuristic` — 단일 룰 (분기 없음, fallback 패턴)
- ✅ `feedback_visual_regression_grows` — byte-identical auto-pass

### 6.2 메모리 룰 명시 인용

PR 본문이 본 사이클의 작업지시자 피드백을 명시 인용 — 컨트리뷰터의 패턴 학습 + 적용 정합. 매우 정합한 워크플로우.

### 6.3 base 차이 영역 (메인테이너 작업으로 인한)

본 PR base (`b84c5e9`) 와 본 환경 devel (`d1dbd85`) 사이에 메인테이너 (작업지시자) 의 PR #553 rollback 처리 (1 commit) 가 있어 fork 가 미동기화 상태. **컨트리뷰터 잘못 아님** (작업지시자 결정).

## 7. 머지 절차

### 7.1 cherry-pick + 충돌 해소 (완료)

```bash
# 사전 점검 + stash
git fetch origin
git stash push -u -m "PR #562 review docs" mydocs/pr/pr_562_review.md (해당 사항 없음, 본 PR 검토 문서는 archives 시점에 생성)

# 7 commits 시간 순서 cherry-pick (1건 skip)
git cherry-pick 457d5f3                           # Task #544 v2 Stage 2 (충돌 0)
git cherry-pick b146b83                           # Task #544 처리 보고서 (orders 충돌 → 양쪽 통합)
git cherry-pick -m 1 f6039f3                      # merge commit → skip (이미 적용)
git cherry-pick f807378                           # archives 이동 (orders 충돌 → 양쪽 통합)
git cherry-pick 096b573                           # Task #555 Stage 1 (충돌 0)
git cherry-pick beade38                           # Task #555 Stage 2-4 (충돌 0)
git cherry-pick eac36f2                           # Task #555 최종 보고서 (orders 충돌 → 양쪽 통합)
```

### 7.2 검증 + WASM 빌드 (완료)

(위 §3 결과)

### 7.3 commit + 머지 + push

```bash
# PR #562 처리 보고서 commit
git add mydocs/pr/pr_562_report.md
git commit -m "PR #562 처리 보고서 (cherry-pick @planet6897 6 commits + 1 skip — Task #544 v2 + Task #555)"

# devel 머지 + push
git checkout devel
git merge local/devel --no-ff -m "..."
git push origin devel
```

### 7.4 PR/이슈 close + 컨트리뷰터 인사

```bash
gh pr close 562 --repo edwardkim/rhwp --comment "..."
# 이슈 #555 close (closes #555 명시 + 정정 적용)
gh issue close 555 --repo edwardkim/rhwp --comment "..."
```

## 8. 사후 처리

- [x] 결정적 검증 + WASM 빌드 + studio 동기화
- [x] 작업지시자 시각 판정 (web Canvas) 통과
- [ ] 본 보고서 commit
- [ ] devel 머지 + push
- [ ] PR #562 close + 이슈 #555 close + 컨트리뷰터 인사
- [ ] 본 보고서 archives 이동
- [ ] 오늘할일 갱신 (PR #562 + 이슈 #555 close)
- [ ] 미진한 영역 (작업지시자 평가) — 향후 별도 task 등록 결정 (작업지시자)

## 9. 메모리 정합

- ✅ `feedback_check_open_prs_first` — 본 PR 처리 정합
- ✅ `feedback_pr_comment_tone` — close 댓글 차분/사실 중심
- ✅ `feedback_release_sync_check` — cherry-pick 시점 main 동기화 점검 (`0fb3e675` 정합)
- ✅ `feedback_v076_regression_origin` — 작업지시자 직접 시각 판정 통과
- ✅ `feedback_visual_regression_grows` — 광범위 회귀 검증 + 시각 판정 게이트
- ✅ `feedback_pdf_not_authoritative` / `reference_authoritative_hancom` — 한컴 2010/2020 + web Canvas 직접 비교
- ✅ `feedback_image_renderer_paths_separate` — Task #555 의 정정은 composer + layout + table_layout 다중 영역, 신중 점검 + 광범위 sweep
- ✅ `feedback_hancom_compat_specific_over_general` — Task #555 의 fallback 패턴 (PUA 만 매트릭스 변환, 비-PUA 는 이전 동작) — case-specific 정합
- ✅ `feedback_no_pr_accumulation` (컨트리뷰터 적용) — 새 PR 분리
- ✅ `feedback_per_task_pr_branch` (컨트리뷰터 적용) — 별도 fork branch
- ✅ `feedback_essential_fix_regression_risk` (컨트리뷰터 적용) — 481 페이지 광범위 sweep
- ✅ `feedback_rule_not_heuristic` (컨트리뷰터 적용) — fallback 패턴 단일 룰
