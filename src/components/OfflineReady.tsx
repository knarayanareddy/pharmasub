"use client";
import { useEffect } from "react";
export function OfflineReady() {
  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => { /* local server remains available */ });
  }, []);
  return null;
}
