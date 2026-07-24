# PR #266 검토 — Task #157: 비-TAC wrap=위아래 표 out-of-flow 배치

## PR 정보

- **PR**: [#266](https://github.com/edwardkim/rhwp/pull/266)
- **이슈**: [#157](https://github.com/edwardkim/rhwp/issues/157), [#103](https://github.com/edwardkim/rhwp/issues/103)
- **작성자**: @seanshin (Shin hyoun mouk)
- **base/head**: `devel` ← `feature/task157`
- **Mergeable**: ✅ MERGEABLE (mergeStateStatus: BEHIND — #284/#285 머지 후 devel이 앞섬, 하지만 자동 merge 가능)
- **검토일**: 2026-04-24

## 변경 요약

`samples/hwpx/issue_157.hwpx` (주주총회 참석장) 2페이지에서 본문 번호 목록과 대리인 정보 표가 같은 y 구간에 중첩되던 버그 수정. Para-relative float 표(`vert=Para`, `TopAndBottom`, `non-TAC`) 의 vpos 기준점 리셋 예외 처리로 해결.

### 핵심 변경 (코드 2개 파일)

| 파일 | 변경 | 설명 |
|------|------|------|
| `src/renderer/layout.rs` | +22 -2 | vpos 기준점 리셋 예외: Para-float 표는 초기화 제외 |
| `src/renderer/pagination/engine.rs` | +6 -1 | effective_table_height 방어: body 범위 내 완전 포함 시 0.0 |

### 테스트
- `tests/golden_svg/issue-157/page-1.svg` 신규 (507줄)
- `tests/svg_snapshot.rs` 에 `issue_157_page_1` 테스트 추가

## 루트 원인 분석

### layout.rs vpos 기준점 리셋 로직

```rust
// BEFORE: 표/Shape 처리 후 무조건 vpos 기준점 리셋
if was_tac || is_table_or_shape {
    vpos_page_base = None;
    vpos_lazy_base = None;
}
```

**문제**: Para-relative float 표(vert=Para, TopAndBottom, non-TAC)는 앵커 문단에 attach 되어야 하는데 vpos 기준점이 초기화되면 후속 문단의 vpos가 **잘못된 lazy_base로 교정** → 앵커 y가 body_bottom에 clamp → 표가 텍스트와 중첩.

### 수정

```rust
// AFTER: Para-float 표는 예외 처리
let is_para_float_table = matches!(c,
    Control::Table(t)
    if !t.common.treat_as_char
        && matches!(t.common.text_wrap, TextWrap::TopAndBottom)
        && matches!(t.common.vert_rel_to, VertRelTo::Para)
);
if was_tac || (is_table_or_shape && !is_para_float_table) {
    vpos_page_base = None;
    vpos_lazy_base = None;
}
```

**결과**: 표 y 894.7px(clamp) → 819.2px(정상), LAYOUT_OVERFLOW 9.6px 해소.

### engine.rs effective_table_height 방어

```rust
let abs_bottom = para_start_height + v_off + effective_height + host_spacing;
if abs_bottom <= base_available_height + 0.5 {
    // 표가 body 범위 내에 완전히 들어옴 → flow height 기여 없음
    0.0
} else {
    (abs_bottom - st.current_height).max(effective_height + host_spacing)
}
```

앵커 문단 이후 body에서 표가 완전히 들어올 때 **flow height 기여를 0으로 둠** — 페이지네이션 경계 판단에서 표 공간을 이중으로 차지하지 않도록 방어.

## 설계 검증

| 설계 요소 | 평가 |
|----------|------|
| Para-float 정의 조건 | ✅ `!treat_as_char && TopAndBottom && VertRelTo::Para` 삼항 AND. 다른 조건(TAC, vert=Page)과 명확히 구분 |
| vpos 리셋 예외 scope | ✅ `is_para_float_table` 일 때만 예외. TAC 표/Shape는 기존 로직 유지 |
| engine.rs 0.5 tolerance | ✅ `abs_bottom <= base_available_height + 0.5` — 부동소수점 오차 대응. 타당한 범위 |
| golden SVG 등록 | ✅ 507줄 — issue_157 페이지 전체 렌더 결과 보존. 향후 회귀 즉시 감지 |
| #103과의 관계 | ✅ #157은 중첩 케이스, #103은 gap 케이스로 다르나 동일 근본 원인(Para-float 표 처리). 동시 해결 |

## 메인테이너 검증 결과

### PR 브랜치 체크아웃 후 검증

| 항목 | 결과 |
|------|------|
| `cargo test --test svg_snapshot` | ✅ 4 passed / 0 failed (issue_157 포함) |
| `cargo test --lib` 전체 | ✅ 963 passed / 0 failed / 1 ignored |
| `cargo clippy --lib -- -D warnings` | ✅ clean |
| `cargo check --target wasm32-unknown-unknown --lib` | ✅ clean |

### devel 자동 merge 시뮬레이션

BEHIND 상태이지만 충돌 없음. 머지 후 시뮬레이션 테스트:

| 항목 | 결과 |
|------|------|
| `git merge origin/devel` | ✅ Automatic merge went well (충돌 0건) |
| 머지 상태 `cargo test --lib` | ✅ 964 passed / 0 failed / 1 ignored |
| 머지 상태 `cargo test --test svg_snapshot` | ✅ 4 passed (issue_157 + #285 신규 포함) |

**#284/#285와 완전 독립** — 수식 렌더러와 레이아웃 엔진은 다른 모듈이므로 간섭 없음.

### 메인테이너 WASM 브라우저 검증 (2026-04-24)

- Docker로 WASM 재빌드: `pkg/rhwp_bg.wasm` 갱신 (15:11)
- rhwp-studio (Vite 7700) + 호스트 Chrome 에서 `samples/hwpx/issue_157.hwpx` 2페이지 시각 확인
- 작업지시자 최종 판정: **검증 성공** — 본문 번호 목록과 대리인 정보 표 중첩 해소 확인

## 리스크 평가

| 리스크 | 판정 |
|--------|------|
| Para-float 예외 scope 정의 오류 | ✅ 3-조건 AND로 엄격하게 한정 (non-TAC + TopAndBottom + VertRelTo::Para). 다른 표 케이스 영향 없음 |
| TAC 표/Shape 회귀 | ✅ `!is_para_float_table` 조건으로 기존 로직 유지. 기존 golden 3건 영향 없음 |
| engine.rs 0.5 tolerance 오판 | ⚠️ 부동소수점 tolerance 타당하지만, 표 높이가 정확히 body 경계와 일치하는 극단 케이스에서 분기가 바뀔 수 있음. golden SVG 회귀로 감지 가능 |
| Backward compatibility | ✅ 조건 추가만, 기존 동작 변경 없음 |
| wasm32 호환 | ✅ `cargo check` 통과 |

## 문서 품질

CLAUDE.md 절차 준수:

- ✅ 수행계획서: `mydocs/plans/task_m100_157.md`
- ✅ 구현계획서: `mydocs/plans/task_m100_157_impl.md`
- ✅ 단계별 보고서: `mydocs/working/task_m100_157_stage1.md`
- ⚠️ 단계 보고서가 stage1.md 1개만 — 구현 계획서에 여러 단계가 있었다면 stage2/3이 있어야 함. 확인 필요
- ⚠️ 최종 보고서 `mydocs/report/task_m100_157_report.md` **누락** (PR diff에 없음)

CLAUDE.md 기준으로 최종 보고서가 누락됐으나 **코드 수정과 검증이 양호**하므로 merge 후 작성자에게 후속 제출 요청 가능.

## 브랜치 상태

- **base**: PR #266이 `a4bf19d` (#265 merge 지점) 에서 분기
- **BEHIND 원인**: #284/#285 머지로 devel이 2 commit 앞섬
- **충돌**: 없음 (변경 파일이 겹치지 않음 — 수식 모듈 vs 레이아웃 모듈)
- **해결**: merge 시 GitHub이 자동으로 merge commit 생성

## 판정

✅ **Merge 권장**

**사유:**
1. **루트 원인 분석 정확** — vpos 기준점 리셋이 Para-float 표를 잘못 교정한 핵심 문제 식별
2. **수정 범위 명확** — 2개 파일, 조건 추가만으로 해결 (기존 로직 보존)
3. 빌드/테스트/clippy/wasm 모두 통과 (시뮬레이션 머지 상태 **964 passed**)
4. **golden SVG 등록** — 향후 회귀 즉시 감지
5. #103과 #157 동시 해결 (근본 원인 공유)

**Merge 후 후속:**
- 이슈 #157, #103 모두 close (PR 메시지 `Fixes #157, #103`)
- 작성자에게 `mydocs/report/task_m100_157_report.md` 최종 보고서 제출 요청 (누락)
- 브라우저 WASM 시각 검증 권장 (주주총회 참석장 샘플)
