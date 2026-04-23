import { useState } from "react";
import { LogIn, UserPlus, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import TronnlixLogo from "@/components/TronnlixLogo";

const AuthPage = () => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "signup") {
        if (password !== confirmPassword) {
          toast.error("Passwords do not match");
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, referral_code: referralCode || undefined },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success("Account created! Please verify your email.");
        navigate("/verify-email");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/dashboard");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full h-11 rounded-lg bg-secondary border border-border px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors";

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="absolute inset-0 bg-primary/3 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md text-center mb-6">
        <Link to="/" className="inline-flex items-center gap-2 mb-3">
          <TronnlixLogo size={40} />
          <span className="text-2xl font-display font-bold text-foreground">Tronnlix</span>
        </Link>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="flex mb-6 gap-2 bg-card border border-border rounded-lg p-1">
          <Button variant={mode === "login" ? "gold" : "ghost"} className="flex-1 gap-2" onClick={() => setMode("login")}>
            <LogIn className="h-4 w-4" /> {t("auth.login")}
          </Button>
          <Button variant={mode === "signup" ? "gold" : "ghost"} className="flex-1 gap-2" onClick={() => setMode("signup")}>
            <UserPlus className="h-4 w-4" /> {t("auth.signUp")}
          </Button>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-xl font-display font-bold text-foreground mb-1">
            {mode === "login" ? t("auth.welcomeBack") : t("auth.createAccount")}
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            {mode === "login" ? t("auth.signInSub") : t("auth.signUpSub")}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="block text-sm text-muted-foreground mb-1.5">{t("auth.fullName")}</label>
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" className={inputClass} required />
              </div>
            )}

            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">{t("auth.email")}</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" className={inputClass} required />
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">{t("auth.password")}</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "login" ? "Your password" : "Create a strong password"}
                  className={inputClass}
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {mode === "signup" && (
              <>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1.5">{t("auth.confirmPassword")}</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1.5">{t("auth.referral")}</label>
                  <input
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    placeholder="Enter referral code"
                    className={inputClass}
                  />
                </div>
              </>
            )}

            <Button variant="gold" size="lg" className="w-full mt-2" disabled={loading}>
              {loading ? t("auth.wait") : mode === "login" ? t("auth.login") : t("auth.signUp")}
            </Button>
          </form>

          {/* OAuth buttons removed – users must use email */}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
