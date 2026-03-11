import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import CustomerBottomNav from "@/components/layout/CustomerBottomNav";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

interface ConversationItem {
  id: string;
  professional_id: string;
  created_at: string;
  professional_name: string;
  professional_avatar: string | null;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
}

const CustomerMessages = () => {
  const navigate = useNavigate();
  const { customerProfileId } = useAuth();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!customerProfileId) return;

    const fetchConversations = async () => {
      try {
        const { data: convos, error } = await supabase
          .from("conversations")
          .select("id, professional_id, created_at, last_message_at")
          .eq("customer_id", customerProfileId)
          .order("last_message_at", { ascending: false, nullsFirst: false });

        if (error) throw error;

        const items: ConversationItem[] = await Promise.all(
          (convos || []).map(async (c: any) => {
            // Get professional info from profiles_public
            const { data: pro } = await supabase
              .from("profiles_public")
              .select("full_name, avatar_url")
              .eq("id", c.professional_id)
              .maybeSingle();

            // Get last message
            const { data: lastMsg } = await supabase
              .from("messages")
              .select("content, created_at, sender_type")
              .eq("conversation_id", c.id)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();

            // Count unread messages from professional
            const { count } = await supabase
              .from("messages")
              .select("id", { count: "exact", head: true })
              .eq("conversation_id", c.id)
              .eq("sender_type", "professional")
              .is("read_at", null);

            return {
              id: c.id,
              professional_id: c.professional_id,
              created_at: c.created_at,
              professional_name: pro?.full_name || "Professional",
              professional_avatar: pro?.avatar_url || null,
              last_message: lastMsg?.content || null,
              last_message_at: lastMsg?.created_at || c.last_message_at || null,
              unread_count: count || 0,
            };
          })
        );

        // Sort by last message time
        items.sort((a, b) => {
          const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : new Date(a.created_at).getTime();
          const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : new Date(b.created_at).getTime();
          return bTime - aTime;
        });

        setConversations(items);
      } catch (err) {
        console.error("Error fetching conversations:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();

    // Realtime listener for new messages
    const channel = supabase
      .channel("messages-list")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => {
        fetchConversations();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [customerProfileId]);

  const filtered = searchQuery
    ? conversations.filter(c => c.professional_name.toLowerCase().includes(searchQuery.toLowerCase()))
    : conversations;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-md mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-foreground mb-1">Messages</h1>
        <p className="text-sm text-muted-foreground mb-4">Chat with your professionals</p>

        {conversations.length > 3 && (
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search conversations..." value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 h-10 bg-muted/50 border-0 rounded-xl" />
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No messages yet</p>
            <p className="text-sm text-muted-foreground mt-1">Start a conversation by visiting a professional's profile</p>
          </div>
        ) : (
          <div className="space-y-1">
            {filtered.map((convo, i) => {
              const initials = convo.professional_name.split(" ").map(n => n[0]).join("").toUpperCase();
              return (
                <motion.button key={convo.id} onClick={() => navigate(`/chat/${convo.id}`)}
                  initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-muted/50 transition-colors text-left">
                  <div className="relative">
                    <Avatar className="w-12 h-12">
                      {convo.professional_avatar ? (
                        <AvatarImage src={convo.professional_avatar} alt="" />
                      ) : null}
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">{initials}</AvatarFallback>
                    </Avatar>
                    {convo.unread_count > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                        {convo.unread_count > 9 ? "9+" : convo.unread_count}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`font-semibold text-foreground text-sm truncate ${convo.unread_count > 0 ? "text-foreground" : ""}`}>
                        {convo.professional_name}
                      </p>
                      {convo.last_message_at && (
                        <span className="text-[10px] text-muted-foreground flex-shrink-0 ml-2">
                          {formatDistanceToNow(new Date(convo.last_message_at), { addSuffix: false })}
                        </span>
                      )}
                    </div>
                    <p className={`text-sm truncate ${convo.unread_count > 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                      {convo.last_message || "Start a conversation"}
                    </p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>
      <CustomerBottomNav />
    </div>
  );
};

export default CustomerMessages;
