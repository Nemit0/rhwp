# PR #292 최종 보고서 — Task #290: cross-run 탭 감지 inline_tabs 존중

## 결정

✅ **Merge 승인 (충돌 해결 후 admin merge)**

## PR 정보

- **PR**: [#292](https://github.com/edwardkim/rhwp/pull/292)
- **이슈**: [#290](https://github.com/edwardkim/rhwp/issues/290)
- **작성자**: @planet6897 (Jaeuk Ryu)
- **처리일**: 2026-04-24
- **Merge commit**: `085beb0`

## 처리 절차

1. ✅ PR 브랜치 체크아웃 (`local/task290`)
2. ✅ `origin/devel` 머지 → `mydocs/orders/20260424.md` 충돌 해결 (Task #290 → `## 6`, Task #288 → `## 7` 재배치)
3. ✅ 충돌 해결 커밋 `206e265` 생성
4. ✅ 검증: 988 passed / 0 failed / 1 ignored (983 + 5 신규 task290 단위)
5. ✅ `planet6897/local/task290` 에 push (`bc6c46d..206e265`)
6. ✅ 재승인 → admin merge → 이슈 #290 이미 CLOSED

## 승인 사유

1. **루트 원인 추적 정확** — 임시 `RHWP_TRACE290` 트레이스로 전 경로를 숫자로 연결
2. **`ext[2]` 포맷 실증** — RIGHT 샘플 (`hwp-3.0-HWPML.hwp` `저작권\t1`) 확보로 high/low 바이트 구조 검증
3. **#142 교훈 재적용** — `resolve_last_tab_pending` 헬퍼 중앙화. 트러블슈팅 문서 확장 기록
4. **`git worktree` baseline diff** — 184 페이지 byte-level 자동 검증 (1/184 의도 100%)
5. **범위 의식적 제어** — inline_tabs RIGHT/CENTER 렌더 버그 발견해도 후속 이슈로 분리

## 검증 결과

| 항목 | 결과 |
|------|------|
| `cargo test --lib` | ✅ 988 passed / 0 failed / 1 ignored |
| `cargo test --test svg_snapshot` | ✅ 6 passed |
| `cargo test --test tab_cross_run` | ✅ 1 passed (신규) |
| `cargo clippy --lib -- -D warnings` | ✅ clean |
| `cargo check --target wasm32-unknown-unknown --lib` | ✅ clean |
| CI (원본) | ✅ 전부 SUCCESS |
| WASM Docker 빌드 | ✅ 성공 |
| CLI SVG 시각 검증 | ✅ p.7 #18 "수" glyph x=109.80 (PDF 일치) |

## ⚠️ 브라우저 검증에서 발견된 추가 사항

Canvas 렌더 경로 (`WasmTextMeasurer`) 는 본 PR 수정이 적용되지 않음:
- SVG 경로 (rhwp export-svg CLI): ✅ x=109.80 정상
- Canvas 경로 (rhwp-studio 브라우저): ❌ 여전히 우측 밀림

근본 원인: `text_measurement.rs` 의 `WasmTextMeasurer::estimate_text_width` / `compute_char_positions` 가 `find_next_tab_stop` (TabDef 전용) 만 사용. `composed.tab_extended` 참조 없음.

→ **이슈 [#296](https://github.com/edwardkim/rhwp/issues/296) 등록** (메인테이너 핀셋 처리 예정, assignee: edwardkim)

## 변경 내역

**코드 (3개 파일):**
- `src/renderer/layout/paragraph_layout.rs` +86 -24 — `resolve_last_tab_pending` 헬퍼 + cross-run 블록 2곳 교체
- `src/renderer/layout/tests.rs` +83 — 단위 테스트 5건 (task290_*)
- `tests/tab_cross_run.rs` +58 신규 — 통합 테스트

**문서:**
- `mydocs/plans/task_m100_290{,_impl}.md` — 수행/구현 계획서
- `mydocs/working/task_m100_290_stage{1,2,3,4}.md` + 3면 시각 비교 PNG
- `mydocs/report/task_m100_290_report.md` — 최종 보고서
- `mydocs/troubleshootings/tab_tac_overlap_142_159.md` — #290 섹션 추가 (#142 교훈 확장)

## 후속 이슈

| 이슈 | 내용 |
|------|------|
| **#296** | WASM Canvas 경로 inline_tabs 무시 (본 PR의 Canvas 버전) |
| #291 | KTX.hwp 2단 TAC 표 왼쪽 밀림 (별도 회귀) |

## Merge 후

- ✅ 이슈 #290 CLOSED 상태 확인
- ✅ local/devel 동기화 (`c28ec8b`)
- ✅ 다음 PR #293 (신규 기여자 @nameofSEOKWONHONG) 으로 진행
