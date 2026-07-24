# hwpx2hwp-rule.md 문서 검토 피드백

검토일: 2026-05-12
대상: `mydocs/troubleshootings/hwpx2hwp-rule.md`
검토자: 메인테이너 (Claude)
성격: 내부 트러블슈팅 규칙 문서 (외부 PR 아님)

## 1. 종합 평가

HWPX→HWP 한컴 호환 lowering contract 장기 프로젝트의 방법론 규칙 문서로서
본질 구조는 매우 견고하다. 메모리 룰과 일관 정합한다:

- `project_hwpx_to_hwp_adapter_limit` — "단순 어댑터로 한컴 호환 불가, 완전 변환기 정체성 필요"
- `feedback_self_verification_not_hancom` — "rhwp 자기 라운드트립 통과해도 한컴 거부 가능"
- `feedback_hancom_compat_specific_over_general` — "케이스별 명시 가드, 일반화 금지"
- `feedback_search_troubleshootings_first` — 본 문서가 그 검색 대상의 핵심

## 2. 강점

| 영역 | 평가 |
|------|------|
| §2.1 포맷 거버넌스 차이 | HWP (조판 결과 + binary contract) vs HWPX (선언적) 구분 정확 |
| §2.2 어려운 backend 우선 | HWPX→HWP 먼저 → same-format 경계 선명, 연구 장치 관점 합리 |
| §2.4 컴파일러 비유 | frontend/IR/backend/target ABI 비유로 lowering 본질 명확화 |
| §4 한컴 판정 용어 | 4 판정 유형 (읽기 오류/손상/조판 실패/rhwp 정상+한컴 실패) 체계적 |
| §5 실패 유형 A-F | Container/RecordTree/Count/DocInfo/Defaults/Layout-computed 진단 분류 |
| §7 금지 규칙 | "rhwp-studio reload 성공만으로 한컴 호환 판단 금지" 명문화 |
| §8 inventory 13 컬럼 | oracle 비교 표준 — 재현성 확보 |
| §10 #944 작업 원칙 | 7 조건 게이트 (대응 명확 → 문서화 → 위반 설명 → probe 통과 → 회귀 부재 → 문서 추가 → 반영) |

## 3. ⚠️ 정정 필요 — 깨진 참조 2건 (자체 §7 금지 규칙 위반)

### 3.1 발견

본 환경 점검: `mydocs/working/task_m100_903_stage*` 는 stage5~stage54 까지만 존재.
stage55+ 부재.

| 위치 | 인용 | 실제 상태 |
|------|------|----------|
| 본문 라인 472 | "Task #903 **Stage 53/56**" 에서 BIN_DATA + CTRL_HEADER 조합 사례 | `task_m100_903_stage56.md` **부재** |
| 본문 라인 487 | "Task #903 **Stage 58**" 에서 table attr 사례 | `task_m100_903_stage58.md` **부재** |
| §11 라인 594 | `mydocs/working/task_m100_903_stage56.md` 링크 | 깨진 링크 |
| §11 라인 595 | `mydocs/working/task_m100_903_stage58.md` 링크 | 깨진 링크 |

### 3.2 본질 — 자체 모순

§6 "현재까지 확인한 규칙" 의 두 규칙이 부재 문서를 근거로 한다:

- **"BinData와 CTRL_HEADER는 독립 축이 아니다"** — 근거 Stage 53/56 (stage56 부재)
- **"Table attr는 표 배치의 주요 축이지만 충분 조건은 아니다"** — 근거 Stage 58 (부재)

이는 본 문서 §7 금지 규칙과 §10 7번 원칙을 자체 위반한다:

> §7: "contract가 확정되지 않은 한컴 통과 산출물을 구현 근거로 삼지 않는다."
> §2.3: "한컴에서 열리는 산출물을 만들었더라도, 그 산출물이 어떤 HWP5 lowering
> contract를 만족해서 열렸는지 설명하지 못하면 구현 규칙으로 채택하지 않는다."

근거 working 문서가 없는 규칙은 oracle-derived contract 로 검증 불가 →
`feedback_close_issue_verify_merged` 패턴 (근거 미검증 → 재발 위험) 정합.

### 3.3 정정 권장 (택1, 작업지시자 결정 필요)

| 옵션 | 본질 |
|------|------|
| (a) 흡수 표기 | Stage 56/58 작업이 Stage 53/54 후속이면 인용을 stage53/54 로 정정 + §11 링크 정정 |
| (b) 규칙 강등 | stage56/58 근거 부재 → 두 규칙을 "잠정 (근거 문서 미작성, 재검증 필요)" 표기 |
| (c) 소급 작성 | Stage 56/58 작업이 실제 수행됐으면 working 문서 소급 작성 후 링크 유지 |

작업지시자 확인 필요 사항:
- Stage 56/58 이 실제 수행됐는지 (working 문서만 누락인지 / 작업 자체 미수행인지)
- §6 두 규칙의 근거를 stage53/54 로 흡수 가능한지

## 4. 기타 관찰 (정정 불요, 기록만)

- §6 규칙들은 모두 "단, 샘플별 추가 검증 필요" / "충분 조건 아님" 단서를 명시 →
  `feedback_hancom_compat_specific_over_general` 의 "일반화 금지" 정합. 우수.
- §9 "시각 판정 파일은 항상 `output/poc/...` 아래 생성" — `project_output_folder_structure`
  의 output 서브폴더 정책과 별도 경로 (poc). 일관성 위해 output 폴더 정책 문서에
  `output/poc/` 용도 추가 등록 검토 권장 (정정 불요, 후속 고려).
- §10 #944 7 조건 게이트는 hyper-waterfall 방법론 (이슈→계획서→구현) 과 정합.

## 5. 결론

- **문서 본질**: 채택 — 장기 lowering contract 방법론으로 견고
- **정정 필요**: 깨진 참조 2건 (Stage 56/58) — 자체 §7/§2.3 금지 규칙 위반이므로
  반드시 정정. 작업지시자 결정 (옵션 a/b/c) 후 본 문서 반영.
- **후속 고려**: `output/poc/` 경로를 `project_output_folder_structure` 정책 문서에
  등록 검토 (정정 불요).

## 6. 메모리 룰 적용

| 룰 | 적용 |
|----|------|
| `project_hwpx_to_hwp_adapter_limit` | 본 문서 §2.1/§2.4 가 이 룰의 "완전 변환기 정체성" 을 방법론으로 구체화 |
| `feedback_self_verification_not_hancom` | §4 "rhwp-studio 정상 + 한컴 실패" / §7 금지 규칙이 이 룰 명문화 |
| `feedback_hancom_compat_specific_over_general` | §6 규칙들의 "충분 조건 아님 / 샘플별 검증" 단서가 이 룰 정합 |
| `feedback_close_issue_verify_merged` | §6 stage56/58 근거 부재 규칙 → 근거 미검증 재발 위험 패턴 |
| `feedback_search_troubleshootings_first` | 본 문서가 HWPX→HWP 저장 작업 시 사전 검색 핵심 대상 |

---

작성: 2026-05-12
