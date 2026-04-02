import { useState, useCallback } from "react";
import { Save, RotateCcw } from "lucide-react";
import {
  useGlobalConfig,
  usePatchGlobalConfig,
  useConfigFile,
  useWriteConfigFile,
} from "../hooks/use-config";
import type { GlobalConfig, WebRTCICEServer, AuthInternalUser } from "../api/types";
import {
  Section,
  ProtocolSection,
  TextField,
  NumberField,
  SelectField,
  ToggleField,
} from "../components/settings/form-fields";
import { cn } from "../lib/utils";

type Category =
  | "general"
  | "protocols"
  | "recording"
  | "auth"
  | "yaml";

const categories: { key: Category; label: string }[] = [
  { key: "general", label: "General" },
  { key: "protocols", label: "Protocols" },
  { key: "recording", label: "Recording" },
  { key: "auth", label: "Authentication" },
  { key: "yaml", label: "YAML Editor" },
];

export default function SettingsPage() {
  const [tab, setTab] = useState<Category>("general");

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Settings</h2>

      {/* 카테고리 탭 */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setTab(cat.key)}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
              tab === cat.key
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {tab === "yaml" ? (
        <YamlEditor />
      ) : (
        <ConfigFormLoader activeTab={tab} />
      )}
    </div>
  );
}

function ConfigFormLoader({ activeTab }: { activeTab: Category }) {
  const { data: config, isLoading, dataUpdatedAt } = useGlobalConfig();

  if (isLoading || !config) return <p className="text-gray-500">Loading...</p>;

  return (
    <ConfigForm key={dataUpdatedAt} activeTab={activeTab} initialConfig={config} />
  );
}

function ConfigForm({
  activeTab,
  initialConfig,
}: {
  activeTab: Category;
  initialConfig: GlobalConfig;
}) {
  const patchConfig = usePatchGlobalConfig();
  const [draft, setDraft] = useState<Partial<GlobalConfig>>(initialConfig);
  const [dirty, setDirty] = useState(false);

  const update = useCallback(
    <K extends keyof GlobalConfig>(key: K, value: GlobalConfig[K]) => {
      setDraft((prev) => ({ ...prev, [key]: value }));
      setDirty(true);
    },
    []
  );

  const handleSave = () => {
    patchConfig.mutate(draft, {
      onSuccess: () => setDirty(false),
    });
  };

  const handleReset = () => {
    setDraft(initialConfig);
    setDirty(false);
  };

  return (
    <div className="space-y-6">
      {activeTab === "general" && (
        <GeneralSection draft={draft} update={update} />
      )}
      {activeTab === "protocols" && (
        <ProtocolsSection draft={draft} update={update} />
      )}
      {activeTab === "recording" && (
        <RecordingSection draft={draft} update={update} />
      )}
      {activeTab === "auth" && (
        <AuthSection draft={draft} update={update} />
      )}

      {/* 저장 버튼 */}
      <div className="flex items-center gap-3 pt-2 border-t border-gray-200 dark:border-gray-800">
        <button
          onClick={handleSave}
          disabled={!dirty || patchConfig.isPending}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {patchConfig.isPending ? "Saving..." : "Save"}
        </button>
        <button
          onClick={handleReset}
          disabled={!dirty}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>
        {patchConfig.isSuccess && !dirty && (
          <span className="text-sm text-green-600">Saved</span>
        )}
      </div>
    </div>
  );
}

// ──────────────── General ────────────────

interface SectionFormProps {
  draft: Partial<GlobalConfig>;
  update: <K extends keyof GlobalConfig>(key: K, value: GlobalConfig[K]) => void;
}

