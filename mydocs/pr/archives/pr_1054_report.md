# PR #1054 최종 보고서 — VPOS_CORR lazy_base trailing-ls bridge 정합

- PR: [#1054](https://github.com/edwardkim/rhwp/pull/1054)
- 제목: fix(renderer): VPOS_CORR lazy_base trailing-ls bridge 정합 — 본문 하단 잔여 overflow 해소 (closes #1049)
- 작성자: planet6897 (Jaeuk Ryu) — 누적 컨트리뷰터
- base ← head: `devel` ← `planet6897:pr/task1049-vpos-lazybase`
- 결정: **merge (수용)** — 정량 게이트 충족, 시각 판정 면제 (PR #1044 패턴)
- 일자: 2026-05-21

## 1. 결정

**merge 수용.** #1046 가설 반증 + 진짜 원인 정확 식별 (`vpos_adjust`
의 `lazy_base` trailing-ls bridge 이중 차감) + 2 조건 좁힘 가드 + 결정적
측정 + 회귀 가드 통과 모두 충족.

**시각 판정 면제** — 작업지시자 결정. 본 PR 은 PR #1044 패턴 (단일
파일 좁힘 fix + 결정적 측정 + 회귀 가드 통과) 으로 정량 게이트만으로
충족.

이슈 #1049 는 OPEN, planet6897 본인 작성, assignee 비어있음. PR merge
처리 후 명시 close 처리 (`feedback_close_issue_verify_merged` 정합).

## 2. 검증 결과

| 게이트 | 결과 |
|--------|------|
| CI: Build & Test | ✅ pass |
| CI: Analyze rust/js/py | ✅ pass |
| CI: Canvas visual diff | ✅ pass |
| CI: CodeQL | ✅ pass |
| PR 본문: `cargo test --release` | ✅ **1517 passed / 0 failed** |
| PR 본문: `cargo clippy` | ✅ 경고 0 |
| PR 본문: 골든 SVG 전수 — footnote-01·복학원서 무회귀 | ✅ |
| PR 본문: 한컴 2022 PDF 정합 (보안 서약서 폼) | ✅ (PR 자가 검증) |
| **작업지시자 시각 판정** | **면제 (작업지시자 결정)** — PR #1044 패턴 |

### 시각 판정 면제 근거 (PR #1044 패턴)

본 PR 은 다음 조건 동시 만족으로 정량 게이트가 시각 판정 대체:
1. **결정적 측정** (본문 하단 잔여 4.6px overflow 해소)
2. **회귀 가드 단위 테스트** (`cargo test --release` 1517 passed, 골든 SVG 무회귀)
3. **단일 책임 scope** (`height_cursor.rs` 단일 파일, `vpos_adjust` 단일 함수 1 지점, ~17 라인 실 변경)
4. **2 조건 좁힘 가드** (vpos 연속 + 실텍스트 본문 동시 만족 시만 bridge 끔)
5. **비회귀 영역 명시** (footnote-01 p1 vpos gap, 복학원서 빈 문단 — 종전 동작 보존)

## 3. 변경 내용

### 3.1 `src/renderer/height_cursor.rs` (+22/-5)

`vpos_adjust` 의 trailing-ls bridge 를 2 조건 좁힘 가드로 한정:

```rust
let prev_has_text = prev_para.text.chars()
    .any(|c| c > '\u{001F}' && c != '\u{FFFC}');
let vpos_continuous = matches!(curr_first_vpos, Some(v) if v <= prev_vpos_end);
let trailing_ls_hu = if vpos_continuous && prev_has_text {
    0  // bridge 끔
} else {
    /* 종전대로 bridge 유지 (#1022 v2) */
};
```

### 3.2 비회귀 영역 (종전 bridge 유지)

- **vpos gap** (`curr_first_vpos > prev_vpos_end`): 상단 박스/도형 뒤 본문,
  footnote-01 p1 — bridge 유지
- **직전이 빈 문단** (`prev_has_text == false`): 복학원서 page1 — bridge 유지

전체: +22/-5 (실 변경 ~17 라인, 가드 + 주석 명료화).

## 4. Root cause + 진단 본질

### 4.1 #1046 가설 반증 + 진짜 원인 식별

**#1046 가설**: "렌더러 줄높이 과대 계산" (특정 문단 line=110% 등)

**본 PR 반증**: `corrected_line_height` 는 정확 (20.0px). **진짜 원인은
`vpos_adjust::lazy_base` 의 trailing-ls bridge 이중 차감**:

1. 인라인 TAC 표 (예: 폼 헤더의 1×1 표) 직후 `vpos_page_base` 리셋
   (`layout.rs:2538`) → lazy 경로 전환
2. Task #1022 v2 **trailing-ls bridge** (`+ trailing_ls_hu`) 가 직전 본문
   문단의 trailing 줄간격 (예: 제목 960 HU = 12.8px) 을 base 에서 또
   빼서 `lazy_base` 과소산출
3. 이후 lazy 문단 +12.8px 과대 전진 → 페이지 마지막 줄이 본문 하단을
   4.6px 초과
4. **페이지네이터 (typeset) 는 인라인 TAC 표에 base 리셋 안 함 → 정확**
5. → **렌더러·페이지네이터 발산**이 본질

### 4.2 메모리 룰 정합

- **`feedback_diagnosis_layer_attribution`** (권위 사례): #1046 가설 ("줄
  높이 과대 계산") 반증 후 진짜 원인 (`lazy_base` trailing-ls bridge
  이중 차감) 정확 식별. 진단 vs 정정 본질 명료.
