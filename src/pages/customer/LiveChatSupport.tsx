import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Paperclip, Send, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  text: string;
  sender: "user" | "support";
  time: string;
}

const quickReplies = [
  "I need help with a booking",
  "Payment issue",
  "Account question",
  "Report a problem",
];

const LiveChatSupport = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hi! Welcome to Safesight support. How can I help you today?",
      sender: "support",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || sending) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      sender: "user",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setMessage("");
    setSending(true);

    try {
      const { data, error } = await supabase.functions.invoke("live-chat", {
        body: {
          messages: updatedMessages.map((m) => ({
            sender: m.sender,
            text: m.text,
          })),
        },
      });

      const replyText = error
        ? "I'm having trouble connecting right now. Please try again in a moment."
        : data?.reply || "I'm sorry, I couldn't process that. Please try again.";

      const supportMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: replyText,
        sender: "support",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, supportMsg]);
    } catch {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, something went wrong. Please try again.",
        sender: "support",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(message);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-3"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          <div>
            <h1 className="font-semibold text-foreground">Live Chat Support</h1>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-primary rounded-full" />
              <span className="text-xs text-muted-foreground">
                Online · AI-powered support
              </span>
            </div>
          </div>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "max-w-[80%] rounded-2xl px-4 py-2",
              msg.sender === "user"
                ? "ml-auto bg-primary text-primary-foreground rounded-br-sm"
                : "mr-auto bg-muted text-foreground rounded-bl-sm"
            )}
          >
            <p className="text-sm">{msg.text}</p>
            <span
              className={cn(
                "text-xs block mt-1",
                msg.sender === "user" ? "text-primary-foreground/70" : "text-muted-foreground"
              )}
            >
              {msg.time}
            </span>
          </div>
        ))}
        {sending && (
          <div className="max-w-[80%] mr-auto bg-muted text-foreground rounded-2xl rounded-bl-sm px-4 py-3">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Typing...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Replies */}
      {messages.length <= 1 && (
        <div className="px-4 py-2 border-t border-border">
          <p className="text-xs text-muted-foreground mb-2">Quick replies:</p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {quickReplies.map((reply) => (
              <button
                key={reply}
                onClick={() => sendMessage(reply)}
                disabled={sending}
                className="flex-shrink-0 px-3 py-1.5 bg-muted rounded-full text-sm text-foreground hover:bg-muted/80 transition-colors disabled:opacity-50"
              >
                {reply}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-border bg-card">
        <div className="flex items-center gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 h-10 bg-muted/50 border border-border rounded-xl"
            disabled={sending}
          />
          <Button type="submit" size="icon" className="rounded-full" disabled={!message.trim() || sending}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default LiveChatSupport;
