import { useEffect, useRef, useState } from "react";
import { ExternalLink } from "lucide-react";

interface WebRTCPlayerProps {
  url: string;
  className?: string;
}

export function WebRTCPlayer({ url, className }: WebRTCPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const [status, setStatus] = useState<"connecting" | "playing" | "failed">("connecting");

  useEffect(() => {
    let cancelled = false;

    async function connect() {
      setStatus("connecting");

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
      pcRef.current = pc;

      pc.addTransceiver("video", { direction: "recvonly" });
      pc.addTransceiver("audio", { direction: "recvonly" });

      pc.ontrack = (event) => {
        if (videoRef.current && event.streams[0]) {
          videoRef.current.srcObject = event.streams[0];
          if (!cancelled) setStatus("playing");
        }
      };

      pc.onconnectionstatechange = () => {
        if (cancelled) return;
        if (pc.connectionState === "connected") setStatus("playing");
        if (pc.connectionState === "failed") setStatus("failed");
      };

      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        const sdp = await waitForIceGathering(pc);

        const resp = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/sdp" },
          body: sdp,
        });

        if (!resp.ok) throw new Error(`${resp.status}`);

        await pc.setRemoteDescription(
          new RTCSessionDescription({ type: "answer", sdp: await resp.text() })
        );
      } catch {
        if (!cancelled) setStatus("failed");
      }
    }

    connect();

    return () => {
      cancelled = true;
      pcRef.current?.close();
      pcRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [url]);

  const playerUrl = url.replace(/\/whep$/, "/");

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
          <span className="text-white text-sm">Connecting (WebRTC)...</span>
        </div>
      )}
      {status === "failed" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 rounded-md">
          <p className="text-gray-400 text-sm">WebRTC 연결 실패</p>
          <a
            href={playerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700"
          >
            <ExternalLink className="w-4 h-4" />
            브라우저에서 열기
          </a>
        </div>
      )}
    </div>
  );
}

function waitForIceGathering(pc: RTCPeerConnection): Promise<string> {
  return new Promise((resolve) => {
    if (pc.iceGatheringState === "complete") {
      resolve(pc.localDescription!.sdp);
      return;
    }
    const handler = () => {
      if (pc.iceGatheringState === "complete") {
        pc.removeEventListener("icegatheringstatechange", handler);
        resolve(pc.localDescription!.sdp);
      }
    };
    pc.addEventListener("icegatheringstatechange", handler);
    setTimeout(() => {
      pc.removeEventListener("icegatheringstatechange", handler);
      resolve(pc.localDescription!.sdp);
    }, 3000);
  });
}