function GeneralSection({ draft, update }: SectionFormProps) {
  return (
    <div className="space-y-6 max-w-2xl">
      <Section title="Logging" description="로그 출력 및 레벨 설정">
        <SelectField
          label="Log Level"
          value={draft.logLevel ?? "info"}
          onChange={(v) => update("logLevel", v)}
          options={[
            { value: "error", label: "Error" },
            { value: "warn", label: "Warn" },
            { value: "info", label: "Info" },
            { value: "debug", label: "Debug" },
          ]}
        />
        <TextField
          label="Log File"
          value={draft.logFile ?? ""}
          onChange={(v) => update("logFile", v)}
          placeholder="mediamtx.log"
          hint="logDestinations에 file이 포함된 경우 사용"
        />
      </Section>

      <Section title="Timeouts" description="읽기/쓰기 타임아웃 및 버퍼 설정">
        <div className="grid grid-cols-2 gap-4">
          <TextField
            label="Read Timeout"
            value={draft.readTimeout ?? ""}
            onChange={(v) => update("readTimeout", v)}
            placeholder="10s"
            mono
          />
          <TextField
            label="Write Timeout"
            value={draft.writeTimeout ?? ""}
            onChange={(v) => update("writeTimeout", v)}
            placeholder="10s"
            mono
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <NumberField
            label="Write Queue Size"
            value={draft.writeQueueSize}
            onChange={(v) => update("writeQueueSize", v)}
            hint="기본값: 512"
            min={0}
          />
          <NumberField
            label="UDP Max Payload Size"
            value={draft.udpMaxPayloadSize}
            onChange={(v) => update("udpMaxPayloadSize", v)}
            hint="기본값: 1452"
            min={0}
          />
        </div>
      </Section>

      <Section title="Hooks" description="클라이언트 연결/해제 시 실행할 명령">
        <TextField
          label="Run On Connect"
          value={draft.runOnConnect ?? ""}
          onChange={(v) => update("runOnConnect", v)}
          placeholder="명령어 입력"
          mono
        />
        <ToggleField
          label="Run On Connect Restart"
          checked={draft.runOnConnectRestart ?? false}
          onChange={(v) => update("runOnConnectRestart", v)}
          description="연결 시 명령이 종료되면 재시작"
        />
        <TextField
          label="Run On Disconnect"
          value={draft.runOnDisconnect ?? ""}
          onChange={(v) => update("runOnDisconnect", v)}
          placeholder="명령어 입력"
          mono
        />
      </Section>
    </div>
  );
}

// ──────────────── Protocols ────────────────

