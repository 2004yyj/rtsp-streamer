import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "./use-api";

export function usePublishingList() {
  const api = useApi();
  return useQuery({
    queryKey: ["publishing"],
    queryFn: () => api!.listPublishing(),
    enabled: !!api,
    refetchInterval: 3000,
  });
}

export function useStartPublish() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ pathName, filePath, looped }: { pathName: string; filePath: string; looped?: boolean }) =>
      api!.startPublish(pathName, filePath, looped),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["publishing"] });
      qc.invalidateQueries({ queryKey: ["activePaths"] });
    },
  });
}

export function useStopPublish() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (pathName: string) => api!.stopPublish(pathName),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["publishing"] });
      qc.invalidateQueries({ queryKey: ["activePaths"] });
    },
  });
}
