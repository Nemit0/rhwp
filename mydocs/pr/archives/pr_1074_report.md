# PR #1074 최종 보고 — 플랫폼별 메뉴 단축키 표시 정리

## 1. 결정

**merge** — #979 와 일관 설계 + 검증 통과 + 자체 리뷰 성숙.

| 항목 | 값 |
|------|-----|
| 번호 | #1074 |
| 제목 | feat: 플랫폼별 메뉴 단축키 표시 정리 (#978) |
| 작성자 | oksure (Hyunwoo Park) — 기존 컨트리뷰터 (#971 작성자) |
| base ← head | `devel` ← `contrib/platform-shortcut-labels` |
| 연결 이슈 | Closes #978 |
| 처리 | cherry-pick (`530fbba5` + `2996f2eb` → 최신 local/devel) |

## 2. 검증 결과

cherry-pick `5c52b06d` + `72ba800c`. 충돌 없음.

| 항목 | 결과 |
|------|------|
| cherry-pick | ✅ 충돌 없음 |
| TS 단위 테스트 (strip-types) | ✅ 30 passed, 0 failed (formatShortcutLabel 4건 포함) |
| `npm run build` (rhwp-studio) | ✅ 성공 (dist/sw.js, precache 53) |
| Rust 영향 | ✅ 없음 (변경 모두 `rhwp-studio/` 한정) |
| CI | ✅ 전부 pass |

## 3. 평가 요약

### 강점
- **#979(#945) 와 일관 설계**: 같은 `detectPlatformKind()` 재사용 —
  단축키 *동작* 과 *표시* 레이어 일치.
- **렌더링 시점에만 포맷 변환**, 명령 정의의 원본 `shortcutLabel`
  은 source 불변 — 안전한 분리.
- `\bCtrl\b` word boundary: Alt/Shift/F키/단일문자 무영향. macOS 만
  치환, Win/Linux 동작 불변 → 회귀 면 격리 명확.
- **Copilot 피드백 자체 반영** (2996f2eb): 검색 필터에서 원본/
  포맷 양쪽 매칭으로 검색 회귀 방지 + 테스트 cleanup 보장. 자체
  리뷰 성숙.
- 단위 테스트 4건 동반 검증 — 명시적 분기(mac 치환 / win-linux
  유지 / Ctrl 없음 / override) 모두 ok.

### 비고
- 본질이 시각 판정이 아닌 표시 레이어 텍스트 포맷 → 단위 테스트가
  핵심 게이트. 시각 부담 낮음.
- `⌘S` 심볼 표기는 PR 본문 명시대로 별도 디자인 판단 — 본 PR 범위 외.

## 4. 처리

- cherry-pick → 검증 통과 → `local/devel` merge
- PR #1074 close (cherry-pick 반영 명시) + 이슈 #978 close
- `pr_1074_review.md` / `pr_1074_report.md` → `pr/archives/`
