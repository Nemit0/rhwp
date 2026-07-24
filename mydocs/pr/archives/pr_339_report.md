# PR #339 처리 결과 보고서

## PR 정보

| 항목 | 내용 |
|------|------|
| PR 번호 | [#339](https://github.com/edwardkim/rhwp/pull/339) |
| 작성자 | [@postmelee](https://github.com/postmelee) (Taegyu Lee) |
| 이슈 | [#338](https://github.com/edwardkim/rhwp/issues/338) |
| 처리 | **Merge (admin)** |
| 처리일 | 2026-04-26 |
| Merge commit | `626338f` |

## 변경 요약

Firefox AMO 워닝 (`mydocs/feedback/amo-warning-01.md`) 해결.

### 카테고리 A — manifest strict_min_version 모순 (2 → 0)

`rhwp-firefox/manifest.json`:
- `strict_min_version`: 112.0 → **142.0**
- `data_collection_permissions.required = ["none"]` 유지

### 카테고리 B — 빌드 결과물 보안 워닝

| 워닝 | Before | After |
|---|---|---|
| `innerHTML` 할당 | 15+ | 0 |
| `document.write` 호출 | 1 | 0 |
| `Function` constructor | 2 | 2 (reviewer note) |

#### sanitize 패턴 (rhwp-studio 28 파일)

- `el.innerHTML = "..."` → `createElement` + `appendChild` + `textContent`
- `replaceChildren()` 활용
- SVG: `createElementNS` 또는 `DOMParser` + `importNode`
- `document.write` → DOM API 기반 인쇄 팝업

영역: 인쇄 팝업, table/object selection overlay, 도형 배치 preview, 25+ 대화상자 UI

#### Function constructor 잔존 2건

- `wasm/rhwp.js`: wasm-bindgen 표준 (Rust → WASM glue)
- `assets/viewer-*.js`: Vite/dependency (번들 라이브러리 코드)

→ reviewer note 로 정당화 (작성자 첨부 한/영 양쪽).

## 메인테이너 검증

| 항목 | 결과 |
|------|------|
| `cargo build --release` | ✅ 28.29s |
| `cargo test --lib` | ✅ 992 passed |
| `cargo test --test svg_snapshot` | ✅ 6/6 |
| `cargo test --test issue_301` | ✅ z-table 가드 |
| `cargo clippy --lib -D warnings` | ✅ clean |
| `cargo check --target wasm32` | ✅ clean |
| 7 핵심 샘플 + form-002 페이지 수 | ✅ 무변화 |
| `npm run build` (rhwp-studio + rhwp-firefox) | ✅ |
| `web-ext lint --source-dir=rhwp-firefox/dist` | ✅ **errors 0**, warnings 2 |
| WASM Docker 빌드 | ✅ 09:49 갱신 |
| 작업지시자 시각 검증 | ✅ 통과 |

## 처리 흐름

1. 메인테이너 issue #338 등록 + 자체 task338 plans 작성 (수행/구현계획서)
2. 외부 기여자 [@postmelee](https://github.com/postmelee) 가 이슈 본문 보고 단계 1~4 모두 처리 + PR #339 제출
3. 메인테이너 PR review 작성 + 작업지시자 승인 → 우리 task338 plans/branch 폐기
4. 메인테이너 추가 검증 (web-ext lint, WASM Docker 빌드, 7 샘플 회귀)
5. 작업지시자 시각 검증 통과
6. admin merge → 이슈 #338 close

## 외부 기여 가치

| 영역 | 내용 |
|------|------|
| 빠른 응답 | 이슈 등록 후 짧은 시간 내 PR 제출 (메인테이너 작업 시작 전) |
| 정밀화 | 우리 계획 (140) 보다 더 정확한 142 (Android 142+ 동시 해결) |
| 깊은 sanitize | rhwp-studio 28 파일 DOM/SVG API 교체 |
| 시각 검증 | 5 영역 (인쇄 팝업, table/object overlay, line/shape overlay, 도형 preview, picker UI) 본인 검증 + 비디오 |
| Reviewer Notes | 한/영 양쪽 사전 작성 (재제출 즉시 사용) |

## 후속

- AMO 재제출 (v0.2.2 또는 다음 버전 빌드 시점)
- Reviewer Notes 활용

## 참고 링크

- [PR #339](https://github.com/edwardkim/rhwp/pull/339)
- [Merge announcement comment](https://github.com/edwardkim/rhwp/pull/339#issuecomment-4320935487)
- 작성자 산출물 (PR 에 포함):
  - `mydocs/plans/task_m100_338{,_impl}.md`
  - `mydocs/working/task_m100_338_stage{1,2,3}.md`
  - `mydocs/working/task_m100_338_report.md`
  - `mydocs/report/amo_reviewer_note_task338{,_en}.md`
- 메모리 규칙: `feedback_amo_submission_gotchas.md`
