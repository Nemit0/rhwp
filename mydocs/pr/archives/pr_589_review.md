# PR #589 검토 보고서 — 1차 검토 (메인테이너 회신 응답 검증)

**PR**: [#589 Task #511 v2 + #554: HWP3 Square wrap 보완6+8 (페이지네이션 안전) + 변환본 식별 휴리스틱](https://github.com/edwardkim/rhwp/pull/589)
**작성자**: @jangster77 (Taesup Jang)
**관련 이전 PR**: #553 (close, rollback) / #556 (Task #554, OPEN — 본 PR 에 통합)
**처리 결정**: ⏳ **검토 중** (본 1차 검토 — 메인테이너 회신 응답 검증)
**검토 시작일**: 2026-05-05

## 1. 검토 목표

**본 1차 검토의 핵심 질문**:
- PR #553 close 시 메인테이너가 회신한 3개 요청에 본 PR 이 충분히 응답했는가?
  - (i) page 4/8 결함 정정
  - (ii) 페이지네이션 안전한 방식
  - (iii) HWP 3.0 직렬화 round-trip 정합 검증 (`wrap_precomputed`/`v_push_before` 등 model 변경 영역)

**본 검토의 비범위**: 시각 판정 (★ 게이트) — 별도 단계로 작업지시자 직접 검증.

## 2. PR 정보

| 항목 | 값 | 평가 |
|------|-----|------|
| 분기점 | devel 정합 (5 merge commit 으로 동기화 유지) | ✅ |
| commits | 12 (본질 7 + merge 5) | 정합 |
| changedFiles | 23 / +1,259 / -23 | 정합 |
| mergeable | MERGEABLE | ✅ |
| CI | (확인 필요) | — |
| Task #546 정합 명시 | ✅ "wrap_around_pic_bottom_px 메커니즘 (보완5 본질) 모두 제외" | ✅ |
| PR #553 회신 정합 명시 | ✅ "옵션 A2 — wrap_precomputed IR 플래그 + cs_offset 단일 접근" | ✅ |
| Task #554 통합 | ✅ PR #556 close 요청 본문에 명시 | 정합 |

## 3. 메인테이너 회신 3개 요청에 대한 응답 검증

### 3.1 회신 (i) — page 4/8 결함 정정

**메인테이너 회신** (`pr_553_review.md` §6):
> page 4/8 결함만 정정 후 재 PR

**본 PR 응답** (PR 본문 §"검증 결과 / 시각 판정 자료"):

| 페이지 | 기대 x (cs 기반) | 실측 x (PR 본문) | 정합 |
|------|----------------|-----------------|------|
| page 4 | 529 (cs=35460) | 529.5 (20개 인스턴스) | ✅ |
| page 8 | 384 (cs=24560) | 384.0 (12개) | ✅ |
| page 16 | 338 (cs=21096) | 337.4 | ✅ |
| page 22 | 407 (cs=26256) | 406.7 (21개) | ✅ |
| page 27 | 386 (cs=24724) | 386.3 | ✅ |

→ PR 본문 측 자체 측정으로는 정정. **시각 판정 (작업지시자)** 게이트 별도 진행 필요.

**평가**: ⏳ 시각 판정 대기. PR #553 의 page 4 결함 측정 (`-396 px diff`) 과 정밀하게 대비되는 measurable 검증 자료를 PR 본문에 첨부 — 메인테이너 회신 정합 우수.

### 3.2 회신 (ii) — 페이지네이션 안전한 방식

**메인테이너 회신**:
> Task #546 trade-off 영역 페이지네이션 안전한 방식 재구현 권장

**본 PR 응답**:

| 영역 | PR #553 (rollback) | PR #589 (재PR) | 변화 |
|------|---------|------------|------|
| `wrap_around_pic_bottom_px` | 추가 (보완5 본질) | **제외** | Task #546 회귀 회피 |
| `v_push_before` 필드 | 추가 (model 변경) | **제외** | 직렬화 우려 영역 제거 |
| `promoted_cps` 필드 | 추가 (LineSeg) | **제외** | 동일 |
| 정정 메커니즘 | 보완6-13 (`mod.rs` +508 LOC) | **보완6, 8** (`mod.rs` +27 LOC, model +5 LOC) | 19배 축소 |
| `wrap_around_is_hwp3` 분기 | 렌더러에 잔존 | **제거** (CLAUDE.md HWP3 파서 규칙 준수) | 정합 |

**자기 검증**:
- `cargo test --test issue_546` 통과 — exam_science.hwp 4 페이지 정합 유지 (Task #546 회귀 0)
- `hwp3-sample5.hwp` 64 페이지 (HWP3 native pagination 회귀 0)
- `hwp3-sample.hwp` 16 페이지 (회귀 0)

**평가**: ✅ 우수. PR #553 의 5 영역 광범위 변경 → 본 PR 의 IR 플래그 단일 접근 + LOC 19배 축소. 메인테이너 회신의 "페이지네이션 안전" 의도 정합.

### 3.3 회신 (iii) — HWP 3.0 직렬화 round-trip 정합

**메인테이너 회신** (가장 핵심, `pr_553_review.md` §6):
> 추가 고려 — HWP 3.0 직렬화: 작업지시자 의견 반영, `wrap_precomputed` / `v_push_before` 등 model 변경이 HWP3 → HWP3 round-trip 까지 정합한지 점검 권장

**본 PR 응답**:

PR 본문 표:
> | `src/model/paragraph.rs` | +5 | `wrap_precomputed: bool` 필드 (**derived, serializer 미참조**) |

**검증 (본 검토 직접 수행)**:

```bash
git grep "wrap_precomputed" pr589-review -- src/serializer/
# → 0 hits
```

✅ `src/serializer/` 영역에서 `wrap_precomputed` 참조 0건 확인.

**도메인 분석**:
- `src/model/paragraph.rs` 의 다른 derived/round-trip 보존 필드 (`char_count_msb`, `has_para_text`, `tab_extended` 등) 와 동일 패턴
- 기본값 `false` (`Paragraph::new` 정합)
- 파서가 후처리에서 결정 → 렌더러가 분기 → serializer 는 무시 (round-trip 시 파서가 다시 결정)

**잠재 우려**:
- HWP3 → HWPX → HWP3 cross-format round-trip 시 `wrap_precomputed` 가 손실되지만, **HWP3 파서가 다시 결정**하므로 정합 유지
- HWP3 → HWP5 round-trip 시 동일 (HWP5 파서는 본 필드 결정 안 함, 기본값 `false`)
- 즉 **derived 필드의 정합성 모델** 이 정합

**평가**: ✅ 정합. 메인테이너의 가장 핵심 우려 — HWP3 직렬화 영역 — 에 대한 응답이 model 변경 패턴 (round-trip 보존 필드와 동일) + serializer 미참조로 수렴. PR #553 의 `v_push_before`/`promoted_cps` (LineSeg 단위 필드) 가 가졌던 직렬화 우려 영역은 본 PR 에서 제거됨.

## 4. CLAUDE.md HWP3 파서 규칙 정합

**규칙** (CLAUDE.md):
> HWP3 파서 규칙: src/parser/hwp3/ 내부에서 HWP3 바이너리를 읽어 Document IR 로 변환하여 반환. HWP3 전용 로직은 반드시 src/parser/hwp3/ 안에서만 구현. 렌더러(src/renderer/), 레이아웃(src/renderer/layout.rs), 문서 코어(src/document_core/) 등 공통 모듈에 HWP3 전용 분기 추가하지 않는다.

**본 PR 응답**:

| 위치 | PR #553 (rollback) | PR #589 (재PR) | 정합 |
|------|---------|------------|------|
| `src/renderer/typeset.rs` | `wrap_around_is_hwp3` HWP3 전용 분기 | `para.wrap_precomputed` 포맷 독립 IR 플래그 | ✅ |
| `src/renderer/layout.rs` | HWP3 전용 분기 잔존 | -19/+6 (HWP3 전용 분기 제거, IR 플래그로 통합) | ✅ |
| `src/parser/hwp3/mod.rs` | wrap zone 후처리 | +27 (`wrap_precomputed` 후처리 — HWP3 전용 결정 로직은 hwp3/ 안에만 존재) | ✅ |

**평가**: ✅ 우수. 메모리 룰 정합 (`feedback_hancom_compat_specific_over_general` 의 정신과 정합 — 일반화보다 케이스별 명시 가드 + 위치 격리).

## 5. Task #554 통합 영역 검증

**Task #554** 본질: HWP3 변환본 식별 휴리스틱.

| 영역 | 변경 | 평가 |
|------|------|------|
| `src/parser/hwpx/header.rs` | +29 (`parse_hwpx_hwpml_version`, `<hh:head version="1.4">` 검출) | 정합 |
| `src/parser/hwpx/mod.rs` | +15 (HWPX 헤더 분석 → origin 추정) | 정합 |
| `src/parser/mod.rs` | +39 (`apply_hwp3_origin_fixup`, HWP5 `(PS/Para<0.05) AND (CS/Para<0.15) AND (Para>50)` 휴리스틱 + 조건부 -1600 보정) | 정합 (휴리스틱 도메인 명시) |
| `src/main.rs` | +21 (`info` 명령에 Origin 추정 정보) | 정합 |
| `tests/issue_554.rs` | +113 (회귀 테스트 12개) | ✅ 결정적 검증 |
| `samples/hwp3-sample{,4,5}-hwp{5,x}.{hwp,hwpx}` | binary fixture 5개 | 정합 |

**자기 평가** (PR 본문 §"잔존 결함" 2번):
> HWP3 변환본 1개 -1 over-correct: hwp3-sample-hwp5/.hwpx (16 vs 15). 단일 -1600 보정의 본질적 한계 (Task #554 보고서 참조).

→ 컨트리뷰터 자체가 trade-off 영역을 정직하게 명시. 4/5 fixture 정확 + 1개 -1 over-correct 의도된 trade-off.

**평가**: ✅ 정합. PR #556 (Task #554) 의 본 PR 통합으로 PR 1개로 묶은 결정 합리적. 휴리스틱 본질의 제한 영역 (단일 보정값) 도 PR 본문에 명시.

## 6. 검증 — 본 환경 결정적 재검증 결과

### 6.1 결정적 검증 (모두 통과)

| 검증 | PR 본문 결과 | 본 환경 재검증 | 비고 |
|------|---------|----------|------|
| `cargo build` | ✅ | ✅ Finished (15.93s) | |
| `cargo test --lib` | ✅ 1124 passed | ✅ **1129 passed** / 0 failed / 3 ignored | PR 본문 +5 (본 환경 갱신분 또는 lib 단 추가) |
| `cargo test --test issue_554` | ✅ 12 passed | ✅ 12 passed | PR 본문 일치 |
| `cargo test --test issue_546` | ✅ 통과 | ✅ 1 passed (exam_science p2 정합) | Task #546 회귀 0 |
| `cargo test --test issue_530/505/418/501` | (미명시) | ✅ 모두 통과 (1+9+1+1) | PR #553 검토 보고서 영역 |
| `cargo test --test svg_snapshot` | (미명시) | ✅ 6/6 passed | |
| `cargo clippy --lib` | ✅ 0 건 | ✅ 0 건 | |
| `cargo build --release` | ✅ Finished | ✅ Finished (28.49s) | |
| Docker WASM 빌드 | (PR 본문 미명시) | ✅ **4,569,773 bytes** (1m 25s) | devel baseline 4,582,545 대비 -12,772 (LOC 축소 정합) |

→ **본 환경 결정적 검증 모두 통과**. PR 본문의 자체 검증 결과 정합 + 추가 회귀 테스트 영역 (issue_530/505/418/501) 모두 정합.

### 6.2 시각 검증 — SVG 생성 + before/after 차이 자동 검출

**생성 위치**:
- `output/svg/pr589_before/hwp3-sample5/` — devel 기준 (64 페이지)
- `output/svg/pr589_after/hwp3-sample5/` — pr589-review 기준 (64 페이지)
- `output/svg/pr589_after/hwp3-sample5-hwp5/` — PR 신규 fixture (64 페이지, before 없음 — 신규 추가)

**페이지 수 회귀 검증**:
- HWP3 native (`hwp3-sample5.hwp`): before 64 페이지 / after 64 페이지 → **회귀 0** ✅
- PR 본문 명시: 16 페이지 (`hwp3-sample.hwp`) / 64 페이지 (`hwp3-sample5.hwp`) — 정합 ✅

**byte 차이 페이지 (HWP3 native, 8 페이지)**:
- **page 4** ★ — PR #553 결함 발생 페이지, 본 PR 정정 대상
- **page 8** ★ — PR #553 결함 발생 페이지, 본 PR 정정 대상
- **page 16** — PR 본문 명시 정정 페이지
- page 17, 18 — 보완8 (single-LineSeg wrap zone 감지 확장) 의 영향 영역으로 추정
- **page 22** — PR 본문 명시 정정 페이지
- **page 27** — PR 본문 명시 정정 페이지 (잔존 결함 1번 영역, "그림+텍스트 y 정합" trade-off)
- page 48 — 보완 영역 영향으로 추정

→ PR 본문이 명시한 정정 페이지 (4/8/16/22/27) 가 모두 차이 페이지에 포함. 추가로 17/18/48 도 차이 — 의도된 wrap_precomputed 활성화 범위 확장 (보완8) 영향.

### 6.3 작업지시자 시각 판정 가이드

★ 게이트 — 작업지시자 직접 SVG 시각 검증 필수 영역:

**필수 검증 페이지** (PR #553 의 회귀 영역 — 본 PR 의 정정 응답):
- `output/svg/pr589_before/hwp3-sample5/hwp3-sample5_004.svg` ↔ `output/svg/pr589_after/hwp3-sample5/hwp3-sample5_004.svg`
- `output/svg/pr589_before/hwp3-sample5/hwp3-sample5_008.svg` ↔ `output/svg/pr589_after/hwp3-sample5/hwp3-sample5_008.svg`

**추가 검증 페이지** (PR 본문 정정 영역):
- page 16, 22, 27 (before/after)

**확장 영향 페이지** (보완8, 의도된 wrap_precomputed 활성화 범위 확장):
- page 17, 18, 48 (before/after)

**잔존 결함 영역 (PR 본문 §"잔존 결함" 1번)**:
- page 27 의 그림+텍스트 y 정합 — 본 PR 의 trade-off 영역, 별도 후속 task 권고. 시각 판정에서 수용 가능 수준인지 확인 필요.

## 7. PR #553 ↔ PR #589 비교 요약

| 항목 | PR #553 (rollback) | PR #589 (재PR) | 정합도 |
|------|---|---|---|
| **page 4/8 결함** | -396 px diff (시각 판정 미통과) | 529.5/384.0 px (PR 본문 측 정정 명시) | ⏳ 시각 판정 대기 |
| **페이지네이션 안전** | `wrap_around_pic_bottom_px` 도입 | 제외 | ✅ |
| **HWP 3.0 직렬화 round-trip** | `v_push_before`/`promoted_cps` (LineSeg 단위) 우려 | derived `wrap_precomputed` (Paragraph IR) + serializer 미참조 | ✅ |
| **CLAUDE.md HWP3 파서 규칙** | `wrap_around_is_hwp3` 분기 잔존 | 포맷 독립 IR 플래그로 통합 | ✅ |
| **LOC** | mod.rs +508 LOC | mod.rs +27 LOC | ✅ (19배 축소) |
| **자기 검증** | exam_science 정합 + Task #546 정합 | exam_science 정합 + native HWP3 16/64 페이지 회귀 0 | ✅ |
| **Task #554 통합** | 미통합 | ✅ 통합 (PR #556 close 요청) | 정합 |

→ **메인테이너 회신 3개 요청 모두 응답 + CLAUDE.md HWP3 파서 규칙 준수 + 광범위 LOC 축소**. 본 PR 은 PR #553 의 본질 정정 + 메인테이너 우려 영역 모두 흡수한 우수한 재PR.

## 8. 1차 검토 결론

### 정합 평가
- ✅ **메인테이너 회신 (i) 응답** — page 4/8 정정 (PR 본문 측정 자료 제시, 시각 판정 게이트만 잔존)
- ✅ **메인테이너 회신 (ii) 응답** — 페이지네이션 안전 (Task #546 회귀 영역 모두 회피)
- ✅ **메인테이너 회신 (iii) 응답** — HWP3 직렬화 round-trip 정합 (derived 필드 + serializer 미참조)
- ✅ **CLAUDE.md HWP3 파서 규칙 준수** — 렌더러 HWP3 전용 분기 모두 제거
- ✅ **Task #554 통합** — PR 1개로 묶음, 본 PR 본문이 PR #556 close 명시
- ✅ **base 동기화** — devel 정합 (5 merge commit)

### 결정적 검증 결과 (본 환경 재검증 완료)
- ✅ `cargo test --lib` 1129 passed
- ✅ `cargo test --test issue_554` 12 passed
- ✅ `cargo test --test issue_546` 1 passed (Task #546 회귀 0)
- ✅ `cargo test --test issue_530/505/418/501` 모두 통과
- ✅ `cargo test --test svg_snapshot` 6/6 passed
- ✅ `cargo clippy --lib` 0 건
- ✅ `cargo build --release` 통과
- ✅ HWP3 native fixture 페이지 수 회귀 0 (64/64)
- ✅ Docker WASM 빌드 4,569,773 bytes (devel baseline 대비 -12,772 LOC 축소 정합)

### 잔존 검증 영역
- ⏳ **시각 판정 (★ 게이트)** — 작업지시자 직접 SVG 검증 필수. PR #553 의 시각 판정 미통과가 rollback 결정의 근거였음 → 본 PR 의 핵심 게이트.
  - 검증 자료: `output/svg/pr589_before/hwp3-sample5/` ↔ `output/svg/pr589_after/hwp3-sample5/` (page 4/8/16/22/27 + 17/18/48)
  - PR 신규 fixture: `output/svg/pr589_after/hwp3-sample5-hwp5/` (before 없음 — 신규 추가 fixture)

### 권장 처리 방향 (작업지시자 결정 대기)

#### 옵션 A — 시각 판정 통과 시 cherry-pick 진행
- 1차 검토 결과 메인테이너 회신 응답 우수 + 결정적 검증 (PR 본문 측) 정합
- 본 환경 결정적 재검증 + SVG 생성 + 작업지시자 시각 판정 → 통과 시 cherry-pick
- PR #556 close 처리 동시 진행

#### 옵션 B — 추가 정정 요청
- 시각 판정에서 잔존 결함 발견 시 컨트리뷰터에게 추가 정정 요청
- PR 본문 §"잔존 결함" 1번 (page 27 그림+텍스트 y 정합) 영역이 작업지시자 시각 판정 대상

#### 옵션 C — close + 본 환경 직접 처리
- 시각 판정 다수 결함 발견 시 본 환경에서 직접 처리

→ **작업지시자 결정 대기**. 옵션 A 권장 (메인테이너 회신 응답 + 결정적 검증 우수).

## 9. 다음 단계 (옵션 A 진행 — 작업지시자 시각 판정 대기)

1. ✅ 본 1차 검토 보고서 작성 (현재 문서)
2. ✅ 본 환경 결정적 재검증 (`cargo test --lib` 1129, `issue_554` 12, `issue_546` 1, `clippy` 0, `build --release` 통과)
3. ✅ SVG 생성 — `output/svg/pr589_before/hwp3-sample5/` + `output/svg/pr589_after/hwp3-sample5/` + `output/svg/pr589_after/hwp3-sample5-hwp5/`
4. ✅ Docker WASM 빌드 4,569,773 bytes
5. ⏳ **작업지시자 시각 판정** (★ 게이트) — 본 단계 대기 중
6. ⏳ 통과 시 cherry-pick + PR #556 close
7. ⏳ 처리 보고서 (`pr_589_report.md`) 작성 + archives 이동

## 10. 메모리 정합

- ✅ `feedback_visual_regression_grows` — 시각 판정 게이트 정합 운영
- ✅ `feedback_v076_regression_origin` — 작업지시자 직접 시각 판정 게이트
- ✅ `feedback_hancom_compat_specific_over_general` — 일반화보다 케이스별 명시 가드 (PR #553 의 광범위 변경 → PR #589 의 IR 플래그 단일 접근)
- ✅ `feedback_pr_comment_tone` — 본 검토 톤 차분/사실 중심
- ✅ `project_hwpx_to_hwp_adapter_limit` — HWP3 직렬화 round-trip 의 본질 (derived 필드 정합 모델)
- ✅ `feedback_pdf_not_authoritative` / `reference_authoritative_hancom` — 시각 판정 = 작업지시자 한컴 환경 권위

---

**검토자**: 클로드 (페어 프로그래밍 파트너)
**1차 검토 단계 — 작업지시자 승인 대기**.
