# hwp3-sample16-hwp5 3페이지 문단 간격 1차 측정

## 산출물

```text
output/poc/render-spacing/hwp3-sample16-hwp5-page3-grid/hwp3-sample16-hwp5_003.svg
```

생성 명령:

```text
target/debug/rhwp export-svg samples/hwp3-sample16-hwp5.hwp \
  -o output/poc/render-spacing/hwp3-sample16-hwp5-page3-grid \
  -p 2 \
  --show-grid \
  --debug-overlay \
  --show-control-codes
```

`-p 2`는 CLI 기준 0부터 시작하므로 한컴 편집기 기준 3페이지다.

## rhwp 좌표

`dump-pages`와 SVG debug-overlay 기준:

| 항목 | SVG y(px) | HWPUNIT vpos | 비고 |
|---|---:|---:|---|
| 본문 영역 top | 75.63 | - | body_area y |
| `Ⅰ. 사업개요` 문단 top | 75.63 | 852 | pi=69 |
| `1. 추진목적` 문단 top | 129.65 | 4904 | pi=70 |
| 목적 박스 top | 163.79 | 7464 | pi=71 shape |
| 목적 박스 bottom | 293.97 | 17228 | shape height 9764 HU |
| 빈 문단 top | 311.95 | 18576 | pi=72 |
| `2. 추진방향` 문단 top | 329.49 | 19892 | pi=73 |

1mm 격자 기준 환산:

| 구간 | rhwp 값 |
|---|---:|
| `1. 추진목적` 문단 bottom -> 목적 박스 top | 약 3.39mm |
| 목적 박스 height | 약 34.45mm |
| 목적 박스 bottom -> `2. 추진방향` 문단 top | 약 9.40mm |

## 한컴 스크린샷과의 1차 비교

첨부 스크린샷은 한컴 편집기의 격자 표시 화면으로 보이며, 격자 간격을 1mm로 보면 확대율은
rhwp SVG 기본 96dpi 표시보다 약 2배에 가깝다. 따라서 픽셀값이 아니라 격자 칸수로 비교해야 한다.

화면에 보이는 구간만 놓고 보면:

| 구간 | rhwp | 한컴 스크린샷 육안 추정 | 차이 |
|---|---:|---:|---:|
| 목적 박스 높이 | 약 34.45mm | 약 35mm 안팎 | 1mm 미만 |
| 목적 박스 bottom -> `2. 추진방향` | 약 9.40mm | 약 10mm 안팎 | 약 1mm 전후 |

따라서 첨부된 3페이지 상단 캡처 구간만 기준으로는 `rhwp-studio`와 한컴 편집기의 문단 간격 차이가
큰 편은 아니다. 이 구간의 간격 차이는 대략 1mm 전후로 보인다.

## 현재 해석

`dump-pages`의 페이지 사용량은 다음과 같다.

```text
used=955.2px, hwp_used≈956.2px, diff=-1.0px
```

즉 rhwp의 페이지 배치 누적값은 HWP line segment/vpos 기반 값과 거의 일치한다. 현재 보이는 상단 구간에서
큰 차이가 없다면, 문단 간격 차이는 다음 후보를 더 봐야 한다.

```text
1. 특정 페이지 하단부에서 line height 또는 line spacing 누적 오차가 커지는지
2. 한컴 편집기가 HWP5 변환 문서의 lineSeg 값을 그대로 쓰지 않고 일부 문단을 재조판하는지
3. 글상자/도형 전후의 빈 문단 pi=72 같은 4px line segment를 한컴이 다르게 처리하는지
4. HWP3 원본과 HWP5 변환본 사이에서 같은 화면을 비교하고 있는지
```

다음 정밀 분석은 한컴 스크린샷과 동일한 구간을 SVG에서 확대 캡처하거나, 한컴 PDF/이미지 산출물을 확보해
같은 1mm 격자 기준으로 좌표를 직접 추출하는 방식이 좋다.

## TAC 문단 다음 vpos 분해

문제가 의심되는 구간은 `pi=71` TAC 글상자 문단에서 `pi=72` 빈 문단, `pi=73`
`2. 추진방향` 문단으로 넘어가는 경계다.

관련 dump:

```text
pi=71 ls[0]: vpos=7464,  lh=9764, ls=780   # TAC 글상자 문단
pi=72 ls[0]: vpos=18576, lh=300,  ls=164, spacing_before=568
pi=73 ls[0]: vpos=19892, lh=1600, ls=960, spacing_before=852
```

따라서 `pi=71 -> pi=72`의 파일상 vpos 차이는 다음과 같이 정확히 분해된다.

```text
18576 - 7464 = 11112
11112 = 9764(TAC line height/shape height)
      + 780(TAC line spacing)
      + 568(pi=72 spacing_before)
```

`pi=71` 글상자 하단에서 `pi=73` 제목 시작까지의 간격도 다음과 같이 분해된다.

```text
19892 - (7464 + 9764) = 2664
2664 = 780(pi=71 line_spacing)
     + 568(pi=72 spacing_before)
     + 300(pi=72 line_height)
     + 164(pi=72 line_spacing)
     + 852(pi=73 spacing_before)
```

96dpi 기준:

```text
2664 HU = 35.52 px = 9.40 mm
```

즉 HWP5 record 안에는 TAC 문단 뒤 간격이 존재한다. 현재 가설은 "파일에 간격 정보가 없다"가
아니라, "rhwp 렌더링/페이지네이션 경로가 TAC 글상자 문단의 진행량을 한컴과 다른 기준점에
붙이고 있는지"로 좁히는 것이 더 정확하다.

`RHWP_VPOS_DEBUG=1`로 확인한 렌더러 보정 경로:

```text
pi=72 prev_pi=71 prev_vpos=7464 prev_lh=9764 prev_ls=780
      vpos_end=18576 base=852 y_in=293.97 end_y=308.16 applied=true

pi=73 prev_pi=72 prev_vpos=18576 prev_lh=300 prev_ls=164
      vpos_end=19892 base=852 y_in=318.13 end_y=323.81 applied=true
```

여기서 `end_y`는 다음 문단의 `spacing_before`를 한 번 빼고 보정한 위치이며,
실제 문단 렌더링 단계에서 `spacing_before`가 다시 더해져 최종 top이 SVG의
`pi=72 y=311.95`, `pi=73 y=329.49`가 된다.
