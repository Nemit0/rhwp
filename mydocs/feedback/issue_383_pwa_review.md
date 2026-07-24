# 이슈 #383 검토 — rhwp-studio PWA 설치 지원 (vite-plugin-pwa)

## 이슈 정보

| 항목 | 값 |
|------|-----|
| 이슈 번호 | [#383](https://github.com/edwardkim/rhwp/issues/383) |
| 제목 | rhwp-studio에 대한 PWA 설치 지원 (vite-plugin-pwa) |
| 작성자 | [@dyjung150605](https://github.com/dyjung150605) (Dayeon Jung) |
| 라벨 | (없음) |
| state | OPEN |
| createdAt | 2026-04-27 |
| 처리 형태 | **PR 전 의향 확인** — 수락 시 CONTRIBUTING.md 절차 따라 PR 예정 |

## 작성자 제안 정리

GitHub Pages 데모 (`edwardkim.github.io/rhwp/`) 에 PWA (Progressive Web App) 설정을 얹어 데스크톱 / 모바일에서 앱처럼 설치 / 실행 가능하게 함.

### 사용자 혜택

- 별도 창 분리 (PWA 설치)
- 전용 아이콘 / 이름 / 테마색
- 오프라인 사용 (Service Worker 캐시)
- 자동 업데이트 (`autoUpdate`)
- 모바일 홈 화면 정식 등록

### 변경 범위 (rhwp-studio 전용, 코어 미접촉)

| 파일 | 변경 |
|------|------|
| `rhwp-studio/package.json` | `vite-plugin-pwa`, `workbox-window` devDependency 추가 |
| `rhwp-studio/vite.config.ts` | `VitePWA` 플러그인 + manifest + workbox glob |
| `rhwp-studio/index.html` | `theme-color`, `apple-touch-icon` meta 추가 |
| `rhwp-studio/public/icons/icon-{128,256,512}.png` | `assets/logo/` 기존 자산에서 복사 |
| `rhwp-studio/.npmrc` | `legacy-peer-deps=true` (vite-plugin-pwa@1.2.0 peer ≤vite7, 본가 vite@8) |

### 검증 상태 (작성자 fork)

- 데스크톱 Chrome / Edge → 정식 PWA 설치 다이얼로그 정상
- macOS Safari → "Dock에 추가" 정상
- Android Chrome → "앱 설치" 정상
- 빌드: 본가 `deploy-pages.yml` 그대로 + `--legacy-peer-deps` (`.npmrc` 처리)

## 작성자 신뢰도

`dyjung150605/rhwp` fork 의 `devel` 브랜치 확인 (2026-04-28 시점):

- ahead 7 / behind 1 from fork main
- 변경 파일: PR 검토 문서 (pr_360, pr_373, pr_374), troubleshooting (hancom_pdf), 보안 / 정책 문서 등
- **PWA 관련 변경은 fork 에 푸시되지 않음** — 작성자가 로컬에서 검증 후 의향 확인부터 요청한 형태 (CONTRIBUTING.md 정중한 절차 준수)
- fork 의 변경은 **메인테이너 작업과 동기화한 흔적** (정황 인지 양호)

→ 절차 의식이 있는 신중한 컨트리뷰터로 판단. 다만 첫 PR 시도이므로 머지 시 검증 게이트는 일반 컨트리뷰터 수준 적용.

## 기술 검증

### vite-plugin-pwa 버전 / peer 확인

```
vite-plugin-pwa@1.2.0
peerDeps:
  vite: ^3.1.0 || ^4.0.0 || ^5.0.0 || ^6.0.0 || ^7.0.0
  workbox-build: ^7.4.0
  workbox-window: ^7.4.0
engines: node >=16.0.0
```

→ 작성자 진단 정확. **본가 vite@8 와 peer 충돌**.

### `.npmrc legacy-peer-deps=true` 의 영향

- npm 전역에 적용 (`.npmrc` 가 rhwp-studio 안에 있으면 그 폴더의 npm install 만 영향)
- **CI 의 `npm install` 도 자동 영향** — `deploy-pages.yml` 에서 `working-directory: rhwp-studio` 로 npm install 하므로 OK
- 부작용: vite@8 와 vite-plugin-pwa 의 실제 호환 여부는 검증 필요. 작성자가 4 개 환경 (Chrome/Edge/Safari/Android) 에서 확인했다는 것은 빌드 + 런타임은 작동한다는 신호
- vite-plugin-pwa 가 vite@8 정식 지원 추가되면 `.npmrc` 제거 가능 — **임시 우회**

### Service Worker × WASM 캐싱

- `pkg/rhwp_bg.wasm` 은 deploy-pages.yml 에서 `rhwp-studio/public/` 으로 복사 → vite build 시 해시 부여
- workbox 의 precache 가 해시된 자산을 자동 처리 → 새 빌드 시 자동 무효화 ✅
- `registerType: 'autoUpdate'` 로 백그라운드 갱신 — 사용자가 페이지 재로드 시 새 SW 활성화

### 번들 사이즈

- workbox-window 추가 ~10KB (gzip 후 더 작음)
- 본가 WASM 12 MB 대비 무시 수준

### GitHub Pages 도메인 / scope

- 배포 URL: `edwardkim.github.io/rhwp/`
- `vite build --base=/rhwp/` 사용 중
- PWA manifest 의 `start_url` / `scope` 도 `/rhwp/` 로 맞춰야 정상 — **PR 시 점검 항목**

## 변경 평가

### 강점

1. **사용자 가치** — README 의 "어디서든 열어보세요" 비전과 정합. 모바일 / 데스크톱 설치형 앱 경험
2. **변경 범위 작음** — rhwp-studio 만, 코어 미접촉
3. **부착성 (additive)** — 기존 동작 영향 없음, 사용자가 설치 안 해도 동일 사용 가능
4. **의향 확인 절차 준수** — CONTRIBUTING.md 정중 (작성자가 로드맵 타이밍까지 언급)
5. **검증 사전 수행** — 4 개 환경 동작 확인

### 약점 / 점검 필요

#### 1. `legacy-peer-deps=true` 의 임시성

- vite-plugin-pwa 가 vite@8 정식 지원 안 됨 → 우회 의존
- 향후 다른 의존성 추가 시 peer 검증이 약해지는 사이드이펙트 가능
- **대안**: vite-plugin-pwa@2 또는 다른 PWA 플러그인 (직접 manifest + workbox-cli) 검토

#### 2. Service Worker 의 디버깅 어려움

- 한번 캐시되면 사용자 환경에서 강제 새로고침 / SW unregister 필요
- `autoUpdate` 가 있어도 사용자 인지 시점은 페이지 재로드 후
- **대안**: `registerType: 'prompt'` 로 사용자에게 업데이트 알림 → 약점이라기보다 정책 선택

#### 3. 배포 워크플로우 영향

- `deploy-pages.yml` 의 `npm install` 이 `legacy-peer-deps` 를 무시할 가능성 검토
- `.npmrc` 가 rhwp-studio 폴더 안에 있고 `working-directory: rhwp-studio` 로 호출되므로 자동 적용 — **OK** 
- 단 CI 캐시 / 의존성 변경 시 락파일 (`package-lock.json`) 갱신 필요

#### 4. PWA 의 책임 범위

- HWP 편집 / 저장 / 인쇄 등 핵심 기능과 별도 — PWA 자체는 "껍데기"
- 핵심 가치 (HWP 호환성) 와 우선순위 비교 시 부착성 높지만 **로드맵 작업 흐름에 끼어듦**
- 작성자도 "v0.5~1.0 뼈대 단계" 타이밍 우려 명시

#### 5. icon 자산 검증

- `assets/logo/logo-{128,256,512}.png` 존재 확인 ✅
- PWA 권장 사이즈 (192, 512) 와 정합 — 작성자가 128 사용 → 192 권장
- maskable icon (Android adaptive) 별도 처리 여부 확인 필요

#### 6. PR 부재 — 구체 코드 미확인

- 현재 fork 에 PWA 변경이 푸시되지 않음
- vite.config.ts 의 manifest 내용, scope 설정, workbox glob 등 실제 코드는 PR 시점에 검증

## 메인테이너 작업과의 충돌 가능성

- `rhwp-studio/vite.config.ts`: 본 task 시점에 **이슈 #375 처리로 가이드만 변경** → 직접 수정 없음. PR 자동 머지 가능성 높음
- `rhwp-studio/package.json`: v0.7.7 (devDependencies 정도) → PR 자동 머지 가능
- `index.html`: 메뉴바 / studio-root 등 큰 부분 → meta 태그만 추가하면 충돌 없음
- `deploy-pages.yml`: 변경 없음

→ 충돌 가능성 낮음.

## 처리 방향 후보

### 옵션 A: 수락 + PR 권유 (CONTRIBUTING.md 절차)

작성자 의향 확인에 호응. PR 시 다음 점검:
- vite.config.ts 의 manifest (`name`, `short_name`, `theme_color`, `background_color`, `start_url: '/rhwp/'`, `scope: '/rhwp/'`)
- icons (192, 512 권장 사이즈 + maskable)
- workbox glob 의 WASM / chunk 포함
- `.npmrc legacy-peer-deps` 의 영향
- registerType (autoUpdate vs prompt) 정책 선택
- 빌드 / E2E 회귀 점검

### 옵션 B: v1.0 이후로 미룸

이유: 로드맵 우선순위 (HWP 호환성 / 페이지네이션 회귀 정정 등) 가 더 시급.

작성자 본문에서도 "v0.5~1.0 뼈대 단계" 타이밍 우려 자체가 언급됨. 메인테이너가 우선순위 판단할 수 있도록 정중히 미룸.

### 옵션 C: 거절

PWA 자체가 적절하지 않다고 판단할 경우. 본 프로젝트의 비전 (브라우저 / 설치 없이) 과 정합하므로 **거절 사유는 약함** — 추천 안 함.

### 옵션 D: 일부 흡수 (manifest 만)

PWA 의 핵심인 manifest + theme-color 만 받고 Service Worker (오프라인) 는 보류.

장점: SW 디버깅 / 캐싱 위험 회피
단점: PWA 의 핵심 가치 (오프라인) 가 빠짐 → 의미 약함

## 권장

**옵션 A (수락 + PR 권유)** 권장.

이유:
1. **본 프로젝트 비전과 정합** — README 의 "어디서든 열어보세요. 무료, 설치 없이" 와 PWA 는 자연스러운 확장
2. **변경 범위 작음** — rhwp-studio 한정, 코어 미접촉
3. **부착성** — 사용자 선택 (설치) 형태로 기존 사용성에 영향 없음
4. **작성자 검증 사전 수행** — 4 개 환경 동작 확인
5. **로드맵 우선순위는 PR 리뷰 단계에서 조정 가능** — PR 본문에 우선순위 / 타이밍 코멘트 가능
6. **PWA 가 주는 사용자 가치** — 모바일 / 데스크톱 설치형 경험은 본 프로젝트의 접근성 향상에 기여

옵션 B (v1.0 이후) 는 작성자 의욕을 차단하는 측면이 있고, 변경 범위가 작으므로 본 시점에 받아도 무방.

## 다음 단계 — 작업지시자 결정

A / B / C / D 중 결정 부탁드립니다.

권장: **A** — PR 권유 + PR 단계에서 다음 점검 요청
- start_url / scope 를 `/rhwp/` 로 정확히 설정
- icon 사이즈 192 / 512 + maskable 검토
- registerType 정책 선택 (autoUpdate vs prompt)
- E2E 테스트 회귀 없는지 확인 (Service Worker 가 캐싱 변경)
- `legacy-peer-deps` 우회의 임시성 명시 (코멘트)

## 참고

- 이슈: [#383](https://github.com/edwardkim/rhwp/issues/383) (OPEN)
- 작성자 fork: [dyjung150605/rhwp](https://github.com/dyjung150605/rhwp) (PWA 변경 미푸시 — 의향 확인 후 PR 예정)
- 관련 파일: `rhwp-studio/{package.json,vite.config.ts,index.html}`, `.github/workflows/deploy-pages.yml`, `assets/logo/`
- vite-plugin-pwa: 1.2.0, peer vite ≤7
