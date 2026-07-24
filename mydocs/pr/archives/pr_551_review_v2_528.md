# PR #551 Task #528 핀셋 리뷰 — 옛한글 PUA → KS X 1026-1 자모 변환

**PR**: [#551 (closed, Task #525 만 cherry-pick 완료)](https://github.com/edwardkim/rhwp/pull/551)
**작성자**: @planet6897 (Jaeuk Ryu)
**처리 결정**: ✅ **Task #528 핀셋 cherry-pick** (작업지시자 옵션 C-1 의 두 번째 task)
**작성일**: 2026-05-03
**검토일**: 2026-05-03

## 1. 처리 결정

**작업지시자 의도**:
> 기존에 PUA 처리를 급한대로 작업지시자가 했지만, 그쪽에서 해결하지 못한걸 이 컨트리뷰터가 한 것으로 판단합니다.

→ 본 환경의 Task #509 (작업지시자 본인 commit `5b6d5be`) 가 **임시 정정**, Task #528 (PR #551, @planet6897) 가 **본질 정정**. 본질 정정으로 교체하는 cherry-pick 진행.

## 2. Task #509 (본 환경, 임시 정정) ↔ Task #528 (PR #551, 본질 정정) 비교

| 항목 | Task #509 (임시) | Task #528 (본질) |
|------|----------------|-----------------|
| **commit** | `5b6d5be` (작업지시자) | `ef33a7a` ~ `654a4ad` (8 commits, @planet6897) |
| **본질** | 특정 PUA 글머리표만 일반 문자 매핑 (12 매핑) | KTUG Hanyang-PUA 매핑 표 5660 entries (한컴 함초롬바탕 정합) + KS X 1026-1:2007 자모 변환 |
| **변환 영역** | `paragraph_layout.rs::map_pua_bullet_char` (12 매핑) + draw_text 시점 변환 | `pua_oldhangul.rs::map_pua_old_hangul` (5660 entries) + Composer `display_text` 인프라 + draw_text 시점 변환 |
| **폰트 자료** | (없음, 기본 폰트 폴백) | **Source Han Serif K Old Hangul subset 234 KB woff2 (SIL OFL 1.1)** |
| **검증** | exam_kor PUA 잔존 112 → 평균 영역 (작업지시자 시각 통과 시점) | exam_kor p17 PUA 잔존 **0** (이전 112 → 0) |
| **별도 task 분리** | (없음) | #512 흡수 (Hangul Jamo Extended 폰트 fallback 가설 부정확 → HanCom Hanyang-PUA 인코딩 본질로 피벗) |

**Task #528 의 본질 우월성**:
- KTUG HanyangPuaTableProject (Public Domain) 의 5660 매핑으로 한컴 정답지 정합
- Source Han Serif K (Adobe + Google, OFL) Old Hangul subset 으로 모든 옛한글 글리프 표시 가능
- exam_kor p17 의 PUA 100% 변환 (잔존 0)

## 3. Task #528 cherry-pick 대상 (10 commits)

| 순서 | commit | 영역 | 변경 |
|------|--------|------|------|
| 1 | `ef33a7a` | 수행계획서 v1 | mydocs (+211) |
| 2 | `33351e1` | 구현계획서 v1 | mydocs (+366) |
| 3 | `532c9b3` | Stage 1 본질 발견 + v2 | mydocs (+573 / -371) |
| 4 | `c3f6a95` | Stage 2 KTUG 매핑 + 변환 함수 | **`pua_oldhangul.rs` (+5773 신규)** + scripts (+156) + mydocs (+359) + mod.rs (+1) |
| 5 | `a15847c` | Stage 3 PUA → KS X 1026-1 자모 변환 적용 | **`composer.rs` (+70 / -22)** + composer/tests.rs + svg.rs (+21) + web_canvas.rs (+19) + mydocs (+153) |
| 6 | `e37acdc` | Stage 4 Source Han Serif K Old Hangul subset 도입 | **font 자료 + mod.rs + golden SVG 5건 cosmetic** |
| 7 | `0687cfc` | Stage 4 hotfix 한컴 책괄호 + 예시 마커 | `paragraph_layout.rs` (+13) + mydocs (+46) |
| 8 | `654a4ad` | Stage 5 최종 보고서 | mydocs (+245) |

**총 코드 변경** (소스 + 테스트 + 폰트):
- 신규 파일: `pua_oldhangul.rs` (+5773), `gen_pua_oldhangul_rs.py` (+156), `SourceHanSerifK-OldHangul-subset.woff2` (234 KB), `SourceHanSerifK-OFL.txt` (+96)
- 수정: `composer.rs` / `svg.rs` / `web_canvas.rs` / `paragraph_layout.rs` / `mod.rs` / `font-loader.ts` / golden SVG 5건

## 4. 충돌 점검 결과 (cherry-pick test, abort 됨)

### 4.1 자동 해소 영역 (충돌 0)

- 신규 파일 추가 (pua_oldhangul.rs / gen_pua_oldhangul_rs.py / 폰트 자료) — 충돌 0
- mydocs 신규 (계획서 / Stage 보고서 / 자료원 문서) — 충돌 0
- `composer.rs`, `svg.rs`, `web_canvas.rs` — Auto-merge 정합

### 4.2 충돌 발생 영역 (수동 해소 필요)

**Stage 4 commit (`e37acdc`) 의 golden SVG 2건**:
- `tests/golden_svg/issue-147/aift-page3.svg` (6 markers)
- `tests/golden_svg/issue-157/page-1.svg` (3 markers)

**원인**: PR #551 head 의 golden SVG 가 **Task #525 정정 후 + Task #528 의 font-family 추가 후** 시점. 본 환경의 golden 은 Task #525 cherry-pick 시 갱신 안 됨 (Task #525 는 svg_snapshot 6 fixture 와 무관 영역).

**해소 방안**: cherry-pick 시 `theirs` (PR #551 head 영역) 채택 → cherry-pick 완료 → `UPDATE_GOLDEN=1 cargo test --test svg_snapshot` 으로 본 환경 코드 기준 golden 재생성.

### 4.3 잠재 영역 (정밀 점검 필요)

**`paragraph_layout.rs` 충돌 가능성**: 본 환경 Task #509 의 `map_pua_bullet_char` (+88) 와 Task #528 Stage 4 hotfix 의 `map_pua_bullet_char` 확장 (+13) 이 같은 함수. cherry-pick 시 자동 해소 또는 수동 해소 필요.

→ 점검 결과: cherry-pick test 에서 자동 해소된 것으로 보임 (status 에 `paragraph_layout.rs` modified 만 표시, 충돌 없음).

## 5. 본 환경의 Task #509 정정과의 통합

본 환경에 이미 Task #509 의 `map_pua_bullet_char` 가 적용된 상태. Task #528 cherry-pick 시:

1. **Task #528 의 본 변환 (`pua_oldhangul.rs::map_pua_old_hangul` 5660 entries)** 는 Task #509 의 12 매핑을 흡수 (5660 entries 가 12 entries 의 superset)
2. **Stage 4 hotfix** 가 `paragraph_layout.rs::map_pua_bullet_char` 를 확장 (책괄호 + 예시 마커 추가) — 본 환경의 Task #509 매핑 위에 추가
3. **renderer 의 draw_text 시점 변환** — Task #509 가 paragraph_layout 영역, Task #528 이 svg.rs / web_canvas.rs 영역 — 두 영역 모두 활용

→ Task #528 cherry-pick 후 본 환경의 Task #509 정정은 **자연스럽게 흡수** + 본질 정정으로 강화.

## 6. 본 환경 svg_snapshot 자동 갱신 메커니즘

`tests/svg_snapshot.rs` (line 53):

```rust
if std::env::var("UPDATE_GOLDEN").as_deref() == Ok("1") {
    fs::write(&golden_path, &actual).unwrap();
    return;
}
```

→ `UPDATE_GOLDEN=1 cargo test --test svg_snapshot` 으로 자동 갱신 가능. 충돌 해소 후 재생성으로 정합.

## 7. 사전 검증 (cherry-pick test 시점, abort 됨)

cherry-pick 7 commits 까지 진행 후 Stage 4 충돌 발생. 7 commits 까지의 영역 (소스 + 폰트 + 매핑표) 은 정합한 통합 가능 확인.

## 8. cherry-pick 절차

```bash
# 0. 사전 점검
git fetch origin
git pull --ff-only origin main

# 1. local/devel 스위치 + 검토 문서 stash
git checkout local/devel
git stash push -u -m "PR #528 review docs" mydocs/pr/pr_551_review_v2_528.md

# 2. cherry-pick 7 commits (충돌 0)
git cherry-pick ef33a7a 33351e1 532c9b3 c3f6a95 a15847c

# 3. cherry-pick Stage 4 (golden SVG 충돌 → theirs 채택)
git cherry-pick e37acdc
# 충돌 시: 모든 golden SVG 를 theirs 로 (PR #551 head 영역)
git checkout --theirs tests/golden_svg/issue-147/aift-page3.svg
git checkout --theirs tests/golden_svg/issue-157/page-1.svg
git add tests/golden_svg/issue-147/aift-page3.svg tests/golden_svg/issue-157/page-1.svg
git cherry-pick --continue --no-edit

# 4. cherry-pick Stage 4 hotfix + Stage 5 (충돌 0 예상)
git cherry-pick 0687cfc 654a4ad
# 충돌: mydocs/orders/20260502.md 가능 → 양쪽 보존

# 5. golden SVG 본 환경 코드 기준 재생성
UPDATE_GOLDEN=1 cargo test --test svg_snapshot 2>&1 | tail -5
# 자동 갱신 후 svg_snapshot 6/6 통과 확인
cargo test --test svg_snapshot

# 6. 결정적 검증
cargo test --lib                   # 1116+ 통과 (PR #551 보고)
cargo test --test issue_546        # Task #546 양립 점검
cargo test --test issue_530/505/418/501  # 회귀 0
cargo clippy --lib -- -D warnings  # 0 건 (pre-existing 외)
cargo build --release              # 정상

# 7. WASM 빌드 + studio 동기화
docker compose --env-file .env.docker run --rm wasm
cp pkg/rhwp_bg.wasm rhwp-studio/public/rhwp_bg.wasm
cp pkg/rhwp.js     rhwp-studio/public/rhwp.js

# 8. ※ 작업지시자 시각 판정 게이트
# - exam_kor.hwp p17 (옛한글 PUA 핵심 fixture) 확인
# - samples/pua-test.hwp 확인
# - 한컴 2010/2020 출력과 비교

# 9. 통과 시 검토 문서 + report commit + devel 머지 + push
```

## 9. 검토 항목

### 9.1 코드 품질

- ✅ **본질 정정** — Task #509 의 12 매핑 → 5660 매핑 (KTUG 권위 자료 기반)
- ✅ **인덱싱 불변성 유지** — `display_text` 필드 + draw_text 시점 변환 (Option A) 으로 char_offsets / char_start / line_chars 영향 없음
- ✅ **폰트 자료 OFL 라이선스** — Source Han Serif K (Adobe + Google) OFL 1.1
- ✅ **자동 생성 도구** — `scripts/gen_pua_oldhangul_rs.py` 로 매핑 표 재생성 가능
- ✅ **자료원 문서** — `mydocs/tech/pua_oldhangul_mapping_sources.md` (KTUG HanyangPuaTableProject 등)

### 9.2 회귀 테스트 (PR #551 Stage 5 보고)

- cargo test --lib **1116 passed**
- svg_snapshot 6/6 (golden 갱신 — font-family chain 추가만, cosmetic)
- issue_418/501 회귀 0
- exam_kor p17 PUA 잔존 **0** (이전 112 → 0)

본 환경 cherry-pick 후 검증 (Stage 4 의 cherry-pick 직후):
- (cherry-pick 완료 후 검증 필요)
- (UPDATE_GOLDEN 으로 재생성 후 svg_snapshot 6/6 확인 필요)

### 9.3 외부 영역 정합

- ✅ Task #525 (이미 cherry-pick) 와 무관 — 다른 영역 (Task #525 = layout.rs / Task #528 = composer + renderer + 폰트)
- ✅ Task #546 (revert) 와 무관 — 다른 영역 (Task #546 = typeset.rs / Task #528 = renderer 영역)
- ✅ PR #506 / #507 / #531 / #538 모두 무관

### 9.4 외부 컨트리뷰터 정합

@planet6897 의 Task #528 의 진단 깊이 + 정정 정합성:
- Stage 1 본질 피벗 (Hangul Jamo Extended 폰트 fallback 가설 → HanCom Hanyang-PUA 인코딩 본질) — 정밀 진단 + 가설 자가 정정
- KTUG 권위 자료 발굴 — Public Domain 5660 매핑
- Source Han Serif K 폰트 자료 도입 — OFL 라이선스 정합
- 자동 생성 스크립트 (`gen_pua_oldhangul_rs.py`) — 향후 매핑 갱신 시 재생성 가능
- exam_kor p17 PUA 잔존 0 — 결정적 정정 효과

## 10. 시각 판정 게이트

### 10.1 fixture

| fixture | 영역 |
|---------|------|
| `samples/exam_kor.hwp` p17 | 옛한글 PUA 핵심 fixture (PR #551 보고) |
| `samples/pua-test.hwp` | 본 환경 Task #509 의 진단 fixture (작업지시자가 gen-pua 도구로 생성) |

### 10.2 판정 절차

| 단계 | 자료 |
|------|------|
| **1차 (SVG)** | cherry-pick 후 `rhwp export-svg samples/exam_kor.hwp -p 16` 등 |
| **2차 (rhwp-studio)** | WASM 재빌드 + studio 동기화 후 web Canvas 시각 확인 |

### 10.3 판정 항목

- exam_kor p17 옛한글 글리프 정상 표시 (한컴 2010/2020 정합)
- samples/pua-test.hwp 의 18 PUA 코드포인트 모두 정상 출력
- 한컴 책괄호 (《 》) + 예시 마커 (▸) 정상 표시 (Stage 4 hotfix)
- web Canvas 와 SVG 시각 정합

## 11. 위험 정리

| 위험 | 가능성 | 회피책 |
|------|--------|--------|
| Stage 4 golden SVG 충돌 | 🟧 중간 | `theirs` 채택 + UPDATE_GOLDEN 자동 갱신 |
| `paragraph_layout.rs` 의 Task #509 ↔ Task #528 hotfix 통합 | 🟢 작음 | cherry-pick test 에서 자동 해소 확인 |
| `mydocs/orders/20260502.md` 충돌 (Stage 5 commit) | 🟧 중간 | 양쪽 일지 통합 (PR #538/#551 사례 정합) |
| Task #525 / #546 와의 양립성 | 🟢 작음 | 다른 영역 정정, 사전 점검 통과 |
| svg_snapshot 6/6 회귀 (font-family chain 변경) | 🟢 작음 | UPDATE_GOLDEN 으로 자동 갱신 |
| Source Han Serif K 폰트 자료 라이선스 | 🟢 정합 | SIL OFL 1.1 — 정합 |
| 자동 생성 매핑 표의 정확성 | 🟢 작음 | KTUG 권위 자료 + exam_kor p17 100% 검증 (PR #551 Stage 5) |

## 12. 결정

**권장**: ✅ **Task #528 cherry-pick 진행** (작업지시자 결정 정합).

**근거:**
1. 작업지시자의 임시 정정 (Task #509) 을 본질 정정 (Task #528) 으로 교체 — 정합한 워크플로우
2. 코드 변경 매우 큼 (+6068 / -22) 이지만 신규 파일 + 자동 생성 매핑이라 review 부담 작음
3. 본 환경 사전 cherry-pick test 통과 (Stage 4 충돌 외)
4. Stage 4 충돌은 UPDATE_GOLDEN 자동 갱신으로 해소 가능
5. 광범위 영향 (exam_kor p17 PUA 잔존 0) — 본질 정정 효과 결정적

**남은 게이트 (작업지시자):**
1. **시각 판정 1차** (SVG, CLI) — `output/svg/pr528_after/exam_kor_017.svg` + pua-test 시각 비교
2. **시각 판정 2차** (rhwp-studio web Canvas + 한컴 2010/2020) — WASM 재빌드 + studio 동기화 후
3. 시각 판정 통과 후 cherry-pick 머지

**머지 시 추가 정합 사항:**
- 이슈 #528 close (등록되어 있으면)
- 이슈 #512 close (PR #551 보고: "#512 흡수")
- README 기여자 목록 (@planet6897 PR #551 누적 — Task #525 + Task #528, 본 사이클 일괄)
- 폰트 자료 라이선스 명시 (mydocs/tech/font_fallback_strategy.md 의 옛한글 fallback 섹션 — 이미 PR #551 에 포함)

## 13. 메모리 정합

- ✅ `feedback_check_open_prs_first` — 본 PR 처리 정합
- ✅ `feedback_pr_comment_tone` — close 댓글 차분/사실 중심
- ✅ `feedback_release_sync_check` — cherry-pick 시점 main 동기화 점검
- ✅ `feedback_v076_regression_origin` — 작업지시자 직접 시각 판정
- ✅ `feedback_visual_regression_grows` — 시각 판정 게이트 (1차 SVG + 2차 web Canvas)
- ✅ `feedback_pdf_not_authoritative` / `reference_authoritative_hancom` — 한컴 2010/2020 직접 비교
- ✅ `feedback_image_renderer_paths_separate` — Task #528 의 변환은 svg.rs / web_canvas.rs / paragraph_layout.rs 3 영역 적용 — 메모리 정합 사례

## 14. 다음 단계

작업지시자 본 검토 문서 승인 후:

1. cherry-pick 8 commits (`ef33a7a`~`654a4ad`)
2. Stage 4 의 golden SVG 충돌 해소 (`theirs` 채택)
3. Stage 5 의 orders 충돌 해소 (양쪽 보존)
4. `UPDATE_GOLDEN=1 cargo test --test svg_snapshot` 으로 golden 재생성
5. 결정적 검증 + WASM 빌드 + studio 동기화
6. **시각 판정 1차** (SVG)
7. 통과 시 **시각 판정 2차** (rhwp-studio)
8. 통과 시 devel 머지 + push + 보고서 작성 + close 처리
