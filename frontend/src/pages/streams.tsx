import { useState } from "react";
import { Video, Radio, Copy, Check, Upload, Square, FilePlus } from "lucide-react";
import { useActivePaths } from "../hooks/use-paths";
import { useGlobalConfig } from "../hooks/use-config";
import { usePublishingList, useStartPublish, useStopPublish } from "../hooks/use-publish";
import { HLSPlayer } from "../components/stream/hls-player";
import { cn } from "../lib/utils";
import type { PathItem } from "../api/types";

export default function StreamsPage() {
  const { data: paths, isLoading } = useActivePaths();
  const { data: config } = useGlobalConfig();
  const { data: publishingList } = usePublishingList();
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [showPublishForm, setShowPublishForm] = useState(false);

  const readyPaths = paths?.items.filter((p) => p.ready) ?? [];
  const allPaths = paths?.items ?? [];

  const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
  const rtspPort = extractPort(config?.rtspAddress, "8554");
  const rtmpPort = extractPort(config?.rtmpAddress, "1935");
  const srtPort = extractPort(config?.srtAddress, "8890");

  function getUrls(name: string) {
    return {
      rtsp: `rtsp://${host}:${rtspPort}/${name}`,
      rtmp: `rtmp://${host}:${rtmpPort}/${name}`,
      hls: `/hls/${name}/index.m3u8`,
      srt: `srt://${host}:${srtPort}?streamid=read:${name}`,
    };
  }

  const handlePlay = (name: string) => {
    setSelectedPath(selectedPath === name ? null : name);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Streams</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPublishForm(!showPublishForm)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-green-600 text-white hover:bg-green-700"
          >
            <FilePlus className="w-4 h-4" />
            Publish File
          </button>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Radio className="w-4 h-4 text-green-500" />
            <span>{readyPaths.length} ready</span>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <span>{allPaths.length} total</span>
          </div>
        </div>
      </div>

      {showPublishForm && (
        <PublishFileForm onClose={() => setShowPublishForm(false)} />
      )}

      {isLoading ? (
        <p className="text-gray-500">Loading...</p>
      ) : allPaths.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Video className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>활성 스트림이 없습니다</p>
          <p className="text-sm mt-1">Paths 페이지에서 경로를 추가하세요</p>
        </div>
      ) : (
        <div className="space-y-3">
          {allPaths.map((path) => (
            <StreamCard
              key={path.name}
              path={path}
              urls={getUrls(path.name)}
              isPlaying={selectedPath === path.name}
              isPublishing={publishingList?.includes(path.name) ?? false}
              onPlay={() => handlePlay(path.name)}
              hlsEnabled={config?.hls !== false}
              hlsSegmentCount={config?.hlsSegmentCount ?? 7}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ──────────────── Stream Card ────────────────

interface StreamCardProps {
  path: PathItem;
  urls: Record<string, string>;
  isPlaying: boolean;
  isPublishing: boolean;
  onPlay: () => void;
  hlsEnabled: boolean;
  hlsSegmentCount: number;
}

function StreamCard({
  path,
  urls,
  isPlaying,
  isPublishing,
  onPlay,
  hlsEnabled,
  hlsSegmentCount,
}: StreamCardProps) {
  const stopPublish = useStopPublish();

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "w-2.5 h-2.5 rounded-full",
              path.ready ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"
            )}
          />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-mono font-medium">{path.name}</h3>
              {isPublishing && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                  <Upload className="w-3 h-3" />
                  Publishing
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">
              {path.source?.type ?? "no source"}
              {path.readers && path.readers.length > 0 && (
                <span className="ml-2">{path.readers.length} reader(s)</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {path.ready && hlsEnabled && (
            <button
              onClick={onPlay}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors",
                isPlaying
                  ? "bg-blue-600 text-white"
                  : "border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              )}
            >
              <Video className="w-4 h-4" />
              {isPlaying ? "Stop" : "Play"}
            </button>
          )}
          {isPublishing && (
            <button
              onClick={() => stopPublish.mutate(path.name)}
              disabled={stopPublish.isPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
            >
              <Square className="w-3.5 h-3.5" />
              Stop Publish
            </button>
          )}
        </div>
      </div>

      {/* HLS 플레이어 */}
      {isPlaying && path.ready && (
        <div className="relative aspect-video bg-black mx-4 mb-4 rounded-md overflow-hidden">
          <HLSPlayer url={urls.hls} className="absolute inset-0" minSegments={hlsSegmentCount} />
        </div>
      )}

      {/* 프로토콜 URL 목록 */}
      <div className="border-t border-gray-200 dark:border-gray-800 px-4 py-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
        <UrlRow label="RTSP" url={urls.rtsp} />
        <UrlRow label="RTMP" url={urls.rtmp} />
        <UrlRow label="HLS" url={urls.hls} />
        <UrlRow label="SRT" url={urls.srt} />
      </div>
    </div>
  );
}

// ──────────────── URL Row ────────────────

function UrlRow({ label, url }: { label: string; url: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-14 shrink-0 font-medium text-gray-500">{label}</span>
      <code className="flex-1 truncate text-gray-600 dark:text-gray-400">{url}</code>
      <button
        onClick={handleCopy}
        className="shrink-0 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

// ──────────────── Publish Form ────────────────

function PublishFileForm({ onClose }: { onClose: () => void }) {
  const startPublish = useStartPublish();
  const [pathName, setPathName] = useState("");
  const [filePath, setFilePath] = useState("");
  const [looped, setLooped] = useState(true);

  const handleSubmit = () => {
    if (!pathName.trim() || !filePath.trim()) return;
    startPublish.mutate(
      { pathName: pathName.trim(), filePath: filePath.trim(), looped },
      { onSuccess: onClose }
    );
  };

  return (
    <div className="rounded-lg border border-green-200 dark:border-green-800 p-4 space-y-4 bg-green-50 dark:bg-green-950">
      <h3 className="text-sm font-semibold">Publish Video File</h3>

      <div>
        <label className="block text-sm font-medium mb-1">Video File</label>
        <input
          value={filePath}
          onChange={(e) => setFilePath(e.target.value)}
          placeholder="/path/to/video.mp4"
          className="w-full px-3 py-1.5 text-sm font-mono rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
        />
        <p className="text-xs text-gray-500 mt-1">서버에서 접근 가능한 파일 경로</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Stream Path</label>
        <input
          value={pathName}
          onChange={(e) => setPathName(e.target.value)}
          placeholder="my_stream"
          className="w-full px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          role="switch"
          aria-checked={looped}
          onClick={() => setLooped(!looped)}
          className={cn(
            "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
            looped ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
          )}
        >
          <span
            className={cn(
              "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform",
              looped ? "translate-x-4" : "translate-x-0"
            )}
          />
        </button>
        <span className="text-sm">반복 재생</span>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={startPublish.isPending || !pathName.trim() || !filePath.trim()}
          className="px-3 py-1.5 text-sm rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
        >
          {startPublish.isPending ? "Starting..." : "Start Publishing"}
        </button>
        <button
          onClick={onClose}
          className="px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          Cancel
        </button>
        {startPublish.isError && (
          <span className="text-sm text-red-500">
            {(startPublish.error as Error).message}
          </span>
        )}
      </div>
    </div>
  );
}

// ──────────────── Utils ────────────────

function extractPort(address: string | undefined, fallback: string): string {
  if (!address) return fallback;
  const match = address.match(/:(\d+)$/);
  return match ? match[1] : fallback;
}
