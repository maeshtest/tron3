import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { CreditCard, Plus, Smartphone, Building, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PaymentMethod {
  id: string;
  type: "card" | "mobile_money" | "bank";
  name: string;
  details: any;
  created_at: string;
}

const PaymentMethodsPage = () => {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newMethod, setNewMethod] = useState({
    type: "card",
    name: "",
    details: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch methods
  const fetchMethods = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("payment_methods")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching payment methods:", error);
      toast.error("Could not load payment methods");
    } else {
      setMethods(data || []);
    }
    setLoading(false);
  };

  // Realtime subscription
  useEffect(() => {
    fetchMethods();

    const channel = supabase
      .channel("payment-methods-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "payment_methods",
        },
        () => fetchMethods()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Add new method
  const handleAddMethod = async () => {
    if (!newMethod.name.trim()) {
      toast.error("Please enter a name");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("payment_methods").insert({
      type: newMethod.type,
      name: newMethod.name,
      details: { description: newMethod.details },
      user_id: (await supabase.auth.getUser()).data.user?.id,
      is_active: true,
    });

    if (error) {
      console.error(error);
      toast.error("Failed to add payment method");
    } else {
      toast.success("Payment method added");
      setAddDialogOpen(false);
      setNewMethod({ type: "card", name: "", details: "" });
    }
    setSubmitting(false);
  };

  // Delete method
  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase
      .from("payment_methods")
      .update({ is_active: false })
      .eq("id", deleteId);

    if (error) {
      toast.error("Could not delete method");
    } else {
      toast.success("Payment method removed");
    }
    setDeleteId(null);
  };

  // Helper to get icon component
  const getIcon = (type: string) => {
    switch (type) {
      case "card":
        return CreditCard;
      case "mobile_money":
        return Smartphone;
      case "bank":
        return Building;
      default:
        return CreditCard;
    }
  };

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground tracking-tight">
              Payment Methods
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Securely manage your saved payment methods for deposits and withdrawals
            </p>
          </div>
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gold" size="default" className="gap-2 shadow-sm">
                <Plus className="h-4 w-4" /> Add New Method
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Payment Method</DialogTitle>
                <DialogDescription>
                  Enter the details of your card, mobile money account, or bank account.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={newMethod.type}
                    onValueChange={(val) => setNewMethod({ ...newMethod, type: val })}
                  >
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="card">Credit/Debit Card</SelectItem>
                      <SelectItem value="mobile_money">Mobile Money</SelectItem>
                      <SelectItem value="bank">Bank Account</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Display Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Visa •••• 4242"
                    value={newMethod.name}
                    onChange={(e) => setNewMethod({ ...newMethod, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="details">Details (optional)</Label>
                  <Input
                    id="details"
                    placeholder="Additional info (phone, bank, etc.)"
                    value={newMethod.details}
                    onChange={(e) => setNewMethod({ ...newMethod, details: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddMethod} disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Method"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Methods List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : methods.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-8 text-center">
            <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-medium text-foreground">No payment methods yet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Add your first method to start making deposits.
            </p>
            <Button variant="outline" className="mt-4" onClick={() => setAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Add Method
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {methods.map((method) => {
              const Icon = getIcon(method.type);
              return (
                <div
                  key={method.id}
                  className="bg-card border border-border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 transition-all hover:shadow-md hover:border-primary/20"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="font-semibold text-foreground text-lg">{method.name}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="capitalize">{method.type.replace("_", " ")}</span>
                      <span>•</span>
                      <span>Added {formatDate(method.created_at)}</span>
                      {method.details?.description && (
                        <>
                          <span>•</span>
                          <span>{method.details.description}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                    onClick={() => setDeleteId(method.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {/* Supported Types Section */}
        <div className="bg-card border border-border rounded-2xl p-6 mt-8">
          <h2 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
            <span className="w-1 h-4 bg-primary rounded-full"></span>
            Supported Payment Types
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: CreditCard, title: "Credit/Debit Card", desc: "Visa, Mastercard, Amex" },
              { icon: Smartphone, title: "Mobile Money", desc: "M-Pesa, Airtel Money" },
              { icon: Building, title: "Bank Transfer", desc: "Wire transfer, ACH" },
            ].map((t) => (
              <div
                key={t.title}
                className="bg-secondary/30 rounded-xl p-4 text-center hover:bg-secondary/50 transition-colors"
              >
                <t.icon className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-sm font-semibold text-foreground">{t.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove payment method?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The method will be permanently removed from your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default PaymentMethodsPage;
