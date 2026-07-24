---
PR: #699
제목: samples — aift/kps-ai PDF 변환본을 기본 인쇄(1장/쪽)로 갱신
컨트리뷰터: @planet6897 (Jaeuk Ryu) — 30+ 사이클 핵심 컨트리뷰터
base / head: devel / feature/pdf-print-update
mergeStateStatus: BEHIND
mergeable: MERGEABLE — 충돌 0건
CI: ALL SUCCESS
변경 규모: PDF 6 파일 (binary diff)
검토일: 2026-05-09
---

# PR #699 검토

## 1. 메타

| 항목 | 값 |
|------|-----|
| PR 번호 | #699 |
| 제목 | samples — aift/kps-ai PDF 변환본을 기본 인쇄(1장/쪽)로 갱신 |
| 컨트리뷰터 | @planet6897 (Jaeuk Ryu) — 30+ 사이클 핵심 컨트리뷰터 |
| base / head | devel / feature/pdf-print-update |
| mergeStateStatus | BEHIND, mergeable: MERGEABLE — `git merge-tree` 충돌 0건 |
| CI | ALL SUCCESS |
| 변경 규모 | PDF 6 파일 (binary diff, 코드/문서 무변경) |
| 커밋 수 | 5 (각 PDF 별 1 commit) |
| closes | (명시 없음 — PDF 권위 자료 갱신 PR) |

## 2. 동기

