# MediaMTX Manager

MediaMTX 미디어 서버를 관리하는 크로스 플랫폼 데스크탑/웹 애플리케이션.

## 실행 모드

- **데스크탑**: Tauri 앱 (macOS / Windows / Linux)
- **웹**: 브라우저 접속 (서버/headless 환경)

동일한 React 프론트엔드를 양쪽 모드에서 공유합니다.

## 프로젝트 구조

```
mediamtx-manager/
├── crates/
│   ├── core/           # 공유 비즈니스 로직 (MediaMTX API 클라이언트, 프로세스 관리 등)
│   ├── tauri-app/      # Tauri 데스크탑 앱 (core를 Tauri commands로 노출)
│   └── web-server/     # 웹 서버 (core를 REST API로 노출 + 프론트엔드 서빙)
├── frontend/           # React + TypeScript 프론트엔드
│   └── src/
│       ├── api/        # API 어댑터 (Tauri invoke / HTTP fetch 분기)
│       ├── components/ # 공통 UI 컴포넌트
│       └── pages/      # 페이지 단위 뷰
├── Cargo.toml          # Rust 워크스페이스
└── CLAUDE.md
```

## 기술 스택

| 영역 | 기술 |
|------|------|
| 공유 코어 | Rust |
| 데스크탑 | Tauri 2.x |
| 웹 서버 | Rust (axum) |
| 프론트엔드 | React, TypeScript, Vite |

## 기능

### Phase 1: 코어
- MediaMTX 바이너리 다운로드/업데이트 및 프로세스 시작/중지
- 경로(Path) 관리 — 다중 스트림 경로 CRUD
- 설정 파일(YAML) 조회/편집 + Hot Reload

### Phase 2: 스트림 관리
- Publish: SRT, WebRTC, RTSP, RTMP, HLS, MPEG-TS, RTP 소스 발행 설정
- Read/Play: SRT, WebRTC, RTSP, RTMP, HLS 스트림 구독/재생
- 프로토콜 간 자동 변환 설정
- Always-available 스트림 설정

### Phase 3: 녹화 & 재생
- 스트림 녹화 설정 (fMP4 / MPEG-TS)
- 녹화된 스트림 목록 조회 및 재생

### Phase 4: 인증 & 라우팅
- 인증 설정 (Internal / HTTP / JWT)
- 스트림 포워딩 및 프록시 설정

### Phase 5: 모니터링 & 운영
- 연결된 클라이언트 및 스트림 상태 실시간 모니터링
- Prometheus 메트릭 대시보드
- CPU/RAM 성능 모니터링
- Hooks 관리 (connect/disconnect/read/publish 이벤트)

## 개발 환경 요구사항

- Rust (latest stable)
- Node.js 18+
- pnpm (또는 npm)

## 빌드

```bash
# Rust 워크스페이스 빌드
cargo build

# 프론트엔드 (추후 설정)
cd frontend && pnpm install && pnpm dev
```

## 라이선스

MIT
