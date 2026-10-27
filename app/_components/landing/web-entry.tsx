"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { LandingPage } from "./landing-page";
import styles from "./landing.module.css";

const displayMode =
  "(display-mode: standalone), (display-mode: minimal-ui)";

function subscribe(callback: () => void) {
  const query = window.matchMedia(displayMode);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

function isStandalone() {
  return (
    window.matchMedia(displayMode).matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/** Existing installations still start at /; only the browser gets marketing. */
export function WebEntry() {
  const standalone = useSyncExternalStore(subscribe, isStandalone, () => false);
  const router = useRouter();

  useEffect(() => {
    if (standalone) router.replace("/auth");
  }, [standalone, router]);

  return (
    <>
      <div className={styles.appOpening} data-active={standalone} role="status">
        Abrindo o Trainvy… <a href="/auth">Entrar no aplicativo</a>
      </div>
      {!standalone && <LandingPage />}
    </>
  );
}
