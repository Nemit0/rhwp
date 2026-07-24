---
PR: 586
title: "ffi csharp 구현"
author: nameofSEOKWONHONG (SEOKWON HONG, rhwp 첫 PR — 작업지시자 assign 처리됨)
issue: 403 (AI 워크로드를 위한 FFI 인터페이스 개발, OPEN, M100)
base: devel (d1dbd85 — 본 환경 devel 9 commit 전, PR #553 rollback 직후 시점)
head: 04eef95 (단일 commit)
mergeable: MERGEABLE (BEHIND), CI 모두 SUCCESS
---

# PR #586 검토 보고서 — 단일 commit cherry-pick 적합

**PR**: [#586 ffi csharp 구현](https://github.com/edwardkim/rhwp/pull/586)
**작성자**: @nameofSEOKWONHONG (SEOKWON HONG, rhwp 첫 PR — 환영)
**처리 결정**: ✅ **cherry-pick `04eef95` 단일 commit**

## 1. 처리 결과 요약

| 항목 | 결과 |
|------|------|
| 결정 | cherry-pick 단일 commit `04eef95` |
| 사유 | (1) 신규 영역만 추가 (`bindings/Native/` + `bindings/csharp/` + mydocs Stage 1-4) — 본 환경 어떤 코드도 변경 안 함 (2) FFI 안전성 + C# P/Invoke 정합 모두 우수 (3) Issue #403 (M100 AI 워크로드 FFI) closes |
| base skew 영향 | 0 (단일 commit 이 신규 파일 12 개만 추가, deletion 영역과 무관) |
| CI | All SUCCESS (Build & Test + CodeQL js-ts/python/rust + Build aggregate). WASM Build SKIPPED (FFI 영역과 무관) |
| 결정적 검증 | ✅ `bindings/Native/` cargo build 성공 + `cargo test --lib` 1125 passed (회귀 0) + `cargo build --release` |
| 시각 판정 | 불필요 (FFI ABI 영역, 렌더링 무영향) |

## 2. PR 정보

| 항목 | 값 |
|------|-----|
| 분기점 | `d1dbd85` (PR #553 rollback 직후, 본 devel 의 9 commit 전) |
| commits | 1 (`04eef95` "ffi csharp 구현") |
| changedFiles | 12 (모두 신규 파일) |
| additions | 1,137 / deletions 0 |
| Issue 연결 | #403 (M100 v1.0.0 milestone, label: enhancement, assignee 정합) |
| 작업지시자 절차 정합 | ✅ Stage 1-4 + 계획서/구현계획서/최종보고서 완비 |

## 3. 본질 평가 — FFI ABI 우수

### 3.1 영역 (12 file, +1,137)

| 경로 | 역할 |
|------|------|
| `bindings/Native/Cargo.toml` | cdylib 공통 Native ABI 크레이트 (rhwp 를 path dependency 로 참조) |
| `bindings/Native/src/lib.rs` | `rhwp_export_text` / `rhwp_export_markdown` / `rhwp_string_free` C ABI (+330 lines) |
| `bindings/Native/.gitignore` | target/ 제외 |
| `bindings/csharp/RhwpNative.cs` | C# P/Invoke wrapper (+63 lines) |
| `bindings/README.md` | bindings 구조 문서 |
| `mydocs/plans/task_m100_403.md` + `_impl.md` | 수행/구현 계획서 |
| `mydocs/working/task_m100_403_stage1.md` ~ `stage4.md` | Stage 1-4 단계 보고서 |
| `mydocs/report/task_m100_403_report.md` | 최종 보고서 |

### 3.2 Rust FFI 안전성 (lib.rs)

✅ **Null pointer 검증**: `read_utf8` 헬퍼가 ptr null 시 즉시 한국어 에러 반환
✅ **UTF-8 검증**: `CStr::from_ptr().to_str()` 명시적 검증 + 비-UTF-8 시 한국어 에러
✅ **Panic safety**: `std::panic::catch_unwind` 로 Rust panic 이 C 측으로 unwind 안 되도록 차단 — FFI 표준 best practice
✅ **메모리 관리**: `CString::into_raw()` 반환 + 명시적 `rhwp_string_free` 함수 — 호출자 책임 명확
✅ **NUL byte 처리**: `CString::new` 실패 시 fallback error_json (NUL 포함 결과 문자열도 처리)
✅ **에러 모델**: `{"ok":true/false, "error":"..."}` 단일 JSON — 모든 언어 binding 에서 균일

### 3.3 본 환경 API 활용

`HwpDocument` (wasm_api 의 wrapper) 의 `Deref<DocumentCore>` 또는 메서드 forwarding 으로:
- `extract_page_text_native` (`document_core/queries/rendering.rs:1710`)
- `extract_page_markdown_with_images_native` (`document_core/queries/rendering.rs:1774`)
- `get_control_image_mime_native` / `get_control_image_data_native` (`wasm_api.rs`)
- `get_bin_data_image_mime_native` / `get_bin_data_image_data_native` (`document_core/commands/clipboard.rs:1186/1171`)

→ 본 환경 코드 변경 없이 기존 native 메서드 활용. 정합.

### 3.4 C# P/Invoke (RhwpNative.cs)

✅ **DllImport Cdecl 정합** + `NativeLibraryName = "rhwp_native_ffi"` 정합
✅ **UTF-8 null-terminated byte array 변환** (Encoding.UTF8.GetBytes + Array.Resize +1)
✅ **`Marshal.PtrToStringUTF8` + finally 절에서 `rhwp_string_free` 해제** — leak 안전 try/finally 패턴
✅ **null 입력 검증** (ArgumentNullException) + null 결과 검증 (InvalidOperationException)

## 4. 결정적 검증 (모두 통과)

| 게이트 | 결과 |
|--------|------|
| `cd bindings/Native && cargo build` | ✅ rhwp-native-ffi v0.1.0 + rhwp v0.7.9 둘 다 Finished |
| `cargo test --lib --release` | ✅ 1125 passed (회귀 0, 직전 PR #558 와 동일) |
| `cargo build --release` | ✅ Finished |
| CI | All SUCCESS |

## 5. 시각 판정 — 불필요

PR #586 은 **FFI ABI 영역만 추가** (본 환경 렌더링/파서 무변경). 메모리 `feedback_visual_regression_grows` 의 시각 게이트 적용 영역 아님 — 결정적 검증 (cargo build + cargo test) 으로 충분.

## 6. 잠재 후속 사항 (본 PR 채택과 무관)

본 PR 의 본질은 **첫 번째 FFI 사용 사례**로 충분히 정합. 다만 향후 사이클에서 다음 검토 가치:
- root `Cargo.toml` 의 workspace member 등록 (현재 분리되어 CI 빌드 안 됨)
- bindings/Native/ 단독 CI 워크플로 (`cargo build` + `cdylib` 산출물 검증)
- C#/Java/Python/Node 언어별 binding 확장

이 사항들은 본 PR 의 후속 사이클로 분리 가능. **본 PR 자체는 채택 적합**.

## 7. 컨트리뷰터 안내 (close 댓글)

- **첫 PR 환영** + **하이퍼-워터폴 단계 절차 정합** 인정 (Stage 1-4 + 계획서/구현계획서/최종보고서 완비)
- **FFI 안전성 우수 평가** (panic safety + 명시적 메모리 해제 + UTF-8 검증)
- **C# P/Invoke 정합** (try/finally leak 안전 패턴)
- **Issue #403 closes** 정합
- **다음 PR 시 base 동기화 권장** (현재 base `d1dbd85` 가 devel 기준 9 commit 전, 비교적 가까운 편이라 충돌 0)

## 8. 본 사이클 사후 처리

- [x] cherry-pick `04eef95` 단일 commit (충돌 0)
- [x] 결정적 검증 (bindings/Native build + cargo test 1125 + release build)
- [ ] local/devel → devel merge + push
- [ ] PR #586 close + 환영 댓글
- [ ] Issue #403 close
- [ ] 본 검토 문서 archives 보관
