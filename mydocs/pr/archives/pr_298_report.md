# PR #298 최종 보고서 — Task #295: exam_math.hwp 12쪽 좌단 레이아웃 붕괴 수정

## 결정

✅ **Merge 승인 (충돌 해결 후 admin merge)**

## PR 정보

- **PR**: [#298](https://github.com/edwardkim/rhwp/pull/298)
- **이슈**: [#295](https://github.com/edwardkim/rhwp/issues/295)
- **작성자**: @planet6897 (Jaeuk Ryu) — 오늘 5번째 기여
- **처리일**: 2026-04-24
- **Merge commit**: `42ae6ff`

## 처리 절차

1. ✅ PR 브랜치 체크아웃 (`task295`)
2. ✅ `origin/devel` 머지 → `mydocs/orders/20260424.md` 충돌 해결 (Task #295 "## 7", Task #296 "## 8" 재배치)
3. ✅ 머지 커밋 `d53572e` 생성
4. ✅ 검증: 992 passed / 0 failed, LAYOUT_OVERFLOW 0건 (4개 샘플)
5. ✅ `planet6897/task295` 에 push (`09261b8..d53572e`)
6. ✅ WASM Docker 빌드 → 브라우저 시각 검증 성공 (작업지시자 판정)
7. ✅ 재승인 + admin merge → 이슈 #295 close

## 승인 사유

1. **루트 원인 정확** — `renders_above_body` 함수가 `vert=Paper` + "본문 위" 케이스만 out-of-flow 처리. `vert=Page valign=Bottom` 푸터 표가 in-flow 로 처리되어 `y_offset` 점프 → 후속 좌단 콘텐츠 붕괴 구조적 누락 식별
2. **의미있는 묶음 수정** — 좌단 붕괴 수정 후 드러난 잔여 3문제(halign, 자가 wrap host, 다중 줄)를 일괄 처리. 각 수정이 서로 의존적이라 묶음 처리가 타당
3. **데이터 기반 범위 제어** — #297 을 좌표 비교로 "사전 존재 버그" 확정 후 분리. 범위 확장 유혹 방지
4. **검증 광범위** — `cargo test --release` 1028, 4개 샘플 LAYOUT_OVERFLOW 0건, 시각 비교 PNG 3면
5. **CLAUDE.md 절차 완전 준수** — 수행/구현 계획서 + stage1/3/4 보고서 + 최종 보고서 + 시각 비교

## 검증 결과

| 항목 | 결과 |
|------|------|
| `cargo test --lib` | ✅ 992 passed / 0 failed / 1 ignored |
| `cargo test --test svg_snapshot` | ✅ 6 passed (golden 유지) |
| `cargo test --test tab_cross_run` | ✅ 1 passed (#290 회귀 없음) |
| `cargo clippy --lib -- -D warnings` | ✅ clean |
| `cargo check --target wasm32-unknown-unknown --lib` | ✅ clean |
| CI (원본) | ✅ 전부 SUCCESS (CI, CodeQL rust/js/python) |
| `exam_math.hwp` 12쪽 LAYOUT_OVERFLOW | ✅ 0건 (작성자 주장 일치) |
| 4개 샘플 LAYOUT_OVERFLOW | ✅ 전부 0건 |
| WASM Docker 빌드 | ✅ 성공 (pkg/rhwp_bg.wasm 23:34) |
| rhwp-studio 브라우저 시각 검증 | ✅ 작업지시자 판정 성공 |

## 변경 내역

**코드 (1개 파일):**
- `src/renderer/layout.rs` +40 -20 — 4가지 수정 묶음:
  1. `renders_above_body` → `renders_outside_body` 확장 (vert=Paper|Page, 위치 above|below body)
  2. Square wrap 표 halign 반영 (Left/Right/Center/Outside)
  3. 어울림 호출 가드 제거 (`wrap_around_paras.is_empty()`)
  4. 호스트 본문 다중 줄 렌더링 복원 (첫 줄 제한 → rposition)

**문서 + 샘플:**
- `mydocs/plans/task_m100_295{,_impl}.md` — 수행/구현 계획서
- `mydocs/working/task_m100_295_stage{1,3,4}.md` — 단계별 보고서
- `mydocs/report/task_m100_295_report.md` — 최종 보고서
- `mydocs/working/task_m100_295_p12_{pdf,before,after}.png` — 시각 비교
- `samples/exam_math.pdf` — 참조

## 후속 추적

- **#297** — exam_math.hwp 12쪽 우측 컬럼 단락 높이 과대 (사전 존재 버그, #295에서 분리)
- 머리말 페이지번호 4↔2 불일치 (별도 이슈 후보)

## 성과 지표

| 이전 | 이후 |
|------|------|
| 12쪽 LAYOUT_OVERFLOW 18건 | 0건 |
| pi=23 (29번 본문) y=1340.1 (하단 밀림) | y=178.7 (정상 상단) |
| pi=27 표 머리행 누락 | 표시 |
| pi=27 호스트 본문 첫 줄만 | 5줄 모두 |
| pi=27 표 좌측 강제 | halign=Right 반영 |
