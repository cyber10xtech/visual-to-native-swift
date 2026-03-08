import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Loader2, CheckCheck, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { messageSchema } from "@/lib/validation";
import { createNotification } from "@/hooks/useNotifications";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean | null;
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
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [meta, setMeta] = useState<ConversationMeta | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Get current user's profile ID
  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("id").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => setProfileId(data?.id ?? null));
  }, [user]);

  // Determine if paramId is a conversation ID or a professional profile ID
  useEffect(() => {
    if (!profileId || !paramId) return;

    const init = async () => {
      setLoading(true);
      
      // First check if paramId is an existing conversation
      const { data: existingConvo } = await supabase
        .from("conversations")
        .select("id, customer_id, pro_id")
        .eq("id", paramId)
        .maybeSingle();

      if (existingConvo) {
        setConversationId(existingConvo.id);
        // Load the other person's info
        const otherId = existingConvo.customer_id === profileId ? existingConvo.pro_id : existingConvo.customer_id;
        const { data: otherProfile } = await supabase
          .from("profiles")
          .select("id, user_id, full_name, avatar_url")
          .eq("id", otherId)
          .maybeSingle();
        
        if (otherProfile) {
          setMeta({
            otherName: otherProfile.full_name,
            otherAvatar: otherProfile.avatar_url,
            otherProfileId: otherProfile.id,
            otherUserId: otherProfile.user_id,
          });
        }
        return;
      }

      // paramId is a professional's profile ID — find or create conversation
      const { data: proProfile } = await supabase
        .from("profiles")
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

      // Check for existing conversation with this pro
      const { data: existingChat } = await supabase
        .from("conversations")
        .select("id")
        .eq("customer_id", profileId)
        .eq("pro_id", paramId)
        .maybeSingle();

      if (existingChat) {
        setConversationId(existingChat.id);
      } else {
        // Create new conversation
        const { data: newConvo, error } = await supabase
          .from("conversations")
          .insert({ customer_id: profileId, pro_id: paramId })
          .select("id")
          .single();

        if (!error && newConvo) {
          setConversationId(newConvo.id);
        }
      }
    };

    init();
  }, [profileId, paramId]);

  // Fetch messages when conversation is ready
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
        setMessages(data || []);

        // Mark unread messages as read
        if (profileId && data && data.length > 0) {
          const unread = data.filter(m => m.sender_id !== profileId && !m.is_read);
          if (unread.length > 0) {
            await supabase
              .from("messages")
              .update({ is_read: true })
              .eq("conversation_id", conversationId)
              .neq("sender_id", profileId)
              .eq("is_read", false);
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
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.find(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          // Auto-mark as read if from the other person
          if (newMsg.sender_id !== profileId) {
            supabase.from("messages").update({ is_read: true }).eq("id", newMsg.id).then();
          }
        } else if (payload.eventType === "UPDATE") {
          setMessages((prev) => prev.map(m => m.id === (payload.new as Message).id ? payload.new as Message : m));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId, profileId]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const validation = messageSchema.safeParse({ content: newMessage });
    if (!validation.success || !conversationId || !profileId) return;

    setSending(true);
    try {
      const { error } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: profileId,
        content: newMessage.trim(),
      });

      if (error) throw error;
      
      // Send notification to the other user
      if (meta?.otherUserId) {
        await createNotification(
          meta.otherUserId,
          "message",
          "New Message",
          `${user?.user_metadata?.full_name || "Someone"}: ${newMessage.trim().slice(0, 100)}`,
        );
      }

      setNewMessage("");
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setSending(false);
    }
  };

  const handleInputChange = (value: string) => {
    setNewMessage(value);
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
              <p className="text-xs text-muted-foreground">
                {isTyping ? "typing..." : "Online"}
              </p>
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
              const isMine = msg.sender_id === profileId;
              const showTime = i === 0 || 
                new Date(msg.created_at).getTime() - new Date(messages[i-1].created_at).getTime() > 300000;
              
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
                          msg.is_read
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
            onChange={(e) => handleInputChange(e.target.value)}
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
