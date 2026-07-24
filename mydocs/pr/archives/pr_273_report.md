# PR #273 최종 보고서 — Task #267: right tab 선행 공백 처리 통일

## 결정

✅ **Merge 승인 (충돌 해결 후 admin merge)**

## PR 정보

- **PR**: [#273](https://github.com/edwardkim/rhwp/pull/273)
- **이슈**: [#267](https://github.com/edwardkim/rhwp/issues/267)
- **작성자**: @seanshin
- **처리일**: 2026-04-24
- **Merge commit**: `0aed531`

## 처리 절차

1. ✅ PR 브랜치 체크아웃 (`feature/task267`)
2. ✅ `origin/devel` 머지 → `mydocs/orders/20260424.md` 충돌 해결 (메인테이너 직접)
3. ✅ 충돌 해결 커밋 `5f05eb1` 생성
4. ✅ 검증: 964 passed / 0 failed, clippy clean, svg_snapshot 5 passed
5. ✅ `seanshin/feature/task267`로 push (maintainerCanModify 허용)
6. ✅ 재승인 → admin merge → 이슈 #267 클로즈

## 충돌 내용

- **충돌 파일**: `mydocs/orders/20260424.md` (문서 1건, 코드 충돌 없음)
- **원인**: PR #273이 "## 2. Task #267" 섹션을 추가했는데, devel에도 #284/#285 머지로 "## 2. Task #280"·"## 3. Task #283" 섹션이 추가됨
- **해결**: Task #267 섹션을 "## 4"로 재배치 + 이슈 활동 섹션 통합

## 검증 결과

| 항목 | 결과 |
|------|------|
| `cargo test --lib` | ✅ 964 passed / 0 failed / 1 ignored |
| `cargo test --test svg_snapshot` | ✅ 5 passed (issue_157 + issue_267 포함) |
| `cargo clippy --lib -- -D warnings` | ✅ clean |
| WASM Docker 빌드 (이전 세션) | ✅ 성공 |
| rhwp-studio 브라우저 시각 검증 (이전) | ✅ 작업지시자 검증 성공 |

## 변경 내역

**코드 (2개 파일):**
- `src/renderer/layout/text_measurement.rs` — right tab 3곳 선행 공백 skip
- `src/renderer/layout/paragraph_layout.rs` — pending_right_tab_est/render match arm 분리 + trim_start

**테스트:**
- `tests/golden_svg/issue-267/ktx-toc-page.svg` 신규 (279줄)
- `tests/svg_snapshot.rs` `issue_267_ktx_toc_page` 추가
- `samples/KTX.hwp` 샘플 추가

## 별도 관찰 (후속 이슈 등록 예정)

- **KTX.hwp 2단 구성 TAC 표 위치 회귀** — 작업지시자가 브라우저 검증 중 발견
- 본 PR 변경과 무관 (PR #266 머지 전후에도 x 좌표 동일)
- 기준 시점 확인 후 핀셋 처리 예정
