import type {
  ApiAdapter,
} from "./adapter";
import type {
  GlobalConfig,
  PathConfig,
  PathConfigList,
  PathItem,
  PathList,
  ProcessStatus,
  BinaryInfo,
} from "./types";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const resp = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!resp.ok) {
    const body = await resp.text().catch(() => "");
    throw new Error(`API error ${resp.status}: ${body}`);
  }
  const text = await resp.text();
  return text ? JSON.parse(text) : undefined;
}

export class HttpClient implements ApiAdapter {
  async startProcess(): Promise<void> {
    await request("/api/process/start", { method: "POST" });
  }
  async stopProcess(): Promise<void> {
    await request("/api/process/stop", { method: "POST" });
  }
  async restartProcess(): Promise<void> {
    await request("/api/process/restart", { method: "POST" });
  }
  async getProcessStatus(): Promise<ProcessStatus> {
    return request("/api/process/status");
  }
  async downloadBinary(version?: string): Promise<BinaryInfo> {
    return request("/api/process/download", {
      method: "POST",
      body: JSON.stringify({ version }),
    });
  }

  async listPathConfigs(): Promise<PathConfigList> {
    return request("/api/paths/configs");
  }
  async getPathConfig(name: string): Promise<PathConfig> {
    return request(`/api/paths/configs/${encodeURIComponent(name)}`);
  }
  async addPathConfig(name: string, config: PathConfig): Promise<void> {
    await request(`/api/paths/configs/${encodeURIComponent(name)}`, {
      method: "POST",
      body: JSON.stringify(config),
    });
  }
  async updatePathConfig(name: string, config: PathConfig): Promise<void> {
    await request(`/api/paths/configs/${encodeURIComponent(name)}`, {
      method: "PATCH",
      body: JSON.stringify(config),
    });
  }
  async deletePathConfig(name: string): Promise<void> {
    await request(`/api/paths/configs/${encodeURIComponent(name)}`, {
      method: "DELETE",
    });
  }

  async listPaths(): Promise<PathList> {
    return request("/api/paths");
  }
  async getPath(name: string): Promise<PathItem> {
    return request(`/api/paths/${encodeURIComponent(name)}`);
  }

  async getGlobalConfig(): Promise<GlobalConfig> {
    return request("/api/config/global");
  }
  async patchGlobalConfig(config: Partial<GlobalConfig>): Promise<void> {
    await request("/api/config/global", {
      method: "PATCH",
      body: JSON.stringify(config),
    });
  }

  async readConfigFile(): Promise<string> {
    return request("/api/config/file");
  }
  async writeConfigFile(content: string): Promise<void> {
    await request("/api/config/file", {
      method: "PUT",
      body: JSON.stringify({ content }),
    });
  }

  async startPublish(pathName: string, filePath: string, looped?: boolean): Promise<void> {
    await request("/api/publish/start", {
      method: "POST",
      body: JSON.stringify({ pathName, filePath, looped: looped ?? true }),
    });
  }
  async stopPublish(pathName: string): Promise<void> {
    await request(`/api/publish/stop/${encodeURIComponent(pathName)}`, {
      method: "POST",
    });
  }
  async listPublishing(): Promise<string[]> {
    return request("/api/publish");
  }
}
