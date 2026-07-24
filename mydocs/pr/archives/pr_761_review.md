---
PR: #761
제목: render — harden PageLayerTree schema and resource keys (P8)
컨트리뷰터: @seo-rii (Seohyun Lee) — 8번째 사이클 (Skia 핵심 컨트리뷰터)
base / head: devel / render-p8
mergeStateStatus: BEHIND
mergeable: MERGEABLE
CI: SUCCESS (Build & Test + CodeQL js/ts/py/rust + Canvas visual diff)
변경 규모: +284 / -73, 10 files
검토일: 2026-05-10
Refs: #536
---

# PR #761 검토

## 1. 메타

| 항목 | 값 |
|------|-----|
| PR 번호 | #761 |
| 제목 | render — harden PageLayerTree schema and resource keys (P8) |
| 컨트리뷰터 | @seo-rii (Seohyun Lee) — Skia 핵심 (PR #165/#419/#456/#498/#599/#626/#720/#761, 8번째 사이클) |
| base / head | devel / render-p8 |
| mergeStateStatus | BEHIND, mergeable: MERGEABLE — 충돌 부재 |
| CI | ✅ Build & Test + CodeQL (js/ts/py/rust) + Canvas visual diff 통과 |
| 변경 규모 | +284 / -73, 10 files |
| 커밋 수 | 1 (단일 commit) |
| Refs | #536 (Skia native raster 단계적 진전 트래킹) |

## 2. 본질

P8 단계 — 이후 text/image/cache 작업이 의존할 **Layer IR contract** 를 단단하게 정리. Skia native raster 트래킹 (Issue #536) 의 단계적 진전:

| 단계 | 본질 |
|------|------|
| P4 (#599, 5/5) | native Skia PNG raster backend |
| P5 (#626, 5/7) | equation replay |
| P6 (#720, 5/9) | raw SVG fragment replay |
| **P8 (#761, 5/10)** | **schema/resource keys hardening (text/image/cache 작업 사전 정리)** |

> P7 영역 영역 PR #740 (5/10) form control static replay — @seo-rii 가 아닌 다른 인덱싱 (PR #740 영역 영역 별도 단계).

## 3. 채택 접근 — Contract hardening

PR 본문 명시: "이 PR은 렌더링 결과를 크게 바꾸는 단계라기보다는, 이후 backend 작업이 같은 contract 위에 올라가게 만드는 정리 단계."

### 3.1 schema 모듈 신규 (`src/paint/schema.rs`)
`PageLayerTree` JSON schema metadata 한 곳 관리:
```rust
pub struct LayerTreeSchema {
    pub schema_version: u32,           // 1
    pub resource_table_version: u32,   // 1
    pub unit: &'static str,            // "px"
    pub coordinate_system: &'static str, // "page-top-left"
}
```

### 3.2 resource key helper (blake3)
`src/paint/resources.rs` 영역 영역 신규 함수:
- `resource_digest_hex` — blake3 hash (64자 hex)
- `image_resource_key(byte_len, digest)` → `"img:blake3:{len}:{digest}"`
- `svg_resource_key` → `"svg:blake3:{len}:{digest}"`

key 형식에 kind / algorithm / byte length / digest 모두 포함 — content-addressable + 충돌 방지.

### 3.3 LayerOutputOptions 직접 호출 경로 보강
`SvgLayerRenderer` + `WebCanvasRenderer` 영역 영역 renderer 직접 호출 시에도 `LayerOutputOptions` 소비 — `show_paragraph_marks`, `show_control_codes`, `debug_overlay` 등 출력 옵션 전달.

### 3.4 WASM canvas scale guard
공통 helper `normalize_canvas_scale` — invalid page dimension + oversized canvas 명시 차단.

## 4. 인프라 도입 / 재사용

| 영역 | 본질 |
|------|------|
| `blake3` crate (Cargo.toml +1) | content-addressable resource key digest |
| `paint::schema` 모듈 (신규) | schema metadata 단일 관리 |
| `paint::resources` 함수 (신규) | resource key 생성 helper |
| 기존 `LayerOutputOptions` 재사용 | renderer 직접 호출 경로 보강 |

→ 신규 모듈 1개 + crate 1개 — Skia native raster contract 영역 영역 명시 인프라 도입 (이후 PR 의존).

## 5. PR 의 정정 — 10 files, +284/-73

| 파일 | 변경 |
|------|------|
| `Cargo.toml` | +1 (blake3 crate) |
| `src/paint/schema.rs` | +33 (신규 모듈) |
| `src/paint/resources.rs` | +40 (resource key helper + 테스트) |
| `src/paint/json.rs` | +5/-6 (schema 영역 영역 LAYER_TREE_SCHEMA 사용) |
| `src/paint/layer_tree.rs` | -8 (상수 영역 영역 schema.rs 영역 영역 이전) |
| `src/paint/mod.rs` | +9/-3 (재export) |
| `src/renderer/svg_layer.rs` | +60/-1 (output options 소비 + 테스트) |
| `src/renderer/web_canvas.rs` | +2 (output options 소비) |
| `src/wasm_api.rs` | +57/-54 (canvas scale guard 공통화) |
| `src/wasm_api/tests.rs` | +77/-1 (canvas scale guard + render_page consumes layer output options 테스트) |

## 6. 결정적 검증 — 신규 테스트 4건

PR 본문 명시:
- `cargo test --lib resource_` — resource key/digest 안정성 + content-dependent
- `cargo test --lib layer_tree_schema_contract_is_stable` — schema contract 고정 (1, 1, "px", "page-top-left")
- `cargo test --lib page_layer_tree_export` — JSON 출력 정합
- `cargo test --lib normalize_canvas_scale` — invalid page dimension 차단
- `cargo test --lib render_page_consumes_layer_output_options` — renderer 직접 호출 경로

추가:
- `cargo clippy --lib -- -D warnings` 통과
- `cargo check --target wasm32-unknown-unknown --lib` 통과

## 7. Non-goals (PR 본문 명시)

- 실제 binary resource interning / public resource table transport 미구현
- native Skia text/image/cache replay 변경 부재
- CanvasKit / rhwp-studio resource transport 후속 PR

→ contract 정리만 — Skia 결과물 영역 변경 부재 영역 영역 sweep 회귀 0 예상.

## 8. 충돌 / mergeable

mergeStateStatus = `BEHIND`, mergeable = `MERGEABLE`. devel 5/10 사이클 영역 paint 모듈 변경 부재 → cherry-pick 충돌 0건 예상.

## 9. 본 환경 점검

### 9.1 변경 격리
- Rust 영역만 (paint 모듈 + renderer 경로 + wasm_api)
- TypeScript / rhwp-studio 무영향
- HWP3/HWPX 변환본 시각 정합 (sweep 170/170 same 예상 — contract 정리만)

### 9.2 CI 결과
- 모두 ✅ (Build & Test + CodeQL js/ts/py/rust + Canvas visual diff)

### 9.3 의도적 제한
- schema_version = 1 (변경 없음, 단일 관리)
- resource key 영역 영역 algorithm 명시 (`blake3`) → 추후 algorithm 변경 시 key 자체로 식별 가능

## 10. 처리 옵션

### 옵션 A — 1 commit cherry-pick + no-ff merge

```bash
git checkout local/devel
git cherry-pick 49b540a9  # auto-merge 정합 예상
git checkout devel
git merge local/devel --no-ff
```

→ **권장**.

## 11. 검증 게이트

### 11.1 자기 검증
- [ ] cherry-pick 충돌 0건
- [ ] `cargo build --release` 통과
- [ ] `cargo test --release` ALL GREEN (PR 본문 영역 신규 테스트 5건 포함)
- [ ] `cargo clippy --release --lib -- -D warnings` 통과
- [ ] `cd rhwp-studio && npx tsc --noEmit` 통과 (TypeScript 변경 부재)
- [ ] 광범위 sweep — 7 fixture / 170 페이지 회귀 0 (contract 정리 영역 시각 출력 무영향 입증)
- [ ] native-skia feature 테스트 (PR #720 의 24/24 PASS 보존)

### 11.2 시각 판정 게이트 — **면제 가능**

본 PR 은 contract 정리 단계 (PR 본문 명시). 결정적 검증 + 회귀 가드 (테스트 5건) + 광범위 sweep + CI 통과로 충분.

`feedback_visual_judgment_authority` 정합 — 결정적 검증 + 회귀 가드 명시 영역 시각 판정 면제 합리.

## 12. 메모리 룰 적용

| 룰 | 적용 |
|----|------|
| `feedback_contributor_cycle_check` | @seo-rii 8번째 사이클 (Skia 핵심) |
| `feedback_image_renderer_paths_separate` | paint 모듈 정리 — svg/web_canvas/skia 영역 동기 보강 (output options 직접 호출 경로) |
| `feedback_pr_supersede_chain` 권위 사례 | PR #599 (P4) → #626 (P5) → #720 (P6) → **#761 (P8)** Issue #536 트래킹 단계적 진전 |
| `feedback_process_must_follow` | contract 정리 + Non-goals 명시 + 결정적 검증 — 위험 좁힘 |
| `feedback_visual_judgment_authority` | contract 정리 단계, 결정적 검증 + 회귀 가드 + sweep 통과 영역 시각 판정 면제 합리 |

## 13. 처리 순서 (승인 후)

1. `local/devel` 영역 cherry-pick (auto-merge 정합 예상)
2. 자기 검증 (cargo build/test/clippy + tsc + 광범위 sweep + native-skia feature)
3. 시각 판정 면제 합리 (작업지시자 결정)
4. 검증 통과 → no-ff merge + push + archives + 5/10 orders 갱신
5. PR #761 close

---

작성: 2026-05-10