- **`feedback_image_renderer_paths_separate`**: 렌더러 (`height_cursor.rs`)
  와 페이지네이터 (`typeset.rs`) 발산을 핵심 본질로 명시.
- **`feedback_hancom_compat_specific_over_general`**: 2 조건 동시 만족
  케이스별 구조 가드. 측정 의존 분기 없음.
- **`feedback_small_batch_release_strategy`**: 단일 commit + 단일 파일
  + ~17 라인 실 변경.
- **`feedback_pr_supersede_chain`**: #1022 → #1046 (PR #1048) → #1049
  (본 PR) chain 정직 명시.

## 5. supersede chain (정직 명시)

```
PR #1022 (#1022 분할 표 cut 모델, 사후 reflow A 시도 — 측정 드리프트로 실패)
   ↓ A 폐기, B 전환 (작업지시자 결정)
PR #1048 (#1046, 측정 통일 B): LAYOUT_OVERFLOW 18→5 (rebase 요청 중)
   ↓ #1046 가설 "줄높이 과대 계산" + 잔여 4.6px (pi=781) 분리
이슈 #1049 별도 분리
   ↓ 가설 반증 + 진짜 원인 식별
PR #1054 (본 PR, closes #1049): lazy_base trailing-ls bridge 이중 차감 정합
```

## 6. cherry-pick 처리

PR 본질 commit:
- `71b58b6d` fix(renderer): VPOS_CORR lazy_base trailing-ls bridge 정합 (closes #1049)

처리: 단일 commit author (planet6897 / Jaeuk Ryu) 보존 cherry-pick.
clean-up 후속 commit 없음 (코드 품질 지적 사항 없음).

## 7. 잔존 / 후속

### 본 PR scope 외

- **이슈 #1049 assignee 누락** — PR #1031/#950/#1039/#1044/#1045/#1048 와
  동일 패턴. 메모리 룰 `feedback_assign_issue_before_work` 안내 후보,
  merge blocker 아님.
- **라벨 "enhancement" vs 실제 bug fix** — 마이너 불일치.

### 독립 영역 — 본 PR scope 외

- **PR #1048** (rebase 요청 중) — `typeset.rs`/`layout.rs`/`paragraph_layout.rs`/`rendering.rs`
  영역, 본 PR 의 `height_cursor.rs` 와 독립. 본 PR 머지 후 PR #1048
  rebase 시 영향 없음.
- **이슈 #1055** (회귀, hwp3-sample16-hwp5.hwp p2 목차) — `text_measurement.rs`
  영역, 본 PR 의 `height_cursor.rs` 와 독립.
- 다른 OPEN PR 들 (#1051 postmelee, #1019 postmelee 등) — 본 PR 처리와 독립

## 8. 산출물

- `mydocs/pr/pr_1054_review.md` (검토 문서)
- 본 보고서
- 소스: PR `height_cursor.rs:122-145` 2 조건 좁힘 가드

## 9. 메모리 룰 갱신 검토

- `project_external_contributors`: planet6897 = 등재된 누적 기여자.
  갱신 불요.
- **신규 룰 후보 — "PR #1044 / PR #1054 가 PR #1039 의 정량 게이트 면제
  패턴 확장 권위 사례"**: 단일 파일 좁힘 fix + 결정적 측정 + 회귀 가드
  단위 테스트 통과 + 비회귀 영역 명시 4 조건 동시 만족 시 시각 판정
  면제 가능. PR #1039 → #1044 → #1054 세 사례 누적으로 메모리 룰 정리
  task 후보 (별도, 본 처리와 독립).
- **신규 룰 후보 — "#1046 가설 반증 + 진짜 원인 식별 권위 사례"**:
  `feedback_diagnosis_layer_attribution` 강화 — 가설 → 측정 → 반증 →
  진짜 원인의 진단 사이클 모범 사례. PR #1054 가 첫 권위 사례.
