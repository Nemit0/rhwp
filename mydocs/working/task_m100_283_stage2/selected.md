# Stage 2 튜닝안 비교 및 선정

## 프로토타입 변형 (6개)

| # | 이름 | paren_w | ctrl_x | 관찰 |
|---|------|---------|--------|------|
| 0 | current (baseline) | fs * 0.30 | x (=0%) | 얇은 moon, 글자와 gap |
| 1 | A_conservative | fs * 0.27 | x + w*0.10 | 약간 개선, 여전히 moon |
| 2 | A_aggressive | fs * 0.25 | x + w*0.15 | 더 타이트, 여전히 moon |
| 3 | **B_glyph** | (n/a — 글리프 `<text>(</text>`) | - | **본 파렌 형상, 글자와 자연 조화** |
| 4 | extra_A (4번째) | fs * 0.28 | x + w*0.20 | moon 깊어짐, 삼각형화 시작 |
| 5 | extra_B | fs * 0.24 | x + w*0.25 | moon 더 깊음, 부자연스러움 |

합성 이미지: `variants/_compare_all.png`.

## 핵심 관찰

**모든 A/C path 변형(0·1·2·4·5) 은 여전히 "moon" 형상** — 단일 제어점 quadratic Bezier 는 수학적으로 대칭 타원의 1/2 형태라, 제어점을 어디로 옮겨도 "양끝 뾰족 + 가운데 불룩" 패턴을 벗어날 수 없음. Times `(` 는 비대칭 비율 (상단 넓고 하단 좁음) + 두께 변화 + 세리프 끝단으로 "bowl" 이 풍부해짐.

**3_B_glyph 만이 글자와 일관된 타이포그래피** 를 제공:
- 폰트와 동일 advance (`fs * 0.333`)
- 실제 바울(bowl) 풍부
- 세리프 끝단 자동 포함
- 글자와 간격 자연 (advance 안에 bbox 가 꽉 참)

## 선정

**옵션 B (글리프 전환)** 을 채택. 구현 범위:

- **텍스트 높이 파렌** (body.height / fs ≤ 1.2): `<text>(</text>` · `<text>)</text>` 사용
- **스트레치 파렌** (body.height / fs > 1.2): 기존 path 유지 (분수·sum·매트릭스 감쌈)

## 임계치 결정: `1.2 * fs`

| body 유형 | height / fs | 렌더 방식 |
|-----------|-------------|-----------|
| 텍스트 Row (`2+h`) | 1.00 | **글리프** |
| 작은 첨자 포함 | ~1.15 | **글리프** |
| 서브스크립트 완전 | ~1.30 | path (스트레치 시작) |
| 분수 | ~2.0+ | path |
| 스택/행렬 | 2.5+ | path |

임계치 `1.2` 는 "텍스트 높이에 가까운지" 직관적 구분선. 민감하게 조정할 여지는 있으나 첫 시도는 1.2 로 설정.

## 구현 영향 파일

| 파일 | 위치 | 변경 |
|------|------|------|
| `src/renderer/equation/layout.rs` | `layout_paren:829-852` | `paren_w` 를 항상 `fs * 0.333` (Times advance) 로 변경. 임계치 체크는 layout 단계 불필요 (render 에서 결정) |
| `src/renderer/equation/svg_render.rs` | `LayoutKind::Paren` arm (L227-239) | 높이 기준 분기: 글리프(`<text>(</text>`) vs path(`draw_stretch_bracket`) |
| `src/renderer/equation/canvas_render.rs` | `LayoutKind::Paren` arm (L182-192) | 동일 분기 |

**matrix 파렌** (`LayoutKind::Matrix` arm, L193-211 svg_render.rs / L152-168 canvas_render.rs) 은 항상 "스트레치" 로 간주 → 기존 path 유지 (변경 없음).

## 부가 결정

- `paren_w` 를 `fs * 0.333` 으로 변경 — 글리프 advance 와 일치. 스트레치 path 경우에도 이 폭으로 그려도 어색하지 않음 (오히려 Times advance 에 맞춘 표준폭).
- 글리프 렌더 시 `text-anchor="start"` 기본 사용 — 복잡한 중앙 정렬 불필요.
- Bracket 종류별 확장은 범위 밖 — `(`, `)` 만 우선 수정. 이번 타스크 이슈 제목이 "(과 ) 위주".

## 다음 단계

단계 3: 코드 변경 + 회귀 테스트.
