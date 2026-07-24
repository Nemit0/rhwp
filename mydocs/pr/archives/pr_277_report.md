# PR #277 최종 보고서 — Task #147: MEMO 컨트롤 바탕쪽 오분류 버그 수정

## 결정

✅ **Merge 승인**

## PR 정보

- **PR**: [#277](https://github.com/edwardkim/rhwp/pull/277)
- **이슈**: [#147](https://github.com/edwardkim/rhwp/issues/147)
- **작성자**: @seanshin (Shin hyoun mouk)
- **base/head**: `devel` ← `feature/task147`
- **처리일**: 2026-04-24

## 승인 사유

1. **루트 원인 정확** — `parse_master_pages_from_raw`가 `HWPTAG_LIST_HEADER`를 무조건 바탕쪽으로 분류. MEMO 컨트롤 텍스트박스도 LIST_HEADER를 쓰므로 오분류 발생
2. **수정 범위 최소** — 2개 파일, 총 10줄 (파서 +6 + 렌더러 +4)
3. **이중 방어 설계 적절** — 파서 1차 방어 (근본 해결) + 렌더러 2차 방어 (기존 데이터 호환)
4. **0×0 조건 타당** — HWP 스펙상 바탕쪽은 비-제로 영역 필수
5. **Golden SVG 등록** — 669줄 aift.hwp 4페이지 전체 스냅샷. 회귀 감지 가능

## 검증 결과

| 항목 | 결과 |
|------|------|
| `cargo test --lib` | ✅ 964 passed / 0 failed (merge 시뮬레이션) |
| `cargo test --test svg_snapshot` | ✅ 6 passed (issue_147 포함) |
| `cargo clippy --lib -- -D warnings` | ✅ clean |
| `cargo check --target wasm32-unknown-unknown --lib` | ✅ clean |
| devel 자동 merge 시뮬레이션 | ✅ Automatic merge went well (충돌 0건) |
| WASM Docker 빌드 | ✅ 성공 (pkg/rhwp_bg.wasm 16:26 재생성) |
| rhwp-studio 브라우저 시각 검증 | ✅ 작업지시자 검증 성공 |

## 변경 내역

**코드 (2개 파일, 10줄):**
- `src/parser/body_text.rs` +6 — `parse_master_pages_from_raw` LIST_HEADER text_width=0 && text_height=0 skip
- `src/renderer/layout.rs` +4 — `build_master_page` 0×0 바탕쪽 렌더링 가드

**테스트:**
- `tests/golden_svg/issue-147/aift-page3.svg` 신규 (669줄)
- `tests/svg_snapshot.rs` — `issue_147_aift_page3` 테스트 추가

## 문서 누락 사항 (후속 요청)

CLAUDE.md 절차 기준 누락:
- ⚠️ 구현계획서 `mydocs/plans/task_m100_147_impl.md`
- ⚠️ 단계별 보고서 `mydocs/working/task_m100_147_stage*.md`
- ⚠️ 최종 보고서 `mydocs/report/task_m100_147_report.md`
- ⚠️ orders에 Task #147 섹션 없음

**수행계획서 `task_m100_147.md`만 존재**. 기술적 수정은 우수하므로 merge 진행, 후속 문서 보완 요청.

## Merge 절차

1. ✅ PR 승인 코멘트 게시
2. ✅ admin merge (BEHIND 상태)
3. ✅ 이슈 #147 close
4. 레이아웃 그룹 완료 → OLE/WASM 그룹(#278) 으로 진행
