# PR #289 최종 보고서 — Task #287: 빈 runs comp_line TAC 수식 인라인 처리

## 결정

✅ **Merge 승인**

## PR 정보

- **PR**: [#289](https://github.com/edwardkim/rhwp/pull/289)
- **이슈**: [#287](https://github.com/edwardkim/rhwp/issues/287) (+ [#288](https://github.com/edwardkim/rhwp/issues/288) 자체 closed "not a bug")
- **작성자**: @planet6897 (Jaeuk Ryu)
- **base/head**: `devel` ← `local/task287`
- **처리일**: 2026-04-24

## 승인 사유

1. **루트 원인 추적 정확** — 초기 가설 ("has_tac_shape + clamp") 을 `RHWP_DUMP_287` 로그 실측으로 기각 → 진짜 원인 (빈 runs + 인라인 경로 미진입) 발견
2. **수정 범위 최소화** — (A) vpos 파이프라인 전파 (조판 엔진 리팩터링급) 회피, (C) 63줄 추가로 근본 해결
3. **Phase 2 불필요 확인** — #288을 PDF content stream Tm 실측으로 "not a bug" 확정 (비율 0.2125 일치, 오차 0.17px). 눈대중 오판 ("PDF x≈162-182") 회피
4. **기존 인라인 로직 재사용** — EquationNode 생성 코드 완전 동일. 일관성 보장
5. **CLAUDE.md 절차 완전 준수** — 두 타스크 (#287, #288) 모두 완비

## 검증 결과

| 항목 | 결과 |
|------|------|
| `cargo test --lib` | ✅ 983 passed / 0 failed / 1 ignored |
| `cargo test --test svg_snapshot` | ✅ 6 passed |
| `cargo clippy --lib -- -D warnings` | ✅ clean |
| `cargo check --target wasm32-unknown-unknown --lib` | ✅ clean |
| CI / Build & Test | ✅ SUCCESS |
| CodeQL (rust/js/python) | ✅ 전부 SUCCESS |
| WASM Docker 빌드 | ✅ 성공 (pkg/rhwp_bg.wasm 17:57 재생성) |
| rhwp-studio 브라우저 시각 검증 | ✅ 작업지시자 검증 성공 |

## 변경 내역

**코드 (1개 파일):**
- `src/renderer/layout/paragraph_layout.rs` +63 — 빈 runs comp_line의 TAC Equation 인라인 처리 블록

**샘플:**
- `samples/exam_math_8.{hwp,pdf}` 재현 샘플

**문서:**
- `mydocs/plans/task_m100_287{,_impl}.md` — 수행/구현 계획서
- `mydocs/working/task_m100_287_stage{1,2,3}.md` — 단계별 보고서
- `mydocs/report/task_m100_287_report.md` — 최종 결과보고서
- `mydocs/plans/task_m100_288.md` — Task #288 수행계획서
- `mydocs/working/task_m100_288_stage{1,2}.md` — Task #288 단계별 보고서
- `mydocs/report/task_m100_288_report.md` — Task #288 최종 보고서 ("not a bug" 확정)
- `mydocs/orders/20260424.md` — Task #287/#288 섹션 갱신

## 효과

| 수식 | 변경 전 | 변경 후 |
|------|---------|---------|
| 박스 내 큰 cases 수식 | `translate(71.80, 147.38)` (col_area 원점) | `translate(133.27, 188.29)` (line 1 위치) |

SVG 회귀 영향:
- `exam_math_008.svg`: 동일 구조 자동 개선 (텍스트 유실 없음)
- `exam_math_012.svg`: `tree.next_id()` ID 1 shift (내용 동일)
- `equation-lim.svg`: y +0.88 px (display → 인라인 경로 baseline 미세 조정)
- 나머지 19페이지: 완전 동일

## Merge 절차

1. ✅ PR 승인 코멘트 게시
2. ✅ merge (CLEAN이므로 일반 merge)
3. ✅ 이슈 #287, #288 close 확인
4. 다음 PR #292 검토로 진행
