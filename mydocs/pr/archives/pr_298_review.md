# PR #298 검토 — Task #295: exam_math.hwp 12쪽 좌단 레이아웃 붕괴 수정

## PR 정보

- **PR**: [#298](https://github.com/edwardkim/rhwp/pull/298)
- **이슈**: [#295](https://github.com/edwardkim/rhwp/issues/295)
- **작성자**: @planet6897 (Jaeuk Ryu) — 오늘 5번째 기여
- **base/head**: `devel` ← `task295`
- **Mergeable**: ⚠️ 원래 CONFLICTING (orders 문서 1개, 코드 충돌 없음)
- **CI**: ✅ 전부 SUCCESS
- **검토일**: 2026-04-24

## 변경 요약

`samples/exam_math.hwp` 12쪽 다단 레이아웃에서 좌측 컬럼 본문(29번 문제)이 페이지 하단으로 밀려 압축·겹침되던 문제 해소. LAYOUT_OVERFLOW **18건 → 0건**.

### 핵심 변경 (코드 1개 파일)

| 파일 | 변경 | 내용 |
|------|------|------|
| `src/renderer/layout.rs` | +40 -20 | 4가지 수정 묶음 (좌단 붕괴 + 잔여 3건) |

### 수정 내역 (4가지 묶음)

1. **`renders_above_body` → `renders_outside_body` 확장** (≈L2002-2028)
   - `vert=Paper` 만 → `vert=Paper | Page` 추가
   - 위치 조건: `tbl_y < body.y` 만 → `tbl_y < body.y || tbl_y + tbl_h > body_bottom` (본문 위/아래 모두)
   - **근본 수정**: 페이지 하단 푸터 표(`vert=Page valign=Bottom`)가 in-flow 로 처리되어 `y_offset`이 푸터 위치(≈y=1371)로 점프하던 것 해소

2. **Square wrap 표 halign 반영** (≈L1977-1990)
   - 기존: 모두 `col_area.x` (좌측 강제)
   - 수정: `halign` 에 따라 Left/Right/Outside/Center 분기 반영
   - **부수 수정**: pi=27 표가 halign=Right 인데 좌측에 잘못 배치되던 문제

3. **어울림 호출 가드 제거** (≈L2098)
   - `wrap_around_paras.is_empty()` 조건 제거
   - **부수 수정**: 자가 wrap host 본문 (pi=27) 렌더링 누락 복구

4. **호스트 본문 다중 줄 렌더링** (≈L2514-2521)
   - 기존: `start_line + 1` 제한 (첫 줄만)
   - 수정: `rposition` 으로 마지막 텍스트 줄까지 전체 렌더
   - **부수 수정**: pi=27 호스트 본문 5줄 누락 복구

### `is_outside_body` (표 아래 spacing 가드) 도 동일 확장 (≈L2114-2131)

## 루트 원인 분석

pi=22 푸터 표가 `vert=Page valign=Bottom` 앵커인데, 기존 `renders_above_body` 는 **`vert=Paper` + `tbl_y < body.y`** 만 out-of-flow 로 분기. pi=22는 이 조건에 안 맞아 **in-flow로 처리 → 후속 좌단 콘텐츠(pi=23~27)가 푸터 y 위치(≈1371)로 끌려감**.

### 작업지시자 자체 검증 지표

| 항목 | Before | After |
|------|--------|-------|
| 12쪽 LAYOUT_OVERFLOW | 18건 | **0건** |
| pi=23 (29번 본문) y | 1340.1 ❌ | 178.7 ✅ |
| pi=27 표 머리행 | 누락 | 표시 |
| pi=27 호스트 본문 | 첫 줄만 | 5줄 모두 |
| pi=27 표 halign=Right | 좌측 강제 | 정상 |

## 설계 검증

| 설계 요소 | 평가 |
|----------|------|
| `renders_outside_body` 함수명 변경 | ✅ 의미를 정확히 반영 (above → outside) |
| vert=Page 추가 | ✅ Paper / Page 둘 다 페이지 고정 앵커. TopAndBottom wrap 과 조합 시 본문 외부 배치 의미 동일 |
| 본문 하단 조건 `tbl_y + tbl_h > body_bottom` | ✅ 기존 상단 조건과 대칭. 푸터 표 식별 정확 |
| halign 매치 arm | ✅ Left/Right/Center/Outside 4가지 명시. `_ =>` LEFT 폴백으로 안전 |
| 자가 wrap host 가드 제거 | ✅ 단독 host 표도 어울림 문단으로 처리되어야 하는 기존 설계 누락 수정 |
| 다중 줄 렌더링 | ✅ `rposition` 은 `paragraph_layout` 의 일반 처리와 동일 패턴. 자연스러운 복원 |

## 메인테이너 검증 결과

### PR 브랜치 + devel merge 후 검증

| 항목 | 결과 |
|------|------|
| `cargo test --lib` | ✅ **992 passed / 0 failed / 1 ignored** (#296 이후 카운트 유지) |
| `cargo test --test svg_snapshot` | ✅ 6 passed (기존 golden 유지) |
| `cargo test --test tab_cross_run` | ✅ 1 passed (#290 회귀 없음) |
| `cargo clippy --lib -- -D warnings` | ✅ clean |
| `cargo check --target wasm32` | ✅ clean |

### 실제 렌더 검증 (CLI SVG)

| 샘플 | LAYOUT_OVERFLOW |
|------|------------------|
| `exam_math.hwp` 12쪽 단일 | ✅ **0건** |
| `exam_math.hwp` 전체 20페이지 | ✅ **0건** |
| `exam_math_no.hwp` 전체 | ✅ 0건 |
| `equation-lim.hwp` 전체 | ✅ 0건 |

작성자 주장 완전 일치.

### CI (GitHub Actions, 원본 브랜치)

| Check | 결과 |
|-------|------|
| CI / Build & Test | ✅ SUCCESS |
| CodeQL (rust/js/python) | ✅ 전부 SUCCESS |

## 충돌 분석

- **충돌 파일**: `mydocs/orders/20260424.md` 단 1개 (문서만)
- **코드 충돌**: 없음 (`layout.rs` 자동 merge 성공 — 이번 오늘의 앞선 머지들이 paragraph_layout.rs / text_measurement.rs 영역이라 layout.rs 와 안 겹침)
- **원인**: PR 브랜치는 Task #295 섹션 "## 6" 추가, devel 은 Task #296 섹션 "## 8" 추가
- **해결**: Task #295 → "## 7", Task #296 → "## 8" 순번 재배치 + 종료 리스트에 #295 추가 + 신규 등록 #297 유지

## 문서 품질

CLAUDE.md 절차 완전 준수:

- ✅ 수행계획서: `mydocs/plans/task_m100_295.md`
- ✅ 구현계획서: `mydocs/plans/task_m100_295_impl.md`
- ✅ 단계 보고서: `stage1.md` / `stage3.md` / `stage4.md` (stage2 는 생략 — 구현에 포함)
- ✅ 최종 보고서: `mydocs/report/task_m100_295_report.md`
- ✅ 시각 비교: `task_m100_295_p12_{pdf,before,after}.png`
- ✅ orders 갱신: Task #295 섹션
- ✅ 후속 이슈 분리: **#297** (우측 컬럼 단락 높이 과대) — 좌표 비교로 무관함 입증 후 분리

## 후속 이슈 관찰

- **#297** — exam_math.hwp 12쪽 우측 컬럼 단락 높이 과대로 동전 그림 위치 어긋남. 작성자가 #295 수정 전/후 좌표 동일 (147.4..497.3) 을 데이터로 확인해 **사전 존재 버그** 임을 확정 후 별도 이슈 등록. 줄높이/line_spacing/인라인 수식(tac=true) 메트릭 의심.
- 머리말 페이지번호 4↔2 불일치 (1단계 보고서에서 분리 권고)

## 리스크 평가

| 리스크 | 판정 |
|--------|------|
| 기존 `vert=Paper` + 본문 위 케이스 회귀 | ✅ `exam_math.hwp` 1쪽 (머리말 vert=Paper 표) 정상 유지 확인 |
| Square wrap 표의 기본 halign 변경 | ✅ `_ =>` 폴백이 `col_area.x` (기존 기본값) 유지 |
| 자가 wrap host 가드 제거 영향 | ✅ 기존 `wrap_around_paras` 존재 케이스는 동일 분기 |
| 다중 줄 렌더링으로 인한 텍스트 중복 | ✅ `text_start_line` + `text_end_line` 범위 제한으로 동일 wrap 영역만 |
| Golden SVG 회귀 | ✅ 6 passed (issue_147, issue_157, issue_267 모두 유지) |
| LAYOUT_OVERFLOW 0건 달성의 부작용 | ⚠️ 작성자 설명대로 #297 (우측 컬럼 높이) 은 별도 사전 존재 버그. 본 PR 의 회귀 아님 |

## 판정

✅ **Merge 권장**

**사유:**
1. **루트 원인 정확** — `renders_above_body` 가 `vert=Page valign=Bottom` 푸터 표를 못 잡아서 in-flow 처리한 구조적 누락 식별
2. **수정 범위 의미있는 묶음** — 좌단 붕괴 수정 후 드러난 잔여 3문제 (halign, 자가 wrap host, 다중 줄) 를 일괄 처리. 개별로 분리했다면 더 나았겠지만, 각 수정이 서로 의존적이라 묶음 처리가 타당
3. **검증 광범위** — `cargo test --release` 1028 passed, 4개 샘플 LAYOUT_OVERFLOW 0건, 시각 비교 PNG 3면 (PDF/before/after)
4. **범위 의식적 제어** — #297 을 좌표 데이터로 확정 후 분리. 범위 확장 유혹 방지
5. **CI + 로컬 검증 + LAYOUT_OVERFLOW 실측** 모두 통과

**Merge 전략:**
- orders 문서 충돌 메인테이너 직접 해결 완료
- `planet6897/task295` 에 push 후 admin merge (BEHIND 상태)

**Merge 후 후속:**
- 이슈 #295 close
- #297 은 별도 이슈로 추적 유지
- local/devel 동기화 + PR 문서 archives

**브라우저 WASM 시각 검증은 선택 사항** — 이번 수정은 레이아웃 엔진(SVG/Canvas 공통 `layout.rs`) 변경이라 Canvas 렌더에도 동일 영향. CLI SVG 에서 LAYOUT_OVERFLOW 0건 확인으로 충분.

### 메인테이너 WASM 브라우저 검증 (2026-04-24)

- Docker로 WASM 재빌드: `pkg/rhwp_bg.wasm` 갱신 (23:34)
- rhwp-studio + 호스트 Chrome 에서 `samples/exam_math.hwp` 12쪽 시각 확인
- 작업지시자 최종 판정: **검증 성공** — 좌단 레이아웃 붕괴 해소 확인
