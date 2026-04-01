import { useState } from "react";
import { Save } from "lucide-react";
import {
  useGlobalConfig,
  usePatchGlobalConfig,
  useConfigFile,
  useWriteConfigFile,
} from "../hooks/use-config";

export default function SettingsPage() {
  const [tab, setTab] = useState<"form" | "yaml">("form");

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Settings</h2>

      {/* 탭 */}
      <div className="flex border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setTab("form")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "form"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Global Config
        </button>
        <button
          onClick={() => setTab("yaml")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "yaml"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          YAML Editor
        </button>
      </div>

      {tab === "form" ? <GlobalConfigForm /> : <YamlEditor />}
    </div>
  );
}

function GlobalConfigForm() {
  const { data: config, isLoading } = useGlobalConfig();
  const patchConfig = usePatchGlobalConfig();
  const [logLevel, setLogLevel] = useState("");

  // config가 로드되면 로컬 state 초기화
  if (config && !logLevel && config.logLevel) {
    setLogLevel(config.logLevel);
  }

  if (isLoading) return <p className="text-gray-500">Loading...</p>;

  return (
    <div className="space-y-4 max-w-lg">
      <div>
        <label className="block text-sm font-medium mb-1">Log Level</label>
        <select
          value={logLevel}
          onChange={(e) => setLogLevel(e.target.value)}
          className="w-full px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
        >
          <option value="error">error</option>
          <option value="warn">warn</option>
          <option value="info">info</option>
          <option value="debug">debug</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[
          { label: "RTSP", key: "rtsp" as const, addr: config?.rtspAddress },
          { label: "RTMP", key: "rtmp" as const, addr: config?.rtmpAddress },
          { label: "HLS", key: "hls" as const, addr: config?.hlsAddress },
          { label: "WebRTC", key: "webrtc" as const, addr: config?.webrtcAddress },
          { label: "SRT", key: "srt" as const, addr: config?.srtAddress },
          { label: "API", key: "api" as const, addr: config?.apiAddress },
        ].map((proto) => (
          <div
            key={proto.key}
            className="flex items-center justify-between p-3 rounded-md border border-gray-200 dark:border-gray-800"
          >
            <span className="text-sm font-medium">{proto.label}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">{proto.addr ?? "—"}</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  config?.[proto.key] !== false
                    ? "bg-green-500"
                    : "bg-gray-300"
                }`}
              />
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => patchConfig.mutate({ logLevel })}
        disabled={patchConfig.isPending}
        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        <Save className="w-4 h-4" />
        {patchConfig.isPending ? "Saving..." : "Save"}
      </button>
    </div>
  );
}

function YamlEditor() {
  const { data: content, isLoading } = useConfigFile();
  const writeFile = useWriteConfigFile();
  const [yaml, setYaml] = useState("");
  const [initialized, setInitialized] = useState(false);

  if (content && !initialized) {
    setYaml(typeof content === "string" ? content : (content as any).content ?? "");
    setInitialized(true);
  }

  if (isLoading) return <p className="text-gray-500">Loading...</p>;

  return (
    <div className="space-y-3">
      <textarea
        value={yaml}
        onChange={(e) => setYaml(e.target.value)}
        className="w-full h-96 px-4 py-3 text-sm font-mono rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 resize-y"
        spellCheck={false}
      />
      <button
        onClick={() => writeFile.mutate(yaml)}
        disabled={writeFile.isPending}
        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        <Save className="w-4 h-4" />
        {writeFile.isPending ? "Saving..." : "Save YAML"}
      </button>
    </div>
  );
}
