# PR #285 검토 — Task #283: 파렌 path → 폰트 글리프 전환 (moon 형상 제거)

## PR 정보

- **PR**: [#285](https://github.com/edwardkim/rhwp/pull/285)
- **이슈**: [#283](https://github.com/edwardkim/rhwp/issues/283) (#280 Phase 2)
- **작성자**: @planet6897 (Jaeuk Ryu)
- **base/head**: `devel` ← `local/task283`
- **Mergeable**: ✅ MERGEABLE / CLEAN
- **검토일**: 2026-04-24
- **선행 PR**: #284 (Task #280, merge commit 37921ed) — 이미 merge됨

## 변경 요약

수식 괄호 `(` `)` 가 path로 그려져 "얇은 moon" 형상으로 보이던 문제를 **텍스트 높이 파렌은 폰트 글리프로 전환**하여 해결. 스트레치 파렌(분수/행렬 감쌈)은 기존 path 유지.

### 핵심 변경 (코드 3개 파일)

| 파일 | 변경 |
|------|------|
| `src/renderer/equation/layout.rs:832` | `paren_w: fs * 0.3 → fs * 0.333` (Times advance 매치) |
| `src/renderer/equation/svg_render.rs` | `Paren` arm 높이 분기: `body.height ≤ fs * 1.2 && ({/})` → `<text>` 글리프, 그 외 → 기존 path |
| `src/renderer/equation/canvas_render.rs` | 동일 분기 (SVG/Canvas 동기) |

### 분기 로직

```rust
let paren_w = fs * 0.333;
let use_glyph = lb.height <= fs * 1.2;
if use_glyph && (bracket == "(" || bracket == ")") {
    // <text>(</text> 또는 ctx.fill_text
} else {
    draw_stretch_bracket(...);  // 기존 path 유지
}
```

## 루트 원인 분석

`samples/equation-lim.hwp` 의 `f(2+h)` 렌더 결과:
- 박스 할당 폭 `fs * 0.3 = 4.40px`
- 실제 곡선 시각 폭 `1.54px` (Times bbox의 31%)
- 나머지 69%가 whitespace → 글자와 gap, "얇은 moon" 형상

Times `(` 실측 (Chrome headless: canvas.measureText + svg.getBBox):
- advance **4.89px** (em 0.333), bbox 5.0 × 14.0
- 폭 꽉 참

→ `paren_w = fs * 0.333` 로 상향 조정 (글리프 advance 매치) + 텍스트 높이에서는 글리프 사용.

## 조사 품질 — 6개 변형 프로토타입 비교

이 PR의 실질적 가치. "path 튜닝으로 해결 가능한가" 를 추측하지 않고 6개 변형을 실제 렌더해 검증:

| 변형 | 결과 |
|------|------|
| 0 (baseline) | 얇은 moon (현재) |
| 1 (A_conservative, path 제어점 튜닝) | moon 유지 |
| 2 (A_aggressive, 더 큰 제어점 이동) | moon 유지 |
| 3 (**B_glyph**, 폰트 글리프 전환) | ✅ Times 일관성 |
| 4 (extra_A) | moon 유지 |
| 5 (extra_B) | moon 유지 |

**결론**: 단일 제어점 quadratic Bezier는 수학적으로 대칭 moon만 생성 — 제어점 이동만으로 Times의 비대칭 bowl + 세리프 끝단 재현 불가. 글리프 전환만이 폰트와 일관된 타이포그래피 제공.

PDF 레퍼런스 비교에도 실제 이미지를 첨부하여 근거가 명확.

## 설계 검증

| 설계 요소 | 평가 |
|----------|------|
| 임계치 `fs * 1.2` | ✅ 텍스트 높이 파렌(단순 괄호)와 스트레치(분수/행렬) 경계로 타당. `exam_math.hwp` 4페이지 시각 회귀에서 의도대로 분기 확인. |
| `LayoutKind::Matrix` arm 변경 없음 | ✅ 행렬은 항상 스트레치 path가 올바른 선택. 일관성 유지. |
| 대상 글리프 `{(, )}` 제한 | ✅ `{`, `[`, `|` 등은 Phase 2 범위 밖으로 명시적 분리. 차후 동일 패턴 확장 가능. |
| SVG/Canvas 동기 수정 | ✅ 두 렌더러 모두 동일 분기 로직 적용. |
| 레이아웃 (`layout.rs`) `paren_w` 공통화 | ✅ 글리프/path 어느 경로든 동일 폭 할당 → 레이아웃 일관성. |

## 메인테이너 검증 결과

`cargo` 로컬 검증 (PR 브랜치 체크아웃 후):

| 항목 | 결과 |
|------|------|
| `cargo test --lib equation` | ✅ **49 passed / 0 failed** (신규 `test_paren_stretch_svg` 포함) |
| `cargo test --test svg_snapshot` | ✅ **3 passed / 0 failed** |
| `cargo clippy --lib -- -D warnings` | ✅ clean |
| `cargo check --target wasm32-unknown-unknown --lib` | ✅ clean |
| `cargo test --lib` 전체 | ✅ **964 passed / 0 failed / 1 ignored** (#284의 963 + 신규 1) |
| Mergeable | ✅ CLEAN (선행 #284 merge 후 재계산) |

## 테스트 갱신 적정성

`test_paren_svg` 는 이전에 `<path>` 존재를 assert 했으나, 이제 글리프로 바뀌므로 **`<text>` assert + `<path>` 부재 assert** 로 갱신. 논리적으로 올바른 업데이트.

신규 `test_paren_stretch_svg` 는 **스트레치 파렌이 `<path>` 유지**를 검증 — 분기 로직 양 경로 모두 테스트 커버리지 확보.

## 브랜치 구조 참고

PR #285 브랜치(`local/task283`)는 선행 #284 커밋 5개를 포함한 상태로 생성됨. #284 merge 후 Git이 자동으로 중복 커밋을 인식하여 **3-dot diff 기준 #283 관련 파일만 남음** (44개 파일, rust 3개 + 문서/PNG 41개). merge 자체는 CLEAN 상태.

## 문서 품질

CLAUDE.md 절차 준수:

- ✅ 수행계획서: `mydocs/plans/task_m100_283.md`
- ✅ 구현계획서: `mydocs/plans/task_m100_283_impl.md`
- ✅ 단계별 보고서: `stage1.md` ~ `stage4.md`
- ✅ 단계 1 실측 데이터: `stage1/metrics.md`, `glyph_metrics.json`
- ✅ 단계 2 프로토타입: `stage2/variants/` 6안 PNG/SVG
- ✅ 최종 보고서: `mydocs/report/task_m100_283_report.md`
- ✅ orders 갱신: `mydocs/orders/20260424.md` Task #283 섹션

## 시각 회귀 검증 (작성자 증빙)

- `samples/equation-lim.hwp`: BEFORE/AFTER/PDF 3면 비교 (`stage4/compare.png`)
  - BEFORE: 얇은 moon, 글자와 gap
  - AFTER: Times 글리프, 글자와 자연 밀착 → PDF 레퍼런스와 근접
- `samples/exam_math.hwp` 4페이지 회귀:
  - 텍스트 높이 파렌 (`f(x)`, `P(A|B)`) → 글리프 정상
  - 스트레치 파렌 (`P(A∪B)`, 분수 감쌈) → 기존 path 보전
  - 임계치 `fs * 1.2` 분기 정상 작동

SVG 실측: `<path>` 4건 → 0건, `<text>(/)` 4건 신규 (`equation-lim.hwp` 기준)

**메인테이너 WASM 브라우저 검증 (2026-04-24):**
- Docker로 WASM 재빌드: `pkg/rhwp_bg.wasm` 갱신 (13:00)
- rhwp-studio (Vite 7700) + 호스트 Chrome 에서 실기기 시각 확인
- 작업지시자 최종 판정: **검증 성공** — 파렌 글리프 렌더링 정상

## 리스크 평가

| 리스크 | 판정 |
|--------|------|
| 레이아웃 영향 (paren_w 0.3 → 0.333) | ✅ 미세 확대(10%). 폰트 글리프 advance와 매치되어 오히려 자연스러워짐. `exam_math.hwp` 4페이지 회귀에서 문제 없음. |
| 스트레치 파렌 회귀 | ✅ 임계치 `fs * 1.2` + 글리프 제한(`(`, `)`)으로 안전. Matrix/분수 감쌈은 기존 path 유지. |
| 폰트 스택 의존성 | ✅ `EQ_FONT_FAMILY`(#284 스택) 사용. Latin Modern Math → Times New Roman 체인. |
| wasm32 호환 | ✅ `cargo check --target wasm32` 통과. |
| 기타 괄호(`{`, `[`, `\|`) 일관성 | ⚠️ 범위 밖. 동일 패턴 확장이 후속 과제로 명시됨. |

## 범위 외 후속 과제

PR에서 명시적으로 분리:
- 기타 괄호 `{`, `[`, `|` 글리프 전환 (동일 패턴 확장)
- 스트레치 path 품질 개선 (cubic Bezier / 다중 세그먼트 재설계)
- `LayoutKind::Matrix` arm 동일 임계치 적용 (현재 항상 path)

## 판정

✅ **Merge 권장**

**사유:**
1. **조사 품질 최상** — 단순 튜닝/글리프 전환 중 추측 없이 6개 변형 프로토타입으로 실증
2. **변경 범위 명확** — 3개 파일, 임계치 분기 로직만 추가. 레이아웃/스트레치 경로 보존
3. 빌드/테스트/clippy/wasm 모두 통과 (**964 passed**)
4. 테스트 갱신 논리적 (`test_paren_svg` 의미 업데이트 + 신규 스트레치 테스트)
5. CLAUDE.md 하이퍼-워터폴 절차 완전 준수
6. 범위 분리 명확 (기타 괄호/path 재설계/Matrix arm은 후속 이슈 후보로 명시)

**브라우저 WASM 시각 검증은 추가로 확인 권장** (PR #284와 동일한 절차).
