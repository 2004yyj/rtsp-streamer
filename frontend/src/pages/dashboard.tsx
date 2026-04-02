import { Circle, Activity } from "lucide-react";
import { cn } from "../lib/utils";
import { useProcessStatus } from "../hooks/use-process";
import { useActivePaths } from "../hooks/use-paths";

export default function DashboardPage() {
  const { data: status } = useProcessStatus();
  const { data: paths } = useActivePaths();
  const isRunning = status?.status === "running";
  const isStopped = status?.status === "stopped";
  const readyPaths = paths?.items.filter((p) => p.ready) ?? [];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Dashboard</h2>

      {/* 프로세스 상태 카드 */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center gap-3">
          <Circle
            className={cn(
              "w-3 h-3 fill-current",
              isRunning
                ? "text-green-500"
                : isStopped
                  ? "text-gray-400"
                  : "text-yellow-500"
            )}
          />
          <div>
            <h3 className="font-medium">MediaMTX Server</h3>
            <p className="text-sm text-gray-500">
              {status?.status ?? "unknown"}
              {status?.message && ` — ${status.message}`}
            </p>
          </div>
        </div>
      </div>

      {/* 활성 경로 요약 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <Activity className="w-4 h-4" />
            <span className="text-sm">Active Paths</span>
          </div>
          <p className="text-3xl font-semibold">{paths?.items.length ?? 0}</p>
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <Circle className="w-4 h-4 text-green-500 fill-green-500" />
            <span className="text-sm">Ready</span>
          </div>
          <p className="text-3xl font-semibold">{readyPaths.length}</p>
        </div>
      </div>

      {/* 활성 경로 테이블 */}
      {paths && paths.items.length > 0 && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Name</th>
                <th className="text-left px-4 py-2 font-medium">Source</th>
                <th className="text-left px-4 py-2 font-medium">Readers</th>
                <th className="text-left px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {paths.items.map((path) => (
                <tr key={path.name}>
                  <td className="px-4 py-2 font-mono">{path.name}</td>
                  <td className="px-4 py-2 text-gray-500">
                    {path.source?.type ?? "—"}
                  </td>
                  <td className="px-4 py-2">{path.readers?.length ?? 0}</td>
                  <td className="px-4 py-2">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                        path.ready
                          ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                          : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                      )}
                    >
                      {path.ready ? "Ready" : "Not Ready"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
