import { useEffect, useState } from "react";

export const usePermissions = () => {
  const [locationGranted, setLocationGranted] = useState(false);
  const [notificationGranted, setNotificationGranted] = useState(false);

  useEffect(() => {
    // Request permissions on first launch
    const hasAsked = localStorage.getItem("safesight_permissions_asked");
    if (!hasAsked) {
      requestPermissions();
      localStorage.setItem("safesight_permissions_asked", "true");
    } else {
      checkPermissions();
    }
  }, []);

  const checkPermissions = async () => {
    // Check notification permission
    if ("Notification" in window) {
      setNotificationGranted(Notification.permission === "granted");
    }
    // Check location permission
    if ("permissions" in navigator) {
      try {
        const result = await navigator.permissions.query({ name: "geolocation" as PermissionName });
        setLocationGranted(result.state === "granted");
      } catch {
        // Fallback
      }
    }
  };

  const requestPermissions = async () => {
    // Request notification permission
    if ("Notification" in window && Notification.permission === "default") {
      try {
        const result = await Notification.requestPermission();
        setNotificationGranted(result === "granted");
      } catch {
        // Silent fail
      }
    }

    // Request location permission
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => setLocationGranted(true),
        () => setLocationGranted(false),
        { timeout: 10000 }
      );
    }
  };

  return { locationGranted, notificationGranted, requestPermissions };
};
