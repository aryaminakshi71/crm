import { useEffect, useRef, useState } from "react";

type PresenceStatus = "online" | "away" | "offline";

const HEARTBEAT_INTERVAL = 30_000;
const AWAY_TIMEOUT = 60_000;

function ping(status: PresenceStatus) {
  const orgId = localStorage.getItem("activeOrganizationId") ?? "";
  fetch("/api/v1/presence/heartbeat", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-organization-id": orgId },
    body: JSON.stringify({ status }),
  }).catch(() => {/* silent */});
}

export function usePresence() {
  const [status, setStatus] = useState<PresenceStatus>("online");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const awayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Initial heartbeat
    ping("online");
    setStatus("online");

    // Periodic heartbeat
    intervalRef.current = setInterval(() => {
      ping(status === "away" ? "away" : "online");
    }, HEARTBEAT_INTERVAL);

    // Visibility-based status
    function handleVisibility() {
      if (document.hidden) {
        awayTimerRef.current = setTimeout(() => {
          setStatus("away");
          ping("away");
        }, AWAY_TIMEOUT);
      } else {
        if (awayTimerRef.current) clearTimeout(awayTimerRef.current);
        setStatus("online");
        ping("online");
      }
    }

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (awayTimerRef.current) clearTimeout(awayTimerRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
      ping("offline");
    };
  }, []);

  return { status };
}
