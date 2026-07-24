# PR #284 최종 보고서 — Task #280: 수식 SVG 폰트 스택 재정렬

## 결정

✅ **Merge 승인**

## PR 정보

- **PR**: [#284](https://github.com/edwardkim/rhwp/pull/284)
- **이슈**: [#280](https://github.com/edwardkim/rhwp/issues/280)
- **작성자**: @planet6897 (Jaeuk Ryu)
- **base/head**: `devel` ← `local/task280`
- **처리일**: 2026-04-24

## 승인 사유

1. **코드 변경 범위 최소** — 2개 파일 각 1줄 (svg_render.rs + canvas_render.rs 동기화)
2. **루트 원인 분석 명확** — Windows Cambria Math 매칭이 볼드 인상의 원인임을 정확히 식별
3. **잘못된 가설 기각 품질** — "lim 1.2x 확대 규칙" 가설을 샘플 bbox 다수 교차 비교로 기각. 판단 오류로 인한 회귀 방지
4. **설계 안전성** — `Latin Modern Math` 첫 번째 유지로 `svg.rs:332` 폰트 임베딩 파이프라인 호환성 보존
5. **하이퍼-워터폴 절차 준수** — 5단계 완료, 수행/구현 계획서 + 단계별 보고서 + 최종 보고서 모두 존재

## 검증 결과

| 항목 | 결과 |
|------|------|
| `cargo test --lib equation` | ✅ 48 passed / 0 failed |
| `cargo test --test svg_snapshot` | ✅ 3 passed |
| `cargo clippy --lib -- -D warnings` | ✅ clean |
| `cargo check --target wasm32-unknown-unknown --lib` | ✅ clean |
| `cargo test --lib` 전체 | ✅ 963 passed / 0 failed / 1 ignored |
| Mergeable | ✅ CLEAN |
| WASM Docker 빌드 | ✅ 성공 (pkg/rhwp_bg.wasm 재생성) |
| rhwp-studio 브라우저 시각 검증 | ✅ 작업지시자 검증 성공 |

## 변경 내역

- `src/renderer/equation/svg_render.rs:11` — `EQ_FONT_FAMILY` 상수 폰트 스택 재정렬
- `src/renderer/equation/canvas_render.rs:223` — `set_font` Canvas 스택 동기화
- `samples/equation-lim.{hwp,pdf}` — 재현 샘플 추가
- `mydocs/plans/task_m100_280{,_impl}.md` — 수행/구현 계획서
- `mydocs/working/task_m100_280_stage{1,2,3,4}.md` — 단계별 보고서 + PNG 증빙
- `mydocs/report/task_m100_280_report.md` — 최종 결과보고서
- `mydocs/orders/20260424.md` — Task #280 섹션 + 이슈 #283 등록 반영

## 후속 작업

- **[#283](https://github.com/edwardkim/rhwp/issues/283)** — 괄호 `(` `)` SVG path 폭 조정 (PR #285에서 처리 중)
- 두 렌더러의 폰트 스택 중복 제거 리팩터 (공용 상수 추출) — 후속 이슈 후보

## Merge 절차

1. ✅ PR 승인 코멘트 게시
2. ✅ devel로 머지 (Merge commit, squash 아님 — 5개 커밋 히스토리 보존)
3. ✅ 이슈 #280 자동 클로즈 (커밋 메시지 `Closes #280` 포함)
4. PR #285 (#283 후속) 검토로 진행
