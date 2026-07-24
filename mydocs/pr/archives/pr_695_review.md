---
PR: #695
제목: feat — ir-diff `--summary` / `--max-lines` 출력 가드 추가
컨트리뷰터: @planet6897 (Jaeuk Ryu) — 30+ 사이클 핵심 컨트리뷰터
base / head: devel / ir-diff-summary-max-lines
mergeStateStatus: BEHIND
mergeable: MERGEABLE — 충돌 0건
CI: ALL SUCCESS
변경 규모: +216 / -12, 4 files (소스 1 + 신규 통합 테스트 1 + 문서 2)
검토일: 2026-05-09
---

# PR #695 검토

## 1. 메타

| 항목 | 값 |
|------|-----|
| PR 번호 | #695 |
| 제목 | feat — ir-diff `--summary` / `--max-lines` 출력 가드 추가 |
| 컨트리뷰터 | @planet6897 (Jaeuk Ryu) — 30+ 사이클 핵심 컨트리뷰터 |
| base / head | devel / ir-diff-summary-max-lines |
| mergeStateStatus | BEHIND (devel 뒤처짐, 그러나 mergeable=MERGEABLE) |
| mergeable | MERGEABLE — `git merge-tree` 실측 충돌 0건 |
| CI | ALL SUCCESS (Build & Test, CodeQL ×3) |
| 변경 규모 | +216 / -12, 4 files |
| 커밋 수 | 1 (single commit `79a9dc3f`) |
| closes | (명시 없음 — 기능 추가 PR, PR #659 / Task #653 후속 보강) |
| 선행 PR | PR #659 (Task #653, devel `d1a48b31` 머지 완료) |

## 2. 동기

`rhwp ir-diff` 명령어의 출력량 폭증 문제 — 본 환경 직접 측정 (`./target/release/rhwp ir-diff samples/hwpx/aift.hwpx samples/aift.hwp | wc -l`) **현재 1437 라인** 출력. 광범위 회귀 검증 시 본질 영역 식별 어려움.

→ **카테고리별 카운트** (`--summary`) + **출력 라인 제한** (`--max-lines`) 모드 추가. 본질 비교 로직 무변경, 출력 단계만 가드.

## 3. PR 의 정정

### 3.1 신규 옵션 (`src/main.rs::ir_diff`)

```rust
"--summary" => { summary_mode = true; i += 1; }
"--max-lines" if i + 1 < args.len() => {
    max_lines = args[i + 1].parse().ok();
    i += 2;
}
```

### 3.2 두 매크로 도입 (함수 내부 스코프)

- `emit_header!` — paragraph/섹션 헤더. summary 모드에서는 출력 안 함 + max_lines 초과 시 truncate
- `emit_diff!` — 차이 라인. summary 모드에서는 카테고리별 카운트 (BTreeMap 누적), 일반 모드에서는 `[차이] {}` 형식 + max_lines 가드

매크로의 변수 캡처는 함수 스코프의 `summary_mode` / `max_lines` / `printed_lines` / `truncated` / `summary_buckets` (BTreeMap) — 안전.

### 3.3 카테고리 추출 알고리즘

```
prefix = body.split(':').next()  // ":" 앞쪽 토큰
if let Some(pos) = prefix.rfind(']') {
    cat = prefix[pos+1..].trim_start_matches('.').trim()
} else {
    cat = prefix.trim()
}
```

예시:
- `controls[0].xxx: A=... vs B=...` → `xxx`
- `cc: A=32 vs B=56` → `cc`
- `구역 0: 문단 수 ...` → `구역 0` (rfind ']') 부재이므로 prefix 그대로

### 3.4 기존 `println!` 사이트 6곳 매크로 치환

`println!` 직접 호출 → `emit_diff!` / `emit_header!` 치환 (비교 로직 무변경, 출력만 가드 통과). 문단 헤더 1곳 + 차이 라인 5곳 + 합계 라인 1곳 (가드 외부 보존).

### 3.5 합계 라인 항상 출력 (가드 외부)

```rust
println!("\n=== 비교 완료: 차이 {} 건 ===", total_diffs);
```

`max_lines` 도달해도 합계 라인은 출력. 회귀 가드.

## 4. 신규 통합 테스트 (`tests/ir_diff_summary_mode.rs`)

3 테스트 케이스 — 모두 `samples/hwpx/aift.hwpx` + `samples/aift.hwp` 권위 fixture 영역:

| 테스트 | 검증 |
|--------|------|
| `summary_mode_categorizes_diffs` | summary 헤더 출력 + paragraph 헤더 부재 + IR 비교 헤더 부재 + `{N}건 {category}` 카운트 라인 존재 |
| `max_lines_truncates` | truncation 마커 (`이하 생략 (--max-lines 20 도달)`) + 합계 라인 보존 |
| **`no_flags_preserves_full_output`** | **회귀 가드** — 옵션 부재 시 IR 비교 헤더 + paragraph 헤더 + `[차이]` prefix + 합계 모두 보존 + summary/truncation 출력 부재 |

→ **회귀 가드 테스트가 본질 영역의 무변경을 직접 확증**. 본 환경 fixture 영역 모두 존재 확인.

## 5. 문서

- `mydocs/manual/ir_diff_command.md`: 옵션 표 + 사용 예 (+13 LOC)
- `CLAUDE.md`: 디버깅 워크플로우 ir-diff 예시 +2 줄

## 6. 영향 범위

### 6.1 무변경 영역
- ir-diff **차이 검출 로직** — `diff_*` / `ir_diff` 의 비교 영역 그대로 보존
- 옵션 부재 시 **기존 출력 형식 100% 보존** (회귀 가드 테스트 입증)
- ir-diff 외 다른 CLI 명령어 영역 무관

### 6.2 신규 영역 (orthogonal 추가)
- `--summary`: 카테고리별 카운트 + paragraph 헤더 부재
- `--max-lines <N>`: N 라인 제한 + truncation 마커

→ 위험 매우 낮음. `feedback_hancom_compat_specific_over_general` 정합 영역 (영향 좁힘 — 출력 단계만 가드).

## 7. 충돌 / mergeable

- `mergeStateStatus: BEHIND` (PR base = `215abb52`, devel HEAD = `fe6a91a3`, 10 commits 뒤처짐)
- `git merge-tree --write-tree` 실측: **CONFLICT 0건** (소스 + 문서 + 테스트 모두 본 환경 미충돌 영역)

## 8. 처리 옵션

### 옵션 A — 1 commit cherry-pick + no-ff merge (추천)

PR base 가 `215abb52` (5/8 마지막 머지) 시점이고 충돌 0건 → 단순 cherry-pick. PR #694 / #693 처리 패턴과 동일 — 임시 브랜치 + no-ff merge 묶기.

```bash
git branch local/task695 215abb52
git checkout local/task695
git cherry-pick 79a9dc3f
git checkout local/devel
git merge --no-ff local/task695
```

장점: PR 단위 머지 commit 유지, devel log 일관성.

### 옵션 B — single commit 직접 cherry-pick + no-ff 미적용

1 commit 직접 cherry-pick, fast-forward 가능. devel log 에 PR 단위 머지 commit 부재 → 비추천 (PR #694 / #693 패턴과 비일관).

→ **옵션 A 추천**.

## 9. 검증 게이트 (구현 단계 DoD)

### 자기 검증
- [ ] `cargo build --release` 통과
- [ ] `cargo test --release --test ir_diff_summary_mode` — 신규 3 테스트 ALL PASS
- [ ] `cargo test --release` — 전체 lib + 통합 ALL GREEN, 회귀 0
- [ ] `cargo clippy --release --all-targets` clean
- [ ] **수동 검증**: `./target/release/rhwp ir-diff samples/hwpx/aift.hwpx samples/aift.hwp --summary` 카테고리별 카운트 정상 / `--max-lines 20` truncation 마커 정상 / 옵션 부재 시 1437 라인 (현재) 보존

### 시각 판정 게이트
- 본 PR 은 CLI 출력 가드 추가 (UI/렌더링 무변경) → **시각 판정 게이트 면제** 정합 (`feedback_visual_regression_grows` 룰 정합 — UI 회귀 영향 부재)

## 10. 메모리 룰 적용

| 룰 | 적용 |
|----|------|
| `feedback_contributor_cycle_check` | @planet6897 30+ 사이클 핵심 컨트리뷰터 정확 표현 |
| `feedback_hancom_compat_specific_over_general` | 출력 가드만 추가 (영향 좁힘), 비교 로직 무변경 |
| `feedback_visual_regression_grows` | UI 무관 CLI 옵션 추가 — 시각 판정 게이트 면제 정합 (env-var-checked 본질 영역의 PR #649/#650 면제 패턴) |
| `feedback_pr_supersede_chain` | PR #659 (Task #653) → PR #695 (출력 가드 후속 보강) — 동일 컨트리뷰터의 후속 사이클 본질 분리 패턴 신규 사례 |
| `feedback_image_renderer_paths_separate` | 본 영역 무관 (renderer 영역 부재, CLI 영역만) |

## 11. 처리 순서 (승인 후)

1. `local/devel` 에서 1 commit cherry-pick (옵션 A)
2. 자기 검증 (cargo test/build/clippy + 신규 테스트 3건 + 수동 검증)
3. **시각 판정 게이트 면제** — UI 무관, env-var-checked 본질 영역의 PR #649 / #650 패턴
4. no-ff merge + push + archives 이동 + 5/9 orders 갱신
5. PR #695 close (closes 명시 없으므로 수동 close + 한국어 댓글)

---

작성: 2026-05-09
