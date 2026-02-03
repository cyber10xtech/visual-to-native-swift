import { Calendar, MessageCircle, Star, Clock, CheckCheck, LogIn, Bell, Loader2 } from "lucide-react";
import CustomerBottomNav from "@/components/layout/CustomerBottomNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "@/hooks/useNotifications";

const getIconForType = (type: string) => {
  switch (type) {
    case "booking":
      return { icon: Calendar, color: "text-primary", bg: "bg-primary/10" };
    case "message":
      return { icon: MessageCircle, color: "text-success", bg: "bg-success/10" };
    case "review":
      return { icon: Star, color: "text-warning", bg: "bg-warning/10" };
    case "reminder":
      return { icon: Clock, color: "text-primary", bg: "bg-primary/10" };
    default:
      return { icon: Bell, color: "text-muted-foreground", bg: "bg-muted" };
  }
};

const CustomerAlerts = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { notifications, loading, markAsRead, markAllAsRead } = useNotifications();

  const unreadCount = notifications.filter(n => !n.read).length;

  // Guest state
  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="max-w-md mx-auto px-4 py-6">
          <h1 className="text-xl font-bold text-foreground mb-4">Notifications</h1>
          
          <div className="bg-muted/50 rounded-xl p-6 text-center mt-8">
            <LogIn className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-2">Sign in to view notifications</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create an account to receive alerts about bookings, messages, and more.
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => navigate("/sign-in")} size="sm">
                Sign In
              </Button>
              <Button onClick={() => navigate("/register")} variant="outline" size="sm">
                Create Account
              </Button>
            </div>
          </div>
        </div>
        <CustomerBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-md mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-foreground">Notifications</h1>
          {unreadCount > 0 && (
            <Badge className="bg-primary text-primary-foreground">
              {unreadCount} new
            </Badge>
          )}
        </div>

        {unreadCount > 0 && (
          <button 
            onClick={markAllAsRead}
            className="flex items-center gap-1 text-primary text-sm font-medium mb-4"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all as read
          </button>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No notifications yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              You'll receive alerts when there's activity on your account
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => {
              const { icon: Icon, color, bg } = getIconForType(notification.type);
              return (
                <div 
                  key={notification.id}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                  className={cn(
                    "bg-card rounded-xl p-4 border border-border relative cursor-pointer",
                    !notification.read && "bg-primary/5"
                  )}
                >
                  <div className="flex gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                      bg
                    )}>
                      <Icon className={cn("w-5 h-5", color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-foreground">{notification.title}</h3>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                      <span className="text-xs text-muted-foreground mt-1 block">
                        {new Date(notification.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <CustomerBottomNav />
    </div>
  );
};

export default CustomerAlerts;