import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatAmount, formatDateSimple } from "@/lib/format";
import { Plus, Trash2, Wallet, User, CreditCard, CheckCircle2, Clock, ChevronDown, ChevronUp } from "lucide-react";
import type { ExternalDebt, DebtPayment } from "@shared/schema";

function DebtCard({ debt }: { debt: ExternalDebt }) {
  const { toast } = useToast();
  const { hasPermission, user } = useAuth();
  const canViewTotals = user?.role !== "app_user" || hasPermission("view_totals");
  const [expanded, setExpanded] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [deleteDebtOpen, setDeleteDebtOpen] = useState(false);

  const total = Number(debt.totalAmount);
  const paid = Number(debt.paidAmount);
  const remaining = total - paid;
  const isFullyPaid = remaining <= 0;
  const progressPercent = total > 0 ? Math.min((paid / total) * 100, 100) : 0;

  const { data: payments, isLoading: paymentsLoading } = useQuery<DebtPayment[]>({
    queryKey: [`/api/external-debts/${debt.id}/payments`],
    enabled: expanded,
  });

  const addPaymentMutation = useMutation({
    mutationFn: async (data: { amount: string; note?: string }) => {
      const res = await apiRequest("POST", `/api/external-debts/${debt.id}/payments`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-debts"] });
      queryClient.invalidateQueries({ queryKey: [`/api/external-debts/${debt.id}/payments`] });
      setPaymentDialogOpen(false);
      setPaymentAmount("");
      setPaymentNote("");
      setPaymentDate(new Date().toISOString().split("T")[0]);
      toast({ title: "تم تسجيل الدفعة بنجاح" });
    },
    onError: (err: Error) => {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    },
  });

  const deletePaymentMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      await apiRequest("DELETE", `/api/external-debts/${debt.id}/payments/${paymentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-debts"] });
      queryClient.invalidateQueries({ queryKey: [`/api/external-debts/${debt.id}/payments`] });
      toast({ title: "تم حذف الدفعة" });
    },
    onError: (err: Error) => {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    },
  });

  const deleteDebtMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/external-debts/${debt.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-debts"] });
      toast({ title: "تم حذف الدين" });
    },
    onError: (err: Error) => {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    },
  });

  const handleAddPayment = () => {
    if (!paymentAmount) {
      toast({ title: "يرجى إدخال مبلغ صحيح", variant: "destructive" });
      return;
    }
    addPaymentMutation.mutate({ amount: paymentAmount, note: paymentNote || undefined, date: paymentDate });
  };

  const handlePayFull = () => {
    if (remaining <= 0) return;
    setPaymentAmount(String(remaining));
    setPaymentNote("سداد كامل");
    setPaymentDialogOpen(true);
  };

  const sortedPayments = [...(payments || [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <Card data-testid={`card-debt-${debt.id}`}>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10 text-primary">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium" data-testid={`text-debtor-name-${debt.id}`}>{debt.personName}</p>
              {debt.phone && (
                <p className="text-xs text-muted-foreground" dir="ltr">{debt.phone}</p>
              )}
              <p className="text-xs text-muted-foreground">{debt.date || formatDateSimple(debt.createdAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isFullyPaid ? (
              <Badge variant="secondary"><CheckCircle2 className="w-3 h-3 ml-1" />تم السداد</Badge>
            ) : (
              <Badge variant="outline"><Clock className="w-3 h-3 ml-1" />متبقي {formatAmount(remaining)} د.ج</Badge>
            )}
          </div>
        </div>

        {debt.note && (
          <p className="text-xs text-muted-foreground bg-muted/30 p-2 rounded-md">{debt.note}</p>
        )}

        {canViewTotals && (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 text-sm flex-wrap">
              <span className="text-muted-foreground">المبلغ الإجمالي</span>
              <span className="font-bold">{formatAmount(total)} د.ج</span>
            </div>
            <div className="flex items-center justify-between gap-2 text-sm flex-wrap">
              <span className="text-muted-foreground">المدفوع</span>
              <span className="font-medium text-green-600">{formatAmount(paid)} د.ج</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary rounded-full h-2 transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          {!isFullyPaid && (
            <>
              <Dialog open={paymentDialogOpen} onOpenChange={(v) => { setPaymentDialogOpen(v); if (!v) { setPaymentAmount(""); setPaymentNote(""); setPaymentDate(new Date().toISOString().split("T")[0]); } }}>
                <DialogTrigger asChild>
                  <Button size="sm" data-testid={`button-add-payment-${debt.id}`}>
                    <Wallet className="w-3 h-3 ml-1" />
                    دفعة جزئية
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>تسجيل دفعة لـ {debt.personName}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div className="text-sm text-muted-foreground">
                      المتبقي: <span className="font-bold text-foreground">{formatAmount(remaining)} د.ج</span>
                    </div>
                    <div className="space-y-2">
                      <Label>المبلغ</Label>
                      <Input
                        type="number"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        placeholder="أدخل مبلغ الدفعة"
                        step="0.01"
                        data-testid="input-payment-amount"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>ملاحظة (اختياري)</Label>
                      <Textarea
                        value={paymentNote}
                        onChange={(e) => setPaymentNote(e.target.value)}
                        placeholder="ملاحظة عن الدفعة"
                        data-testid="input-payment-note"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>التاريخ</Label>
                      <Input
                        type="date"
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        data-testid="input-payment-date"
                      />
                    </div>
                    <Button
                      className="w-full"
                      onClick={handleAddPayment}
                      disabled={addPaymentMutation.isPending}
                      data-testid="button-submit-payment"
                    >
                      تسجيل الدفعة
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button size="sm" variant="outline" onClick={handlePayFull} data-testid={`button-pay-full-${debt.id}`}>
                <CheckCircle2 className="w-3 h-3 ml-1" />
                سداد كامل
              </Button>
            </>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setExpanded(!expanded)}
            data-testid={`button-expand-${debt.id}`}
          >
            {expanded ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
            {expanded ? "إخفاء" : "عرض"} السجل
          </Button>
          <AlertDialog open={deleteDebtOpen} onOpenChange={setDeleteDebtOpen}>
            <Button size="sm" variant="ghost" onClick={() => setDeleteDebtOpen(true)} data-testid={`button-delete-debt-${debt.id}`}>
              <Trash2 className="w-3 h-3 text-destructive" />
            </Button>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>حذف الدين</AlertDialogTitle>
                <AlertDialogDescription>
                  هل أنت متأكد من حذف دين {debt.personName}؟ سيتم حذف جميع الدفعات المرتبطة.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                <AlertDialogAction onClick={() => deleteDebtMutation.mutate()}>حذف</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {expanded && (
          <div className="border-t pt-4 space-y-3">
            <p className="text-sm font-medium">سجل الدفعات</p>
            {paymentsLoading ? (
              <div className="space-y-2">
                {[1, 2].map(i => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : sortedPayments.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">لا توجد دفعات مسجلة بعد</p>
            ) : (
              <div className="space-y-2">
                {sortedPayments.map(payment => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-md bg-muted/50 flex-wrap"
                    data-testid={`payment-row-${payment.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-md bg-green-500/10 text-green-600">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{formatAmount(payment.amount)} د.ج</p>
                        <p className="text-xs text-muted-foreground">{payment.date || formatDateSimple(payment.createdAt)}</p>
                        {payment.note && (
                          <p className="text-xs text-muted-foreground">{payment.note}</p>
                        )}
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deletePaymentMutation.mutate(payment.id)}
                      disabled={deletePaymentMutation.isPending}
                      data-testid={`button-delete-payment-${payment.id}`}
                    >
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ExternalDebts() {
  const { toast } = useToast();
  const { hasPermission, user } = useAuth();
  const canViewTotals = user?.role !== "app_user" || hasPermission("view_totals");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [personName, setPersonName] = useState("");
  const [phone, setPhone] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const { data: debts, isLoading } = useQuery<ExternalDebt[]>({
    queryKey: ["/api/external-debts"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { personName: string; totalAmount: string; phone?: string; note?: string }) => {
      const res = await apiRequest("POST", "/api/external-debts", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-debts"] });
      setDialogOpen(false);
      setPersonName("");
      setPhone("");
      setTotalAmount("");
      setNote("");
      setDate(new Date().toISOString().split("T")[0]);
      toast({ title: "تم إضافة الدين بنجاح" });
    },
    onError: (err: Error) => {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    },
  });

  const handleCreate = () => {
    if (!personName || !totalAmount) {
      toast({ title: "يرجى ملء الاسم والمبلغ", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      personName,
      totalAmount,
      phone: phone || undefined,
      note: note || undefined,
      date,
    });
  };

  const allDebts = [...(debts || [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const activeDebts = allDebts.filter(d => Number(d.paidAmount) < Number(d.totalAmount));
  const paidDebts = allDebts.filter(d => Number(d.paidAmount) >= Number(d.totalAmount));
  const totalOwed = allDebts.reduce((acc, d) => acc + (Number(d.totalAmount) - Number(d.paidAmount)), 0);

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-debts-title">الديون الخارجية</h1>
          <p className="text-muted-foreground text-sm mt-1">إدارة الاستدانة من أشخاص خارجيين</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-debt">
              <Plus className="w-4 h-4 ml-1" />
              إضافة دين
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة دين جديد</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>اسم الشخص</Label>
                <Input
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  placeholder="اسم الشخص المدين"
                  data-testid="input-debtor-name"
                />
              </div>
              <div className="space-y-2">
                <Label>رقم الهاتف (اختياري)</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="رقم الهاتف"
                  dir="ltr"
                  data-testid="input-debtor-phone"
                />
              </div>
              <div className="space-y-2">
                <Label>المبلغ الإجمالي</Label>
                <Input
                  type="number"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  placeholder="مبلغ الدين"
                  step="0.01"
                  data-testid="input-debt-amount"
                />
              </div>
              <div className="space-y-2">
                <Label>ملاحظة (اختياري)</Label>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="ملاحظة عن الدين"
                  data-testid="input-debt-note"
                />
              </div>
              <div className="space-y-2">
                <Label>التاريخ</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  data-testid="input-debt-date"
                />
              </div>
              <Button
                className="w-full"
                onClick={handleCreate}
                disabled={createMutation.isPending}
                data-testid="button-submit-debt"
              >
                إضافة
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {canViewTotals && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي الديون المتبقية</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-24" /> : (
                <div className="text-2xl font-bold" data-testid="stat-total-owed">
                  {formatAmount(Math.max(totalOwed, 0))} د.ج
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">ديون نشطة</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-24" /> : (
                <div className="text-2xl font-bold" data-testid="stat-active-debts">{activeDebts.length}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">ديون مسددة</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-24" /> : (
                <div className="text-2xl font-bold" data-testid="stat-paid-debts">{paidDebts.length}</div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full" />)}
        </div>
      ) : allDebts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Wallet className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">لا توجد ديون خارجية مسجلة</p>
            <p className="text-xs text-muted-foreground mt-1">اضغط على "إضافة دين" لتسجيل دين جديد</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {activeDebts.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">ديون نشطة ({activeDebts.length})</h2>
              {activeDebts.map(debt => <DebtCard key={debt.id} debt={debt} />)}
            </div>
          )}
          {paidDebts.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-muted-foreground">ديون مسددة ({paidDebts.length})</h2>
              {paidDebts.map(debt => <DebtCard key={debt.id} debt={debt} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
