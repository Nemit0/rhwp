# PR #1015 처리 보고서 — Task #1012: wrap 옵션 paragraph 라벨 텍스트 y 위치 정정

- 처리일: 2026-05-20
- 컨트리뷰터: [@jangster77](https://github.com/jangster77) (Taesup Jang)
- 결정: **옵션 A (수용)** — 작업지시자 승인 + 시각 판정 통과
- 머지: (no-ff, local/devel → devel)
- closes #1012

## 1. 결정 사유

@jangster77 24+ 사이클. **#1011 잔존(test-image paragraph 텍스트 라벨 누락)의 직접 후속**. 기존 `paragraph_layout.rs::layout_composed_paragraph` 의 spacing_before 처리 분기가 `spacing_before > 0` 케이스만 vpos 클램프 → spacing_before=0 + vpos>0 케이스 누락 결함을 4중 AND 가드 add-only fallback 으로 해소. 라벨 y=143.6 → 346px (Picture 영역 아래).

## 2. 처리 내역 (단일 본질 커밋, 작성자 Taesup Jang)

| 커밋 (cherry-pick 후) | 내용 |
|------|------|
| `b808b996` | Task #1012 fix (8파일 +385/-0, fixture #1011 중복 자동 해소) |

- **충돌 없음** (cherry-pick auto-merge, test-image.hwp/.hwpx 는 #1011 머지로 이미 devel 존재, binary identical)

## 3. 변경 본질 — 14줄 add-only fallback

```rust
// [Task #1012] paragraph 첫 line vpos > 0 인데 spacing_before=0 으로
// 위 블록 진입 안한 경우 — line_seg.vpos 를 직접 y 에 가산
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

**Root cause**: 기존 라인 990 분기 `if start_line == 0 && spacing_before > 0.0` 가 spacing_before > 0 만 vpos 처리 → test-image.hwp pi=0 (spacing_before=0 + vpos=15180 HU) 분기 SKIP → 텍스트가 body_top 에 그려져 Picture[2] TopAndBottom y=132~334 영역 내부 overlap.

**Fix**: 4중 AND 가드 fallback (start_line==0 + spacing_before==0 + is_column_top + para_index==0) 으로 vpos>0 일 때 `y += vpos0_px`. 기존 라인 990 분기와 대칭 보완.

## 4. 자기 검증

| 항목 | 결과 |
|------|------|
| `cargo test --release --lib` | 1307 passed / 0 failed / 2 ignored |
| `cargo clippy --release --lib -D warnings` | 통과 |
| `cargo fmt --check` | exit 0 |
| WASM 빌드 (Docker) | 4.83 MB, rhwp-studio/public 동기화 |

## 5. 검토 쟁점 → sweep 검증 (10 fixture, BEFORE devel `850cfb54` ↔ AFTER)

| Fixture | 결과 | 쟁점 | 판정 |
|---------|------|------|------|
| **test-image.hwp/.hwpx (타깃)** | diff=1 각각 | — | 의도된 변경 (라벨 y=143.6→346) |
| sample16-hwp5 / sample16-hwp3 (wrap shape 보유) | **diff=0** | A/B | ✅ 회귀 없음 |
| hy-001 HWPX / hy-001 HWP5 (wrap shape 보유 표) | **diff=0** | A/B | ✅ 회귀 없음 |
| exam_kor / exam_math / aift / biz_plan (일반) | 전부 **diff=0** | A | ✅ 회귀 없음 |

- **쟁점 A (`layout_composed_paragraph` 8+ 호출 사이트 공통 경로)** + **쟁점 B (다른 wrap 모드 영향)**: wrap shape 보유 fixture 4종(sample16/hy-001 HWPX·HWP5) 포함 sweep 으로 **회귀 0 입증**. 4중 AND 가드(start_line==0 + spacing_before==0 + is_column_top + para_index==0) 가 매우 좁게 동작 — 다른 wrap 케이스(BehindText / InFrontOfText / Square)에서 발동되지 않음.
- **쟁점 C (`is_column_top` 매직 임계값 1.0px)**: PR 신규 도입 아닌 기존 정의 재사용, 본 PR 영향 없음.

## 6. 작업지시자 시각 판정

test-image.hwp page 1 라벨(자리차지/글앞으로/어울림/글뒤로)이 Picture 영역 아래(y=346)로 이동, overlap 해소 — **시각 판정 통과**.

## 7. 후속 / 관련

- **z-order 부 결함 자동 해소** (PR 본문): text y=346 / image y=86~334 시각 영역 완전 분리. BehindText image 가 text 가릴 가능성도 사라짐. 별도 후속 불필요.
- @jangster77 #997~#1011 시리즈(5/19~5/20) 마무리 후 #1015 (#1011 잔존 해소). #1009 만 보류 유지 (base 부정합 — 컨트리뷰터 rebase 후 재제출 대기).

## 8. 메모리 룰 정합

- `feedback_contributor_cycle_check` — @jangster77 #997~#1015 연속, #1011 잔존 직접 후속
- `feedback_hancom_compat_specific_over_general` — 4중 AND 가드 매우 좁은 case-specific. wrap shape 보유 fixture sweep 회귀 0 입증
- `feedback_diagnosis_layer_attribution` — 기존 라인 990 분기와 대칭 보완 root cause 진단
- `feedback_fix_scope_check_two_paths` — **권위 사례**: 공통 경로 layout_composed_paragraph 8+ 호출 사이트 우려를 sweep 10 fixture(특히 wrap shape 보유 4종) 으로 회귀 0 입증
- `feedback_visual_judgment_authority` — test-image 라벨 위치 작업지시자 시각 판정 통과
- `project_output_folder_structure` — sweep 산출물 output/poc/pr1015 배치
- `reference_authoritative_hancom` — #1011 추가 test-image fixture 회귀 가드 활용
