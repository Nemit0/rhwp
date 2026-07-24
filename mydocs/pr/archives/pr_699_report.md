---
PR: #699
제목: samples — aift/kps-ai PDF 변환본을 기본 인쇄(1장/쪽)로 갱신
컨트리뷰터: @planet6897 (Jaeuk Ryu) — 30+ 사이클 핵심 컨트리뷰터
처리: 옵션 A — 5 commits 단계별 보존 cherry-pick + no-ff merge
처리일: 2026-05-09
머지 commit: bbc44035
---

# PR #699 처리 보고서

## 1. 처리 결과

✅ **머지 완료** — 옵션 A (5 commits 단계별 보존 cherry-pick + no-ff merge `bbc44035`)

| 항목 | 값 |
|------|-----|
| 머지 commit | `bbc44035` (--no-ff merge) |
| 시각 판정 | **면제** (PDF 권위 자료 갱신, 코드 무변경) |
| 자기 검증 | pdfinfo 실측 정합 + cargo test ALL GREEN (lib 1166 + 통합) + 회귀 0 |

## 2. 정정 본질

이전 PR #670 (한글 2022 PDF 변환본 추가) 의 6 PDF 가 모아찍기 2-up 또는 1쪽만 인쇄되어 페이지 수 어긋남. 한글 2022 기본 인쇄 (1장/쪽) 로 재출력.

| 파일 | 기존 → 신규 |
|------|--------|
| `pdf/aift-2022.pdf` | 37 → **74 페이지** (2-up → 1-up) |
| `pdf/kps-ai-2022.pdf` | 39 → **77 페이지** (2-up → 1-up) |
| `pdf/hwpx/aift-2022.pdf` | 37 → **74 페이지** (2-up → 1-up) |
| `pdf/hwp-multi-001-2022.pdf` | 5 → **9 페이지** (2-up → 1-up) |
| `pdf/KTX-2022.pdf` | 14 → **27 페이지** (2-up → 1-up) |
| `pdf/basic/shortcut-2022.pdf` | 1 → **7 페이지** (1쪽만 인쇄 → 전체) |

## 3. 본 환경 cherry-pick + 검증

### 3.1 cherry-pick (5 commits)
```
fc898c54 samples: aift/kps-ai PDF 변환본을 기본 인쇄(1장/쪽)로 갱신
df820943 samples: hwpx/aift-2022.pdf도 기본 인쇄(1장/쪽)로 갱신
3045d33d samples: hwp-multi-001-2022.pdf도 기본 인쇄(1장/쪽)로 갱신
2451c5be samples: KTX-2022.pdf도 기본 인쇄(1장/쪽)로 갱신
6c1ae69e samples: basic/shortcut-2022.pdf도 기본 인쇄(1장/쪽)로 갱신
```
충돌 0건.

### 3.2 결정적 검증

| 검증 | 결과 |
|------|------|
| `pdfinfo` 실측 6 PDF | ✅ 모두 PR 본문 수치 정합 (74/77/74/9/27/7) |
| `cargo test --release` | ✅ lib 1166 + 통합 ALL GREEN, failed 0 |
| 회귀 영향 | ✅ 코드 무변경 → 회귀 0 확정 |

### 3.3 본 환경 rhwp 출력과의 정합 영향

#### 정합 회복 ✅
| 파일 | rhwp | 신규 PDF | 효과 |
|------|------|----------|------|
| `samples/hwpx/aift.hwpx` | 74 | **74** | ✅ **정합 회복** |
| `samples/KTX.hwp` | 27 | **27** | ✅ **정합 회복** |

#### 잔존 어긋남 (PR 범위 외, 별개 결함)
| 파일 | rhwp | 신규 PDF | 차이 |
|------|------|----------|------|
| `samples/aift.hwp` | 77 | 74 | +3 |
| `samples/kps-ai.hwp` | 79 | 77 | +2 |
| `samples/hwp-multi-001.hwp` | 10 | 9 | +1 |
| `samples/basic/shortcut.hwp` | 10 | 7 | +3 |

→ 별개 결함 — 본 PR 범위 외. 후속 결함 분리 등록 가능 (선택).

### 3.4 머지 commit
`bbc44035` — `git merge --no-ff local/task699` 로 단일 머지 commit. PR #694/#693/#695 패턴 일관성.

### 3.5 시각 판정 게이트 면제
PDF 권위 자료 갱신 (코드 무변경). UI/렌더링 무관 → `feedback_visual_regression_grows` 권위 룰 정합으로 면제.

## 4. 영향 범위

### 4.1 무변경 영역
- 소스/테스트/문서 코드 무변경
- 본 환경 rhwp 출력 무변경

### 4.2 변경 영역 (PDF 권위 자료)
- `pdf/` 6 파일 binary 갱신 — 1-up 인쇄로 페이지 수 정합 회복
- 광범위 sweep 의 권위 비교 결과만 합리화 (거짓 어긋남 2건 해소)

→ **위험 매우 낮음**. 코드 회귀 부재.

## 5. 메모리 룰 적용

| 룰 | 적용 |
|----|------|
| `reference_authoritative_hancom` | 한글 2022 PDF 본 환경 권위 정합 자료 (PR #670 영구 보존 영역의 갱신) |
| `feedback_pdf_not_authoritative` | 한컴 한글 2022 편집기 PDF 만 정답지 가능 — 본 PR 정합 (1-up 기본 인쇄로 정확) |
| `feedback_visual_regression_grows` | page-mismatch sweep 의 권위 비교 신뢰성 회복 — 거짓 어긋남 2건 해소 |
| `feedback_contributor_cycle_check` | @planet6897 30+ 사이클 핵심 컨트리뷰터 |
| `feedback_v076_regression_origin` | 본 PR 은 권위 자료 자체 정정 — 컨트리뷰터/작업지시자 환경 무관 (binary 정합 1:1) |

## 6. 잔존 후속

- 잔존 결함 부재 (본 PR 본질 정정 완료).
- 잔존 page-mismatch 4 영역 (aift / kps-ai / hwp-multi-001 / shortcut) 은 별개 결함 — 후속 이슈 분리 등록 가능 (작업지시자 결정).

---

작성: 2026-05-09
