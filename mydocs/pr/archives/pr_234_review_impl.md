# PR #234 — 구현 계획서

## PR 커밋 전체 목록 (7개)

| # | SHA | 내용 |
|---|-----|------|
| 1 | dc4e320 | SVG draw_text PUA(U+F000~F0FF) → 유니코드 변환 + border_fill margin 반영 |
| 2 | cc762e7 | Canvas/HTML 렌더러에도 PUA 변환 적용 (web_canvas.rs, html.rs) |
| 3 | 80f7152 | 표 외곽 테두리 누락 — table.border_fill_id fallback 적용 |
| 4 | 6c27e20 | 표 외곽 테두리 — 셀 미커버 영역에만 fallback 적용 (3번 보완) |
| 5 | 7f4f405 | right tab 정렬 — margin_left 무관하게 셀 우측 끝 기준 |
| 6 | 78330fd | **Revert** 5번 (right tab 정렬 롤백) |
| 7 | d282070 | docs: README v0.7.3 + visual diff/right tab 기획서 추가 |

> 5, 6번: right tab 정렬은 작성자가 스스로 롤백 → 최종 PR에 포함 안 됨
> 실질 기능 변경: 1, 2, 3, 4번 + 문서(7번)

## 현재 상태

### base 충돌 상황

- PR base: `93bf5f0` (v0.7.3 시점)
- 현재 main: `a2c5f17` → pull 후 최신 (v0.7.3 이후 대량 변경)
- 현재 devel: `711df11` (v0.7.3 이후 최신)

→ PR을 현재 devel에 적용할 때 상당한 충돌 가능성

### 기능 중복 검토 필요

- 현재 devel에 이미 v0.7.3 릴리즈 완료 (Cargo.toml 0.7.3)
- PR의 `Cargo.toml 0.7.2 → 0.7.3` 변경은 이미 완료된 상태와 중복
- `CHANGELOG.md` 변경도 이미 최신 버전과 다른 내용

## 단계 구성

### 1단계: PR 브랜치 fetch + 충돌 검토

- `local/pr234` 브랜치 생성 (현재 `local/devel` 기반)
- PR의 실질 기능 변경만 cherry-pick 또는 수동 merge
- 충돌 파일 식별

### 2단계: 핵심 기능 적용 및 통합

처리 방식 결정 필요 (작업지시자 판단):

**옵션 A: PR 전체 merge** — 충돌 해결 + 메타 변경 반영
**옵션 B: 기능만 cherry-pick** — 1,2,3,4번 커밋만 선택 적용, 버전/문서 제외
**옵션 C: PR 거부 + 기능만 재구현** — 현재 devel 상태에 맞춰 수동 적용

권장: **옵션 B** — 버전/문서는 이미 진행된 상태, 기능만 필요

### 3단계: 빌드 + 테스트 검증

- `cargo build` + `cargo test` — 현재 893+ 테스트 통과 유지 확인
- Clippy 경고 0건 유지
- 기존 기능 regression 없음 확인

### 4단계: 최종 보고서 + 오늘할일 갱신

## 위험 요소

1. **충돌**: `src/renderer/layout.rs` (+41/-7), `table_layout.rs` (+61) — 최근 대량 변경 영역과 충돌 가능성
2. **버전 메타**: Cargo.toml, CHANGELOG.md는 이미 진행 → 제외 필요
3. **영문 계획서**: `mydocs/eng/plans/` 위치 — 기존 구조(`mydocs/plans/`)와 다름 → 수용 여부 판단 필요

## 예상 단계: 4단계
