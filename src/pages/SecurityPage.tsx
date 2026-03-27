import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Lock, Smartphone, Monitor, Shield, Eye, EyeOff, Mail, CheckCircle2, ChevronRight, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const SecurityPage = () => {
  const { user } = useAuth();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);

  const emailConfirmed = !!user?.email_confirmed_at;
  const hasPassword = !!user?.email;

  // Calculate protection score
  const protectionItems = [
    { done: emailConfirmed, label: "Email confirmed" },
    { done: hasPassword, label: "Password set" },
    { done: false, label: "2FA enabled" }, // visual only
  ];
  const protectionScore = Math.round(
    (protectionItems.filter(i => i.done).length / protectionItems.length) * 100
  );

  // Fetch sessions
  useEffect(() => {
    if (!user) return;
    const fetchSessions = async () => {
      const { data } = await supabase
        .from("user_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("last_active", { ascending: false });
      if (data) setSessions(data);
    };
    fetchSessions();

    // Record current session
    const recordSession = async () => {
      const ua = navigator.userAgent;
      const browser = ua.includes("Chrome") ? "Chrome" : ua.includes("Firefox") ? "Firefox" : ua.includes("Safari") ? "Safari" : "Unknown";
      const os = ua.includes("Mac") ? "macOS" : ua.includes("Windows") ? "Windows" : ua.includes("Linux") ? "Linux" : ua.includes("iPhone") ? "iOS" : ua.includes("Android") ? "Android" : "Unknown";
      const device = `${browser} on ${os}`;

      // Check if current session exists
      const { data: existing } = await supabase
        .from("user_sessions")
        .select("id")
        .eq("user_id", user.id)
        .eq("is_current", true)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("user_sessions")
          .update({ last_active: new Date().toISOString(), device, browser, os })
          .eq("id", existing.id);
      } else {
        await supabase.from("user_sessions").insert({
          user_id: user.id,
          device,
          browser,
          os,
          is_current: true,
        });
      }
      fetchSessions();
    };
    recordSession();
  }, [user]);

  const handleChangePassword = async () => {
    if (newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (newPassword !== confirmPassword) { toast.error("Passwords don't match"); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) toast.error(error.message);
    else { toast.success("Password updated!"); setShowChangePassword(false); setNewPassword(""); setConfirmPassword(""); }
    setLoading(false);
  };

  const revokeSession = async (id: string) => {
    await supabase.from("user_sessions").delete().eq("id", id);
    setSessions(s => s.filter(ss => ss.id !== id));
    toast.success("Session revoked");
  };

  const getProtectionColor = () => {
    if (protectionScore >= 80) return "text-emerald-400";
    if (protectionScore >= 50) return "text-amber-400";
    return "text-destructive";
  };

  const getProtectionRingColor = () => {
    if (protectionScore >= 80) return "stroke-emerald-400";
    if (protectionScore >= 50) return "stroke-amber-400";
    return "stroke-destructive";
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-5 max-w-2xl mx-auto">
        {/* Protection Score */}
        <div className="bg-card border border-border rounded-2xl p-6 flex items-center gap-6">
          <div className="relative w-20 h-20 shrink-0">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" strokeWidth="6" className="stroke-secondary" />
              <circle
                cx="40" cy="40" r="34" fill="none" strokeWidth="6"
                className={getProtectionRingColor()}
                strokeDasharray={`${(protectionScore / 100) * 213.6} 213.6`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Shield className={`h-4 w-4 ${getProtectionColor()}`} />
              <span className={`text-lg font-bold ${getProtectionColor()}`}>{protectionScore}%</span>
            </div>
          </div>
          <div>
            <h1 className="text-lg font-display font-bold text-foreground">Account Protection</h1>
            <p className="text-xs text-muted-foreground mt-1">
              {protectionScore < 100
                ? "Complete the steps below to fully secure your account"
                : "Your account is fully protected"}
            </p>
          </div>
        </div>

        {/* 2FA */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Smartphone className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Two-Factor Authentication</p>
                <p className="text-xs text-muted-foreground">Strengthen your account with an additional security layer</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-medium">Recommended</span>
              <Button variant="goldOutline" size="sm">
                Activate <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </div>
        </div>

        {/* Password */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Lock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Access Password</p>
                <p className="text-xs text-muted-foreground">Safeguard your account with a robust password</p>
              </div>
            </div>
            <Button variant="goldOutline" size="sm" onClick={() => setShowChangePassword(!showChangePassword)}>
              {showChangePassword ? "Cancel" : "Change"}
            </Button>
          </div>
          {showChangePassword && (
            <div className="space-y-3 mt-4 pt-4 border-t border-border">
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="New password"
                  className="w-full h-11 rounded-xl bg-secondary border border-border px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full h-11 rounded-xl bg-secondary border border-border px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              />
              <Button variant="gold" size="sm" onClick={handleChangePassword} disabled={loading}>
                {loading ? "Saving..." : "Update Password"}
              </Button>
            </div>
          )}
        </div>

        {/* Email Confirmation */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${emailConfirmed ? "bg-emerald-500/10" : "bg-destructive/10"}`}>
                <Mail className={`h-5 w-5 ${emailConfirmed ? "text-emerald-400" : "text-destructive"}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Email Confirmation</p>
                <p className="text-xs text-muted-foreground">
                  {emailConfirmed ? "Your email address is confirmed" : "Please verify your email address"}
                </p>
              </div>
            </div>
            {emailConfirmed ? (
              <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" /> Verified
              </span>
            ) : (
              <Button variant="goldOutline" size="sm">Verify</Button>
            )}
          </div>
        </div>

        {/* Two-Step Verification (visual) */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Two-Step Verification</p>
                <p className="text-xs text-muted-foreground">Enable a second authentication factor</p>
              </div>
            </div>
            <Button variant="goldOutline" size="sm">
              Enable <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>

        {/* Active Sessions */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Monitor className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Active Sessions & Devices</h2>
              <p className="text-xs text-muted-foreground">{sessions.length} active session{sessions.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
          <div className="space-y-2">
            {sessions.length === 0 && (
              <p className="text-xs text-muted-foreground py-4 text-center">No active sessions recorded</p>
            )}
            {sessions.map(s => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/40 border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-card">
                    {s.os === "iOS" || s.os === "Android" ? (
                      <Smartphone className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Monitor className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {s.device}
                      {s.is_current && (
                        <span className="text-[10px] ml-2 px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium">
                          Current
                        </span>
                      )}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {s.ip_address ? `IP: ${s.ip_address} • ` : ""}
                      {new Date(s.last_active).toLocaleString()}
                    </p>
                  </div>
                </div>
                {!s.is_current && (
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => revokeSession(s.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SecurityPage;
