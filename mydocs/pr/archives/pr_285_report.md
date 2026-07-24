# PR #285 최종 보고서 — Task #283: 파렌 path → 폰트 글리프 전환

## 결정

✅ **Merge 승인**

## PR 정보

- **PR**: [#285](https://github.com/edwardkim/rhwp/pull/285)
- **이슈**: [#283](https://github.com/edwardkim/rhwp/issues/283) (#280 Phase 2)
- **작성자**: @planet6897 (Jaeuk Ryu)
- **base/head**: `devel` ← `local/task283`
- **처리일**: 2026-04-24
- **선행 PR**: #284 (Task #280, merge commit 37921ed)

## 승인 사유

1. **조사 품질 최상** — 6개 변형 프로토타입 실측 비교로 "path 튜닝 vs 글리프 전환" 판단. 단일 제어점 quadratic Bezier의 수학적 한계까지 근거 제시.
2. **실측 기반 수치 결정** — Chrome headless로 Times `(` advance 4.89px (em 0.333) 측정 → `paren_w = fs * 0.333` 적용
3. **안전한 범위 한정** — 텍스트 높이(`body.height ≤ fs * 1.2`)에만 글리프, 스트레치는 기존 path. Matrix arm은 변경 없음
4. **SVG/Canvas 동기** — 두 렌더러 모두 동일 분기 로직
5. **하이퍼-워터폴 절차 완전 준수** — 5단계 + 단계 2 프로토타입 6안 시각 기록

## 검증 결과

| 항목 | 결과 |
|------|------|
| `cargo test --lib equation` | ✅ 49 passed / 0 failed (신규 `test_paren_stretch_svg`) |
| `cargo test --test svg_snapshot` | ✅ 3 passed |
| `cargo clippy --lib -- -D warnings` | ✅ clean |
| `cargo check --target wasm32-unknown-unknown --lib` | ✅ clean |
| `cargo test --lib` 전체 | ✅ 964 passed / 0 failed / 1 ignored |
| Mergeable | ✅ CLEAN |
| WASM Docker 빌드 | ✅ 성공 (pkg/rhwp_bg.wasm 13:00 재생성) |
| rhwp-studio 브라우저 시각 검증 | ✅ 작업지시자 검증 성공 |

## 변경 내역

**코드 (3개 파일):**
- `src/renderer/equation/layout.rs:832` — `paren_w: fs * 0.3 → fs * 0.333`
- `src/renderer/equation/svg_render.rs` — Paren arm 높이 분기 (`<text>` vs path)
- `src/renderer/equation/canvas_render.rs` — 동일 분기 (SVG/Canvas 동기)

**테스트:**
- `test_paren_svg` — `<text>` assert로 의미 갱신
- `test_paren_stretch_svg` — 스트레치 경로 신규 테스트

**문서·증빙:**
- `mydocs/plans/task_m100_283{,_impl}.md` — 수행/구현 계획서
- `mydocs/working/task_m100_283_stage{1,2,3,4}.md` — 단계별 보고서
- `mydocs/working/task_m100_283_stage1/` — Times 실측 데이터 + metrics
- `mydocs/working/task_m100_283_stage2/variants/` — 6개 변형 프로토타입 PNG/SVG
- `mydocs/working/task_m100_283_stage4/` — 3면 비교 PNG + exam_math 4페이지 회귀
- `mydocs/report/task_m100_283_report.md` — 최종 결과보고서
- `mydocs/orders/20260424.md` — Task #283 섹션 갱신

## 후속 과제 (범위 외, 별도 이슈 후보)

- 기타 괄호 `{`, `[`, `|` 글리프 전환 (동일 패턴 확장)
- 스트레치 path 품질 개선 (cubic Bezier / 다중 세그먼트 재설계)
- `LayoutKind::Matrix` arm 동일 임계치 적용

## Merge 절차

1. ✅ PR 승인 코멘트 게시
2. ✅ devel로 머지
3. ✅ 이슈 #283 자동/수동 클로즈
4. 수식 그룹 완료 → 레이아웃 그룹(#266/#273/#277) 검토로 진행
