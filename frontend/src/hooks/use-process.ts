import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "./use-api";

export function useProcessStatus() {
  const api = useApi();
  return useQuery({
    queryKey: ["processStatus"],
    queryFn: () => api!.getProcessStatus(),
    enabled: !!api,
    refetchInterval: 3000,
  });
}

export function useStartProcess() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api!.startProcess(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["processStatus"] }),
  });
}

export function useStopProcess() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api!.stopProcess(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["processStatus"] }),
  });
}

export function useRestartProcess() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api!.restartProcess(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["processStatus"] }),
  });
}

export function useDownloadBinary() {
  const api = useApi();
  return useMutation({
    mutationFn: (version?: string) => api!.downloadBinary(version),
  });
}
