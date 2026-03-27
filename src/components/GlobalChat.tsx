import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatMessage {
  id: string;
  user_id: string;
  username: string;
  message: string;
  created_at: string;
}

const GlobalChat = ({ onClose }: { onClose: () => void }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const username = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Anonymous";

  useEffect(() => {
    // Fetch existing messages
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(100);
      if (data) setMessages(data as ChatMessage[]);
    };
    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel("global-chat")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, (payload) => {
        setMessages((prev) => [...prev, payload.new as ChatMessage]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !user) return;
    await supabase.from("chat_messages").insert({
      user_id: user.id,
      username,
      message: input.trim(),
    });
    setInput("");
  };

  return (
    <div className="fixed bottom-4 right-4 w-80 h-96 bg-card border border-border rounded-xl shadow-2xl flex flex-col z-50 overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-border bg-primary/5">
        <span className="text-sm font-semibold text-foreground">💬 Global Chat</span>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map((msg) => (
          <div key={msg.id} className={`${msg.user_id === user?.id ? "text-right" : ""}`}>
            <p className="text-[10px] text-muted-foreground">{msg.username}</p>
            <div className={`inline-block rounded-lg px-3 py-1.5 text-xs max-w-[80%] ${
              msg.user_id === user?.id
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-foreground"
            }`}>
              {msg.message}
            </div>
          </div>
        ))}
      </div>

      <div className="p-2 border-t border-border flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type a message..."
          className="flex-1 h-8 rounded-md bg-secondary border border-border px-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
        />
        <Button variant="gold" size="icon" className="h-8 w-8" onClick={sendMessage}>
          <Send className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
};

export default GlobalChat;
