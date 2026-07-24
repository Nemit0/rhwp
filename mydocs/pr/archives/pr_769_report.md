---
PR: #769
제목: render — improve Skia text replay parity (P9)
컨트리뷰터: @seo-rii (Seohyun Lee) — 9번째 사이클 (Skia 핵심 컨트리뷰터)
처리: 옵션 A — P8 skip + P9 2 commits cherry-pick + no-ff merge
처리일: 2026-05-10
머지 commit: 1097fbe4
Refs: #536
---

# PR #769 처리 보고서

## 1. 처리 결과

✅ **머지 완료** — 옵션 A (P8 skip + P9 2 commits cherry-pick + no-ff merge)

| 항목 | 값 |
|------|-----|
| 머지 commit | `1097fbe4` (--no-ff merge) |
| Cherry-pick commits | `7a9015f3` (8f079b12, P9 본질 1) + `e275789f` (c74fb927, P9 본질 2 split) |
| Skip commit | `49b540a9` (P8, PR #761 영역 머지 완료 영역 empty) |
| Refs | Issue #536 (Skia native raster 트래킹) |
| 시각 판정 | 면제 (작업지시자 결정 — targeted raster + sweep 통과 + Skia 만 변경) |
| 자기 검증 | cargo build/test/clippy + native-skia 28/28 PASS + sweep 170/170 same |

## 2. 본질

P9 단계 — native Skia text replay 영역 기존 `TextRunNode` payload 영역 더 많이 소비. 단순 glyph drawing 영역 layer payload 의 text metadata 영역 가능 범위 영역 replay.

### 2.1 Skia native raster 단계적 진전 (Issue #536)
| 단계 | PR | 본질 |
|------|-----|------|
| P4 | #599 (5/5) | native Skia PNG raster backend |
| P5 | #626 (5/7) | equation replay |
| P6 | #720 (5/9) | raw SVG fragment replay |
| P8 | #761 (5/10) | schema/resource hardening |
| **P9** | **#769 (5/10)** | **text replay parity + module split** |

### 2.2 P10 → P9 통합 (PR 본문 명시)
원래 P10 영역 분리 의도였던 text replay module split (순수 리팩터링) 영역 P9 영역 통합.

## 3. P9 본질 영역 보강 항목

| 영역 | 본질 |
|------|------|
| char overlap | TextRunNode.char_overlap 소비 |
| tab leader | tab leader char + repeat replay |
| text decoration | underline / strike / overline replay |
| shade/shadow/outline-style effect | 텍스트 효과 replay |
| emphasis dot | 한글 강조점 replay |
| vertical rotation | 세로쓰기 rotation replay |
| control mark | output options 영역 paragraph mark + control codes replay |

## 4. 인프라 도입 — `text_replay.rs` 모듈 분리

`c74fb927` (P9 후속, P10 통합):
- `src/renderer/skia/text_replay.rs` 신규 (+748)
- `src/renderer/skia/renderer.rs` (+438/-353) — page/layer replay orchestration 집중
- `src/renderer/skia/mod.rs` (+1) — 신규 모듈 등록

## 5. 본 환경 처리 — 3 commits 분석

### 5.1 commits 분석
| commit | 본질 | 본 환경 처리 |
|--------|------|-------------|
| `49b540a9` (P8) | Layer schema/resource hardening | PR #761 (5/10) 머지 완료 영역 동일 본질 → **skip (empty)** |
| `8f079b12` (P9 본질 1) | text replay parity 보강 | ✅ cherry-pick (`7a9015f3`) |
| `c74fb927` (P9 본질 2) | text replay module split | ✅ cherry-pick (`e275789f`) |

### 5.2 cherry-pick 결과
- `49b540a9` cherry-pick → empty (devel 영역 PR #761 영역 적용 완료) → `--skip` 진행
- `8f079b12` + `c74fb927` cherry-pick → auto-merge 충돌 0건

## 6. 본 환경 검증

| 검증 | 결과 |
|------|------|
| `cherry-pick` (P8 skip + P9 2 commits) | ✅ 충돌 0건 |
| `cargo build --release` | ✅ 통과 |
| `cargo test --release` | ✅ ALL GREEN |
| **`cargo test --release --features native-skia --lib skia`** | ✅ **28/28 PASS** (신규 4건 + 기존 24건) |
| `cargo clippy --release --features native-skia --lib -- -D warnings` | ✅ 통과 |
| 광범위 sweep (7 fixture / 170 페이지) | ✅ **170 same / 0 diff** (skia 만 영역 svg sweep 무영향 입증) |

### 6.1 신규 raster 테스트 4건 (PR 본문 명시)
- `renders_char_overlap_text_run_as_ink` ✅
- `renders_decorated_text_as_ink` ✅
- `renders_tab_leader_for_empty_text_run` ✅
- `renders_output_control_marks_as_ink` ✅

## 7. Non-goals (PR 본문 명시)
- full text source table / glyph-run IR 미포함
- Skia 영역 기본 public render path 전환 부재
- targeted raster test 외 visual/pixel regression infrastructure 추가 부재

## 8. 시각 판정 면제 (작업지시자 결정)

본 PR 본질 영역 native Skia text replay 영역 보강 + targeted raster 테스트 4건 영역 결정적 검증 + 광범위 sweep 통과 + Skia 만 변경 (`feedback_image_renderer_paths_separate` 권위 사례). PR #720 / #761 동일 패턴 — 시각 판정 면제 합리.

## 9. 영향 범위

### 9.1 변경 영역
- Rust skia 모듈 (`src/renderer/skia/renderer.rs` + `text_replay.rs` 신규 + `mod.rs`)

### 9.2 무변경 영역
- Non-skia 경로 (svg/web_canvas) — sweep 170/170 same 입증
- TypeScript / rhwp-studio (변경 부재)
- Skia 영역 public render path (PR 본문 Non-goals 명시)

## 10. 메모리 룰 적용

| 룰 | 적용 |
|----|------|
| `feedback_contributor_cycle_check` | @seo-rii **9번째 사이클** (Skia 핵심) |
| `feedback_image_renderer_paths_separate` | **권위 사례 강화** — Skia 만 변경 영역 svg/web_canvas 무영향 (sweep 170/170 same 입증) |
| `feedback_pr_supersede_chain` 권위 사례 강화 | PR #599 (P4) → #626 (P5) → #720 (P6) → #761 (P8) → **#769 (P9)** Issue #536 트래킹 단계적 진전 |
| `feedback_process_must_follow` | P10 → P9 통합 (PR 본문 명시) + Non-goals 명시 + 결정적 검증 |
| `feedback_visual_judgment_authority` | targeted raster 테스트 + sweep 통과 영역 시각 판정 면제 합리 |

## 11. 잔존 후속

- 본 PR 본질 정정의 잔존 결함 부재
- 후속 PR (PR 본문 명시):
  - full text source table / glyph-run IR
  - Skia 영역 public render path 전환
  - visual/pixel regression infrastructure

---

작성: 2026-05-10
