# PR #561 검토 보고서

**PR**: [#561 Task #548: 셀 inline TAC Shape margin + indent 정정 (closes #548)](https://github.com/edwardkim/rhwp/pull/561)
**작성자**: @planet6897 (PR 등록) / Jaeook Ryu = @jangster77 (commit author 일부)
**상태**: OPEN, mergeable=CONFLICTING (PR base 시점 차이, 실제 본질 cherry-pick 충돌 0)
**관련 PR**: PR #560 (Task #544, CLOSED — 본 PR 의 stacked dependency)
**관련 PR (이미 처리)**: PR #551, PR #562 — Task #544 본질 영역 처리 완료 (devel 에 `a30dca7` + `19119c2`)
**처리 결정**: ⏳ **검토 중** (1차 검토)
**검토 시작일**: 2026-05-05

## 1. 검토 핵심 질문

본 PR 의 처리 결정을 위해 검증해야 할 질문:
1. **PR base skew vs 본질 cherry-pick** — PR 표시는 CONFLICTING 이지만 본 환경 devel 에 본질 commit 만 cherry-pick 시 실제로 충돌이 발생하는가?
2. **test_548 본 환경 상태** — 본 환경 devel 에 `test_548` 이 이미 RED 상태로 있고 fix 만 적용하면 GREEN 으로 전환되는가?
3. **stacked PR 의 본질** — PR #560 은 이미 close 됐고 본 환경에 cherry-pick 완료. 본 PR 의 고유 본질만 분리 가능한가?

## 2. PR 정보

| 항목 | 값 | 평가 |
|------|-----|------|
| 제목 | Task #548: 셀 inline TAC Shape margin + indent 정정 | 정합 |
| author | @planet6897 (PR 등록) | — |
| commit author | Jaeook Ryu (= @jangster77, 본질 commit `3de05051` + fixup `a0dad0d3`) | 컨트리뷰터간 cherry-pick 결과 |
| 본질 출처 | @planet6897 fork `9dc40ddb` (Task #544 v2 Stage 3 — Phase C #548) → @jangster77 핀셋 cherry-pick (`3de05051`) | 본질 출처 명확 |
| changedFiles | 10 / +1,213 / -29 | 표시 |
| mergeable | CONFLICTING | PR base 시점 차이 (실제 본질은 깨끗) |
| 제목 정합 | closes #548 | ✅ |

## 3. PR 의 9 commits 분석 (cherry-pick 대상 식별)

| commit | 설명 | 본 환경 처리 |
|--------|------|-------------|
| `457d5f33` Task #544 v2 Stage 2 — Phase A 재적용 | 본 환경 devel `a30dca7` 와 동일 본질 | **이미 적용** (PR #560 cherry-pick) |
| `b146b83e` PR #551 Task #544 핀셋 처리 보고서 (사전 작업) | 컨트리뷰터 fork 의 보고서 | 본 환경 무관 (이미 별도 처리 완료) |
| `f6039f32` Merge local/devel: PR #551 (사전 작업) | merge | 무관 |
| `f807378a` PR #551 Task #544 후속 archives | 컨트리뷰터 fork 의 archives | 무관 |
| **`3de05051` Task #548 본질** | `effective_margin_left_line` 헬퍼 + table_layout.rs +79 | ⭐ **cherry-pick 대상** |
| **`a0dad0d3` Task #548 fixup** | y 범위 [685,690] → [690,710] | ⭐ **cherry-pick 대상** |
| `4ef1b79c` Task #548 핀셋 처리 보고서 | 컨트리뷰터 fork 의 보고서 | 본 환경 미사용 |
| `77b48c7b` Merge local/task548 | 컨트리뷰터 fork 의 merge | 무관 |
| `55f8c633` Task #548 처리 후속: archives 이동 | 컨트리뷰터 fork 의 archives | 무관 |

→ **본질 cherry-pick 대상**: 2 commits (`3de05051` + `a0dad0d3`).
→ 컨트리뷰터의 처리 보고서/archives 는 컨트리뷰터 fork 내부 정합용 — 본 환경의 처리 보고서는 메인테이너가 별도 작성.

## 4. 본질 변경 영역

### 4.1 `effective_margin_left_line` 헬퍼 (table_layout.rs +79)

`paragraph_layout` 의 line_indent 산식과 동일 단일 룰:
- positive indent: line 0 에 +indent (첫줄 들여쓰기)
- negative indent (hanging): line N≥1 에 +|indent|
- indent=0: 모든 line 에 margin_left 만 적용

3 분기에 `line_margin` 가산:
1. paragraph 시작 (line 0)
2. Picture target_line reset (Task #500 정합)
3. Shape target_line reset (Task #500 + #520 정합)

### 4.2 ParaShape → para_margin_left_px / para_indent_px 추출

본 셀 5 line 0 [푸코] inline rect 케이스:
- ps_id=19: margin_left=1704 HU → 11.36 px, indent=+1980 HU → +13.20 px
- 기대 위치: cell_x (131.04) + 11.36 + 13.20 = **155.60 px** ✓ (PDF 한컴 2010 ≈155.6)
- 수정 전: inline_x = inner_area.x = 131.04 (margin/indent 미적용)
- 수정 후: inline_x = inner_area.x + line_margin = 155.60 ✓

### 4.3 `test_548` 의 위치 (본 환경 기존)

- 본 환경 `src/renderer/layout/integration_tests.rs:999~1066` 에 `test_548_cell_inline_shape_first_line_indent_p8` 가 **이미 RED + #[ignore] 상태로 존재**
- 출처: `a30dca7` (PR #560 = Task #544 v2 Stage 2 cherry-pick) — stacked dependency 의 본질
- PR #561 의 `3de05051` 본질이 정확히 이 ignore 를 제거 + table_layout.rs 변경으로 RED → GREEN 전환

## 5. 본 환경 직접 검증 (임시 브랜치 cherry-pick test)

`pr561-cherry-test` 임시 브랜치에서 `3de05051` + `a0dad0d3` 만 cherry-pick 시도:

| 단계 | 결과 |
|------|------|
| `3de05051` cherry-pick (no-commit) | ✅ Auto-merging src/renderer/layout/table_layout.rs (충돌 0) |
| `a0dad0d3` cherry-pick (no-commit) | ✅ 깨끗하게 적용 (test fixup) |
| working tree status | `A mydocs/working/task_m100_544_v2_stage3.md / M integration_tests.rs / M table_layout.rs` |
| `test_548` y 범위 | `[685, 690]` → `[690, 710]` 정합 ✅ |
| `cargo test --lib --release test_548` | ✅ **GREEN** (RED → GREEN 전환 확인) |

→ **CONFLICTING 표시는 PR base 시점 차이 때문이고, 본질 commit 자체는 본 환경 devel 에 깨끗하게 적용 가능**.

## 6. PR 본문의 자기 검증 결과

| 검증 | PR 본문 결과 | 본 환경 재검증 권장 |
|------|---------|----------|
| `cargo test --lib --release` | 1121 passed / 0 failed / 2 ignored / +1 GREEN (test_548) | ⏳ |
| `cargo clippy --release --lib` | 신규 결함 0건 | ⏳ |
| 페이지 8 셀 5 line 0 [푸코] x | 131.04 → 155.60 (PDF 155.6 ±0.0) | ⏳ |
| 광범위 회귀 sweep (6 샘플 73 페이지) | 13 differ (의도된 셀 안 inline TAC Shape margin/indent), 회귀 검출 가능 영역 0 변경 | ⏳ |
| 작업지시자 시각 판정 | "통과" 명시 (PR 본문) | ⚠️ 본 검토 시점 재검증 — PR 본문 통과는 PR #551 영역 시점 |
| WASM 빌드 | (Docker 환경, 별도) | ⏳ |

→ PR 본문의 "작업지시자 시각 판정 통과" 는 **본 PR 시점이 아닌 PR #551 영역 시점의 통과** 가 PR 의 fork 흐름에 누적된 것으로 추정. 본 환경 devel 에 cherry-pick 후 시각 판정 별도 진행 필요.

## 7. 메인테이너 정합성 평가

### 정합 영역
- ✅ **본질 cherry-pick 깨끗 적용** — `3de05051` + `a0dad0d3` 충돌 0
- ✅ **test_548 RED → GREEN 전환** — 결정적 검증으로 fix 정합 확인
- ✅ **단일 룰 (`effective_margin_left_line`)** — `feedback_rule_not_heuristic` 정합. paragraph_layout 산식과 동일
- ✅ **stacked dependency 정합** — PR #560 (이미 close + 본 환경 적용 완료) 의 잔존 영역 (Task #548 ignore test) 을 정확히 보충
- ✅ **Task #500 / Task #520 정합 명시** — 3 분기 (paragraph 시작, Picture reset, Shape reset) 의 본질 명시
- ✅ **PR 본문의 측정 자료** — x=131.04 → 155.60 (PDF 155.6) 정량적 검증

### 우려 영역
- ⚠️ **CONFLICTING 표시** — 본질 cherry-pick 자체는 깨끗하지만 GitHub UI 에서 보이는 mergeable=CONFLICTING 은 컨트리뷰터에게 혼란 가능. 처리 시 핀셋 cherry-pick 방식 명시 필요
- ⚠️ **stacked PR 패턴** — PR #560 위에 stack. PR #560 이 이미 close 됐고 본 환경 devel 에 본질 적용 완료이므로 본 PR 만 단독 처리 가능. 그러나 PR 패턴 자체는 메모리 룰 `feedback_per_task_pr_branch` (각 Task 별 별도 PR 브랜치) 정합 — 본 PR 은 Task #548 단일 본질
- ⚠️ **시각 판정 게이트** — PR 본문의 "작업지시자 시각 판정 통과" 는 PR #551 시점일 가능성. 본 환경 cherry-pick 후 작업지시자 직접 SVG 시각 판정 권장
- ⚠️ **fixup commit (`a0dad0d3`)** — 본 devel 의 Task #479 미적용 모델 정합. y 범위 조정의 본질을 fixup 으로 분리 — 정합한 패턴

## 8. 1차 검토 결론

### 정합 평가
- ✅ **본질 cherry-pick 가능** — 2 commits (`3de05051` + `a0dad0d3`) 충돌 0
- ✅ **결정적 검증** — `test_548` GREEN 전환 확인
- ✅ **단일 룰 + Task 정합 명시** — 회귀 위험 영역 좁힘
- ⚠️ **시각 판정 별도 진행 필요** — PR 본문 통과 표시는 다른 시점 가능성

### 권장 처리 방향 (작업지시자 결정 대기)

#### 옵션 A — 핀셋 cherry-pick (권장)
- `3de05051` + `a0dad0d3` 만 cherry-pick (컨트리뷰터의 처리 보고서/archives commits 제외)
- 본 환경 결정적 검증 (cargo test --lib + 광범위 회귀 sweep + clippy + WASM)
- 작업지시자 시각 판정 (★ 게이트) — 페이지 8 셀 5 line 0 [푸코] rect + 회귀 sweep 13 페이지
- 통과 시 devel merge + push + PR close 처리

#### 옵션 B — 추가 정정 요청
- 시각 판정에서 잔존 결함 발견 시 컨트리뷰터에게 추가 정정 요청

#### 옵션 C — close + 본 환경 직접 처리
- 시각 판정 다수 결함 발견 시 본 환경에서 직접 처리

→ **작업지시자 결정 대기**. 옵션 A 권장 — 본질 cherry-pick 깨끗 + test_548 RED → GREEN 결정적 검증 통과 + 단일 룰 정합.

## 9. 옵션 A 진행 결과 (작업지시자 승인 후)

### 9.1 핀셋 cherry-pick

| 단계 | 결과 |
|------|------|
| 본질 commits cherry-pick (`3de05051` + `a0dad0d3`) | ✅ 충돌 0, author Jaeook Ryu 보존 |
| local/devel cherry-pick commits | `bee0c77` + `309cfbf` |

### 9.2 결정적 검증 (모두 통과)

| 검증 | 결과 |
|------|------|
| `cargo test --lib --release` | ✅ **1130 passed** / 0 failed / 2 ignored (test_548 RED → GREEN) |
| `cargo clippy --release --lib` | ✅ 0건 |
| `cargo test --test issue_546` | ✅ 1 passed (Task #546 회귀 0) |
| `cargo test --test issue_554` | ✅ 12 passed |
| `cargo test --test svg_snapshot` | ✅ 6/6 passed |
| `cargo build --release` | ✅ Finished (28.20s) |
| Docker WASM 빌드 | ✅ **4,570,220 bytes** (1m 25s, PR #589 baseline +447 bytes — table_layout.rs +79 LOC 정합) |

### 9.3 광범위 회귀 sweep

| Fixture | 페이지 수 | byte 차이 |
|---------|---------|---------|
| 21_언어_기출_편집가능본 | 15 | **1** (page 8 — PR 본문 권위 영역) ✅ |
| exam_kor | 20 | 7 (page 3, 5, 7, 9, 11, 15, 19) |
| exam_science | 4 | 2 |
| **합계** | **39** | **10** |

→ PR 본문 명시 "6 샘플 73 페이지 13 differ" 와 근접 (본 환경 3 샘플 39 페이지 10 differ). 권위 영역 (page 8) 정합 + 회귀 검출 가능 영역 (paragraph 텍스트 위치, 일반 shape 위치) 변경 검증 필요.

### 9.4 다음 단계

1. ✅ 본 1차 검토 보고서 작성 (현재 문서)
2. ✅ 본 환경 결정적 재검증
3. ✅ SVG 생성 — `output/svg/pr561_before/` + `output/svg/pr561_after/`
4. ✅ Docker WASM 빌드 완료
5. ⏳ **작업지시자 시각 판정** (★ 게이트) — 본 단계 대기 중
6. ⏳ 통과 시 devel merge + push + PR close
7. ⏳ 처리 보고서 (`pr_561_report.md`) 작성 + archives 이동

## 10. 메모리 정합

- ✅ `feedback_visual_regression_grows` — 시각 판정 게이트 정합 운영
- ✅ `feedback_v076_regression_origin` — 작업지시자 직접 시각 판정 게이트
- ✅ `feedback_hancom_compat_specific_over_general` — 단일 룰 (effective_margin_left_line) 의 명시 가드
- ✅ `feedback_pdf_not_authoritative` — 본 PR 의 PDF 측정값은 참고 (155.6) 이지만 권위는 작업지시자 한컴 환경
- ✅ `feedback_rule_not_heuristic` — 본 PR 의 단일 룰 접근 정합
- ✅ `feedback_per_task_pr_branch` — Task #548 단일 본질 PR (정합)
- ✅ `feedback_no_pr_accumulation` — PR #551 잔존 누적 회피 (PR 본문 명시)
- ✅ `feedback_pr_comment_tone` — 본 검토 톤 차분/사실 중심
- ✅ `feedback_check_open_prs_first` — 본 PR OPEN 상태 확인 후 진행

---

**검토자**: 클로드 (페어 프로그래밍 파트너)
**1차 검토 단계 — 작업지시자 승인 대기**.
