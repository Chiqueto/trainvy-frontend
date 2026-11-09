"use client";
import { useEffect, useRef } from "react";
import { trackProductEvent } from "@/app/_lib/product-events";
export function ProfessionalWorkspaceEvent() {
  const tracked = useRef(false);
  useEffect(() => {
    if (!tracked.current) {
      tracked.current = true;
      trackProductEvent("Professional workspace opened");
    }
  }, []);
  return null;
}
