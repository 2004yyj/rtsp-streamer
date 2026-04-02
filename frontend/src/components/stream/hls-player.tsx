import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

interface HLSPlayerProps {
  url: string; // HLS endpoint, e.g. http://localhost:8888/stream1/
  className?: string;
}

export function HLSPlayer({ url, className }: HLSPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [status, setStatus] = useState<"connecting" | "playing" | "error">("connecting");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setStatus("connecting");
    setErrorMsg("");

    // Safari는 HLS를 네이티브로 지원
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = url;
      video.addEventListener("playing", () => setStatus("playing"), { once: true });
      video.addEventListener(
        "error",
        () => {
          setStatus("error");
          setErrorMsg("HLS 재생 실패");
        },
        { once: true }
      );
      video.play().catch(() => {
        setStatus("error");
        setErrorMsg("자동 재생 실패");
      });
      return () => {
        video.src = "";
      };
    }

    // 다른 브라우저는 hls.js 사용
    if (!Hls.isSupported()) {
      setStatus("error");
      setErrorMsg("이 브라우저는 HLS를 지원하지 않습니다");
      return;
    }

    const hls = new Hls({
      enableWorker: true,
      lowLatencyMode: true,
    });
    hlsRef.current = hls;

    hls.loadSource(url);
    hls.attachMedia(video);

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      video.play().catch(() => {});
    });

    hls.on(Hls.Events.FRAG_LOADED, () => {
      setStatus("playing");
    });

    hls.on(Hls.Events.ERROR, (_event, data) => {
      if (data.fatal) {
        setStatus("error");
        setErrorMsg(`HLS error: ${data.type}`);
      }
    });

    return () => {
      hls.destroy();
      hlsRef.current = null;
    };
  }, [url]);

  return (
    <div className={className}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full bg-black rounded-md"
      />
      {status === "connecting" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-md">
          <span className="text-white text-sm">Connecting (HLS)...</span>
        </div>
      )}
      {status === "error" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-md">
          <span className="text-red-400 text-sm">{errorMsg}</span>
        </div>
      )}
    </div>
  );
}
