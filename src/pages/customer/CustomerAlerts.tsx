import { Calendar, MessageCircle, Star, Clock, CheckCheck, Bell, Loader2 } from "lucide-react";
import CustomerBottomNav from "@/components/layout/CustomerBottomNav";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useNotifications, type AppNotification } from "@/hooks/useNotifications";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

const getIconForType = (type: string) => {
  switch (type) {
    case "booking": return { icon: Calendar, color: "text-primary", bg: "bg-primary/10" };
    case "message": return { icon: MessageCircle, color: "text-success", bg: "bg-success/10" };
    case "review": return { icon: Star, color: "text-warning", bg: "bg-warning/10" };
    case "reminder": return { icon: Clock, color: "text-primary", bg: "bg-primary/10" };
    default: return { icon: Bell, color: "text-muted-foreground", bg: "bg-muted" };
  }
};

const getNavigationPath = (notification: AppNotification): string | null => {
  switch (notification.type) {
    case "booking": return "/hub?tab=bookings";
    case "message": return "/messages";
    case "review": return "/hub?tab=bookings";
    default: return null;
  }
};

const CustomerAlerts = () => {
  const navigate = useNavigate();
  const { notifications, loading, markAsRead, markAllAsRead, unreadCount } = useNotifications();

  const handleNotificationClick = (notification: AppNotification) => {
    if (!notification.is_read) markAsRead(notification.id);
    const path = getNavigationPath(notification);
    if (path) navigate(path);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-md mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          {unreadCount > 0 && (
            <Badge className="bg-primary text-primary-foreground rounded-full px-3">
              {unreadCount} new
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-4">Stay updated on bookings and messages</p>

        {unreadCount > 0 && (
          <button onClick={markAllAsRead}
            className="flex items-center gap-1 text-primary text-sm font-medium mb-4 hover:underline">
            <CheckCheck className="w-4 h-4" /> Mark all as read
          </button>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">No notifications yet</p>
            <p className="text-sm text-muted-foreground mt-1">You'll be notified about bookings, messages and reviews</p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {notifications.map((notification, i) => {
                const { icon: Icon, color, bg } = getIconForType(notification.type);
                const hasNavigation = getNavigationPath(notification) !== null;
                return (
                  <motion.div key={notification.id}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      "bg-card rounded-2xl p-4 border border-border relative cursor-pointer transition-all hover:shadow-sm",
                      !notification.is_read && "bg-primary/5 border-primary/20",
                      hasNavigation && "active:scale-[0.98]"
                    )}>
                    <div className="flex gap-3">
                      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0", bg)}>
                        <Icon className={cn("w-5 h-5", color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className={`font-semibold text-foreground text-sm ${!notification.is_read ? "" : "font-medium"}`}>{notification.title}</h3>
                          {!notification.is_read && <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{notification.description}</p>
                        <span className="text-xs text-muted-foreground/70 mt-1 block">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
      <CustomerBottomNav />
    </div>
  );
};

export default CustomerAlerts;
