import { useEffect, useState } from "react";
import { type ApiAdapter, getApiAdapter } from "../api/adapter";

let cachedAdapter: ApiAdapter | null = null;

export function useApi(): ApiAdapter | null {
  const [adapter, setAdapter] = useState<ApiAdapter | null>(cachedAdapter);

  useEffect(() => {
    if (!cachedAdapter) {
      getApiAdapter().then((a) => {
        cachedAdapter = a;
        setAdapter(a);
      });
    }
  }, []);

  return adapter;
}