function ProtocolsSection({ draft, update }: SectionFormProps) {
  return (
    <div className="space-y-4 max-w-2xl">
      {/* API */}
      <ProtocolSection
        title="API"
        enabled={draft.api ?? false}
        onToggle={(v) => update("api", v)}
        address={draft.apiAddress ?? ""}
        onAddressChange={(v) => update("apiAddress", v)}
        defaultPort=":9997"
      />

      {/* RTSP */}
      <ProtocolSection
        title="RTSP"
        enabled={draft.rtsp !== false}
        onToggle={(v) => update("rtsp", v)}
        address={draft.rtspAddress ?? ""}
        onAddressChange={(v) => update("rtspAddress", v)}
        defaultPort=":8554"
      >
        <SelectField
          label="Encryption"
          value={draft.rtspEncryption ?? "no"}
          onChange={(v) => update("rtspEncryption", v)}
          options={[
            { value: "no", label: "No" },
            { value: "optional", label: "Optional" },
            { value: "strict", label: "Strict" },
          ]}
        />
        {(draft.rtspEncryption === "optional" ||
          draft.rtspEncryption === "strict") && (
          <TextField
            label="RTSPS Address"
            value={draft.rtspsAddress ?? ""}
            onChange={(v) => update("rtspsAddress", v)}
            placeholder=":8322"
            mono
          />
        )}
      </ProtocolSection>

      {/* RTMP */}
      <ProtocolSection
        title="RTMP"
        enabled={draft.rtmp !== false}
        onToggle={(v) => update("rtmp", v)}
        address={draft.rtmpAddress ?? ""}
        onAddressChange={(v) => update("rtmpAddress", v)}
        defaultPort=":1935"
      >
        <SelectField
          label="Encryption"
          value={draft.rtmpEncryption ?? "no"}
          onChange={(v) => update("rtmpEncryption", v)}
          options={[
            { value: "no", label: "No" },
            { value: "optional", label: "Optional" },
            { value: "strict", label: "Strict" },
          ]}
        />
        {(draft.rtmpEncryption === "optional" ||
          draft.rtmpEncryption === "strict") && (
          <TextField
            label="RTMPS Address"
            value={draft.rtmpsAddress ?? ""}
            onChange={(v) => update("rtmpsAddress", v)}
            placeholder=":1936"
            mono
          />
        )}
      </ProtocolSection>

      {/* HLS */}
      <ProtocolSection
        title="HLS"
        enabled={draft.hls !== false}
        onToggle={(v) => update("hls", v)}
        address={draft.hlsAddress ?? ""}
        onAddressChange={(v) => update("hlsAddress", v)}
        defaultPort=":8888"
      >
        <SelectField
          label="Variant"
          value={draft.hlsVariant ?? "lowLatency"}
          onChange={(v) => update("hlsVariant", v)}
          options={[
            { value: "mpegts", label: "MPEG-TS" },
            { value: "fmp4", label: "fMP4" },
            { value: "lowLatency", label: "Low Latency" },
          ]}
        />
        <div className="grid grid-cols-2 gap-4">
          <NumberField
            label="Segment Count"
            value={draft.hlsSegmentCount}
            onChange={(v) => update("hlsSegmentCount", v)}
            hint="기본값: 7"
            min={1}
          />
          <TextField
            label="Segment Duration"
            value={draft.hlsSegmentDuration ?? ""}
            onChange={(v) => update("hlsSegmentDuration", v)}
            placeholder="1s"
            mono
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <TextField
            label="Part Duration"
            value={draft.hlsPartDuration ?? ""}
            onChange={(v) => update("hlsPartDuration", v)}
            placeholder="200ms"
            mono
          />
          <TextField
            label="Segment Max Size"
            value={draft.hlsSegmentMaxSize ?? ""}
            onChange={(v) => update("hlsSegmentMaxSize", v)}
            placeholder="50M"
            mono
          />
        </div>
        <ToggleField
          label="Always Remux"
          checked={draft.hlsAlwaysRemux ?? false}
          onChange={(v) => update("hlsAlwaysRemux", v)}
        />
        <TextField
          label="Muxer Close After"
          value={draft.hlsMuxerCloseAfter ?? ""}
          onChange={(v) => update("hlsMuxerCloseAfter", v)}
          placeholder="60s"
          mono
        />
      </ProtocolSection>

      {/* WebRTC */}
      <ProtocolSection
        title="WebRTC"
        enabled={draft.webrtc !== false}
        onToggle={(v) => update("webrtc", v)}
        address={draft.webrtcAddress ?? ""}
        onAddressChange={(v) => update("webrtcAddress", v)}
        defaultPort=":8889"
      >
        <div className="grid grid-cols-2 gap-4">
          <TextField
            label="Local UDP Address"
            value={draft.webrtcLocalUDPAddress ?? ""}
            onChange={(v) => update("webrtcLocalUDPAddress", v)}
            placeholder=":8189"
            mono
          />
          <TextField
            label="Local TCP Address"
            value={draft.webrtcLocalTCPAddress ?? ""}
            onChange={(v) => update("webrtcLocalTCPAddress", v)}
            placeholder=""
            mono
          />
        </div>
        <ToggleField
          label="IPs From Interfaces"
          checked={draft.webrtcIPsFromInterfaces ?? true}
          onChange={(v) => update("webrtcIPsFromInterfaces", v)}
        />
        <ICEServersList
          servers={draft.webrtcICEServers2 ?? []}
          onChange={(v) => update("webrtcICEServers2", v)}
        />
      </ProtocolSection>

      {/* SRT */}
      <ProtocolSection
        title="SRT"
        enabled={draft.srt !== false}
        onToggle={(v) => update("srt", v)}
        address={draft.srtAddress ?? ""}
        onAddressChange={(v) => update("srtAddress", v)}
        defaultPort=":8890"
      />

      {/* Metrics */}
      <ProtocolSection
        title="Metrics"
        enabled={draft.metrics ?? false}
        onToggle={(v) => update("metrics", v)}
        address={draft.metricsAddress ?? ""}
        onAddressChange={(v) => update("metricsAddress", v)}
        defaultPort=":9998"
      />

      {/* Playback */}
      <ProtocolSection
        title="Playback"
        enabled={draft.playback ?? false}
        onToggle={(v) => update("playback", v)}
        address={draft.playbackAddress ?? ""}
        onAddressChange={(v) => update("playbackAddress", v)}
        defaultPort=":9996"
      />

      {/* PPROF */}
      <ProtocolSection
        title="PPROF"
        enabled={draft.pprof ?? false}
        onToggle={(v) => update("pprof", v)}
        address={draft.pprofAddress ?? ""}
        onAddressChange={(v) => update("pprofAddress", v)}
        defaultPort=":9999"
      />
    </div>
  );
}

