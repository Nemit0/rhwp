# PR #278 검토 — Task #275: WASM canvas OLE RawSvg/Placeholder 처리 복구

## PR 정보

- **PR**: [#278](https://github.com/edwardkim/rhwp/pull/278)
- **이슈**: [#275](https://github.com/edwardkim/rhwp/issues/275)
- **작성자**: @planet6897 (Jaeuk Ryu)
- **base/head**: `devel` ← `local/task275`
- **기존 커뮤니티 리뷰**: @seanshin APPROVED (01:36) — head 변경으로 무효화
- **Mergeable**: ⚠️ 원래 CONFLICTING (orders 문서 1개만 충돌, 코드는 자동 merge 성공)
- **검토일**: 2026-04-24

## 변경 요약

rhwp-studio (WASM) 에서 `samples/bitmap.hwp`, `samples/한셀OLE.hwp` 로드 시 **본문이 완전히 빈 페이지**로 렌더되던 버그 수정. 네이티브 CLI는 정상 동작이었고, 문제는 **WASM canvas 렌더러의 `RenderNodeType` match arm 비대칭**.

### 핵심 변경 (코드 3개 파일 + 신규)

| 파일 | 변경 | 설명 |
|------|------|------|
| `src/renderer/svg_fragment.rs` | **신규 278줄** | SVG 조각 파서 유틸 + 단위 테스트 19건 |
| `src/renderer/web_canvas.rs` | +63 | Placeholder + RawSvg arm 추가, detect_image_mime_type SVG 확장 |
| `src/renderer/mod.rs` | +1 | svg_fragment 모듈 등록 (wasm32 gate 없음) |

## 루트 원인 분석

두 파일 모두 첫 문단에 **OLE 컨트롤** 존재:
- bitmap.hwp — 150×84mm BMP 임베드
- 한셀OLE.hwp — 106×14mm 한셀 시트

`src/renderer/layout/shape_layout.rs:983-1094` `ShapeObject::Ole` 처리가 OLE 컨테이너에서:
- OOXML 차트 / EMF 프리뷰 / 네이티브 BMP·PNG·JPEG → `RenderNodeType::RawSvg`
- 전부 실패 시 → `RenderNodeType::Placeholder`

두 렌더러의 match arm 차이:

| 노드 타입 | `svg.rs` (네이티브) | `web_canvas.rs` (WASM) |
|-----------|---------------------|-------------------------|
| `RawSvg` | 처리 O | **arm 부재 → `_ =>` 암묵 무시** |
| `Placeholder` | 처리 O | **arm 부재 → `_ =>` 암묵 무시** |

→ WASM에서 OLE 경로 전체가 빈 렌더.

## 수정 내역

### `svg_fragment.rs` (신규 278줄)

SVG 조각 파서 공용 유틸 (네이티브/WASM 양쪽 사용):

- `find_svg_attr_value(s, attr)` — 단어 경계 속성 추출 (`href` 가 `xlink:href` 오매칭 방지)
- `try_parse_single_image_data_url(svg)` — `<image xlink:href="data:..."/>` 단일 요소 판정 + 추출
- `decode_base64_data_url(url)` — `data:MIME;base64,PAYLOAD` → `(mime, bytes)`
- `is_svg_prefix(data)` — `<svg` / `<?xml ... <svg` 시작 감지 (256B 창)
- `wrap_svg_fragment(frag, x, y, w, h)` — 조각을 `<svg xmlns viewBox="x y w h">` 로 래핑

**단위 테스트 19건** — 네이티브에서 실행 가능하도록 wasm32 gate 없이 모듈 분리.

### `web_canvas.rs` (+63줄)

**Placeholder match arm** (+26줄) — svg.rs 와 동등:
- 배경 rect (`fill_color`) + 점선 테두리 (`StrokeDash::Dash = [6, 3]`, 1px)
- 중앙 라벨, 폰트 크기 `clamp(min(w, h) * 0.06, 12, 28)` (svg.rs 동일 공식)
- `text-align` / `baseline` 기본값 복원 (후속 노드 영향 차단)

**RawSvg match arm** (+25줄) — A/B 경로 디스패치:
- **A 경로** (`<image data:...>` 단일 요소): href 파싱 → base64 디코드 → 기존 `draw_image(bytes, ...)` 호출
- **B 경로** (복합 SVG, EMF/OOXML 차트): `wrap_svg_fragment` → `draw_image(svg_bytes, ...)` 호출
- 둘 다 기존 `IMAGE_CACHE` + `HtmlImageElement` async 로드 + 재렌더 파이프라인 공유

**`detect_image_mime_type` 확장**: `is_svg_prefix` 매치 시 `"image/svg+xml"` 반환 → 기존 `draw_image` 가 자동으로 `data:image/svg+xml;base64,...` URL 생성.

## 설계 검증

| 설계 요소 | 평가 |
|----------|------|
| `draw_image` 재사용 > `draw_svg_async` 분리 | ✅ IMAGE_CACHE (LRU 200) / async / 재렌더 중복 방지. 한 캐시로 모든 이미지 리소스 관리 |
| `viewBox = bbox` | ✅ `<svg>` 래퍼의 viewBox 와 width/height 를 bbox 와 동일 → 조각 내부 절대좌표가 drawImage 위치와 1:1. 좌표 변환 없음 |
| 헬퍼 모듈 분리 | ✅ `svg_fragment` 를 wasm32 gate 없이 등록 → 네이티브 단위 테스트 가능 |
| Placeholder arm 의 text baseline 복원 | ✅ 이전 arm의 상태 영향 차단 — 후속 노드 레이아웃 보전 |
| A/B 경로 구분 | ✅ 단일 `<image>` 는 빠른 경로 (base64 직접), 복합 SVG는 wrap 후 async. 각 경우에 최적 |

## 테스트 범위 (작성자 증빙)

### 단위 테스트
- `cargo test --lib svg_fragment`: **19 passed / 0 failed**
  - find_svg_attr_value, try_parse_single_image_data_url, decode_base64_data_url
  - is_svg_prefix (xml 선언 포함/미포함)
  - wrap_svg_fragment (bbox 매핑)

### E2E (puppeteer + headless Chrome)

**A 경로** — 이슈 재현 샘플:

| 파일 | 변경 전 | 변경 후 |
|------|---------|---------|
| `bitmap.hwp` | 빈 페이지 | 비트맵 손글씨 이미지 정상 렌더 |
| `한셀OLE.hwp` | 빈 페이지 | 노란 스프레드시트 이미지 정상 렌더 |

**B 경로** — `shape_layout.rs` 임시 가드로 원본 `<image>` 를 `<g><rect stroke=red/><image/><text>B-PATH</text></g>` 복합 SVG 로 강제 교체 → **빨간 사각형 + "B-PATH" 라벨 + 내부 이미지** 모두 동시 렌더 확인. 원복 후 `git diff` clean.

**Placeholder** — `FORCE_PLACEHOLDER` 가드로 OLE 추출 건너뜀 → **회색 배경 + 점선 테두리 + "OLE 개체 (BinData #1)" 중앙 라벨** 렌더 확인 (svg.rs 와 동등). 원복 후 `git diff` clean.

**강제 재현 기법**: 프로덕션 샘플이 없는 경로 (B 경로, Placeholder) 도 shape_layout.rs에 임시 가드를 한 줄 넣어 WASM 재빌드 → 스크린샷 → 원복 사이클로 시각 검증. diff clean 상태로 원복 확인이 핵심.

### 회귀
- `biz_plan.hwp`, `form-002.hwpx` 렌더 변화 없음

## 메인테이너 검증 결과

### 기본 검증 (작성자 주장)
- `cargo test --lib svg_fragment`: 19 passed
- `cargo test --lib`: 968 passed / 14 baseline fail
- `cargo check --target wasm32`: clean
- `wasm-pack build --target web`: 성공

### devel merge 후 재검증

orders 문서 충돌 해결 후:

| 항목 | 결과 |
|------|------|
| `cargo test --lib` | ✅ **983 passed / 0 failed / 1 ignored** (964 + 19 신규) |
| `cargo test --test svg_snapshot` | ✅ 6 passed (issue_147/157/267 + table-text/form_002/determinism) |
| `cargo clippy --lib -- -D warnings` | ✅ clean |
| `cargo check --target wasm32-unknown-unknown --lib` | ✅ clean |

**14 baseline fail이 사라진 것**: 이전 오늘 머지된 PR들과 함께 해소됨.

## 충돌 분석

- **충돌 파일**: `mydocs/orders/20260424.md` 단 1개 (문서)
- **코드 충돌**: 없음 — Rust 파일 모두 자동 merge 성공
- **원인**: PR 브랜치의 Task #275 섹션과 devel의 Task #280/#283/#267/#147 섹션이 같은 위치에 추가
- **해결**: Task #275를 "## 5" 로 재배치 + 이슈 활동 통합

## 문서 품질

CLAUDE.md 절차 준수:

- ✅ 수행계획서: `mydocs/plans/task_m100_275.md`
- ✅ 구현계획서: `mydocs/plans/task_m100_275_impl.md`
- ✅ 단계별 보고서: `stage1.md` / `stage2.md` / `stage3.md`
- ✅ 최종 보고서: `mydocs/report/task_m100_275_report.md`
- ✅ orders 갱신: Task #275 섹션 포함

## 파급 효과 (작성자 표기)

WASM canvas 에서 이제 정상 렌더되는 OLE 유형:
1. 네이티브 이미지 임베드 OLE (BMP/PNG/JPEG/GIF) — A 경로
2. EMF 프리뷰 있는 OLE — B 경로
3. OOXML 차트 (Task #195 단계 8 연계) — B 경로
4. 모든 추출 실패 시 Placeholder 폴백 — Placeholder arm

## 범위 외 (후속 이슈 후보)

- 두 렌더러 (`svg.rs` ↔ `web_canvas.rs`) 간 `RenderNodeType` match arm 대칭성 자동 검사 (이번 버그 재발 방지)
- `samples/` 에 대표 EMF/OOXML 차트 편입 후 정식 e2e 테스트
- `RawSvgNode` 데이터 모델 개선 (SVG 문자열 → 구조화된 노드 트리)

## 리스크 평가

| 리스크 | 판정 |
|--------|------|
| 기존 WASM 렌더 회귀 | ✅ `biz_plan.hwp`, `form-002.hwpx` 변화 없음 확인 |
| IMAGE_CACHE 과부하 | ✅ LRU 200 크기 유지. SVG도 일반 이미지로 취급되어 캐시 정책 동일 |
| SVG 조각 파서 edge case | ✅ 19건 단위 테스트 커버 (속성 단어 경계, xml 선언 포함/미포함) |
| async 로드 실패 처리 | ✅ 기존 `draw_image` 에러 경로 재사용 |
| wasm32 빌드 사이즈 | ✅ +7,030 bytes (4,043,989 → 4,051,019) — 합리적 |

## 판정

✅ **Merge 권장**

**사유:**
1. **근본 원인 분석 정확** — `svg.rs` ↔ `web_canvas.rs` match arm 비대칭 식별. 증상 "빈 페이지" 에서 3단계 추적
2. **설계 품질 최상** — 헬퍼 모듈 분리, `draw_image` 재사용, `viewBox = bbox` 등 각 결정이 논리적
3. **테스트 커버리지 광범위** — 19건 단위 테스트 + A/B/Placeholder 3경로 시각 검증 + 회귀 확인
4. **강제 재현 기법 탁월** — 프로덕션 샘플 없는 경로를 임시 가드로 재현 + 원복으로 시각 검증
5. **문서 완비** — 수행/구현 계획서 + 단계별 보고서 + 최종 보고서
6. **@seanshin 님 커뮤니티 리뷰 APPROVED** (01:36) — 같은 기여자 관점에서도 품질 인정

**Merge 전략:**
- Admin merge (orders 문서 충돌 직접 해결 완료, planet6897/local/task275 에 push 완료)
- 재승인 후 admin merge
