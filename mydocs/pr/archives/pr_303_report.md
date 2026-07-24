# PR #303 최종 보고서 — Task #301: z-table 셀 수식 이중 렌더링 수정

## 결정

✅ **Merge 승인**

## PR 정보

- **PR**: [#303](https://github.com/edwardkim/rhwp/pull/303)
- **이슈**: [#301](https://github.com/edwardkim/rhwp/issues/301) — Task #287 (PR #289) 회귀
- **작성자**: @planet6897 (Jaeuk Ryu)
- **처리일**: 2026-04-25
- **Merge commit**: `798b845`

## 승인 사유

1. **Task #287 회귀 즉시 식별** — 어제 머지된 PR #289의 회귀를 다음날 발견·수정
2. **최소 수정** — 1줄 OR 추가로 해결. `set_inline_shape_position` 메커니즘 재활용
3. **신규 회귀 테스트** — `tests/issue_301.rs` 로 향후 동일 회귀 즉시 감지
4. **루트 원인 명확** — paragraph_layout (Task #287) + table_layout (기존) 양방향 경로의 가드 누락 식별
5. CLAUDE.md 절차 준수 (수행/구현 계획서 + stage 1~3 + 최종 보고서)

## 검증 결과

| 항목 | 결과 |
|------|------|
| `cargo test --lib` | ✅ 992 passed / 0 failed / 1 ignored |
| `cargo test --test svg_snapshot` | ✅ 6 passed (golden 유지) |
| `cargo test --test tab_cross_run` | ✅ 1 passed |
| `cargo test --test issue_301` (신규) | ✅ 1 passed |
| `cargo clippy / wasm32 check` | ✅ clean |
| CI (원본) | ✅ 전부 SUCCESS |
| 실제 SVG z-table 출현 | ✅ 0.1915/0.3413/0.4332 각 1회, 0.4772 2회 (본문 포함) |
| WASM Docker 빌드 | ✅ 성공 (pkg/rhwp_bg.wasm 09:00) |
| rhwp-studio 브라우저 시각 검증 | ✅ 작업지시자 판정 성공 |

## 변경 내역

**코드 (1파일):**
- `src/renderer/layout/table_layout.rs` +7 -2 — Equation 분기에 `tree.get_inline_shape_position()` 가드 추가

**테스트 (신규):**
- `tests/issue_301.rs` +44 — z-table 값 출현 횟수 검증 (`z_table_equations_rendered_once`)

**문서:**
- `mydocs/plans/task_301{,_impl}.md` — 수행/구현 계획서
- `mydocs/working/task_301_stage{1,2,3}.md` — 단계별 보고서
- `mydocs/report/task_301_report.md` — 최종 보고서

## 후속 후보

- Picture/Shape 유사 패턴 (작성자 인지) — 별도 이슈 후보
- 파일명 규칙 일관성 (`task_301*.md` → `task_m100_301*.md`) — 후속 정리

## 오늘 11번째 PR 머지 완료
