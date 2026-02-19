import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  };
  lastMessage?: string;
  unreadCount?: number;
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
      // Get profile id from profiles table
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      if (!profile) {
        setLoading(false);
        return;
      }

      // Then fetch conversations
      const { data, error } = await supabase
        .from("conversations")
        .select(`
          id,
          pro_id,
          created_at,
          professional:profiles!conversations_professional_id_fkey (
            full_name,
            profession
          )
        `)
        .eq("customer_id", profile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedConversations = (data || []).map((conv: any) => ({
        id: conv.id,
        pro_id: conv.pro_id,
        created_at: conv.created_at,
        professional: conv.professional,
        lastMessage: "Start chatting...",
        unreadCount: 0,
      }));

      setConversations(formattedConversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
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
              Start a conversation by booking a professional
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
                <Avatar className="w-12 h-12 bg-primary">
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
                      {new Date(conversation.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {conversation.professional?.profession || "Professional"}
                  </p>
                </div>

                {conversation.unreadCount && conversation.unreadCount > 0 && (
                  <Badge className="bg-primary text-primary-foreground rounded-full min-w-[20px] h-5 flex items-center justify-center">
                    {conversation.unreadCount}
                  </Badge>
                )}
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
