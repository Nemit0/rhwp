# PR #339 검토 — Task #338: Firefox AMO 검증 경고 정리

## PR 정보

| 항목 | 내용 |
|------|------|
| PR 번호 | [#339](https://github.com/edwardkim/rhwp/pull/339) |
| 작성자 | [@postmelee](https://github.com/postmelee) (Taegyu Lee) |
| 이슈 | [#338](https://github.com/edwardkim/rhwp/issues/338) |
| base/head | `devel` ← `fix/issue-338-firefox-amo-validation` |
| 변경 | +1,817 / -127, **40 파일** (rhwp-firefox 3 + rhwp-studio 28 + 문서 9) |
| Mergeable | ✅ CLEAN |
| CI | ✅ Build & Test, CodeQL × 3 모두 SUCCESS |
| maintainerCanModify | ✅ true |
| 검토일 | 2026-04-26 |

## 인수 경위

메인테이너가 issue #338 등록 + 자체 task338 수행계획서/구현계획서 작성 직후, **외부 기여자가 본 PR 을 제출**. 작성자가 이슈 본문 보고 단계 1~4 모두 처리 + reviewer note 한/영 작성 + 5 영역 시각 검증까지 완료. 우리 task338 작업 보다 결과가 더 우수하여 우리 plans/branch 폐기 + PR #339 검토 절차 진행 결정 (작업지시자 승인).

## 트러블슈팅 사전 검색 (memory 규칙)

| 자료 | 관련성 |
|------|--------|
| `feedback_amo_submission_gotchas.md` (memory) | AMO 4대 함정 — 본 PR 의 strict_min_version 142.0 결정에 부합 (`data_collection_permissions` 필수 + `gecko_android` 생략) |
| `mydocs/feedback/amo-warning-01.md` | 본 PR 이 해결하는 워닝 원본 |

## 변경 요약

### 카테고리 A — manifest strict_min_version 모순 (2건 → 0)

`rhwp-firefox/manifest.json`:
- `strict_min_version`: `112.0` → **`142.0`**
- `data_collection_permissions.required = ["none"]` 유지

→ 워닝 카테고리 A 2건 모두 해소.

### 카테고리 B — 빌드 결과물 보안 워닝

| 워닝 | Before | After (재빌드 + lint) |
|------|--------|---------------------|
| `innerHTML` 할당 | 15+ | **0** ✅ |
| `document.write` 호출 | 1 | **0** ✅ |
| `Function` constructor | 2 | 2 (잔존, reviewer note 처리) |

#### `innerHTML` 0 건 달성 방법

`rhwp-studio/src/` 28 파일을 DOM/SVG API 로 교체:
- `el.innerHTML = "<div>..."` → `createElement` + `appendChild` + `textContent`
- `replaceChildren()` 활용 (modern API)
- SVG 의 경우 `createElementNS` 또는 `DOMParser` + `importNode`
- 주요 영역: 인쇄 팝업 (`file.ts`), table/object selection overlay (`table-object-renderer.ts`, `selection-renderer.ts`), 도형 배치 preview (`input-handler.ts`), 25+ 대화상자 UI

#### `document.write` 0 건 달성 방법

`file.ts` 의 인쇄 팝업 생성을 `document.write` 에서 DOM API 로 변경.

#### `Function` constructor 2 건 잔존

| 파일 | 위치 | 출처 |
|------|------|------|
| `rhwp-firefox/dist/wasm/rhwp.js` | 5932:2 | wasm-bindgen 표준 (Rust → WASM glue) |
| `rhwp-firefox/dist/assets/viewer-*.js` | 1:5 | Vite/dependency (번들 라이브러리 코드) |

→ 두 건 모두 **수정 불가** (생성 코드 / 번들 코드). reviewer note 로 정당화.

### Reviewer Note (작성자 첨부)

- 영문: `mydocs/report/amo_reviewer_note_task338_en.md` (182줄)
- 한국어: `mydocs/report/amo_reviewer_note_task338.md` (163줄)

## 검증 (메인테이너 실측)

| 항목 | 결과 |
|------|------|
| `cargo build --release` | ✅ 28.29s |
| `cargo test --lib` | ✅ 992 passed |
| `cargo test --test svg_snapshot` | ✅ 6/6 passed |
| `cargo test --test issue_301` | ✅ z-table 가드 |
| `cargo clippy --lib -D warnings` | ✅ clean |
| `cargo check --target wasm32` | ✅ clean |
| 7 핵심 샘플 페이지 수 | ✅ 무변화 (15/20/24/9/1/74/6) |
| form-002 페이지 수 | ✅ 10 (무변화) |
| `npm run build` (rhwp-studio + rhwp-firefox) | ✅ |
| `web-ext lint --source-dir=rhwp-firefox/dist` | ✅ **errors 0**, warnings 2 (Function only) |

### web-ext lint 결과 상세

```
errors          0
notices         0
warnings        2

DANGEROUS_EVAL  wasm/rhwp.js:5932:2  Function constructor (wasm-bindgen 생성)
DANGEROUS_EVAL  assets/viewer-*.js:1:5  Function constructor (Vite/dependency)
```

→ AMO 통과 기준 (errors 0) 달성. warnings 2 는 reviewer note 정당화.

## 절차 준수 점검 (외부 기여자 PR)

| 규칙 | 준수 | 비고 |
|------|------|------|
| 이슈 → 브랜치 → 계획서 → 구현 순서 | ✅ | 4 stage 모두 작성 + 단계별 커밋 |
| 작업지시자 승인 없는 이슈 close | ✅ | 이슈 #338 OPEN 유지 (메인테이너 머지 후 close 예정) |
| 브랜치 `local/task{번호}` 또는 `task{번호}` | △ | `fix/issue-338-firefox-amo-validation` (외부 기여자로서 관대하게 봄) |
| 커밋 메시지 `Task #N:` | ✅ | "Task #338 단계N:" 일관 |
| Test plan | ✅ | 작성자 본인 5 영역 시각 검증 + 7 추가 검증 |
| PR 본문 품질 | ✅ | 변경 카테고리 + Before/After 표 + 스크린샷/비디오 첨부 |

## 판정

✅ **Merge 권장**

**사유:**
1. 우리 task338 4 stage 와 동등한 작업 + 더 깊은 정밀화 (strict_min_version=142 — Android 142+ 동시 해결)
2. 워닝 17건 → errors 0, warnings 2 (reviewer note 처리)
3. CI 모두 SUCCESS, 메인테이너 자동 검증 모두 통과
4. 28 파일 sanitize + 5 영역 시각 검증 (작성자) + 메인테이너 추가 web-ext lint 통과
5. reviewer note 한/영 양쪽 사전 작성 (재제출 즉시 사용 가능)

**처리 방향:**
- 우리 task338 산출물 (plans/branch) 폐기 — 본 PR 이 이를 대체
- 작업지시자 시각 검증 (rhwp-studio UI 정상 동작) 후 admin merge
- 이슈 #338 close
- 트러블슈팅 등록 (선택) — AMO 워닝 4 카테고리 정리 + sanitize 패턴 가이드

## 후속 작업 (선택)

- AMO 재제출 (v0.2.2 또는 v0.3.0 빌드)
- 위키 페이지 갱신 (`HWP-Tab-Leader-Rendering.md` 처럼 `Firefox-Extension-Build.md` 같은 가이드 추가 검토)

## 참고 링크

- [PR #339](https://github.com/edwardkim/rhwp/pull/339)
- 이슈: [#338](https://github.com/edwardkim/rhwp/issues/338)
- AMO 워닝 원본: `mydocs/feedback/amo-warning-01.md`
- 메모리 규칙: `feedback_amo_submission_gotchas.md`