이전 PR (`69a7078c samples: 한글2022 PDF 변환본 추가`, 즉 PR #670 영역) 에 포함된 6개 PDF 가 인쇄 설정 문제로 페이지 수 어긋남 발생:

- **모아찍기 2-up** — 한글2022 인쇄 시 두 페이지를 한 장에 출력 (실제 페이지 수 / 2 ≈ PDF 페이지 수)
- **1쪽만 출력** — `shortcut-2022.pdf` 영역 (1 페이지만 인쇄)

→ 본 환경 rhwp SVG 페이지 수와 PDF 페이지 수 비교 시 거짓 어긋남 발생. 광범위 page-mismatch sweep 의 권위 영역 신뢰성 훼손.

## 3. PR 의 정정 — 6 PDF 1-up 으로 재출력

| 파일 | 기존 페이지 | **신규 페이지** | 기존 크기 → 신규 |
|------|-------------|----------------|-------------------|
| `pdf/aift-2022.pdf` | 37 | **74** | 1.77 MB → 2.57 MB |
| `pdf/kps-ai-2022.pdf` | 39 | **77** | 0.90 MB → 1.05 MB |
| `pdf/hwpx/aift-2022.pdf` | 37 | **74** | 1.72 MB → 2.57 MB |
| `pdf/hwp-multi-001-2022.pdf` | 5 | **9** | 584 KB → 654 KB |
| `pdf/KTX-2022.pdf` | 14 | **27** | 624 KB → 718 KB |
| `pdf/basic/shortcut-2022.pdf` | 1 | **7** | 5 KB → 142 KB |

**본 환경 직접 측정**: 6 PDF 모두 PR 본문 수치 정확 정합 (`pdfinfo` 실측).

## 4. 본 환경 rhwp 출력과의 정합 영향

### 4.1 정합 회복 영역 ✅

| 파일 | rhwp 페이지 | 기존 PDF | **신규 PDF** | 정합 |
|------|-------------|----------|--------------|------|
| `samples/hwpx/aift.hwpx` | 74 | 37 | **74** | ✅ **정합** |
| `samples/KTX.hwp` | 27 | 14 | **27** | ✅ **정합** |

→ 두 영역의 page-mismatch 어긋남이 신규 PDF 와 함께 정합으로 해소. `feedback_visual_regression_grows` 권위 영역 신뢰성 회복.

### 4.2 잔존 어긋남 영역 (PR 범위 외, 별개 결함)

| 파일 | rhwp 페이지 | 신규 PDF | 차이 |
|------|-------------|----------|------|
| `samples/aift.hwp` | 77 | 74 | **+3** (rhwp 가 더 많음) |
| `samples/kps-ai.hwp` | 79 | 77 | **+2** |
| `samples/hwp-multi-001.hwp` | 10 | 9 | **+1** |
| `samples/basic/shortcut.hwp` | 10 | 7 | **+3** |

→ 본 PR 정정 후에도 4 영역의 page-mismatch 잔존. 별개 결함 — 본 PR 범위 외. 후속 결함 분리 등록 가능.

→ **본질 영향**: PR 머지 후 기존 page-mismatch sweep 결과가 **합리화** 되어 진짜 결함만 노출.

## 5. 영향 범위

### 5.1 무변경 영역
- 코드 무변경 (소스 / 테스트 / 문서 무변경)
- 본 환경 rhwp 출력 무변경

### 5.2 변경 영역 (PDF 권위 자료)
- `pdf/` 6 파일 binary 갱신 — 1-up 인쇄로 페이지 수 정합 회복
- 본 환경 광범위 sweep 의 권위 비교 결과만 변경 (코드 회귀 영향 부재)

→ **위험 매우 낮음**. 코드 회귀 부재.

## 6. 충돌 / mergeable

- `mergeStateStatus: BEHIND` (PR base 가 devel 뒤처짐)
- `git merge-tree --write-tree` 실측: **CONFLICT 0건** (PDF 영역 본 환경 미수정 영역)

## 7. 메모리 룰 적용

| 룰 | 적용 |
|----|------|
| `reference_authoritative_hancom` | 한글 2022 PDF 본 환경 권위 정합 자료 (PR #670 영구 보존 영역의 갱신) |
| `feedback_pdf_not_authoritative` | 한컴 한글 2022 편집기 PDF 만 정답지 가능 — 본 PR 정합 (1-up 기본 인쇄로 정확) |
| `feedback_visual_regression_grows` | page-mismatch sweep 의 권위 비교 신뢰성 회복 — 거짓 어긋남 4건 (aift hwpx + KTX + ...) 해소 |
| `feedback_contributor_cycle_check` | @planet6897 30+ 사이클 핵심 컨트리뷰터 |
| `feedback_v076_regression_origin` | 본 PR 은 권위 자료 자체 정정 — 컨트리뷰터 환경 / 작업지시자 환경 모두 무관 (binary 정합 1:1) |

## 8. 처리 옵션

### 옵션 A — 5 commits 단계별 보존 cherry-pick + no-ff merge (추천)

PR 의 5 commits 가 각 PDF 별로 분리되어 있어 단계별 추적 정합. PR #694/#693/#695 패턴과 일관.

```bash
git branch local/task699 fe6a91a3
git checkout local/task699
git cherry-pick def67a78^..436092ee 428a202c 962bb377 59e1f1af  # 5 commits
git checkout local/devel
git merge --no-ff local/task699
```

**또는 단순화**: PR 본문 base 부터 head 까지 단순 cherry-pick range.

### 옵션 B — 5 commits squash → 1 commit

devel log 간결. 단점: 각 PDF 별 commit 추적성 손실.

→ **옵션 A 추천** — PR #694/#693/#695 패턴 일관, PDF 별 추적성 보존.

## 9. 검증 게이트 (구현 단계 DoD)

### 자기 검증
- [ ] `pdfinfo` 실측: 6 PDF 페이지 수 PR 본문 정합 (74/77/74/9/27/7)
- [ ] `cargo test --release` ALL GREEN (PDF 영역은 코드 영역과 무관, 회귀 0 확인)
- [ ] **광범위 sweep**: 7 fixture / 170 페이지 byte 비교 — 본 PR 머지로 인한 코드 출력 변경 0 확증

### 시각 판정 게이트
- 본 PR 은 PDF 권위 자료만 갱신 (소스 무변경) → **시각 판정 게이트 면제** 정합 (`feedback_visual_regression_grows` — 코드 회귀 영향 부재)
- 작업지시자가 갱신된 PDF 의 1-up 인쇄 정합 자체를 검증할 의향이 있다면 시각 점검 가능 (선택)

## 10. 처리 순서 (승인 후)

1. `local/devel` 에서 5 commits cherry-pick (옵션 A)
2. 자기 검증 (`pdfinfo` 페이지 수 + `cargo test` ALL GREEN)
3. **시각 판정 게이트 면제** (PDF 권위 자료 갱신, 코드 무변경)
4. no-ff merge + push + archives 이동 + 5/9 orders 갱신
5. PR #699 close (closes 명시 없으므로 수동 close + 한국어 댓글)
6. (선택) 잔존 page-mismatch 4 영역 (aift / kps-ai / hwp-multi-001 / shortcut) 별도 후속 이슈 등록 가능

---

작성: 2026-05-09
