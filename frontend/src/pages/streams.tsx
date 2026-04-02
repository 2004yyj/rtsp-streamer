import { useState } from "react";
import { Video, Radio, Tv, Copy, Check, Trash2 } from "lucide-react";
import { useActivePaths, useDeletePathConfig } from "../hooks/use-paths";
import { useGlobalConfig } from "../hooks/use-config";
import { WebRTCPlayer } from "../components/stream/webrtc-player";
import { HLSPlayer } from "../components/stream/hls-player";
import { cn } from "../lib/utils";
import type { PathItem } from "../api/types";

type PlayerMode = "webrtc" | "hls" | null;

export default function StreamsPage() {
  const { data: paths, isLoading } = useActivePaths();
  const { data: config } = useGlobalConfig();
  const deletePath = useDeletePathConfig();
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [playerMode, setPlayerMode] = useState<PlayerMode>(null);

  const readyPaths = paths?.items.filter((p) => p.ready) ?? [];
  const allPaths = paths?.items ?? [];

  // MediaMTX 서버 주소 (포트만 추출하여 현재 호스트에 합침)
  const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
  const rtspPort = extractPort(config?.rtspAddress, "8554");
  const hlsPort = extractPort(config?.hlsAddress, "8888");
  const webrtcPort = extractPort(config?.webrtcAddress, "8889");
  const rtmpPort = extractPort(config?.rtmpAddress, "1935");
  const srtPort = extractPort(config?.srtAddress, "8890");

  function getUrls(name: string) {
    return {
      rtsp: `rtsp://${host}:${rtspPort}/${name}`,
      rtmp: `rtmp://${host}:${rtmpPort}/${name}`,
      hls: `http://${host}:${hlsPort}/${name}/`,
      webrtc: `http://${host}:${webrtcPort}/${name}/whep`,
      srt: `srt://${host}:${srtPort}?streamid=read:${name}`,
    };
  }

  const handlePlay = (name: string, mode: PlayerMode) => {
    if (selectedPath === name && playerMode === mode) {
      setSelectedPath(null);
      setPlayerMode(null);
    } else {
      setSelectedPath(name);
      setPlayerMode(mode);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Streams</h2>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Radio className="w-4 h-4 text-green-500" />
          <span>{readyPaths.length} ready</span>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <span>{allPaths.length} total</span>
        </div>
      </div>

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
              isSelected={selectedPath === path.name}
              playerMode={selectedPath === path.name ? playerMode : null}
              onPlay={(mode) => handlePlay(path.name, mode)}
              onDelete={() => {
                if (confirm(`"${path.name}" 스트림을 삭제하시겠습니까?`)) {
                  deletePath.mutate(path.name);
                }
              }}
              webrtcEnabled={config?.webrtc !== false}
              hlsEnabled={config?.hls !== false}
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
  isSelected: boolean;
  playerMode: PlayerMode;
  onPlay: (mode: PlayerMode) => void;
  onDelete: () => void;
  webrtcEnabled: boolean;
  hlsEnabled: boolean;
}

function StreamCard({
  path,
  urls,
  isSelected,
  playerMode,
  onPlay,
  onDelete,
  webrtcEnabled,
  hlsEnabled,
}: StreamCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "w-2.5 h-2.5 rounded-full",
              path.ready ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"
            )}
          />
          <div>
            <h3 className="font-mono font-medium">{path.name}</h3>
            <p className="text-xs text-gray-500">
              {path.source?.type ?? "no source"}
              {path.readers && path.readers.length > 0 && (
                <span className="ml-2">{path.readers.length} reader(s)</span>
              )}
            </p>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-2">
          {path.ready && webrtcEnabled && (
            <button
              onClick={() => onPlay("webrtc")}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors",
                isSelected && playerMode === "webrtc"
                  ? "bg-blue-600 text-white"
                  : "border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              )}
            >
              <Tv className="w-4 h-4" />
              WebRTC
            </button>
          )}
          {path.ready && hlsEnabled && (
            <button
              onClick={() => onPlay("hls")}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors",
                isSelected && playerMode === "hls"
                  ? "bg-blue-600 text-white"
                  : "border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              )}
            >
              <Video className="w-4 h-4" />
              HLS
            </button>
          )}
          <button
            onClick={onDelete}
            className="inline-flex items-center p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded-md transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 플레이어 */}
      {isSelected && playerMode && path.ready && (
        <div className="relative aspect-video bg-black mx-4 mb-4 rounded-md overflow-hidden">
          {playerMode === "webrtc" ? (
            <WebRTCPlayer url={urls.webrtc} className="absolute inset-0" />
          ) : (
            <HLSPlayer url={urls.hls} className="absolute inset-0" />
          )}
        </div>
      )}

      {/* 프로토콜 URL 목록 */}
      <div className="border-t border-gray-200 dark:border-gray-800 px-4 py-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
        <UrlRow label="RTSP" url={urls.rtsp} />
        <UrlRow label="RTMP" url={urls.rtmp} />
        <UrlRow label="HLS" url={urls.hls} />
        <UrlRow label="WebRTC" url={urls.webrtc} />
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

// ──────────────── Utils ────────────────

function extractPort(address: string | undefined, fallback: string): string {
  if (!address) return fallback;
  const match = address.match(/:(\d+)$/);
  return match ? match[1] : fallback;
}
