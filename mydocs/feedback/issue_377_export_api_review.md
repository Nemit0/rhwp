# 이슈 #377 검토 — API Export 기능 제안

## 이슈 정보

| 항목 | 값 |
|------|-----|
| 이슈 번호 | [#377](https://github.com/edwardkim/rhwp/issues/377) |
| 제목 | API Export 기능이 있었으면 좋겠습니다 |
| 작성자 | (사용자 — 게시판 형태 사이트 운영 추정) |
| 라벨 | enhancement |
| state | OPEN |
| milestone | 없음 |
| assignee | 없음 |

## 작성자 제안 정리

현재 rhwp 의 저장 기능은 **로컬 저장만** 가능. 게시판 형태 사용 시 **서버에 업로드** 까지 자동화할 수 있는 export API 가 있으면 좋음.

작성자 표현:
> 로컬에 저장 후 -> 업로드 하지 않고 바로 업로드 할 수 있는 기능
>
> 저장시 로컬 + 적용서버 저장 export API 기능

작성자가 본 정황:
> 로드하는 API 는 있지만 업로드 하는 API 는 없는 것으로 확인됩니다

## 현재 rhwp 의 실제 export API

### WASM API (`pkg/rhwp.js`)
- `exportHwp() → Uint8Array` — HWP 바이너리 bytes 반환
- `exportHwpx() → Uint8Array` — HWPX bytes 반환

### Rust native API (`DocumentCore`)
- `export_hwp_native() → Result<Vec<u8>, HwpError>`
- `export_hwpx_native() → Result<Vec<u8>, HwpError>`
- `export_hwp_with_adapter() → Result<Vec<u8>, HwpError>` (HWPX → HWP 어댑터)
- `export_selection_html_native()` — 선택 영역 HTML

### 현재 흐름 (rhwp-studio)
```typescript
const bytes = services.wasm.exportHwp();      // 바이트 반환
const blob = new Blob([bytes], { type: 'application/x-hwp' });
// File System Access API 로 로컬 저장
```

## 작성자 오해 / 정황

작성자가 "업로드 API 가 없다" 고 한 부분은 **부분적 오해** 가능성:

1. **bytes 반환 API 는 이미 있음** (`exportHwp()`, `exportHwpx()`)
2. **서버 업로드 코드는 사용자 측 책임** — `fetch()` / `XMLHttpRequest` / axios 등으로 구현
3. rhwp 가 직접 서버 업로드를 수행하는 API 는 없음 — 서버 URL, 인증, CORS 등이 사용자 환경별 다르므로 라이브러리에 포함하기에 부적절

### 사용 예시 (현재로도 가능)

```typescript
const editor = await createRhwpEditor(container);
// ... 편집 ...
const bytes = editor.exportHwp();  // Uint8Array 반환

// 사용자 측 서버 업로드
await fetch('/api/upload-hwp', {
    method: 'POST',
    body: bytes,
    headers: { 'Content-Type': 'application/x-hwp' },
});
```

## 검토 결론

### 작성자 의도 명확화 필요

작성자의 진짜 요구사항:
- (A) **bytes 반환 API 를 모르고 있어서** — 이미 있다는 안내만 필요
- (B) **rhwp 가 직접 서버 업로드 처리** — fetch URL / 인증 등을 라이브러리가 알아서 처리하는 형태
- (C) **다른 export 형식** — PDF / 이미지 / 텍스트 등 (HWP/HWPX 외)
- (D) **서버 업로드 helper** — `editor.uploadTo(url)` 같은 sugar API

### 후보 (B) 의 검토

라이브러리가 직접 서버 업로드를 수행:
- ❌ **CORS 정책** — 라이브러리 측에서 결정 못함
- ❌ **인증 처리** — JWT / OAuth / 쿠키 등 사용자 환경별 다름
- ❌ **서버 응답 처리** — 성공 / 실패 / 진행률 / 재시도 등 사용자 측 정책
- ❌ **에러 처리** — UI / 알림 / 로그 등 사용자 측 정책

→ 라이브러리에 직접 포함 부적절. **사용자 측 코드로 fetch 처리 권장**.

### 후보 (D) helper 검토

`editor.uploadTo(url, options?)` 같은 형태:
- ⚠️ 라이브러리 책임 영역 확장 — 인증 / 헤더 / 재시도 등
- ⚠️ 사용자가 직접 작성하는 한 줄 fetch 와 차이 작음
- ⚠️ 다른 라이브러리 (axios / ky 등) 와 통합 시 충돌 가능성

→ 가치 작음. **README / 매뉴얼에 사용 예시 추가** 가 더 합리적.

### 후보 (C) 다른 export 형식

- PDF: rhwp 에 PDF 출력 코드 있음 (Rust). 그러나 작성자 의도는 HWP/HWPX 업로드로 추정
- 이미지: 페이지별 SVG/PNG export 가능 (이미 있음 — `export-svg`, `--embed-fonts` 등)
- 텍스트: `export_text_markdown` (Task #237) 이미 있음

## 권장 응답 — 후보 (A) 안내 + (D) 검토 의견 요청

작성자에게 다음 정보 안내:

1. **현재 이미 가능한 흐름** — `exportHwp() / exportHwpx()` 가 bytes 반환, 사용자 측에서 `fetch()` 로 서버 업로드 가능 (코드 예시 포함)
2. **라이브러리 직접 업로드 API 의 한계** — CORS / 인증 / 에러 처리 등 사용자 환경 의존성
3. **README / 매뉴얼 보강 후보** — "서버 업로드 사용 예시" 추가 가치 있음
4. **추가 의견 요청** — 위 흐름이 충족시키는지, 또는 더 세부적인 요구사항이 있는지

## 처리 방향 후보

### 옵션 A: 안내 댓글 + 보류

작성자에게 현재 가능한 흐름 안내 + 추가 의견 요청. 명확한 요구사항이 들어오면 그 시점에 task 결정.

### 옵션 B: README / 매뉴얼 보강 task 등록

`npm/editor/README.md` 또는 `mydocs/manual/` 에 "서버 업로드 사용 예시" 추가. 사용자가 발견하기 쉽게.

### 옵션 C: 제안 close + 라벨 정리

기존 API 로 가능 → enhancement 라벨 적합 안 함, close + "이미 가능" 안내.

## 권장

**옵션 A (안내 + 의견 요청)**:

1. 현재 가능한 흐름 안내 (코드 예시 포함)
2. 라이브러리 직접 업로드의 한계 설명
3. 추가 요구사항 확인 (작성자가 이미 이를 알고 있는데 다른 의도였는지)
4. 응답에 따라 옵션 B (매뉴얼 보강) 또는 옵션 C (close)

정중하고 차분한 톤으로 작성 (메모리 원칙 부합).

## 다음 단계

작업지시자 결정 부탁드립니다 (옵션 A / B / C).
