# PR #343 검토 — Task #321~#332 통합 정리 + vpos/cell padding 회귀 해소

## PR 정보

| 항목 | 내용 |
|------|------|
| PR 번호 | [#343](https://github.com/edwardkim/rhwp/pull/343) |
| 작성자 | [@planet6897](https://github.com/planet6897) (Jaeuk Ryu) |
| 이슈 | [#342](https://github.com/edwardkim/rhwp/issues/342) (OPEN) |
| base/head | `devel` ← `local/task342` |
| **변경** | **+3,649 / -530, 42 파일** |
| Mergeable | ✅ CLEAN |
| CI | ✅ 모두 SUCCESS |
| maintainerCanModify | ✅ true |
| 검토일 | 2026-04-26 |

## PR 의 본질

**Task #321~#332 누적 작업 + 회귀 2건 핀포인트 revert 통합 PR**.

- PR #323 (Task #321 vpos-reset) close 후 작성자가 v2~v6 정밀화 + Task #322~#332 누적
- 통합 정리하면서 stage3a/3b 회귀 (exam_math/21_언어) 와 Task #13 cell padding 회귀 식별 → 핀포인트 revert
- 회귀 revert 코드 변경은 작음 (`layout.rs +137/-30`, `table_layout.rs +11/-2`) — 그러나 typeset.rs +176 등 누적 영향 큼

## 변경 파일 (42)

### 코드 (6)

| 파일 | 라인 | 영향 |
|------|------|------|
| `src/document_core/commands/text_editing.rs` | +32/-25 | 누적 |
| `src/renderer/layout.rs` | **+137/-30** | Task #321 v2~v6 + #332 stage3a/3b revert |
| `src/renderer/layout/paragraph_layout.rs` | +37/-27 | 누적 |
| `src/renderer/layout/shape_layout.rs` | +10/-0 | Task #321 v3 Paper 도형 가드 |
| `src/renderer/layout/table_layout.rs` | +11/-2 | Task #13 cell padding aim 회귀 revert |
| `src/renderer/typeset.rs` | **+176/-6** | Task #332 stage1~5 typeset/layout advance 정합 |

### 골든 SVG 변경 (3)

| 파일 | 라인 | 메인테이너 분석 |
|------|------|----------------|
| `tests/golden_svg/issue-147/aift-page3.svg` | ±7 | rect height 약간 감소 (-2.6px) — 미세 |
| `tests/golden_svg/issue-157/page-1.svg` | **±388 (대규모)** | 모든 cell-clip y 좌표 **-9.6px shift** (예: y=246.43→236.83). 표 전체가 9.6px 위로 이동. **trailing line_spacing 9.55px 처리 변경의 직접 결과** |
| `tests/golden_svg/issue-267/ktx-toc-page.svg` | ±45 | **KTX 목차 페이지번호 right edge 가 690.76→707.77 로 +17.01px 우측 이동**. leader x2 도 686.09→703.11 |

### 문서 (33)

Task #321 v2~v6 + Task #332 stage1~5 + #318 보고서 등 누적. 트러블슈팅 1건 신규.

## ⚠️ 주요 우려 사항

### 1. KTX 목차 (#279) 결과 회귀 가능성

본 메인테이너가 직접 마무리한 **Task #279 (PR #282 인수)** 의 핵심 결과:
- 한 자리 페이지번호 ("3", "4"): x=690.76 (모든 페이지번호 right edge ≈ 700.0 정렬)
- leader x2: 686.09 (페이지번호 직전 + space_gap)
- inner_area 우측 끝 = 699.76 (셀 padding_right 영역 침범 차단)

본 PR 후:
- 페이지번호 x: **707.77** (+17.01px)
- leader x2: **703.11** (+17.02px)
- inner_area 우측 끝 (699.76) 침범 가능성

작업지시자가 시각 검증으로 통과시킨 정렬이 **본 PR 로 깨질 가능성** 이 있음. 작성자에게 의도 확인 + 한컴 PDF 와의 비교 결과 요청 필요.

### 2. issue-157 의 -9.6px 표 shift

trailing line_spacing 9.55px revert 효과가 표 shape 위치에도 영향 → 의도된 결과인지 작성자 stage 보고서 확인 필요. issue-157 page-1 의 시각적 검증 결과가 어디 있는지 추적해야 함.

### 3. 대규모 코드 변경의 잠재 회귀

`typeset.rs +176`, `layout.rs +137` 은 우리가 이전에 처리한 #279, #324, #340 의 영향 영역과 겹침. 작성자가 보고한 회귀 (exam_math p2, 21_언어 p1, p2) 외에 잠재 회귀 가능.

## 처리 방향 (B 옵션 — 작성자에게 확인 요청)

작업지시자 결정에 따라 본 PR 그대로 검토 진행하지 않고 다음을 작성자에게 먼저 확인:

### Q1. KTX 목차 페이지번호 위치 변경 의도

본 PR 후 KTX 목차 페이지번호 x 가 `690.76 → 707.77` (+17.01px) 이동. Task #279 (PR #282) 마무리 시 "**모든 페이지번호 right edge ≈ 700.0 정렬**" 이 작업지시자 시각 검증으로 통과한 결과.

질문:
- 본 PR 의 KTX 목차 변경이 **의도된 것**인가?
- 한컴 PDF 와의 비교에서 707.77 위치가 더 정확한가, 690.76 이 더 정확한가?
- inner_area 우측 끝 (699.76) 을 페이지번호가 침범하는 것이 문제 없는가?

### Q2. issue-157 page-1 의 -9.6px shift 의도

본 PR 후 issue-157 page-1 의 모든 cell-clip y 좌표가 9.6px 위로 이동. trailing line_spacing 9.55px 처리 revert 효과로 보임.

질문:
- 본 페이지의 시각 검증 결과 (한컴 PDF 또는 작업지시자 시각 확인) 가 어디 있는가?
- -9.6px shift 가 한컴과 더 일치하는가?

### Q3. 추가 회귀 의심 영역

작성자가 식별한 회귀 (exam_math p2, 21_언어 p1·p2) 외:
- form-002 (Task #324 영역, page 1/2 인너 표): 영향 검토했는가?
- aift.hwp (Task #291/#321 영역 — vpos-reset 18 페이지 변경 영향): 영향 검토했는가?
- exam_kor / exam_eng / KTX 목차 외 페이지 / biz_plan: 시각 검증 했는가?

### Q4. 통합 PR 의 검증 범위

7 핵심 샘플 (21_언어, exam_math, exam_kor, exam_eng, KTX, aift, biz_plan) + form-002 의 모든 페이지에 대한 시각 검증 결과 요약을 PR 본문 또는 stage 보고서로 제공할 수 있는가?

## 충돌

- mergeable: CLEAN ✅ — 코드 충돌 0
- CI: 모두 SUCCESS

기술적 차단 없음. **시멘틱/회귀 검증** 단계만 남음.

## 처리 권고

이 PR 은 큰 통합 PR 이라 작성자 확인 답변을 받기 전 머지 진행 위험. 작성자 확인 후:

- **만약 KTX 목차 변경이 의도 (한컴 PDF 더 일치)** → Task #279 결과를 본 PR 이 정밀화 한 것으로 인정 + 머지
- **만약 의도되지 않은 부수 회귀** → 추가 핀포인트 revert 필요 (KTX 목차 부분)

issue-157 의 -9.6px shift 도 동일 — 한컴 PDF 더 일치 시 머지, 부수 회귀면 추가 검토.

## 판정 (예정)

⚠️ **작성자 확인 답변 후 결정**

## 참고 링크

- [PR #343](https://github.com/edwardkim/rhwp/pull/343)
- 이슈: [#342](https://github.com/edwardkim/rhwp/issues/342)
- 이전 close PR: [#323](https://github.com/edwardkim/rhwp/pull/323) (Task #321)
- 우리가 마무리한 KTX 목차 작업: [PR #282](https://github.com/edwardkim/rhwp/pull/282) (Task #279)
- 트러블슈팅: `mydocs/troubleshootings/toc_leader_right_tab_alignment.md`
