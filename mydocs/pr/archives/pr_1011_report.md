# PR #1011 처리 보고서 — Task #1006: 쪽 테두리 포맷별 분리 + cover logo overlap 해소

- 처리일: 2026-05-20
- 컨트리뷰터: [@jangster77](https://github.com/jangster77) (Taesup Jang)
- 결정: **옵션 A (수용)** — 작업지시자 승인 + 시각 판정 통과
- 머지: (no-ff, local/devel → devel)
- closes #1006

## 1. 결정 사유 — paper_based outline 회귀 사이클 종결

@jangster77 24+ 사이클. **task877 → #920 → #956 → #987 → #1005 → #1006(본 PR) 사이클 종결**. 단일 `attr & 0x01` 비트 해석 모호성을 `PageBorderBasis` enum + parser 단계 명시 주입으로 책임 분리. 작업지시자 Hancom Office close-up 시각 판정 기반으로 #987 의 body-based 재판정을 오판단으로 정정. header clip 제거(cover logo 정합) + footer clip 유지(페이지 번호 외곽선 바깥) selective 정책.

## 2. 처리 내역 (단일 본질 커밋, 작성자 Taesup Jang)

| 커밋 (cherry-pick 후) | 내용 |
|------|------|
| `aa8160c2` | Task #1006 종합 fix (12파일 +451/-40, fixture test-image.hwp/.hwpx 포함) |

- **충돌 없음** (cherry-pick auto-merge)

## 3. 매직넘버 / 하드코딩 감사 (작업지시자 요청)

| 분류 | 건수 | 평가 |
|------|------|------|
| **신규 도입** | **0건** | ✅ PageBorderBasis enum 으로 의미 있는 명명, 휴리스틱 임계값 0건 |
| **제거** | **3건** | `(attr & 0x01) != 0` ×2 (paper_based) + `(attr & 0x02) != 0` (header_inside) → enum 통합 |
| **잔존 (PR 영역)** | **1건** | `footer_inside = (attr & 0x04) != 0` (layout.rs:979) — header 와 비대칭, 일관성 미비. **머지 차단 아님, 후속 정리 권고** |
| **잔존 (디버그/별건)** | 디버그 로그 비트 노출(정당) + shape.rs 별건 (본 PR 무관) |

본 PR 은 **매직넘버 측면에서 개선 PR** (신규 0 / 제거 3). #997(35) / #999(45 + spacing_before=0) / #1009(0.85 / 1500 HU 등 회귀 유발) 와 달리 휴리스틱 임계값 0건.

후속 권고: `PageBorderFill` 에 `header_inside: bool` + `footer_inside: bool` 필드 추가 → parser 단계 해석, renderer 는 필드 직접 사용 (현재 `basis` 와 동일 패턴) — 별도 issue 등록 권고.

## 4. 자기 검증

| 항목 | 결과 |
|------|------|
| `cargo test --release --lib` | 1307 passed / 0 failed / 2 ignored |
| `cargo clippy --release --lib -D warnings` | 통과 |
| `cargo fmt --check` | exit 0 |
| WASM 빌드 (Docker) | 4.83 MB, rhwp-studio/public 동기화 |

## 5. 검토 쟁점 → sweep 검증 (7 fixture, BEFORE devel `9190dea8` ↔ AFTER)

| Fixture | 결과 | 쟁점 | 판정 |
|---------|------|------|------|
| sample10 (HWP3), exam_kor / exam_math, aift, biz_plan | 전부 **diff=0** | A | ✅ 무회귀 |
| sample16-hwp5 (변환본 타깃) | diff=64, page=64 유지 | — | 외곽선 paper-edge 이동 (cover logo 정합) |
| sample16-hwp3 (HWP3 원본) | diff=64 | A | **정밀 분석**: 외곽선 4면 paper-edge 확장, footer y 유지, **텍스트 무변동** (비-도형 diff 0) |

**정밀 분석 (sample16-hwp3 첫 페이지):**
- 외곽선 top y: 74.6/76.7 → **17.9/19.9** (header clip 제거 → paper-edge 약 56px 위 이동)
- 외곽선 bottom y: 1045.8/1047.9 → **유지** (footer clip 유지)
- 좌우 x: 36.7~756.9 → **17.9~775.8** (paper-edge 좌우 확장)
- **비-도형 요소 diff = 0** (텍스트 무변동)

PR 본문의 "paper-edge outline (top y=17.88)" 정합 100% 확인.

## 6. 작업지시자 시각 판정

sample16-hwp5 변환본 cover logo overlap 해소 + HWP3 원본 외곽선 paper-edge 정합 + 페이지 번호 외곽선 바깥 유지 + 일반 HWP5 무회귀 — **시각 판정 통과**.

## 7. 회귀 사이클 종결 (PR 본문 표)

| Task/PR | sample16 | 시험지 | 변환본 logo | 페이지 번호 |
|---------|----------|--------|------------|-----------|
| task877 | ✓ | 회귀 | 회귀 | - |
| #920 | 회귀 | ✓ | 회귀 | - |
| #956 | 회귀(재판정) | ✓ | overlap | - |
| #987 | body 재판정(오판단) | 일부 ✓ | 회귀 (#1006 원인) | - |
| **#1006** | **✓** | **✓** | **✓** | **외곽선 바깥 ✓** |

## 8. 잔존 / 후속 (PR 본문 명시)

- **test-image.hwp paragraph 텍스트 라벨 누락** — wrap=TopAndBottom + 글뒤로/글앞으로/어울림 혼재 paragraph 텍스트 렌더링 결함 (별도 root cause, 본 PR scope 외). fixture 는 본 PR 로 영구 추가됨 (회귀 가드 확보)
- **footer_inside 일관성 정리** — `PageBorderFill.header_inside / footer_inside` 필드 추가로 비트마스크 잔존 1건 제거 (별도 issue 권고)

## 9. 메모리 룰 정합

- `feedback_contributor_cycle_check` — @jangster77 #997~#1011 연속, #1011 으로 시리즈 마무리
- `feedback_diagnosis_layer_attribution` — parser/renderer 책임 분리 (interpretation → parser, 사용 → renderer)
- `feedback_visual_judgment_authority` — **권위 사례 강화**: 작업지시자 Hancom Office close-up 판정으로 spec 우선 #987/#1005 정정. spec ≠ 한컴 실제 동작 정책 명문화
- `feedback_hancom_compat_specific_over_general` — selective clip (header 제거 / footer 유지) case-specific
- `feedback_pr_supersede_chain` — **권위 사례**: task877→#920→#956→#987→#1005→#1006 회귀 사이클을 단일 PR 로 종결
- `reference_authoritative_hancom` — test-image fixture 추가로 그림 wrap 4종 회귀 가드 영구화
- `project_output_folder_structure` — sweep 산출물 output/poc/pr1011 배치
