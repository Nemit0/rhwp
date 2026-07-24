---
PR: #756
제목: feat — 보기 메뉴 도구 상자 / 서식 도구 모음 표시 토글 구현
컨트리뷰터: @oksure (Hyunwoo Park) — 20+ 사이클 핵심 컨트리뷰터 (5/10 사이클 22번째 PR)
처리: 옵션 A — 2 commits cherry-pick + no-ff merge
처리일: 2026-05-10
머지 commit: fddc3f06
---

# PR #756 처리 보고서

## 1. 처리 결과

✅ **머지 완료** — 옵션 A (2 commits cherry-pick + no-ff merge)

| 항목 | 값 |
|------|-----|
| 머지 commit | `fddc3f06` (--no-ff merge) |
| Cherry-pick commits | `d94fb4d3` (feat) + `4d2a729f` (Copilot 리뷰) |
| Issue 연결 | 부재 (보기 메뉴 stub 활성화 영역 자기완결) |
| 시각 판정 | ✅ 작업지시자 웹 에디터 인터랙션 검증 통과 |
| 자기 검증 | tsc + cargo test ALL GREEN + sweep 170/170 same + WASM 4.68 MB 재빌드 |

## 2. 정정 본질 — 1 file, +34/-12

`rhwp-studio/src/command/commands/view.ts` 영역 영역 2 stub → IIFE 클로저 토글 변환:

| 커맨드 | 대상 DOM | 동작 |
|--------|----------|------|
| `view:toolbox-basic` | `#icon-toolbar` | display 토글 + active 클래스 |
| `view:toolbox-format` | `#style-bar` | display 토글 + active 클래스 |

## 3. Copilot 리뷰 반영 (commit `4d2a729f`)
첫 호출 시 DOM 영역 영역 `getComputedStyle()` 영역 영역 초기 표시 상태 정확히 복원.

## 4. 인프라 재사용

| 인프라 | 활용 |
|--------|------|
| 기존 IIFE 클로저 토글 패턴 (`view:para-mark` / `view:toggle-clip`) | 동일 패턴 정합 |
| `[data-cmd]` 메뉴 active 클래스 (기존) | 메뉴 항목 영역 영역 시각 정합 |

→ 신규 인프라 도입 부재 (`feedback_process_must_follow` 정합).

## 5. 본 환경 검증

| 검증 | 결과 |
|------|------|
| `cherry-pick` (2 commits) | ✅ auto-merge 충돌 0건 |
| `tsc --noEmit` (rhwp-studio) | ✅ 통과 |
| `cargo test --release` | ✅ ALL GREEN |
| 광범위 sweep (7 fixture / 170 페이지) | ✅ **170 same / 0 diff** |
| WASM 빌드 (Docker, 재빌드) | ✅ 4.68 MB |

## 6. 작업지시자 웹 에디터 인터랙션 검증 ✅ 통과
- 메뉴 → "보기 → 기본" → 도구 상자 (#icon-toolbar) 토글 + 메뉴 active 클래스 정합
- 메뉴 → "보기 → 서식" → 서식 도구 모음 (#style-bar) 토글 + 메뉴 active 클래스 정합
- 첫 호출 시 초기 표시 상태 정확히 복원

## 7. 영향 범위

### 7.1 변경 영역
- rhwp-studio editor 영역 영역 보기 메뉴 (TypeScript 단일 파일)

### 7.2 무변경 영역
- WASM 코어 (Rust) — 변경 부재
- HWP3/HWPX 변환본 시각 정합 (sweep 170/170 same 입증)

## 8. 메모리 룰 적용

| 룰 | 적용 |
|----|------|
| `feedback_contributor_cycle_check` | @oksure **20+ 사이클** (5/10 사이클 22번째 PR) |
| `feedback_image_renderer_paths_separate` | TypeScript 단일 영역 영역 Rust 렌더링 경로 무영향 |
| `feedback_process_must_follow` | 인프라 재사용 (기존 IIFE 클로저 토글 패턴) — 신규 인프라 도입 부재 |
| `feedback_visual_judgment_authority` | 작업지시자 웹 에디터 인터랙션 검증 ✅ 통과 |

## 9. 잔존 후속

- 본 PR 본질 정정의 잔존 결함 부재

---

작성: 2026-05-10
