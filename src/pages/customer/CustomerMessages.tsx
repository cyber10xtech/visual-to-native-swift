import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import CustomerBottomNav from "@/components/layout/CustomerBottomNav";
import { useAuth } from "@/hooks/useAuth";
import { MessageSquare, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Conversation {
  id: string;
  pro_id: string;
  professional?: {
    full_name: string;
    profession: string | null;
    avatar_url: string | null;
  };
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  created_at: string;
}

const CustomerMessages = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  const fetchConversations = async () => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      if (!profile) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("conversations")
        .select(`
          id,
          pro_id,
          created_at,
          professional:profiles!conversations_professional_id_fkey (
            full_name,
            profession,
            avatar_url
          )
        `)
        .eq("customer_id", profile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch last message and unread count for each conversation
      const enriched = await Promise.all(
        (data || []).map(async (conv: any) => {
          const { data: lastMsg } = await supabase
            .from("messages")
            .select("content, created_at")
            .eq("conversation_id", conv.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          const { count } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("conversation_id", conv.id)
            .neq("sender_id", profile.id)
            .eq("is_read", false);

          return {
            id: conv.id,
            pro_id: conv.pro_id,
            created_at: conv.created_at,
            professional: conv.professional,
            lastMessage: lastMsg?.content || "Start chatting...",
            lastMessageTime: lastMsg?.created_at || conv.created_at,
            unreadCount: count || 0,
          };
        })
      );

      // Sort by last message time
      enriched.sort((a, b) => new Date(b.lastMessageTime!).getTime() - new Date(a.lastMessageTime!).getTime());

      setConversations(enriched);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return date.toLocaleDateString([], { weekday: "short" });
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-md mx-auto px-4 py-6">
        <h1 className="text-xl font-bold text-foreground mb-4">Messages</h1>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No messages yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Start a conversation by messaging a professional
            </p>
            <Button onClick={() => navigate("/home")} className="mt-4" size="sm">
              Find Professionals
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => navigate(`/chat/${conversation.id}`)}
                className="w-full flex items-center gap-3 py-4 hover:bg-muted/50 transition-colors active:scale-[0.98]"
              >
                <Avatar className="w-12 h-12">
                  <AvatarImage src={conversation.professional?.avatar_url || undefined} />
                  <AvatarFallback className="text-primary-foreground font-semibold bg-primary">
                    {conversation.professional?.full_name?.slice(0, 1) || "P"}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-foreground truncate">
                      {conversation.professional?.full_name || "Professional"}
                    </h3>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {formatTime(conversation.lastMessageTime || conversation.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-muted-foreground truncate">
                      {conversation.lastMessage}
                    </p>
                    {conversation.unreadCount > 0 && (
                      <Badge className="bg-primary text-primary-foreground rounded-full min-w-[20px] h-5 flex items-center justify-center text-xs flex-shrink-0">
                        {conversation.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      <CustomerBottomNav />
    </div>
  );
};

export default CustomerMessages;
