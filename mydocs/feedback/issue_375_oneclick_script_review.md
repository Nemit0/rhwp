# 이슈 #375 검토 — 원클릭 실행 스크립트 추가 제안

## 이슈 정보

| 항목 | 값 |
|------|-----|
| 이슈 번호 | [#375](https://github.com/edwardkim/rhwp/issues/375) |
| 제목 | 원클릭 실행 스크립트를 만들었는데 추가해주실수 있을까요? |
| 작성자 | [@NoteBlockMR](https://github.com/NoteBlockMR) (NoteBlockExpert) |
| 라벨 | enhancement |
| state | OPEN |
| createdAt | 2026-04-27 |
| 첨부 | [run-install.zip](https://github.com/user-attachments/files/27109703/run-install.zip) (1.5 KB) |

## 작성자 제안 정리

배치파일로 https 접근을 간단하게 구현 — `cloudflared` 와 동봉 스크립트만으로 동작.

> 전문가분들 아니면 https를 제대로 못쓰게 해뒀더군요
> 전용 도메인이 있으신분들이 이걸 https를 사용을 간단하게 못하시는분들이 있어서 구현시켜봤습니다

작성자 안내:
> 도메인 설정 부분에다가 자신의 도메인을 추가하면 끝입니다

## 첨부 zip 분석

zip 내부 2 파일:

### `start-rhwp.bat` (178 bytes)

```bat
@echo off
setlocal
set "ROOT=%~dp0"
if "%ROOT:~-1%"=="\" set "ROOT=%ROOT:~0,-1%"
powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\start-rhwp.ps1" -Root "%ROOT%"
pause
```

→ PowerShell 호출 wrapper. `-ExecutionPolicy Bypass` 사용.

### `start-rhwp.ps1` (3 KB)

3-단계 setup:
- **[1/3]** `wasm-pack` 검사 → 없으면 에러. `pkg/rhwp.js` 없으면 `wasm-pack build --target web`
- **[2/3]** `rhwp-studio/node_modules` 없으면 `npm install`
- **[2.5/3]** `rhwp-studio/vite.config.js` 자동 생성 — **기존 `vite.config.ts` override**
  - 포트 7700 → **8080** 변경
  - `allowedHosts: true` → `['여기다가 https 도메인을 작성하세요', 'localhost']`
- **[3/3]** local vite 실행 (`node_modules/.bin/vite.cmd --host 0.0.0.0 --port 8080`)

## 평가

### 강점

1. **사용자 친화 의도** — Windows 환경 비전문가용 setup. 의도 자체는 합리
2. **악성 코드 없음** — wasm-pack / npm install / vite 실행 외 다른 동작 없음
3. **단순한 구조** — 3 단계, 가독성 양호
4. **cloudflared 연계 패턴** — Quick Tunnel 등으로 외부 HTTPS 접근 가능 (작성자 의도)

### 약점 / 검토 필요

#### 1. **vite.config.ts 와 충돌**

- 현재 저장소: `rhwp-studio/vite.config.ts` (port 7700, `allowedHosts: true`)
- 첨부 스크립트: `rhwp-studio/vite.config.js` 자동 생성 (port 8080, allowedHosts 제한)
- vite 는 `.ts` 와 `.js` 가 동시 존재 시 동작 불명확. 일반적으로 한쪽만 인식.
- **`.ts` 를 무시하고 `.js` 를 강제로 만드는 패턴은 유지보수 측면에서 문제** — 메인테이너가 `.ts` 를 갱신해도 사용자는 자동 생성된 `.js` 만 사용 → 설정 분기

#### 2. **포트 변경 (7700 → 8080)**

- E2E 테스트 (`rhwp-studio/e2e/text-flow.test.mjs`) 는 7700 가정
- CLAUDE.md 에 명시된 dev server 도 7700
- 8080 변경 사유 불명확 — 단순히 작성자 환경 사정?

#### 3. **PowerShell `-ExecutionPolicy Bypass`**

- Windows 표준 우회 패턴. 작성자 의도로 무난.
- 다만 저장소에 동봉 시 사용자가 별도 검증 없이 실행 → 경고 메시지 / 사용자 명시 동의 필요

#### 4. **HTTPS 접근의 진짜 메커니즘 — cloudflared**

- 본 zip 자체에 cloudflared 는 포함 안 됨. 작성자가 별도 설치 가정.
- 즉 본 스크립트는 **vite dev server 를 0.0.0.0 에 expose 하는 것까지만** 처리
- HTTPS 는 사용자가 cloudflared / ngrok 등으로 별도 처리 — 스크립트 본체는 dev server launcher 에 가까움

#### 5. **dev server 의 외부 expose 의 보안**

- vite dev server (`server.host: '0.0.0.0'`) 를 외부 도메인으로 expose 하는 흐름
- HMR 웹소켓 / source map / 미빌드 코드 노출 / `fs.allow: ['..']` 로 상위 디렉토리 접근 가능
- **dev server 는 본질적으로 production 노출용 아님**. cloudflared 로 expose 하면 의도치 않은 노출 위험
- 정상적인 사용 시나리오: 본인 PC 의 HWP 파일을 자기 도메인으로 외부에서 잠시 접근 — **개인 용도로는 합리**, 하지만 일반 사용자에게 권장은 신중

#### 6. **CONTRIBUTING.md 절차 미준수**

- 외부 기여 시 fork → branch → PR 절차 (CLAUDE.md / CONTRIBUTING.md)
- 본 이슈는 zip 첨부 형태로 제안 — 코드 자체는 PR 로 받아야 적합

## 처리 방향 후보

### 옵션 A: 정중히 거절 + 이유 설명

이유:
- vite.config 자동 override 패턴이 유지보수 충돌
- dev server 외부 expose 의 보안 권고 어려움
- 포트 7700 → 8080 변경 사유 불명확
- HTTPS 핵심은 cloudflared 별도 설치 — 본 스크립트가 직접 해결하는 것 아님

### 옵션 B: 위키 문서로 흡수

`Cloudflared 로 외부 HTTPS 접근 가이드` 로 위키 신설.
- 사용자 책임 범위 명시 (보안 / dev server vs production / 자기 도메인 필수)
- 작성자 attribution 보존 ("@NoteBlockMR 제안 기반")
- 저장소에는 스크립트 직접 포함 안 함 — 가이드만 제공

### 옵션 C: PR 권유 + 수정 요청

작성자에게 PR 형태로 제출 권유:
- `vite.config.ts` 직접 수정 (별도 `.js` 생성 대신)
- 포트 7700 유지
- 보안 경고 / 사용 가이드 README 동봉
- Fork → branch → PR 절차

### 옵션 D: 일부 흡수 (별도 스크립트 폴더)

`scripts/optional/start-rhwp-windows.{bat,ps1}` 등으로 추가하되 README 에 "옵션 도구, 메인 흐름 아님" 명시.

## 권장

**옵션 B (위키 문서) + 옵션 A 일부 (zip 직접 포함은 거절)** 권장.

이유:
1. 작성자의 사용자 친화 의도는 가치 있음 — 위키 가이드로 보존
2. zip 내 스크립트 자체를 저장소에 직접 추가하는 것은 vite.config 충돌 / 포트 변경 / 보안 등 부작용
3. cloudflared 는 사용자 환경 의존이므로 가이드 형태가 적합
4. 작성자 attribution 보존하여 기여 가치 인정
5. 저장소 일관성 (vite.config.ts 단일 진실의 원천) 유지

대안 — 작성자가 PR 형태로 다음을 처리하면 부분 흡수 가능:
- `vite.config.ts` 자체에 환경변수 기반 allowedHosts 분기 (자동 생성 대신)
- 포트 7700 유지
- README / 문서에 사용 가이드 + 보안 경고

## 다음 단계 — 작업지시자 결정

A / B / C / D 중 결정 부탁드립니다.

권장:
- **B + A 일부**: 위키 가이드 신설 (작성자 attribution 포함) + zip 직접 흡수는 거절
- 또는 **C**: 작성자에게 PR 권유 (vite.config 직접 수정 형태로)

## 참고

- 첨부 분석 위치: `/tmp/issue375/run-install.zip` (해시 검증 가능)
- 관련 파일: `rhwp-studio/vite.config.ts`, `CLAUDE.md` (E2E 7700 가정)
- 작성자 GitHub: [@NoteBlockMR](https://github.com/NoteBlockMR)
