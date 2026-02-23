import { Home, Building2, MessageSquare, Bell, Settings } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useNotifications } from "@/hooks/useNotifications";

const CustomerBottomNav = () => {
  const { unreadCount } = useNotifications();

  const navItems = [
    { icon: Home, label: "Home", path: "/home" },
    { icon: Building2, label: "Hub", path: "/hub" },
    { icon: MessageSquare, label: "Messages", path: "/messages" },
    { icon: Bell, label: "Alerts", path: "/alerts", badgeCount: unreadCount },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-2 py-2 z-50">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className="relative flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-muted-foreground transition-colors"
            activeClassName="text-primary bg-primary/10"
          >
            <div className="relative">
              <item.icon className="w-5 h-5" />
              {item.badgeCount !== undefined && item.badgeCount > 0 && (
                <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                  {item.badgeCount > 9 ? "9+" : item.badgeCount}
                </span>
              )}
            </div>
            <span className="text-xs font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default CustomerBottomNav;
