import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "./use-api";
import type { GlobalConfig } from "../api/types";

export function useGlobalConfig() {
  const api = useApi();
  return useQuery({
    queryKey: ["globalConfig"],
    queryFn: () => api!.getGlobalConfig(),
    enabled: !!api,
  });
}

export function usePatchGlobalConfig() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (config: Partial<GlobalConfig>) =>
      api!.patchGlobalConfig(config),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["globalConfig"] }),
  });
}

export function useConfigFile() {
  const api = useApi();
  return useQuery({
    queryKey: ["configFile"],
    queryFn: () => api!.readConfigFile(),
    enabled: !!api,
  });
}

export function useWriteConfigFile() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => api!.writeConfigFile(content),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["configFile"] }),
  });
}
