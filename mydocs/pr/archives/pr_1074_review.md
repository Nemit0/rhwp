# PR #1074 검토 — 플랫폼별 메뉴 단축키 표시 정리

## 1. PR 정보

| 항목 | 값 |
|------|-----|
| 번호 | #1074 |
| 제목 | feat: 플랫폼별 메뉴 단축키 표시 정리 (#978) |
| 작성자 | oksure (Hyunwoo Park) — 기존 컨트리뷰터 (#971 작성자) |
| base ← head | `devel` ← `contrib/platform-shortcut-labels` |
| 연결 이슈 | Closes #978, assignee 본인 지정 완료 |
| mergeable | MERGEABLE / BEHIND (cherry-pick 으로 해소) |
| CI | Build & Test ✅ / Analyze ✅ / Canvas diff ✅ / CodeQL ✅ |
| 커밋 | 2 (530fbba5 feat + 2996f2eb Copilot 피드백 반영) |

## 2. 배경 (이슈 #978)

#945(PR #979) 에서 플랫폼별 단축키 *동작* 은 정리됐으나, 메뉴/
컨텍스트 메뉴/커맨드 팔레트의 **표시 라벨** 은 `shortcutLabel` 을
그대로 출력 → macOS 에서도 `Ctrl+S` 로 보이는 불일치. 표시 레이어
포맷팅 문제로 분류, 같은 `detectPlatformKind()` 재사용 권장.

## 3. 변경 내용

**순수 rhwp-studio TS** 변경. Rust/파서/렌더러/WASM 무관.

| 파일 | 변경 |
|------|------|
| `engine/navigation-keymap.ts` | `formatShortcutLabel(label, platform?)` 신규 — `\bCtrl\b → Command` (mac 만) |
| `command/extension-api.ts` | 메뉴바 항목 단축키 textContent 에 적용 |
| `ui/context-menu.ts` | 컨텍스트 메뉴 kbd textContent 에 적용 |
| `ui/command-palette.ts` | 팔레트 표시 + **검색 필터** (원본/포맷 양쪽 매칭, Copilot 피드백 반영) |
| `tests/navigation-keymap.test.ts` | 단위 4건 추가 (mac 치환 / win-linux 유지 / Ctrl 없음 / override) |

## 4. 검토 의견

### 4.1 강점

- **#979 와 일관 설계**: `detectPlatformKind()` 재사용, 동일
  플랫폼 감지 기준. 동작/표시 레이어 일치.
- **렌더링 시점에만 포맷 변환, 원본 데이터 불변**: 명령 정의의
  `shortcutLabel` 는 source 그대로 — `feedback_hancom_compat_specific_over_general`
  관점에서 안전한 분리.
- `\bCtrl\b` word boundary: Alt/Shift/F키/단일문자 무영향 (의도치
  않은 치환 방지).
- macOS 만 치환, Win/Linux 동작 불변 — 회귀 면 격리 명확.
- **Copilot 피드백 반영** (2996f2eb): 검색 필터에서 원본/포맷
  양쪽 매칭으로 검색 회귀 방지 + 테스트 cleanup 보장. 자체 리뷰
  성숙.
- 단위 테스트 동반 (4건 신규), 기존 12건 + 신규 4 = 16건 pass.

### 4.2 검토 포인트

- 본질이 시각 판정이 아닌 **표시 레이어 텍스트 포맷** → 단위
  테스트가 핵심 게이트 (시각 판정 부담 낮음).
- 순수 프론트엔드 — Rust/WASM 영향 없음. 검증은 `npm test`
  (strip-types) + `npm run build` 중심.
- `⌘S` 심볼 표기는 PR 본문 명시대로 별도 디자인 판단 — 본 PR
  범위 외.

## 5. 검증 계획

- [ ] cherry-pick (`530fbba5` + `2996f2eb` → 최신 devel)
- [ ] TS 단위 테스트 (navigation-keymap 16 + 기타) — strip-types
- [ ] `npm run build` (rhwp-studio)
- [ ] Rust 영향 없음 확인 (변경 파일 rhwp-studio 한정)

## 6. 판단 (잠정)

#979 와 일관 설계 + 렌더 시점 격리 + Copilot 피드백 자체 반영 +
회귀 면 격리(mac 만 치환) 명확. 본질이 시각 아닌 표시 텍스트
포맷 → 단위 테스트 통과가 판정 핵심. 검증 통과 시 수용 권고.

검증 결과에 따라 `pr_1074_report.md` 작성.