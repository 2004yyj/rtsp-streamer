import type {
  GlobalConfig,
  PathConfig,
  PathConfigList,
  PathItem,
  PathList,
  ProcessStatus,
  BinaryInfo,
} from "./types";

export interface ApiAdapter {
  // 프로세스
  startProcess(): Promise<void>;
  stopProcess(): Promise<void>;
  restartProcess(): Promise<void>;
  getProcessStatus(): Promise<ProcessStatus>;
  downloadBinary(version?: string): Promise<BinaryInfo>;

  // 경로 설정 CRUD
  listPathConfigs(): Promise<PathConfigList>;
  getPathConfig(name: string): Promise<PathConfig>;
  addPathConfig(name: string, config: PathConfig): Promise<void>;
  updatePathConfig(name: string, config: PathConfig): Promise<void>;
  deletePathConfig(name: string): Promise<void>;

  // 활성 경로
  listPaths(): Promise<PathList>;
  getPath(name: string): Promise<PathItem>;

  // 글로벌 설정
  getGlobalConfig(): Promise<GlobalConfig>;
  patchGlobalConfig(config: Partial<GlobalConfig>): Promise<void>;

  // 설정 파일
  readConfigFile(): Promise<string>;
  writeConfigFile(content: string): Promise<void>;

  // 파일 발행
  startPublish(pathName: string, filePath: string, looped?: boolean): Promise<void>;
  stopPublish(pathName: string): Promise<void>;
  listPublishing(): Promise<string[]>;
}

let adapter: ApiAdapter | null = null;

export async function getApiAdapter(): Promise<ApiAdapter> {
  if (!adapter) {
    const { HttpClient } = await import("./http-client");
    adapter = new HttpClient();
  }
  return adapter;
}
