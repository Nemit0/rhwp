# PR #551 처리 보고서

**PR**: [#551 156 commits / 39 task accumulating since e585b589](https://github.com/edwardkim/skim/pull/551)
**작성자**: @planet6897 (Jaeuk Ryu) — 외부 컨트리뷰터 (PR #538 에 이어 두 번째 PR)
**처리 결정**: ✅ **Task #525 만 우선 cherry-pick** (작업지시자 옵션 C-1)
**처리일**: 2026-05-03

## 1. 처리 결과 요약

| 항목 | 결과 |
|------|------|
| 결정 | Task #525 우선 cherry-pick (PR #551 의 본질 50+ task 중 하나) |
| cherry-pick 대상 | 6 commits (Task #525 의 stage 1-4) |
| 제외 | 248 commits 중 242 commits (다른 task 들 — 별도 처리 결정) |
| author 보존 | ✅ @planet6897 (cherry-pick default) |
| 충돌 | 1 건 — `mydocs/orders/20260503.md` (수동 해소) |
| 결정적 검증 | 모두 통과 |
| 광범위 회귀 검증 | 113 페이지 byte-identical + exam_science 2 페이지 의도된 정정 |
| 시각 판정 1차 (SVG) | ✅ 통과 |
| WASM 빌드 | ✅ 4,441,878 bytes (-626 from Task #546 시점, layout.rs -55 LOC 반영) |

## 2. cherry-pick 결과

### 2.1 적용된 commits (local/devel 기준)

| 신 commit | 원본 PR commit | 설명 |
|----------|--------------|------|
| `ce6ecac` | `d24a896` | Task #525 수행 계획서 |
| `c9b897d` | `ba680bc` | Task #525 Stage 1 진단 |
| `5e6ce95` | `68f109b` | Task #525 구현 계획서 (A안) |
| **`51e8612`** | **`35c6c00`** | **Task #525 Stage 2 정정 (코드 변경)** |
| `22dcd2d` | `78af341` | Task #525 Stage 3 회귀 검증 |
| `79d10e6` | `ec9fe47` | Task #525 Stage 4 최종 보고서 |

cherry-pick 의 default 동작으로 author = @planet6897 유지.

### 2.2 변경 파일

| 파일 | 변경 |
|------|------|
| **`src/renderer/layout.rs`** | **+14 / -69 (net -55 LOC)** |
| `mydocs/plans/task_m100_525.md` (신규) | 수행 계획서 |
| `mydocs/plans/task_m100_525_impl.md` (신규) | 구현 계획서 |
| `mydocs/working/task_m100_525_stage1.md` (신규) | Stage 1 진단 |
| `mydocs/working/task_m100_525_stage3.md` (신규) | Stage 3 회귀 검증 |
| `mydocs/report/task_m100_525_report.md` (신규) | Stage 4 최종 보고서 |
| `mydocs/orders/20260503.md` | 일지 통합 (양쪽 보존) |

## 3. 검증 결과

### 3.1 결정적 검증 (모두 통과)

| 게이트 | 결과 |
|--------|------|
| `cargo test --lib` | ✅ **1113 passed** (회귀 0) |
| `cargo test --test issue_546` (Task #546 양립 확인) | ✅ 1 passed |
| `cargo test --test issue_530` (PR #531 회귀 0) | ✅ 1 passed |
| `cargo test --test issue_505` (PR #507 회귀 0) | ✅ 9/9 passed |
| `cargo test --test issue_418/501` | ✅ 회귀 0 |
| `cargo test --test svg_snapshot` | ✅ **6/6 passed** |
| `cargo clippy --lib -- -D warnings` | ✅ 0 건 |
| `cargo build --release` | ✅ Finished |

### 3.2 광범위 fixture sweep (byte-level)

Task #546 시점 (`9b4decd`) ↔ Task #525 cherry-pick 후 SVG byte 비교:

| fixture | byte-identical | 결과 |
|---------|---------------|------|
| 2010-01-06.hwp | 6/6 | ✅ 회귀 0 |
| 21_언어_기출_편집가능본.hwp | 15/15 | ✅ 회귀 0 |
| exam_eng.hwp | 8/8 | ✅ 회귀 0 |
| exam_kor.hwp | 20/20 | ✅ 회귀 0 |
| exam_math.hwp | 20/20 | ✅ 회귀 0 |
| **exam_science.hwp** | **2/4** | ✅ **의도된 정정** (p1, p2 dup emit 해소) |
| synam-001.hwp | 35/35 | ✅ 회귀 0 |
| 복학원서.hwp | 1/1 | ✅ 회귀 0 |

→ **113 페이지 byte-identical + exam_science 2 페이지 의도된 정정**. PR #551 의 Stage 3 보고 (168/170 byte-identical) 와 일치.

### 3.3 WASM 빌드

| 산출물 | 크기 |
|--------|------|
| `pkg/rhwp_bg.wasm` | 4,441,878 bytes (Task #546 시점 4,442,504 -626 — layout.rs -55 LOC 반영) |
| `pkg/rhwp.js` | 변동 없음 |
| `rhwp-studio/public/rhwp_bg.wasm` | ✅ 동기화 |
| `rhwp-studio/public/rhwp.js` | ✅ 동기화 |

### 3.4 시각 판정 (작업지시자)

작업지시자 인용:
> #525 에서 해결하고자 한 문제 해결된 것을 시각 판정 통과했습니다.

→ Task #525 의 본질 (호스트 paragraph 텍스트 중복 emit) 정정 효과 시각 확인 완료.

## 4. Task #525 의 본질

### 4.1 결함

`samples/exam_science.hwp` p2 8번 문제 (pi=37) 인라인 화학식 글자 겹침 1.3~9px 다중 중첩. 광범위 fixture (7 샘플 170 페이지 중 37 페이지 / 205 dup-instances) 에서 동일 본질의 시각 결함.

### 4.2 근본 원인

`layout_wrap_around_paras` 가 비-TAC Picture wrap=Square host 의 호스트 paragraph 자기 텍스트를 PageItem::FullParagraph 정상 경로 외에 두 곳에서 추가 emit:

- `layout.rs:3093-3119` (`layout_shape_item` 의 PageItem::Shape 처리)
- `layout.rs:3496-3550` (`layout_column_shapes_pass` 의 컬럼 레벨 패스)

→ 동일 paragraph 가 `layout_composed_paragraph` 를 3 회 호출 받아 dup 발생. 같은 줄을 다른 col_w 정렬로 distinct x 위치 emit → 시각 중첩.

Table Square wrap (호스트 = 표 + 빈 텍스트) 에서는 의도된 동작이지만 Picture Square wrap (호스트 = 본문 텍스트) 에서는 정상 PageItem 경로 (paragraph_layout.rs:822/973 `has_picture_shape_square_wrap` 분기) 와 중복 emit.

### 4.3 정정

```rust
// layout.rs:3093 (layout_shape_item) — Picture Square wrap 분기 제거
// 제거된 영역:
// if !pic.common.treat_as_char
//     && matches!(pic.common.text_wrap, TextWrap::Square) {
//     self.layout_wrap_around_paras(/* wrap-around 처리 */);  // 중복 emit
// }

// layout.rs:3496 (layout_column_shapes_pass) — 동일 본질의 두번째 호출 제거
```

근거 주석:
> Picture Square wrap 의 호스트 paragraph 텍스트는 정상 PageItem::FullParagraph 경로 (`layout_composed_paragraph` 의 `has_picture_shape_square_wrap` 분기, paragraph_layout.rs:822/973) 가 LINE_SEG.cs/sw 기반으로 그림 옆 (좁은) + 그림 아래 (넓은) 모두 처리. Table Square wrap (호스트 = 표 + 빈 텍스트) 과 달리 Picture Square wrap 의 호스트는 본문 텍스트를 가지므로 본 wrap host 호출은 중복 emit. 정정으로 호출 제거. (Table 케이스의 layout.rs:2555 호출은 유지.)

### 4.4 영향 범위

PR #551 Stage 3 보고 + 본 환경 검증:
- 7 샘플 170 페이지 중 168 byte-identical
- exam_science 2 페이지 의도된 정정 (회귀 시 dup 35 → 0)
- pi=37 (보고된 케이스): ls[0..7] 모든 줄 dup 0

## 5. Task #546 와의 양립성

본 환경의 Task #546 (typeset.rs `wrap_around_pic_bottom_px` 의 `82e41ba` revert) 와 Task #525 (layout.rs `layout_wrap_around_paras` 중복 호출 제거) 는 **다른 영역의 다른 본질**:

| 항목 | Task #546 (본 환경) | Task #525 (PR #551) |
|------|--------------------|---------------------|
| 결함 본질 | 단의 높이 (current_height) 계산 | 호스트 텍스트 중복 emit |
| 정정 영역 | typeset.rs (-36) + layout.rs (-58) | layout.rs (+14 / -69) |
| 영향 결함 | 페이지네이션 (페이지 분리) | 시각 중첩 (dup x 위치 emit) |

두 정정이 **양립하여 함께 작동**. cherry-pick 시뮬레이션 + 검증 결과 충돌 0.

## 6. 컨트리뷰터 정합

### 6.1 정합 사항

@planet6897 의 Task #525 진단 + 정정:
- Task #525 의 root cause 정확 식별 (작업지시자도 인지하고 있던 결함)
- 광범위 fixture 검증 + dup-instances 통계 (7 샘플 170 페이지)
- 코드 감소 net -55 LOC (중복 영역 제거로 코드 단순화)
- 단계별 분리 정합 (수행 → Stage 1 진단 → 구현 계획서 → Stage 2 정정 → Stage 3 회귀 검증 → Stage 4 최종 보고서)

### 6.2 비정합 사항 — fork devel 누적 (PR #538 안내 미적용)

PR #551 의 base/head 가 모두 `devel` 이라 **fork 의 devel 전체 누적분 (248 commits / 50+ task)** 이 PR 에 모두 포함됨. PR #538 close 시 안내한 "다음 PR 전 fork devel 동기화" 가 미적용 상태로 다시 PR 제출.

또한 PR 본문의 "main v0.7.3" 표현 — 잘못된 정보 (현재 main 은 v0.7.9 `0fb3e675`). fork 환경 정합 점검 필요.

→ 본 PR close 댓글에 안내 재요청.

## 7. PR #551 의 다른 영역 (제외)

본 PR cherry-pick 범위 외 (242 commits / ~50 task) — 별도 처리 결정 사항:

- Task #517 ~ #523 (Layout 리팩터링 Phase 0~2)
- Task #524 (Square wrap 그림 anchor 위치) — Task #525 와 인접 영역, 별도 검토 후보
- Task #528 (옛한글 PUA → KS X 1026-1 자모 변환)
- Task #435 / #439 / #445 / #452 / #455 / #459 / #462 / #463 ~ #492 / #495 / #496 / #500 / #547 / #548 등 다수 Layout/렌더링 fix
- Task #549 (분석만, source 변경 0)
- Task #550 (close 정리)

→ 컨트리뷰터에게 다음 PR 분리 요청 안내.

## 8. 머지 절차

### 8.1 cherry-pick + 충돌 해소

```bash
git checkout local/devel
git stash push -u -m "PR #551 review docs" mydocs/pr/pr_551_review.md
git cherry-pick d24a896 ba680bc 68f109b 35c6c00 78af341
git cherry-pick ec9fe47
# 충돌: mydocs/orders/20260503.md → 양쪽 일지 통합 + continue
git stash pop
```

### 8.2 검증 + WASM 빌드

(위 §3 결과)

### 8.3 commit + devel 머지 + push

```bash
git add mydocs/pr/pr_551_review.md mydocs/pr/pr_551_report.md
git commit -m "PR #551 처리 보고서 + 검토 문서 (Task #525 cherry-pick @planet6897 6 commits)"

git checkout devel
git merge local/devel --no-ff -m "..."
git push origin devel
```

### 8.4 PR close + 컨트리뷰터 안내

```bash
gh pr close 551 --repo edwardkim/rhwp --comment "..."
```

**컨트리뷰터 안내 핵심**:
- Task #525 본질 정정만 cherry-pick (242 commits 제외)
- 다음 PR 전 fork devel 동기화 부탁 (`git pull --ff-only origin devel`)
- task 별 분리 PR 권장

## 9. 사후 처리

- [ ] PR #551 close (수동, cherry-pick 머지로 GitHub 자동 close 미동작)
- [ ] Task #525 GitHub Issue 점검 — 등록되어 있으면 close, 없으면 사후 등록 후 close
- [ ] README 기여자 목록 (@planet6897 PR #551 누적, 본 사이클 일괄)
- [ ] 컨트리뷰터 안내 댓글 (PR close 시) — fork devel 동기화 + task 별 분리 PR 안내

## 10. 메모리 정합

- ✅ `feedback_check_open_prs_first` — 본 PR 처리 정합
- ✅ `feedback_pr_comment_tone` — close 댓글 차분/사실 중심 + 컨트리뷰터 안내 (재요청 톤)
- ✅ `feedback_release_sync_check` — cherry-pick 시점 main 동기화 점검 (`0fb3e675` 정합)
- ✅ `feedback_v076_regression_origin` — 작업지시자 직접 시각 판정 통과
- ✅ `feedback_visual_regression_grows` — 광범위 fixture sweep + 시각 판정 게이트
- ✅ `feedback_pdf_not_authoritative` / `reference_authoritative_hancom` — 한컴 2010/2020 직접 판정 (시각 판정 통과)
- ✅ `feedback_image_renderer_paths_separate` — 본 정정은 layout 단계, renderer 분기 영향 없음
- ✅ `feedback_hancom_compat_specific_over_general` — case-specific 정정 (Picture wrap=Square 한정)