// ──────────────── ICE Servers ────────────────

function ICEServersList({
  servers,
  onChange,
}: {
  servers: WebRTCICEServer[];
  onChange: (v: WebRTCICEServer[]) => void;
}) {
  const addServer = () => {
    onChange([...servers, { url: "" }]);
  };

  const removeServer = (idx: number) => {
    onChange(servers.filter((_, i) => i !== idx));
  };

  const updateServer = (idx: number, field: keyof WebRTCICEServer, value: string) => {
    const next = servers.map((s, i) =>
      i === idx ? { ...s, [field]: value } : s
    );
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          ICE Servers
        </span>
        <button
          type="button"
          onClick={addServer}
          className="text-xs text-blue-600 hover:text-blue-700"
        >
          + Add
        </button>
      </div>
      {servers.map((server, idx) => (
        <div
          key={idx}
          className="rounded border border-gray-200 dark:border-gray-700 p-3 space-y-2"
        >
          <div className="flex items-start gap-2">
            <div className="flex-1 space-y-2">
              <input
                type="text"
                value={server.url}
                onChange={(e) => updateServer(idx, "url", e.target.value)}
                placeholder="stun:stun.l.google.com:19302"
                className="w-full px-2 py-1 text-sm font-mono rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={server.username ?? ""}
                  onChange={(e) => updateServer(idx, "username", e.target.value)}
                  placeholder="username"
                  className="px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                />
                <input
                  type="text"
                  value={server.password ?? ""}
                  onChange={(e) => updateServer(idx, "password", e.target.value)}
                  placeholder="password"
                  className="px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => removeServer(idx)}
              className="text-gray-400 hover:text-red-500 text-sm mt-1"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
      {servers.length === 0 && (
        <p className="text-xs text-gray-400">ICE 서버가 없습니다</p>
      )}
    </div>
  );
}

// ──────────────── Recording ────────────────

function RecordingSection({ draft, update }: SectionFormProps) {
  return (
    <div className="space-y-6 max-w-2xl">
      <Section title="Recording" description="스트림 녹화 설정">
        <ToggleField
          label="Enable Recording"
          checked={draft.record ?? false}
          onChange={(v) => update("record", v)}
        />
        {draft.record && (
          <div className="space-y-3">
            <TextField
              label="Record Path"
              value={draft.recordPath ?? ""}
              onChange={(v) => update("recordPath", v)}
              placeholder="./recordings/%path/%Y-%m-%d_%H-%M-%S-%f"
              mono
              hint="사용 가능 변수: %path, %Y, %m, %d, %H, %M, %S, %f"
            />
            <SelectField
              label="Record Format"
              value={draft.recordFormat ?? "fmp4"}
              onChange={(v) => update("recordFormat", v)}
              options={[
                { value: "fmp4", label: "fMP4" },
                { value: "mpegts", label: "MPEG-TS" },
              ]}
            />
            <div className="grid grid-cols-2 gap-4">
              <TextField
                label="Part Duration"
                value={draft.recordPartDuration ?? ""}
                onChange={(v) => update("recordPartDuration", v)}
                placeholder="1s"
                mono
              />
              <TextField
                label="Segment Duration"
                value={draft.recordSegmentDuration ?? ""}
                onChange={(v) => update("recordSegmentDuration", v)}
                placeholder="1h"
                mono
              />
            </div>
            <TextField
              label="Delete After"
              value={draft.recordDeleteAfter ?? ""}
              onChange={(v) => update("recordDeleteAfter", v)}
              placeholder="0s"
              mono
              hint="0s = 자동 삭제 비활성"
            />
          </div>
        )}
      </Section>
    </div>
  );
}

// ──────────────── Auth ────────────────

function AuthSection({ draft, update }: SectionFormProps) {
  const method = draft.authMethod ?? "internal";

  return (
    <div className="space-y-6 max-w-2xl">
      <Section title="Authentication" description="인증 방식 설정">
        <SelectField
          label="Auth Method"
          value={method}
          onChange={(v) => update("authMethod", v)}
          options={[
            { value: "internal", label: "Internal" },
            { value: "http", label: "HTTP" },
            { value: "jwt", label: "JWT" },
          ]}
        />

        {method === "http" && (
          <TextField
            label="HTTP Auth Address"
            value={draft.authHTTPAddress ?? ""}
            onChange={(v) => update("authHTTPAddress", v)}
            placeholder="http://localhost:8080/auth"
            mono
          />
        )}

        {method === "jwt" && (
          <TextField
            label="JWT JWKS URL"
            value={draft.authJWTJWKS ?? ""}
            onChange={(v) => update("authJWTJWKS", v)}
            placeholder="https://example.com/.well-known/jwks.json"
            mono
          />
        )}

        {method === "internal" && (
          <InternalUsersList
            users={draft.authInternalUsers ?? []}
            onChange={(v) => update("authInternalUsers", v)}
          />
        )}
      </Section>
    </div>
  );
}

function InternalUsersList({
  users,
  onChange,
}: {
  users: AuthInternalUser[];
  onChange: (v: AuthInternalUser[]) => void;
}) {
  const addUser = () => {
    onChange([
      ...users,
      { user: "", pass: "", ips: [], permissions: [] },
    ]);
  };

  const removeUser = (idx: number) => {
    onChange(users.filter((_, i) => i !== idx));
  };

  const updateUser = (idx: number, field: keyof AuthInternalUser, value: unknown) => {
    const next = users.map((u, i) =>
      i === idx ? { ...u, [field]: value } : u
    );
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Internal Users
        </span>
        <button
          type="button"
          onClick={addUser}
          className="text-xs text-blue-600 hover:text-blue-700"
        >
          + Add User
        </button>
      </div>
      {users.map((user, idx) => (
        <div
          key={idx}
          className="rounded border border-gray-200 dark:border-gray-700 p-3 space-y-2"
        >
          <div className="flex items-start gap-2">
            <div className="flex-1 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={user.user}
                  onChange={(e) => updateUser(idx, "user", e.target.value)}
                  placeholder="username (any = all)"
                  className="px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                />
                <input
                  type="password"
                  value={user.pass ?? ""}
                  onChange={(e) => updateUser(idx, "pass", e.target.value)}
                  placeholder="password"
                  className="px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                />
              </div>
              <input
                type="text"
                value={(user.ips ?? []).join(", ")}
                onChange={(e) =>
                  updateUser(
                    idx,
                    "ips",
                    e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean)
                  )
                }
                placeholder="허용 IP (쉼표 구분, 빈값 = 모두 허용)"
                className="w-full px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
              />
              {/* Permissions */}
              <div className="text-xs text-gray-500">
                Permissions: {(user.permissions ?? []).length === 0
                  ? "없음"
                  : (user.permissions ?? [])
                      .map((p) => `${p.action}${p.path ? `:${p.path}` : ""}`)
                      .join(", ")}
              </div>
            </div>
            <button
              type="button"
              onClick={() => removeUser(idx)}
              className="text-gray-400 hover:text-red-500 text-sm mt-1"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
      {users.length === 0 && (
        <p className="text-xs text-gray-400">사용자가 없습니다</p>
      )}
    </div>
  );
}

// ──────────────── YAML Editor ────────────────

function YamlEditor() {
  const { data: content, isLoading } = useConfigFile();
  const writeFile = useWriteConfigFile();
  const [yaml, setYaml] = useState("");
  const [initialized, setInitialized] = useState(false);

  if (content && !initialized) {
    setYaml(
      typeof content === "string"
        ? content
        : (content as Record<string, string>).content ?? ""
    );
    setInitialized(true);
  }

  if (isLoading) return <p className="text-gray-500">Loading...</p>;

  return (
    <div className="space-y-3">
      <textarea
        value={yaml}
        onChange={(e) => setYaml(e.target.value)}
        className="w-full h-[32rem] px-4 py-3 text-sm font-mono rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 resize-y"
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
