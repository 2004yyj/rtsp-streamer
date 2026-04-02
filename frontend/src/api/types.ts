export interface GlobalConfig {
  // General / Logging
  logLevel?: string;
  logDestinations?: string[];
  logFile?: string;
  readTimeout?: string;
  writeTimeout?: string;
  writeQueueSize?: number;
  udpMaxPayloadSize?: number;
  readBufferCount?: number;
  runOnConnect?: string;
  runOnConnectRestart?: boolean;
  runOnDisconnect?: string;

  // API
  api?: boolean;
  apiAddress?: string;
  apiEncryption?: boolean;
  apiServerKey?: string;
  apiServerCert?: string;
  apiAllowOrigin?: string;

  // RTSP
  rtsp?: boolean;
  rtspAddress?: string;
  rtspEncryption?: string;
  rtspsAddress?: string;
  rtspAuthMethods?: string[];
  rtspTransports?: string[];

  // RTMP
  rtmp?: boolean;
  rtmpAddress?: string;
  rtmpEncryption?: string;
  rtmpsAddress?: string;

  // HLS
  hls?: boolean;
  hlsAddress?: string;
  hlsEncryption?: boolean;
  hlsAllowOrigin?: string;
  hlsVariant?: string;
  hlsSegmentCount?: number;
  hlsSegmentDuration?: string;
  hlsPartDuration?: string;
  hlsSegmentMaxSize?: string;
  hlsAlwaysRemux?: boolean;
  hlsMuxerCloseAfter?: string;

  // WebRTC
  webrtc?: boolean;
  webrtcAddress?: string;
  webrtcEncryption?: boolean;
  webrtcAllowOrigin?: string;
  webrtcLocalUDPAddress?: string;
  webrtcLocalTCPAddress?: string;
  webrtcIPsFromInterfaces?: boolean;
  webrtcIPsFromInterfacesList?: string[];
  webrtcAdditionalHosts?: string[];
  webrtcICEServers2?: WebRTCICEServer[];

  // SRT
  srt?: boolean;
  srtAddress?: string;

  // Metrics
  metrics?: boolean;
  metricsAddress?: string;

  // Playback
  playback?: boolean;
  playbackAddress?: string;

  // PPROF
  pprof?: boolean;
  pprofAddress?: string;

  // Recording
  record?: boolean;
  recordPath?: string;
  recordFormat?: string;
  recordPartDuration?: string;
  recordSegmentDuration?: string;
  recordDeleteAfter?: string;

  // Authentication
  authMethod?: string;
  authInternalUsers?: AuthInternalUser[];
  authHTTPAddress?: string;
  authHTTPExclude?: AuthHTTPExclude[];
  authJWTJWKS?: string;

  [key: string]: unknown;
}

export interface WebRTCICEServer {
  url: string;
  username?: string;
  password?: string;
}

export interface AuthInternalUser {
  user: string;
  pass?: string;
  ips?: string[];
  permissions?: AuthPermission[];
}

export interface AuthPermission {
  action: string;
  path?: string;
}

export interface AuthHTTPExclude {
  action: string;
  path?: string;
}

export interface PathConfig {
  name?: string;
  source?: string;
  sourceOnDemand?: boolean;
  sourceOnDemandStartTimeout?: string;
  sourceOnDemandCloseAfter?: string;
  record?: boolean;
  recordPath?: string;
  recordFormat?: string;
  runOnInit?: string;
  runOnReady?: string;
  runOnRead?: string;
  runOnUnread?: string;
  [key: string]: unknown;
}

export interface PathConfigList {
  pageCount: number;
  items: PathConfig[];
}

export interface SourceInfo {
  type?: string;
  id?: string;
}

export interface ReaderInfo {
  type?: string;
  id?: string;
}

export interface PathItem {
  name: string;
  source?: SourceInfo;
  readers?: ReaderInfo[];
  ready?: boolean;
  bytesReceived?: number;
  bytesSent?: number;
}

export interface PathList {
  pageCount: number;
  items: PathItem[];
}

export type ProcessStatusType = "stopped" | "starting" | "running" | "stopping" | "error";

export interface ProcessStatus {
  status: ProcessStatusType;
  message?: string;
}

export interface BinaryInfo {
  version: string;
  path: string;
  os: string;
  arch: string;
}
