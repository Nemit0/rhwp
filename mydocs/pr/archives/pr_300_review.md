# PR #300 검토 — Task #297: VertRelTo::Page와 Paper 기준점 분리

## PR 정보

- **PR**: [#300](https://github.com/edwardkim/rhwp/pull/300)
- **이슈**: [#297](https://github.com/edwardkim/rhwp/issues/297) — PR #298 에서 "사전 존재 버그"로 분리한 후속
- **작성자**: @planet6897 (Jaeuk Ryu) — 오늘 **6번째** 기여 🎉
- **base/head**: `devel` ← `task297`
- **Mergeable**: ⚠️ 원래 CONFLICTING (orders 문서만)
- **CI**: ✅ 전부 SUCCESS
- **검토일**: 2026-04-24

## 변경 요약

`exam_math.hwp` 12·16·20쪽 하단 "* 확인 사항" 박스가 PDF 대비 **147px 아래로 밀려** 본문 하단 경계를 침범하던 문제 수정.

### 핵심 변경 (1파일, 1줄)

`src/renderer/layout/table_layout.rs` +5 -2 — `compute_table_y_position` 의 `VertRelTo::Page` 와 `Paper` 분리:

```rust
// Before
VertRelTo::Page  => (0.0, page_h_approx),   // 용지 전체 기준 ❌
VertRelTo::Paper => (0.0, page_h_approx),

// After
VertRelTo::Page  => (col_area.y, col_area.height),  // ✅ 쪽 본문 영역
VertRelTo::Paper => (0.0, page_h_approx),            // 용지 전체 (유지)
```

## 루트 원인 분석

**HWP 스펙 기반**: `Page=쪽 본문`, `Paper=용지 전체`. 기존 코드는 두 enum을 동일하게 `(0, page_h_approx)` 로 처리 → `vert=Page` 푸터 표가 용지 전체 기준으로 계산되어 본문 하단보다 **147 px 아래**로 배치됨.

### 증상 오인 → 재조사 (교훈 포인트)

이슈 #297의 초기 기술은 "**동전 그림 위치 어긋남**"이었으나, 작성자가 실측 좌표 비교(`pdftotext -bbox-layout`)로 재검증:

| 요소 | PDF y | SVG y | 상태 |
|------|-------|-------|------|
| 동전 이미지 (pi=33) | ≈495 | 497.25 | ✅ 일치 |
| "* 확인 사항" 박스 | ≈1231 | 1373.7 | ❌ +142px 드리프트 |

→ **진짜 문제는 동전이 아니라 pi=22 푸터 표**. 이슈 제목 맹신 회피.

### 추가 가설 폐기 (v1 → v2)

1단계 가설: 바탕쪽(master page) `vert=Paper/101954 HU` 표의 bottom-anchoring 필요
→ 수행·구현계획서까지 작성한 후 실제 수정 적용했으나 **시각 변화 없음** (해당 표는 빈 1x3)
→ 가설 폐기, 본문 pi=22 (`vert=Page/141`) 로 범위 재정의

### 수치 검증

pi=22 표 (size=419.5×134.7px, `v_offset=141 HU=1.9px`, `valign=Bottom`):

| 경우 | 공식 | 결과 |
|------|------|------|
| Before | `0 + 1508.1 − 134.7 − 1.9` | 1371.5 px |
| **After** | `147.4 + 1213.3 − 134.7 − 1.9` | **1224.1 px** |
| PDF (실측) | — | ~1226.5 px ✓ |

## 설계 검증

| 설계 요소 | 평가 |
|----------|------|
| HWP 스펙 번역 정확성 | ✅ Page=쪽 본문 (body_area), Paper=용지 전체 — 스펙 그대로 |
| 바탕쪽 context 호환성 | ✅ 바탕쪽에서는 `col_area = paper_area` 이므로 두 경로 수학적 동치 → 회귀 없음 |
| `Para` 분기 변경 없음 | ✅ anchor_y 기준은 이미 올바름 |
| 주석 추가 | ✅ Task #297 참조 + 바탕쪽 회귀 없음 사유 명시 |

## 회귀 영향 (작성자 증빙)

**본문 `VertRelTo::Page` 표 스캔 (145 샘플 중 13건):**

| 샘플 | 결과 |
|------|------|
| exam_math.hwp (pi=22/55/86, pages 12/16/20) | 수정 반영 ✓ |
| exam_math_no.hwp (동일 3건) | 동일 수정 ✓ |
| tac-case-001..005 | diff=0 (무회귀) ✓ |
| exam_social / exam_eng | -1 byte (수치 포맷 미차) |

**바탕쪽 `VertRelTo::Page` 표 (5건)**: 모두 `col_area = paper_area` → **diff=0**

**exam_math.hwp 전 20페이지**: 12·16·20만 변경 (각 섹션 마지막), 나머지 17페이지 byte-identical ✓

## 메인테이너 검증 결과

### PR 브랜치 + devel merge 후

| 항목 | 결과 |
|------|------|
| `cargo test --lib` | ✅ **992 passed / 0 failed / 1 ignored** |
| `cargo test --test svg_snapshot` | ✅ 6 passed (golden 유지) |
| `cargo test --test tab_cross_run` | ✅ 1 passed |
| `cargo clippy --lib -- -D warnings` | ✅ clean |
| `cargo check --target wasm32` | ✅ clean |

### 실제 렌더 검증 (CLI SVG)

`samples/exam_math.hwp` p.12 렌더 결과:
```
rect ... y="1224.07" ... height="134.69"  ← pi=22 "* 확인 사항" (수정 후 PDF와 일치)
rect ... y="147.39"  ... height="131.76"  ← pi=27 다른 표 (정상)
```

작성자 주장 **정확히 일치** (y=1224.1, PDF 1226.5 ± 2px).

### CI (원본 브랜치)

| Check | 결과 |
|-------|------|
| CI / Build & Test | ✅ SUCCESS |
| CodeQL rust/js/python | ✅ 전부 SUCCESS |

## 충돌 분석

- **충돌 파일**: `mydocs/orders/20260424.md` 단 1개 (3개 구간)
- **코드 충돌**: 없음 (`table_layout.rs` 자동 merge)
- **원인**: PR 브랜치에 Task #295 + Task #297 섹션이 있었고 devel에도 Task #295 가 이미 머지됨. 순서 · 이슈 활동 리스트 불일치
- **해결**: Task #295 "## 7" 유지, Task #296 "## 8", Task #297 "## 9" 신설. 이슈 활동 종료 리스트 통합

## 문서 품질

CLAUDE.md 절차 완전 준수:

- ✅ 수행계획서: `mydocs/plans/task_m100_297.md`
- ✅ 구현계획서: `mydocs/plans/task_m100_297_impl.md` (v1 → v2 교체 기록)
- ✅ 단계 보고서: `stage1.md` / `stage3.md` (stage2 는 구현에 포함)
- ✅ 최종 보고서: `mydocs/report/task_m100_297_report.md`
- ✅ orders 갱신: Task #297 섹션 추가

## 리스크 평가

| 리스크 | 판정 |
|--------|------|
| 바탕쪽 `VertRelTo::Page` 표 회귀 | ✅ 5건 모두 diff=0 (col_area=paper_area 수학적 동치) |
| 본문 `VertRelTo::Page` 표 회귀 | ✅ exam_math 12/16/20 의도된 수정, 나머지 byte-identical |
| Paper 경로 영향 | ✅ Paper 분기 변경 없음 |
| Para 경로 영향 | ✅ Para 분기 변경 없음 |
| Golden SVG 회귀 | ✅ svg_snapshot 6 passed |
| `exam_math_no.hwp` 동일 구조 | ✅ 동일 수정 반영, 의도 100% |
| exam_social / exam_eng -1 byte | ⚠️ "수치 포맷 미차" 로 작성자 설명. 시각 영향 없음 예상 |

## 의견

**#295 → #297 연결 프로세스가 인상적**:
- #295 작업 중 부수 증상 발견 → 사전 존재 버그임을 좌표 비교로 확정 → 별도 이슈 분리
- 1시간 만에 #297 작업 착수 → 초기 가설(바탕쪽 Paper) 폐기 → 실측 기반 재조사 → 정확한 근본 원인 (Page vs Paper enum 스펙 위반) 찾아 1줄 수정
- "증상 오인" 과 "가설 조기 폐기" 를 성공적으로 수행한 모범 사례

## 판정

✅ **Merge 권장**

**사유:**
1. **HWP 스펙 정확한 번역** — Page=쪽 본문, Paper=용지 전체. 오래된 코드 부채 해소
2. **1줄 수정의 근본 해결** — 147px 드리프트가 단순한 enum 구분 누락에서 비롯
3. **광범위 회귀 검증** — 145 샘플 중 본문 Page 표 13건 + 바탕쪽 5건 스캔
4. **증상 오인 회피** — `pdftotext -bbox-layout` 실측으로 이슈 제목의 "동전" 오인 확인, pi=22 푸터 표가 진짜 문제임을 좌표 수치로 확정
5. **CI + 로컬 검증 + 실제 렌더 좌표 검증** 모두 통과
6. **CLAUDE.md 절차 완전 준수** + 트러블슈팅 로그 교체 기록 (v1 → v2)

**Merge 전략:**
- orders 문서 충돌 메인테이너 직접 해결 완료
- `planet6897/task297` 에 push 후 admin merge (재승인 필요)

**WASM 시각 검증 선택 사항** — 레이아웃 엔진 변경이라 Canvas/SVG 동일 영향. CLI SVG 좌표로 이미 PDF 일치 확인.
