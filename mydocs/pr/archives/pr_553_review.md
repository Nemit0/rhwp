# PR #553 검토 보고서 — Rollback 결정

**PR**: [#553 Task #511: HWP3 Square wrap 렌더링 보완 6-13 + narrow zone 정정](https://github.com/edwardkim/rhwp/pull/553)
**작성자**: @jangster77 (Taesup Jang)
**처리 결정**: ❌ **Rollback (cherry-pick 진행 후 시각 판정 미통과로 되돌림)**
**처리일**: 2026-05-04

## 1. 처리 결과 요약

| 항목 | 결과 |
|------|------|
| 결정 | Rollback — cherry-pick 진행 후 시각 판정 미통과로 되돌림 |
| 사유 | hwp3-sample5-hwp5 page 4 + page 8 의 그림 + 문단 배치 결함 (작업지시자 시각 판정 수용 불가) |
| 본 환경 영향 | 0 (devel push 안 됨, local/devel reset --hard 로 정합 복원) |
| PR 본질 평가 | ✅ 본질 정정 자체는 정합 (HWP3 보완 + narrow zone + composer + samples) |
| 시각 판정 미통과 영역 | HWP3 Square wrap 그림 아래 텍스트 y위치 (Task #546 trade-off, PR 본문 명시 영역) |
| 컨트리뷰터 처리 | PR #553 close + page 4/8 결함 정정 후 재 PR 요청 |

## 2. PR 정보 (정합한 영역)

| 항목 | 값 | 평가 |
|------|-----|------|
| 분기점 | `b84c5e9` (본 환경 devel 의 마지막 commit, Task #528 처리 후속) | ✅ **fork devel 동기화 정합** (PR #538/#551 와 다름 — 모범 사례) |
| commits | 5 (본질 2 + samples 1 + merge/restore 4) | 정합 |
| changedFiles | 26 / +1,212 / -79 | 정합 |
| mergeStateStatus | CLEAN | ✅ |
| CI | All SUCCESS | ✅ |
| Task #546 정합 명시 | ✅ "task460 보완5 (`82e41ba`) 코드는 Task #546 정합 유지를 위해 의도적으로 미포함" | ✅ |

## 3. 작업지시자 의도 — 옵션 C 통합 + 향후 통합 정리

작업지시자 인용:
> 제 판단의 기준은 이번 PR 을 C 방식으로 채택하고, 나중에 한 번더 전체적인 회귀를 통해 페이지네이션 계산을 정리하면 된다고 판단했기 때문입니다.

→ **옵션 C 통합** (Task #525 호출 제거 유지 + Task #511 의 `wrap_precomputed` 인프라 도입) cherry-pick 진행.

## 4. cherry-pick 진행 결과 (시각 판정 미통과로 rollback)

### 4.1 cherry-pick + 충돌 해소

3 commits cherry-pick 진행:
1. `3568646` (Task #511 본 squash merge) — `src/renderer/layout.rs` 충돌 2 영역 → HEAD (Task #525) 채택 + Task #511 주석 추가
2. `db536d6` (HWP3 narrow zone Groucho Marx) — 충돌 0
3. `64bb10a` (samples 추가) — 충돌 0

### 4.2 결정적 검증 (모두 통과)

| 게이트 | 결과 |
|--------|------|
| `cargo test --lib` | ✅ 1118 passed |
| `cargo test --test svg_snapshot` | ✅ 6/6 passed |
| `cargo test --test issue_546/530/505/418/501` | ✅ 회귀 0 |
| `cargo clippy --lib` | ✅ 0 건 |
| `cargo build --release` | ✅ Finished |
| WASM 빌드 | ✅ 4,586,232 bytes |

### 4.3 시각 판정 결과 — 미통과

작업지시자 시각 판정:
> output/svg/pr553_after/hwp3-sample5-hwp5/hwp3-sample5-hwp5_004.svg
> 이미지와 문단 배치에서 버그가 발생합니다.
>
> output/svg/pr553_after/hwp3-sample5-hwp5/hwp3-sample5-hwp5_008.svg
> 에서도 동일한 현상발견했습니다.

**page 4 의 결함 정밀 측정**:

```
=== 페이지 4 (global_idx=3, section=0, page_num=4) ===
  body_area: x=56.7 y=75.6 w=680.3 h=990.2
  단 0 (items=14, used=556.8px, hwp_used≈952.8px, diff=-396.0px)
    FullParagraph  pi=74  vpos=0  "(빈)"
    Shape          pi=74 ci=0  그림 tac=false  vpos=0
    FullParagraph  pi=76  vpos=31680  "(빈)"
    ...
```

- **본문 영역 이상 공백** (-396 px) — 그림이 차지하는 영역만큼 textual flow 가 부족
- pi=74 의 그림: 126.4 × 94.5 mm Square wrap (어울림), Paper-relative offset
- 그림 옆 paragraph 들이 정합한 위치에 배치 안 됨

### 4.4 결함 본질 — Task #546 trade-off 영역

PR 본문이 §"회귀 영역" 1번에 명시:
> 1. HWP3 Square wrap 그림 아래 텍스트 y위치 회귀 (page 4/8 그림 겹침)
>    - origin: Task #546 (`9575667`)의 task460 보완5 (`82e41ba`) 전체 revert
>    - trade-off: exam_science.hwp 정상화의 대가

→ PR 본문이 의도된 trade-off 로 인정한 영역. 그러나 **작업지시자 시각 판정에서 수용 불가능** 으로 판단.

### 4.5 PR #553 head 시점에서도 동일 결함 확인

cherry-pick 전 PR #553 head 자체에서도 page 4 동일 결함 (총 페이지 68, page 4 단 0 used 556.8 px / hwp_used 952.8 px / diff -396.0 px) → **본 환경 통합 (옵션 C) 의 영향이 아님**. PR #553 자체의 잔존 결함.

## 5. Rollback 절차

### 5.1 rollback 결정 사유

작업지시자 결정:
> 옵션 2 로 합니다. HWP 3.0 은 렌더링 뿐만 아니라 향후 시리얼라이제이션도 생각해야 합니다.

→ 시각 판정 게이트 정합 운영 (미통과 시 머지 안 함) + HWP3 직렬화 영역 까지 본질 정정 필수 판단.

### 5.2 절차

```bash
# local/devel 만 cherry-pick 직전 시점으로 reset
git reset --hard b84c5e9
# devel 은 push 안 됐으므로 영향 없음 (local/devel 만 영향)
```

### 5.3 영향 범위

- ✅ devel + origin/devel: 영향 없음 (cherry-pick 결과는 local/devel 만)
- ✅ exam_science.hwp 4 페이지 (Task #546 정합): 유지
- ✅ Task #525 / #528 의 정정: 유지
- ❌ PR #553 의 본질 정정 (HWP3 보완 + narrow zone + composer): rollback (재 PR 시 다시 진행)

## 6. 컨트리뷰터 안내 (PR close 댓글)

- **Rollback 사유** 명시 — 시각 판정에서 page 4/8 결함 수용 불가
- **PR 의 본질 정정 영역은 정합** — 재 PR 시 보존 권장 (HWP3 보완 + narrow zone + composer + samples)
- **정정 방향** — Task #546 trade-off 영역 (HWP3 Square wrap 그림 아래 텍스트 y위치) 페이지네이션 안전한 방식 재구현 권장
- **추가 고려 — HWP 3.0 직렬화**: 작업지시자 의견 반영, `wrap_precomputed` / `v_push_before` 등 model 변경이 HWP3 → HWP3 round-trip 까지 정합한지 점검 권장
- **재 PR base 동기화**: rollback 후 본 환경 devel 은 `b84c5e9` 그대로 — PR 의 base 와 동일하므로 추가 동기화 필요 없음
- **트러블슈팅 문서 안내**: `mydocs/troubleshootings/square_wrap_pic_bottom_double_advance.md` 참조 권장

## 7. 메모리 정합

- ✅ `feedback_visual_regression_grows` — 시각 판정 게이트 정합 운영 (미통과 시 머지 안 함)
- ✅ `feedback_v076_regression_origin` — 작업지시자 직접 시각 판정으로 결함 발견 + rollback 결정
- ✅ `feedback_pdf_not_authoritative` / `reference_authoritative_hancom` — 한컴 2010/2020 직접 비교 + 작업지시자 시각 판정 권위
- ✅ `feedback_pr_comment_tone` — close 댓글 차분/사실 중심 + 컨트리뷰터의 정합한 영역 인정 + 재 PR 요청 톤

## 8. 본 사이클 사후 처리

- [x] PR #553 close (rollback 안내 + 재 PR 요청)
- [ ] 컨트리뷰터의 재 PR 대기
- [ ] 본 검토 문서 archives 보관
- [ ] orders 갱신 (PR #553 rollback + 재 PR 요청 기록)
