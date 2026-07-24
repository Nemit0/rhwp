# PR #284 검토 — Task #280: 수식 SVG 폰트 스택 재정렬 (Cambria Math 제거)

## PR 정보

- **PR**: [#284](https://github.com/edwardkim/rhwp/pull/284)
- **이슈**: [#280](https://github.com/edwardkim/rhwp/issues/280)
- **작성자**: @planet6897 (Jaeuk Ryu)
- **base/head**: `devel` ← `local/task280`
- **Mergeable**: ✅ CLEAN
- **검토일**: 2026-04-24

## 변경 요약

Windows 기본 환경에서 수식 SVG가 "볼드처럼 두껍게" 렌더링되던 버그 수정.

**핵심 변경 (코드 2줄):**

| 파일 | 변경 |
|------|------|
| `src/renderer/equation/svg_render.rs:11` | `EQ_FONT_FAMILY` 상수 폰트 스택 재정렬 |
| `src/renderer/equation/canvas_render.rs:223` | `set_font` Canvas 스택 동기화 |

**스택 변경:**
```
- 'Latin Modern Math', 'STIX Two Math', 'Cambria Math', 'Pretendard', serif
+ 'Latin Modern Math', 'STIX Two Text', 'STIX Two Math', 'Times New Roman', 'Times', serif
```

## 루트 원인 분석

Windows 기본 환경에서 `Latin Modern Math`, `STIX Two Math`는 미설치 → **Cambria Math**(Office 설치 시 자동 포함)가 매칭. Cambria Math는 수학 디스플레이용 heavy-stroke 폰트라 일반 Times 세리프보다 확연히 두꺼워 "볼드"로 인지됨.

## 설계 근거 검증

| 설계 요소 | 평가 |
|----------|------|
| `Latin Modern Math` 첫 번째 유지 | ✅ `svg.rs:332` 의 `--embed-fonts` 파이프라인이 "Latin Modern Math" 키 고정 사용. 호환성 보존. |
| `STIX Two Text` 추가 | ✅ STIX 설치 환경(Mac 등)에서 Math 변형보다 얇은 본문용 매칭. |
| `Times New Roman`, `Times` 추가 | ✅ Windows/Mac/Linux 공통. Windows에서 볼드 인상 해소 포인트. |
| `Cambria Math` 제거 | ✅ 볼드 인상 근본 원인 제거. |
| `Pretendard` 제거 | ✅ 산세리프(한글+라틴 sans)이므로 수식 부적합. 타당. |

## 조사 품질 — "lim 1.2x 확대 규칙" 가설 기각

이 PR의 실질적 가치. PDF 콘텐츠 스트림 `/F1 110 Tf ... lim ...` vs `/F1 92 Tf ... f(2+h) ...` 에서 `lim=110pt`, 본문=92pt로 보여 "함수명 확대 규칙" 의심.

**검증 데이터** (`samples/exam_math.hwp` 16개 수식 bbox 높이 측정):

| 수식 | bbox 높이 | font_size 대비 |
|------|-----------|----------------|
| `"b= log 2"` | 1125 HWPUNIT | 1.02x (단순 수식과 동일) |
| `"1"`, `"5"` (단일 숫자) | 1125 | 1.02x |
| `"f left(1 right)"` | 1125 | 1.02x |
| `"f(x)=x³-8x+7"` (위첨자) | 1313 | 1.19x |

→ `log`가 확대되면 bbox≈1320이어야 하나 1125 → **함수명 1.2x 규칙 없음** 데이터로 확정.

**결론**: PDF의 110/92 차이는 HyhwpEQ 폰트의 ASCII 글리프(l,i,m) vs PUA 수식 글리프(f,h,(,)) em 박스 차이를 HWP 엔진이 보정한 것. 잘못 적용했으면 `log`, `sin`, `cos`, `ln` 등 다른 함수명이 깨졌을 것.

가설 검증을 단일 근거(PDF 숫자)가 아닌 다수 샘플 bbox 교차 비교로 수행한 점이 높은 검증 품질.

## 메인테이너 검증 결과

로컬에서 PR 브랜치 체크아웃 후 검증 수행:

| 항목 | 결과 |
|------|------|
| `cargo test --lib equation` | ✅ **48 passed / 0 failed** |
| `cargo test --test svg_snapshot` | ✅ **3 passed / 0 failed** |
| `cargo clippy --lib -- -D warnings` | ✅ clean |
| `cargo check --target wasm32-unknown-unknown --lib` | ✅ clean |
| `cargo test --lib` 전체 | ✅ **963 passed / 0 failed / 1 ignored** |

PR 설명에서 언급된 "14건 pre-existing fail"은 로컬 검증에서는 **0건**. 최근 devel 변경으로 자연 해소된 것으로 보임.

## 문서 품질

CLAUDE.md 절차 준수 확인:

- ✅ 수행계획서: `mydocs/plans/task_m100_280.md`
- ✅ 구현계획서: `mydocs/plans/task_m100_280_impl.md`
- ✅ 단계별 보고서: `stage1.md` ~ `stage4.md` + 시각 비교 PNG
- ✅ 최종 보고서: `mydocs/report/task_m100_280_report.md`
- ✅ orders 갱신: `mydocs/orders/20260424.md` Task #280 섹션
- ✅ 파일명 규칙: `task_m100_{번호}_stage{N}.md` 형식 준수

## 시각 회귀 검증

**PR 작성자 검증 (증빙 포함):**
- `samples/equation-lim.hwp`: before/after/pdf 3종 비교 — 볼드 인상 해소 확인 (PNG 증빙)
- `samples/exam_math.hwp` 5개 페이지 (p001/005/009/013/017):
  - p013 `lim`/`sin`/`ln`/`∫` 동시 렌더 → 모두 본문과 동일 크기 (함수명 1.2x 없음 재증명)
  - 분수, 제곱근, 집합 기호(∩∪), 벡터 화살표, 이탤릭 변수 모두 정상
- 특수 기호(→, √, ∫, ∑, ∩, ∪) 브라우저 폴백 정상

**메인테이너 WASM 브라우저 검증 (2026-04-24):**
- Docker로 WASM 재빌드: `pkg/rhwp_bg.wasm` 갱신 (12:46)
- rhwp-studio (Vite 7700) + 호스트 Chrome 에서 실기기 시각 확인
- 작업지시자 최종 판정: **검증 성공** — 수식 볼드 인상 해소 확인

## 리스크 평가

| 리스크 | 판정 |
|--------|------|
| 레이아웃 계산 영향 | ✅ 없음. 폰트 문자열만 변경, 레이아웃 로직 불변. |
| SVG 스냅샷 회귀 | ✅ 3 passed. 스냅샷이 font-family 리터럴을 포함하지 않아 깨지지 않음. |
| LaTeX 설치 환경 회귀 | ✅ `Latin Modern Math` 첫 번째 유지로 기존 동작 보존. |
| 폰트 임베딩 파이프라인 | ✅ `svg.rs:332` "Latin Modern Math" 키 변경 없음. |
| wasm32 호환성 | ✅ `cargo check` 통과. `canvas_render.rs`도 동기화됨. |

## 범위 외 후속 이슈

PR에서 명시적으로 범위 분리:
- **[#283](https://github.com/edwardkim/rhwp/issues/283)** — 괄호 `(` `)` SVG path 폭 조정 (Phase 2, 별도 이슈 등록 완료 → PR #285에서 처리 중)
- 두 렌더러의 폰트 스택 중복 제거 리팩터 (공용 상수 추출) — 후속 이슈 후보

## 판정

✅ **Merge 권장**

**사유:**
1. 코드 변경 범위가 **2줄**로 매우 명확하고 안전
2. 루트 원인 분석 + 가설 기각(1.2x 규칙) 과정이 **데이터 기반**으로 설득력 있음
3. 빌드/테스트/clippy/wasm 모두 통과
4. CLAUDE.md 하이퍼-워터폴 절차 완전 준수
5. 설계 근거가 `svg.rs:332` 임베딩 파이프라인 호환까지 고려한 품질

**Merge 후속 작업:**
- 이슈 #280 자동 클로즈 확인 (커밋 메시지 `Closes #280` 포함)
- PR #285 (#283 후속) 검토로 이어감
