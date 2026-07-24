# PR #303 검토 — Task #301: z-table 셀 수식 이중 렌더링 수정

## PR 정보

- **PR**: [#303](https://github.com/edwardkim/rhwp/pull/303)
- **이슈**: [#301](https://github.com/edwardkim/rhwp/issues/301)
- **작성자**: @planet6897 (Jaeuk Ryu) — 어제 6번 + 오늘 첫 PR
- **base/head**: `devel` ← `task301`
- **Mergeable**: ✅ CLEAN
- **CI**: ✅ 전부 SUCCESS
- **검토일**: 2026-04-25

## 변경 요약

`samples/exam_math.hwp` 12쪽 좌측 컬럼 #29 안의 정규분포 z-table 모든 셀의 숫자/헤더 텍스트가 SVG 출력 시 **두 번 그려져 겹치던 버그** 수정.

### 핵심 변경 (1파일, 1줄)

`src/renderer/layout/table_layout.rs` +7 -2 — Equation 분기에 `tree.get_inline_shape_position()` 가드 추가:

```rust
let already_rendered_inline = tree
    .get_inline_shape_position(section_index, cp_idx, ctrl_idx)
    .is_some();
if has_text_in_para || already_rendered_inline {
    inline_x += eq_w;  // paragraph_layout 이미 렌더 → emit 스킵
} else {
    // 수식만 있는 문단: 직접 렌더
}
```

## 루트 원인 분석 (Task #287 회귀)

z-table 셀 구조: `text=""` + `Equation` 컨트롤 1개

빈 runs 셀 paragraph 의 TAC 수식이 **두 경로에서 EquationNode emit**:

1. **`paragraph_layout.rs:1996-2057`** (Task #287에서 추가) — 빈-runs 인라인 EquationNode push + `set_inline_shape_position` 호출
2. **`table_layout.rs:1602-1648`** (기존) — `has_text_in_para = false` 분기에서 직접 EquationNode push, **중복 검사 없음**

→ Task #287 도입 시 `table_layout` 측 가드 누락이 원인. Δx≈2.5/28.9, Δy≈-1.31 어긋난 두 텍스트가 겹쳐 보임.

## 설계 검증

| 설계 요소 | 평가 |
|----------|------|
| `set_inline_shape_position` 재활용 | ✅ 별도 상태(`is_rendered` 등) 추가 없이 기존 메커니즘만 활용 |
| `has_text_in_para` 가드 유지 | ✅ 코너 케이스 보조 가드로 보존 |
| 단일 OR 추가 | ✅ 1줄 추가로 회귀 해결 — 최소 수정 |
| WASM Canvas 경로 | ✅ 동일 RenderTree 사용하므로 동시 해결 |

## 메인테이너 검증 결과

### PR 브랜치 + devel merge (이미 동기화됨)

| 항목 | 결과 |
|------|------|
| `cargo test --lib` | ✅ **992 passed / 0 failed / 1 ignored** |
| `cargo test --test svg_snapshot` | ✅ 6 passed (golden 유지) |
| `cargo test --test tab_cross_run` | ✅ 1 passed (#290 회귀 없음) |
| **`cargo test --test issue_301`** | ✅ **1 passed** (z_table_equations_rendered_once 신규) |
| `cargo clippy --lib -- -D warnings` | ✅ clean |
| `cargo check --target wasm32` | ✅ clean |

### 실제 렌더 검증 (CLI SVG)

`samples/exam_math.hwp` 12쪽 z-table 셀 값 출현 횟수:

| 값 | 출현 (수정 후) | 검증 |
|------|----------------|------|
| `0.1915` | 1회 | ✅ z-table 단독 |
| `0.3413` | 1회 | ✅ z-table 단독 |
| `0.4332` | 1회 | ✅ z-table 단독 |
| `0.4772` | 2회 | ✅ z-table 1 + 본문 1 (정상) |

**작성자 주장 정확히 일치**.

### CI (원본 브랜치)

| Check | 결과 |
|-------|------|
| CI / Build & Test | ✅ SUCCESS |
| CodeQL rust/js/python | ✅ 전부 SUCCESS |

## 신규 회귀 테스트

`tests/issue_301.rs` (+44):
- z-table 값 `0.1915`/`0.3413`/`0.4332` 각 1회 출현 검증
- `0.4772` 는 본문에도 등장하므로 2회 검증
- 향후 paragraph_layout/table_layout 동기화 깨짐 즉시 감지

## 문서 품질

CLAUDE.md 절차 완전 준수:

- ✅ 수행계획서: `mydocs/plans/task_301.md`
- ✅ 구현계획서: `mydocs/plans/task_301_impl.md`
- ✅ 단계 보고서: `stage1.md` / `stage2.md` / `stage3.md`
- ✅ 최종 보고서: `mydocs/report/task_301_report.md`
- ✅ orders 갱신
- ⚠️ **파일명 규칙 미준수** — `task_301*.md` 사용 (CLAUDE.md 표준은 `task_m100_301*.md`)

## 리스크 평가

| 리스크 | 판정 |
|--------|------|
| Task #287 정상 동작 회귀 | ✅ 빈-runs 인라인 경로 유지, table_layout 은 paragraph가 처리 안 한 경우만 폴백 |
| `has_text_in_para` 정상 동작 | ✅ 기존 가드 그대로 유지 |
| Picture/Shape 유사 패턴 | ⚠️ 작성자 인지 — 본 PR 범위 외, 별도 이슈 후보 |
| Golden SVG 회귀 | ✅ svg_snapshot 6 passed |
| `set_inline_shape_position` 부작용 | ✅ 기존 호출 추가 없이 조회만 |

## 평가 포인트

1. **Task #287 회귀를 즉시 식별** — 어제 머지된 PR #289의 회귀를 다음날 발견하고 빠르게 수정
2. **최소 수정** — 1줄 OR 추가로 해결. `set_inline_shape_position` 메커니즘 재활용
3. **신규 회귀 테스트** — 향후 동일 회귀 즉시 감지
4. **정직한 교훈 기록** — "양방향 렌더 경로의 동기화 검증" 으로 절차 개선 제안

## 판정

✅ **Merge 권장**

**사유:**
1. **Task #287 회귀 정확 식별** — 두 경로(paragraph_layout/table_layout)의 비대칭성 명확히 분석
2. **최소 수정** — 1줄 OR 추가 + 기존 가드 유지
3. **신규 회귀 테스트** — `tests/issue_301.rs` 로 향후 보호
4. CI + 로컬 검증 + 실제 렌더 좌표 검증 모두 통과
5. CLAUDE.md 절차 준수 (파일명 규칙 미세 위반은 후속 보완 가능)

**Merge 후속:**
- 이슈 #301 close
- WASM 빌드 + 브라우저 시각 검증 권장 (z-table 겹침 해소 확인)
- Picture/Shape 유사 패턴은 후속 이슈 후보로 추적 가능

**파일명 규칙 미준수**: `task_301*.md` → `task_m100_301*.md` 가 표준이지만 다른 어제 PR (planet6897 본인 작업) 들과 동일 패턴이라 수용 가능. 후속 일관성 정리는 별도 작업.

### 메인테이너 WASM 브라우저 검증 (2026-04-25)

- Docker로 WASM 재빌드: `pkg/rhwp_bg.wasm` 갱신 (09:00)
- rhwp-studio + 호스트 Chrome 에서 `samples/exam_math.hwp` 12쪽 z-table 시각 확인
- 작업지시자 최종 판정: **검증 성공** — z-table 셀 텍스트 겹침 해소
