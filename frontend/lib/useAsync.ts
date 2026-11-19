"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Result<T> = { key: string | null; data: T | null; error: string | null };

function messageOf(err: unknown): string {
  return (err as { message?: string })?.message || "Something went wrong";
}

/**
 * Small data-loading helper. Runs `fn` on mount and whenever `deps` change
 * (deps must be JSON-serialisable primitives), and exposes `reload()` for
 * refreshing after a mutation. `loading` is derived, so no state is set
 * synchronously inside effects.
 */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const depsKey = JSON.stringify(deps);
  const fnRef = useRef(fn);
  const keyRef = useRef(depsKey);
  const seq = useRef(0);
  const [result, setResult] = useState<Result<T>>({ key: null, data: null, error: null });
  const [manualLoading, setManualLoading] = useState(false);

  useEffect(() => {
    fnRef.current = fn;
  });

  useEffect(() => {
    keyRef.current = depsKey;
    const id = ++seq.current;
    fnRef.current().then(
      (data) => {
        if (id === seq.current) setResult({ key: depsKey, data, error: null });
      },
      (err) => {
        if (id === seq.current) setResult((r) => ({ key: depsKey, data: r.key === depsKey ? r.data : null, error: messageOf(err) }));
      },
    );
  }, [depsKey]);

  const reload = useCallback(async (opts: { silent?: boolean } = {}) => {
    const id = ++seq.current;
    const key = keyRef.current;
    if (!opts.silent) setManualLoading(true);
    try {
      const data = await fnRef.current();
      if (id === seq.current) setResult({ key, data, error: null });
      return data;
    } catch (err) {
      if (id === seq.current) setResult((r) => ({ ...r, key, error: messageOf(err) }));
      return null;
    } finally {
      if (id === seq.current) setManualLoading(false);
    }
  }, []);

  const setData = useCallback((updater: T | null | ((prev: T | null) => T | null)) => {
    setResult((r) => ({
      ...r,
      data: typeof updater === "function" ? (updater as (prev: T | null) => T | null)(r.data) : updater,
    }));
  }, []);

  const stale = result.key !== depsKey;
  return {
    data: stale && result.key === null ? null : result.data,
    error: stale ? null : result.error,
    loading: manualLoading || stale,
    reload,
    setData,
  };
}
