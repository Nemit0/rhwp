# PR #292 검토 — Task #290: cross-run 탭 감지가 inline_tabs 무시

## PR 정보

- **PR**: [#292](https://github.com/edwardkim/rhwp/pull/292)
- **이슈**: [#290](https://github.com/edwardkim/rhwp/issues/290) (이미 closed)
- **작성자**: @planet6897 (Jaeuk Ryu)
- **base/head**: `devel` ← `local/task290`
- **Mergeable**: ⚠️ 원래 CONFLICTING (orders 1건만 충돌, 코드 자동 merge 성공)
- **CI**: ✅ 전부 SUCCESS (원본)
- **검토일**: 2026-04-24

## 변경 요약

`samples/exam_math.hwp` p.7 #18 "수열" 문항 첫 줄이 좌측 단의 우측 끝으로 밀려 렌더되던 버그 수정. **cross-run 탭 감지 블록 2곳이 `composed.tab_extended` (inline_tabs) 무시**하고 TabDef만 봐서 LEFT inline 탭이 RIGHT로 오판되던 문제.

### 핵심 변경 (코드 3개 파일)

| 파일 | 변경 | 설명 |
|------|------|------|
| `src/renderer/layout/paragraph_layout.rs` | +86 -24 | 신규 헬퍼 `resolve_last_tab_pending` + cross-run 블록 2곳 교체 (est + render) + `inline_tab_cursor_*` 도입 |
| `src/renderer/layout/tests.rs` | +83 | 단위 테스트 5건 (task290_*) |
| `tests/tab_cross_run.rs` | +58 | 통합 테스트 1건 (신규) |

### 결과
- "수" 글리프 x: `290.91` → **`109.80`** (PDF 일치)
- 14 글자 모두 일관되게 **-181.11 px 좌측 이동**

## 루트 원인 분석

### IR 관찰 (paragraph 0.144)

```
text     : "18.\t\t\t수열 이 모든 자연수 에 대하여"
tab_def  : [12.0mm(L), 13.3mm(L), 18.0mm(L), 18.6mm(L)]  auto_tab_right=true
inline   : [132,_,256,...] [671,_,256,...] [79,_,256,...]  # ext[2]=0x0100 → LEFT
```

### 버그 메커니즘 (임시 `RHWP_TRACE290` 확정)

1. Run `"18.\t\t\t"` 의 3개 `\t` 는 inline 경로에서 LEFT로 x=38.24 진행 (정상)
2. 그러나 cross-run 감지는 TabDef만 봄 → `abs_before=37.19` > 모든 stops → **`auto_tab_right` 폴스루** → type=1 (RIGHT) 반환
3. `pending_right_tab_render = Some((420.11, 1))` 설정
4. 다음 run `"수열 이 모든 자연수 "` 배치 시 `x = col_area.x + 420.11 - next_w(201.00) = 290.91` 로 역산 → **우측 끝 배치**

### ext[2] 포맷 실증 (Stage 1)

RIGHT 샘플 (`samples/hwp-3.0-HWPML.hwp` `저작권\t1`) 확보 + 트레이스 비교:

| 케이스 | ext[2] | 16진 | high | low |
|--------|--------|------|------|-----|
| exam_math #18 (LEFT × 3) | 256 | `0x0100` | 1 | 0 |
| hwp-3.0-HWPML 저작권 (RIGHT, fill=3) | 515 | `0x0203` | 2 | 3 |

→ **ext[2] = high/low 바이트 합성** (high=탭 종류 enum+1, low=fill_type)

## 수정 내역

### 신규 헬퍼 `resolve_last_tab_pending`

```rust
pub(crate) fn resolve_last_tab_pending(
    run_text: &str, last_inline_idx: usize, tab_extended: &[[u16; 7]],
    text_style: &TextStyle, tab_stops: &[TabStop], tab_width: f64,
    auto_tab_right: bool, available_width: f64,
) -> Option<(f64, u8)> {
    // 1) inline_tabs 가 마지막 \t 커버: ext[2] 고바이트로 종류 판정
    if last_inline_idx < tab_extended.len() {
        let inline_type = ((tab_extended[last_inline_idx][2] >> 8) & 0xFF) as u8;
        match inline_type {
            0 | 1 => return None,  // LEFT → pending 없음 (본 수정 핵심)
            2 | 3 => {}            // RIGHT/CENTER → TabDef 경로 폴스루
            _ => return None,      // 미지 → 보수적 LEFT
        }
    }
    // 2) inline 없음 or LEFT 아님 → 기존 find_next_tab_stop 경로
    /* ... */
}
```

### cross-run 블록 2곳 교체 + cursor

- **est 측** (`:840`): `inline_tab_cursor_est: usize = 0` 도입
- **render 측** (`:1198`): `inline_tab_cursor_render: usize = 0` 도입
- 루프 말미 + char_overlap `continue` 직전에 `cursor += run.text.chars().filter(|c| *c == '\t').count()`
- `composed.tab_extended` 는 parser에서 `0x0009` (TAB) 마다 1개씩 push → `\t` 카운트와 정확히 일치

## 설계 검증

| 설계 요소 | 평가 |
|----------|------|
| `resolve_last_tab_pending` 헬퍼 중앙화 | ✅ #142 교훈 ("같은 데이터 다른 경로 동기화")를 헬퍼로 실현 |
| inline_tabs 우선 + TabDef 폴백 | ✅ 양쪽 정보 소스를 계층적으로 통합. LEFT inline은 TabDef 건너뜀 |
| ext[2] 고바이트 판정 | ✅ Stage 1 RIGHT 샘플로 실증. `>> 8 & 0xFF` 로 명확 추출 |
| `inline_tab_cursor_*` 관리 | ✅ `\t` 카운트로 정확히 추적. char_overlap continue 경로도 커버 |
| LEFT → None 반환 | ✅ pending 없음 = 다음 run이 정상 누적 배치 (핵심) |
| RIGHT/CENTER → TabDef 폴스루 | ✅ 기존 경로 재사용. 회귀 위험 최소 |
| 미지 값 보수적 LEFT | ✅ 4=DECIMAL 등 미지원 탭에서도 안전 동작 |

## 회귀 검증 (작성자 증빙)

**184 페이지 중 1 페이지만 변경** (의도 100%):

| 문서 | 변경 / 전체 |
|------|------------|
| exam_math.hwp | **1 / 20** (p.7 item 18 의도된 수정) |
| biz_plan.hwp | 0 / 6 |
| exam_eng.hwp | 0 / 11 |
| exam_kor.hwp | 0 / 25 |
| hwp-3.0-HWPML.hwp | 0 / 122 (**RIGHT inline tab `저작권\t1` 회귀 없음**) |

**git worktree baseline diff** 로 byte-level 자동 검증.

## 메인테이너 검증 결과

### PR 브랜치 + devel merge 후

| 항목 | 결과 |
|------|------|
| `cargo test --lib` | ✅ **988 passed / 0 failed / 1 ignored** (983 + 5 신규 task290 단위) |
| `cargo test --test svg_snapshot` | ✅ 6 passed |
| `cargo test --test tab_cross_run` | ✅ 1 passed (신규 통합 테스트) |
| `cargo clippy --lib -- -D warnings` | ✅ clean |
| `cargo check --target wasm32` | ✅ clean |

### CI (GitHub Actions, 원본 브랜치)

| Check | 결과 |
|-------|------|
| CI / Build & Test | ✅ SUCCESS |
| CodeQL / rust | ✅ SUCCESS |
| CodeQL / js+py | ✅ SUCCESS |

## 충돌 분석

- **충돌 파일**: `mydocs/orders/20260424.md` 단 1개 (문서)
- **코드 충돌**: 없음 — `paragraph_layout.rs` 자동 merge 성공 (#289 변경과 상호 배타 영역)
- **원인**: Task #290 섹션과 devel의 Task #288 섹션이 같은 위치 추가
- **해결**: Task #290 → "## 6", Task #288 → "## 7" 로 재배치 (메인테이너 직접)

## 범위 외 후속 과제 (작성자 기록)

1. **inline_tabs RIGHT/CENTER 렌더 경로** (`text_measurement.rs:217, 320`): `ext[2]` 를 전체 u16 으로 해석 → 실제 HWP 값(최소 256)과 매칭 안 됨 → inline RIGHT/CENTER 경로 도달 불가. 별도 이슈 후보.
2. **TabDef `/2.0` 스케일** (`style_resolver.rs:640`): #142, #159 에서 확정되었으나 잠재 경계 케이스. 본 타스크 범위 외.

## 문서 품질

CLAUDE.md 절차 완전 준수:

- ✅ 수행계획서: `mydocs/plans/task_m100_290.md`
- ✅ 구현계획서: `mydocs/plans/task_m100_290_impl.md`
- ✅ 단계별 보고서: `stage1/2/3/4.md`
- ✅ 시각 비교 PNG: `stage3/p7_{before,after,pdf}.png`
- ✅ 최종 보고서: `mydocs/report/task_m100_290_report.md`
- ✅ 트러블슈팅 갱신: `mydocs/troubleshootings/tab_tac_overlap_142_159.md` #290 섹션 추가 (#142 교훈 확장 기록)

## 리스크 평가

| 리스크 | 판정 |
|--------|------|
| RIGHT inline tab 회귀 | ✅ hwp-3.0-HWPML.hwp 122 페이지 byte-identical 확인 |
| cursor 동기화 오류 | ✅ `chars().filter('\t')` 카운트로 단순. char_overlap continue도 커버 |
| 미지 탭 종류 (4=DECIMAL 등) | ✅ 보수적 LEFT (None) 반환 — 기존 동작 보존 |
| wasm32 호환 | ✅ cargo check 통과 |
| 통합 테스트 1건만 | ⚠️ 더 많은 LEFT inline 샘플 편입이 이상적이나 회귀 184 페이지 검증으로 충분 |

## 판정

✅ **Merge 권장**

**사유:**
1. **루트 원인 추적 정확** — 임시 `RHWP_TRACE290` 트레이스로 "pending_right_tab = Some((420.11, 1)) → x_after=290.91" 전 경로를 숫자로 연결
2. **#142 교훈 재적용** — "같은 데이터 다른 경로 동기화"를 헬퍼 중앙화로 실현. 트러블슈팅 문서에 교훈 확장 기록
3. **184 페이지 회귀 0** — `git worktree` baseline diff로 객관적 검증
4. **범위 의식적 제어** — inline_tabs RIGHT/CENTER 렌더 버그 발견해도 별도 이슈로 분리. 회귀 위험 관리
5. 빌드/테스트/clippy/wasm + CI 모두 통과 (**988 passed**, svg_snapshot 6, tab_cross_run 1)
6. CLAUDE.md 절차 완전 준수 + 트러블슈팅 문서까지 갱신

**Merge 전략:**
- orders 문서 충돌 메인테이너 직접 해결 완료
- planet6897/local/task290 에 push 완료 (`bc6c46d..206e265`)
- 재승인 후 admin merge

**후속 이슈 후보:**
- inline_tabs RIGHT/CENTER 렌더 경로 (`text_measurement.rs` 영구 도달 불가 버그)
