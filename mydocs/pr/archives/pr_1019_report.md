# PR #1019 처리 보고서 — Task #975: Fix PageBackground fill mode and RealPic watermark tone

- 처리일: 2026-05-20
- 컨트리뷰터: [@postmelee](https://github.com/postmelee) (Taegyu Lee)
- 결정: **옵션 B (수정 요청 / 보류)** — 작업지시자 승인
- 머지: **하지 않음** (cherry-pick 롤백)
- 연결: Refs #975 OPEN 유지

## 1. 결정 사유 — SVG 렌더링 경로 정합 미완

PR #1019 의 본질(PageBackground fill mode + RealPic preset tone) 자체는 견고하나, 작업지시자 시각 판정 중 **SVG 렌더링 경로의 두 결함**이 확인됨 — 본 PR sweep 으로 무회귀 입증(BEFORE/AFTER binary identical) 했으나, 결함이 devel 기존에도 존재하며 SVG 경로 정합이 미완. PR scope 를 SVG 정합까지 확장 요청.

### 시각 판정 발견 (BEFORE/AFTER 동일 — devel 기존 SVG 결함)

1. **SVG 출력에서 워터마크 효과 미적용** (BEFORE/AFTER 모두). canvas/web_canvas 는 정상
2. **SVG 출력에서 흰색(255,255,255) 영역 투명 미처리** (canvas 와 동작 차이)

→ PR #1019 의 회귀 아님(sweep diff=0 입증), 그러나 SVG 경로의 워터마크 일관성 결함. 본 PR scope 가 "renderer 들이 같은 resolved image payload 공유 + tone 정합" 이라면 SVG 정합도 포함되어야 함.

## 2. 검증 결과 (cherry-pick 후 롤백됨)

| 항목 | 결과 |
|------|------|
| cherry-pick 3 커밋 순차 | `7d219845` (1차, orders --ours), `cb7900f5` (2차, 1줄), `d7a01113` (3차, svg.rs 중복 helper 4개 제거 + fmt amend) |
| cargo test --release --lib | **1312 passed** |
| cargo test --lib realpic_watermark | **2 passed** |
| cargo test --test issue_938 | **3 passed** (#1018 정합 보존) |
| cargo test --test svg_snapshot | **8 passed** |
| cargo clippy -D / cargo fmt --check | 통과 / exit 0 |
| WASM 빌드 | 4.99 MB (+160KB), rhwp-studio 동기화 |
| sweep 10 fixture | **전부 diff=0** (복학원서 binary identical) |
| rhwp-studio 시각 | 워터마크 효과 정상 유지 ✓ |
| **SVG export 시각** | **워터마크 효과 미적용 + 흰색 투명 미처리 (BEFORE/AFTER 동일)** ⚠️ |

자기 검증 ALL GREEN + sweep 회귀 0 + rhwp-studio 정상이나, SVG 경로 결함 발견으로 옵션 B.

## 3. cherry-pick 롤백 + 충돌 해소 과정 기록

3차 d58450e3 cherry-pick 시 `src/renderer/svg.rs` 라인 2968-3244(275줄) 충돌 — #1018 image_resolver 로 이미 이동된 helper 4개(`bmp_bytes_to_png_bytes`, `pcx_bytes_to_png_bytes`, `watermark_jpeg_bytes_to_hancom_baked_png_bytes`, `detect_image_mime_type`)가 d58450e3 측에 재정의된 충돌. 해소 절차:

1. `git cherry-pick -X theirs d58450e3` 적용
2. svg.rs 에서 중복 4개 본체 제거 (Python 스크립트)
3. 신규 2개(`apply_real_picture_watermark_tone_rgb`, `real_picture_watermark_bytes_to_hancom_tone_png_bytes`) 보존
4. cargo check + fmt amend

이 과정은 재제출 시 컨트리뷰터가 최신 devel 기준 rebase 하면 자동 해소됨 (svg.rs helper 본체를 image_resolver 로 이동 + 신규 helper 도 image_resolver 로 이동 권고).

## 4. 수정 요청 내용 (컨트리뷰터 전달)

### A. 최신 devel 기준 rebase (#1018 image_resolver 통합 반영)

PR head 는 #1018 머지 이전 base. 최신 devel(`84246b2a`) 기준 rebase 시:
- `svg.rs` 의 helper 본체 재정의 제거 (image_resolver re-export 사용)
- 신규 RealPic helper (`apply_real_picture_watermark_tone_rgb`, `real_picture_watermark_bytes_to_hancom_tone_png_bytes`) 는 **`src/renderer/image_resolver.rs` 로 이동** 권고 (`feedback_image_renderer_paths_separate` 일관성)

### B. SVG 출력 경로 정합 (본 PR scope 확장)

작업지시자 시각 판정 발견 (BEFORE/AFTER 동일, devel 기존):
1. **SVG 워터마크 효과 미적용** — `effect != RealPic` baked watermark (#976 경로) 가 SVG 출력에 적용되지 않음. canvas/web_canvas 는 정상 적용. SVG `<image>` 요소에 filter/opacity 누락
2. **SVG 흰색 투명 미처리** — canvas 는 흰색(255,255,255) 영역을 투명 알파로 매핑(특히 PCX 변환, image_resolver.rs:80 `pcx_bytes_to_png_bytes` 의 한컴 호환 동작) 하지만 SVG 출력은 이 변환 결과를 사용하지 않거나 SVG 자체에서 별도 흰색 → 투명 처리 누락

본 PR 이 "renderer 들이 같은 resolved image payload 공유 + tone 정합" 을 본질로 한다면 SVG 정합도 포함되어야 함. SVG `render_page_background_image()` helper 가 워터마크 효과 (filter/opacity) + 흰색 투명 처리도 일관 적용하도록 확장 권고.

### C. PR 본문 검증 fixture 본 환경 부재 보완

`143E433F503322BD33(1).hwp`, `253E164F57A1BC6934(1).hwp` 본 환경 부재. 가능하면 **복학원서 (effect != RealPic) 정합 + RealPic preset 발동 fixture 명시 추가** 권고 (회귀 가드 영구화).

## 5. 처리 절차

- cherry-pick 브랜치 `pr1019-cherry` 롤백 (local/devel = origin/devel = `84246b2a`, #1019 미반영)
- PR #1019 **OPEN 유지** (수정 후 재제출 대기)
- 이슈 #975 **OPEN 유지** (미해결)
- 검토/보고서 archives 보관 (재검토 시 참조)
- 산출물 `output/poc/pr1019/{before,after}/` 보존 (회귀 입증 자료)
- WASM 빌드(4.99MB) → 롤백 후에도 rhwp-studio/public 에 동기화 상태 — devel 빌드로 복구 필요

## 6. 메모리 룰 정합

- `feedback_contributor_cycle_check` — @postmelee #976→#1018→#1019 시리즈, #1019 보류
- `feedback_visual_judgment_authority` — sweep diff=0 정량 입증에도 시각 판정으로 SVG 경로 정합 결함 발견 (권위 사례)
- `feedback_image_renderer_paths_separate` — SVG / web_canvas / canvas 동작 차이 (워터마크 효과 + 흰색 투명) — 본 PR scope 확장 요청 근거
- `feedback_fix_scope_check_two_paths` — SVG / web_canvas 양쪽 정합 (PR 본문 명시인데 실제 SVG 미정합 확인)
- `feedback_pr_supersede_chain` — #1018 영역 중복(svg.rs helper) → 재제출 시 image_resolver 로 신규 helper 이동 권고
- `feedback_self_verification_not_hancom` — fixture 부재 + SVG 결함 추가 → 시각 판정 게이트 확장 필요
- `feedback_hancom_compat_specific_over_general` — RealPic preset 한정 설계 자체는 견고
- `project_output_folder_structure` — sweep 산출물 output/poc/pr1019 보존

## 7. 결론

PR #1019 의 2 fix 설계(PageBackground fill mode + RealPic preset tone) + cargo test/sweep/rhwp-studio 검증은 견고하나, **작업지시자 시각 판정으로 SVG 경로의 두 결함**(워터마크 효과 미적용 + 흰색 투명 미처리, BEFORE/AFTER 동일 = devel 기존) 발견. **옵션 B — 컨트리뷰터에게 최신 devel rebase + image_resolver 로 신규 helper 이동 + SVG 경로 정합 추가 요청, PR/이슈 OPEN 유지**. 재제출 시 #1018 영역 중복 자동 해소.
