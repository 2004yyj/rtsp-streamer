import { useState } from "react";
import { Plus, Trash2, Edit } from "lucide-react";
import {
  usePathConfigs,
  useAddPathConfig,
  useDeletePathConfig,
} from "../hooks/use-paths";
import type { PathConfig } from "../api/types";

export default function PathsPage() {
  const { data: configs, isLoading } = usePathConfigs();
  const addPath = useAddPathConfig();
  const deletePath = useDeletePathConfig();

  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSource, setNewSource] = useState("");

  const handleAdd = () => {
    if (!newName.trim()) return;
    const config: PathConfig = {};
    if (newSource.trim()) config.source = newSource.trim();
    addPath.mutate(
      { name: newName.trim(), config },
      {
        onSuccess: () => {
          setNewName("");
          setNewSource("");
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
        <div className="rounded-lg border border-blue-200 dark:border-blue-800 p-4 space-y-3 bg-blue-50 dark:bg-blue-950">
          <div>
            <label className="block text-sm font-medium mb-1">Path Name</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="stream1"
              className="w-full px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Source (optional)
            </label>
            <input
              value={newSource}
              onChange={(e) => setNewSource(e.target.value)}
              placeholder="rtsp://example.com/stream or publisher"
              className="w-full px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={addPath.isPending || !newName.trim()}
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
                <th className="text-left px-4 py-2 font-medium">
                  On Demand
                </th>
                <th className="text-left px-4 py-2 font-medium">Record</th>
                <th className="text-right px-4 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {configs.items.map((cfg) => (
                <tr key={cfg.name ?? "unknown"}>
                  <td className="px-4 py-2 font-mono">
                    {cfg.name ?? "—"}
                  </td>
                  <td className="px-4 py-2 text-gray-500">
                    {cfg.source ?? "publisher"}
                  </td>
                  <td className="px-4 py-2">
                    {cfg.sourceOnDemand ? "Yes" : "No"}
                  </td>
                  <td className="px-4 py-2">
                    {cfg.record ? "Yes" : "No"}
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
