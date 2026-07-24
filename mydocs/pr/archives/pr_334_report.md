# PR #334 처리 결과 보고서

## PR 정보

| 항목 | 내용 |
|------|------|
| PR 번호 | [#334](https://github.com/edwardkim/rhwp/pull/334) |
| 작성자 | [@oksure](https://github.com/oksure) (Hyunwoo Park) — **신규 기여자** |
| 이슈 | [#268](https://github.com/edwardkim/rhwp/issues/268) |
| 처리 | **Merge (admin)** — 메인테이너 cherry-pick + 정리 후 |
| 처리일 | 2026-04-26 |
| Merge commit | (CI 통과 후 채움) |

## 변경 요약

이슈 #268 — `replaceText(find, replace, caseSensitive)` 호출 시 crash. 기존 API 는 위치 기반 시그니처라 사용자가 검색어 기반으로 호출하면 `undefined.length` 접근 시 wasm-bindgen 내부 crash.

### 작성자 해결 방향

**기존 `replaceText` 변경 0** + 새 API `replaceOne(query, newText, caseSensitive)` 추가. `replaceAll` 과 동일 시그니처 + 첫 매치만 교체 시맨틱.

→ **하위 호환성 100%** 보존 + JS 친화 API 추가.

### 변경 파일 (4개, +109/-0)

| 파일 | 라인 | 내용 |
|------|------|------|
| `src/document_core/queries/search_query.rs` | +83 | `search_first_body` (early-exit) + `replace_one_native` + **5 unit tests** (한국어 포함) |
| `src/wasm_api.rs` | +12 | `replaceOne` WASM binding (`#[wasm_bindgen(js_name = replaceOne)]`) |
| `rhwp-studio/src/core/types.ts` | +9 | `ReplaceOneResult` type |
| `rhwp-studio/src/core/wasm-bridge.ts` | +5 | `replaceOne` bridge method |

### 단위 테스트 5건

- `find_in_text_case_sensitive`
- `find_in_text_case_insensitive`
- `find_in_text_korean` (`"안녕하세요 세계"` → `"세계"`, `"가나가나"` → `"가나"` multiple matches)
- `find_in_text_multiple_matches`
- `find_in_text_empty_inputs`

신규 기여자 첫 PR 부터 한글 multi-byte 경계 케이스를 테스트에 포함한 점 인상적.

## 처리 흐름

1. PR review 작성 + 작업지시자 승인
2. `local/task268` 브랜치 (origin/devel 기준) 생성
3. 작성자 핵심 2 커밋 cherry-pick (author=Hyunwoo Park 보존):
   - `69dd820` feat: add replaceOne API for query-based single replacement (#268)
   - `bb6a744` refactor: address Copilot review feedback on replaceOne
4. 빌드/테스트 검증:
   - `cargo test --lib`: **997 passed** (992 → +5 신규)
   - `cargo test --lib search_query`: 5 passed (작성자 테스트 모두)
   - svg_snapshot 6/6, issue_301, clippy clean, wasm32 clean
5. 작성자 fork force-push (`maintainerCanModify=true`)
6. PR base 를 `main` → `devel` 로 변경 (REST API 사용)
7. CI 통과 후 admin merge

## 메인테이너 검증

| 항목 | 결과 |
|------|------|
| `cargo build --release` | ✅ 25.83s |
| `cargo test --lib` | ✅ 997 passed (+5 신규) |
| `cargo test --lib search_query` | ✅ 5 passed (작성자 테스트) |
| `cargo test --test svg_snapshot` | ✅ 6/6 |
| `cargo test --test issue_301` | ✅ z-table 가드 |
| `cargo clippy --lib -D warnings` | ✅ clean |
| `cargo check --target wasm32` | ✅ clean |

## 외부 기여 가치

| 영역 | 내용 |
|------|------|
| **분석 정확도** | wasm-bindgen 시그니처 미스매치 함정 정확히 식별 |
| **API 설계** | 하위 호환성 100% — 기존 `replaceText` 변경 0, 새 API 만 추가 |
| **패턴 일관성** | 기존 `search_all` / `delete_text_native` / `insert_text_native` 재사용 |
| **테스트 커버리지** | 5 unit tests + 한국어 multi-byte 경계 |
| **자체 보강** | Copilot review 피드백 반영 (`bb6a744`) |

## base=main 처리 안내

PR 작성 시점 (2026-04-25 13:08) 에 우리 README 에 base=devel 안내가 없던 상태. PR #330 처리 후 (2026-04-25 dawn) 에 README 안내 추가했으나 본 PR 은 그 직전 작성. 우리 측 안내 부족 책임 일부 인정 + 환영 코멘트에 안내 (정중하게).

## 후속

- 트러블슈팅 등록 후보 (선택): wasm-bindgen 시그니처 미스매치 함정 가이드
- npm 0.7.4 또는 0.8.0 빌드 시점 release notes 에 본 API 명시

## 참고 링크

- [PR #334](https://github.com/edwardkim/rhwp/pull/334)
- 환영 코멘트: [comment-4321021421](https://github.com/edwardkim/rhwp/pull/334#issuecomment-4321021421)
- 이슈: [#268](https://github.com/edwardkim/rhwp/issues/268)
