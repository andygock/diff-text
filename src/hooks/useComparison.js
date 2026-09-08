import { useEffect, useRef, useState } from "react";
import { startJob } from "../library/jobs";
import config from "../config";

export default function useComparison(left, right, options, manual) {
  const [request, setRequest] = useState(0);
  const [state, setState] = useState({
    result: null,
    status: "idle",
    error: "",
    signature: "",
  });
  const active = useRef(null);
  const cancelled = useRef("");
  const previousRequest = useRef(0);
  // Revision keys avoid hashing or stringifying megabytes on the UI thread.
  const signature = [
    left.revision,
    right.revision,
    options.compareMethod,
    options.ignoreWhitespace,
    options.ignoreLineEndings,
  ].join(":");
  const runKey = signature + ":" + manual + ":" + request;
  const latest = useRef(signature);
  const large = left.text.length + right.text.length > config.autoCompareSize;

  useEffect(() => {
    latest.current = signature;
    active.current?.cancel();
    let disposed = false;
    const explicit = request !== previousRequest.current;
    previousRequest.current = request;
    if ((manual || large) && !explicit) return;
    if (cancelled.current === signature && !explicit) return;
    const timer = setTimeout(
      () => {
        if (disposed) return;
        setState((old) => ({ ...old, status: "working", error: "", runKey }));
        const job = startJob("compare", {
          left: left.text,
          right: right.text,
          options,
        });
        active.current = job;
        job.promise
          .then((result) => {
            if (!disposed && latest.current === signature)
              setState({
                result,
                status: "ready",
                error: "",
                signature,
                runKey,
              });
          })
          .catch((error) => {
            if (!disposed && error.name !== "AbortError")
              setState((old) => ({
                ...old,
                status: "error",
                error: error.message,
              }));
          });
      },
      explicit ? 0 : 250,
    );
    return () => {
      disposed = true;
      clearTimeout(timer);
      active.current?.cancel();
    };
  }, [
    signature,
    runKey,
    request,
    manual,
    large,
    left.text,
    right.text,
    options,
  ]);

  const stale = state.signature !== signature;
  return {
    ...state,
    stale,
    large,
    status:
      state.runKey !== runKey && state.status !== "ready"
        ? "idle"
        : state.status,
    error: state.runKey === runKey ? state.error : "",
    compare: () => {
      cancelled.current = "";
      setRequest((value) => value + 1);
    },
    cancel: () => {
      cancelled.current = signature;
      active.current?.cancel();
      setState((old) => ({ ...old, status: "cancelled" }));
    },
  };
}
