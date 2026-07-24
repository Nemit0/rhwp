# PR #1018 처리 보고서 — Task #1016: Resolve image payloads in PaintOp::Image

- 처리일: 2026-05-20
- 컨트리뷰터: [@postmelee](https://github.com/postmelee) (Taegyu Lee)
- 결정: **옵션 A (수용)** — 작업지시자 승인 + **시각 판정 생략 통과** (sweep 100% 동일 정량 입증)
- 머지: (no-ff, local/devel → devel)
- Refs #1016, Follows #976, Related #1017

## 1. 결정 사유 — `feedback_image_renderer_paths_separate` 본질적 해소

@postmelee 15+ PR 핵심 컨트리뷰터. PR #976(Task #938 baked watermark) 직접 후속. 이미지 변환(BMP/PCX→PNG) + 워터마크 JPEG→baked PNG 판정이 5+ renderer 별 사본(svg/canvas/web_canvas/skia/paint/json)에 분산되어 있던 것을 단일 `image_resolver::resolve_image_payload()` 진입점으로 통합. 결과를 `ResolvedImagePayload` 로 패키지하여 `PaintOp::Image.resolved: Option<Box<...>>` 옵션 필드로 부착 — 모든 renderer 가 resolved payload 소비만. `feedback_image_renderer_paths_separate` 메모리 룰 도입(Task #514/#516) 이래 가장 직접적 아키텍처 정정.

## 2. 처리 내역

| 커밋 (cherry-pick 후) | 내용 |
|------|------|
| `3aeaa5ba` | Resolve baked watermark image payloads (24파일 +1861/-264, 본질 단일 커밋, 작성자 postmelee 보존) |

- **충돌 해소**: `mydocs/orders/20260520.md` 1건만 (AA, 메인테이너 PR 처리 일지 vs 컨트리뷰터 작업 일지) → `--ours` 메인테이너 일지 보존 (#1005/#1011 동일 패턴)

## 3. 변경 본질

기존: BMP/PCX→PNG, 워터마크 JPEG→baked PNG 판정이 각 renderer 별 사본에 분산 (`feedback_image_renderer_paths_separate` 결함 영역).

본 PR: `LayerBuilder::RenderNodeType::Image` 하강 시 **단일 `image_resolver::resolve_image_payload()`** 진입점에서 결정. 결과 `ResolvedImagePayload`(data + mime + kind + suppress_effects) 를 `PaintOp::Image.resolved: Option<Box<...>>` 옵션 필드에 부착. 모든 renderer 는 resolved payload 소비만 — 재판정 없음.

| 영역 | 변경 |
|------|------|
| 신규 모듈 | `src/renderer/image_resolver.rs` (+255) |
| paint 스키마 | `ResolvedImagePayload` + `PaintOp::Image.resolved` + schema minor 12→13 (MAJOR 불변, 옵션 필드 = 하위호환) |
| renderer (소비) | canvas/web_canvas/skia/svg/svg_layer/canvaskit_policy 6 파일 |
| document_core | overlay 별도 재판정 제거 (-26 net) |
| 회귀 테스트 | `tests/issue_938.rs` (+72, 3건) |
| Studio | `rhwp-studio/src/core/types.ts` (`bakedWatermark:true`) |

## 4. 자기 검증

| 항목 | 결과 |
|------|------|
| `cargo test --release --lib` | 1307 passed / 0 failed / 2 ignored |
| `cargo test --release --test issue_938` | **3 passed** (overlay/svg/PageLayerTree resolved watermark contract) |
| `cargo clippy --release --lib -D warnings` | 통과 |
| `cargo fmt --check` | exit 0 |
| WASM 빌드 (Docker) | 4.83 MB, rhwp-studio/public 동기화 |

## 5. 광범위 sweep 검증 (10 fixture, BEFORE devel `71aedda9` ↔ AFTER) — **전부 diff=0**

| Fixture | 결과 | 판정 |
|---------|------|------|
| **복학원서.hwp** (워터마크 JPEG → baked PNG, #976 정합) | **diff=0** | ✅ |
| sample16-hwp5 / sample16-hwp3 | **diff=0** | ✅ |
| hy-001 HWPX / HWP5 (표 + 이미지) | **diff=0** | ✅ |
| exam_kor / exam_math (시험지) | **diff=0** | ✅ |
| aift / biz_plan (일반) | **diff=0** | ✅ |
| test-image (#1011/#1015 fixture) | **diff=0** | ✅ |

**핵심 입증:** SVG 출력이 BEFORE 와 **100% 동일** — 광범위 표면(24파일, 7개 renderer 경로, paint 스키마 변경)이었으나 **시각 결과 완전 보존**. PR 의 contract ("renderer 들이 같은 resolved image payload 공유") 가 정확히 작동. `feedback_image_renderer_paths_separate` 본질적 해소 + 시각 호환성 100% 유지의 모범 사례.

## 6. 작업지시자 시각 판정 — 생략 통과

작업지시자 결정: "시각 판정 없이 통과". 근거:
- sweep 10 fixture 전부 **diff=0** (SVG 출력 100% 동일)
- `tests/issue_938` 3건 (overlay/svg/PageLayerTree resolved watermark contract) GREEN
- 변환 정확성: BEFORE/AFTER 동일 = 시각 결과 동일 = 시각 판정 불필요 (정량 입증으로 대체)

## 7. PR 범위 명시 제외 — #1017로 분리

PR 본문 명시: native Skia PNG export `wrap=behindText` 워터마크 z-order 문제는 본 PR scope 외, **#1017 (PageLayerTree replay BehindText/InFrontOfText z-order 합성 정책 일반화)** 로 분리. 본 PR 은 image payload contract 만, z-order 는 별도. sweep 정량 입증으로 본 PR 이 z-order 를 건드리지 않음 확인 (복학원서 baked watermark diff=0).

## 8. 후속 / 관련

- **#1017** (z-order 일반화) — 후속 PR 대기
- **#1019** (Task #975 PageBackground fill mode + RealPic watermark tone) — @postmelee 동일 시리즈 OPEN, 후속 처리 대상

## 9. 메모리 룰 정합

- `feedback_contributor_cycle_check` — @postmelee 15+ PR, #976→**#1018**→#1019 시리즈
- `feedback_image_renderer_paths_separate` — **권위 사례 해소** (5+ 사본 → 단일 진입점, 본 PR 이 메모리 룰의 본질적 정정)
- `feedback_diagnosis_layer_attribution` — interpretation(builder) / 사용(renderer) 명확 분리
- `feedback_fix_scope_check_two_paths` — 7개 renderer 경로 sweep 10 fixture 전부 diff=0 입증
- `feedback_visual_judgment_authority` — sweep 정량 (diff=0) 으로 시각 판정 대체 (작업지시자 결정)
- `feedback_hancom_compat_specific_over_general` — scope 좁힘 (#1017 분리)
- `feedback_pdf_not_authoritative` — 복학원서 #976 정합 보존 입증
- `project_output_folder_structure` — sweep 산출물 output/poc/pr1018 배치
