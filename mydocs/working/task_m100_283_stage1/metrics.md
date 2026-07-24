# Stage 1 측정 데이터

## Times New Roman `(` 글리프 실측 (Chrome headless, 14.67px)

### Canvas `measureText`

| 항목 | 값 (px) | em 비율 (fs=14.67) |
|------|---------|-------------------|
| advance_width | 4.89 | 0.333 |
| actual bbox width (ABL+ABR) | 5.0 | 0.341 |
| actual bbox height (ABA+ABD) | 14.0 | 0.955 |
| ascent from baseline | 11.0 | 0.75 |
| descent from baseline | 3.0 | 0.20 |

### SVG `getBBox`

| 글리프 | width | height |
|--------|-------|--------|
| `(` Times | 5.0 | 16.0 |
| `f` Times | 7.0 | 16.0 |
| `h` Times | 9.0 | 16.0 |
| `M` Times | 15.0 | 16.0 |

### 폰트 스택 효과 확인

`'Latin Modern Math', 'STIX Two Text', 'STIX Two Math', 'Times New Roman', 'Times', serif` (우리 EQ_FONT_FAMILY) 로 측정 시 advance=4.89 — `'Times New Roman', 'Times', serif` 와 동일 → Windows 환경에서 Times New Roman 이 매칭됨 확인.

## 현재 rhwp 파렌 (SVG path) 분석

`samples/equation-lim.hwp` 의 첫 `(`:
```
M41.25,2.93 Q38.17,10.27 41.25,17.60
```

| 항목 | 값 (px) | em 비율 |
|------|---------|---------|
| paren_w (박스 할당) | 4.40 | 0.30 |
| 시작/끝 x (mid_x + 0.2w) | 41.25 | - |
| 제어점 x (x_box, 좌측 끝) | 38.17 | - |
| 높이 | 14.67 | 1.00 |
| **t=0.5 에서 x** | 39.71 | - |
| **곡선 시각 폭 (start_x - midpoint_x)** | **1.54** | **0.105** |
| 박스 오른쪽 여백 (x_box+w - start_x) | 1.32 | 0.09 |
| 박스 왼쪽 여백 (start_x - (x_box+w*0.7)) | 0 | 0 |

**곡선 시각 폭 (1.54)** 이 Times 글리프 bbox (5.0) 의 **31% 수준** → 매우 얇은 moon 모양.

**박스 할당 (4.40)** 은 Times advance (4.89) 의 **90%** → 비슷.

**총 점유폭 (paren_w + PAREN_PAD)**:
- 우리: `fs * 0.3 + fs * 0.08 = fs * 0.38` = 5.57 px
- Times: advance = 4.89 px
- **차이: +14% (우리가 더 넓음)**

## 시각 비교 (`current_paren_crop.png` vs `times_reference.png`)

### 현재 rhwp (`current_paren_crop.png`)
- `f(2+h)` 의 파렌이 글자 대비 **얇고 moon 모양**
- 파렌과 글자 사이 **눈에 띄는 gap** 존재 (paren_w 의 30% 는 시각적 whitespace)
- 세로로 길쭉해 보임

### Times 레퍼런스 (`times_reference.png`)
- 파렌이 글자와 **밀착**
- 바울(bowl) 이 두툼해 일반적인 파렌 모양
- 세로 비율이 자연스러움

## 진단

원인이 복합적:

1. **박스 할당(4.40) vs 실제 곡선 시각 폭(1.54) 불일치** — 할당의 69% 가 whitespace. 이게 글자-파렌 간 "기름 없는 gap" 느낌.
2. **곡선이 너무 얕음 (flat arc)** — 제어점이 박스 좌측 끝에 있어 수학적으로는 bulge 가 커 보이지만, 박스가 좁아 실제 시각 곡선은 매우 얇음.
3. **Times 글리프는 advance 4.89 안에 실제 시각 bbox 5.0 을 꽉 채움** — 여백 없음.

## 튜닝 후보 (단계 2 에서 검증)

### 옵션 A — 상수 축소 (최소 변경)
- `paren_w: fs * 0.3 → fs * 0.27`
- whitespace 일부 축소 (-10% 허용)

### 옵션 C — 곡선 재디자인
- 제어점 x 좌표: `x (박스 좌측 끝) → x + w*0.15` (박스 안쪽 15%)
- 곡선이 덜 펴져 bowl 이 두툼해짐
- 단, 너무 크면 납작한 삼각형에 가까워짐

### 옵션 B — 글리프 전환 (측정으로 지지받음)
- 높이 ≤ fs * 1.3 → `<text>(</text>` 렌더 (Times advance 4.89 사용)
- 높이 > fs * 1.3 → path 유지

측정 결과 Times `(` 가 실제 advance 4.89 안에 꽉 찬 곡선 → **Option B 가 단순하고 효과적**. A+C 로 path 를 튜닝해도 "advance 대비 작은 곡선" 구조를 완전히 극복하기 어려움.

## 단계 2 제안

단계 2 에서 다음 3 접근을 프로토타입:
1. **A+C 복합**: `paren_w = fs * 0.27`, 제어점 = `x + w * 0.1`
2. **A+C 강화**: `paren_w = fs * 0.25`, 제어점 = `x + w * 0.15`
3. **옵션 B**: 텍스트 높이 파렌은 `<text>(</text>` 전환

시각 비교로 최종안 결정. **초기 가설은 옵션 B가 우세하나 A+C 로 충분할 수도 있어 3안 모두 프로토타입** 하는 것이 안전.
