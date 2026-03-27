import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { HelpCircle, ChevronDown, ChevronUp, Send, MessageCircle, Mail, FileText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const faqs = [
  { q: "How do I deposit crypto?", a: "Navigate to Deposit Crypto from the sidebar. Select the cryptocurrency you want to deposit, choose the correct network, and send funds to the displayed wallet address." },
  { q: "How long do withdrawals take?", a: "Withdrawals require admin approval for security. Once approved, they are typically processed within 1-24 hours depending on network congestion." },
  { q: "What are trading bots?", a: "Trading bots are automated programs that execute trades based on predefined strategies. You can create bots with strategies like market making, trend following, and DCA." },
  { q: "How does the referral program work?", a: "Share your unique referral link. When friends sign up and trade, you earn 10% commission on their trading fees." },
  { q: "Is my account secure?", a: "Yes. We use industry-standard encryption, two-factor authentication, and all funds are secured with multi-signature wallets." },
  { q: "What is KYC verification?", a: "Know Your Customer (KYC) is identity verification required to unlock higher trading limits and withdrawal capabilities." },
];

const HelpPage = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Support request submitted! We'll get back to you within 24 hours.");
    setName(""); setEmail(""); setMessage("");
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Help & Support</h1>
          <p className="text-sm text-muted-foreground">Find answers or reach out to our team</p>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: FileText, title: "Documentation", desc: "Read our guides" },
            { icon: MessageCircle, title: "Live Chat", desc: "Chat with support" },
            { icon: Mail, title: "Email Support", desc: "support@tronnlix.com" },
          ].map(l => (
            <div key={l.title} className="bg-card border border-border rounded-2xl p-5 text-center hover:border-primary/30 transition-colors cursor-pointer">
              <l.icon className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-sm font-semibold text-foreground">{l.title}</p>
              <p className="text-xs text-muted-foreground">{l.desc}</p>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-muted-foreground mb-4">Frequently Asked Questions</h2>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-secondary/30 transition-colors"
                >
                  <span className="text-sm font-medium text-foreground">{faq.q}</span>
                  {openFaq === i ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4">
                    <p className="text-sm text-muted-foreground">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact form */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-muted-foreground mb-4">Contact Us</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" required
              className="w-full h-11 rounded-lg bg-secondary border border-border px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Your email" required
              className="w-full h-11 rounded-lg bg-secondary border border-border px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
            <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Describe your issue..." required rows={4}
              className="w-full rounded-lg bg-secondary border border-border px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary resize-none" />
            <Button variant="gold" size="sm" className="gap-2"><Send className="h-3.5 w-3.5" /> Send Message</Button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default HelpPage;
