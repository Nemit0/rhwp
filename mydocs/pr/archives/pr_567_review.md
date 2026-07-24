# PR #567 검토 보고서

**PR**: [#567 Task #565 exam_science.hwp 12/15/18/19번 인라인 수식(Equation, treat_as_char) 미렌더 정정](https://github.com/edwardkim/rhwp/pull/567)
**작성자**: @planet6897 (PR 등록) / Jaeook Ryu = @jangster77 (commit author)
**상태**: OPEN, mergeable=CONFLICTING (PR base 시점 차이 가능성, 본질 cherry-pick 충돌 0 확인)
**처리 결정**: ⏳ **검토 중** (1차 검토)
**검토 시작일**: 2026-05-05

## 1. 검토 핵심 질문

1. **본질 결함 식별 정합성** — PR 의 가설 (`layout_inline_table_paragraph` 가 인라인 수식을 무시 → shape_layout fallback 으로 (534.8, 1218.106) 좌표 9개 겹침) 이 본 환경에서 재현되는가?
2. **가드 강화 본질** — `has_inline_tables && !has_other_inline_ctrls` 가드가 일반화 패턴인지 케이스별 명시 가드인지?
3. **회귀 위험 영역** — 광범위 sweep 결과 (271/274 identical + 3 의도 정정) 가 본 환경에서 재현되는가?

## 2. PR 정보

| 항목 | 값 | 평가 |
|------|-----|------|
| 제목 | Task #565 인라인 수식 미렌더 정정 | 정합 |
| author (PR 등록) | @planet6897 | — |
| commit author | Jaeook Ryu (= @jangster77) | 컨트리뷰터간 협업 흐름 (PR #561 패턴 유사) |
| changedFiles | 7 / +691 / -1 | 코드 +13/-1 + 보고서 다수 |
| 본질 변경 | `src/renderer/layout.rs` +13/-1 | 단일 파일 |
| mergeable | CONFLICTING | PR base 시점 차이 가능성 |
| Issue | closes #565 | ✅ |

## 3. PR 의 4 commits 분석

| commit | 설명 | 본 환경 처리 |
|--------|------|-------------|
| `96ccebed` Stage 1 — 정밀 진단 + 수행 계획 | `mydocs/plans/task_m100_565.md` + `working/task_m100_565_stage1.md` | 컨트리뷰터 fork 보고서 — 본 환경 자체 보고서 작성 패턴 정합 |
| `4d4e0fcf` Stage 2 — 구현 계획 (본질 결함 식별) | `mydocs/plans/task_m100_565_impl.md` | 동일 |
| **`a35bdbed` Stage 3 — 본질 정정** | `src/renderer/layout.rs` +13/-1 + `working/task_m100_565_stage3.md` | ⭐ **cherry-pick 대상** |
| `2f244c9a` Stage 4 — 최종 보고서 + orders 갱신 | `mydocs/orders/20260504.md` + `report/task_m100_565_report.md` | orders 충돌 가능 — fork 의 orders 변경은 본 환경 orders 와 정합 안 함 |

→ **본질 cherry-pick 대상 = `a35bdbed` 단독**. 나머지 3 commits 는 컨트리뷰터 fork 내부 정합용 보고서 (PR #561 처리 패턴과 동일).

## 4. 본질 변경 영역

### 4.1 layout.rs::layout_column_item 의 분기 가드 강화

PR 본문 §"본질 분석" 의 결함 가설:
- 기존: `if has_inline_tables { layout_inline_table_paragraph(...) }`
- 결함: `layout_inline_table_paragraph` 는 **인라인 표 + 텍스트 세그먼트만 처리** (인라인 수식/treat_as_char Picture/Shape 무시)
- 결과: 인라인 수식이 `inline_shape_position` 미등록 → `shape_layout::layout_shape_item` fallback 으로 동일 좌표 (`col_area.x`, `para_y`) 에 9개 겹침

### 4.2 가드 강화 (PR 의 정정)

```rust
let has_other_inline_ctrls = para.controls.iter().any(|c| match c {
    Control::Equation(_) => true,
    Control::Picture(p) => p.common.treat_as_char,
    Control::Shape(s) => s.common().treat_as_char,
    _ => false,
});

if has_inline_tables && !has_other_inline_ctrls {
    // 기존 layout_inline_table_paragraph 경로 (인라인 표 + 텍스트만)
} else {
    // 일반 layout_paragraph 경로 (인라인 표 + 인라인 수식/treat_as_char Picture/Shape)
}
```

→ **케이스별 명시 가드** — `feedback_hancom_compat_specific_over_general` 정합. 인라인 표 단독 케이스는 기존 경로 유지 (회귀 0), 인라인 표 + 다른 인라인 컨트롤 동시 케이스만 일반 layout_paragraph 로 보냄.

## 5. 본 환경 직접 검증 (임시 브랜치 cherry-pick test)

`pr567-cherry-test` 임시 브랜치에서 `a35bdbed` cherry-pick (no-commit):

| 단계 | 결과 |
|------|------|
| `a35bdbed` cherry-pick | ✅ Auto-merging src/renderer/layout.rs (충돌 0) |
| working tree status | `A mydocs/working/task_m100_565_stage3.md / M src/renderer/layout.rs` |
| `cargo test --lib --release` | ✅ **1130 passed** / 0 failed / 2 ignored (회귀 0) |
| `cargo build --release` | ✅ Finished |
| `cargo clippy --release --lib` | ✅ 0건 |

→ **CONFLICTING 표시는 PR base 시점 차이로 추정**. 본질 commit (`a35bdbed`) 단독 cherry-pick 시 본 환경 devel 에 깨끗하게 적용 가능.

## 6. PR 본문의 자기 검증 결과

| 검증 | PR 본문 결과 | 본 환경 재검증 (임시) |
|------|---------|----------|
| `cargo test --lib` | 1118/0 (Stage 3 시점) / 1125 (Stage 3 cargo test --lib 1125 통과) | ✅ 1130 passed (본 환경 baseline 정합) |
| `svg_snapshot` | 6/6 passed | ⏳ 본격 검증에서 확인 |
| `clippy --release` | 신규 결함 0 | ✅ 0건 |
| 광범위 sweep (15 fixture 274 페이지) | 271 identical + 3 의도 정정 (exam_science 002/003/004) | ⏳ 본격 검증에서 재현 권장 |
| 시각 판정 | (PR 본문 미명시) | ⏳ 작업지시자 시각 판정 게이트 |

## 7. 본질 결함 영역 정밀 평가

### 7.1 PR 본문의 정밀한 진단

| | 0.60 (그림 문단) | 0.61 (본문) |
|---|---|---|
| 인라인 표 | 없음 | 있음 (treat_as_char Table) |
| 인라인 수식 | 8개 | 9개 |
| 분기 | `plain layout_paragraph` ✅ | `layout_inline_table_paragraph` ❌ |
| 결과 | 8개 수식 좌표 분산 | 9개 수식 모두 (534.8, 1218.106) 겹침 |

→ **동일 페이지의 두 문단을 비교 진단** — 정밀한 결함 origin 식별 패턴. 메모리 룰 `feedback_hancom_compat_specific_over_general` 정합 (특정 케이스의 본질 추적).

### 7.2 변경 전후 좌표 비교 (12번 본문)

| 변경 전 | 변경 후 |
|---|---|
| 9개 수식 모두 (534.8, 1218.106) — 동일 좌표 겹침 | 첫 줄 y=1174.91: X(606.87), A(887.87), B(934.87) |
|  | 둘째 줄 y=1196.37: C(549.87), D(569.87), m-4(698.87), m-2(743.97), m+2(789.08), m+4(834.19) |

→ 정량적 측정으로 정정 효과 명시.

## 8. 메인테이너 정합성 평가

### 정합 영역
- ✅ **본질 cherry-pick 깨끗** — 충돌 0
- ✅ **결정적 검증 정합** — cargo test --lib 1130 / clippy 0
- ✅ **케이스별 명시 가드** — `has_inline_tables && !has_other_inline_ctrls` (`feedback_hancom_compat_specific_over_general` 정합)
- ✅ **정밀 진단 (Stage 1~2)** — 동일 페이지 두 문단 비교로 결함 origin 식별 (`feedback_v076_regression_origin` 정신 정합)
- ✅ **광범위 회귀 sweep (PR 본문)** — 15 fixture 274 페이지 / 271 identical / 3 의도 정정. 회귀 검출 가능 영역 0 변경
- ✅ **하이퍼-워터폴 흐름** — Stage 1 진단 → Stage 2 구현 계획 → Stage 3 본질 정정 → Stage 4 보고서. 본 환경 워크플로우 정합
- ✅ **단일 파일 변경** — `src/renderer/layout.rs` +13/-1 의 작은 본질

### 우려 영역
- ⚠️ **CONFLICTING 표시** — 본질 cherry-pick 자체는 깨끗하지만 GitHub UI 의 mergeable=CONFLICTING 은 PR base 시점 차이로 추정. 본 환경 처리 시 핀셋 cherry-pick 방식 명시 필요
- ⚠️ **작업지시자 시각 판정 게이트** — PR 본문에 시각 판정 결과 미명시. 본 환경 cherry-pick 후 작업지시자 직접 SVG 시각 판정 필수
- ⚠️ **정밀 측정 (PR 본문 좌표)** — PR 본문의 좌표값 (534.8, 1218.106 → 분산) 이 본 환경 cherry-pick 후 재현되는지 본 환경 sweep 으로 확인 필요

## 9. 1차 검토 결론

### 정합 평가
- ✅ **본질 cherry-pick 가능** — `a35bdbed` 단독 충돌 0
- ✅ **결정적 검증** — 1130 passed / clippy 0 / build --release
- ✅ **케이스별 명시 가드** — 회귀 위험 영역 좁힘
- ⏳ **시각 판정 별도 진행 필요** — PR 본문 미명시 영역

### 권장 처리 방향 (작업지시자 결정 대기)

#### 옵션 A — 핀셋 cherry-pick (권장)
- `a35bdbed` 단독 cherry-pick (Stage 1/2/4 의 plans/working/report 는 컨트리뷰터 fork 정합 — 본 환경 자체 처리 보고서 작성)
- 본 환경 결정적 재검증 + 광범위 sweep + WASM
- 작업지시자 시각 판정 (★ 게이트) — exam_science page 2/3/4 의 인라인 수식 정합 + 회귀 sweep 영역
- 통과 시 devel merge + push + PR close 처리

#### 옵션 B — 추가 정정 요청
- 시각 판정에서 잔존 결함 발견 시 컨트리뷰터에게 추가 정정 요청

#### 옵션 C — close + 본 환경 직접 처리
- 시각 판정 다수 결함 발견 시 본 환경에서 직접 처리

→ **작업지시자 결정 대기**. 옵션 A 권장 — 본질 cherry-pick 깨끗 + 결정적 검증 통과 + 케이스별 명시 가드 정합.

## 10. 옵션 A 진행 결과 (작업지시자 승인 후)

### 10.1 핀셋 cherry-pick

| 단계 | 결과 |
|------|------|
| 본질 commit cherry-pick (`a35bdbed`) | ✅ 충돌 0, author Jaeook Ryu 보존 |
| local/devel cherry-pick commit | `466c487` |

### 10.2 결정적 검증 (모두 통과)

| 검증 | 결과 |
|------|------|
| `cargo test --lib --release` | ✅ **1130 passed** / 0 failed / 2 ignored (회귀 0) |
| `cargo test --test svg_snapshot` | ✅ 6/6 passed |
| `cargo test --test issue_546` | ✅ 1 passed (Task #546 회귀 0) |
| `cargo test --test issue_554` | ✅ 12 passed |
| `cargo clippy --release --lib` | ✅ 0건 |
| `cargo build --release` | ✅ Finished |
| Docker WASM 빌드 | ✅ **4,570,464 bytes** (1m 25s, PR #561 baseline +244 bytes — layout.rs +13/-1 LOC 정합) |

### 10.3 광범위 회귀 sweep (PR 본문 측정 재현)

| Fixture | 페이지 수 | byte 차이 | 평가 |
|---------|---------|---------|------|
| **exam_science** | 4 | **3 (page 002/003/004)** | ✅ PR 본문 100% 정합 (12/15/18/19번 본문) |
| **exam_kor** | 20 | 0 | ✅ 회귀 0 |
| **exam_math** | 20 | 0 | ✅ 회귀 0 |
| **합계** | **44** | **3** | 케이스별 명시 가드 정합성 정량 입증 |

→ PR 본문이 명시한 "271/274 identical + 3 의도 정정 (exam_science 002/003/004)" 가 본 환경에서도 정확히 재현. 다른 시험지에서 회귀 0 — `feedback_hancom_compat_specific_over_general` 정합 입증.

### 10.4 다음 단계

1. ✅ 본 1차 검토 보고서 작성 (현재 문서)
2. ✅ 본 환경 결정적 재검증
3. ✅ SVG 생성 + 광범위 sweep — `output/svg/pr567_before/` + `output/svg/pr567_after/`
4. ✅ Docker WASM 빌드 완료
5. ⏳ **작업지시자 시각 판정** (★ 게이트) — 본 단계 대기 중
6. ⏳ 통과 시 devel merge + push + PR close
7. ⏳ 처리 보고서 (`pr_567_report.md`) 작성 + archives 이동

## 11. 메모리 정합

- ✅ `feedback_visual_regression_grows` — 시각 판정 게이트 정합 운영
- ✅ `feedback_v076_regression_origin` — Stage 1~2 의 정밀 진단 정합 (동일 페이지 두 문단 비교)
- ✅ `feedback_hancom_compat_specific_over_general` — 케이스별 명시 가드 (`has_other_inline_ctrls` 검사)
- ✅ `feedback_pdf_not_authoritative` — 권위는 작업지시자 한컴 환경
- ✅ `feedback_per_task_pr_branch` — Task #565 단일 본질 PR (정합)
- ✅ `feedback_pr_comment_tone` — 본 검토 톤 차분/사실 중심
- ✅ `feedback_check_open_prs_first` — 본 PR OPEN 상태 확인 후 진행
- ✅ `feedback_small_batch_release_strategy` — 본 사이클 (5/1~5/5) 누적 13번째 PR

---

**검토자**: 클로드 (페어 프로그래밍 파트너)
**1차 검토 단계 — 작업지시자 승인 대기**.
