import { useEffect, useRef, useCallback } from 'react';

/**
 * useAbortController Hook
 * Manages AbortController lifecycle for cancelling in-flight requests
 * Automatically cancels requests on component unmount or when abort is called
 */
export function useAbortController() {
  const abortControllerRef = useRef<AbortController | null>(null);

  // Initialize AbortController
  useEffect(() => {
    abortControllerRef.current = new AbortController();

    return () => {
      // Cancel all pending requests on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const getSignal = useCallback(() => {
    if (!abortControllerRef.current) {
      abortControllerRef.current = new AbortController();
    }
    return abortControllerRef.current.signal;
  }, []);

  const abort = useCallback((reason?: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort(reason);
      // Create a new controller for future requests
      abortControllerRef.current = new AbortController();
    }
  }, []);

  const isAborted = useCallback(() => {
    return abortControllerRef.current?.signal.aborted ?? false;
  }, []);

  return {
    signal: getSignal(),
    abort,
    isAborted,
  };
}

/**
 * Wrapper function to add AbortSignal to fetch requests
 */
export async function fetchWithAbort<T>(
  url: string,
  signal: AbortSignal,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    signal,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}
