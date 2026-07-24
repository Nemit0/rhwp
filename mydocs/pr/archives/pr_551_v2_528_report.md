# PR #551 Task #528 핀셋 cherry-pick 처리 보고서

**PR**: [#551 (closed)](https://github.com/edwardkim/rhwp/pull/551)
**작성자**: @planet6897 (Jaeuk Ryu)
**처리 결정**: ✅ **Task #528 cherry-pick 머지** (작업지시자의 임시 정정 → 본질 정정 교체)
**처리일**: 2026-05-03

## 1. 처리 결과 요약

| 항목 | 결과 |
|------|------|
| 결정 | Task #528 핀셋 cherry-pick (PR #551 의 Task #525 머지 후속) |
| cherry-pick 대상 | 8 commits + 1 fixup (UPDATE_GOLDEN 재생성) |
| 충돌 | 2 건 — golden SVG 2건 + orders 1건 (수동 해소) |
| 결정적 검증 | 모두 통과 |
| **exam_kor p17 PUA 잔존** | **0** (이전 임시 정정 시점 → 본질 정정 후 0) |
| 광범위 회귀 검증 | svg_snapshot 6/6 + cargo test --lib 1118 |
| 시각 판정 (작업지시자) | ✅ 통과 (옛한글 정상 매핑 확인) |
| WASM 빌드 | ✅ 4,543,430 bytes (+101,552 from PR #551 시점, 매핑표 + 폰트 subset 반영) |
| 후속 이슈 등록 | #555 (옛한글 PUA → 자모 변환 후 폰트 매트릭스 계산 갱신) |

## 2. cherry-pick 결과

### 2.1 적용된 commits (local/devel 기준)

| 신 commit | 원본 PR commit | 설명 |
|----------|--------------|------|
| `7eb14ea` | `ef33a7a` | Task #528 수행계획서 v1 |
| `2c70ec4` | `33351e1` | Task #528 구현계획서 v1 |
| `93a3e4e` | `532c9b3` | Task #528 Stage 1 본질 발견 + v2 |
| `07a79a5` | `c3f6a95` | Task #528 Stage 2 KTUG 매핑 + 변환 함수 |
| `44338f6` | `a15847c` | Task #528 Stage 3 PUA → 자모 변환 (composer + svg + web_canvas) |
| `(Stage 4)` | `e37acdc` | Task #528 Stage 4 Source Han Serif K subset (충돌 해소 후 통합) |
| `124266a` | `0687cfc` | Task #528 Stage 4 hotfix 한컴 책괄호 + 예시 마커 |
| `823beca` | `654a4ad` | Task #528 Stage 5 최종 보고서 |
| `442982c` | (fixup) | Task #528 fixup: golden SVG 본 환경 코드 기준 재생성 |

cherry-pick 의 default 동작으로 author = @planet6897 유지 (Stage 4 commit 의 충돌 해소만 메인테이너 commit).

### 2.2 변경 파일

| 파일 | 변경 |
|------|------|
| `src/renderer/pua_oldhangul.rs` (신규) | +5773 (KTUG Hanyang-PUA 매핑 표, 자동 생성) |
| `src/renderer/composer.rs` | +70 / -22 (`display_text` 필드 + `convert_pua_old_hangul` 함수) |
| `src/renderer/svg.rs` | +21 (`expand_pua_old_hangul` 헬퍼 + draw_text 적용) |
| `src/renderer/web_canvas.rs` | +19 (`expand_pua_old_hangul_canvas` 헬퍼 + draw_text 적용) |
| `src/renderer/mod.rs` | +16 (모듈 등록 + font-family 체인 보강) |
| `src/renderer/composer/tests.rs` | +12 / -12 (display_text: None 추가) |
| `src/renderer/layout/paragraph_layout.rs` | +13 (Stage 4 hotfix 책괄호 + 예시 마커) |
| `scripts/gen_pua_oldhangul_rs.py` (신규) | +156 (매핑 표 자동 생성) |
| `web/fonts/SourceHanSerifK-OldHangul-subset.woff2` (신규) | 234 KB (SIL OFL 1.1) |
| `web/fonts/SourceHanSerifK-OFL.txt` (신규) | +96 (라이선스) |
| `rhwp-studio/src/core/font-loader.ts` | +13 (폰트 로더) |
| `tests/golden_svg/*.svg` 5건 | UPDATE_GOLDEN 으로 본 환경 코드 기준 재생성 |
| mydocs (계획서 + Stage 1~5 보고서 + 자료원) | 1700+ 줄 |

## 3. 검증 결과

### 3.1 결정적 검증 (모두 통과)

| 게이트 | 결과 |
|--------|------|
| `cargo test --lib` | ✅ **1118 passed** (Task #525 시점 1113 +5, Task #528 합자 검증 등 신규) |
| `cargo test --test issue_546` | ✅ 1 passed (Task #546 양립) |
| `cargo test --test issue_530` | ✅ 1 passed (PR #531 회귀 0) |
| `cargo test --test issue_505` | ✅ 9/9 passed (PR #507 회귀 0) |
| `cargo test --test issue_418/501` | ✅ 회귀 0 |
| `cargo test --test svg_snapshot` | ✅ **6/6 passed** (UPDATE_GOLDEN 재생성 후) |
| `cargo clippy --lib -- -D warnings` | ✅ 0 건 |
| `cargo build --release` | ✅ Finished |

### 3.2 PUA 잔존 검증 (Task #528 의 본질 효과)

```
exam_kor_017.svg:
  PUA 잔존: 0
  고유 PUA: []
  Hangul Jamo: 102
```

→ **PUA 100% 변환** (이전 임시 정정 시점 영역 → 본질 정정 후 0). PR #551 의 Stage 5 보고와 정확히 일치.

### 3.3 WASM 빌드

| 산출물 | 크기 |
|--------|------|
| `pkg/rhwp_bg.wasm` | 4,543,430 bytes (PR #551 의 Task #525 cherry-pick 후 4,441,878 +101,552 — 매핑표 5773 LOC + 폰트 subset 반영) |
| `pkg/rhwp.js` | 변동 없음 |
| `rhwp-studio/public/rhwp_bg.wasm` | ✅ 동기화 |
| `rhwp-studio/public/rhwp.js` | ✅ 동기화 |

### 3.4 작업지시자 시각 판정

작업지시자 인용:
> 깨져보이던 옛한글이 정상적으로 매핑됩니다.

→ Task #528 의 본질 효과 (옛한글 PUA → 자모 변환) 시각 확인 완료.

**부수 발견 (별도 이슈)**:
> 다만 폰트 매트릭스 계산도 이에 따라 갱신되어야 겠네요. 이건 별도의 타스크로 등록해야 겠습니다.

→ [이슈 #555](https://github.com/edwardkim/rhwp/issues/555) 등록 — 옛한글 PUA → 자모 변환 후 폰트 매트릭스 (글자폭 / advance / 줄간격) 계산 갱신.

## 4. Task #528 의 본질

### 4.1 결함

`samples/exam_kor.hwp` p17 의 옛한글 (한컴 한양 PUA 인코딩, BMP PUA U+E0BC-F8F7) 이 폰트 글리프 누락으로 깨져 보임. 본 환경의 Task #509 (작업지시자 임시 정정, 12 매핑) 가 일부만 해결.

### 4.2 본질 (Stage 1 피벗)

v1 가설 (Hangul Jamo Extended-A/B 폰트 fallback) → Stage 1 측정으로 부정확 확인 → **HanCom Hanyang-PUA 인코딩** (BMP PUA U+E0BC-F8F7) 본질 확정 → Issue #512 흡수.

자료원: KTUG HanyangPuaTableProject (Public Domain, 5,660 매핑, 함초롬바탕 정합).

### 4.3 정정

- `pua_oldhangul.rs` (자동 생성 5,773 라인) — `map_pua_old_hangul` 함수
- Composer `display_text` 인프라 + svg.rs / web_canvas.rs `draw_text` 시점 변환 (Option A — 인덱싱 불변성 유지)
- Source Han Serif K (Adobe + Google, **SIL OFL 1.1**) Old Hangul subset (234 KB woff2, ccmp/ljmo/vjmo/tjmo OpenType feature)
- font-family 체인 보강 (`mod.rs::generic_fallback` 3 위치)
- Stage 4 hotfix: 책괄호 (U+F0854/F0855 → 《 》) + 예시 마커 (U+F00DA → ▸) 매핑 추가

### 4.4 본 환경 Task #509 정정의 통합

본 환경에 이미 적용된 Task #509 (작업지시자 본인 commit `5b6d5be`) 의 12 매핑이 Task #528 의 5660 매핑 superset 에 자연 흡수. cherry-pick 시 `paragraph_layout.rs::map_pua_bullet_char` 자동 해소 (auto-merge 정합).

## 5. 후속 이슈 — #555 (폰트 매트릭스 계산)

본 cherry-pick 의 Stage 3 (Option A) 가 **인덱싱 불변성 유지** 의 trade-off 로 **폰트 매트릭스 (글자폭 / advance / 줄간격) 계산은 PUA char 1글자 기준 유지**. 자모 시퀀스 (3-4 char) 와 정합 안 됨.

가능한 영향:
1. Square wrap / 줄바꿈 위치
2. 줄간격
3. TAC / 인라인 그림과의 정합

[이슈 #555](https://github.com/edwardkim/rhwp/issues/555) 로 별도 등록. 정정 옵션 A/B/C (Stage 1 진단 후 결정):
- A: `display_text` 기반 매트릭스 계산 (인덱싱 분리)
- B: IR 단계에서 변환 (광범위 영향 가능성)
- C: Option A 보강 (글자폭만 별도 계산)

## 6. 머지 절차

### 6.1 cherry-pick + 충돌 해소 (완료)

```bash
git stash push -u -m "PR #528 review docs" mydocs/pr/pr_551_review_v2_528.md
git cherry-pick ef33a7a 33351e1 532c9b3 c3f6a95 a15847c
git cherry-pick e37acdc  # golden SVG 2건 충돌
git checkout --theirs tests/golden_svg/issue-147/aift-page3.svg tests/golden_svg/issue-157/page-1.svg
git add ...
git cherry-pick --continue
git cherry-pick 0687cfc 654a4ad  # orders 충돌 → 양쪽 보존
# UPDATE_GOLDEN 으로 golden 재생성
UPDATE_GOLDEN=1 cargo test --test svg_snapshot
git add tests/golden_svg/*
git commit -m "Task #528 fixup: golden SVG 본 환경 코드 기준 재생성"
git stash pop
```

### 6.2 검증 + WASM 빌드 (완료)

(위 §3 결과)

### 6.3 commit + 머지 + push

```bash
git add mydocs/pr/pr_551_review_v2_528.md mydocs/pr/pr_551_v2_528_report.md
git commit -m "PR #551 Task #528 핀셋 처리 보고서 + 검토 문서 (cherry-pick @planet6897 8 commits)"

git checkout devel
git merge local/devel --no-ff -m "..."
git push origin devel
```

## 7. 사후 처리

- [ ] 이슈 #528 close (정정 적용으로)
- [ ] 이슈 #512 close (PR #551 보고: "#512 흡수")
- [ ] 이슈 #555 (폰트 매트릭스 갱신) — open 유지, 별도 task 로 진행
- [ ] README 기여자 목록 (@planet6897 PR #551 누적: Task #525 + Task #528, 본 사이클 일괄)
- [ ] 폰트 라이선스 명시 — 이미 PR #551 에 포함 (`mydocs/tech/font_fallback_strategy.md` 의 옛한글 fallback 섹션)

## 8. 메모리 정합

- ✅ `feedback_check_open_prs_first` — 본 PR 처리 정합
- ✅ `feedback_pr_comment_tone` — close 댓글 차분/사실 중심
- ✅ `feedback_release_sync_check` — cherry-pick 시점 main 동기화 점검 (`0fb3e675` 정합)
- ✅ `feedback_v076_regression_origin` — 작업지시자 직접 시각 판정 통과
- ✅ `feedback_visual_regression_grows` — 광범위 회귀 검증 + 시각 판정 게이트
- ✅ `feedback_pdf_not_authoritative` / `reference_authoritative_hancom` — 한컴 2010/2020 직접 비교 (작업지시자 시각 판정 통과)
- ✅ `feedback_image_renderer_paths_separate` — Task #528 의 변환은 svg.rs / web_canvas.rs / paragraph_layout.rs 3 영역 적용 — 메모리 정합 사례
- ✅ `feedback_hancom_compat_specific_over_general` — case-specific 정정 (PUA → 자모, 폰트 자료 영역)

## 9. 결론

본 cherry-pick 으로 옛한글 PUA 처리의 **임시 정정 → 본질 정정** 교체 완료. 작업지시자의 Task #509 정정은 본 환경에 잔존하면서 자연 흡수, Task #528 의 5660 매핑 + Source Han Serif K subset 으로 강화. exam_kor p17 PUA 잔존 0 + 시각 판정 통과로 결정적 효과 확인.

후속 결함 (폰트 매트릭스 계산 갱신) 은 [이슈 #555](https://github.com/edwardkim/rhwp/issues/555) 로 별도 분리 — 인덱싱 불변성과 매트릭스 정합성의 trade-off 영역으로 별도 진단 + 정정 정책 결정 필요.
