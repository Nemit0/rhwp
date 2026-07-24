# PR #343 처리 결과 보고서

## PR 정보

| 항목 | 내용 |
|------|------|
| PR 번호 | [#343](https://github.com/edwardkim/rhwp/pull/343) |
| 작성자 | [@planet6897](https://github.com/planet6897) (Jaeuk Ryu) |
| 이슈 | [#342](https://github.com/edwardkim/rhwp/issues/342) |
| 처리 | **Merge (admin)** |
| 처리일 | 2026-04-26 |
| Merge commit | `bed276c` |

## 변경 요약

Task #321~#332 누적 작업 통합 + 회귀 핀포인트 revert.

- 변경 +3,649/-530, 42 파일 (코드 6 + 문서 33 + 골든 3)
- 코드 핵심: `layout.rs +137/-30`, `typeset.rs +176/-6`, `table_layout.rs +11/-2`, `paragraph_layout.rs +37/-27`, `shape_layout.rs +10/-0`

### 진행 흐름

1. PR #323 (Task #321 vpos-reset) close 후 작성자 v2~v6 정밀화
2. Task #322~#332 누적
3. 통합 정리하면서 stage3a/3b, Task #13 cell padding 회귀 식별 → 핀포인트 revert
4. **메인테이너 4가지 질문 (Q1 KTX TOC, Q2 issue-157, Q3 추가 회귀, Q4 검증 범위)**
5. 작성자 정직한 분석 + Q1 자체 수정 (`782a5a7`):
   - KTX TOC 골든 md5 가 Task #279 시점과 **정확히 일치** 복원
   - `resolve_cell_padding` 정책: aim 플래그 무관 cell.padding 명시값 우선
6. Stage 5 시각 검증 보고서 (`74cf988`)

## 메인테이너 검증

| 항목 | 결과 |
|------|------|
| `cargo build --release` | ✅ 25.75s |
| `cargo test --lib` | ✅ 1000 passed |
| `cargo test --test svg_snapshot` | ✅ 6/6 |
| `cargo test --test issue_301` | ✅ z-table 가드 |
| `cargo clippy --lib -D warnings` | ✅ clean |
| `cargo check --target wasm32` | ✅ clean |
| KTX TOC 골든 md5 | ✅ Task #279 시점과 정확히 일치 |
| 7 핵심 샘플 페이지 수 (exam_eng 제외) | ✅ 무변화 |
| WASM Docker 빌드 | ✅ |

## 처리 결정 (작업지시자)

> "기여자 작업을 수용한 후 메인테이너가 작업한 것을 재구현하는 방향이 생산성 측면에서 더 낫다"

KTX TOC 결과는 작성자 자체 수정 (`782a5a7`) 으로 이미 복원됐으니 추가 재구현 없이 본 PR 그대로 admin merge. exam_eng 회귀는 별도 이슈로 분리.

## 외부 기여 가치

| 영역 | 내용 |
|------|------|
| **누적 통합** | Task #321 v2~v6 + Task #322~#332 + 회귀 핀포인트 revert 를 단일 PR 로 정리 |
| **자체 보강** | 메인테이너 우려 4가지에 정직한 분석 + Q1 자체 수정 |
| **트러블슈팅** | typeset_layout_drift_analysis.md 신규 등록 |
| **stage 보고서** | task_m100_321 v4/v5/v6 + task_m100_332 stage1~5 + task_m100_342 stage5 — 시각 검증 + 분석 누적 |

## 발견된 후속 이슈

### exam_eng.hwp 9 → 8 페이지 회귀

본 PR 머지 후 메인테이너 자체 검증에서 발견. 작성자 Q3 점검에서는 페이지 수까지 확인 안 된 누락.

→ 새 이슈 [#345](https://github.com/edwardkim/rhwp/issues/345) 등록.

### issue_157 PDF 확보 시 재검증

작성자 Q2 답변: "PDF 부재로 잠정 correct 판정". PDF 확보 시 -9.6px shift 가 한컴과 더 일치하는지 재검증.

### exam_math p1 좌측 문항 2 layout drift

작성자 Q3 점검 결과: "본 PR 과 무관한 별도 이슈 의심". 별도 이슈 후보.

## 참고 링크

- [PR #343](https://github.com/edwardkim/rhwp/pull/343)
- [감사 코멘트](https://github.com/edwardkim/rhwp/pull/343#issuecomment-4321564622)
- 이슈: [#342 (closed)](https://github.com/edwardkim/rhwp/issues/342)
- 후속 이슈: [#345 exam_eng 회귀](https://github.com/edwardkim/rhwp/issues/345)
- 메인테이너 Task #279 결과 (KTX TOC): [PR #282](https://github.com/edwardkim/rhwp/pull/282)
- 트러블슈팅: `mydocs/troubleshootings/toc_leader_right_tab_alignment.md`
- 작성자 누적 기여: PR #303, #305, #308, #315, #320, #327, #341, **#343**
