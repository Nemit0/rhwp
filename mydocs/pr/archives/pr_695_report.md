---
PR: #695
제목: feat — ir-diff `--summary` / `--max-lines` 출력 가드 추가
컨트리뷰터: @planet6897 (Jaeuk Ryu) — 30+ 사이클 핵심 컨트리뷰터
처리: 옵션 A — 1 commit cherry-pick + no-ff merge
처리일: 2026-05-09
머지 commit: 2ca126c3
---

# PR #695 처리 보고서

## 1. 처리 결과

✅ **머지 완료** — 옵션 A (1 commit cherry-pick + no-ff merge `2ca126c3`)

| 항목 | 값 |
|------|-----|
| 머지 commit | `2ca126c3` (--no-ff merge) |
| 시각 판정 | **면제** (UI 무관 CLI 옵션 추가, env-var-checked 본질 영역) |
| 자기 검증 | lib 1166 + 통합 ALL GREEN + 신규 ir_diff_summary_mode **3/3 PASS** + clippy clean |
| 수동 검증 | --summary 22 카테고리 / --max-lines 20 truncation / 옵션 부재 1436 라인 보존 |

## 2. 정정 본질

### 2.1 신규 옵션 (`src/main.rs::ir_diff`)
- `--summary`: 카테고리별 차이 카운트만 출력 (paragraph 헤더 + 개별 차이 생략)
- `--max-lines <N>`: 출력 라인 N 제한 + truncation 마커, 합계 라인 가드 외부 보존

### 2.2 두 매크로 (함수 내부 스코프)
- `emit_header!` — paragraph 헤더 출력, summary 모드 부재 + max_lines 초과 시 truncate
- `emit_diff!` — 차이 라인, summary 모드는 BTreeMap 카운트, 일반 모드는 `[차이] {}` 형식

### 2.3 카테고리 추출 알고리즘
```
prefix = body.split(':').next()
cat = prefix.rfind(']') 이후 trim_start_matches('.').trim()
```

### 2.4 기존 `println!` 6곳 매크로 치환 (비교 로직 무변경)

### 2.5 회귀 가드 테스트 (`tests/ir_diff_summary_mode.rs`, 신규 3건)

| 테스트 | 검증 |
|--------|------|
| `summary_mode_categorizes_diffs` | summary 헤더 + 카운트 라인 + paragraph 헤더 부재 |
| `max_lines_truncates` | truncation 마커 + 합계 라인 보존 |
| **`no_flags_preserves_full_output`** | 옵션 부재 시 기존 형식 100% 보존 (회귀 가드) |

## 3. 본 환경 cherry-pick + 검증

### 3.1 cherry-pick (1 commit)
```
5e682810 feat: ir-diff `--summary` / `--max-lines` 출력 가드 추가 (cherry-pick of 79a9dc3f)
```
충돌 0건.

### 3.2 결정적 검증
| 검증 | 결과 |
|------|------|
| `cargo build --release` | ✅ 통과 |
| `cargo test --release --test ir_diff_summary_mode` | ✅ **3/3 PASS** |
| `cargo test --release` | ✅ lib 1166 + 통합 ALL GREEN, failed 0 |
| `cargo clippy --release --all-targets` | ✅ 신규 경고 0 |

### 3.3 수동 검증 (PR 본문 정합)

| 명령 | 결과 |
|------|------|
| `--summary` | 22 카테고리 카운트 출력 (260 char_shapes count + 69 ml + 61 indent + ...) |
| `--max-lines 20` | truncation 마커 (`이하 생략 (--max-lines 20 도달)`) + `=== 비교 완료: 차이 707 건 ===` 합계 보존 |
| 옵션 부재 | **1436 라인 출력** (기존 형식 보존) |

### 3.4 머지 commit
`2ca126c3` — `git merge --no-ff local/task695` 로 단일 머지 commit. PR #694/#693 패턴 일관성.

### 3.5 시각 판정 게이트 면제
UI 무관 CLI 옵션 추가. PR #649/#650 의 env-var-checked 본질 영역 면제 패턴과 동일 정합.

## 4. 메모리 룰 적용

| 룰 | 적용 |
|----|------|
| `feedback_contributor_cycle_check` | @planet6897 30+ 사이클 핵심 컨트리뷰터 정확 표현 |
| `feedback_hancom_compat_specific_over_general` | 출력 가드만 추가 (영향 좁힘), 비교 로직 무변경 |
| `feedback_visual_regression_grows` | UI 무관 CLI 옵션 추가 — 시각 판정 게이트 면제 정합 |
| `feedback_pr_supersede_chain` | PR #659 (Task #653) → PR #695 (출력 가드 후속 보강) 신규 사례 |

## 5. 잔존 후속

- 잔존 결함 부재. PR #695 본질 정정으로 ir-diff 출력 효율 개선 완료.
- closes 명시 없음 → PR 만 close (자동 close 매칭 부재).

---

작성: 2026-05-09
