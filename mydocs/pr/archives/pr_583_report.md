# PR #583 처리 보고서

**PR**: [#583 fix: 그룹 내 그림(Picture) 직렬화 구현 + 라운드트립 테스트](https://github.com/edwardkim/rhwp/pull/583)
**작성자**: @oksure (Hyunwoo Park) — 세 번째 PR
**처리 결정**: ✅ **cherry-pick 머지** (직렬화 영역, B 처리 — 결정적 검증으로 머지)
**처리일**: 2026-05-04

## 1. 처리 결과 요약

| 항목 | 결과 |
|------|------|
| 결정 | cherry-pick 머지 (B 처리 — 직렬화 영역, 시각 영향 없음, 라운드트립 테스트로 결정적 검증) |
| 변경 | `src/serializer/control.rs` +13/-2 + `src/serializer/control/tests.rs` +79 (2 files) |
| Linked Issue | (PR #428 의 후속 — close 된 이전 PR 의 Copilot 피드백 반영) |
| author 보존 | ✅ @oksure |
| 충돌 | 0 (auto-merge 정합) |
| 결정적 검증 | cargo test --lib **1125 passed** (신규 `test_roundtrip_group_picture_child` GREEN) |
| 시각 판정 | 해당 없음 (직렬화 영역, 시각 영향 무관) |
| WASM 빌드 | 다음 사이클에서 함께 (B 옵션 선택) |

## 2. cherry-pick 결과

| 신 commit | 원본 PR commit | 설명 |
|----------|--------------|------|
| `21fe401` | `8dc75f6` | fix: 그룹 내 그림(Picture) 직렬화 구현 + 라운드트립 테스트 |

author 보존: @oksure (Hyunwoo Park).

## 3. 본 PR 의 본질

### 3.1 결함

`src/serializer/control.rs` 의 `serialize_group_child()` 의 `ShapeObject::Picture` 분기가 TODO (빈 영역):

```rust
ShapeObject::Picture(_pic) => {
    // TODO: 그룹 내 그림 직렬화
}
```

→ 그룹 도형에 포함된 그림이 저장 시 누락. HWP5 직렬화 라운드트립 결함.

### 3.2 정정

기존 단독 Picture 직렬화 (`serialize_picture_control`) 와 동일 패턴으로 그룹 자식 경로에 레코드 2개 생성:

```rust
ShapeObject::Picture(pic) => {
    records.push(Record {
        tag_id: tags::HWPTAG_SHAPE_COMPONENT,
        level: comp_level,
        size: 0,
        data: serialize_shape_component(tags::SHAPE_PICTURE_ID, &pic.shape_attr, false),
    });
    records.push(Record {
        tag_id: tags::HWPTAG_SHAPE_COMPONENT_PICTURE,
        level: type_level,
        size: 0,
        data: serialize_picture_data(pic),
    });
}
```

다른 그룹 자식 (Line, Rectangle, Ellipse, Chart, OLE) 과 동일한 구조.

### 3.3 라운드트립 테스트 신규

`test_roundtrip_group_picture_child`:
- `Group{children: [Picture{bin_data_id=7, size=5000x3000}]}` 구성
- `serialize_section` → `parse_body_text_section`
- Picture 자식 존재 + `bin_data_id` / `original_width/height` 보존 확인

본 환경 검증: 1 passed.

### 3.4 PR #428 후속 정합

본 PR 은 이전 PR #428 (close, Copilot 리뷰에서 라운드트립 테스트 부재 지적) 의 후속 — 피드백 반영하여 라운드트립 테스트 포함. 컨트리뷰터의 정합한 워크플로우.

## 4. 검증 결과

### 4.1 결정적 검증 (모두 통과)

| 게이트 | 결과 |
|--------|------|
| `cargo test --lib` | ✅ **1125 passed** (PR #582 시점 1124 +1, 신규 `test_roundtrip_group_picture_child` GREEN) |
| `cargo test --test issue_505` | ✅ 9/9 (PR #507 회귀 0) |
| `cargo test --test issue_530/546/418/501` | ✅ 회귀 0 |
| `cargo test --test svg_snapshot` | ✅ 6/6 passed |
| `cargo clippy --lib` | ✅ 0 건 |
| `cargo build --release` | ✅ Finished |

### 4.2 라운드트립 검증 (PR 본문 + 본 환경)

```
test serializer::control::tests::test_roundtrip_group_picture_child ... ok
```

→ Group 도형 안의 Picture 자식이 serialize → parse 라운드트립 후 모든 필드 보존 (bin_data_id, shape_attr, original_width/height) 결정적 검증.

### 4.3 시각 판정

본 PR 의 본질이 **직렬화 영역** (저장 시 누락 정정) 이라 SVG / web Canvas 시각 판정은 영향 없음. 라운드트립 테스트로 결정적 검증 충분.

## 5. 작업지시자 의견 정합

작업지시자가 PR #553 close 시 명시:
> HWP 3.0 은 렌더링 뿐만 아니라 향후 시리얼라이제이션도 생각해야 합니다.

→ 본 PR 은 HWP5 직렬화 영역의 누락 정정. 작업지시자의 직렬화 본질 강조와 정합. HWP 직렬화 라운드트립 정합성 향상.

## 6. 컨트리뷰터 정합

@oksure (Hyunwoo Park) — PR #581 / #582 에 이은 세 번째 PR. 본 사이클의 정합한 영역:

1. **PR #428 후속 정합** — 이전 PR 의 Copilot 피드백 (라운드트립 테스트 부재) 정확히 반영
2. **단일 commit + 작은 변경** (+92 / -2, 2 files) — 본질 명확
3. **신규 라운드트립 테스트** — `test_roundtrip_group_picture_child`
4. **기존 Line/Rectangle/Ellipse/Chart/OLE 와 동일 패턴** — 일관된 구조 정합
5. **별도 fork branch** (`contrib/fix-group-picture-serialize-v2`) — 본 사이클 패턴 정합

## 7. 머지 절차

### 7.1 cherry-pick + 검증 (완료)

```bash
git cherry-pick 8dc75f6  # auto-merge 정합 (control.rs 본 환경에 동일 영역 변경 0)
cargo test --lib  # 1125 passed
cargo test --lib test_roundtrip_group_picture  # 1 passed
```

### 7.2 commit + devel 머지 + push

```bash
git add mydocs/pr/pr_583_report.md
git commit -m "PR #583 처리 보고서 (cherry-pick @oksure 1 commit — 그룹 내 Picture 직렬화)"

git checkout devel
git merge local/devel --no-ff -m "..."
git push origin devel
```

### 7.3 PR close

PR #583 close (수동, cherry-pick 머지 + Linked Issue 없음).

## 8. 메모리 정합

- ✅ `feedback_check_open_prs_first` — 본 PR 처리 정합
- ✅ `feedback_pr_comment_tone` — close 댓글 차분/사실 중심
- ✅ `feedback_release_sync_check` — main 동기화 정합
- ✅ `feedback_essential_fix_regression_risk` — 라운드트립 테스트로 회귀 검출 가드
- ✅ `feedback_no_pr_accumulation` — PR #428 후속의 정합한 새 PR
- ✅ `feedback_per_task_pr_branch` — `contrib/fix-group-picture-serialize-v2`
- ✅ `feedback_rule_not_heuristic` — 그룹 자식 일관 패턴 (Line/Rectangle/Ellipse/Chart/OLE 와 동일)
