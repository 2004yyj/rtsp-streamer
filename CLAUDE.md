# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

이 저장소는 Claude Code 활용법을 학습하기 위한 스터디 프로젝트입니다.
Claude Code의 기능(CLAUDE.md, Memory, Skills, Hooks 등)을 실습하고, 서브 프로젝트를 통해 실제 개발도 함께 진행합니다.

## Sub Project: MediaMTX Manager

MediaMTX를 활용한 RTSP 서버 관리 애플리케이션.

### 실행 모드
- **웹 모드**: Rust 웹 서버가 React UI를 서빙 + REST API 제공, 브라우저에서 접속
- `cargo run -p mediamtx-manager-web` 으로 실행, `http://localhost:8080` 접속

### 기술 스택
- **백엔드**: Rust (axum) — REST API + 정적 파일 서빙
- **프론트엔드**: React / TypeScript / Vite / Tailwind CSS
- **대상 플랫폼**: macOS, Windows, Linux (브라우저 접속)

### MediaMTX란?
- Go 기반 오픈소스 미디어 서버 ([bluenviron/mediamtx](https://github.com/bluenviron/mediamtx))
- RTSP/RTMP/HLS/WebRTC 지원
- REST API 제공 (기본 포트 9997)
- YAML 기반 설정 파일

### MediaMTX YAML 설정 구조

mediamtx.yml은 **플랫 구조**로, 글로벌 설정이 루트 레벨에 존재하며 중첩 키는 `pathDefaults`와 `paths` 두 개뿐이다.

#### 설정 카테고리 (UI 탭/섹션 매핑 기준)

| 카테고리 | 주요 필드 | UI 우선순위 |
|---------|----------|-----------|
| **General/Logging** | logLevel, logDestinations, logFile, readTimeout, writeTimeout, writeQueueSize, udpMaxPayloadSize | 높음 |
| **Authentication** | authMethod(internal/http/jwt), authInternalUsers, authHTTPAddress, authJWTJWKS | 높음 |
| **API** | api(bool), apiAddress(:9997) | 필수 |
| **RTSP** | rtsp(bool), rtspAddress(:8554), rtspEncryption(no/strict/optional), rtspTransports, rtspAuthMethods | 높음 |
| **RTMP** | rtmp(bool), rtmpAddress(:1935), rtmpEncryption | 보통 |
| **HLS** | hls(bool), hlsAddress(:8888), hlsVariant(mpegts/fmp4/lowLatency), hlsSegmentCount, hlsSegmentDuration | 높음 |
| **WebRTC** | webrtc(bool), webrtcAddress(:8889), webrtcICEServers2, webrtcLocalUDPAddress, webrtcAdditionalHosts | 높음 |
| **SRT** | srt(bool), srtAddress(:8890) | 보통 |
| **Metrics** | metrics(bool), metricsAddress(:9998) | 낮음 |
| **Playback** | playback(bool), playbackAddress(:9996) | 낮음 |
| **PPROF** | pprof(bool), pprofAddress(:9999) | 낮음 |
| **Recording** | record(bool), recordPath, recordFormat(fmp4/mpegts), recordSegmentDuration, recordDeleteAfter | 높음 |
| **Path Defaults** | source, sourceOnDemand, maxReaders, runOn* hooks | 높음 |

#### 데이터 타입별 UI 컴포넌트 매핑

| 데이터 타입 | 예시 값 | UI 컴포넌트 |
|------------|---------|------------|
| bool | `true`/`false` | Toggle Switch |
| enum | `info`, `no`/`strict`/`optional` | Select/Dropdown |
| string | `/path/to/file` | Text Input |
| int | `512`, `7` | Number Input |
| duration | `10s`, `1h`, `200ms` | Text Input + 단위 힌트 |
| size | `50M` | Text Input + 단위 힌트 |
| address | `:8554`, `0.0.0.0:8554` | Text Input (포트 강조) |
| string[] | `[udp, multicast, tcp]` | Checkbox Group 또는 Tag Input |
| object[] | `webrtcICEServers2`, `authInternalUsers` | 동적 폼 리스트 |

#### 설정 UI 구현 원칙

1. **카테고리별 탭/섹션**: 12개 카테고리를 탭 또는 아코디언으로 그룹화
2. **프로토콜 공통 패턴**: 각 프로토콜은 `{proto}`(활성화), `{proto}Address`(주소), `{proto}Encryption`(암호화), TLS 키/인증서, CORS 필드를 공유 — 재사용 가능한 프로토콜 설정 컴포넌트로 추출
3. **pathDefaults vs paths**: "경로 기본값 편집"과 "개별 경로 편집"을 분리, 개별 경로는 기본값을 상속
4. **extra 필드 처리**: Rust 모델의 `extra: HashMap<String, Value>`로 아직 타이핑되지 않은 필드도 편집 가능해야 함
5. **Hot Reload 연동**: 설정 저장 시 MediaMTX API `PATCH /v3/config/global/patch` 호출로 런타임 반영, 필요 시 YAML 파일 직접 쓰기 + 프로세스 재시작
6. **Raw YAML 폴백**: 폼 UI로 커버하지 못하는 필드는 기존 YAML 에디터 탭에서 직접 편집

### 기능 목록

#### Phase 1: 코어
- MediaMTX 바이너리 다운로드/업데이트 및 프로세스 시작/중지
- 경로(Path) 관리 — 다중 스트림 경로 CRUD
- 설정 파일(YAML) 조회/편집 + Hot Reload (클라이언트 연결 유지한 채 설정 반영)

#### Phase 2: 스트림 관리
- **Publish**: SRT, WebRTC, RTSP, RTMP, HLS, MPEG-TS, RTP 소스 발행 설정
- **Read/Play**: SRT, WebRTC, RTSP, RTMP, HLS 스트림 구독/재생
- 프로토콜 간 자동 변환 설정
- Always-available 스트림 설정 (발행자 오프라인 시에도 경로 유지)

#### Phase 3: 녹화 & 재생
- 스트림 녹화 설정 (fMP4 / MPEG-TS 포맷)
- 녹화된 스트림 목록 조회 및 재생

#### Phase 4: 인증 & 라우팅
- 인증 설정 (Internal / HTTP / JWT)
- 스트림 포워딩 (다른 서버로 전달)
- 프록시 설정 (다른 서버 요청 중계)

#### Phase 5: 모니터링 & 운영
- 연결된 클라이언트 및 스트림 상태 실시간 모니터링
- Prometheus 메트릭 대시보드
- CPU/RAM 성능 모니터링
- Hooks 관리 (클라이언트 connect/disconnect/read/publish 이벤트에 외부 명령 실행)

## Git 관리 원칙

### 커밋 메시지
- Conventional Commits 형식 사용: `type: 설명`
- type: `init`, `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `ci`
- 설명은 한국어로 작성
- 예: `feat: 경로 관리 CRUD API 추가`, `fix: 프로세스 종료 시 좀비 프로세스 방지`

### 브랜치 전략
- `main` — 안정된 코드, 직접 커밋 가능 (스터디 프로젝트이므로)
- `feat/<기능명>` — 새로운 기능 개발 시 분기
- `fix/<이슈>` — 버그 수정 시 분기
- 기능 완료 후 코드 리뷰 후 main에 머지

### 커밋 단위
- 하나의 커밋은 하나의 논리적 변경 단위
- 여러 기능을 한 커밋에 섞지 않는다
- 빌드가 깨지지 않는 상태로 커밋한다

## 코드 리뷰

### 워크플로우
1. 기능 구현
2. 코드 리뷰 요청 → 리뷰 결과 확인 → 수정
3. 커밋

### 리뷰 범위
- **코드 품질**: 가독성, 중복, 네이밍, 에러 처리
- **아키텍처**: 의존성 방향, 레이어 분리, core/web 경계 준수
- **보안**: 민감정보 노출, 입력 검증, 의존성 취약점
- **TypeScript**: 타입 안정성, any 사용 지양, 타입가드 패턴

### 리뷰 시점
- 새로운 기능 구현 완료 시
- 복잡한 리팩토링 후
- PR 생성 전

## Language

사용자는 한국어를 사용합니다. 모든 응답은 한국어로 작성합니다.
