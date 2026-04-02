import { useState, useCallback } from "react";
import { Save, RotateCcw } from "lucide-react";
import { useGlobalConfig, usePatchGlobalConfig } from "../hooks/use-config";
import type { GlobalConfig } from "../api/types";
import {
  Section,
  TextField,
  SelectField,
  ToggleField,
} from "../components/settings/form-fields";

export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Settings</h2>
      <ConfigFormLoader />
    </div>
  );
}

function ConfigFormLoader() {
  const { data: config, isLoading, dataUpdatedAt } = useGlobalConfig();

  if (isLoading || !config) return <p className="text-gray-500">Loading...</p>;

  return <ConfigForm key={dataUpdatedAt} initialConfig={config} />;
}

function ConfigForm({ initialConfig }: { initialConfig: GlobalConfig }) {
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
    <div className="space-y-6 max-w-2xl">
      {/* RTSP */}
      <Section title="RTSP" description="RTSP 서버 설정">
        <ToggleField
          label="RTSP 활성화"
          checked={draft.rtsp !== false}
          onChange={(v) => update("rtsp", v)}
        />
        <TextField
          label="Address"
          value={draft.rtspAddress ?? ""}
          onChange={(v) => update("rtspAddress", v)}
          placeholder=":8554"
          mono
          hint="기본값: :8554"
        />
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
      </Section>

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
