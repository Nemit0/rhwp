---
PR: 587
title: "fix: 문자 컨트롤 0x18/0x1E 매핑 swap (하이픈 ↔ 묶음 빈칸)"
author: planet6897 (Jaeook Ryu)
processed: 2026-05-04
result: closed (cherry-pick 통합 완료)
issue: 없음 (direct fix, HWP 5.0 스펙 표 7 정합)
visual_judgment: ★ 통과 (svg + 웹 에디터 모두 메인테이너 직접 확인)
---

# PR #587 처리 보고서 — HWP 5.0 스펙 정합 swap

**처리일**: 2026-05-04
**결정**: ✅ cherry-pick 단일 commit `1cbf7c8` (충돌 0) → close
**컨트리뷰터**: @planet6897 (Jaeook Ryu)

## 1. 본질

HWP 5.0 스펙 **표 7 (문자 컨트롤)** 과 정반대로 swap 되어 있던 두 코드 정정:

| 코드 | 의미 | 수정 전 | 수정 후 |
|------|------|--------|--------|
| 0x18 (24) | 하이픈 | `U+00A0` (nbsp) ❌ | `-` (hyphen) ✅ |
| 0x1E (30) | 묶음 빈칸 | `-` (hyphen) ❌ | `U+00A0` (nbsp) ✅ |

**결정적 증거**: 본 환경 자체 테스트 (`src/parser/body_text/tests.rs:117,120`) 의 주석이 이미 정답을 가리키고 구현만 swap 되어 있던 상태:
- L117: `assert!(!is_extended_ctrl_char(0x0018)); // hyphen`
- L120: `assert!(!is_extended_ctrl_char(0x001E)); // non-breaking space`

## 2. cherry-pick 결과

| 단계 | commit | cherry-pick | 충돌 |
|------|--------|-------------|------|
| 단일 본질 | `1cbf7c8` (PR) → cherry-pick | ✅ | 0 |

변경 파일 (2):
- `src/parser/body_text.rs:328-348` — `parse_para_text` 의 0x18/0x1E text.push swap + 주석 보강 (HWP 5.0 표 7 코드 번호 명시)
- `src/parser/tags.rs:128-131` — `CHAR_HYPHEN` (0x1E → 0x18) / `CHAR_NBSPACE` (0x18 → 0x1E) 상수 swap (외부 참조 0건)

## 3. 결정적 검증

| 게이트 | 결과 |
|--------|------|
| `cargo test --lib --release` | ✅ 1129 passed (회귀 0) |
| `cargo test --lib --release parser::body_text` | ✅ 22 passed |
| `cargo test --release --test svg_snapshot` | ✅ 6/6 passed |
| `cargo clippy --lib --release -- -D warnings` | ✅ 0 warnings |
| CI (Build & Test + CodeQL js-ts/python/rust) | ✅ All SUCCESS |

## 4. 시각 회귀 — quantitative 측정 100% 재현

`>-</text>` 글리프 출현 횟수:

| 샘플 | 본 환경 측정 | PR 본문 | 일치? |
|------|-------------|---------|-------|
| exam_eng | 366 → 39 | 366 → 39 | ✅ |
| exam_kor | 444 → 33 | 444 → 33 | ✅ |
| exam_science | 37 → 18 | 37 → 18 | ✅ |
| exam_math | 42 → 42 | 42 → 42 | ✅ (0x1E 미사용) |
| exam_social | 2 → 2 | 2 → 2 | ✅ (동일) |

757 개의 잘못된 하이픈 제거 (327+411+19) — 본 환경 PDF 와 정합 회복.

## 5. 시각 판정 ★ — 메인테이너 통과

**SVG 비교**: `output/svg/pr587_before/{exam_eng,exam_kor}/` ↔ `output/svg/pr587_after/{exam_eng,exam_kor,exam_math,exam_science,exam_social}/`

**웹 에디터 비교**: WASM 빌드 + studio sync 후 직접 확인

→ "1." 문제 번호 다음의 잘못된 하이픈 → 묶음 빈칸 정합 회복 확인. **svg + 웹 에디터 모두 통과**.

## 6. WASM 빌드

| 항목 | 값 |
|------|-----|
| Docker 빌드 시간 | 1분 30초 |
| 결과 | `pkg/rhwp_bg.wasm` 4,582,545 bytes (4.58 MB) |
| 직전 대비 | -5,815 bytes (이전 4,588,360, PR #582 이후) |
| Studio sync | ✅ `rhwp-studio/public/{rhwp_bg.wasm, rhwp.js, rhwp.d.ts}` |

## 7. close 댓글 (요지)

- 차분한 사실 중심 (메모리 `feedback_pr_comment_tone` — @planet6897 반복 컨트리뷰터, 매번 같은 인사 부적절)
- 본질 평가: HWP 5.0 스펙 표 7 정합 + 자체 테스트 주석 일치 + 외부 참조 0건
- quantitative 측정 100% 재현 + 메인테이너 시각 판정 ★ 통과 안내

## 8. 메모리 정합

- ✅ `feedback_visual_regression_grows` — 시각 판정 게이트 정합 운영 (svg + 웹 에디터 모두 메인테이너 직접 확인)
- ✅ `feedback_essential_fix_regression_risk` — 단순 swap 으로 회귀 위험 본질적으로 0 (외부 참조 0)
- ✅ `feedback_pr_comment_tone` — @planet6897 반복 컨트리뷰터, 차분한 사실 중심
- ✅ `feedback_rule_not_heuristic` — 스펙 정합 단일 룰 (분기 없음)
- ✅ `project_output_folder_structure` — `output/svg/pr587_{before,after}/` 패턴 적용 (메모리 보강 — PR 검토 SVG 위치)

## 9. 메모리 보강 (본 사이클 학습)

`project_output_folder_structure.md` 에 PR 검토 SVG 패턴 명시 추가:
- `output/svg/pr{N}_before/` + `output/svg/pr{N}_after/` (샘플별 서브폴더)
- `/tmp/` 사용 금지 사유: 작업지시자 IDE 시각 판정 효율성

## 10. 사후 처리

- [x] 단일 commit cherry-pick (충돌 0)
- [x] 결정적 검증 (cargo test 1129 + svg_snapshot 6/6 + clippy 0 + parser::body_text 22)
- [x] 시각 회귀 quantitative 100% 재현
- [x] WASM 빌드 + studio sync
- [x] 메인테이너 시각 판정 ★ 통과 (svg + 웹 에디터 모두)
- [x] orders 갱신 (PR #587 항목)
- [x] devel merge + push
- [x] PR #587 close + 차분한 안내 댓글
- [x] 검토 문서 archives 이동
