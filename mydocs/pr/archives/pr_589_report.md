# PR #589 처리 보고서 — cherry-pick 머지 + 시각 판정 ★ 통과

**PR**: [#589 Task #511 v2 + #554: HWP3 Square wrap 보완6+8 (페이지네이션 안전) + 변환본 식별 휴리스틱](https://github.com/edwardkim/rhwp/pull/589)
**작성자**: @jangster77 (Taesup Jang)
**관련 이전 PR**: #553 (close, rollback) / #556 (Task #554 단독, 본 PR 통합되어 close)
**처리 결정**: ✅ **cherry-pick 머지 + push + PR close**
**처리일**: 2026-05-05

## 1. 처리 결과 요약

| 항목 | 결과 |
|------|------|
| 결정 | ✅ Cherry-pick 7 commits + devel merge + push + PR close |
| 시각 판정 | ★ **통과** (작업지시자 평가: PR #553 회귀 영역 개선 확인) |
| Devel merge commit | `5ba7f2e` |
| Cherry-pick 충돌 | 0 건 (모두 자동 적용) |
| Author 보존 | ✅ 7 commits 모두 `Taesup Jang <tsjang@gmail.com>` 보존 |
| 결정적 검증 | ✅ 모두 통과 |
| WASM 빌드 | ✅ 4,569,773 bytes (devel baseline 대비 -12,772) |
| PR #556 통합 close | ✅ (이미 close 상태였음, 통합 안내 댓글 등록) |

## 2. PR #553 → PR #589 재PR 의 본질

### 2.1 메인테이너 회신 3개 요청 응답

| 회신 | 본 PR 응답 | 결과 |
|------|---|---|
| (i) page 4/8 결함 정정 | `wrap_precomputed` IR 플래그 + cs_offset 단일 접근 | ✅ 시각 판정 ★ 통과 |
| (ii) 페이지네이션 안전한 방식 | `wrap_around_pic_bottom_px` / `v_push_before` / `promoted_cps` 모두 제외 | ✅ Task #546 회귀 0 |
| (iii) HWP 3.0 직렬화 round-trip 정합 | `wrap_precomputed` derived 필드, serializer 미참조 (직접 검증 0 hits) | ✅ 정합 |

### 2.2 PR #553 ↔ PR #589 비교

| 항목 | PR #553 (rollback) | PR #589 (본 PR) | 변화 |
|------|---|---|---|
| `wrap_around_pic_bottom_px` | 추가 (보완5 본질) | **제외** | Task #546 회귀 회피 |
| `v_push_before` 필드 | 추가 (model 변경) | **제외** | 직렬화 우려 영역 제거 |
| `promoted_cps` 필드 | 추가 (LineSeg) | **제외** | 동일 |
| `wrap_around_is_hwp3` 분기 | 렌더러에 잔존 | **제거** (CLAUDE.md 준수) | 포맷 독립 IR 통합 |
| `mod.rs` LOC | +508 | +27 | **19배 축소** |
| WASM 크기 | 4,586,232 bytes | 4,569,773 bytes | **-16,459 bytes** |

→ 광범위 변경 → 단일 IR 플래그 접근으로 본질적 단순화. 메인테이너 회신 정합 응답.

## 3. CLAUDE.md HWP3 파서 규칙 준수

CLAUDE.md 규칙:
> HWP3 전용 로직은 **반드시 `src/parser/hwp3/` 안에서만** 구현. 렌더러, 레이아웃, 문서 코어 등 공통 모듈에 HWP3 전용 분기를 추가하지 않는다.

본 PR 응답:

| 위치 | 변경 |
|------|------|
| `src/renderer/typeset.rs` | `wrap_around_is_hwp3` HWP3 전용 분기 → `para.wrap_precomputed` 포맷 독립 IR 플래그 |
| `src/renderer/layout.rs` | -19 / +6 (HWP3 전용 분기 제거, IR 플래그로 통합) |
| `src/parser/hwp3/mod.rs` | +27 (`wrap_precomputed` 후처리, HWP3 전용 결정 로직은 hwp3/ 안에만 존재) |
| `src/model/paragraph.rs` | +5 (`wrap_precomputed: bool` 필드, derived) |

→ 규칙 정합. 메모리 룰 `feedback_hancom_compat_specific_over_general` 정신 정합 (일반화보다 케이스별 명시 가드 + 위치 격리).

## 4. cherry-pick 진행

### 4.1 대상 commits (7개, 충돌 0)

```
bdb51a4 Task #460 Stage 9 보완6: HWP3 wrap zone x 위치 수정 (wrap_precomputed IR 플래그)
ff64387 Task #460 Stage 9 보완8: HWP3 single-LineSeg wrap zone 문단 감지 확장
1ad07a4 Task #554 Stage 0-1: 수행/구현계획서 + 광범위 진단 보고서
1fdd98f Task #554 Stage 2-1: HWPX 휴리스틱 + 조건부 -1600 보정
8d88c70 Task #554 Stage 2-2: HWP5 휴리스틱 + 조건부 -1600 보정
a3d1967 Task #554 Stage 2-3: 회귀 테스트 + 광범위 검증
3678217 Task #554 Stage 2-4: info 명령에 Origin 추정 정보 + 최종 보고서
```

모두 `Taesup Jang <tsjang@gmail.com>` author 보존.

### 4.2 변경 영역

#### Task #460 보완6, 8 — page 4/8 결함 정정

| 파일 | 변경 |
|------|------|
| `src/model/paragraph.rs` | +5 (`wrap_precomputed: bool` derived 필드) |
| `src/parser/hwp3/mod.rs` | +27 (wrap_precomputed 후처리 — multi-LineSeg + single-LineSeg cs>0 + 페이지 첫 문단 그림 케이스) |
| `src/renderer/typeset.rs` | -3 / +9 (`wrap_around_is_hwp3` → `para.wrap_precomputed`) |
| `src/renderer/layout.rs` | -19 / +6 (HWP3 전용 분기 제거, IR 플래그로 통합) |
| `src/renderer/layout/paragraph_layout.rs` | +20 (wrap_precomputed면 `line_cs_offset` 적용, 아니면 Task #489 `effective_col_x`) |

#### Task #554 — HWP3 변환본 페이지네이션 휴리스틱

| 파일 | 변경 |
|------|------|
| `src/parser/hwpx/header.rs` | +29 (`parse_hwpx_hwpml_version`, `<hh:head version="1.4">` 검출) |
| `src/parser/hwpx/mod.rs` | +15 (HWPX 헤더 분석 → origin 추정) |
| `src/parser/mod.rs` | +39 (`apply_hwp3_origin_fixup`, HWP5 `(PS/Para<0.05) AND (CS/Para<0.15) AND (Para>50)` 휴리스틱 + 조건부 -1600 보정) |
| `src/main.rs` | +21 (`info` 명령에 Origin 추정 정보) |
| `tests/issue_554.rs` | +113 (회귀 테스트 12개) |
| `samples/hwp3-sample{,4,5}-hwp{5,x}.{hwp,hwpx}` | binary fixture 5개 |

## 5. 결정적 검증 결과

### 5.1 본 환경 재검증 (cherry-pick 후)

| 게이트 | 결과 |
|--------|------|
| `cargo build` | ✅ Finished |
| `cargo test --lib` | ✅ **1129 passed** / 0 failed / 3 ignored |
| `cargo test --test issue_554` | ✅ 12 passed (HWP3 변환본 휴리스틱) |
| `cargo test --test issue_546` | ✅ 1 passed (exam_science p2 — Task #546 회귀 0) |
| `cargo test --test issue_530/505/418/501` | ✅ 모두 통과 (1+9+1+1) |
| `cargo test --test svg_snapshot` | ✅ 6/6 passed |
| `cargo clippy --lib` | ✅ 0 건 |
| `cargo build --release` | ✅ Finished (28.49s) |
| Docker WASM 빌드 | ✅ **4,569,773 bytes** (1m 25s) |

### 5.2 페이지네이션 회귀 검증 (HWP3 native)

- `hwp3-sample.hwp`: 16 페이지 (회귀 0)
- `hwp3-sample5.hwp`: 64 페이지 (회귀 0)
- HWP3 변환본 휴리스틱 (Task #554): 4/5 fixture 정확 + 1개 -1 over-correct (의도된 trade-off)

## 6. 시각 판정 (★ 게이트)

### 6.1 SVG 자료 생성

- `output/svg/pr589_before/hwp3-sample5/` (devel 기준, 64 페이지)
- `output/svg/pr589_after/hwp3-sample5/` (pr589-review 기준, 64 페이지)
- `output/svg/pr589_after/hwp3-sample5-hwp5/` (PR 신규 fixture, 64 페이지)

### 6.2 byte 차이 페이지

HWP3 native (`hwp3-sample5.hwp`) before/after 차이: **8 페이지**
- page **4**, **8** (PR #553 회귀 영역, 본 PR 정정 대상)
- page 16, 22, 27 (PR 본문 명시 정정 영역)
- page 17, 18, 48 (보완8 — single-LineSeg wrap zone 감지 확장 영향)

### 6.3 작업지시자 시각 판정 결과

> 1차 리뷰에서 시각판정에서 문제가 되었던 부분이 개선되었습니다. 정확하지도 않은 HWP 3.0 스펙으로 하나 하나 문제를 풀어가는 모습 멋지십니다!

→ ★ **통과**. PR #553 close 회신의 page 4/8 결함 정정 영역이 시각적으로도 회복.

## 7. PR close 처리

### 7.1 PR #589 close
- 댓글 등록 (메인테이너 회신 3개 요청 응답 검증 + 검증 결과 + 시각 판정 + 잔존 결함 + 컨트리뷰터 인정)
- close 처리

### 7.2 PR #556 (Task #554 단독) close
- PR #589 본문의 요청대로 통합 close 안내 댓글
- 이미 close 상태였음 (컨트리뷰터가 PR #589 통합 시 사전 close 하거나 다른 이유)

## 8. 잔존 결함 (별도 후속 task 권고)

PR 본문 §"잔존 결함" 명시 영역 (본 PR 의 trade-off 로 수용):

1. **page 27 그림+텍스트 y 정합**: 보완7 (그림 전용 문단 height = 그림 높이) 시도했으나 HWP3 native pagination 회귀 (16→18, 64→65) 발견하여 본 PR 에서 제외. 트러블슈팅 문서 `mydocs/troubleshootings/square_wrap_pic_bottom_double_advance.md` 권장 영역 — 옵션 1 (wrap-around 누적 height 추적) 정밀화 필요.

2. **HWP3 변환본 1개 -1 over-correct**: hwp3-sample-hwp5/.hwpx (16 vs 15). 단일 -1600 보정의 본질적 한계 (Task #554 보고서 참조).

→ 별도 후속 task 로 다룰 영역.

## 9. 메모리 정합

- ✅ `feedback_visual_regression_grows` — 시각 판정 게이트 정합 운영 (PR #553 미통과 → PR #589 통과)
- ✅ `feedback_v076_regression_origin` — 작업지시자 직접 시각 판정으로 정합성 확인
- ✅ `feedback_hancom_compat_specific_over_general` — 일반화보다 케이스별 명시 가드 (PR #553 광범위 변경 → PR #589 IR 플래그 단일 접근)
- ✅ `feedback_pr_comment_tone` — 본 PR close 댓글 차분/사실 중심 + 컨트리뷰터 본질 추적 노력 인정
- ✅ `feedback_small_batch_release_strategy` — 본 사이클 활발한 외부 기여 (PR #589 = 5/1~5/5 사이 11번째 PR) 의 빠른 회전 운영
- ✅ `project_hwpx_to_hwp_adapter_limit` — HWP3 직렬화 round-trip 정합 (derived 필드 모델)
- ✅ `reference_authoritative_hancom` — 시각 판정 = 작업지시자 한컴 환경 권위

## 10. 본 사이클 사후 처리

- [x] PR #589 close (cherry-pick 머지 + push)
- [x] PR #556 close 안내 댓글
- [x] orders 갱신 (`mydocs/orders/20260505.md`)
- [x] 처리 보고서 (`mydocs/pr/archives/pr_589_report.md`, 본 문서)
- [ ] 검토 보고서 archives 이동 (`mydocs/pr/pr_589_review.md` → `mydocs/pr/archives/pr_589_review.md`)
- [ ] orders 5/4 갱신 (PR #553 항목에 PR #589 재PR 처리 결과 후속 추가) — 선택적
