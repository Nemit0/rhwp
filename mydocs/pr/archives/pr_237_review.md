# PR #237 검토 문서

## PR 정보

| 항목 | 내용 |
|------|------|
| PR 번호 | [#237](https://github.com/edwardkim/rhwp/pull/237) |
| 작성자 | [@nameofSEOKWONHONG](https://github.com/nameofSEOKWONHONG) |
| 제목 | text 생성과 markdown 생성 기능을 추가합니다 |
| base ← head | **devel ← nameofSEOKWONHONG:main** (Fork의 main) |
| 변경 | +1,567 / -35 (19 파일, 18 커밋) |
| mergeable | `behind` — base(devel)가 앞서있음 |
| Clippy CI | ❌ **실패** — src/ios_ffi.rs 11건 경고 |

## 작성자 의도

CLI에 두 가지 내보내기 명령 추가:
- `rhwp export-text <파일>` — 텍스트 추출
- `rhwp export-markdown <파일>` — 마크다운 변환

## 변경 내용 분석

### 핵심 기능 (실제 본인 작업)

| 파일 | 변경 | 비고 |
|------|------|------|
| `src/main.rs` | +391 | `export-text`, `export-markdown` CLI 커맨드 |
| `src/document_core/queries/rendering.rs` | +298 | 텍스트/마크다운 추출 쿼리 |

### 범위 외 변경 (다른 PR의 머지 내용)

이 PR에는 작성자 본인 작업이 아닌 **17개의 머지 커밋**이 포함되어 있습니다:

- `Merge pull request #134, #135, #152, #153, #154, #200, #201, #203` — 이미 devel에 머지된 PR들
- `docs: v0.7.3 / 확장 v0.2.1 릴리즈 문서 정비` — 다른 사람 작업
- `docs(readme): oosmetrics 배지 추가` — 다른 사람 작업
- `docs(readme): README_EN 동기화` — 다른 사람 작업
- `docs: 상용 제품명 일반화` — 다른 사람 작업

→ **작성자의 실제 커밋은 단 1개** (`1200118`) + merge 커밋 1개 (`838c735`)

### 범위 외 파일 변경 목록

이미 merge된 기능과 문서가 diff에 포함됨:

- `src/parser/cfb_reader.rs` — Windows 경로 수정 (이미 merge됨, PR #152)
- `src/parser/hwpx/header.rs`, `reader.rs` — zip bomb 방어 (이미 merge됨, PR #153)
- `src/document_core/commands/clipboard.rs` — 출처 불명
- `mydocs/feedback/*.md` 4개 — 다른 사람 작업
- `mydocs/release/*` 3개 — 다른 사람 작업
- `mydocs/plans/task_m100_196.md`, `mydocs/report/task_m100_196_report.md`, `mydocs/working/task_m100_196_stage3.md` — 이미 merge된 타스크 문서
- `README.md`, `rhwp-chrome/README.md` — 다른 사람 변경

## 주요 문제점

### 1. Fork 워크플로우 위반 (Critical)

**Fork의 `main` 브랜치에서 직접 작업**

```
현재:  nameofSEOKWONHONG:main → edwardkim:devel
올바름: nameofSEOKWONHONG:feature/export-text-markdown → edwardkim:devel
```

Fork의 main은 upstream main과 동기화용으로만 써야 합니다. 여기서 작업하면 upstream 변경과 섞여서 diff가 깨끗하지 않습니다.

### 2. Base Behind (Critical)

PR의 base가 최신 devel보다 뒤처짐 → 이미 merge된 커밋들이 diff에 중복 포함됨

### 3. 관련 이슈 없음

PR body의 `closes #` 에 번호가 비어있음. 하이퍼-워터폴 절차상 **Issue 등록 → PR**이 기본이어야 함.

### 4. Clippy CI 실패

`src/ios_ffi.rs`에 **raw pointer dereference clippy 경고 11건**:

```
error: this public function might dereference a raw pointer but is not marked `unsafe`
  --> src/ios_ffi.rs:148:23, 158:41, 166:37, ...
```

본인 체크리스트에는 `cargo clippy -- -D warnings 통과`로 체크되어 있으나 **실제로는 실패**. 확인 없이 체크한 것으로 보임.

> 참고: `ios_ffi.rs`는 iOS 확장 작업(#83)에서 온 파일이라 이 PR 작성자 책임은 아님. 그러나 devel 기준으로 rebase 후 재push하면 해결될 가능성 있음.

### 5. PR Description 부실

- 관련 이슈 번호 누락
- 스크린샷 섹션 비어있음
- 기능 설명이 1줄 (CLI 명령 예시만)
- SVG 내보내기 확인, WASM 렌더링 확인 체크 안 함

## 평가

### 기능 자체의 가치

`export-text`, `export-markdown` CLI 명령은 **유용한 기능**입니다:
- AI 파이프라인에 HWP 입력 시 텍스트 추출 필수
- 마크다운 변환은 블로그/위키 통합에 유용
- rhwp의 출력 다양성을 넓힘

### 코드 품질

- 본 기능 코드 자체는 상당히 큼 (+689 라인)
- `rendering.rs` 확장, CLI 파싱 추가
- 상세 검토 필요 (diff가 너무 커서 현 상태로는 리뷰 어려움)

### 치명적 문제

깨끗하지 않은 PR 상태로는 리뷰/merge 불가:
- 작성자 본인 커밋과 다른 사람 커밋이 섞여 있음
- 이미 devel에 있는 변경들이 diff에 포함됨
- Clippy 실패

## 권장 처리

**기능 자체는 환영하되, PR 전면 재작업 요청**

재제출 시 요구사항:
1. Fork를 upstream devel로 sync
2. **깨끗한 feature 브랜치**에서 본인 작업만 커밋
3. 본인 작업을 1~3개 논리 단위 커밋으로 정리
4. 관련 GitHub Issue 등록 후 PR body에 `closes #N` 명시
5. Clippy 실패 원인(ios_ffi.rs) → devel rebase로 해결되는지 확인
6. PR description에 기능 상세, 사용 예시, 테스트 결과 작성

## 브랜치

검토용 로컬 체크아웃은 **수행하지 않음**. 현재 PR 상태로는 유의미한 검증 불가능. 재제출 후 검토.

## 최종 판단 (예정)

현재 상태로는 **재작업 요청 + PR close**가 권장됨. 기능 자체를 환영하는 피드백과 함께 구체적 가이드를 제공한다.
