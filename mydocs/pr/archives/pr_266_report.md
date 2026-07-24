# PR #266 최종 보고서 — Task #157: 비-TAC wrap=위아래 표 out-of-flow 배치

## 결정

✅ **Merge 승인**

## PR 정보

- **PR**: [#266](https://github.com/edwardkim/rhwp/pull/266)
- **이슈**: [#157](https://github.com/edwardkim/rhwp/issues/157), [#103](https://github.com/edwardkim/rhwp/issues/103)
- **작성자**: @seanshin (Shin hyoun mouk)
- **base/head**: `devel` ← `feature/task157`
- **처리일**: 2026-04-24

## 승인 사유

1. **루트 원인 분석 정확** — vpos 기준점 리셋 로직이 Para-relative float 표를 잘못 교정한 핵심 문제 식별
2. **수정 범위 타이트** — 2개 파일, 조건 추가만으로 해결 (`is_para_float_table` 3-조건 AND 엄격 한정)
3. **Golden SVG 등록** — 507줄 전체 페이지 렌더 결과 스냅샷. 향후 회귀 즉시 감지
4. **#284/#285와 완전 독립** — 레이아웃 모듈이 수식 모듈과 간섭 없음. 자동 merge 안전
5. **#103과 #157 동시 해결** — 근본 원인 공유 (Para-float 표의 잘못된 flow 편입)

## 검증 결과

| 항목 | 결과 |
|------|------|
| `cargo test --test svg_snapshot` | ✅ 4 passed / 0 failed (issue_157 포함) |
| `cargo test --lib` | ✅ 963 passed / 0 failed / 1 ignored |
| `cargo clippy --lib -- -D warnings` | ✅ clean |
| `cargo check --target wasm32-unknown-unknown --lib` | ✅ clean |
| devel 자동 merge 시뮬레이션 | ✅ Automatic merge went well (충돌 0건) |
| merge 상태 `cargo test --lib` | ✅ 964 passed / 0 failed / 1 ignored |
| merge 상태 svg_snapshot | ✅ 4 passed |
| WASM Docker 빌드 | ✅ 성공 (pkg/rhwp_bg.wasm 15:11 재생성) |
| rhwp-studio 브라우저 시각 검증 | ✅ 작업지시자 검증 성공 |

## 변경 내역

**코드 (2개 파일):**
- `src/renderer/layout.rs` +22 -2 — vpos 기준점 리셋 예외 (Para-float 표)
- `src/renderer/pagination/engine.rs` +6 -1 — effective_table_height 방어 (body 범위 내 완전 포함 시 0.0)

**테스트:**
- `tests/golden_svg/issue-157/page-1.svg` 신규 (507줄)
- `tests/svg_snapshot.rs` — `issue_157_page_1` 테스트 추가

**문서:**
- `mydocs/plans/task_m100_157{,_impl}.md` — 수행/구현 계획서
- `mydocs/working/task_m100_157_stage1.md` — 단계 보고서

## 문서 누락 사항 (후속)

CLAUDE.md 절차 기준 누락:
- ⚠️ 최종 보고서 `mydocs/report/task_m100_157_report.md` 미제출
- ⚠️ stage1.md 1개만 존재 (구현 계획에 더 많은 단계 있었다면 stage2/3 누락)

코드 변경과 검증이 양호하여 merge 진행하되, 작성자에게 후속 제출 요청 코멘트 게시.

## Merge 절차

1. ✅ PR 승인 코멘트 게시 (최종 보고서 후속 요청 포함)
2. ✅ devel로 머지
3. ✅ 이슈 #157, #103 자동/수동 클로즈 확인
4. 레이아웃 그룹 다음 PR #273 (right tab 선행 공백) 검토로 진행
