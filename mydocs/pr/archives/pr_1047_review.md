# PR #1047 검토 — fix: CharShape start_pos 를 UTF-16 stream offset 으로 해석 (closes #915)

- PR: [#1047](https://github.com/edwardkim/rhwp/pull/1047)
- 작성자: @HaimLee-4869 (Lee eunjung, 5번째 기여 — PR #1020/#1021/#1026 시리즈 후속)
- closes #915 (M100, v1.0.0, 메인테이너 작성 이슈)
- base: devel (PR base = `ac6aeed4` = PR #1034 머지 후, 현재 origin/devel = `c40a6a27` = PR #1026 머지 후)
- head: pr/915-charshape-relative-offset (단일 squash `7b2ba7ee`)
- mergeable: MERGEABLE, CI 전체 통과 (Build & Test / CodeQL / Render Diff)
- 변경 규모: +291/-198, 7 파일 (1 코드 + 4 golden + 2 tests)
- 일시: 2026-05-21

## 1. 컨트리뷰터 사이클 + 시리즈 위치 (`feedback_contributor_cycle_check`)

@HaimLee-4869 5 PR 누적:
- PR #1020 (closes #727) — PUA 사각 안 숫자 (머지)
- PR #1021 (Refs #874) — 단일-run RIGHT + leader (머지)
- PR #1026 (1차 보류 → 재제출 머지) — 좁은 구두점 폭 + native/WASM 동기화 (5/21 머지)
- **PR #1047 (본 PR)** — CharShape start_pos 해석 통일

## 2. ⚠️ 핵심 검토 — PR #913 (closes #884) **명시적 revert** 검토

### 2.1 이력

| commit | 작성자 | 내용 | 결과 |
|--------|--------|------|------|
| `9f81351a` (PR #913, closes #884) | @planet6897 (Jaeook Ryu) | CharShape start_pos 를 **visible char index** 로 해석 (해석 B) | **머지** — 작업지시자 시각 판정 ★ 통과 명시 |
| `7b2ba7ee` (PR #1047, closes #915) | @HaimLee-4869 (Lee eunjung) | start_pos 를 **UTF-16 stream offset** 으로 해석 (해석 A) — PR #913 revert | **본 PR 검토 중** |

### 2.2 PR #913 (해석 B, visible char index) 의 근거

PR #913 의 commit 메시지:
- `table-in-tbox.hwp` 글상자 안 표 셀 r=0,c=0 paragraph " 충남중부권지사장" 의 char_shape: (start_pos=0, id=14 HY헤드라인M 26pt), (start_pos=9, id=20 HY수평선B 16pt)
- 해석 A 결과: id=20 (HY수평선B) 가 visible[1]("충") 부터 적용
- 해석 B 결과: start_pos=9 가 text 길이 9 보다 ≥ 이므로 미적용 → 전체 id=14 (HY헤드라인M 26pt)
- "한컴 PDF 정합 정답" 명시 + 작업지시자 시각 판정 ★ 통과

### 2.3 PR #1047 (해석 A, stream offset) 의 근거 — 한컴 2024 글자모양 패널 실측

PR #1047 본문 명시 4 케이스:

| 위치 | 한컴 패널 실측 | 해석 A (본 PR) | 해석 B (PR #913) |
|------|----------------|----------------|------------------|
| table-in-tbox p1 footer "충남중부권지사장" | **HY수평선B 16pt** | HY수평선B 16pt ✅ | 26pt ❌ |
| table-in-tbox p2 "충남중부권지사" | 정상 크기 | 정상 ✅ | **휴먼명조 1pt ❌** (#915) |
| KTX 목차 "Ⅰ" | 휴먼명조 16pt | 휴먼명조 16pt ✅ | 18.7pt ❌ |
| KTX 목차 "사업 개요" | HY헤드라인M 15pt | HY헤드라인M 15pt ✅ | 18.7pt ❌ |

### 2.4 핵심 분석 — PR #913 의 오진

본 PR (해석 A) 가 진실로 보이는 결정적 증거:
1. **한컴 2024 글자모양 패널 직접 측정** (PR #913 의 "PDF 정합" 보다 권위 — `reference_authoritative_hancom`)
2. **path 일관성**: `paragraph_layout.rs` / `line_breaking.rs` 가 줄곧 해석 A 사용 → PR #913 이 composer 만 해석 B 로 바꿔서 **composer ↔ layout 불일치 상태**였음
3. **#915 결함**: 인라인 제어자가 문단 중간에 있는 문단에서 start_pos 가 char_offsets gap 만큼 부풀려져 char_shape 통째 누락 (table-in-tbox p2 "충남중부권지사" 1.33px)
4. **PR #913 의 추정 오류**: footer "충남중부권지사장" 의 "26pt" 판정이 오진 (HY수평선B 굵은 글꼴 + 로고 옆 배치 육안 착시) — 한컴 패널 실측은 16pt

`feedback_visual_judgment_authority` 모범 사례 — PR #913 의 "시각 판정 ★ 통과" 도 정량적 한컴 패널 실측으로 정정 가능. 시각 판정 ≠ 절대 권위, 측정 도구 우위.

### 2.5 본 환경 dry-run 검증 (회귀 가드 4 + svg_snapshot)

| 테스트 | 결과 |
|--------|------|
| `cargo test --test issue_884_charshape_diagnostic` | **2/2 passed** (단언 반전: footer "충" 이 HY수평선B 로 검증) |
| `cargo test --test issue_915_charshape_cell_font_size` | **1/1 passed** (한글 음절 < 5px 부재 단언) |
| `cargo test --test issue_874_ktx_toc_page_number_right_align` | **1/1 passed** (PR #1026 KTX 가드 보존) |
| `cargo test --test svg_snapshot` | **8/8 passed** (issue-157/267/617/677 golden 모두 갱신, table_text/form_002/aift 보존) |
| `cargo test --release --lib` | **1319 passed** |
| `cargo test --release --tests` | 모든 통합 passed (0 FAILED) |
| `cargo fmt --all --check` | clean |

### 2.6 본 환경 sweep 결과 (광범위 변경)

| fixture | 페이지 수 | diff | 비고 |
|---------|----------|------|------|
| table-in-tbox.hwp | 2 → 2 | 2 | **본 PR 본질** (page 1 footer + page 2 "충남중부권지사" 1.33px → 16px 정합) |
| KTX.hwp | 27 → 27 | 3 | KTX 목차 "Ⅰ" / "사업 개요" 등 |
| hwp3-sample16.hwp | 64 → 64 | 3 | CharShape 해석 정합 |
| hwp3-sample16-hwp5.hwp | 64 → 64 | 2 | 동일 |
| exam_kor.hwp | 20 → 20 | 19 | golden issue-617 영역 + 광범위 |
| exam_math.hwp | 20 → 20 | 20 | 광범위 |
| aift.hwp | 74 → 74 | 4 | |
| biz_plan.hwp | 6 → 6 | 0 | 무영향 |

**총 53 diff = 광범위** — PR #884 가 영향을 미친 모든 fixture 에서 stream offset 해석으로 정정. 페이지 수 회귀 부재.

table-in-tbox.hwp p2 의 정량 입증:
- BEFORE: `font-size="1.3333..."` (한글 음절, #915 결함)
- AFTER: `font-size="16"` (정상)

## 3. 코드 품질 평가

### 3.1 강점

- **본질적 정합 복원**: 4 경로 (composer / paragraph_layout / line_breaking + find_active_char_shape) 의 start_pos 해석을 단일화 (stream offset)
- **한컴 패널 실측 4 케이스**: PR #913 의 "PDF 정합" 보다 권위 있는 측정 (`reference_authoritative_hancom`)
- **회귀 가드 영구화**: issue_884 단언 갱신 (반전, 한컴 실측 기반) + issue_915 신규 (한글 음절 5px 휴리스틱)
- **하나의 단일 책임**: `split_by_char_shapes` 의 lookup 만 변경 (`char_offsets.iter().position(|&off| off >= cs.start_pos)`)
- **fallback 정합**: `find_active_char_shape_visible` → `find_active_char_shape` (line_stream_start 사용)
- **CI 전체 통과** + PR base 최신 (5/21 머지된 PR #1026 이전이지만 충돌 없이 cherry-pick)

### 3.2 우려

- **PR #913 revert 의 회귀 위험**: PR #913 이 작업지시자 시각 판정 ★ 통과로 머지된 변경 → 본 PR 이 다시 revert. PR #913 의 "PDF 정합" 검증이 잘못된 분석이었는지 작업지시자 재검증 필요
- **광범위 golden 갱신** (4 골든, 146 lines): issue-157 (1 line, narrow punct PR #1026 후속) + issue-267 KTX (19 lines) + issue-617 exam_kor (115 lines) + issue-677 bokhakwonseo (11 lines). KTX golden 변경이 PR #1021 KTX 회귀 가드 (issue_874) 와 양립 ✅ 확인
- **CI 미실행 영역**: cargo clippy --release --all-targets 미실행 (lib 만 통과)

## 4. 옵션 권고

| 옵션 | 설명 | 위험 | 권고 |
|------|------|------|------|
| **A. cherry-pick + sweep + 작업지시자 시각 판정** | dry-run 검증 완료 (4 회귀 가드 + 1319 lib + 8/8 svg_snapshot). 작업지시자가 한컴 2024 패널 실측 4 케이스 재확인 (또는 시각 판정 권위 위임) → 머지 | **중간** — PR #913 revert 이므로 작업지시자 권위 재확인 필수. 회귀 가드 + 정량 입증 모두 통과 | **권고 (조건부)** — 작업지시자가 PR #913 의 ★ 통과 판정을 재고하는 권위 결정 필요 |
| B. 보류 + PR #913 재검토 | PR #913 의 "PDF 정합" 시각 판정 재검증 후 결정 | 매우 낮음 — 충분한 검토 | 작업지시자 판단 |
| C. 수정 요청 추가 | 골든 4개 시각 판정 추가 (KTX/exam_kor/bokhakwonseo) | 매우 낮음 | 비권고 — 자기 검증 + 한컴 실측 충분 |

## 5. 메모리 룰 정합

- ✅ `feedback_self_verification_not_hancom` — 본 환경 정량 입증 + 작업지시자 한컴 권위 필수
- ✅ `feedback_visual_judgment_authority` — PR #913 의 ★ 시각 판정도 한컴 패널 실측 권위로 정정 가능 (모범 사례 — 측정 우위)
- ✅ `reference_authoritative_hancom` — 한컴 2024 글자모양 패널이 1차 권위 (작업지시자 환경: Windows 한컴 편집기)
- ✅ `feedback_v076_regression_origin` — PR #913 의 단일 fixture (table-in-tbox p1 footer) 정합 ≠ 다른 fixture (table-in-tbox p2 / KTX / exam_kor) 회귀
- ✅ `feedback_pr_supersede_chain` — PR #913 (잘못된 정합) → PR #1047 (실측 권위 정정) 의 supersede 패턴
- ✅ `feedback_diagnosis_layer_attribution` — composer ↔ paragraph_layout/line_breaking 의 path 불일치 정확 식별
- ✅ `feedback_push_full_test_required` — cargo test --tests + 회귀 가드 4 + svg_snapshot 8 + fmt clean

## 6. 작업지시자 결정 요청

| 결정 | 옵션 |
|------|------|
| 진행 여부 | A (cherry-pick + 시각 판정) / B (보류 + PR #913 재검토) / C (수정 요청) |
| PR #913 ★ 통과 재고 | 본 PR 한컴 패널 실측 4 케이스 권위 인정 / PR #913 시각 판정 재확인 후 결정 |
| 시각 판정 범위 | table-in-tbox p1+p2 + KTX 목차 + exam_kor + bokhakwonseo 4 fixture 한컴 정합 |
