import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Loader2, CheckCheck, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { messageSchema } from "@/lib/validation";
import { createNotification } from "@/hooks/useNotifications";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_type: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

interface ConversationMeta {
  otherName: string;
  otherAvatar: string | null;
  otherProfileId: string;
  otherUserId: string;
}

const CustomerChat = () => {
  const { id: paramId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, customerProfileId } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [meta, setMeta] = useState<ConversationMeta | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Determine if paramId is a conversation ID or a professional profile ID
  useEffect(() => {
    if (!customerProfileId || !paramId) return;

    const init = async () => {
      setLoading(true);

      // First check if paramId is an existing conversation
      const { data: existingConvo } = await supabase
        .from("conversations")
        .select("id, customer_id, professional_id")
        .eq("id", paramId)
        .maybeSingle();

      if (existingConvo) {
        setConversationId(existingConvo.id);
        const proId = existingConvo.professional_id;
        const { data: proProfile } = await supabase
          .from("profiles_public")
          .select("id, user_id, full_name, avatar_url")
          .eq("id", proId)
          .maybeSingle();

        if (proProfile) {
          setMeta({
            otherName: proProfile.full_name,
            otherAvatar: proProfile.avatar_url,
            otherProfileId: proProfile.id,
            otherUserId: proProfile.user_id,
          });
        }
        return;
      }

      // paramId is a professional's profile ID — find or create conversation
      const { data: proProfile } = await supabase
        .from("profiles_public")
        .select("id, user_id, full_name, avatar_url")
        .eq("id", paramId)
        .maybeSingle();

      if (!proProfile) {
        setLoading(false);
        return;
      }

      setMeta({
        otherName: proProfile.full_name,
        otherAvatar: proProfile.avatar_url,
        otherProfileId: proProfile.id,
        otherUserId: proProfile.user_id,
      });

      // Check for existing conversation
      const { data: existingChat } = await supabase
        .from("conversations")
        .select("id")
        .eq("customer_id", customerProfileId)
        .eq("professional_id", paramId)
        .maybeSingle();

      if (existingChat) {
        setConversationId(existingChat.id);
      } else {
        const { data: newConvo, error } = await supabase
          .from("conversations")
          .insert({ customer_id: customerProfileId, professional_id: paramId })
          .select("id")
          .single();

        if (!error && newConvo) {
          setConversationId(newConvo.id);
        }
      }
    };

    init();
  }, [customerProfileId, paramId]);

  // Fetch messages
  useEffect(() => {
    if (!conversationId) return;

    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true });

        if (error) throw error;

        const mapped: Message[] = (data || []).map((m: any) => ({
          id: m.id,
          conversation_id: m.conversation_id,
          sender_id: m.sender_id,
          sender_type: m.sender_type ?? "unknown",
          content: m.content,
          read_at: m.read_at ?? null,
          created_at: m.created_at,
        }));
        setMessages(mapped);

        // Mark professional messages as read
        if (customerProfileId && data && data.length > 0) {
          const unread = data.filter((m: any) => m.sender_type === "professional" && !m.read_at);
          if (unread.length > 0) {
            await supabase
              .from("messages")
              .update({ read_at: new Date().toISOString() })
              .eq("conversation_id", conversationId)
              .eq("sender_type", "professional")
              .is("read_at", null);
          }
        }
      } catch (err) {
        console.error("Error fetching messages:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Real-time listener
    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => {
        if (payload.eventType === "INSERT") {
          const m = payload.new as any;
          const newMsg: Message = {
            id: m.id,
            conversation_id: m.conversation_id,
            sender_id: m.sender_id,
            sender_type: m.sender_type ?? "unknown",
            content: m.content,
            read_at: m.read_at ?? null,
            created_at: m.created_at,
          };
          setMessages((prev) => {
            if (prev.find(msg => msg.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          // Auto-mark as read if from professional
          if (newMsg.sender_type === "professional") {
            supabase.from("messages").update({ read_at: new Date().toISOString() }).eq("id", newMsg.id).then();
            // Sound + vibrate
            try { new Audio("/notification.mp3").play().catch(() => {}); } catch {}
            if (navigator.vibrate) navigator.vibrate(150);
          }
        } else if (payload.eventType === "UPDATE") {
          const updated = payload.new as any;
          setMessages((prev) => prev.map(msg =>
            msg.id === updated.id
              ? { ...msg, read_at: updated.read_at }
              : msg
          ));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId, customerProfileId]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const validation = messageSchema.safeParse({ content: newMessage });
    if (!validation.success || !conversationId || !customerProfileId) return;

    setSending(true);
    try {
      const { error } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: customerProfileId,
        sender_type: "customer",
        content: newMessage.trim(),
      });

      if (error) throw error;

      // Update last_message_at on conversation
      await supabase
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", conversationId);

      // Notify the professional
      if (meta?.otherUserId) {
        await createNotification(
          meta.otherUserId,
          "professional",
          "message",
          "New Message 💬",
          `${user?.user_metadata?.full_name || "A customer"}: ${newMessage.trim().slice(0, 100)}`,
          { conversation_id: conversationId },
        );
      }

      setNewMessage("");
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setSending(false);
    }
  };

  const otherInitials = meta?.otherName?.split(" ").map(n => n[0]).join("").toUpperCase() || "?";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate("/messages")} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        {meta && (
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar className="w-9 h-9">
              <AvatarImage src={meta.otherAvatar || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">{otherInitials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h2 className="font-semibold text-foreground text-sm truncate">{meta.otherName}</h2>
              <p className="text-xs text-muted-foreground">Online</p>
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg mb-1">👋</p>
            <p>Start the conversation!</p>
            <p className="text-xs mt-1">Say hello to {meta?.otherName || "this professional"}</p>
          </div>
        ) : (
          <AnimatePresence>
            {messages.map((msg, i) => {
              const isMine = msg.sender_type === "customer";
              const showTime = i === 0 ||
                new Date(msg.created_at).getTime() - new Date(messages[i - 1].created_at).getTime() > 300000;

              return (
                <div key={msg.id}>
                  {showTime && (
                    <div className="text-center text-[10px] text-muted-foreground/60 my-3">
                      {format(new Date(msg.created_at), "MMM d, h:mm a")}
                    </div>
                  )}
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[75%] px-4 py-2.5 text-sm ${
                      isMine
                        ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md"
                        : "bg-muted text-foreground rounded-2xl rounded-bl-md"
                    }`}>
                      <p>{msg.content}</p>
                      <div className={`flex items-center justify-end gap-1 mt-1 ${isMine ? "text-primary-foreground/60" : "text-muted-foreground/60"}`}>
                        <span className="text-[9px]">{format(new Date(msg.created_at), "h:mm a")}</span>
                        {isMine && (
                          msg.read_at
                            ? <CheckCheck className="w-3 h-3 text-primary-foreground/80" />
                            : <Check className="w-3 h-3" />
                        )}
                      </div>
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </AnimatePresence>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <div className="bg-card border-t border-border px-4 py-3">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-full h-11 bg-muted/50 border-0"
            maxLength={5000}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          />
          <Button size="icon" onClick={handleSend} disabled={!newMessage.trim() || sending}
            className="rounded-full w-11 h-11 gradient-primary border-0">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 text-white" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CustomerChat;
