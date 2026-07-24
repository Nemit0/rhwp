# PR #1015 검토 — Task #1012: wrap 옵션 paragraph 라벨 텍스트 y 위치 정정

- 작성일: 2026-05-20
- 컨트리뷰터: [@jangster77](https://github.com/jangster77) (Taesup Jang)
- PR: https://github.com/edwardkim/rhwp/pull/1015
- base/head: `devel` ← `jangster77:local/task1012`
- 연결 이슈: closes #1012 (test-image.hwp paragraph 텍스트 라벨 누락 — wrap 옵션 혼재)
- 규모: +385 / -0, 8 files (소스 1: `paragraph_layout.rs` +14줄 / fixture 2 / 문서 5)
- mergeable: **MERGEABLE**
- 본질 커밋: 단일 `002d4d24` (작성자 Taesup Jang)

## 1. 컨트리뷰터 사이클 / 시리즈 위치

@jangster77 24+ 사이클. #997~#1011 시리즈 마무리(5/19~5/20) 직후 **#1011 잔존(test-image paragraph 텍스트 라벨 누락)의 직접 후속**. PR #1011 이 fixture 추가 + 결함 명시 → PR #1015 가 해당 결함 해소.

## 2. 변경 내용 (단일 14줄 add-only fallback)

`src/renderer/layout/paragraph_layout.rs::layout_composed_paragraph` 의 spacing_before 처리 직후 add-only 블록 추가:

```rust
// [Task #1012] paragraph 첫 line vpos > 0 인데 spacing_before=0 으로
// 위 블록 진입 안한 경우 — line_seg.vpos 를 직접 y 에 가산하여 텍스트가
// wrap shape 아래로 위치하도록 함.
if start_line == 0 && spacing_before == 0.0 && is_column_top && para_index == 0 {
    let vpos0_px = para
        .and_then(|p| p.line_segs.first())
        .map(|ls| hwpunit_to_px(ls.vertical_pos, self.dpi))
        .unwrap_or(0.0);
    if vpos0_px > 0.0 {
        y += vpos0_px;
    }
}
```

**Root cause**: 기존 라인 990 분기(`if start_line == 0 && spacing_before > 0.0`)가 `spacing_before > 0` 인 경우만 vpos 클램프 → test-image.hwp pi=0 (spacing_before=0 + vpos=15180 HU) 분기 SKIP → 텍스트가 body_top 에 그려져 Picture[2] TopAndBottom y=132~334 영역 내부 overlap.

**Fix**: spacing_before=0 + 4중 AND 가드(start_line==0 + is_column_top + para_index==0) 추가 분기로 vpos>0 일 때 y에 직접 가산. 결과: 라벨 y=143.6 → **346px** (Picture 영역 아래).

## 3. 검토 의견

### 강점

1. **add-only / 기존 코드 무수정** — 단일 14줄 fallback 블록만 추가. 회귀 표면 최소.
2. **4중 AND 가드** — `start_line==0 + spacing_before==0 + is_column_top + para_index==0`. 섹션 첫 paragraph + 컬럼 최상단 + 첫 라인 + spacing 진입 분기 우회 케이스만 catch. **영역 매우 좁음** (`feedback_hancom_compat_specific_over_general` 정합).
3. **명확한 root cause 진단** — 기존 라인 990 분기와 대칭 보완 (`feedback_diagnosis_layer_attribution` 정합). z-order 부 결함도 본 fix 후 시각 무관(text/image y 영역 완전 분리)으로 자동 해소.
4. **#1011 fixture 재활용** — test-image.hwp/.hwpx 가 #1011 머지로 이미 devel 존재 → cherry-pick 시 fixture 중복 add 충돌 자동 해소 (binary identical).
5. cargo test 1306, clippy 0, fmt 0, 5 sample 페이지 수 보존 (PR 본문).

### ⚠️ 쟁점

#### (A) `layout_composed_paragraph` 공통 경로 — 8+ 호출 사이트

함수가 table_cell_content / picture_footnote / table_layout / shape_layout / table_partial / paragraph_layout 등 **8개 이상 호출 사이트**에서 사용. 4중 AND 가드가 발동되는 케이스가 sample16 / exam 등 다른 fixture 에 존재할 수 있음. **sweep 으로 다른 fixture (특히 wrap shape 보유 + 첫 paragraph + spacing_before=0 케이스) 회귀 부재 확인 필수**.

#### (B) `y += vpos0_px` 무조건 가산 — 다른 wrap 모드 발동 시 영향

vpos 를 절대값으로 가산. 다른 wrap 모드(BehindText/InFrontOfText/Square)에서 4중 AND 가드가 동일하게 발동되면 텍스트 위치 변동 가능. PR 본문은 TopAndBottom 케이스만 검증. 다른 wrap 모드 + 동일 가드 케이스 회귀 확인.

#### (C) 매직 임계값 `(y - col_area.y).abs() < 1.0` (is_column_top 정의)

`is_column_top` 정의가 라인 989: `(y - col_area.y).abs() < 1.0` — 픽셀 단위 tolerance. 본 PR 의 가드가 이 기존 정의 사용. 부동소수점 미세 오차 케이스에서 발동 여부 변동 가능. 단 PR 신규 도입이 아닌 기존 정의 재사용.

### 확인 필요 (검증 단계)

1. cherry-pick `002d4d24` — fixture 중복 add 처리(binary identical 자동 해소 또는 `--ours`/`--theirs` 동일)
2. cargo test --release --lib + clippy -D + fmt 0
3. **sweep** — test-image 타깃 라벨 y=346 + 5 sample 페이지 수 보존(PR 본문) + **wrap shape 보유 fixture(sample16, hy-001 등) wrap 4종 회귀 부재 집중**
4. WASM 빌드 + 작업지시자 시각 판정 — test-image 라벨 위치 + 다른 wrap 케이스 무회귀

## 4. 처리 옵션

- **옵션 A (수용 — 권고)**: #1011 잔존의 직접 해소. add-only / 4중 AND 가드 / fixture 재활용 견고. sweep 회귀 부재 + 작업지시자 시각 판정 통과 시 cherry-pick no-ff merge.
- **옵션 B (수정 요청)**: 다른 wrap 모드(BehindText 등) 또는 일반 fixture(sample16/exam) 회귀 시 — 가드 강화(wrap 모드 명시) 또는 분기 좁힘 요청.
- **옵션 C (close)**: 본질 결함 시. 해당 낮음.

## 5. 메모리 룰 정합

- `feedback_contributor_cycle_check` — @jangster77 #997~#1015 연속. #1011 잔존 직접 후속
- `feedback_hancom_compat_specific_over_general` — 4중 AND 가드로 영역 좁힘 (case-specific)
- `feedback_diagnosis_layer_attribution` — 기존 라인 990 분기와 대칭 보완 root cause 진단
- `feedback_fix_scope_check_two_paths` — 공통 경로 layout_composed_paragraph 8+ 호출 사이트 양쪽 점검 (sweep)
- `feedback_visual_judgment_authority` — test-image 라벨 + 다른 fixture wrap 시각 판정 게이트
- `project_output_folder_structure` — sweep 산출물 output/poc/pr1015 배치
- `reference_authoritative_hancom` — #1011 추가 test-image fixture 활용

## 6. 권고

**옵션 A** — add-only / 4중 AND 가드 / fixture 재활용 견고. 검증 단계 sweep(특히 wrap shape 보유 fixture 회귀 부재) + 작업지시자 시각 판정 통과 시 cherry-pick no-ff merge. 쟁점 A/B 회귀 시 옵션 B 전환 (가드 강화).
