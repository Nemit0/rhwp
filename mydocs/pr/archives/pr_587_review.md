---
PR: 587
title: "fix: 문자 컨트롤 0x18/0x1E 매핑 swap (하이픈 ↔ 묶음 빈칸)"
author: planet6897 (Jaeook Ryu)
base: devel
head: 1cbf7c8 (단일 commit)
mergeable: MERGEABLE / CI All SUCCESS
issue: (없음 — direct fix, HWP 5.0 스펙 표 7 정합)
---

# PR #587 검토 보고서 — 단일 commit cherry-pick (스펙 정합 swap)

**PR**: [#587 fix: 문자 컨트롤 0x18/0x1E 매핑 swap](https://github.com/edwardkim/rhwp/pull/587)
**작성자**: @planet6897 (Jaeook Ryu)
**처리 결정**: ✅ **cherry-pick 단일 commit `1cbf7c8` (충돌 0)**

## 1. 처리 결과 요약

| 항목 | 결과 |
|------|------|
| 결정 | cherry-pick 단일 commit |
| 사유 | (1) HWP 5.0 스펙 표 7 정합 (코드 24 = 하이픈 / 코드 30 = 묶음 빈칸) (2) 본 환경 자체 테스트 주석이 이미 정답을 가리키고 있음 (구현만 swap 되어 있던 상태) (3) 외부 참조 0건 |
| 충돌 | 0 (2 file 단순 swap) |
| 결정적 검증 | ✅ cargo test --lib 1129 (회귀 0) + parser::body_text 22 + svg_snapshot 6/6 + clippy 0 |
| 시각 회귀 검증 | ✅ PR 본문 quantitative 측정 100% 재현 (exam_eng 39 / kor 33 / science 18 / math 42 / social 2 모두 일치) |
| 시각 판정 | 권장 (메인테이너 직접 확인 — `>-</text>` 글리프 제거 정합 + 한컴 PDF 와 비교) |

## 2. PR 정보

| 항목 | 값 |
|------|-----|
| 분기점 | devel (정합) |
| commits | 1 (`1cbf7c8` "fix: 문자 컨트롤 0x18/0x1E 매핑 swap") |
| changedFiles | 2 (`body_text.rs` + `tags.rs`) |
| additions / deletions | +10 / -10 (대등 swap) |
| co-author | Claude Opus 4.7 (1M context) |
| Issue 연결 | 없음 (direct fix) |
| CI | All SUCCESS |

## 3. 본질 평가 — HWP 5.0 스펙 정합 swap

### 3.1 스펙 (HWP 5.0 표 7)

| 코드 | 의미 | 본 환경 (수정 전) | PR (수정 후) |
|------|------|------------------|--------------|
| 0x18 (24) | 하이픈 | `U+00A0` (nbsp) ❌ | `-` (hyphen) ✅ |
| 0x1E (30) | 묶음 빈칸 | `-` (hyphen) ❌ | `U+00A0` (nbsp) ✅ |

본 환경의 기존 매핑이 **스펙과 정반대로 swap 되어 있던 결함**.

### 3.2 자체 테스트 주석이 이미 정답을 가리킴

`src/parser/body_text/tests.rs:117,120`:

```rust
assert!(!is_extended_ctrl_char(0x0018)); // hyphen        ← L117
assert!(!is_extended_ctrl_char(0x001E)); // non-breaking space  ← L120
```

→ **테스트 주석은 정답을 가리키고, 구현 (`parse_para_text`) 만 swap 되어 있던 상태**. 컨트리뷰터 발견 정합.

### 3.3 외부 참조 0건

`grep CHAR_HYPHEN | CHAR_NBSPACE` 결과:
- `src/parser/tags.rs:129/131` (정의부만)
- 외부 사용처 0건

→ 상수 swap 만으로 정정 충분. 다른 모듈 영향 0.

### 3.4 변경 파일

- `src/parser/body_text.rs:328-348` — `parse_para_text` 의 0x18/0x1E text.push 영역 swap (주석 보강 — HWP 5.0 표 7 코드 번호 명시)
- `src/parser/tags.rs:128-131` — `CHAR_HYPHEN` (0x1E → 0x18) / `CHAR_NBSPACE` (0x18 → 0x1E) 상수 swap + 주석 보강

## 4. 결정적 검증 (모두 통과)

| 게이트 | 결과 |
|--------|------|
| `cargo test --lib --release` | ✅ 1129 passed (회귀 0, 직전 PR #563 와 동일) |
| `cargo test --lib --release parser::body_text` | ✅ 22 passed |
| `cargo test --release --test svg_snapshot` | ✅ 6/6 passed |
| `cargo clippy --lib --release -- -D warnings` | ✅ 0 warnings |
| CI (Build & Test + CodeQL js-ts/python/rust) | ✅ All SUCCESS |

## 5. 시각 회귀 검증 — PR 본문 측정 100% 재현 ★

### 5.1 컨트리뷰터 측정값 (PR 본문)

| 샘플 | 수정 전 | 수정 후 | 제거된 잘못된 '-' |
|-----|--------|--------|------------------|
| exam_eng | 366 | 39 | 327 |
| exam_kor | 444 | 33 | 411 |
| exam_science | 37 | 18 | 19 |
| exam_math | 42 | 42 | 0 |
| exam_social | 2 | 2 | 0 |

### 5.2 본 환경 재현 측정 (cherry-pick 후)

```bash
for f in exam_eng exam_kor exam_science exam_math exam_social; do
  rhwp export-svg samples/${f}.hwp -o /tmp/pr587_after_${f}
  grep -o ">-</text>" /tmp/pr587_after_${f}/*.svg | wc -l
done
```

| 샘플 | 본 환경 측정 | PR 본문 (수정 후) | 일치? |
|------|-------------|-------------------|-------|
| exam_eng | **39** | 39 | ✅ |
| exam_kor | **33** | 33 | ✅ |
| exam_science | **18** | 18 | ✅ |
| exam_math | **42** | 42 | ✅ |
| exam_social | **2** | 2 | ✅ |

→ **PR 본문 quantitative 측정 100% 재현**. 컨트리뷰터 측정 정합 확인.

### 5.3 결과 해석

- exam_eng / exam_kor / exam_science: 잘못된 하이픈 (실은 묶음 빈칸 0x1E) 가 **757개 제거** (327+411+19) — 본 환경 PDF 와 비교 시 정합 회복
- exam_math / exam_social: 0x1E 코드 미사용 문서라 변화 없음 (자연스러운 결과)
- 남은 `>-</text>` 글리프는 영어 단어 내 실제 하이픈, 표 구분자 등 **정상 케이스**

## 6. 시각 판정 권장 (메인테이너)

비록 quantitative 측정 100% 재현했지만, 메모리 `feedback_visual_regression_grows` + `reference_authoritative_hancom` 정합으로 메인테이너 직접 시각 점검 권장:

- exam_eng.hwp page 2 의 "1. 다음을 듣고..." 영역 (수정 전 "1.- 다음을 듣고...") — 한컴 PDF 와 비교
- exam_kor.hwp page 2 의 동일 영역
- 본 PR 의 변경이 **0x18/0x1E 의 코드 매핑** 단일 영역이라 회귀 위험은 본질적으로 0이지만, 시각 판정으로 한컴 정합 최종 확인

## 7. 컨트리뷰터 안내 (close 댓글)

- **차분한 사실 중심** + **본질 평가** (스펙 정합 + 자체 테스트 주석 일치 + 외부 참조 0)
- **quantitative 측정 100% 재현 확인**
- **시각 판정 결과** 안내 (메인테이너 시각 판정 후)
- 메모리 `feedback_pr_comment_tone` — @planet6897 은 활발한 반복 컨트리뷰터, 매번 같은 인사 부적절. 사실 중심 + 간결한 안내

## 8. 본 사이클 사후 처리

- [x] cherry-pick `1cbf7c8` 단일 commit (충돌 0)
- [x] 결정적 검증 (cargo test 1129 + parser::body_text 22 + svg_snapshot 6/6 + clippy 0)
- [x] 시각 회귀 quantitative 100% 재현
- [ ] 메인테이너 시각 판정 (선택 — quantitative 100% 재현으로 충분 가능)
- [ ] orders 갱신 (PR #587 항목)
- [ ] local/devel → devel merge + push
- [ ] PR #587 close + 차분한 안내 댓글
- [ ] 본 검토 문서 archives 보관
