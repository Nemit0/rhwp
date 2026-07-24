# PR #305 검토 — Task #304: SectionDef hide_master_page 비트 오프셋 수정

## PR 정보

- **PR**: [#305](https://github.com/edwardkim/rhwp/pull/305)
- **이슈**: [#304](https://github.com/edwardkim/rhwp/issues/304)
- **작성자**: @planet6897 (Jaeuk Ryu)
- **base/head**: `devel` ← `task304`
- **Mergeable**: ✅ MERGEABLE (자동 merge 성공)
- **CI**: ✅ 전부 SUCCESS
- **검토일**: 2026-04-25

## 변경 요약

`SectionDef.flags` 의 "바탕쪽 감춤(첫쪽)" 비트가 HWP5 스펙(**bit 2**) 대신 **bit 10** 으로 잘못 읽히던 파서 버그 수정. **2파일 각 1줄 변경**.

### 핵심 변경

| 파일 | 변경 |
|------|------|
| `src/parser/body_text.rs:549` | `flags & 0x0400` (bit 10) → `flags & 0x0004` (bit 2) — 읽기 |
| `src/document_core/queries/rendering.rs:166` | `set_bit(flags, 0x0400, …)` → `set_bit(flags, 0x0004, …)` — 쓰기 |

## 루트 원인 분석

`samples/21_언어_기출_편집가능본.hwp` 의 `SectionDef.flags = 0xC0080004`:
- HWP5 스펙: bit 2 (`0x04`) = "바탕쪽 감춤(첫쪽)"
- 기존 코드: bit 10 (`0x0400`) 으로 읽음 → `hide_master_page = false` 오판정
- 결과: 1쪽에 바탕쪽 글상자가 그려져 body 표 header 와 중복 → 우측 단도 가림

**파생 증상 (우측 단 누락)**: 바탕쪽 오버레이가 가린 것이라 1쪽 바탕쪽 숨김 처리로 자동 해소.

## 부가 발견

제보되지 않았던 `exam_kor.hwp` (`0xC0000004`), `exam_eng.hwp` (`0xC0000004`) 도 동일 패턴으로 잠재 중복 버그 보유. **본 수정으로 함께 해소**.

`exam_math.hwp` (`0x20000000`, bit 2 unset) 은 영향 없음 (회귀 없음 확인).

## 설계 검증

| 설계 요소 | 평가 |
|----------|------|
| 비트 오프셋 정정 (10 → 2) | ✅ HWP5 스펙 그대로 |
| 읽기/쓰기 양쪽 동시 수정 | ✅ 데이터 라운드트립 일관성 보장 |
| 주석 보강 | ✅ "HWP5 스펙, 첫쪽 바탕쪽 감춤" 명시 |
| 다른 hide 비트들 (header/footer/border/fill/page_num) | ⚠️ 작성자 인지: 오프셋 어긋남 가능성 → 본 PR 범위 외, 별도 이슈 후보 |

## 메인테이너 검증 결과

### PR 브랜치 + devel merge

| 항목 | 결과 |
|------|------|
| `cargo test --lib` | ✅ **992 passed / 0 failed / 1 ignored** |
| `cargo test --test svg_snapshot` | ✅ 6 passed (golden 유지) |
| `cargo test --test issue_301` | ✅ 1 passed (회귀 없음) |
| `cargo test --test tab_cross_run` | ✅ 1 passed |
| `cargo clippy --lib -- -D warnings` | ✅ clean |
| `cargo check --target wasm32` | ✅ clean |

### 실제 렌더 검증 (CLI SVG)

`samples/21_언어_기출_편집가능본.hwp` 1쪽:

| 글자 | 출현 (수정 후) | 의미 |
|------|----------------|------|
| `언` | 1회 | "언어이해" body 표만 (바탕쪽 중복 해소) |
| `홀` | 1회 | "홀수형" body 우측 1회 (바탕쪽 좌측 중복 해소) |

**작성자 주장 정확히 일치**.

### CI (원본 브랜치)

| Check | 결과 |
|-------|------|
| CI / Build & Test | ✅ SUCCESS |
| CodeQL rust/js/python | ✅ 전부 SUCCESS |

## 충돌 분석

- **자동 merge 성공** (충돌 없음)
- 어제 PR 들이 `mydocs/orders/20260424.md` 만 수정한 데 비해, 이 PR 은 `mydocs/orders/20260425.md` (오늘 새 파일) 신규 생성이라 안 겹침

## 문서 품질

CLAUDE.md 절차 완전 준수:

- ✅ 수행계획서: `mydocs/plans/task_m100_304.md`
- ✅ 구현계획서: `mydocs/plans/task_m100_304_impl.md`
- ✅ 단계 보고서: `task_m100_304_stage1.md`
- ✅ 최종 보고서: `mydocs/report/task_m100_304_report.md`
- ✅ orders 갱신: `mydocs/orders/20260425.md` (새 날짜 파일 생성)
- ✅ 신규 샘플: `samples/21_언어_기출_편집가능본.{hwp,pdf}`
- ✅ **CLAUDE.md 표준 파일명 규칙 준수** (`task_m100_304*.md`) — PR #303 의 `task_301*.md` 보다 개선됨

## 리스크 평가

| 리스크 | 판정 |
|--------|------|
| 다른 SectionDef 의 bit 2 영향 | ✅ 145개 샘플 회귀 스캔: exam_kor/exam_eng 도 동일 수정 (의도 100%), exam_math 무회귀 |
| 다른 hide 비트들 (header/footer/border/fill/page_num) | ⚠️ 작성자 인지 — 본 PR 범위 외, 별도 이슈 분리 권장 |
| 라운드트립 (bit 2 ↔ hide_master_page) 호환성 | ✅ 읽기/쓰기 동시 수정으로 데이터 일관성 보장 |
| 기존 골든 SVG 회귀 | ✅ svg_snapshot 6 passed |
| WASM Canvas 경로 | ✅ 동일 RenderTree 사용하므로 동시 해결 |

## 평가 포인트

1. **HWP5 스펙 위반 정확 식별** — 단순 비트 오프셋 오류이지만 1쪽 전체 렌더 붕괴를 일으킨 핵심 버그
2. **2줄 수정의 근본 해결** — 읽기/쓰기 양쪽을 동시에 수정하여 데이터 흐름 일관성 보장
3. **부가 성과** — 제보 안 된 exam_kor/exam_eng 도 동일 패턴으로 함께 해소
4. **범위 의식적 제어** — 다른 hide 비트들도 의심되지만 본 PR 범위 밖으로 분리 권고
5. **CLAUDE.md 표준 파일명** 준수 (`task_m100_304*.md`)

## 판정

✅ **Merge 권장**

**사유:**
1. **HWP5 스펙 정확한 번역** — 비트 오프셋 단순 오류이지만 1쪽 렌더 붕괴 핵심
2. **2줄 수정의 근본 해결** — 읽기/쓰기 양쪽 동시
3. **부가 해결** — exam_kor/exam_eng 잠재 버그 동시 해소
4. **광범위 회귀 검증** — 4개 샘플 (21_언어/exam_kor/exam_eng/exam_math) 모두 의도된 수정 또는 무회귀
5. **CLAUDE.md 절차 + 파일명 규칙 완전 준수**
6. CI + 로컬 검증 + 실제 렌더 (`언`·`홀` 글자 1회 출현) 모두 통과

**Merge 후속:**
- 이슈 #304 close
- WASM 빌드 + 브라우저 시각 검증 권장 (1쪽 바탕쪽 중복 해소 + 우측 단 정상 표시)
- **다른 hide 비트들 (header/footer/border/fill/page_num) 스펙 전수 대조** — 작성자 권고에 따라 별도 이슈 후보로 추적 가능
