import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  usePathConfigs,
  useAddPathConfig,
  useDeletePathConfig,
} from "../hooks/use-paths";
import type { PathConfig } from "../api/types";
import { cn } from "../lib/utils";

const sourceTypes = [
  { value: "publisher", label: "Publisher", placeholder: "", hint: "외부에서 이 경로로 스트림을 발행" },
  { value: "rtsp", label: "RTSP", placeholder: "rtsp://192.168.1.100:8554/stream", hint: "RTSP 소스에서 스트림을 가져옴" },
  { value: "rtmp", label: "RTMP", placeholder: "rtmp://192.168.1.100/live/stream", hint: "RTMP 소스에서 스트림을 가져옴" },
  { value: "hls", label: "HLS", placeholder: "http://example.com/stream/index.m3u8", hint: "HLS 소스에서 스트림을 가져옴" },
  { value: "rpiCamera", label: "RPi Camera", placeholder: "", hint: "Raspberry Pi 카메라 모듈" },
] as const;

type SourceType = (typeof sourceTypes)[number]["value"];

export default function PathsPage() {
  const { data: configs, isLoading } = usePathConfigs();
  const addPath = useAddPathConfig();
  const deletePath = useDeletePathConfig();

  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [sourceType, setSourceType] = useState<SourceType>("publisher");
  const [sourceUrl, setSourceUrl] = useState("");
  const [onDemand, setOnDemand] = useState(false);

  const handleAdd = () => {
    if (!newName.trim()) return;
    const config: PathConfig = {};

    if (sourceType === "publisher") {
      config.source = "publisher";
    } else if (sourceType === "rpiCamera") {
      config.source = "rpiCamera";
    } else if (sourceUrl.trim()) {
      config.source = sourceUrl.trim();
    }

    if (onDemand) {
      config.sourceOnDemand = true;
    }

    addPath.mutate(
      { name: newName.trim(), config },
      {
        onSuccess: () => {
          setNewName("");
          setSourceType("publisher");
          setSourceUrl("");
          setOnDemand(false);
          setShowForm(false);
        },
      }
    );
  };

  const handleDelete = (name: string) => {
    if (confirm(`Delete path "${name}"?`)) {
      deletePath.mutate(name);
    }
  };

  const needsUrl = sourceType !== "publisher" && sourceType !== "rpiCamera";
  const selectedSource = sourceTypes.find((s) => s.value === sourceType)!;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Paths</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Path
        </button>
      </div>

      {/* 추가 폼 */}
      {showForm && (
        <div className="rounded-lg border border-blue-200 dark:border-blue-800 p-4 space-y-4 bg-blue-50 dark:bg-blue-950">
          {/* Path Name */}
          <div>
            <label className="block text-sm font-medium mb-1">Path Name</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="stream1"
              className="w-full px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
            />
          </div>

          {/* Source Type */}
          <div>
            <label className="block text-sm font-medium mb-2">Source Type</label>
            <div className="flex flex-wrap gap-2">
              {sourceTypes.map((st) => (
                <button
                  key={st.value}
                  type="button"
                  onClick={() => {
                    setSourceType(st.value);
                    setSourceUrl("");
                  }}
                  className={cn(
                    "px-3 py-1.5 text-sm rounded-md border transition-colors",
                    sourceType === st.value
                      ? "border-blue-500 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                      : "border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                  )}
                >
                  {st.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">{selectedSource.hint}</p>
          </div>

          {/* Source URL */}
          {needsUrl && (
            <div>
              <label className="block text-sm font-medium mb-1">Source URL</label>
              <input
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder={selectedSource.placeholder}
                className="w-full px-3 py-1.5 text-sm font-mono rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
              />
            </div>
          )}

          {/* Source On Demand */}
          {sourceType !== "publisher" && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                role="switch"
                aria-checked={onDemand}
                onClick={() => setOnDemand(!onDemand)}
                className={cn(
                  "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                  onDemand ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform",
                    onDemand ? "translate-x-4" : "translate-x-0"
                  )}
                />
              </button>
              <div>
                <span className="text-sm font-medium">On Demand</span>
                <p className="text-xs text-gray-500">독자가 접속할 때만 소스 연결</p>
              </div>
            </div>
          )}

          {/* 버튼 */}
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={addPath.isPending || !newName.trim() || (needsUrl && !sourceUrl.trim())}
              className="px-3 py-1.5 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {addPath.isPending ? "Adding..." : "Add"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* 경로 목록 */}
      {isLoading ? (
        <p className="text-gray-500">Loading...</p>
      ) : configs && configs.items.length > 0 ? (
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Name</th>
                <th className="text-left px-4 py-2 font-medium">Source</th>
                <th className="text-left px-4 py-2 font-medium">On Demand</th>
                <th className="text-left px-4 py-2 font-medium">Record</th>
                <th className="text-right px-4 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {configs.items.map((cfg) => (
                <tr key={cfg.name ?? "unknown"}>
                  <td className="px-4 py-2 font-mono">{cfg.name ?? "—"}</td>
                  <td className="px-4 py-2 text-gray-500 font-mono text-xs max-w-xs truncate">
                    {cfg.source ?? "publisher"}
                  </td>
                  <td className="px-4 py-2">
                    <span className={cn(
                      "inline-block px-1.5 py-0.5 rounded text-xs",
                      cfg.sourceOnDemand
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                        : "bg-gray-100 text-gray-500 dark:bg-gray-800"
                    )}>
                      {cfg.sourceOnDemand ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span className={cn(
                      "inline-block px-1.5 py-0.5 rounded text-xs",
                      cfg.record
                        ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                        : "bg-gray-100 text-gray-500 dark:bg-gray-800"
                    )}>
                      {cfg.record ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => handleDelete(cfg.name ?? "")}
                      disabled={deletePath.isPending}
                      className="inline-flex items-center p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-500">No paths configured.</p>
      )}
    </div>
  );
}
