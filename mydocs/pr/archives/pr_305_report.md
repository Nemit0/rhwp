# PR #305 최종 보고서 — Task #304: SectionDef hide_master_page 비트 오프셋 수정

## 결정

✅ **Merge 승인 (admin merge)**

## PR 정보

- **PR**: [#305](https://github.com/edwardkim/rhwp/pull/305)
- **이슈**: [#304](https://github.com/edwardkim/rhwp/issues/304)
- **작성자**: @planet6897 (Jaeuk Ryu)
- **처리일**: 2026-04-25
- **Merge commit**: `4e63d7f`

## 처리 절차

1. ✅ PR 브랜치 체크아웃 (`task304`)
2. ✅ devel 자동 merge 성공 (충돌 0건 — orders 가 새 날짜 `20260425.md` 라 어제 PR과 안 겹침)
3. ✅ 검증: 992 passed / 0 failed, 실제 SVG `언`·`홀` 각 1회 출현
4. ✅ WASM Docker 빌드 → rhwp-studio 브라우저 시각 검증 성공 (작업지시자 판정)
5. ✅ HWP 스펙 정오표 `mydocs/tech/hwp_spec_errata.md` 에 #29 항목 등록
6. ✅ admin merge (BEHIND 상태) → 이슈 #304 close

## 승인 사유

1. **HWP5 스펙 정확한 번역** — bit 10 (0x0400) → bit 2 (0x0004). 단순 비트 오프셋 오류이지만 1쪽 렌더 핵심 영향
2. **2줄 수정의 근본 해결** — 읽기/쓰기 양쪽 동시 수정으로 데이터 흐름 일관성 보장
3. **부가 성과** — 제보 안 된 exam_kor/exam_eng 도 동일 패턴으로 함께 해소
4. **광범위 회귀 검증** — 4개 샘플 (21_언어/exam_kor/exam_eng/exam_math) 의도된 수정 또는 무회귀
5. **CLAUDE.md 표준 파일명** 준수 (`task_m100_304*.md`)

## 검증 결과

| 항목 | 결과 |
|------|------|
| `cargo test --lib` | ✅ 992 passed / 0 failed / 1 ignored |
| `cargo test --test svg_snapshot` | ✅ 6 passed (golden 유지) |
| `cargo test --test issue_301` | ✅ 1 passed (#301 회귀 없음) |
| `cargo test --test tab_cross_run` | ✅ 1 passed (#290 회귀 없음) |
| `cargo clippy / wasm32 check` | ✅ clean |
| CI (원본) | ✅ 전부 SUCCESS |
| 실제 SVG 글자 출현 (`언`·`홀`) | ✅ 각 1회 (작성자 주장 일치) |
| WASM Docker 빌드 | ✅ 성공 (pkg/rhwp_bg.wasm 10:00) |
| rhwp-studio 브라우저 시각 검증 | ✅ 작업지시자 판정 성공 |

## 변경 내역

**코드 (2파일 각 1줄):**
- `src/parser/body_text.rs:549` — 읽기: `flags & 0x0400` → `flags & 0x0004`
- `src/document_core/queries/rendering.rs:166` — 쓰기: 동일 변경

**샘플:**
- `samples/21_언어_기출_편집가능본.{hwp,pdf}` 신규

**문서:**
- `mydocs/plans/task_m100_304{,_impl}.md`
- `mydocs/working/task_m100_304_stage1.md`
- `mydocs/report/task_m100_304_report.md`
- `mydocs/orders/20260425.md` (오늘 새 파일)

## 정오표 등록

`mydocs/tech/hwp_spec_errata.md` **#29** 항목으로 등록:

- 항목명: `SectionDef.flags — hide_master_page 비트 위치`
- 기여자: [@planet6897](https://github.com/planet6897) (Jaeuk Ryu) — 발견·수정·검증
- 발견일: 2026-04-25

이는 외부 기여자 발견이 정오표에 기록되는 **첫 항목**이므로 향후 표기 표준 정착.

## 후속 이슈 후보 (작성자 인지)

다른 hide 비트들도 스펙 오프셋 어긋남 가능성:
- `hide_header` (현재 bit 8 / 0x0100) — HWP5 스펙 bit 0 가능성
- `hide_footer` (현재 bit 9 / 0x0200) — HWP5 스펙 bit 1 가능성
- `hide_border` (현재 bit 11 / 0x0800) — HWP5 스펙 bit 3 가능성
- `hide_fill` (현재 bit 12 / 0x1000) — HWP5 스펙 bit 4 가능성
- `hide_page_num` — HWP5 스펙 bit 5 가능성

현 샘플들에서 실제 증상은 관측되지 않아 본 PR 범위 외. **별도 이슈로 스펙 전수 대조 권장**.

## 성과

- 21_언어 1쪽 바탕쪽 중복 + 우측 단 누락 해소
- exam_kor / exam_eng 1쪽 바탕쪽 중복 동시 해소
- 라운드트립 (read/write) 일관성 복원
- HWP 스펙 정오표 외부 기여 시작점 확립
