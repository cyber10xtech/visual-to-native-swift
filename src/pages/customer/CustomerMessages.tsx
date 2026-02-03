import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import CustomerBottomNav from "@/components/layout/CustomerBottomNav";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { LogIn, MessageSquare, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Conversation {
  id: string;
  professional_id: string;
  last_message_at: string | null;
  professional?: {
    full_name: string;
    profession: string | null;
  };
  lastMessage?: string;
  unreadCount?: number;
}

const CustomerMessages = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchConversations();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchConversations = async () => {
    try {
      // First get customer profile id
      const { data: customerProfile } = await supabase
        .from("customer_profiles")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      if (!customerProfile) {
        setLoading(false);
        return;
      }

      // Then fetch conversations
      const { data, error } = await supabase
        .from("conversations")
        .select(`
          id,
          professional_id,
          last_message_at,
          profiles!conversations_professional_id_fkey (
            full_name,
            profession
          )
        `)
        .eq("customer_id", customerProfile.id)
        .order("last_message_at", { ascending: false });

      if (error) throw error;

      const formattedConversations = (data || []).map((conv: any) => ({
        id: conv.id,
        professional_id: conv.professional_id,
        last_message_at: conv.last_message_at,
        professional: conv.profiles,
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

  // Guest state
  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="max-w-md mx-auto px-4 py-6">
          <h1 className="text-xl font-bold text-foreground mb-4">Messages</h1>
          
          <div className="bg-muted/50 rounded-xl p-6 text-center mt-8">
            <LogIn className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-2">Sign in to view messages</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create an account to chat with professionals and track your conversations.
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
                className="w-full flex items-center gap-3 py-4 hover:bg-muted/50 transition-colors"
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
                      {conversation.last_message_at 
                        ? new Date(conversation.last_message_at).toLocaleDateString()
                        : ""}
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