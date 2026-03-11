import { useState, useEffect } from "react";
import { Home, Building2, MessageSquare, Bell, Settings } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useNotifications } from "@/hooks/useNotifications";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

const CustomerBottomNav = () => {
  const { unreadCount } = useNotifications();
  const { customerProfileId } = useAuth();
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (!customerProfileId) return;

    const fetchUnreadMessages = async () => {
      // Count unread messages from professionals across all conversations
      const { data: convos } = await supabase
        .from("conversations")
        .select("id")
        .eq("customer_id", customerProfileId);

      if (!convos || convos.length === 0) { setUnreadMessages(0); return; }

      const convoIds = convos.map(c => c.id);
      
      let total = 0;
      for (const cid of convoIds) {
        const { count } = await supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("conversation_id", cid)
          .eq("sender_type", "professional")
          .is("read_at", null);
        total += count || 0;
      }
      
      setUnreadMessages(total);
    };

    fetchUnreadMessages();

    const channel = supabase
      .channel("nav-messages")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => {
        fetchUnreadMessages();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [customerProfileId]);

  const navItems = [
    { icon: Home, label: "Home", path: "/home" },
    { icon: Building2, label: "Hub", path: "/hub" },
    { icon: MessageSquare, label: "Messages", path: "/messages", badgeCount: unreadMessages },
    { icon: Bell, label: "Alerts", path: "/alerts", badgeCount: unreadCount },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border px-2 py-2 z-50">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className="relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-muted-foreground transition-all"
            activeClassName="text-primary"
          >
            <div className="relative">
              <item.icon className="w-5 h-5" />
              {item.badgeCount !== undefined && item.badgeCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-sm">
                  {item.badgeCount > 99 ? "99+" : item.badgeCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default CustomerBottomNav;
