---
PR: #761
제목: render — harden PageLayerTree schema and resource keys (P8)
컨트리뷰터: @seo-rii (Seohyun Lee) — 8번째 사이클 (Skia 핵심 컨트리뷰터)
처리: 옵션 A — 1 commit cherry-pick + no-ff merge
처리일: 2026-05-10
머지 commit: 88d7fd38
Refs: #536
---

# PR #761 처리 보고서

## 1. 처리 결과

✅ **머지 완료** — 옵션 A (1 commit cherry-pick + no-ff merge)

| 항목 | 값 |
|------|-----|
| 머지 commit | `88d7fd38` (--no-ff merge) |
| Cherry-pick commit | `5a417526` |
| Refs | Issue #536 (Skia native raster 트래킹) |
| 시각 판정 | 면제 (작업지시자 결정 — contract 정리 단계 + 결정적 검증) |
| 자기 검증 | cargo build/test/clippy/check + 신규 테스트 6 PASS + sweep 170/170 same |

## 2. 본질

P8 단계 — 이후 text/image/cache 작업이 의존할 **Layer IR contract** 단단하게 정리. Skia native raster 트래킹 (Issue #536) 의 단계적 진전.

### 2.1 단계 진전
| 단계 | PR | 본질 |
|------|-----|------|
| P4 | #599 (5/5) | native Skia PNG raster backend |
| P5 | #626 (5/7) | equation replay |
| P6 | #720 (5/9) | raw SVG fragment replay |
| **P8** | **#761 (5/10)** | **schema/resource hardening** |

## 3. 정정 본질 — 10 files, +284/-73

### 3.1 신규 모듈
- `src/paint/schema.rs` (+33) — `LayerTreeSchema` 구조체 + 상수 (schema_version=1, resource_table_version=1, unit="px", coordinate_system="page-top-left")
- `src/paint/resources.rs` (+40) — blake3 digest + `image_resource_key` / `svg_resource_key` (kind:algorithm:byte_len:digest 형식)

### 3.2 정정
- `Cargo.toml` (+1) — blake3 crate
- `src/paint/json.rs` (+5/-6) — schema 영역 LAYER_TREE_SCHEMA 사용
- `src/paint/layer_tree.rs` (-8) — 상수 schema.rs 영역 이전
- `src/paint/mod.rs` (+9/-3) — 재export
- `src/renderer/svg_layer.rs` (+60/-1) — output options 소비 + 테스트
- `src/renderer/web_canvas.rs` (+2) — output options 소비
- `src/wasm_api.rs` (+57/-54) — canvas scale guard 공통화
- `src/wasm_api/tests.rs` (+77/-1) — canvas scale guard + render_page consumes layer output options 테스트

## 4. 인프라 도입 / 재사용

| 영역 | 본질 |
|------|------|
| `blake3` crate (신규) | content-addressable resource key digest |
| `paint::schema` 모듈 (신규) | schema metadata 단일 관리 |
| `paint::resources` 함수 (신규) | resource key 생성 helper |
| 기존 `LayerOutputOptions` 재사용 | renderer 직접 호출 경로 보강 |

## 5. Non-goals (PR 본문 명시)
- binary resource interning 미구현
- native Skia text/image/cache replay 변경 부재
- CanvasKit / rhwp-studio resource transport 후속

## 6. 본 환경 검증

| 검증 | 결과 |
|------|------|
| `cherry-pick` (1 commit) | ✅ auto-merge 충돌 0건 |
| `cargo build --release` | ✅ 통과 (blake3 crate 컴파일) |
| `cargo test --release` | ✅ ALL GREEN |
| `cargo clippy --release --lib -- -D warnings` | ✅ 통과 |
| `cargo check --target wasm32-unknown-unknown --lib` | ✅ 통과 |
| 신규 테스트 6 PASS | ✅ (resource_digest_is_stable / resource_keys / layer_tree_schema_contract / normalize_canvas_scale 2건 / render_page_consumes_layer_output_options) |
| 광범위 sweep (7 fixture / 170 페이지) | ✅ **170 same / 0 diff** (contract 정리만 시각 출력 무영향 입증) |

## 7. 시각 판정 면제 (작업지시자 결정)
contract 정리 단계 (PR 본문 명시) + 결정적 검증 + 회귀 가드 6건 + 광범위 sweep + clippy/wasm32 check 모두 통과 — 시각 판정 게이트 면제 합리.

## 8. 영향 범위

### 8.1 변경 영역
- Rust paint 모듈 (`schema.rs`/`resources.rs` 신규 + `json.rs`/`layer_tree.rs`/`mod.rs` 재정리)
- Rust renderer (`svg_layer.rs`/`web_canvas.rs` output options 소비)
- WASM API (canvas scale guard 공통화)

### 8.2 무변경 영역
- TypeScript / rhwp-studio (변경 부재)
- HWP3/HWPX 변환본 시각 정합 (sweep 170/170 same 입증)
- native Skia text/image/cache replay (PR 본문 Non-goals 명시)

## 9. 메모리 룰 적용

| 룰 | 적용 |
|----|------|
| `feedback_contributor_cycle_check` | @seo-rii **8번째 사이클** (Skia 핵심) |
| `feedback_image_renderer_paths_separate` | paint 모듈 정리 — svg/web_canvas 동기 보강 (output options 직접 호출 경로) |
| `feedback_pr_supersede_chain` 권위 사례 | PR #599 (P4) → #626 (P5) → #720 (P6) → **#761 (P8)** Issue #536 트래킹 단계적 진전 |
| `feedback_process_must_follow` | contract 정리 + Non-goals 명시 + 결정적 검증 — 위험 좁힘 |
| `feedback_visual_judgment_authority` | contract 정리 단계, 결정적 검증 + 회귀 가드 + sweep 통과 영역 시각 판정 면제 합리 |

## 10. 잔존 후속

- 본 PR 본질 정정의 잔존 결함 부재
- 후속 PR (PR 본문 명시):
  - binary resource interning / public resource table transport
  - native Skia text/image/cache replay
  - CanvasKit / rhwp-studio resource transport

---

작성: 2026-05-10
