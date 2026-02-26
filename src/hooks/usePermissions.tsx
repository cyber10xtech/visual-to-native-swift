import { useEffect, useState, useCallback } from "react";
import { Capacitor } from "@capacitor/core";

export const usePermissions = () => {
  const [locationGranted, setLocationGranted] = useState(false);
  const [notificationGranted, setNotificationGranted] = useState(false);
  const [cameraGranted, setCameraGranted] = useState(false);

  useEffect(() => {
    const hasAsked = localStorage.getItem("safesight_permissions_asked");
    if (!hasAsked) {
      requestPermissions();
      localStorage.setItem("safesight_permissions_asked", "true");
    } else {
      checkPermissions();
    }
  }, []);

  const checkPermissions = async () => {
    if ("Notification" in window) {
      setNotificationGranted(Notification.permission === "granted");
    }
    if ("permissions" in navigator) {
      try {
        const geo = await navigator.permissions.query({ name: "geolocation" as PermissionName });
        setLocationGranted(geo.state === "granted");
      } catch {
        // fallback
      }
      try {
        const cam = await navigator.permissions.query({ name: "camera" as PermissionName });
        setCameraGranted(cam.state === "granted");
      } catch {
        // fallback
      }
    }
  };

  const requestPermissions = useCallback(async () => {
    // Notification
    if ("Notification" in window && Notification.permission === "default") {
      try {
        const result = await Notification.requestPermission();
        setNotificationGranted(result === "granted");
      } catch {
        // silent
      }
    }

    // Location
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => setLocationGranted(true),
        () => setLocationGranted(false),
        { timeout: 10000 }
      );
    }

    // Camera - request via getUserMedia on web
    if (!Capacitor.isNativePlatform() && navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach((t) => t.stop());
        setCameraGranted(true);
      } catch {
        setCameraGranted(false);
      }
    }
  }, []);

  return { locationGranted, notificationGranted, cameraGranted, requestPermissions };
};
