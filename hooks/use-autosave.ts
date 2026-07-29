"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { AUTOSAVE_DELAY } from "@/lib/constants";

type SaveStatus = "idle" | "saving" | "saved" | "error";

export function useAutosave(
  saveFn: () => Promise<void>,
  deps: unknown[],
  delay: number = AUTOSAVE_DELAY
) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstRender = useRef(true);
  const saveFnRef = useRef(saveFn);

  saveFnRef.current = saveFn;

  const save = useCallback(async () => {
    try {
      setStatus("saving");
      await saveFnRef.current();
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(save, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return status;
}
