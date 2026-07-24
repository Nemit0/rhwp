# PR #1011 검토 — Task #1006: 쪽 테두리 포맷별 분리 + cover logo overlap 해소

- 작성일: 2026-05-20
- 컨트리뷰터: [@jangster77](https://github.com/jangster77) (Taesup Jang)
- PR: https://github.com/edwardkim/rhwp/pull/1011
- base/head: `devel` ← `jangster77:local/task1006`
- 연결 이슈: closes #1006 (HWP5 변환본 cover page 머릿말 그림 + 외곽선 시각 겹침)
- 규모: +451 / -40, 12 files (소스 5 + fixture 2 + 문서 5), mergeable **MERGEABLE**
- 본질 커밋: 단일 `67f50f43` (작성자 Taesup Jang)

## 1. 컨트리뷰터 사이클 / 시리즈 위치

@jangster77 24+ 사이클. #997→#999→#1005→#1009(보류)→**#1011** 연속. **paper_based outline 회귀 사이클 종결 PR**: task877 → #920 → #956 → #987(머지) → #1005(머지, header_inside 도입) → **#1006(본 PR, header 제거)**.

PR #1009 는 보류(base 부정합)이나 본 PR 은 page border 단독 영역으로 독립적. devel = `9190dea8` (#1009 본질 미반영, #1005 까지 적용).

## 2. 변경 본질

### A. PageBorderBasis enum 도입 (포맷별 분리)

```rust
// src/model/page.rs
pub enum PageBorderBasis {
    BodyBased,   // HWP3 spec convention (enum 주석)
    PaperBased,  // HWP5/HWPX (#956 한컴 viewer 정합)
}
```

`PageBorderFill.basis` 필드 신설. parser 단계(HWP3/HWP5/HWPX) 가 모두 **`PaperBased` 명시 주입** — enum 주석의 "spec convention" 과 무관하게 실제 주입은 모두 PaperBased 로 통합. renderer 는 `attr & 0x01` 단일 비트 해석 대신 `basis` 필드 직접 사용.

**책임 분리**: parser 가 포맷별 interpretation 결정, renderer 는 단순 소비 (`feedback_diagnosis_layer_attribution` 정합).

### B. clip 정책 변경 (#1005 격차 A 정정)

| clip | 이전 (#1005) | 본 PR (#1006) |
|------|-------------|---------------|
| `!header_inside` | body_area top clip | **제거** (paper-edge 까지 확장 — cover logo 시각 정합) |
| `!footer_inside` | body_area bottom clip | **유지** (페이지 번호 외곽선 바깥 위치 유지) |

PR 본문 명시: "spec 정의 (attr bit 1/2) 와 일부 다르지만 한컴 실제 동작 정합 우선". 작업지시자 Hancom Office close-up 시각 판정 기반.

### C. 회귀 사이클 종결 표 (PR 본문)

| Task/PR | sample16 | 시험지 | 변환본 logo |
|---------|----------|--------|------------|
| task877 ((attr&0x01)!=0) | ✓ | 회귀 | 회귀 |
| #920 ((attr&0x01)==0) | 회귀 | ✓ | 회귀 |
| #956 (전역 true) | 회귀(재판정) | ✓ | overlap |
| #987 (attr 존중) | body 재판정(오판단) | 일부 ✓ | 회귀 (#1006 원인) |
| **#1006** | ✓ | ✓ | ✓ + 페이지번호 바깥 ✓ |

### D. fixture 추가

`samples/test-image.hwp/.hwpx` — 그림 wrap 4종(자리차지/글앞으로/어울림/글뒤로) 시각 검증 + 회귀 가드 영구화.

## 3. 검토 의견

### 강점

1. **회귀 사이클 종결 설계** — 단일 비트 해석 모호성 → **포맷별 명시 필드** 책임 분리. parser→renderer 책임 명확 (`feedback_diagnosis_layer_attribution` 정합).
2. **시각 판정 권위 명문화** — 작업지시자 Hancom Office close-up 판정으로 #987 body-based 재판정을 오판단으로 정정 (`feedback_visual_judgment_authority` 권위 사례). spec 우선이 아닌 한컴 실제 동작 우선 정책 명시.
3. **selective clip** — header(제거)/footer(유지) 분리 — case-specific 해법 (`feedback_hancom_compat_specific_over_general` 정합, 일반화 회피).
4. **fixture 영구화** — test-image.hwp/.hwpx 추가로 회귀 가드 확보. `feedback_visual_judgment_authority` + `reference_authoritative_hancom` 강화.
5. **HWP3 전용 분기 아님** — parser 단계에서 포맷별 명시 주입은 CLAUDE.md "HWP3 전용 로직 hwp3/ 안에서만" 규칙에 정합 (interpretation 을 parser 가 결정).
6. **검증** — cargo test 1306, clippy 0, fmt clean, 5 sample 페이지 수 회귀 없음 (PR 본문).

### ⚠️ 쟁점

#### (A) `!header_inside` clip 제거 — #1005 격차 A 부분 정정 영향

#1005 가 도입한 머리말 영역 비침범 clip 을 본 PR 이 제거. 본 PR 의 sweep 에서:
- sample16-hwp3 (HWP3 원본): #1005 가 외곽선 안쪽 이동 시켰던 것이 본 PR 에서 **paper-edge 로 원복** 또는 새 위치 가능
- sample16-hwp5 cover: logo 가 외곽선 내부 위치 정합 (목표)
- footer clip 유지로 페이지 번호 동작 보존

**검증 필요**: sweep BEFORE(devel #1005) ↔ AFTER 에서 sample16-hwp3 외곽선 위치 / sample16-hwp5 cover logo 정합 / 페이지 번호 위치 유지 / 일반 HWP5 무회귀.

#### (B) enum 주석과 실제 주입 불일치 (서술 오해 소지)

`PageBorderBasis` enum 주석은 "HWP3 → BodyBased / HWP5/HWPX → PaperBased" 라고 spec convention 을 설명하나, 실제 parser 주입은 **모두 PaperBased**. 코드는 정확(PR 본문 정합)하나 enum 주석이 향후 오해 가능. 후속 정리 권고 (본 PR 머지 가능).

#### (C) test-image fixture 영역 잔존 — PR 본문 명시

"test-image.hwp paragraph 텍스트 라벨 누락 — wrap=TopAndBottom + 글뒤로/글앞으로/어울림 혼재 paragraph 텍스트 렌더링 결함 (별도 root cause)". fixture 는 추가하나 결함은 별도 follow-up. PR 본문 scope 외 명시 — 본 PR 처리 무관.

### 확인 필요 (검증 단계)

1. cherry-pick `67f50f43` (단일, 충돌 가능성 — model/page.rs 신규 필드 + layout.rs 변경)
2. cargo test --release --lib + clippy -D + fmt 0
3. **sweep** — sample16-hwp3 (#1005 와 비교), sample16-hwp5, 시험지(exam_*), 변환본 cover logo, 페이지 번호 위치 / variant=false 일반 무회귀
4. WASM 빌드 + 작업지시자 시각 판정 — cover logo + 페이지 번호 + 시험지

## 4. 처리 옵션

- **옵션 A (수용 — 권고)**: 본 PR 머지. 회귀 사이클 종결 설계 견고, 시각 판정 근거 명문화, fixture 영구화. sweep + 작업지시자 시각 판정 통과 시.
- **옵션 B (수정 요청)**: sample16-hwp3 외곽선 위치가 #1005 와 다른 회귀로 확인되거나 cover logo 정합 실패 시. 가능성 낮음.
- **옵션 C (close)**: 본질 결함 시. 해당 없음.

## 5. 메모리 룰 정합

- `feedback_contributor_cycle_check` — @jangster77 #997~#1011 연속, #1011 마지막
- `feedback_diagnosis_layer_attribution` — parser/renderer 책임 분리 (interpretation → parser, 사용 → renderer)
- `feedback_visual_judgment_authority` — **권위 사례 강화**: 작업지시자 Hancom Office close-up 판정으로 spec 우선 #987/#1005 정정. spec ≠ 한컴 실제 동작
- `feedback_hancom_compat_specific_over_general` — selective clip (header 제거 / footer 유지) case-specific
- `feedback_pr_supersede_chain` — task877→#920→#956→#987→#1005→#1006 회귀 사이클 종결 (단일 PR 로 다중 이전 결함 정정)
- `reference_authoritative_hancom` — test-image fixture 추가로 회귀 가드 영구화
- `project_output_folder_structure` — sweep 산출물 output/poc/pr1011 배치

## 6. 권고

**옵션 A** — 회귀 사이클 종결 설계 + 시각 판정 권위 명문화 + fixture 영구화 우수. 검증 단계 sweep(특히 sample16-hwp3 #1005 와 비교) + 작업지시자 시각 판정 통과 시 cherry-pick no-ff merge. enum 주석 일관성(쟁점 B)은 본 PR 머지 가능 후속 정리.
