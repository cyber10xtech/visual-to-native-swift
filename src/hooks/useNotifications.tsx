import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./useAuth";

export interface AppNotification {
  id: string;
  user_id: string;
  user_type: string;
  type: string;
  title: string;
  message: string;
  data: any;
  is_read: boolean | null;
  created_at: string;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .eq("user_type", "customer")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      const typedData = (data || []).map((n: any) => ({
        id: n.id,
        user_id: n.user_id,
        user_type: n.user_type ?? "customer",
        type: n.type,
        title: n.title,
        message: n.message ?? n.description ?? "",
        data: n.data ?? null,
        is_read: n.is_read,
        created_at: n.created_at,
      }));
      setNotifications(typedData);
      setUnreadCount(typedData.filter((n) => !n.is_read).length);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const n = payload.new as any;
          const mapped: AppNotification = {
            id: n.id,
            user_id: n.user_id,
            user_type: n.user_type ?? "customer",
            type: n.type,
            title: n.title,
            message: n.message ?? n.description ?? "",
            data: n.data ?? null,
            is_read: n.is_read,
            created_at: n.created_at,
          };
          setNotifications((prev) => [mapped, ...prev]);
          setUnreadCount((prev) => prev + 1);

          // Browser notification
          if (typeof window !== "undefined" && "Notification" in window && window.Notification.permission === "granted") {
            new window.Notification(mapped.title, { body: mapped.message, icon: "/pwa-192x192.png" });
          }

          // Sound + vibration
          try { new Audio("/notification.mp3").play().catch(() => {}); } catch {}
          if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", notificationId);
      if (error) throw error;
      setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
      if (error) throw error;
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead, refetch: fetchNotifications };
};

export const createNotification = async (
  userId: string,
  userType: string,
  type: string,
  title: string,
  message: string,
  data?: any,
) => {
  try {
    const { error } = await supabase.from("notifications").insert({
      user_id: userId,
      user_type: userType,
      type,
      title,
      message,
      data: data ?? null,
    });
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error("Error creating notification:", error);
    return { error: error as Error };
  }
};
