---
kind: canonical
status: active
canonical: mydocs/tech/parser_architecture.md
last_verified: 2026-07-17
---

# 포맷 파서와 공통 Document IR 경계

rhwp의 HWPX, HWP5, HWP3 파서는 포맷별 입력을 하나의 공통 `Document` IR로 변환한다. 렌더러,
레이아웃, 편집 코어는 입력 포맷을 다시 판별하지 않고 이 IR의 의미를 소비한다.

| 포맷 | 파서 위치 | 출력 |
| --- | --- | --- |
| HWPX (ZIP+XML) | `src/parser/hwpx/` | `Document` |
| HWP5 (OLE 복합 문서) | `src/parser/hwp5/` | `Document` |
| HWP3 (고전 바이너리) | `src/parser/hwp3/` | `Document` |

## 책임 경계

- 각 파서는 원본 포맷의 표현을 공통 IR 의미로 정규화한다.
- 포맷별 레코드, XML, 인코딩 차이는 해당 파서 경계를 넘기지 않는다.
- 공통 모듈은 포맷 이름이 아니라 IR 속성과 의미를 기준으로 동작한다.
- 저장 포맷별 직렬화 차이는 해당 serializer 또는 명시적인 변환 계층에서 처리한다.

## HWP3 불변식

HWP3 바이너리 해석과 HWP3 전용 보정은 `src/parser/hwp3/` 안에서 완료한다. 다음 공통 영역에는 HWP3
전용 분기를 추가하지 않는다.

- `src/renderer/`
- `src/renderer/layout.rs` 및 하위 레이아웃 모듈
- `src/document_core/`

공통 영역에 추가 정보가 필요하면 HWP3 여부를 직접 전달하지 않고, 다른 포맷에도 적용 가능한 IR 속성으로
정의한다. 이 규칙은 포맷별 예외가 렌더링과 편집 계층으로 확산되는 것을 막는다.
