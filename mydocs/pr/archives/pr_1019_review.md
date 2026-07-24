# PR #1019 검토 — Task #975: Fix PageBackground fill mode and RealPic watermark tone

- 작성일: 2026-05-20
- 컨트리뷰터: [@postmelee](https://github.com/postmelee) (Taegyu Lee)
- PR: https://github.com/edwardkim/rhwp/pull/1019
- base/head: `devel` ← `postmelee:task-975-page-background-fill-mode` (cross-repo fork)
- 연결 이슈: Refs #975, Related #976
- 규모: +1780 / -49, 18 files (소스 11, 문서 6, orders 1)
- mergeable: **CONFLICTING**
- 본질 커밋: **3개 순차** (모두 작성자 @postmelee)
  - `e57fdb97` (1차) align background watermark rendering (+1667/-46, 18파일)
  - `2128e9fc` (2차) preserve watermark filter precision in web canvas (1줄)
  - `d58450e3` (3차) bake RealPic watermark tone correction (+143/-33, 4파일)

## 1. 컨트리뷰터 사이클 (`feedback_contributor_cycle_check`)

@postmelee 15+ PR. #976(Task #938) → **#1018(Task #1016, image_resolver)** → **#1019(본 PR, Task #975)** 연속 이미지 영역 시리즈. devel = `84246b2a` (#1018 머지 포함).

## 2. 2 fix 본질 (PR 본문 명확 분리)

### A. PageBackground/BorderFill 이미지 `ImageFillMode` 정합 (1차 e57fdb97)

dump 에는 `mode=Center` 보존되어 있으나 renderer 가 `preserveAspectRatio="none"` + bbox 전체 drawImage 로 stretch 출력 → 512x512 워터마크가 페이지 전체 늘림 회귀.

Fix: `PageBackgroundImage` 에 `brightness/contrast/effect` 보존 확장. style resolver / layout / render tree 경로에서 BorderFill ImageFill tone 속성 전달. SVG `render_page_background_image()` helper 분리. fill mode 의미 일반 ImageNode 와 동일화 (`FitToSize|None` / `Center` / tile). Web Canvas `draw_image_with_fill_mode()` 재사용.

### B. RealPic 색상 워터마크 preset tone 정합 (3차 d58450e3)

PR 본문 명시 — `effect=RealPic`, `brightness=-50`, `contrast=70` 조합 색상 워터마크 preset 의 한컴 뷰어 톤 정합. #976 의 `effect != RealPic` JPEG baked grayscale watermark 와 **분리**. 같은 brightness/contrast 값이라도 RealPic 여부로 분기.

4-param tone preset:

```text
saturation = 0.91646104
contrast   = 0.93125103
brightness = 2.09719097
opacity    = 0.21729612
```

+ 3x3 RGB affine + bias 3-vec (macOS 한컴 뷰어 watermark-only 샘플 기준 근사):

```text
matrix = [[0.9897, 0.1298, -0.0666], [0.0236, 1.0778, -0.0471], [0.0003, -0.0076, 1.0728]]
bias   = [-0.0505, -0.0463, -0.0573]
```

decode 가능 이미지에 PNG bake (브라우저별 SVG/CSS 필터 정밀도 차이 제거), bake 실패 시 SVG/CSS filter fallback.

## 3. 검토 의견

### 강점

1. **2 fix 명확 분리** — 단일 PR 내 책임 분리(PageBg fill mode vs RealPic tone). PR 본문 root cause 명확.
2. **#976 경로와 분리** — `effect != RealPic` baked grayscale (#976) vs `effect == RealPic` 신규 preset (본 PR). `feedback_hancom_compat_specific_over_general` 정합 (preset 분기).
3. **파일명 분기 회피** — preset 전체에 적용 (PR 본문 명시).
4. **PNG bake 일원화** — SVG/CSS 필터 정밀도 차이 제거. fallback graceful degradation.
5. **회귀 테스트** — `realpic_watermark` 2건 + svg_snapshot 8건 + lib 1312 (현 devel 1307 + 5건 신규).
6. **legacy SVG fallback 보존** — render path 호환성.

### ⚠️ 핵심 쟁점

#### (A) #1018 적층 호환성 (cherry-pick 충돌)

PR head 는 #1018 머지(`84246b2a`) **이전 base** 에서 분기. 본 PR 의 `svg.rs`/`web_canvas.rs`/`render_tree.rs` 변경 영역이 #1018 이 image_resolver 로 정리한 영역과 **겹침**. cherry-pick 충돌 + 합쳐진 후 `PaintOp::Image.resolved` (resolved payload 소비) vs 본 PR 의 PageBackground PNG bake (svg.rs render_page_background_image) 가 양립 가능한지 정합 확인 필수. **충돌 해소 후 cargo test/clippy 통과 + sweep diff 비교** 로 입증.

#### (B) fixture 본 환경 부재 (sample18 동일 패턴)

PR 명시 fixture `143E433F503322BD33(1).hwp`, `253E164F57A1BC6934(1).hwp` 본 환경 부재 — `reference_authoritative_hancom` / `feedback_visual_judgment_authority` 제약. 대체 검증:
- **복학원서.hwp**: 가장 유사한 워터마크 fixture (#976/#1018 정합). 단 `effect != RealPic` 경로라 본 PR 변경 영향 없을 가능성 — diff=0 입증으로 #1018/#976 정합 보존 확인 (역설적 회귀 가드)
- 일반 fixture sweep: PageBackground 이미지 없는 fixture diff=0 (PageBackground 변경 영향 없음 확인)
- 회귀 테스트 `realpic_watermark` 2건 통과 = preset 변환 정확성 입증

#### (C) 매직넘버 매트릭스 + 4-param (RealPic preset)

`saturation/contrast/brightness/opacity` 4-param + 3x3 RGB affine matrix + bias 3-vec — 모두 컨트리뷰터 자인 "한컴 공식 알고리즘 미확정, macOS 한컴 뷰어 스크린샷 기준 근사값". RealPic preset 에 한정(`feedback_hancom_compat_specific_over_general` 좁은 영역)이나 매직넘버 다수. **#999/#1009 의 단일 휴리스틱 임계값과 다른 카테고리** — color correction 매트릭스는 본질적으로 측정 기반이라 매직넘버 회피 어려움. 후속 정밀화 가능성 명시 권고.

#### (D) 광범위 표면 — 11 소스 파일

`main.rs` / `canvaskit_policy.rs` / `layout.rs` + `layout/shape_layout.rs` + `layout/table_layout.rs` / `render_tree.rs` / `skia/renderer.rs` / `style_resolver.rs` / `svg.rs` + `svg/tests.rs` / `web_canvas.rs`. #1018 직후라 sweep 표면 광범위.

#### (E) cherry-pick orders 충돌 예상

PR 1차 커밋이 `mydocs/orders/20260518.md` 변경 포함 → 메인테이너 일지 충돌. `--ours` 보존 (#1005/#1011/#1018 패턴).

### 확인 필요 (검증 단계)

1. cherry-pick 3 커밋 순차 — orders `--ours` + #1018 영역 중복 충돌 해소
2. `cargo test --release --lib` (PR 1312) + `cargo test --lib realpic_watermark` 2건 + `cargo test --test svg_snapshot` + `cargo test --test issue_938` (#976/#1018 정합 보존) + clippy -D + fmt 0
3. **광범위 sweep** — 복학원서(#976 경로, diff=0 = #1018 정합 보존 입증) + 일반 PageBackground 이미지 없는 fixture diff=0 + #1018 sweep 동일 fixture 들 회귀 부재
4. WASM 빌드 + 작업지시자 시각 판정 — fixture 부재 대체: 복학원서 #976 정합 보존 + 회귀 테스트 통과 + sweep diff=0 = 시각 판정 게이트 보완 (`feedback_self_verification_not_hancom`)

## 4. 처리 옵션

- **옵션 A (수용)**: 2 fix 명확 분리 + #976/#1018 경로와 분리 + 회귀 테스트 + sweep 회귀 부재 시. **#1018 적층 호환성 + fixture 부재 보완(복학원서 diff=0 입증)** 필수.
- **옵션 B (수정 요청)**: 충돌 해소 후 #1018 정합 깨짐 / 복학원서 회귀 / 다른 fixture 회귀 시 — 영향 좁히거나 매트릭스 정밀화 요청.
- **옵션 C (close)**: 본질 결함 시. 해당 낮음 (PR 본문 외부 검증 충실).

## 5. 메모리 룰 정합

- `feedback_contributor_cycle_check` — @postmelee #976→#1018→**#1019** 시리즈
- `feedback_hancom_compat_specific_over_general` — RealPic preset 한정, 파일명 분기 회피 (PR 명시)
- `feedback_image_renderer_paths_separate` — PageBackground 경로 일원화 (helper 분리), #1018 image_resolver 와 양립 확인 필수
- `feedback_fix_scope_check_two_paths` — svg.rs / web_canvas.rs 양쪽 정합 필수 (PR 본문 명시)
- `feedback_visual_judgment_authority` — fixture 부재로 시각 판정 게이트 보완 (복학원서 + 회귀 테스트 + sweep)
- `feedback_self_verification_not_hancom` — fixture 부재 → PR 본문 자기 보고(realpic_watermark 2건) + 작업지시자 가능 범위 시각 판정 보완
- `feedback_pdf_not_authoritative` / `reference_authoritative_hancom` — PR 본문 macOS 한컴 뷰어 watermark-only 스크린샷 근거(컨트리뷰터 환경)
- `project_output_folder_structure` — sweep 산출물 output/poc/pr1019 배치

## 6. 권고

**옵션 A 조건부** — 검증 단계에서 (1) cherry-pick 3 커밋 충돌 해소(orders --ours + #1018 영역 중복 해소), (2) cargo test 1312 + realpic_watermark + svg_snapshot + **issue_938(#1018 정합 보존)** + clippy + fmt, (3) **광범위 sweep** — 복학원서 diff=0(#976/#1018 정합 보존 입증) + #1018 sweep 동일 fixture 들 diff=0(일반 fixture 영향 없음), (4) WASM + 작업지시자 시각 판정 통과 시 cherry-pick no-ff merge. **#1018 적층 호환성 + fixture 부재 보완**이 핵심. 회귀 시 옵션 B 전환.
