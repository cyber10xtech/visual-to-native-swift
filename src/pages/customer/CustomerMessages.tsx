import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import CustomerBottomNav from "@/components/layout/CustomerBottomNav";

interface ConversationItem {
  id: string;
  pro_id: string;
  created_at: string;
  professional_name: string;
  professional_avatar: string | null;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
}

const CustomerMessages = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchConversations = async () => {
      try {
        // Get profile id
        const { data: profileData } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!profileData) { setLoading(false); return; }

        const { data: convos, error } = await supabase
          .from("conversations")
          .select(`
            id, pro_id, created_at,
            professional:profiles!conversations_professional_id_fkey(full_name, avatar_url)
          `)
          .eq("customer_id", profileData.id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        const items: ConversationItem[] = (convos || []).map((c: any) => ({
          id: c.id,
          pro_id: c.pro_id,
          created_at: c.created_at,
          professional_name: c.professional?.full_name || "Professional",
          professional_avatar: c.professional?.avatar_url || null,
          last_message: null,
          last_message_at: null,
          unread_count: 0,
        }));

        setConversations(items);
      } catch (err) {
        console.error("Error fetching conversations:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [user]);

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
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((convo) => (
              <button
                key={convo.id}
                onClick={() => navigate(`/chat/${convo.id}`)}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:bg-muted/50 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  {convo.professional_avatar ? (
                    <img src={convo.professional_avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <span className="text-primary font-semibold text-sm">
                      {convo.professional_name.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{convo.professional_name}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {convo.last_message || "Start a conversation"}
                  </p>
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
