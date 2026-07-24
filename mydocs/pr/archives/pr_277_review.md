# PR #277 검토 — Task #147: MEMO 컨트롤 바탕쪽 오분류 버그 수정

## PR 정보

- **PR**: [#277](https://github.com/edwardkim/rhwp/pull/277)
- **이슈**: [#147](https://github.com/edwardkim/rhwp/issues/147)
- **작성자**: @seanshin (Shin hyoun mouk)
- **base/head**: `devel` ← `feature/task147`
- **Mergeable**: ✅ MERGEABLE (BEHIND이나 **자동 merge 성공, 충돌 없음**)
- **검토일**: 2026-04-24

## 변경 요약

`samples/aift.hwp` 4페이지 상단에 잘못 렌더링되던 "기업 소개 및 본 과제 관련 기술력 소개" 텍스트 제거. MEMO(주석) 컨트롤의 LIST_HEADER가 바탕쪽(master page)으로 오분류되던 파서 버그 수정.

### 핵심 변경 (코드 2개 파일, 총 10줄)

| 파일 | 변경 | 설명 |
|------|------|------|
| `src/parser/body_text.rs` | +6 -0 | `parse_master_pages_from_raw`에서 text_width=0 && text_height=0 LIST_HEADER skip (파서 레벨) |
| `src/renderer/layout.rs` | +4 -0 | `build_master_page`에 0×0 바탕쪽 렌더링 가드 (렌더러 레벨) |

### 테스트
- `tests/golden_svg/issue-147/aift-page3.svg` 신규 (669줄, aift.hwp 4페이지)
- `tests/svg_snapshot.rs` 에 `issue_147_aift_page3` 테스트 추가

## 루트 원인 분석

`parse_master_pages_from_raw`가 `SectionDef.extra_child_records`에서 `HWPTAG_LIST_HEADER`를 발견하면 무조건 바탕쪽으로 분류:

```rust
// BEFORE: text_width/height 검증 없이 바탕쪽 등록
let text_width = r.read_u32().unwrap_or(0);
let text_height = r.read_u32().unwrap_or(0);
// ... 바로 바탕쪽으로 수집
```

**MEMO 컨트롤의 텍스트박스도 LIST_HEADER를 사용**하므로 오분류 발생. 오분류된 "바탕쪽"의 특징:
- `text_width = 0, text_height = 0` (실제 바탕쪽은 반드시 비-제로 영역)

### 증상 (이슈 #147)

- aift.hwp 4페이지 상단에 "기업 소개 및 본 과제 관련 기술력 소개" 텍스트 표시
- 한컴에서는 해당 구역에 바탕쪽 없음
- `dump` 결과 구역 2의 바탕쪽에 영역 0×0 HU 바탕쪽 2개 등록

## 수정 (이중 방어)

### 파서 레벨 (body_text.rs:653)

```rust
// AFTER: 0×0 LIST_HEADER는 오분류로 간주하여 skip
if text_width == 0 && text_height == 0 {
    continue;
}
```

→ 바탕쪽 목록 자체에 포함되지 않음 (근본 방어).

### 렌더러 레벨 (layout.rs:742, build_master_page)

```rust
// AFTER: 기존 데이터가 0×0을 포함할 수 있으므로 렌더 단계에서도 skip
if mp.text_width == 0 && mp.text_height == 0 {
    return;
}
```

→ 파싱 단계에서 놓치거나 기존 데이터 호환을 위한 2차 방어.

## 설계 검증

| 설계 요소 | 평가 |
|----------|------|
| 0×0 조건 | ✅ 실제 바탕쪽은 반드시 비-제로 영역 가짐 — 기준으로 타당 |
| 이중 방어 (파서 + 렌더러) | ✅ 파서 1차 방어로 근본 해결 + 렌더러 2차 방어로 안전성 확보. 과도하지 않음 |
| MEMO 외 다른 컨트롤 영향 | ✅ 실제 바탕쪽이 0×0인 경우는 HWP 스펙상 invalid. 정당한 사용 케이스 없음 |
| LIST_HEADER 다른 용도 | ✅ `parse_master_pages_from_raw` 함수 내에서만 필터 — 다른 LIST_HEADER 사용처(본문, 표 셀 등) 영향 없음 |
| 렌더 가드 위치 | ✅ `build_master_page` 진입 초기에서 return — 호출 오버헤드 최소 |
| Golden SVG 등록 | ✅ aift.hwp 4페이지 전체 스냅샷 — 회귀 감지 |

## 메인테이너 검증 결과

### PR 브랜치 체크아웃 + devel 자동 merge 후 검증

자동 merge 충돌 없음. 머지 상태에서 검증:

| 항목 | 결과 |
|------|------|
| `cargo test --test svg_snapshot` | ✅ **6 passed / 0 failed** (issue_147 포함: issue_157, issue_267, table-text, form_002, determinism) |
| `cargo test --lib` 전체 | ✅ **964 passed / 0 failed / 1 ignored** |
| `cargo clippy --lib -- -D warnings` | ✅ clean |
| `cargo check --target wasm32-unknown-unknown --lib` | ✅ clean |

### 메인테이너 WASM 브라우저 검증 (2026-04-24)

- Docker로 WASM 재빌드: `pkg/rhwp_bg.wasm` 갱신 (16:26)
- rhwp-studio + 호스트 Chrome 에서 `samples/aift.hwp` 4페이지 시각 확인
- 작업지시자 최종 판정: **검증 성공** — "기업 소개…" 텍스트 미출력 확인

## 브랜치 상태

- **BEHIND 원인**: PR #266/#273이 이미 devel에 merge되었고 브랜치는 #266 이전 지점에서 분기
- **자동 merge 가능**: PR #266/#273의 변경이 이 브랜치에 **이미 포함**되어 있어 실질 충돌 없음
- **3-dot diff 기준 실질 변경**: parser/body_text.rs, renderer/layout.rs (+build_master_page 관련), golden issue-147 추가

## 리스크 평가

| 리스크 | 판정 |
|--------|------|
| 실제 0×0 바탕쪽 케이스 차단 | ✅ HWP 스펙상 바탕쪽은 비-제로 영역 필수 — 정당한 케이스 없음 |
| 기존 golden 회귀 | ✅ svg_snapshot 6개 모두 통과 (신규 issue_147 포함 기존 5개 회귀 없음) |
| 다른 파싱 경로 영향 | ✅ `parse_master_pages_from_raw` 내부만 변경. 본문/표 파서와 독립 |
| 렌더러 다중 진입점 | ✅ `build_master_page`는 바탕쪽 전용 진입 함수. 가드가 정확한 위치 |
| wasm32 호환 | ✅ `cargo check` 통과 |

## 문서 품질

CLAUDE.md 절차 준수:

- ✅ 수행계획서: `mydocs/plans/task_m100_147.md`
- ⚠️ 구현계획서 `mydocs/plans/task_m100_147_impl.md` — **PR diff에 없음** (누락)
- ⚠️ 단계별 보고서 `mydocs/working/task_m100_147_stage*.md` — **PR diff에 없음** (누락)
- ⚠️ 최종 보고서 `mydocs/report/task_m100_147_report.md` — **PR diff에 없음** (누락)
- ⚠️ orders 갱신 — PR diff에는 Task #267 섹션만 포함, Task #147 섹션 **없음**

**문서 누락 사항 다수** — 단 기술적 수정 자체는 명확하고 검증 우수.

## 관련 이슈 (작성자 표기 실수)

이슈 본문 확인 결과 이슈 #147의 제목은 "메모 컨트롤이 바탕쪽으로 잘못 파싱되어 렌더링되는 버그"로 PR 설명과 일치. 증상 설명과 수정 내용이 정확히 매칭됨.

## 판정

✅ **Merge 권장 (문서 누락 후속 요청)**

**사유:**
1. **루트 원인 정확** — LIST_HEADER의 MEMO 오분류 명확히 식별
2. **수정 범위 최소** — 10줄 변경으로 파서 1차 + 렌더러 2차 방어
3. **이중 방어 설계** — 과도하지 않으면서 안전성 확보
4. 빌드/테스트/clippy/wasm 모두 통과 (**964 passed**, svg_snapshot 6 passed)
5. **자동 merge 충돌 없음** — PR #266/#273 이미 포함되어 추가 충돌 없음
6. Golden SVG 회귀 감지 등록

**후속 요청 (merge 후 별도 커밋):**
- `mydocs/plans/task_m100_147_impl.md` — 구현계획서
- `mydocs/working/task_m100_147_stage*.md` — 단계별 보고서
- `mydocs/report/task_m100_147_report.md` — 최종 보고서
- `mydocs/orders/20260424.md` — Task #147 섹션 추가
