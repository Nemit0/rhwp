# PR #300 최종 보고서 — Task #297: VertRelTo::Page/Paper 기준점 분리

## 결정

✅ **Merge 승인 (충돌 해결 후 admin merge)**

## PR 정보

- **PR**: [#300](https://github.com/edwardkim/rhwp/pull/300)
- **이슈**: [#297](https://github.com/edwardkim/rhwp/issues/297) — PR #298 에서 사전 존재 버그로 분리한 후속
- **작성자**: @planet6897 (Jaeuk Ryu) — 오늘 6번째 기여
- **처리일**: 2026-04-24
- **Merge commit**: `0e3fb02`

## 처리 절차

1. ✅ PR 브랜치 체크아웃 (`task297`)
2. ✅ `origin/devel` 머지 → `mydocs/orders/20260424.md` 3구간 충돌 해결 (#295 "## 7", #296 "## 8", #297 "## 9" 재배치 + 이슈 활동 통합)
3. ✅ 머지 커밋 `938cf0c` 생성
4. ✅ 검증: 992 passed / 0 failed, 실제 y 좌표 1224.07 확인
5. ✅ `planet6897/task297` 에 push (`91e205f..938cf0c`)
6. ✅ 재승인 + admin merge → 이슈 #297 close

## 승인 사유

1. **HWP 스펙 정확한 번역** — Page=쪽 본문, Paper=용지 전체. 오래된 코드 부채 해소
2. **1줄 수정의 근본 해결** — 147px 드리프트가 단순한 enum 구분 누락에서 비롯
3. **증상 오인 회피** — `pdftotext -bbox-layout` 실측으로 이슈 제목 "동전 위치" 오인 확인, pi=22 푸터 표가 진짜 문제
4. **가설 조기 폐기** — 바탕쪽 Paper 가설을 수행계획서까지 작성했다가 3단계에서 시각 변화 없음을 보고 즉시 폐기
5. **광범위 회귀 검증** — 145 샘플 중 Page 표 13건 + 바탕쪽 5건 스캔

## 검증 결과

| 항목 | 결과 |
|------|------|
| `cargo test --lib` | ✅ 992 passed / 0 failed / 1 ignored |
| `cargo test --test svg_snapshot` | ✅ 6 passed (golden 유지) |
| `cargo test --test tab_cross_run` | ✅ 1 passed (#290 회귀 없음) |
| `cargo clippy / wasm32 check` | ✅ clean |
| CI (원본) | ✅ 전부 SUCCESS |
| 실제 SVG y 좌표 (pi=22) | ✅ **1224.07px** (PDF 1226.5 ±2 일치) |

## 변경 내역

**코드 (1파일):**
- `src/renderer/layout/table_layout.rs` +5 -2 — `compute_table_y_position` 에서 `VertRelTo::Page` → `(col_area.y, col_area.height)` 분리 (1줄), 주석 3줄 추가

**문서:**
- `mydocs/plans/task_m100_297{,_impl}.md` — 수행/구현 계획서 (v1 → v2 교체 기록)
- `mydocs/working/task_m100_297_stage{1,3}.md` — 단계별 보고서
- `mydocs/report/task_m100_297_report.md` — 최종 보고서
- `mydocs/orders/20260424.md` — Task #297 섹션 추가

## 성과 지표

| 항목 | Before | After |
|------|--------|-------|
| pi=22 "* 확인 사항" 박스 y | 1371.5 px | **1224.07 px** |
| PDF 대비 드리프트 | +142 px | **~-2 px (일치)** |
| 145 샘플 본문 Page 표 회귀 | - | 의도 범위만 변경 (diff=0 또는 ±1 byte) |
| 바탕쪽 Page 표 회귀 | - | 0건 (col_area=paper_area 수학적 동치) |

## #295 → #297 연결 프로세스 (모범 사례)

1. **PR #298 (#295) 리뷰** 중 12쪽 우측 컬럼 단락 높이 문제 발견
2. **좌표 비교 (수정 전/후 147.4..497.3 동일)** 로 "사전 존재 버그" 확정
3. **#297 로 분리 등록** (범위 확장 유혹 차단)
4. **1시간 만에 PR #300 착수**
5. **초기 가설 (바탕쪽 Paper)** 수행계획서까지 작성 후 3단계에서 시각 변화 없음 확인 → 폐기
6. **실측 기반 재조사** → Page vs Paper enum 스펙 미구분 발견
7. **1줄 수정 + 회귀 검증** → 완결

## 오늘 9번째 PR 머지 완료
