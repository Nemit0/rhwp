---
PR: #769
제목: render — improve Skia text replay parity (P9)
컨트리뷰터: @seo-rii (Seohyun Lee) — 9번째 사이클 (Skia 핵심 컨트리뷰터)
base / head: devel / render-p9
mergeStateStatus: BEHIND
mergeable: MERGEABLE
CI: SUCCESS (Build & Test + CodeQL js/ts/py/rust + Canvas visual diff)
변경 규모 (전체 PR): +1471 / -426, 13 files
변경 규모 (P9 본질, P8 제외): +1854/-1020 (8f079b12 + c74fb927)
검토일: 2026-05-10
Refs: #536
---

# PR #769 검토

## 1. 메타

| 항목 | 값 |
|------|-----|
| PR 번호 | #769 |
| 제목 | render — improve Skia text replay parity (P9) |
| 컨트리뷰터 | @seo-rii — Skia 핵심 (9번째 사이클, PR #165/#419/#456/#498/#599/#626/#720/#761/#769) |
| base / head | devel / render-p9 |
| mergeStateStatus | BEHIND, mergeable: MERGEABLE — 충돌 부재 |
| CI | ✅ Build & Test + CodeQL (js/ts/py/rust) + Canvas visual diff 통과 |
| 변경 규모 (전체) | +1471 / -426, 13 files |
| 변경 규모 (P9 본질) | +1854 / -1020 (8f079b12 + c74fb927) — `renderer.rs` + `text_replay.rs` 신규 |
| 커밋 수 | 3 (P8 1개 + P9 2개) |
| Refs | #536 (Skia native raster 트래킹) |

## 2. 본질

P9 단계 — native Skia text replay 영역 영역 기존 `TextRunNode` payload 영역 영역 더 많이 소비. 단순 glyph drawing 영역 영역 layer payload 의 text metadata 영역 영역 가능 범위 영역 영역 replay.

### 2.1 Skia native raster 단계적 진전 (Issue #536)
| 단계 | PR | 본질 |
|------|-----|------|
| P4 | #599 | native Skia PNG raster backend |
| P5 | #626 | equation replay |
| P6 | #720 | raw SVG fragment replay |
| P8 | #761 (5/10) | schema/resource hardening |
| **P9** | **#769 (5/10)** | **text replay parity + module split** |

### 2.2 P10 → P9 통합 (PR 본문 명시)
원래 P10 영역 영역 분리 의도였던 text replay module split (순수 리팩터링) 영역 영역 P9 영역 영역 통합. 기능 보강 영역 영역 커진 코드 영역 영역 같은 PR 영역 영역 정리.

## 3. P9 본질 영역 보강 항목

| 영역 | 본질 |
|------|------|
| char overlap | `TextRunNode.char_overlap` 소비 영역 영역 native Skia replay |
| tab leader | tab leader char + repeat 영역 영역 replay |
| text decoration | underline / strike / overline 영역 영역 replay |
| shade/shadow/outline-style effect | 텍스트 효과 영역 영역 replay |
| emphasis dot | 한글 강조점 영역 영역 replay |
| vertical rotation | 세로쓰기 영역 영역 rotation 영역 영역 replay |
| control mark | output options 영역 영역 paragraph mark + control codes 영역 영역 replay |

## 4. 인프라 도입 — `text_replay.rs` 모듈 분리

`c74fb927` (P9 후속, P10 통합):
- `src/renderer/skia/text_replay.rs` 신규 (+748)
- `src/renderer/skia/renderer.rs` 영역 영역 split (-886, +210 — page/layer replay orchestration 영역 영역 집중)
- `src/renderer/skia/mod.rs` (+1) — 신규 모듈 등록

→ `renderer.rs` 영역 영역 page/layer replay orchestration 영역 영역 집중 + text replay 영역 영역 별 모듈.

## 5. PR 의 정정 — 13 files (P9 본질만 — 3 files)

### 5.1 P9 본질 (cherry-pick 대상)
| 파일 | 변경 |
|------|------|
| `src/renderer/skia/renderer.rs` | +438/-353 (text replay 보강 영역 영역 split 영역 영역 변경) |
| `src/renderer/skia/text_replay.rs` | +748 (신규 모듈) |
| `src/renderer/skia/mod.rs` | +1 (모듈 등록) |

### 5.2 P8 변경 (PR #761 영역 영역 머지 완료, skip)
P8 본질 (Layer schema/resource hardening) 영역 영역 PR #761 (5/10 머지) 영역 영역 동일 본질 — `49b540a9` cherry-pick 영역 영역 empty 영역 영역 skip 가능:
- `Cargo.toml` (+1 blake3)
- `src/paint/json.rs` (+5/-6)
- `src/paint/layer_tree.rs` (-8)
- `src/paint/mod.rs` (+9/-3)
- `src/paint/resources.rs` (+40)
- `src/paint/schema.rs` (+33 신규)
- `src/renderer/svg_layer.rs` (+60/-1)
- `src/renderer/web_canvas.rs` (+2)
- `src/wasm_api.rs` (+57/-54)
- `src/wasm_api/tests.rs` (+77/-1)

## 6. Non-goals (PR 본문 명시)

- `skia` 브랜치의 full text source table / glyph-run IR 작업 미포함
- Skia 영역 기본 public render path 전환 부재
- targeted raster test 외 visual/pixel regression infrastructure 추가 부재

## 7. 결정적 검증 (PR 본문 명시)

- `cargo test --features native-skia --lib skia` — char overlap / empty-text tab leader / control mark / decorated text 영역 native Skia raster 테스트 신규
- `cargo clippy --features native-skia --lib -- -D warnings`

## 8. 충돌 / mergeable

mergeStateStatus = `BEHIND`, mergeable = `MERGEABLE`. P8 (49b540a9) 영역 영역 PR #761 (5/10 머지) 영역 영역 동일 → cherry-pick 영역 영역 empty 또는 자동 정합. P9 본질 (8f079b12 + c74fb927) 영역 영역 신규 코드 영역 영역 충돌 부재.

## 9. 본 환경 점검

### 9.1 변경 격리
- Rust skia 모듈 영역 영역만 (`renderer.rs` + `text_replay.rs` 신규 + `mod.rs`)
- Non-skia 경로 (svg/web_canvas) 무영향
- TypeScript / rhwp-studio 무영향
- `feedback_image_renderer_paths_separate` 정합 — Skia 만 영역 영역 변경

### 9.2 CI 결과
- 모두 ✅

## 10. 처리 옵션

### 옵션 A — P9 본질 commits 만 cherry-pick + no-ff merge

```bash
git checkout local/devel
git cherry-pick 49b540a9  # empty 가능 → --skip 또는 --allow-empty
git cherry-pick 8f079b12  # P9 본질 1
git cherry-pick c74fb927  # P9 본질 2 (split)
git checkout devel
git merge local/devel --no-ff
```

본 환경 점검:
- `49b540a9` (P8) 영역 영역 PR #761 영역 영역 동일 본질 영역 영역 empty cherry-pick 가능 → skip 또는 `--allow-empty`
- `8f079b12` + `c74fb927` 영역 영역 P9 본질, auto-merge 정합 예상

→ **권장**.

## 11. 검증 게이트

### 11.1 자기 검증
- [ ] `49b540a9` skip 또는 empty cherry-pick (PR #761 동일 본질)
- [ ] `8f079b12` + `c74fb927` cherry-pick 충돌 0건
- [ ] `cargo build --release` 통과
- [ ] `cargo test --release` ALL GREEN
- [ ] **`cargo test --release --features native-skia --lib skia`** PASS (PR 본문 명시 영역 영역 신규 raster 테스트)
- [ ] `cargo clippy --release --features native-skia --lib -- -D warnings` 통과
- [ ] 광범위 sweep — 7 fixture / 170 페이지 회귀 0 (skia 만 영역 영역 변경 영역 영역 svg sweep 무영향 입증)

### 11.2 시각 판정 게이트 — **면제 가능**

본 PR 본질 영역 영역 native Skia text replay 영역 영역 보강 + targeted raster 테스트 영역 영역 결정적 검증. PR #720 (P6) / PR #761 (P8) 동일 패턴 — 시각 판정 면제 합리.

`feedback_visual_judgment_authority` 정합 — 결정적 검증 + 회귀 가드 + sweep 통과 영역 영역 면제.

## 12. 메모리 룰 적용

| 룰 | 적용 |
|----|------|
| `feedback_contributor_cycle_check` | @seo-rii 9번째 사이클 (Skia 핵심) |
| `feedback_image_renderer_paths_separate` | Skia 만 영역 영역 변경 — svg/web_canvas/렌더링 경로 무영향 (권위 사례) |
| `feedback_pr_supersede_chain` 권위 사례 강화 | PR #599 (P4) → #626 (P5) → #720 (P6) → #761 (P8) → **#769 (P9)** Issue #536 트래킹 |
| `feedback_process_must_follow` | P10 → P9 통합 (PR 본문 명시) + Non-goals 명시 + 결정적 검증 |
| `feedback_visual_judgment_authority` | targeted raster 테스트 + sweep 통과 영역 영역 시각 판정 면제 합리 |

## 13. 처리 순서 (승인 후)

1. `local/devel` 영역 cherry-pick:
   - `49b540a9` (skip 또는 empty)
   - `8f079b12` + `c74fb927` (P9 본질)
2. 자기 검증 (cargo build/test/clippy + native-skia feature 테스트 + 광범위 sweep)
3. 시각 판정 면제 합리 (작업지시자 결정)
4. 검증 통과 → no-ff merge + push + archives + 5/10 orders
5. PR #769 close

---

작성: 2026-05-10
