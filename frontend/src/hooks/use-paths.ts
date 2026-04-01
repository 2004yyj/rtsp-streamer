import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "./use-api";
import type { PathConfig } from "../api/types";

export function usePathConfigs() {
  const api = useApi();
  return useQuery({
    queryKey: ["pathConfigs"],
    queryFn: () => api!.listPathConfigs(),
    enabled: !!api,
    refetchInterval: 5000,
  });
}

export function useActivePaths() {
  const api = useApi();
  return useQuery({
    queryKey: ["activePaths"],
    queryFn: () => api!.listPaths(),
    enabled: !!api,
    refetchInterval: 3000,
  });
}

export function useAddPathConfig() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, config }: { name: string; config: PathConfig }) =>
      api!.addPathConfig(name, config),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pathConfigs"] });
      qc.invalidateQueries({ queryKey: ["activePaths"] });
    },
  });
}

export function useUpdatePathConfig() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, config }: { name: string; config: PathConfig }) =>
      api!.updatePathConfig(name, config),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pathConfigs"] });
    },
  });
}

export function useDeletePathConfig() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api!.deletePathConfig(name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pathConfigs"] });
      qc.invalidateQueries({ queryKey: ["activePaths"] });
    },
  });
}
