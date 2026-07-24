# PR #289 검토 — Task #287: 빈 runs comp_line의 TAC 수식 인라인 처리

## PR 정보

- **PR**: [#289](https://github.com/edwardkim/rhwp/pull/289)
- **이슈**: [#287](https://github.com/edwardkim/rhwp/issues/287) (+ #288 자체 closed "not a bug")
- **작성자**: @planet6897 (Jaeuk Ryu)
- **base/head**: `devel` ← `local/task287`
- **Mergeable**: ✅ CLEAN (이미 devel 머지 동기화)
- **CI**: ✅ 전부 SUCCESS (CI, CodeQL python/js/rust)
- **검토일**: 2026-04-24

## 변경 요약

`samples/exam_math_8.hwp` 의 박스 내 큰 cases 수식 `a_{n+1} = {...}` 이 박스 좌상단 `(71.80, 147.38)`에 고정되던 버그를 수정. 수식이 속한 comp_line이 `runs=[]`일 때 인라인 TAC 경로를 못 타고 `shape_layout` display 경로로 떨어지던 문제.

### 핵심 변경 (코드 1개 파일)

| 파일 | 변경 | 설명 |
|------|------|------|
| `src/renderer/layout/paragraph_layout.rs` | +63 | 빈 runs comp_line의 TAC Equation 인라인 처리 블록 (run 루프 종료 직후) |

### 결과
- 수식 transform: `(71.80, 147.38)` → `(133.27, 188.29)` (박스 내부 line 1 위치)
- `shape_layout` 중복 렌더 제거

## 루트 원인 분석

### 초기 가설 (단계 1에서 기각)
"`has_tac_shape` 조건 누락 + `.max(y)` clamp" → 덤프 실측으로 틀림 확인

### 진짜 원인 (단계 1 `RHWP_DUMP_287` 로그)

```
[287] para=0 line=1 y=172.69 raw_lh=54.60 line_h=54.60 baseline=32.76 max_fs=0.00
       tac_offsets_px=[(11,9.8,2,Eq), (17,327.6,3,Eq)] runs=[]
```

- line 1의 `y=172.69` 는 ls[1] vpos 기반으로 **정확히 계산됨** (누적 y 문제 없음)
- 그러나 `runs=[]` 이라 `for run in comp_line.runs` 루프가 돌지 않음 → 루프 내 TAC 인라인 처리 블록 미실행
- `[287-eq] para=0 ci=3` 로그 부재로 인라인 경로 미진입 확정
- 결과: `shape_layout.rs:133-182` display 경로로 폴백 → `eq_y = col_area.y` 고정 → 박스 좌상단

## 수정 방식 선택

| 옵션 | 설명 | 판정 |
|------|------|------|
| (A) vpos 파이프라인 전파 | composer + layout + render_tree + 대규모 스냅샷 재검증 필요. **조판 엔진 리팩터링급** | ❌ 범위 초과 |
| **(C, 채택)** | 빈 runs comp_line 에서도 그 줄이 소유한 TAC 수식을 인라인 처리 | ✅ 수정 규모 작고 근본적 |

### 새 블록 로직

```rust
if comp_line.runs.is_empty() && !tac_offsets_px.is_empty() {
    let line_start_char = comp_line.char_start;
    let line_end_char = composed.lines.get(line_idx + 1)
        .map(|l| l.char_start).unwrap_or(usize::MAX);
    let mut inline_x = col_area.x + effective_margin_left;
    for &(tac_pos, tac_w, tac_ci) in &tac_offsets_px {
        if tac_pos < line_start_char || tac_pos >= line_end_char { continue; }
        if let Some(Control::Equation(eq)) = para.and_then(|p| p.controls.get(tac_ci)) {
            // EquationNode 생성 (기존 인라인 분기와 동일 로직)
            // tree.set_inline_shape_position → shape_layout display 경로 중복 렌더 차단
            inline_x += tac_w;
        }
    }
}
```

- 줄 char 범위 `[comp_line.char_start, next.char_start)` 로 이 줄 소유 TAC 필터링
- 기존 인라인 분기와 **완전 동일한** `EquationNode` 생성 (tokenize → parse → layout → render_svg)
- `set_inline_shape_position` 등록으로 display 경로 중복 렌더 차단

## 설계 검증

| 설계 요소 | 평가 |
|----------|------|
| `comp_line.runs.is_empty()` 진입 조건 | ✅ 기존 run 루프와 상호 배타 (else 관계). 빈 runs일 때만 실행되어 기존 동작 보존 |
| char 범위 필터링 | ✅ 연속된 comp_line에서 TAC 중복 처리 방지 |
| 기존 인라인 로직 재사용 | ✅ EquationNode 생성 코드가 완전 동일 — 일관성 보장 |
| `tree.set_inline_shape_position` 호출 | ✅ shape_layout display 경로 중복 렌더 차단 (핵심) |
| `cell_ctx` 분기 | ✅ 셀 내부 수식도 올바르게 처리 (parent_para_index vs para_index) |
| Phase 2 분리 후 취소 | ✅ #288 을 "not a bug" 로 확정 — PDF Tm 실측으로 완전 일치 확인 (0.17px 오차) |

## 조사 품질 — 가설 기각 + Phase 2 불필요성 확인

이 PR의 **실질적 가치**:

1. **초기 가설 검증 + 방향 전환** — "has_tac_shape + clamp" 가설을 `RHWP_DUMP_287` 로그로 기각하고 진짜 원인 (빈 runs 경로) 발견
2. **범위 판단** — (A) vpos 파이프라인 전파의 유혹을 회피, (C) 빈 runs 전용 인라인 처리로 최소 수정
3. **Phase 2 #288을 PDF 실측으로 "not a bug" 확정** — 눈대중 오판 ("PDF x≈162-182")을 PDF content stream Tm 직접 추출로 확인 (모든 요소 비율 0.2125 일치, 오차 0.17px)

**핵심 교훈** (보고서 기록):
> "부정 확인(탭 가설 부인) 직후 '증상 자체 유무'를 재검증하는 루프의 필요성"

## 회귀 영향 분석 (작성자 증빙)

| 파일 | 변화 | 해석 |
|------|------|------|
| `exam_math_8.svg` | 큰 수식 이동 | **본 타스크 목적** |
| `exam_math_008.svg` | 동일 구조 자동 개선 | 텍스트 유실 없음, SVG 순서만 |
| `exam_math_012.svg` | `cell-clip-{112→113}` ID shift | `tree.next_id()` 추가 호출 영향, 내용 동일 |
| `equation-lim.svg` | y +0.88 px | display → 인라인 경로 baseline 미세 조정 |
| 나머지 19페이지 | 완전 동일 | — |

## 메인테이너 검증 결과

### PR 브랜치 체크아웃 후 검증

| 항목 | 결과 |
|------|------|
| `cargo test --lib` | ✅ **983 passed / 0 failed / 1 ignored** |
| `cargo test --test svg_snapshot` | ✅ 6 passed |
| `cargo clippy --lib -- -D warnings` | ✅ clean |
| `cargo check --target wasm32-unknown-unknown --lib` | ✅ clean |

### CI 검증 (GitHub Actions)

| Check | 결과 |
|-------|------|
| CI / Build & Test | ✅ SUCCESS (2026-04-24 07:43) |
| CodeQL / Analyze (rust) | ✅ SUCCESS |
| CodeQL / Analyze (javascript-typescript) | ✅ SUCCESS |
| CodeQL / Analyze (python) | ✅ SUCCESS |
| WASM Build | SKIPPED (조건부) |

### 메인테이너 WASM 브라우저 검증 (2026-04-24)

- Docker로 WASM 재빌드: `pkg/rhwp_bg.wasm` 갱신 (17:57)
- rhwp-studio + 호스트 Chrome 에서 `samples/exam_math_8.hwp` 박스 내 큰 수식 위치 시각 확인
- 작업지시자 최종 판정: **검증 성공** — 박스 내부 line 1 위치로 정상 배치

## 리스크 평가

| 리스크 | 판정 |
|--------|------|
| 기존 run 루프와의 상호 영향 | ✅ `is_empty()` 분기로 상호 배타. 기존 동작 보존 |
| 수식 중복 렌더 | ✅ `tree.set_inline_shape_position` 으로 display 경로 차단 |
| cell_ctx 컨텍스트 처리 | ✅ 셀 내부 수식도 parent_para_index 사용. 기존 인라인과 동일 |
| `tree.next_id()` shift 영향 | ⚠️ exam_math_012.svg 의 cell-clip ID 1 shift 발생. 내용 동일, golden이 있다면 업데이트 필요 |
| wasm32 호환 | ✅ `cargo check` 통과 |

## 문서 품질

CLAUDE.md 절차 준수:

- ✅ 수행계획서: `mydocs/plans/task_m100_287.md`
- ✅ 구현계획서: `mydocs/plans/task_m100_287_impl.md`
- ✅ 단계별 보고서: `stage1.md`/`stage2.md`/`stage3.md`
- ✅ 최종 보고서: `mydocs/report/task_m100_287_report.md`
- ✅ 추가 타스크 #288 문서까지 완비 (수행계획서 + stage1/2 + 최종 보고서)
- ✅ orders 갱신: Task #287 + Task #288 섹션

## 판정

✅ **Merge 권장**

**사유:**
1. **루트 원인 추적 정확** — 초기 가설 기각 + `RHWP_DUMP_287` 실측으로 진짜 원인 발견
2. **수정 범위 최소화** — (A) 조판 엔진 리팩터링급 회피, (C) 63줄 추가로 근본 해결
3. **Phase 2 불필요 확인** — PDF Tm 실측으로 #288을 "not a bug" 확정 (눈대중 오판 회피)
4. **기존 로직 재사용** — 인라인 EquationNode 생성 코드 동일. 일관성
5. **빌드/테스트/clippy/wasm + CI 모두 통과** (983 passed)
6. **CLAUDE.md 절차 완전 준수** — 두 타스크 (#287, #288) 모두 완비

**Merge 후 후속:**
- 이슈 #287, #288 close 확인
- 브라우저 WASM 시각 검증 권장
