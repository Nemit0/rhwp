# PR #335 검토 — feat: embed images as base64 data URIs in SVG/HTML export

## PR 정보

| 항목 | 내용 |
|------|------|
| PR 번호 | [#335](https://github.com/edwardkim/rhwp/pull/335) |
| 작성자 | [@oksure](https://github.com/oksure) (Hyunwoo Park) — **PR #334 머지 직후 두 번째 PR** |
| 이슈 | (없음 — 개선 제안 PR) |
| **base/head** | **`main` ← `contrib/embed-image-base64`** ⚠️ |
| 변경 | +73 / -14 (2 파일) |
| Mergeable | MERGEABLE / BLOCKED (CI 미실행 — main base) |
| CI | 없음 (BLOCKED) |
| maintainerCanModify | ✅ true |
| 검토일 | 2026-04-26 |

## 트러블슈팅 사전 검색

| 자료 | 관련성 |
|------|--------|
| `bmp_svg_render.md` | BMP→PNG 재인코딩 (web_canvas 영역) — 본 PR 의 BMP 처리와 관련 |
| `image_*` (없음) | 트러블슈팅 신규 영역 |

## 변경 본질

### Before (placeholder only)

`src/renderer/{svg.rs, html.rs}::draw_image` 가 회색 placeholder 만 출력:
- SVG: `<rect>` 회색 사각형
- HTML: `<div>` 빈 div

`render_picture` 와 `web_canvas` 는 이미 base64 임베딩 구현되어 있는데 **`draw_image` 만 placeholder 상태** — backend 간 불일치.

### After (base64 data URI 임베딩)

```svg
<!-- SVG -->
<image href="data:image/jpeg;base64,..." width="..." height="..."/>

<!-- HTML -->
<img src="data:image/png;base64,..." style="width:...; height:...">
```

- `detect_image_mime_type` 으로 MIME 자동 식별 (JPEG/PNG/BMP/GIF/WebP)
- WMF 는 기존 `convert_wmf_to_svg` 변환 후 임베딩
- 데이터 없는 경우 placeholder fallback (방어적 처리)

## 변경 파일 (2개, +73/-14)

| 파일 | 라인 | 내용 |
|------|------|------|
| `src/renderer/svg.rs` | +15/-5 | `draw_image` base64 임베딩 + WMF 변환 + `detect_image_mime_type` `pub(crate)` 변경 |
| `src/renderer/html.rs` | +58/-9 | `draw_image` base64 임베딩 + `render_node Image branch` wire + **3 unit tests** (PNG/JPEG/unknown format) |

## 코드 검토 포인트

### A. 코드 정확성

| 항목 | 평가 |
|------|------|
| **render_picture / web_canvas 정합** | 기존 base64 임베딩 패턴 재사용 (PR #341 의 engine.rs ↔ typeset.rs 정합 처럼). 정공법 |
| **WMF 변환** | 기존 `convert_wmf_to_svg` 재사용 — 일관성 |
| **fallback** | data 없는 경우 placeholder 유지 — 방어적 처리 |
| **`pub(crate)` 변경** | `detect_image_mime_type` 가 `svg.rs` 내부 → `pub(crate)` 로 확대. html.rs 재사용 위해. 적절 |
| **3 unit tests (37a0850)** | PNG/JPEG/unknown format 헤더 검증 + data URI MIME 타입 단위 검증 — Copilot review 반영 후 추가 |

### B. 회귀 리스크

| 리스크 | 평가 |
|--------|------|
| `render_picture` 기존 동작 영향 | 없음 (별도 path, 본 PR 변경 없음) |
| `web_canvas` 기존 동작 영향 | 없음 |
| 이미지 없는 문서 | placeholder fallback 유지 |
| BMP 호환성 | 기존 BMP→PNG 재인코딩 로직 유지 (svg/html 도 동일 경로) |

### C. 절차 준수 (외부 기여자 PR)

| 규칙 | 준수 | 비고 |
|------|------|------|
| 이슈 → PR | △ | 이슈 없음 — 개선 제안 PR (흔한 패턴, OK) |
| 작업지시자 승인 없는 close | ✅ | 이슈 없음, 해당 무관 |
| 브랜치명 | ✅ | `contrib/embed-image-base64` (외부 기여자로 적절) |
| 커밋 메시지 | ✅ | `feat:` / `fix:` 일관 |
| Test plan | ✅ | cargo test 937 + clippy + samples/hwp-img-001.hwp 시각 검증 |
| **base 브랜치** | ❌ | **main** (devel 이어야 함) |
| Copilot review 반영 | ✅ | `37a0850` 에서 Image branch wire + 3 unit tests 추가 |

## 충돌 상황

PR 브랜치에 **본 task 외 무관 커밋 다수** (PR #334 와 동일 패턴):

```
37a0850 fix: wire render_node Image branch to draw_image + add tests   ← 본 PR
a046c62 feat: embed images as base64 data URIs in SVG/HTML export      ← 본 PR
bea635b docs(manual): ...                                              ← 우리 devel 머지본
72fdd4b docs: 외부 공개 문서 자기검열                                   ← 우리 devel 머지본
1bfd1e0 docs: 외부 기여자 PR 검토 문서를 mydocs/pr/ 로 분리             ← 우리 devel 머지본
...
```

cherry-pick 으로 핵심 2 커밋만 추출 → 자동 해소.

## 처리 방향

PR #334 와 동일 패턴 (cherry-pick + author 보존 + force-push):

1. ✅ 본 review 작업지시자 승인
2. `local/task335` 브랜치 (origin/devel 기준) 생성
3. 핵심 2 커밋 cherry-pick (`a046c62` + `37a0850`, author=Hyunwoo Park 보존)
4. 빌드/lib test/clippy/wasm32 검증
5. 작성자 fork force-push (maintainerCanModify=true)
6. PR base `main` → `devel` 변경
7. CI workflow 승인 (first-time 은 아니지만 매번 승인 필요할 수 있음)
8. CI 통과 후 admin merge

## 시각 검증 항목

작성자 본인이 `samples/hwp-img-001.hwp` 로 4개 이미지 (JPEG/PNG/BMP) 임베딩 확인. 메인테이너는 추가로:
- `samples/hwp-img-001.hwp` 또는 다른 이미지 포함 샘플 SVG 출력
- placeholder 가 아닌 실제 이미지가 보이는지 시각 확인

## 판정 (예정)

✅ **Merge 권장**

**사유:**
1. backend 간 불일치 정합 (render_picture/web_canvas 와 같은 동작)
2. 기존 패턴 재사용 (`detect_image_mime_type`, `convert_wmf_to_svg`)
3. **3 unit tests** 추가 (Copilot review 반영)
4. 회귀 리스크 최소 (placeholder fallback 유지)
5. PR #334 작성자의 두 번째 PR — 코드 품질 일관 유지

**처리 시 안내:**
- base=main 안내 (PR #334 환영 코멘트에 이미 한 번 안내했으므로 본 PR 은 짧게)

## 참고 링크

- [PR #335](https://github.com/edwardkim/rhwp/pull/335)
- 첫 PR: [PR #334](https://github.com/edwardkim/rhwp/pull/334) (이미 머지)
