# PR #1054 검토 — VPOS_CORR lazy_base trailing-ls bridge 정합 (closes #1049)

## 1. PR 정보

| 항목 | 값 |
|------|-----|
| 번호 | #1054 |
| 제목 | fix(renderer): VPOS_CORR lazy_base trailing-ls bridge 정합 — 본문 하단 잔여 overflow 해소 (closes #1049) |
| 작성자 | planet6897 (Jaeuk Ryu) — 누적 컨트리뷰터 (오늘 PR #1039/#1044 머지, #1045 close, #1048 rebase 요청 중) |
| base ← head | `devel` ← `planet6897:pr/task1049-vpos-lazybase` |
| 라벨 | enhancement (실제 bug fix) |
| 변경 | 7 파일 +500 / -5 — **소스 1 (`height_cursor.rs` +22/-5)**, 문서 6 |
| 연결 이슈 | `closes #1049` (PR #1048 본문에서 분리 명시한 이슈) |
| mergeable | **MERGEABLE / BEHIND** — `height_cursor.rs` 가 base 이후 다른 PR 미수정 → 자동 머지 가능 (PR #1048 의 CONFLICTING 과 차별) |
| CI | Build & Test ✅ / Analyze rust·js·py ✅ / Canvas visual diff ✅ / CodeQL ✅ / WASM skip |
| 본질 commit | **단일 `71b58b6d`** |
| 정량 측정 | cargo test 1517 passed 0 failed, 골든 SVG 무회귀 |
| 생성 | 2026-05-21 04:35 |

## 2. 배경 (이슈 #1049, PR #1048 분리)

### 2.1 supersede chain (#1022 → #1046 → #1049)

```
PR #1022 (closes #1022): 분할 표 cut 모델(RowCut), 사후 reflow(A) — 측정 드리프트로 실패
   ↓ A 폐기, B 전환 (작업지시자 결정)
PR #1048 (closes #1046): 측정 통일(B), LAYOUT_OVERFLOW 18→5
   ↓ 잔여 4.6px (pi=781) 분리 + #1046 가설 "줄높이 과대 계산"
이슈 #1049: 별도 분리
   ↓ #1046 가설 반증 + 진짜 원인 식별
PR #1054 (본 PR, closes #1049): vpos_adjust lazy_base trailing-ls bridge 정합
```

### 2.2 #1046 가설 반증 + 진짜 원인

**#1046 가설**: "렌더러 줄높이 과대 계산" (특정 문단 line=110% 등에서
vpos 피치 초과)

**본 PR 본문 (반증)**: `corrected_line_height` 는 정확 (20.0px). **진짜
원인은 `src/renderer/height_cursor.rs::vpos_adjust` 의 `lazy_base` 오산출**:

1. 인라인 TAC 표 (예: 폼 헤더의 1×1 표) 직후 `vpos_page_base` 리셋
   (`layout.rs:2538`) → lazy 경로 전환
2. 이때 Task #1022 v2 **trailing-ls bridge** (`+ trailing_ls_hu`) 가 직전
   본문 문단의 trailing 줄간격 (예: 제목 960 HU = 12.8px) 을 base 에서
   또 빼 `lazy_base` 과소산출
3. 이후 lazy 문단 전부 +12.8px **과대 전진** → 페이지 마지막 줄이 본문
   하단을 4.6px 초과
4. **페이지네이터 (typeset) 는 인라인 TAC 표에 base 리셋 안 함 → 정확**
   → **렌더러·페이지네이터 발산**이 본질

`feedback_diagnosis_layer_attribution` 권위 사례 — 가설 반증 후 진짜
원인 정확 식별. `feedback_image_renderer_paths_separate` 영역 본질 명시
(렌더러 vs 페이지네이터 발산).

## 3. 변경 내용 (`src/renderer/height_cursor.rs`, +22/-5)

### 3.1 핵심 좁힘 가드

```rust
// [Task #1049] 직전이 실텍스트 본문 문단이고 vpos가 연속이면 bridge를 끈다
let prev_has_text = prev_para.text.chars()
    .any(|c| c > '\u{001F}' && c != '\u{FFFC}');
let vpos_continuous = matches!(curr_first_vpos, Some(v) if v <= prev_vpos_end);
let trailing_ls_hu = if vpos_continuous && prev_has_text {
    0  // bridge 끔 — trailing_ls가 이미 연속 vpos에 포함됨
} else {
    paragraphs.get(prev_pi)
        .and_then(|p| p.line_segs.last())
        .map(|s| s.line_spacing.max(0))
        .unwrap_or(0)  // 종전대로 bridge 적용 (#1022 v2)
};
```

### 3.2 좁힘 2 조건 동시 만족 시만 bridge 끔

- `vpos_continuous`: `curr_first_vpos <= prev_vpos_end` (vpos 연속, 인라인
  TAC 표 직후 같은 영역)
- `prev_has_text`: 직전이 실텍스트 본문 문단 (제어 문자 / `\u{FFFC}` 제외)

### 3.3 비회귀 영역 (종전 bridge 유지)

- **vpos gap** (`curr_first_vpos > prev_vpos_end`): 상단 박스/도형 뒤 본문,
  footnote-01 p1 — bridge 유지
- **직전이 빈 문단** (`prev_has_text == false`): 복학원서 page1 (빈 문단 뒤
  폼 표) — 렌더러의 빈줄 높이 억제로 trailing_ls 가 sequential y 에 반영
  안 될 수 있어 bridge 유지

## 4. 검토 항목

### 4.1 설계 적합성 — 메모리 룰 정합 ✅

- **`feedback_hancom_compat_specific_over_general`**: **2 조건 동시
  만족 케이스별 구조 가드** (vpos 연속 + 실텍스트 본문). 측정 의존 분기
  없음. 다른 케이스 (gap, 빈 문단) 종전 동작 명시 보존.
- **`feedback_diagnosis_layer_attribution`**: #1046 가설 ("줄높이 과대
  계산") 반증 + 진짜 원인 (`lazy_base` trailing-ls bridge 이중 차감)
  정확 식별. 진단 vs 정정 본질 명료.
- **`feedback_image_renderer_paths_separate`**: 렌더러 (`height_cursor.rs`)
  와 페이지네이터 (`typeset.rs`) 발산을 핵심 본질로 명시 + 본 PR 이
  렌더러 측 정합으로 통일.
- **`feedback_small_batch_release_strategy`**: 단일 commit + 단일 파일
  (`height_cursor.rs` +22/-5). 17 라인 실 변경 (가드 + 주석).
- **`feedback_pr_supersede_chain`**: #1022 → #1046 → #1049 chain 정직
  명시 + #1046 가설 반증으로 chain 정합.
- **scope 정직**: PR 본문 1 지점 수정, 다른 모듈 무관.

### 4.2 코드 품질 ✅

- **주석 매우 명료**: `[Task #1049]` 태그 + 본질 + 비회귀 영역 (footnote-01
  p1, 복학원서) 명시
- **`prev_has_text` 정의**: `> '\u{001F}'` (제어 문자 제외) + `!= '\u{FFFC}'`
  (object replacement char 제외) — 정확한 실텍스트 판정
- **`vpos_continuous` 정의**: `v <= prev_vpos_end` — gap 안전한 비교 (`==`
  대신 `<=`, 정확 일치 아니라 연속 영역 일반화)
- 큰 지적 사항 없음

### 4.3 검증 충실성 ✅

PR body 검증 결과:
- `cargo test --release`: **1517 passed / 0 failed** ✅
- `cargo clippy`: 경고 0 ✅
- 골든 SVG 전수 — footnote-01·복학원서 포함 무회귀 ✅
- 한컴 2022 PDF (보안 서약서 폼) 시각 정합 대조 — 마지막 줄 본문 내 배치 확인 (PR 자가 검증)

### 4.4 PR #1048 과의 관계 — supersede 후속 ✅

- PR #1048 본문이 분리 명시한 #1049 의 후속 fix
- **PR #1048 머지 전에 본 PR 머지 가능한가?** — 본 PR 의 변경 영역
  (`height_cursor.rs`) 은 PR #1048 의 영역 (`typeset.rs`, `layout.rs`,
  `paragraph_layout.rs`, `rendering.rs`) 과 **다름** → 독립 머지 가능
- 단 PR #1048 의 측정 통일 효과 (LAYOUT_OVERFLOW 18→5) 가 본 PR 머지 시점
  에 적용 안 된 devel 에서는 본 PR 단독 효과만 측정 가능 (잔여 4.6px
  해소만)

### 4.5 잔존 / scope 외

- 라벨 "enhancement" vs 실제 bug fix — 마이너 불일치
- 이슈 #1049 assignee 누락 — PR #1031/#950/#1039/#1044/#1045/#1048 와
  동일 패턴 (본인 작성). 메모리 룰 `feedback_assign_issue_before_work`
  안내 후보, merge blocker 아님

### 4.6 #1055 회귀와의 관계 — 무관 확인 ✅

- #1055 = `text_measurement.rs` 영역 (WASM 폰트 폭 정합)
- 본 PR = `height_cursor.rs` 영역 (렌더러 vpos lazy_base)
- 영역 격리. 본 PR 머지가 #1055 추가 회귀 유발 안 함.

## 5. 처리 절차 (간소화 4단계)

1. ✅ PR 정보 확인 (본 문서 §1~2)
2. → 본 검토 문서 작성 + 작업지시자 승인 요청 (현 단계)
3. (불요 예상) 코드 품질 양호, 본 PR 수정요청 항목 없음
4. 검증 (로컬 빌드/테스트 + 작업지시자 시각 판정 결정) → `pr_1054_report.md`

## 6. 1차 판단 (작업지시자 승인 전 잠정)

| 영역 | 평가 |
|------|------|
| 설계 방향 | ✅ 적합 — 2 조건 좁힘 가드 + 진단 본질 정확 |
| CI / 결정적 검증 | ✅ 통과 (1517 passed, 골든 SVG 무회귀) |
| 코드 품질 | ✅ 양호 — 주석/가드/비회귀 영역 명시 모두 명료 |
| scope | ✅ 단일 파일 단일 함수 1 지점, ~17 라인 실 변경 |
| **#1046 가설 반증** | ✅ 진단 본질 정확 — `feedback_diagnosis_layer_attribution` 권위 사례 |
| **렌더러·페이지네이터 발산 정합** | ✅ `feedback_image_renderer_paths_separate` 영역 정합 |
| 시각 검증 | ⚠️ 일반 게이트 (PR #1039/#1044 패턴 — 정량 게이트 면제 가능 후보) |
| 이슈 연결 | #1049 assignee 누락 (안내 후보, merge blocker 아님) |
| #1048 과의 관계 | ✅ 독립 영역, 독립 머지 가능 |
| #1055 와의 관계 | ✅ 무관 |

**잠정 결론**: 코드·설계·검증 모두 양호. PR #1044 패턴 (정밀 진단 +
좁힘 가드 + 결정적 측정 + 회귀 가드 통과) + #1046 가설 반증의 진단 본질
정확성으로 **PR #1044 보다 더 강한 검증** (가설 반증까지 포함).

**머지 전 1개 게이트**: 시각 판정 — PR #1039/#1044 패턴 (정량 게이트
충족 시 면제 가능) 적용 후보. 본 PR 은 PR #1048 과 달리 단일 파일 좁은
fix 라 면제 적절.

> 본 문서는 검토 계획 + 항목 통합. 작업지시자 승인/피드백 후
> 검증 단계 → `pr_1054_report.md` 로 최종 판단 기록.
