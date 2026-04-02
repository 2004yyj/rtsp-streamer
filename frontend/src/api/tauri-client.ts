import { invoke } from "@tauri-apps/api/core";
import type { ApiAdapter } from "./adapter";
import type {
  GlobalConfig,
  PathConfig,
  PathConfigList,
  PathItem,
  PathList,
  ProcessStatus,
  BinaryInfo,
} from "./types";

export class TauriClient implements ApiAdapter {
  async startProcess(): Promise<void> {
    return invoke("start_mediamtx");
  }
  async stopProcess(): Promise<void> {
    return invoke("stop_mediamtx");
  }
  async restartProcess(): Promise<void> {
    return invoke("restart_mediamtx");
  }
  async getProcessStatus(): Promise<ProcessStatus> {
    return invoke("get_process_status");
  }
  async downloadBinary(version?: string): Promise<BinaryInfo> {
    return invoke("download_mediamtx", { version });
  }

  async listPathConfigs(): Promise<PathConfigList> {
    return invoke("list_path_configs");
  }
  async getPathConfig(name: string): Promise<PathConfig> {
    return invoke("get_path_config", { name });
  }
  async addPathConfig(name: string, config: PathConfig): Promise<void> {
    return invoke("add_path_config", { name, config });
  }
  async updatePathConfig(name: string, config: PathConfig): Promise<void> {
    return invoke("update_path_config", { name, config });
  }
  async deletePathConfig(name: string): Promise<void> {
    return invoke("delete_path_config", { name });
  }

  async listPaths(): Promise<PathList> {
    return invoke("list_paths");
  }
  async getPath(name: string): Promise<PathItem> {
    return invoke("get_path", { name });
  }

  async getGlobalConfig(): Promise<GlobalConfig> {
    return invoke("get_global_config");
  }
  async patchGlobalConfig(config: Partial<GlobalConfig>): Promise<void> {
    return invoke("patch_global_config", { config });
  }

  async readConfigFile(): Promise<string> {
    return invoke("read_config_file");
  }
  async writeConfigFile(content: string): Promise<void> {
    return invoke("write_config_file", { content });
  }

  async startPublish(pathName: string, filePath: string, looped?: boolean): Promise<void> {
    return invoke("start_publish", { pathName, filePath, looped: looped ?? true });
  }
  async stopPublish(pathName: string): Promise<void> {
    return invoke("stop_publish", { pathName });
  }
  async listPublishing(): Promise<string[]> {
    return invoke("list_publishing");
  }
}
