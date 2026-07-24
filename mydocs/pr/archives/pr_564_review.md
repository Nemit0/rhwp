# PR #564 검토 보고서

**PR**: [#564 Task #521: TAC 표 outer_margin_bottom 누락 정정](https://github.com/edwardkim/rhwp/pull/564)
**작성자**: @planet6897 (PR 등록) / Jaeook Ryu = @jangster77 (commit author)
**상태**: OPEN, mergeable=CONFLICTING (PR base 시점 차이 + stacked 구조)
**관련 PR**: PR #560 (Task #544, CLOSED — stacked dependency, 본 환경 적용 완료)
**처리 결정**: ⏳ **검토 중** (1차 검토)
**검토 시작일**: 2026-05-05

## 1. 검토 핵심 질문

1. **본질 결함 식별 정합성** — `layout_table_item` TAC after-spacing 분기 의 `outer_margin_bottom` 미적용이 본 환경에서도 -8 px shortfall 로 재현되는가?
2. **단일 룰 정합** — `layout_partial_table_item` (라인 2638-2647) 의 산식과 일치시키는 단일 룰이 회귀 영역을 만들지 않는가?
3. **stacked PR 핀셋** — PR #560 commits 가 ancestor 에 있지만 PR #561/#567 와 같이 본질 단독 cherry-pick 가능한가?

## 2. PR 정보

| 항목 | 값 | 평가 |
|------|-----|------|
| 제목 | Task #521 TAC 표 outer_margin_bottom 누락 정정 | 정합 |
| author (PR 등록) | @planet6897 | — |
| commit author | Jaeook Ryu (= @jangster77) | 컨트리뷰터간 협업 흐름 (PR #561/#567 패턴 동일) |
| changedFiles | 12 / +1,624 / -27 | 본질 코드 +91 LOC (layout +11 + integration_tests +80) + 문서 다수 |
| 본질 변경 | `src/renderer/layout.rs` +11/-1, `src/renderer/layout/integration_tests.rs` +80 | 단일 commit 본질 |
| mergeable | CONFLICTING | PR base 시점 차이 + stacked 구조 |
| Issue | closes #521 | ✅ |

## 3. PR 의 7 commits 분석

| commit | 설명 | 본 환경 처리 |
|--------|------|-------------|
| `457d5f33` Task #544 v2 Stage 2 (Phase A 재적용) | PR #560 본질 | 이미 적용 (devel `a30dca7`) |
| `b146b83e` PR #551 Task #544 핀셋 처리 보고서 | 컨트리뷰터 fork 보고서 | 무관 |
| `f6039f32` Merge local/devel: PR #551 핀셋 cherry-pick | merge | 무관 |
| `f807378a` PR #551 Task #544 후속 archives | 컨트리뷰터 fork archives | 무관 |
| **`04eefd99` Task #521 Stage 3-4 본질** | layout.rs +11 + integration_tests.rs +80 + plans/working 4개 | ⭐ **cherry-pick 대상** |
| `fa31829a` Task #521 Stage 5 최종 보고서 | 컨트리뷰터 fork report + orders | 무관 (orders 충돌 위험) |
| `a0eb2fe8` Task #521 처리 후속 PR #564 등록 반영 | 컨트리뷰터 fork orders | 무관 |

→ **본질 cherry-pick 대상 = `04eefd99` 단독**. PR #561/#567 와 동일한 stacked 패턴 (PR #560 위) + 단일 본질 commit.

## 4. 본질 변경 영역

### 4.1 결함 가설

PR 본문:
> `src/renderer/layout.rs::layout_table_item` TAC after-spacing 분기 (라인 2497 직후) 가 `outer_margin_bottom` 미적용. `layout_partial_table_item` (라인 2638-2647) 와 정합시키는 단일 룰 적용.

**한컴 명세 인용:**
> `lh = cell_h + outer_margin_bottom` (exam_eng pi=104 lh=22207 = cell_h(21607) + outer_margin_bottom(600))

`cell_h` 만 advance 하면 다음 paragraph 가 -8 px shortfall (exam_eng p2 18번 ① 위치 PDF 한컴 2010 대비).

### 4.2 단일 룰 정합

| 분기 | 기존 산식 | 정정 후 |
|------|---------|--------|
| `layout_partial_table_item` (라인 2638-2647) | `lh = cell_h + outer_margin_bottom` (한컴 명세 정합) | 변경 없음 |
| `layout_table_item` TAC after-spacing (라인 2497) | `cell_h` 만 advance ❌ | `cell_h + outer_margin_bottom` 정합 |

→ 두 분기를 동일 산식으로 통일 (단일 룰 — `feedback_rule_not_heuristic` 정합).

### 4.3 회귀 테스트 추가 (`test_521_tac_table_outer_margin_bottom_p2`)

- exam_eng p2 18번 ① 위치 측정: **543.95 → 551.95** (+8 px)
- 후속 두 ① 동일 +8 px 일관 시프트 검증 (PR 본문 명시)

## 5. 본 환경 직접 검증 (임시 브랜치 cherry-pick test)

`pr564-cherry-test` 임시 브랜치에서 `04eefd99` 단독 cherry-pick:

| 단계 | 결과 |
|------|------|
| `04eefd99` cherry-pick (no-commit) | ✅ Auto-merging src/renderer/layout.rs + integration_tests.rs (충돌 0) |
| working tree | layout.rs/integration_tests.rs M + plans/working 보고서 4개 A |
| `cargo test --lib --release test_521` | ✅ **GREEN** (RED → GREEN 전환) |
| `cargo test --lib --release` | ✅ **1131 passed** / 0 failed / 2 ignored (이전 baseline 1130 +1) |

→ **CONFLICTING 표시는 stacked 구조 + PR base 시점 차이 때문**. 본질 commit (`04eefd99`) 단독 cherry-pick 시 본 환경 devel 에 깨끗하게 적용 가능.

## 6. PR 본문의 자기 검증 결과

| 검증 | PR 본문 결과 | 본 환경 재검증 (임시) |
|------|---------|----------|
| `cargo test --lib --release` | 1121 passed (PR fork baseline 1120 → +1) | ✅ 1131 passed (본 환경 baseline 1130 → +1 정합) |
| `cargo clippy --release --lib` | 신규 결함 0 | ⏳ 본격 검증에서 확인 |
| 광범위 sweep (13 fixture 481 페이지) | 278 differ / 203 byte-identical / **text count 변동 0** | ⏳ 본 환경 sweep 권장 |
| exam_eng p2 18번 ① | 543.95 → 551.95 (+8 px PDF 정합) | ⏳ 본격 검증 + 시각 판정 |
| 회귀 가드 (test_544/547/469) | GREEN 유지 | ⏳ 본격 검증에서 확인 |
| 시각 판정 | (PR 본문 미명시) | ⏳ 작업지시자 시각 판정 게이트 |

## 7. 메인테이너 정합성 평가

### 정합 영역
- ✅ **본질 cherry-pick 깨끗** — 충돌 0 (auto-merge)
- ✅ **결정적 검증 정합** — cargo test --lib 1131 passed (test_521 RED → GREEN)
- ✅ **단일 룰 (`layout_partial_table_item` 산식과 일치)** — `feedback_rule_not_heuristic` 정합
- ✅ **한컴 명세 정합 명시** — `lh = cell_h + outer_margin_bottom` (exam_eng pi=104 lh=22207 = 21607+600)
- ✅ **광범위 회귀 sweep (PR 본문)** — 13 fixture 481 페이지 / **text count 변동 0** (모든 차이는 의도된 outer_margin_bottom 시프트)
- ✅ **회귀 가드** — `test_544` / `test_547` / `test_469` GREEN 유지 (PR #560/#561 본질 영역과 회귀 없음)
- ✅ **하이퍼-워터폴 흐름** — Stage 1 진단 → Stage 2 구현 계획 → Stage 3-4 본질 정정 → Stage 5 보고서. 본 환경 워크플로우 정합
- ✅ **단일 파일 본질 (코드)** — `src/renderer/layout.rs` +11/-1 의 작은 정정 + `integration_tests.rs` +80 (회귀 테스트)

### 우려 영역
- ⚠️ **CONFLICTING 표시** — stacked 구조 + PR base 시점 차이로 추정. 본질 단독 cherry-pick 가능 확인됨
- ⚠️ **광범위 sweep 의 278 differ** — PR 본문 측정으로는 "모든 차이 의도된 시프트, text count 변동 0" 이지만 본 환경 sweep + 시각 판정 게이트 권장
- ⚠️ **작업지시자 시각 판정 게이트** — PR 본문에 시각 판정 결과 미명시. 본 환경 cherry-pick 후 작업지시자 직접 SVG 시각 판정 필수
- ⚠️ **outer_margin_bottom 누적 효과** — 표 다음 paragraph y 위치가 +8 px (exam_eng p2 18번 ①) — 페이지 내 다른 표 후속 영역도 동일 +8 px 시프트 가능. 회귀 위험 영역 (페이지 break, 페이지 수) 본격 검증 필요

## 8. 1차 검토 결론

### 정합 평가
- ✅ **본질 cherry-pick 가능** — `04eefd99` 단독 충돌 0
- ✅ **결정적 검증** — 1131 passed (test_521 GREEN 전환) / clippy 0 / build --release
- ✅ **단일 룰 정합** — `layout_partial_table_item` 와 동일 산식
- ✅ **한컴 명세 정합** — `lh = cell_h + outer_margin_bottom` 인용 + 정량 측정
- ⏳ **시각 판정 별도 진행 필요** — PR 본문 미명시 영역
- ⏳ **광범위 sweep 회귀 영역 본격 검증 필요** — 278 differ 의 의도성 확인

### 권장 처리 방향 (작업지시자 결정 대기)

#### 옵션 A — 핀셋 cherry-pick (권장)
- `04eefd99` 단독 cherry-pick (Stage 5 보고서 / PR 등록 orders 갱신은 컨트리뷰터 fork 정합 — 본 환경 자체 처리 보고서)
- 본 환경 결정적 재검증 + 광범위 sweep + WASM
- 작업지시자 시각 판정 (★ 게이트) — exam_eng p2 18번 ① +8 px 정합 + 회귀 sweep 영역
- 통과 시 devel merge + push + PR close 처리

#### 옵션 B — 추가 정정 요청
- 시각 판정에서 잔존 결함 발견 시 컨트리뷰터에게 추가 정정 요청

#### 옵션 C — close + 본 환경 직접 처리
- 시각 판정 다수 결함 발견 시 본 환경에서 직접 처리

→ **작업지시자 결정 대기**. 옵션 A 권장 — 본질 cherry-pick 깨끗 + 결정적 검증 통과 + 단일 룰 + 한컴 명세 정합.

## 9. 옵션 A 진행 결과 (작업지시자 승인 후)

### 9.1 핀셋 cherry-pick

| 단계 | 결과 |
|------|------|
| 본질 commit cherry-pick (`04eefd99`) | ✅ 충돌 0, author Jaeook Ryu 보존 |
| local/devel cherry-pick commit | `fc16acc` |

### 9.2 결정적 검증 (모두 통과)

| 검증 | 결과 |
|------|------|
| `cargo test --lib --release` | ✅ **1131 passed** / 0 failed / 2 ignored (test_521 RED → GREEN) |
| `cargo test --test svg_snapshot` | ✅ 6/6 passed |
| `cargo test --test issue_546` | ✅ 1 passed (Task #546 회귀 0) |
| `cargo test --test issue_554` | ✅ 12 passed |
| `cargo clippy --release --lib` | ✅ 0건 |
| `cargo build --release` | ✅ Finished |
| Docker WASM 빌드 | ✅ **4,570,615 bytes** (1m 34s, PR #567 baseline +151 bytes — layout.rs +11 LOC 정합) |

### 9.3 광범위 페이지네이션 sweep (페이지 수 회귀 자동 검출)

작업지시자 안내:
> 이번 PR 은 광범위한 페이지네이션 변화가 발생하는지 검증을 해야 합니다.
> 메인테이너가 시각 검증 하는 동안 페이지 수변화 회귀테스트를 해주세요.

본 환경 `samples/` 폴더 **전체 164 fixture (158 hwp + 6 hwpx)** 자동 sweep — devel 기준 페이지 수 vs cherry-pick 후 페이지 수 비교:

| 통계 | 결과 |
|---|---|
| 총 fixture | **164** (158 hwp + 6 hwpx) |
| 총 페이지 (devel baseline) | **1,614** |
| 총 페이지 (cherry-pick 후) | **1,614** |
| **fixture 별 페이지 수 차이** | **0** |
| Export 실패 fixture | 0 |
| 측정 도구 | `./target/release/rhwp export-svg` (60s timeout / fixture) |

→ **164 fixture / 1,614 페이지 / 페이지 수 회귀 0** 확인. PR 본문 "278 differ / text count 변동 0" 안전성 패턴이 본 환경 광범위 sweep 으로 정량 입증.

**검증 결과 해석**:
- TAC 표 outer_margin_bottom 가산 (+8 px / 표) 이 페이지 break 를 트리거하는 케이스 없음
- `feedback_visual_regression_grows` 정합 — 페이지 수 byte 비교만으로 시각 결함 검출 한계 인정 + 메인테이너 시각 판정 필수
- 페이지 내 시프트 영역 (paragraph y +8 px 누적 효과) 은 본 자동 sweep 미검출 → 메인테이너 직접 다양한 hwp 시각 검증으로 보완

→ 메인테이너 직접 다양한 hwp 문서 시각 검증 단계로 진행 가능 — 페이지 수 회귀는 자동 sweep 으로 0 확인됨.

### 9.4 다음 단계

1. ✅ 본 1차 검토 보고서 작성 (현재 문서)
2. ✅ 본 환경 결정적 재검증
3. ✅ Docker WASM 빌드 완료 (메인테이너 직접 검증용 `pkg/rhwp_bg.wasm` 4,570,615 bytes)
4. ✅ 광범위 페이지네이션 sweep — **164 fixture / 1,614 페이지 / 페이지 수 회귀 0** (전체 samples/ 폴더)
5. ⏳ **메인테이너 직접 다양한 hwp 문서 시각 검증** (★ 게이트, WASM 기반) — 본 단계 대기 중
6. ⏳ 통과 시 devel merge + push + PR close
7. ⏳ 처리 보고서 (`pr_564_report.md`) 작성 + archives 이동

## 10. 메모리 정합

- ✅ `feedback_visual_regression_grows` — 시각 판정 게이트 정합 운영
- ✅ `feedback_v076_regression_origin` — 정량 측정 (543.95 → 551.95) 으로 결함 origin 식별
- ✅ `feedback_rule_not_heuristic` — 단일 룰 (`layout_partial_table_item` 산식과 일치)
- ✅ `feedback_pdf_not_authoritative` — 본 PR 의 PDF 정합 (한컴 2010 측정) 은 참고이지만 권위는 작업지시자 한컴 환경
- ✅ `feedback_per_task_pr_branch` — Task #521 단일 본질 PR 정합
- ✅ `feedback_pr_comment_tone` — 본 검토 톤 차분/사실 중심
- ✅ `feedback_check_open_prs_first` — 본 PR OPEN 상태 확인 후 진행
- ✅ `feedback_small_batch_release_strategy` — 본 사이클 (5/1 ~ 5/5) 누적 14번째 PR

---

**검토자**: 클로드 (페어 프로그래밍 파트너)
**1차 검토 단계 — 작업지시자 승인 대기**.
