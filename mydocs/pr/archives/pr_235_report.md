---
name: PR #235 처리 결과 보고서
description: 외부 기여자 @planet6897 PR #235 (Task #229) 재제출 검토 및 merge 결정
type: pr
---

# PR #235 처리 결과 보고서

## PR 정보

| 항목 | 내용 |
|------|------|
| PR 번호 | [#235](https://github.com/edwardkim/rhwp/pull/235) |
| 제목 | Task #229: 표 셀 긴 숫자 텍스트 겹침/셀 폭 미사용 해결 + narrow glyph 역진 방지 |
| 작성자 | [@planet6897](https://github.com/planet6897) (Jaeuk Ryu) |
| 연관 이슈 | closes [#229](https://github.com/edwardkim/rhwp/issues/229) |
| base ← head | `edwardkim/rhwp:devel` ← `planet6897/rhwp:devel` |
| 처리 | **Merge 승인 대기** |
| 처리일 | 2026-04-22 |

## 처리 경위

### 1차 검토 (2026-04-22 오전)

- 코드 품질, 설계, 테스트 통과, CI 상태 모두 완벽
- 한컴의 `letter_spacing` 저장 의도를 정확히 파악하고 반대 방향 보정을 구현한 도메인 이해도 탁월
- narrow glyph per-char 클램프, 수렴 반복(3회), Visual Diff 파이프라인 모두 인상적
- **단, 문서 파일명/위치 규칙 불일치 6건 발견 → 재제출 요청**

주요 지적 사항:
- `task_bug_240` → `task_m100_240` (접두어 표준화)
- `task_m100_229_fix` → `task_m100_229` (접미어 제거, 후속 수정은 `_v2` 사용)
- 최종 보고서(`_report.md`) 위치를 `working/` → `report/` 로
- `orders/20260422_issue_bmp_svg_render.md` → `troubleshootings/bmp_svg_render.md` 로 이동

### 2차 재제출 (2026-04-22 13:36 UTC)

기여자가 정확히 6건 모두 반영하여 단일 커밋(`5d0fd3e docs: 문서 파일명/위치 규칙 준수 (#229 #240)`)으로 재push. CI 전 항목 통과.

## 검증 결과

### 문서 규칙 점검 — 전 항목 이행

| 지적 항목 | 이전 | 재제출 후 | 결과 |
|----------|------|----------|-----|
| plans/ — task_bug_240 | `task_bug_240.md` | `task_m100_240.md` | ✅ |
| plans/ — task_bug_240_impl | `task_bug_240_impl.md` | `task_m100_240_impl.md` | ✅ |
| plans/ — task_m100_229_fix | `task_m100_229_fix.md` | `task_m100_229.md` | ✅ |
| plans/ — task_m100_229_fix_impl | `task_m100_229_fix_impl.md` | `task_m100_229_impl.md` | ✅ |
| report/ 위치 (task240) | `working/task_bug_240_report.md` | `report/task_m100_240_report.md` | ✅ |
| report/ 위치 (task229) | `working/task_m100_229_fix_report.md` | `report/task_m100_229_report.md` | ✅ |
| working/ stage 파일명 | `task_bug_240_stage{1,2,3}.md` | `task_m100_240_stage{1,2,3}.md` | ✅ |
| orders/ 정리 | `orders/20260422_issue_bmp_svg_render.md` | `troubleshootings/bmp_svg_render.md` | ✅ |

### CI 상태 (GitHub Actions)

| Check | 결과 | 소요 |
|-------|-----|------|
| Analyze (javascript-typescript) | pass | 1m19s |
| Analyze (python) | pass | 1m08s |
| Analyze (rust) | pass | 3m34s |
| Build & Test | pass | 3m07s |
| CodeQL | pass | 2s |
| WASM Build | skipping | paths-ignore |

### 로컬 검증

| 항목 | 결과 |
|------|------|
| `cargo clippy -- -D warnings` | ✅ 통과 (warning 0건) |
| `cargo test` (전체) | ✅ **983 passed, 0 failed, 1 ignored** |
| — lib tests | 941 passed |
| — integration | 14 + 25 + 3 passed |
| Mergeable | ✅ clean |
| baseRefName / headRefName | `devel` ← `planet6897:devel` |

## 코드 변경 요약

소스 수정 (src/renderer/layout/):

| 파일 | +add | -del |
|------|------|------|
| paragraph_layout.rs | +76 | -8 |
| shape_layout.rs | +12 | -2 |
| table_cell_content.rs | +13 | -6 |
| table_layout.rs | +62 | -5 |
| table_partial.rs | +12 | -5 |
| text_measurement.rs | +120 | 0 |
| svg.rs | +35 | -4 |
| svg/tests.rs | +44 | 0 |

골든 스냅샷:
- `tests/golden_svg/form-002/page-0.svg` (+695/-695) — letter_spacing 변경에 따른 좌표 재생성
- `tests/golden_svg/table-text/page-0.svg` (+209/0) — 신규

## 기능 평가

Task #229는 표 셀 내 긴 숫자 텍스트의 **겹침/폭 미사용 + narrow glyph 역진** 문제를 해결하는 렌더링 품질 개선입니다. 금융/통계 문서에서 빈번히 발생하는 실제 버그로, rhwp의 출력 정합성을 한 단계 끌어올리는 의미 있는 기여입니다.

기여자는 한컴이 `letter_spacing`을 폰트 메트릭 차이 보정을 위해 미리 계산해서 저장한다는 점을 이해하고, rhwp의 자체 폰트 메트릭 환경에서 반대 방향(양수 자간)으로 재보정하는 접근을 택했습니다. 이는 HWP 스펙 문서에는 드러나지 않는 **암묵적 저장 의도**를 읽어낸 것으로, 이 도메인에 상당한 시간을 투자하신 분임을 시사합니다.

## 판단

**Merge 승인 대기.** 작업지시자 최종 승인 후 merge 진행.

- 코드 품질: 완벽
- 테스트: 983 passed / 0 failed
- CI: 전 항목 pass
- 문서 규칙: 재제출 후 전 항목 이행
- 남은 문제: 없음

## 커뮤니케이션 방향

merge 후 @planet6897 님께:
1. 문서 규칙 정리 감사
2. 앞으로도 계속 기여 환영 의사 전달
3. 이 PR이 rhwp의 표 렌더링 품질에 기여한 바 명시

## 참고 링크

- [PR #235](https://github.com/edwardkim/rhwp/pull/235)
- [1차 리뷰 코멘트](https://github.com/edwardkim/rhwp/pull/235#issuecomment-4295868949)
- [이전 검토 문서](./pr_235_review.md)
- [이전 구현 계획서](./pr_235_review_impl.md)

## 후속 작업

Merge 완료 후:
1. 이 보고서와 `pr_235_review.md`, `pr_235_review_impl.md`를 `mydocs/pr/archives/` 로 이동
2. Issue #229, #240 자동 close 확인 (`closes #` 트리거)
3. 오늘할일(`orders/20260422.md`)에 PR #235 merge 기록
