# PR #234: PUA 심볼 렌더링 + 문단 테두리 여백 반영 — 수행 계획서

## PR 정보

| 항목 | 내용 |
|------|------|
| PR 번호 | [#234](https://github.com/edwardkim/rhwp/pull/234) |
| 작성자 | seanshin |
| 제목 | fix: PUA 심볼 렌더링 + 문단 테두리 여백 반영 (v0.7.3) |
| base → head | main → main |
| 변경 | +810 / -14 (12 파일, 7 커밋) |
| Mergeable | **false (dirty)** — base가 뒤처진 상태 |

## 수행 목표

PR #234의 변경 사항을 검토·검증하여 로컬 devel에 통합한다.

## 변경 범위

### 기능 변경 (핵심)

1. **PUA 심볼 문자 렌더링** — `src/renderer/svg.rs`, `web_canvas.rs`, `html.rs`, `layout.rs`
   - Wingdings 등 심볼 폰트의 PUA(U+F000~F0FF) → 유니코드 표준 문자 변환
   - 화살표(⇩⇧⇦⇨), 도형(●■◆), 체크마크(✔☑)

2. **문단 테두리/배경 여백 반영** — `src/renderer/layout/paragraph_layout.rs`
   - `border_fill` rect에 `margin_left`/`margin_right` 반영
   - 테두리 박스가 텍스트 영역과 정확히 일치

3. **표 레이아웃 추가 수정** — `src/renderer/layout/table_layout.rs` (+61줄)

### 메타 변경

- `CHANGELOG.md`, `Cargo.toml` (v0.7.2 → 0.7.3), `README.md`, `README_EN.md`
- `mydocs/eng/plans/*` 신규 계획서 2개 (영문, 670줄)

## 검토 사항

1. **충돌 해결 필요**: PR base가 현재 main보다 뒤처짐 → rebase 또는 수동 merge 필요
2. **버전 충돌**: Cargo.toml v0.7.3 변경 — 현재 devel 최신 버전과 불일치 가능성
3. **영문 계획서 위치**: `mydocs/eng/plans/`는 프로젝트의 기존 구조(`mydocs/plans/`)와 다름

## 처리 방식

PR은 이슈 없이 진행 (작업지시자 지시).

## 브랜치

`local/pr234` (PR 검토 전용 브랜치)

## 구현 계획서

`mydocs/plans/task_m100_pr234_impl.md` 참조
