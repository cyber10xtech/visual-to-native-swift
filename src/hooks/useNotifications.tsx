import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

const isDevelopment = import.meta.env.DEV;

// The app uses `description` and `is_read` internally (matching the old schema).
// We read from notifications_compat_view which aliases:
//   message → description
//   read    → is_read
// Inserts and updates go directly to the notifications table using the real
// column names: `message` and `read`.
export interface AppNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  description: string; // aliased from `message` via compat view
  is_read: boolean | null; // aliased from `read` via compat view
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
      // Use compat view so column aliases match AppNotification interface
      const { data, error } = await supabase
        .from("notifications_compat_view")
        .select("id, user_id, type, title, description, is_read, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      const typedData = (data || []) as AppNotification[];
      setNotifications(typedData);
      setUnreadCount(typedData.filter((n) => !n.is_read).length);
    } catch (error) {
      if (isDevelopment) console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Realtime — listen on the real `notifications` table
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
          // Real table uses `message` and `read` — remap to interface shape
          const raw = payload.new as any;
          const n: AppNotification = {
            id: raw.id,
            user_id: raw.user_id,
            type: raw.type,
            title: raw.title,
            description: raw.message,
            is_read: raw.read,
            created_at: raw.created_at,
          };
          setNotifications((prev) => [n, ...prev]);
          setUnreadCount((prev) => prev + 1);

          if (
            typeof window !== "undefined" &&
            "Notification" in window &&
            window.Notification.permission === "granted"
          ) {
            new window.Notification(n.title, {
              body: n.description,
              icon: "/pwa-192x192.png",
            });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    try {
      // Write to the real table using the real column name `read`
      const { error } = await supabase.from("notifications").update({ read: true }).eq("id", notificationId);

      if (error) throw error;

      setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      if (isDevelopment) console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      // `read` is the real column name; `is_read` only exists on the compat view
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false);

      if (error) throw error;

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      if (isDevelopment) console.error("Error marking all notifications as read:", error);
    }
  };

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead, refetch: fetchNotifications };
};

// Used by BookingRequest.tsx and other pages to send notifications
export const createNotification = async (
  userId: string,
  type: string,
  title: string,
  description: string,
  userType: "customer" | "professional" = "professional",
) => {
  try {
    const { error } = await supabase.from("notifications").insert({
      user_id: userId,
      user_type: userType, // required in unified schema
      type,
      title,
      message: description, // unified schema uses `message`, not `description`
    });

    if (error) throw error;
    return { error: null };
  } catch (error) {
    if (isDevelopment) console.error("Error creating notification:", error);
    return { error: error as Error };
  }
};
