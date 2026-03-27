import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { CreditCard, Plus, Smartphone, Building, Trash2 } from "lucide-react";

const methods = [
  { id: "1", name: "Visa •••• 4242", type: "Card", icon: CreditCard, added: "2026-01-15" },
  { id: "2", name: "M-Pesa +254***890", type: "Mobile Money", icon: Smartphone, added: "2026-02-20" },
  { id: "3", name: "Chase Bank •••7890", type: "Bank Account", icon: Building, added: "2026-03-01" },
];

const PaymentMethodsPage = () => {
  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-6 max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Payment Methods</h1>
            <p className="text-sm text-muted-foreground">Manage your payment methods for deposits and withdrawals</p>
          </div>
          <Button variant="gold" size="sm" className="gap-2"><Plus className="h-3.5 w-3.5" /> Add Method</Button>
        </div>

        <div className="space-y-3">
          {methods.map(m => (
            <div key={m.id} className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <m.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">{m.name}</p>
                <p className="text-xs text-muted-foreground">{m.type} • Added {m.added}</p>
              </div>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-muted-foreground mb-4">Supported Payment Types</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: CreditCard, title: "Credit/Debit Card", desc: "Visa, Mastercard, Amex" },
              { icon: Smartphone, title: "Mobile Money", desc: "M-Pesa, Airtel Money" },
              { icon: Building, title: "Bank Transfer", desc: "Wire transfer, ACH" },
            ].map(t => (
              <div key={t.title} className="bg-secondary/50 rounded-xl p-4 text-center">
                <t.icon className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-sm font-semibold text-foreground">{t.title}</p>
                <p className="text-xs text-muted-foreground">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PaymentMethodsPage;
