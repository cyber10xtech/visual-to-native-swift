import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Paperclip, Send, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate, useParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  is_read: boolean;
}

interface Professional {
  full_name: string;
  profession: string | null;
  avatar_url: string | null;
}

const CustomerChat = () => {
  const navigate = useNavigate();
  const { id: conversationId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch profile ID, conversation details, and messages
  useEffect(() => {
    if (!user || !conversationId) return;

    const init = async () => {
      try {
        // Get own profile id
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (profile) setProfileId(profile.id);

        // Get conversation with professional info
        const { data: conv } = await supabase
          .from("conversations")
          .select(`
            pro_id,
            professional:profiles!conversations_professional_id_fkey (
              full_name,
              profession,
              avatar_url
            )
          `)
          .eq("id", conversationId)
          .single();

        if (conv?.professional) {
          setProfessional(conv.professional as unknown as Professional);
        }

        // Fetch messages
        const { data: msgs } = await supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true });

        setMessages(msgs || []);

        // Mark unread messages as read
        if (profile) {
          await supabase
            .from("messages")
            .update({ is_read: true })
            .eq("conversation_id", conversationId)
            .neq("sender_id", profile.id)
            .eq("is_read", false);
        }
      } catch (err) {
        console.error("Error loading chat:", err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [user, conversationId]);

  // Subscribe to realtime messages
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.find((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });

          // Auto-mark as read if from other person
          if (profileId && newMsg.sender_id !== profileId) {
            supabase
              .from("messages")
              .update({ is_read: true })
              .eq("id", newMsg.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, profileId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !profileId || !conversationId) return;

    const content = message.trim();
    setMessage("");

    const { error } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: profileId,
      content,
    });

    if (error) {
      console.error("Failed to send message:", error);
      setMessage(content);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const proName = professional?.full_name || "Professional";
  const proInitial = proName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <Avatar className="w-10 h-10">
              <AvatarImage src={professional?.avatar_url || undefined} alt={proName} />
              <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                {proInitial}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="font-semibold text-foreground">{proName}</h1>
              <span className="text-xs text-muted-foreground">{professional?.profession || "Professional"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No messages yet. Start the conversation!
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.sender_id === profileId;
          return (
            <div
              key={msg.id}
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-2",
                isMe
                  ? "ml-auto bg-primary text-primary-foreground rounded-br-sm"
                  : "mr-auto bg-muted text-foreground rounded-bl-sm"
              )}
            >
              <p className="text-sm">{msg.content}</p>
              <span
                className={cn(
                  "text-xs block mt-1",
                  isMe ? "text-primary-foreground/70" : "text-muted-foreground"
                )}
              >
                {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-border bg-card">
        <div className="flex items-center gap-2">
          <button type="button" className="text-muted-foreground hover:text-foreground">
            <Paperclip className="w-5 h-5" />
          </button>
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 h-10 bg-muted/50 border border-border rounded-xl"
          />
          <Button type="submit" size="icon" className="rounded-full" disabled={!message.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CustomerChat;
