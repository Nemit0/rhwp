# PR #334 검토 — feat: add replaceOne API for query-based single replacement

## PR 정보

| 항목 | 내용 |
|------|------|
| PR 번호 | [#334](https://github.com/edwardkim/rhwp/pull/334) |
| 작성자 | [@oksure](https://github.com/oksure) (Hyunwoo Park) — **신규 기여자** |
| 이슈 | [#268](https://github.com/edwardkim/rhwp/issues/268) (OPEN) |
| **base/head** | **`main` ← `contrib/fix-replace-text-crash`** ⚠️ |
| 변경 | +109 / -0 (4 파일) |
| Mergeable | MERGEABLE / BLOCKED (CI 미실행) |
| CI | 없음 (BLOCKED — main base 라 CI 미트리거) |
| maintainerCanModify | ✅ true |
| 검토일 | 2026-04-26 |

## 트러블슈팅 사전 검색 (memory 규칙)

| 키워드 | 결과 |
|--------|------|
| replaceText / replaceAll / search_query | 트러블슈팅 0건 — 신규 영역 |

## 이슈 #268 본질

`@rhwp/core` 0.7.3 의 `doc.replaceText(find, replace, caseSensitive)` 호출 시:

```
TypeError: Cannot read properties of undefined (reading 'length')
```

**원인**: `replaceText` 는 위치 기반 시그니처 `(sec, para, charOffset, length, newText)` 를 기대. 사용자가 검색어 기반 `(find, replace, caseSensitive)` 로 호출 → 5번째 인자 `newText` 가 undefined → `.length` 접근 시 wasm-bindgen 내부 crash.

`replaceAll(query, newText, caseSensitive)` 는 검색어 기반이라 정상 동작. **"first match only" 시맨틱을 원하는 use-case 가 사용할 API 없음** → 본 PR 이 해결.

## 변경 요약

### 핵심 설계

**기존 `replaceText` 는 변경 없이 유지** + 새 API `replaceOne(query, newText, caseSensitive)` 추가.
`replaceAll` 과 동일 시그니처 + 첫 매치만 교체 (early-exit).

→ **하위 호환성 100%** 보존 + JS 친화 API 추가.

### 변경 파일 (4개, +109/-0)

| 파일 | 라인 | 내용 |
|------|------|------|
| `src/document_core/queries/search_query.rs` | +83 | `search_first_body` (early-exit) + `replace_one_native` + **5 unit tests** (case_sensitive/insensitive/multiple_matches/empty/한국어) |
| `src/wasm_api.rs` | +12 | `replaceOne` WASM binding (`#[wasm_bindgen(js_name = replaceOne)]`) |
| `rhwp-studio/src/core/types.ts` | +9 | `ReplaceOneResult` type |
| `rhwp-studio/src/core/wasm-bridge.ts` | +5 | `replaceOne` bridge method |

### 핵심 코드 패턴

```rust
// 1. early-exit 검색
fn search_first_body(doc, query, case_sensitive) -> Option<SearchHit>

// 2. 기존 API 재사용
self.delete_text_native(...)?;
self.insert_text_native(...)?;

// 3. JSON 응답
{"ok":true,"sec":N,"para":N,"charOffset":N,"newLength":N}
{"ok":false}
```

기존 `replaceAll` / `delete_text_native` / `insert_text_native` 패턴을 일관 재사용 — 정공법.

## 검토 시 확인할 점

### A. 코드 정확성

| 항목 | 평가 |
|------|------|
| **early-exit 패턴** | `search_first_body` 가 첫 매치 후 즉시 return. `search_all` 보다 효율적. 정공법 |
| **하위 호환성** | 기존 `replaceText` 변경 0. 새 API 만 추가. ✅ |
| **JSON 응답 형식** | `replaceAll` 의 `{"count":N}` 와 일관 (different schema 지만 의도 명확) |
| **표/글상자 제외** | `search_text_native` 와 동일 범위 (search_first_body 가 doc.document.sections 만 순회) |
| **한국어 단위 테스트** | "안녕하세요 세계" → "세계" / "가나가나" → "가나" multiple matches 테스트. 정공법 |

### B. 회귀 리스크

| 리스크 | 평가 |
|--------|------|
| 기존 `replaceText` 영향 | 0 (코드 변경 없음) |
| `replaceAll` 영향 | 0 (코드 변경 없음) |
| 새 API 자체 버그 | 5 unit tests 통과 (작성자 보고) |

### C. 절차 준수 점검 (외부 신규 기여자)

| 규칙 | 준수 | 비고 |
|------|------|------|
| 이슈 → 브랜치 → 계획서 → 구현 순서 | △ | 이슈는 있음, 계획서 없음 (외부 신규 기여자로 관대하게) |
| 작업지시자 승인 없는 이슈 close | ✅ | 이슈 #268 OPEN 유지, PR 본문에 `closes #268` |
| 브랜치 `local/task{번호}` 또는 적절한 명명 | ✅ | `contrib/fix-replace-text-crash` (외부 기여자로 적절) |
| 커밋 메시지 형식 | ✅ | "feat: add replaceOne API ..." |
| Test plan | ✅ | cargo test (942 통과) + clippy 통과 |
| **base 브랜치** | ❌ | **main** (devel 이어야 함) |

## 충돌 상황

`devel` merge 테스트 결과:
- **코드 충돌 0** (`src/wasm_api.rs` 자동 머지 성공)
- 문서 충돌 2건:
  - `README.md` (우리 측에서 base=devel 안내 추가했고 작성자 측은 다른 변경)
  - `mydocs/manual/chrome_edge_extension_build_deploy.md` (작성자가 매뉴얼 현행화 PR 도 포함 — `bea635b`)

두 충돌 모두 우리 측 변경 (신규 추가) 채택 + 작성자 매뉴얼 현행화 변경 검토 후 통합.

### 추가 발견 — 작성자가 무관 커밋도 포함

PR 브랜치에 본 task 외 커밋 3건 추가:

```
bb6a744 refactor: address Copilot review feedback on replaceOne (본 task)
69dd820 feat: add replaceOne API for query-based single replacement (#268) (본 task)
bea635b docs(manual): 매뉴얼 7건 현행화 (v0.2.1 + Firefox + rhwp-shared + SVG snapshot 반영)  ← 무관
72fdd4b docs: 외부 공개 문서 자기검열 (사이냅 거명 익명화 + 최상급·단정 표현 완화)  ← 무관
1bfd1e0 docs: 외부 기여자 PR 검토 문서를 mydocs/pr/ 로 분리  ← 무관
```

**`1bfd1e0`, `72fdd4b`, `bea635b` 는 우리 메인테이너가 이미 devel 에 머지한 변경**. 작성자 fork 가 base=main 이라 이미 머지된 변경을 본인 브랜치 위에 갖고 있는 상태. devel 로 rebase 하면 자동 해소.

## 처리 방향

### 인수 흐름

1. ✅ 본 review 작성지시자 승인
2. ⚠️ base=main 이슈 → 작성자 본인이 fork 의 `contrib/fix-replace-text-crash` 를 devel 기준으로 rebase 하거나, 메인테이너가 cherry-pick 으로 정리
3. PR 본문 의 핵심 2 커밋 (`69dd820` + `bb6a744`) 만 devel 에 적용
4. 빌드/lib test/clippy/wasm32 검증
5. CI 통과 + admin merge

### 권장 방식

**메인테이너가 cherry-pick 으로 정리** (PR #282 / PR #327 사례와 동일):
- `local/task268` 브랜치 (origin/devel 기준) 에 핵심 2 커밋 cherry-pick
- author=Hyunwoo Park 보존
- 메인테이너 PR review 코멘트 + 빌드 검증
- 작성자 fork 에 force-push (`maintainerCanModify=true`)
- admin merge

## 판정 (예정)

✅ **Merge 권장** (검증 통과 시)

**사유:**
1. 명확한 원인 분석 + 깔끔한 새 API 추가 (하위 호환성 100%)
2. 5 unit tests (한국어 포함) 작성
3. 기존 `replaceAll` / `delete_text_native` / `insert_text_native` 패턴 일관 재사용
4. Copilot review 피드백 반영 (`bb6a744`) — 코드 품질 의식

**처리 시 안내 (정중하게):**
- base 가 main 이지만 CONTRIBUTING.md 와 README 의 "base=devel" 안내 (PR #330 처리 후 추가됨)
- 다음 PR 부터는 devel 기준으로 분기 권장
- 신규 기여자 환영 + 첫 PR 감사

**머지 후 후속 (선택):**
- 트러블슈팅 등록 — wasm-bindgen 시그니처 미스매치 함정 가이드
- npm 0.7.4 또는 0.8.0 빌드 시점 release notes 에 본 API 명시

## 참고 링크

- [PR #334](https://github.com/edwardkim/rhwp/pull/334)
- 이슈: [#268](https://github.com/edwardkim/rhwp/issues/268)
- 신규 기여자 첫 PR
