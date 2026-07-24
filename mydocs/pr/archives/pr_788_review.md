---
PR: #788
제목: fix — 표 셀 검정 배경 렌더링 (pattern_type 검사 누락 수정, closes #782)
컨트리뷰터: @oksure (Hyunwoo Park) — 20+ 사이클 핵심 컨트리뷰터 (5/11 사이클 3번째 PR)
base / head: devel / contrib/hwp-cell-bgcolor-alpha
mergeStateStatus: BEHIND
mergeable: MERGEABLE
CI: SUCCESS (Build & Test + CodeQL js/ts/py/rust + Canvas visual diff)
변경 규모: +2 / -1, 1 file (style_resolver.rs)
검토일: 2026-05-11
---

# PR #788 검토

## 1. 메타

| 항목 | 값 |
|------|-----|
| PR 번호 | #788 |
| 제목 | fix — 표 셀 검정 배경 렌더링 |
| 컨트리뷰터 | @oksure — 20+ 사이클 (5/11 사이클 3번째 PR) |
| base / head | devel / contrib/hwp-cell-bgcolor-alpha |
| mergeStateStatus | BEHIND, mergeable: MERGEABLE — 충돌 부재 |
| CI | ✅ Build & Test + CodeQL + Canvas visual diff 통과 |
| 변경 규모 | **+2 / -1, 1 file** (1 라인 가드 추가) |
| 커밋 수 | 1 |
| closes | #782 (5/10 PR #745 영역 영역 작업지시자 발견 결함) |

## 2. 본질 (Issue #782)

HWP 문서 영역 표 셀이 검정 배경으로 렌더링되는 문제. 작업지시자 PR #745 시각 검증 영역 영역 발견 (`samples/aift.hwp` 페이지 2 일부 표 셀 검정 바탕).

### 2.1 원인 — `style_resolver.rs` (표 셀 경로) 영역 `pattern_type` 검사 누락

```rust
// 기존: alpha 만 검사
if (s.background_color >> 24) != 0 { None }
```

`pattern_type > 0` 시 `background_color` 영역 영역 패턴의 배경색 영역 영역 셀 단색 fill 아님 — 그러나 alpha 0 (불투명) + pattern_type > 0 영역 영역 단색 fill 영역 영역 검정 처리.

### 2.2 본질 영역 정합 점검 — 다른 경로 (`layout/utils.rs`)

`layout/utils.rs:126` (도형 경로) 영역 영역 이미 동일 로직 적용:
```rust
if s.pattern_type > 0 || (s.background_color >> 24) != 0 {
    None
}
```

**`feedback_image_renderer_paths_separate` 권위 사례** — 동일 본질 영역 영역 다른 경로 (도형 vs 표 셀) 영역 영역 비대칭 — 도형 경로 영역 영역 정합 영역 영역 표 셀 경로 영역 영역 누락 본질.

## 3. 정정

`src/renderer/style_resolver.rs:695` 영역 `resolve_single_border_style` 영역 1 라인 가드 추가:

```rust
// pattern_type > 0: 패턴 채우기 → 단색 fill 아님 (background_color는 패턴 배경)
// ColorRef 상위 바이트가 0이 아니면 "채우기 없음" (투명)
if s.pattern_type > 0 || (s.background_color >> 24) != 0 {
    None
} else {
    Some(s.background_color)
}
```

## 4. 인프라 재사용

| 인프라 | 활용 |
|--------|------|
| `BorderFill.fill.solid.pattern_type` (기존 IR) | 패턴 채우기 판별 |
| `layout/utils.rs:126` 동일 가드 (기존 패턴) | 정합 |

→ 신규 인프라 도입 부재.

## 5. 본 PR 의 정정 — 1 file, +2/-1

`src/renderer/style_resolver.rs` 영역 영역 1 라인 가드 추가.

## 6. 영향 (PR 본문 명시)

- `samples/aift.hwp` 페이지 2 등 패턴 채우기 사용 표 영역 영역 검정 배경 제거 (Issue #782 정정)
- PR #744 (HWPX ColorRef alpha) 와 별도 — HWP 전용 수정

## 7. 충돌 / mergeable

mergeStateStatus = `BEHIND`, mergeable = `MERGEABLE`. style_resolver.rs 영역 영역 5/10 사이클 영역 PR #745 (NewNumber Page) / PR #744 (HWPX alpha) 영역 영역 다른 영역 영역 충돌 부재 예상.

## 8. 본 환경 점검

### 8.1 변경 격리
- Rust 단일 파일 (style_resolver.rs) 영역 영역 1 라인
- 표 셀 경로 영역 영역 정정 (도형 경로 영역 영역 무영향, 이미 정합)

### 8.2 CI 결과
- 모두 ✅

### 8.3 광범위 sweep 영역 영역 변경 예상
PR 본문 명시 영역 영역 `samples/aift.hwp` 페이지 2 영역 영역 변경 — 광범위 sweep 영역 영역 aift 영역 영역 일부 페이지 diff 발생 가능 (의도된 변경 — 검정 배경 제거).

## 9. 처리 옵션

### 옵션 A — 1 commit cherry-pick + no-ff merge

```bash
git checkout local/devel
git cherry-pick 4725cadd
git checkout devel
git merge local/devel --no-ff
```

→ **권장**.

## 10. 검증 게이트

### 10.1 자기 검증
- [ ] cherry-pick 충돌 0건
- [ ] cargo build/test --release ALL GREEN
- [ ] cargo clippy --release -- -D warnings 통과
- [ ] 광범위 sweep 영역 영역 의도된 diff 점검 (aift 영역 영역 패턴 채우기 표 영역)

### 10.2 시각 판정 게이트 — **WASM 빌드 + 작업지시자 시각 판정 권장**

본 PR 본질 영역 영역 표 셀 시각 정합:
- WASM 빌드 후 dev server 영역 영역:
  - `samples/aift.hwp` 페이지 2 영역 영역 표 셀 검정 배경 제거 (Issue #782 정정)
  - 다른 표 영역 영역 단색 fill (pattern_type=0) 정상 표시
  - 패턴 채우기 표 영역 영역 패턴 정상 표시

`feedback_visual_judgment_authority` 정합 — Issue #782 영역 영역 작업지시자 시각 발견 영역 영역 본 환경 영역 영역 정정 입증 필수.

## 11. 메모리 룰 적용

| 룰 | 적용 |
|----|------|
| `feedback_contributor_cycle_check` | @oksure 20+ 사이클 (5/11 사이클 3번째 PR) |
| `feedback_image_renderer_paths_separate` | **권위 사례 강화** — 동일 본질 영역 영역 다른 경로 (도형 vs 표 셀) 비대칭 — 도형 정합 + 표 셀 누락 본질 정정 |
| `feedback_pr_supersede_chain` (c) 패턴 | PR #745 시각 검증 영역 영역 별 결함 (Issue #782) 영역 별 PR — 동일 패턴 |
| `feedback_process_must_follow` | 인프라 재사용 (기존 IR + 도형 경로 동일 가드 정합) — 신규 인프라 도입 부재 |
| `feedback_visual_judgment_authority` | Issue #782 영역 영역 작업지시자 시각 발견 + 본 PR 정정 입증 |

## 12. 처리 순서 (승인 후)

1. `local/devel` 영역 cherry-pick `4725cadd`
2. 자기 검증 (cargo build/test/clippy + 광범위 sweep — aift 영역 영역 의도된 diff 점검)
3. WASM 빌드 + 작업지시자 시각 판정 (aift 페이지 2 + 다른 표 정상)
4. 시각 판정 통과 → no-ff merge + push + archives + 5/11 orders + Issue #782 close
5. PR #788 close

---

작성: 2026-05-11
