"use client";

import { useState, useEffect, useRef } from "react";

type TtsStatus = "queued" | "processing" | "completed" | "failed" | "cancelled";

interface TtsResult {
  requestId: string;
  status: TtsStatus;
  fromCache?: boolean;
  audio?: {
    id: string;
    url: string;
    urlExpiresAt: string;
    format: string;
    sizeBytes: string;
    durationSec: number | null;
  };
  errorMessage?: string;
}

export function useTtsRequest(requestId: string | null) {
  const [result, setResult] = useState<TtsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null);

  useEffect(() => {
    if (!requestId) return;
    
    const poll = async () => {
      setResult(null);
      setLoading(true);

      try {
        const res = await fetch(`/api/tts/${requestId}`);
        const data = (await res.json()) as TtsResult;

        setResult(data);

        // Stop polling on terminal states
        if (data.status === "completed" || data.status === "failed") {
          clearInterval(intervalRef.current!);
          setLoading(false);
        }
      } catch {
        clearInterval(intervalRef.current!);
        setLoading(false);
      }
    };

    poll(); // immediate first check
    intervalRef.current = setInterval(poll, 1500); // then every 1.5s

    return () => clearInterval(intervalRef.current!);
  }, [requestId]);

  return { result, loading };
}
