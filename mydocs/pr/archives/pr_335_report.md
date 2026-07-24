# PR #335 처리 결과 보고서

## PR 정보

| 항목 | 내용 |
|------|------|
| PR 번호 | [#335](https://github.com/edwardkim/rhwp/pull/335) |
| 작성자 | [@oksure](https://github.com/oksure) (Hyunwoo Park) — 두 번째 PR |
| 이슈 | (없음 — 개선 제안 PR) |
| 처리 | **Merge (admin)** |
| 처리일 | 2026-04-26 |

## 변경 요약

SVG/HTML 내보내기의 `draw_image` 가 placeholder (회색 `<rect>` / 빈 `<div>`) 만 출력하던 것을 base64 data URI 임베딩으로 교체. `render_picture` / `web_canvas` 와의 backend 간 불일치 정합.

### 변경 파일 (2개, +73/-14)

| 파일 | 라인 | 내용 |
|------|------|------|
| `src/renderer/svg.rs` | +15/-5 | `draw_image` base64 임베딩 + WMF 변환 + `detect_image_mime_type` `pub(crate)` |
| `src/renderer/html.rs` | +58/-9 | `draw_image` base64 임베딩 + `render_node Image` branch wire + 3 unit tests |

### 처리 흐름 (PR #334 와 동일 패턴)

1. PR review 작성 + 작업지시자 승인
2. `local/task335` 브랜치 (origin/devel 기준)
3. 작성자 핵심 2 커밋 cherry-pick (author=Hyunwoo Park 보존):
   - `a046c62` feat: embed images as base64 data URIs in SVG/HTML export
   - `37a0850` fix: wire render_node Image branch to draw_image + add tests (Copilot review 반영)
4. 자동 검증
5. 작성자 fork force-push + base main → devel 변경
6. CI 자동 실행 (PR #334 머지 후 first-time contributor 정책 우회)
7. CI 통과 → admin merge

## 메인테이너 검증

| 항목 | 결과 |
|------|------|
| `cargo build --release` | ✅ 25.55s |
| `cargo test --lib` | ✅ **1000 passed** (997 → +3 신규) |
| `cargo test --test svg_snapshot` | ✅ 6/6 |
| `cargo test --test issue_301` | ✅ |
| `cargo clippy --lib -D warnings` | ✅ clean |
| `cargo check --target wasm32` | ✅ clean |
| `samples/hwp-img-001.hwp` SVG 시각 검증 | ✅ JPEG/PNG base64 data URI 임베딩 확인 |

## 외부 기여 가치

- backend 간 불일치 정합 (render_picture/web_canvas 와 동일 동작)
- 기존 패턴 재사용 (`detect_image_mime_type`, `convert_wmf_to_svg`)
- Copilot review 반영 (`37a0850` Image branch wire + 3 unit tests)
- PR #334 와 일관된 품질 — 두 번째 기여로 신뢰 누적

## 참고 링크

- [PR #335](https://github.com/edwardkim/rhwp/pull/335)
- [감사 코멘트](https://github.com/edwardkim/rhwp/pull/335#issuecomment-4321149680)
- 첫 PR: [#334](https://github.com/edwardkim/rhwp/pull/334) (이미 머지)
