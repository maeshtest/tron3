import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AlertTriangle, Info, CheckCircle2, X, Bell } from "lucide-react";

interface FeedbackMessage {
  id: string;
  type: "info" | "warning" | "error" | "success";
  title: string;
  message: string;
  dismissible: boolean;
}

const iconMap = {
  info: Info,
  warning: AlertTriangle,
  error: AlertTriangle,
  success: CheckCircle2,
};

const colorMap = {
  info: "border-blue-500/30 bg-blue-500/5 text-blue-400",
  warning: "border-amber-500/30 bg-amber-500/5 text-amber-400",
  error: "border-destructive/30 bg-destructive/5 text-destructive",
  success: "border-emerald-500/30 bg-emerald-500/5 text-emerald-400",
};

export const useFeedback = () => {
  const showFeedback = useCallback((type: FeedbackMessage["type"], title: string, message?: string) => {
    switch (type) {
      case "success":
        toast.success(title, { description: message });
        break;
      case "error":
        toast.error(title, { description: message });
        break;
      case "warning":
        toast.warning(title, { description: message });
        break;
      default:
        toast.info(title, { description: message });
    }
  }, []);

  return { showFeedback };
};

// Banner-style feedback for persistent messages (e.g., announcements)
export const FeedbackBanner = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<FeedbackMessage[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;

    // Check for system announcements from site_settings
    const loadAnnouncements = async () => {
      try {
        const { data } = await supabase.functions.invoke("public-settings");
        if (data?.announcement && typeof data.announcement === "string" && data.announcement.trim()) {
          setMessages([{
            id: "system-announcement",
            type: "info",
            title: "Announcement",
            message: data.announcement,
            dismissible: true,
          }]);
        }
      } catch {
        // silently fail
      }
    };

    loadAnnouncements();
  }, [user]);

  const dismiss = (id: string) => {
    setDismissed(prev => new Set(prev).add(id));
  };

  const visible = messages.filter(m => !dismissed.has(m.id));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-2 mb-4">
      {visible.map(msg => {
        const Icon = iconMap[msg.type];
        return (
          <div key={msg.id} className={`flex items-start gap-3 p-3 rounded-xl border ${colorMap[msg.type]}`}>
            <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{msg.title}</p>
              <p className="text-xs opacity-80 mt-0.5">{msg.message}</p>
            </div>
            {msg.dismissible && (
              <button onClick={() => dismiss(msg.id)} className="p-1 hover:bg-secondary rounded-lg flex-shrink-0">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default FeedbackBanner;
