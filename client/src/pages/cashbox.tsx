import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Printer, Pencil, Trash2, ArrowRightLeft, Plus, TrendingUp, TrendingDown, Landmark, Link, Truck, Building2 } from "lucide-react";
import { openPrintWindow } from "@/lib/printStyles";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import type { Supplier, ShippingCompany } from "@shared/schema";

function formatDateFr(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("fr-FR");
}

export default function Cashbox() {
  const { toast } = useToast();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [txnType, setTxnType] = useState<"income" | "expense">("income");
  const [txnAmount, setTxnAmount] = useState("");
  const [txnCurrency, setTxnCurrency] = useState("CNY");
  const [txnDescription, setTxnDescription] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editTxn, setEditTxn] = useState<any>(null);
  const [editType, setEditType] = useState<"income" | "expense">("income");
  const [editAmount, setEditAmount] = useState("");
  const [editCurrency, setEditCurrency] = useState("CNY");
  const [editDescription, setEditDescription] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [exchangeDialogOpen, setExchangeDialogOpen] = useState(false);
  const [exchangeFromCurrency, setExchangeFromCurrency] = useState("CNY");
  const [exchangeFromAmount, setExchangeFromAmount] = useState("");
  const [exchangeRate, setExchangeRate] = useState("");
  const [exchangeDescription, setExchangeDescription] = useState("");
  const [supplierPayDialogOpen, setSupplierPayDialogOpen] = useState(false);
  const [spSupplierId, setSpSupplierId] = useState("");
  const [spAmount, setSpAmount] = useState("");
  const [spCurrency, setSpCurrency] = useState("CNY");
  const [spDescription, setSpDescription] = useState("");
  const [shippingPayDialogOpen, setShippingPayDialogOpen] = useState(false);
  const [shpCompanyId, setShpCompanyId] = useState("");
  const [shpAmount, setShpAmount] = useState("");
  const [shpCurrency, setShpCurrency] = useState("CNY");
  const [shpDescription, setShpDescription] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterCurrency, setFilterCurrency] = useState("all");
  const printRef = useRef<HTMLDivElement>(null);

  const { data: transactions, isLoading: txnsLoading } = useQuery<any[]>({
    queryKey: ["/api/cashbox/transactions"],
  });

  const { data: summary, isLoading: summaryLoading } = useQuery<any>({
    queryKey: ["/api/cashbox/summary"],
  });

  const { data: suppliers } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const { data: shippingCompanies } = useQuery<ShippingCompany[]>({
    queryKey: ["/api/shipping-companies"],
  });

  const invalidateCashbox = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/cashbox/transactions"] });
    queryClient.invalidateQueries({ queryKey: ["/api/cashbox/summary"] });
  };

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/cashbox/transactions", data);
      return res.json();
    },
    onSuccess: () => {
      invalidateCashbox();
      setAddDialogOpen(false);
      resetAddForm();
      toast({ title: "تم تسجيل العملية بنجاح" });
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/cashbox/transactions/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      invalidateCashbox();
      setEditDialogOpen(false);
      setEditTxn(null);
      toast({ title: "تم تحديث العملية بنجاح" });
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/cashbox/transactions/${id}`);
    },
    onSuccess: () => {
      invalidateCashbox();
      setDeleteId(null);
      toast({ title: "تم حذف العملية بنجاح" });
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  const exchangeMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/cashbox/exchange", data);
      return res.json();
    },
    onSuccess: () => {
      invalidateCashbox();
      setExchangeDialogOpen(false);
      setExchangeFromCurrency("CNY");
      setExchangeFromAmount("");
      setExchangeRate("");
      setExchangeDescription("");
      toast({ title: "تم تحويل العملة بنجاح" });
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  const supplierPayMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/cashbox/supplier-payment", data);
      return res.json();
    },
    onSuccess: () => {
      invalidateCashbox();
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      setSupplierPayDialogOpen(false);
      setSpSupplierId("");
      setSpAmount("");
      setSpCurrency("CNY");
      setSpDescription("");
      toast({ title: "تم تسجيل الدفعة للمورد بنجاح" });
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  const shippingPayMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/cashbox/shipping-payment", data);
      return res.json();
    },
    onSuccess: () => {
      invalidateCashbox();
      queryClient.invalidateQueries({ queryKey: ["/api/shipping-payments"] });
      setShippingPayDialogOpen(false);
      setShpCompanyId("");
      setShpAmount("");
      setShpCurrency("CNY");
      setShpDescription("");
      toast({ title: "تم تسجيل الدفعة لشركة الشحن بنجاح" });
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  const resetAddForm = () => {
    setTxnType("income");
    setTxnAmount("");
    setTxnCurrency("CNY");
    setTxnDescription("");
  };

  const handleCreate = () => {
    if (!txnAmount) return;
    createMutation.mutate({
      type: txnType,
      category: "other",
      amount: parseFloat(txnAmount),
      currency: txnCurrency,
      description: txnDescription || null,
    });
  };

  const openEdit = (txn: any) => {
    setEditTxn(txn);
    setEditType(txn.type);
    setEditAmount(String(txn.amount));
    setEditCurrency(txn.currency);
    setEditDescription(txn.description || "");
    setEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!editTxn) return;
    updateMutation.mutate({
      id: editTxn.id,
      data: {
        type: editType,
        amount: parseFloat(editAmount),
        currency: editCurrency,
        description: editDescription || null,
      },
    });
  };

  const toCurrency = exchangeFromCurrency === "CNY" ? "USD" : "CNY";
  const exchangeRateNum = parseFloat(exchangeRate) || 0;
  const exchangeFromAmountNum = parseFloat(exchangeFromAmount) || 0;
  const exchangeToAmount = exchangeRateNum > 0 ? (exchangeFromAmountNum * exchangeRateNum).toFixed(2) : "";

  const handleExchange = () => {
    if (!exchangeFromAmount || !exchangeRate || exchangeRateNum <= 0) return;
    exchangeMutation.mutate({
      fromCurrency: exchangeFromCurrency,
      fromAmount: parseFloat(exchangeFromAmount),
      toCurrency,
      toAmount: parseFloat(exchangeToAmount),
      exchangeRate: exchangeRateNum,
      description: exchangeDescription || null,
    });
  };

  const handleSupplierPay = () => {
    if (!spSupplierId || !spAmount) return;
    supplierPayMutation.mutate({
      supplierId: parseInt(spSupplierId),
      amount: parseFloat(spAmount),
      currency: spCurrency,
      description: spDescription || null,
    });
  };

  const handleShippingPay = () => {
    if (!shpCompanyId || !shpAmount) return;
    shippingPayMutation.mutate({
      shippingCompanyId: parseInt(shpCompanyId),
      amount: parseFloat(shpAmount),
      currency: shpCurrency,
      description: shpDescription || null,
    });
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;
    openPrintWindow({
      title: "صندوق الحسابات",
      subtitle: "إدارة دخول وخروج الأموال",
      content: printContent.innerHTML,
    });
  };

  const filteredTransactions = (transactions || []).filter((txn: any) => {
    if (filterType !== "all" && txn.type !== filterType) return false;
    if (filterCurrency !== "all" && txn.currency !== filterCurrency) return false;
    return true;
  });

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case "supplier": return "مورد";
      case "shipping": return "شركة شحن";
      case "expense": return "مصروف";
      case "other": return "مصاريف أخرى";
      default: return cat;
    }
  };

  const getTypeLabel = (type: string) => {
    return type === "income" ? "دخول" : "خروج";
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-cashbox-title">صندوق الحسابات</h1>
          <p className="text-muted-foreground">إدارة دخول وخروج الأموال</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={handlePrint} data-testid="button-print-cashbox">
            <Printer className="h-4 w-4" />
            طباعة
          </Button>
          <Dialog open={exchangeDialogOpen} onOpenChange={setExchangeDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-exchange-currency">
                <ArrowRightLeft className="h-4 w-4" />
                تحويل عملة
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>تحويل عملة</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="p-3 rounded-md bg-muted text-sm text-muted-foreground">
                  سيتم خصم المبلغ من رصيد العملة المحولة منها وإضافته لرصيد العملة المحولة إليها
                </div>
                <div className="space-y-2">
                  <Label>التحويل من</Label>
                  <Select value={exchangeFromCurrency} onValueChange={setExchangeFromCurrency}>
                    <SelectTrigger data-testid="select-exchange-from">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CNY">يوان صيني (CNY)</SelectItem>
                      <SelectItem value="USD">دولار أمريكي (USD)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>المبلغ</Label>
                  <Input
                    data-testid="input-exchange-amount"
                    type="number"
                    step="0.01"
                    value={exchangeFromAmount}
                    onChange={(e) => setExchangeFromAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>سعر الصرف</Label>
                  <Input
                    data-testid="input-exchange-rate"
                    type="number"
                    step="0.0001"
                    value={exchangeRate}
                    onChange={(e) => setExchangeRate(e.target.value)}
                    placeholder={exchangeFromCurrency === "CNY" ? "مثال: 0.14" : "مثال: 7.2"}
                  />
                </div>
                {exchangeToAmount && (
                  <div className="p-3 rounded-md bg-muted">
                    <p className="text-sm">
                      المبلغ بعد التحويل إلى {toCurrency === "CNY" ? "يوان" : "دولار"}:{" "}
                      <span className="font-bold">{exchangeToAmount}</span>
                    </p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>ملاحظات (اختياري)</Label>
                  <Input
                    data-testid="input-exchange-description"
                    value={exchangeDescription}
                    onChange={(e) => setExchangeDescription(e.target.value)}
                    placeholder="ملاحظات إضافية"
                  />
                </div>
                <Button className="w-full" onClick={handleExchange} disabled={exchangeMutation.isPending || !exchangeFromAmount || !exchangeRate} data-testid="button-submit-exchange">
                  {exchangeMutation.isPending ? "جاري التحويل..." : "تنفيذ التحويل"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={supplierPayDialogOpen} onOpenChange={setSupplierPayDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-pay-supplier">
                <Building2 className="h-4 w-4" />
                دفعة مورد
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>تسجيل دفعة لمورد</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="p-3 rounded-md bg-muted text-sm text-muted-foreground">
                  سيتم تسجيل الدفعة في حساب المورد وخصمها من صندوق الحسابات
                </div>
                <div className="space-y-2">
                  <Label>المورد</Label>
                  <Select value={spSupplierId} onValueChange={setSpSupplierId}>
                    <SelectTrigger data-testid="select-sp-supplier">
                      <SelectValue placeholder="اختر المورد" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers?.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>المبلغ</Label>
                  <Input
                    data-testid="input-sp-amount"
                    type="number"
                    step="0.01"
                    value={spAmount}
                    onChange={(e) => setSpAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>العملة</Label>
                  <Select value={spCurrency} onValueChange={setSpCurrency}>
                    <SelectTrigger data-testid="select-sp-currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CNY">يوان صيني (CNY)</SelectItem>
                      <SelectItem value="USD">دولار أمريكي (USD)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>ملاحظات (اختياري)</Label>
                  <Input
                    data-testid="input-sp-description"
                    value={spDescription}
                    onChange={(e) => setSpDescription(e.target.value)}
                    placeholder="ملاحظات إضافية"
                  />
                </div>
                <Button className="w-full" onClick={handleSupplierPay} disabled={supplierPayMutation.isPending || !spSupplierId || !spAmount} data-testid="button-submit-sp">
                  {supplierPayMutation.isPending ? "جاري التسجيل..." : "تسجيل الدفعة"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={shippingPayDialogOpen} onOpenChange={setShippingPayDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-pay-shipping">
                <Truck className="h-4 w-4" />
                دفعة شحن
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>تسجيل دفعة لشركة شحن</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="p-3 rounded-md bg-muted text-sm text-muted-foreground">
                  سيتم تسجيل الدفعة في حساب شركة الشحن وخصمها من صندوق الحسابات
                </div>
                <div className="space-y-2">
                  <Label>شركة الشحن</Label>
                  <Select value={shpCompanyId} onValueChange={setShpCompanyId}>
                    <SelectTrigger data-testid="select-shp-company">
                      <SelectValue placeholder="اختر شركة الشحن" />
                    </SelectTrigger>
                    <SelectContent>
                      {shippingCompanies?.map((sc) => (
                        <SelectItem key={sc.id} value={String(sc.id)}>{sc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>المبلغ</Label>
                  <Input
                    data-testid="input-shp-amount"
                    type="number"
                    step="0.01"
                    value={shpAmount}
                    onChange={(e) => setShpAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>العملة</Label>
                  <Select value={shpCurrency} onValueChange={setShpCurrency}>
                    <SelectTrigger data-testid="select-shp-currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CNY">يوان صيني (CNY)</SelectItem>
                      <SelectItem value="USD">دولار أمريكي (USD)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>ملاحظات (اختياري)</Label>
                  <Input
                    data-testid="input-shp-description"
                    value={shpDescription}
                    onChange={(e) => setShpDescription(e.target.value)}
                    placeholder="ملاحظات إضافية"
                  />
                </div>
                <Button className="w-full" onClick={handleShippingPay} disabled={shippingPayMutation.isPending || !shpCompanyId || !shpAmount} data-testid="button-submit-shp">
                  {shippingPayMutation.isPending ? "جاري التسجيل..." : "تسجيل الدفعة"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-transaction">
                <Plus className="h-4 w-4" />
                تسجيل عملية
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>تسجيل عملية جديدة</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>نوع العملية</Label>
                  <Select value={txnType} onValueChange={(v) => setTxnType(v as "income" | "expense")}>
                    <SelectTrigger data-testid="select-txn-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">دخول أموال</SelectItem>
                      <SelectItem value="expense">خروج أموال</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>المبلغ</Label>
                  <Input
                    data-testid="input-txn-amount"
                    type="number"
                    step="0.01"
                    value={txnAmount}
                    onChange={(e) => setTxnAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>العملة</Label>
                  <Select value={txnCurrency} onValueChange={setTxnCurrency}>
                    <SelectTrigger data-testid="select-txn-currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CNY">يوان صيني (CNY)</SelectItem>
                      <SelectItem value="USD">دولار أمريكي (USD)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>الوصف</Label>
                  <Input
                    data-testid="input-txn-description"
                    value={txnDescription}
                    onChange={(e) => setTxnDescription(e.target.value)}
                    placeholder="وصف اختياري"
                  />
                </div>
                <Button className="w-full" onClick={handleCreate} disabled={createMutation.isPending} data-testid="button-submit-transaction">
                  {createMutation.isPending ? "جاري التسجيل..." : "تسجيل العملية"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {summaryLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : summary ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4" ref={printRef}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                دخول (يوان)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-xl font-bold text-emerald-600" data-testid="text-income-cny">{(summary.incomeCNY || 0).toFixed(2)}</span>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                دخول (دولار)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-xl font-bold text-emerald-600" data-testid="text-income-usd">{(summary.incomeUSD || 0).toFixed(2)}</span>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <TrendingDown className="h-4 w-4 text-destructive" />
                خروج (يوان)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-xl font-bold text-destructive" data-testid="text-expense-cny">{(summary.expenseCNY || 0).toFixed(2)}</span>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <TrendingDown className="h-4 w-4 text-destructive" />
                خروج (دولار)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-xl font-bold text-destructive" data-testid="text-expense-usd">{(summary.expenseUSD || 0).toFixed(2)}</span>
            </CardContent>
          </Card>
          <Card className="border-primary/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-1">
                <Landmark className="h-4 w-4" />
                الرصيد (يوان)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className={`text-xl font-bold ${(summary.balanceCNY || 0) >= 0 ? "text-emerald-600" : "text-destructive"}`} data-testid="text-balance-cny">
                {(summary.balanceCNY || 0).toFixed(2)}
              </span>
            </CardContent>
          </Card>
          <Card className="border-primary/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-1">
                <Landmark className="h-4 w-4" />
                الرصيد (دولار)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className={`text-xl font-bold ${(summary.balanceUSD || 0) >= 0 ? "text-emerald-600" : "text-destructive"}`} data-testid="text-balance-usd">
                {(summary.balanceUSD || 0).toFixed(2)}
              </span>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <div className="flex items-center gap-4 flex-wrap">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">نوع العملية</Label>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-36" data-testid="select-filter-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="income">دخول</SelectItem>
              <SelectItem value="expense">خروج</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">العملة</Label>
          <Select value={filterCurrency} onValueChange={setFilterCurrency}>
            <SelectTrigger className="w-36" data-testid="select-filter-currency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="CNY">يوان</SelectItem>
              <SelectItem value="USD">دولار</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {txnsLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : filteredTransactions.length > 0 ? (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>التصنيف</TableHead>
                  <TableHead>الجهة</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>العملة</TableHead>
                  <TableHead>الوصف</TableHead>
                  <TableHead>إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((txn: any) => (
                  <TableRow key={txn.id} data-testid={`row-txn-${txn.id}`}>
                    <TableCell className="text-sm">{formatDateFr(txn.createdAt)}</TableCell>
                    <TableCell>
                      <Badge variant={txn.type === "income" ? "default" : "destructive"}>
                        {getTypeLabel(txn.type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{getCategoryLabel(txn.category)}</TableCell>
                    <TableCell className="text-sm font-medium">{txn.entityName || "-"}</TableCell>
                    <TableCell className={`font-semibold ${txn.type === "income" ? "text-emerald-600" : "text-destructive"}`}>
                      {txn.type === "income" ? "+" : "-"}{txn.amount?.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-sm">{txn.currency === "CNY" ? "يوان" : "دولار"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-48 truncate">{txn.description || "-"}</TableCell>
                    <TableCell>
                      {txn.paymentId || txn.shippingPaymentId || txn.expenseId ? (
                        <Badge variant="outline" className="text-xs">
                          <Link className="h-3 w-3 ml-1" />
                          {txn.paymentId ? "دفعة مورد" : txn.shippingPaymentId ? "دفعة شحن" : "مصروف"}
                        </Badge>
                      ) : (
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => openEdit(txn)} data-testid={`button-edit-txn-${txn.id}`}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => setDeleteId(txn.id)} data-testid={`button-delete-txn-${txn.id}`}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Landmark className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">لا توجد عمليات مسجلة</p>
          </CardContent>
        </Card>
      )}

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تعديل العملية</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>نوع العملية</Label>
              <Select value={editType} onValueChange={(v) => setEditType(v as "income" | "expense")}>
                <SelectTrigger data-testid="select-edit-txn-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">دخول أموال</SelectItem>
                  <SelectItem value="expense">خروج أموال</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>المبلغ</Label>
              <Input
                data-testid="input-edit-txn-amount"
                type="number"
                step="0.01"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>العملة</Label>
              <Select value={editCurrency} onValueChange={setEditCurrency}>
                <SelectTrigger data-testid="select-edit-txn-currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CNY">يوان صيني (CNY)</SelectItem>
                  <SelectItem value="USD">دولار أمريكي (USD)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>الوصف</Label>
              <Input
                data-testid="input-edit-txn-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="وصف اختياري"
              />
            </div>
            <Button className="w-full" onClick={handleUpdate} disabled={updateMutation.isPending} data-testid="button-submit-edit-transaction">
              {updateMutation.isPending ? "جاري التحديث..." : "تحديث العملية"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>هل أنت متأكد من حذف هذه العملية؟ لا يمكن التراجع عن هذا الإجراء.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)} data-testid="button-confirm-delete">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
