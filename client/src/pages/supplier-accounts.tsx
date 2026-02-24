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
import { Wallet, CreditCard, Printer, Pencil, Trash2, ArrowRightLeft } from "lucide-react";
import { openPrintWindow } from "@/lib/printStyles";
import type { Supplier } from "@shared/schema";
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

function formatDateFr(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("fr-FR");
}

export default function SupplierAccounts() {
  const { toast } = useToast();
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payCurrency, setPayCurrency] = useState("CNY");
  const [payNote, setPayNote] = useState("");
  const [editPaymentDialogOpen, setEditPaymentDialogOpen] = useState(false);
  const [editPayment, setEditPayment] = useState<any>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editCurrency, setEditCurrency] = useState("CNY");
  const [editNote, setEditNote] = useState("");
  const [deletePaymentId, setDeletePaymentId] = useState<number | null>(null);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [convertPayment, setConvertPayment] = useState<any>(null);
  const [convertRate, setConvertRate] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

  const { data: suppliers } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const { data: accountData, isLoading: accountLoading } = useQuery<any>({
    queryKey: ["/api/suppliers", selectedSupplier, "account"],
    enabled: !!selectedSupplier,
  });

  const paymentMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/payments", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers", selectedSupplier, "account"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cashbox/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cashbox/summary"] });
      setPaymentDialogOpen(false);
      setPayAmount("");
      setPayNote("");
      toast({ title: "تم تسجيل الدفعة بنجاح" });
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  const updatePaymentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/payments/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers", selectedSupplier, "account"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cashbox/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cashbox/summary"] });
      setEditPaymentDialogOpen(false);
      setEditPayment(null);
      toast({ title: "تم تحديث الدفعة بنجاح" });
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  const deletePaymentMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/payments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers", selectedSupplier, "account"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cashbox/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cashbox/summary"] });
      setDeletePaymentId(null);
      toast({ title: "تم حذف الدفعة بنجاح" });
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  const convertPaymentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/payments/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers", selectedSupplier, "account"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cashbox/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cashbox/summary"] });
      setConvertDialogOpen(false);
      setConvertPayment(null);
      setConvertRate("");
      toast({ title: "تم تحويل العملة بنجاح" });
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  const handlePayment = () => {
    if (!payAmount || !selectedSupplier) return;
    paymentMutation.mutate({
      supplierId: parseInt(selectedSupplier),
      amount: parseFloat(payAmount),
      currency: payCurrency,
      note: payNote,
    });
  };

  const openEditPayment = (pay: any) => {
    setEditPayment(pay);
    setEditAmount(String(pay.amount));
    setEditCurrency(pay.currency);
    setEditNote(pay.note || "");
    setEditPaymentDialogOpen(true);
  };

  const handleUpdatePayment = () => {
    if (!editPayment) return;
    updatePaymentMutation.mutate({
      id: editPayment.id,
      data: {
        amount: parseFloat(editAmount),
        currency: editCurrency,
        note: editNote,
      },
    });
  };

  const openConvertPayment = (pay: any) => {
    setConvertPayment(pay);
    setConvertRate("");
    setConvertDialogOpen(true);
  };

  const handleConvert = () => {
    if (!convertPayment || !convertRate) return;
    const rate = parseFloat(convertRate);
    if (rate <= 0) return;
    const newAmount = convertPayment.amount * rate;
    const newCurrency = convertPayment.currency === "CNY" ? "USD" : "CNY";
    const notePrefix = `تحويل من ${convertPayment.currency === "CNY" ? "يوان" : "دولار"} بسعر ${rate}`;
    const existingNote = convertPayment.note ? ` | ${convertPayment.note}` : "";
    convertPaymentMutation.mutate({
      id: convertPayment.id,
      data: {
        amount: parseFloat(newAmount.toFixed(2)),
        currency: newCurrency,
        note: notePrefix + existingNote,
      },
    });
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;
    const supplierName = suppliers?.find(s => s.id === parseInt(selectedSupplier))?.name || "";
    openPrintWindow({
      title: "كشف حساب المورد",
      subtitle: supplierName,
      content: printContent.innerHTML,
    });
  };

  const remainingCNY = (accountData?.totalCNY || 0) - (accountData?.paidCNY || 0);
  const remainingUSD = (accountData?.totalUSD || 0) - (accountData?.paidUSD || 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-accounts-title">حسابات الموردين</h1>
          <p className="text-muted-foreground">عرض أرصدة ومدفوعات الموردين</p>
        </div>
        {selectedSupplier && accountData && (
          <Button variant="outline" onClick={handlePrint} data-testid="button-print-account">
            <Printer className="h-4 w-4" />
            طباعة كشف الحساب
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <Label>اختر المورد</Label>
        <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
          <SelectTrigger className="max-w-sm" data-testid="select-account-supplier">
            <SelectValue placeholder="اختر المورد لعرض حسابه" />
          </SelectTrigger>
          <SelectContent>
            {suppliers?.map((s) => (
              <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedSupplier && (
        <>
          {accountLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          ) : accountData ? (
            <div className="space-y-6" ref={printRef}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي المستحق (يوان)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <span className="text-2xl font-bold" data-testid="text-total-cny">{(accountData.totalCNY || 0).toFixed(2)}</span>
                    <span className="text-sm text-muted-foreground mr-1">CNY</span>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي المستحق (دولار)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <span className="text-2xl font-bold" data-testid="text-total-usd">{(accountData.totalUSD || 0).toFixed(2)}</span>
                    <span className="text-sm text-muted-foreground mr-1">USD</span>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي المدفوع</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      <div><span className="text-lg font-bold" data-testid="text-paid-cny">{(accountData.paidCNY || 0).toFixed(2)}</span> <span className="text-sm text-muted-foreground">CNY</span></div>
                      <div><span className="text-lg font-bold" data-testid="text-paid-usd">{(accountData.paidUSD || 0).toFixed(2)}</span> <span className="text-sm text-muted-foreground">USD</span></div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-destructive/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-destructive">المبلغ المتبقي</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {(remainingCNY > 0 || accountData.totalCNY > 0) && (
                        <div>
                          <span className="text-lg font-bold text-destructive" data-testid="text-remaining-cny">{remainingCNY.toFixed(2)}</span>
                          <span className="text-sm text-muted-foreground mr-1">CNY</span>
                        </div>
                      )}
                      {(remainingUSD > 0 || accountData.totalUSD > 0) && (
                        <div>
                          <span className="text-lg font-bold text-destructive" data-testid="text-remaining-usd">{remainingUSD.toFixed(2)}</span>
                          <span className="text-sm text-muted-foreground mr-1">USD</span>
                        </div>
                      )}
                      {remainingCNY <= 0 && remainingUSD <= 0 && (
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                          تم السداد بالكامل
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex items-center justify-between gap-4 flex-wrap">
                <h2 className="text-lg font-semibold">البضائع المستلمة</h2>
                <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-add-payment">
                      <CreditCard className="h-4 w-4" />
                      تسجيل دفعة
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>تسجيل دفعة للمورد</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label>المبلغ</Label>
                        <Input
                          data-testid="input-payment-amount"
                          type="number"
                          step="0.01"
                          value={payAmount}
                          onChange={(e) => setPayAmount(e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>العملة</Label>
                        <Select value={payCurrency} onValueChange={setPayCurrency}>
                          <SelectTrigger data-testid="select-payment-currency">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CNY">يوان صيني</SelectItem>
                            <SelectItem value="USD">دولار أمريكي</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>ملاحظة</Label>
                        <Input
                          data-testid="input-payment-note"
                          value={payNote}
                          onChange={(e) => setPayNote(e.target.value)}
                          placeholder="ملاحظة اختيارية"
                        />
                      </div>
                      <Button className="w-full" onClick={handlePayment} disabled={paymentMutation.isPending} data-testid="button-submit-payment">
                        {paymentMutation.isPending ? "جاري التسجيل..." : "تسجيل الدفعة"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {accountData.deliveryItems && accountData.deliveryItems.length > 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>المنتج</TableHead>
                          <TableHead>الكمية</TableHead>
                          <TableHead>السعر</TableHead>
                          <TableHead>العملة</TableHead>
                          <TableHead>المجموع</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {accountData.deliveryItems.map((item: any, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">
                              <div>
                                <span>{item.productName}</span>
                                {item.productNameZh && (
                                  <span className="block text-sm text-muted-foreground" dir="ltr">{item.productNameZh}</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>{item.price?.toFixed(2)}</TableCell>
                            <TableCell>{item.currency === "CNY" ? "يوان" : "دولار"}</TableCell>
                            <TableCell className="font-semibold">{(item.price * item.quantity).toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                    <Wallet className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">لا توجد بضائع مستلمة من هذا المورد</p>
                  </CardContent>
                </Card>
              )}

              {accountData.payments && accountData.payments.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">سجل المدفوعات</h2>
                  <Card>
                    <CardContent className="pt-6">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>التاريخ</TableHead>
                            <TableHead>المبلغ</TableHead>
                            <TableHead>العملة</TableHead>
                            <TableHead>ملاحظة</TableHead>
                            <TableHead>إجراءات</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {accountData.payments.map((pay: any) => (
                            <TableRow key={pay.id} data-testid={`row-payment-${pay.id}`}>
                              <TableCell className="text-sm">{formatDateFr(pay.createdAt)}</TableCell>
                              <TableCell className="font-semibold">{pay.amount?.toFixed(2)}</TableCell>
                              <TableCell>{pay.currency === "CNY" ? "يوان" : "دولار"}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">{pay.note || "-"}</TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => openEditPayment(pay)}
                                    data-testid={`button-edit-payment-${pay.id}`}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => openConvertPayment(pay)}
                                    data-testid={`button-convert-payment-${pay.id}`}
                                  >
                                    <ArrowRightLeft className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => setDeletePaymentId(pay.id)}
                                    data-testid={`button-delete-payment-${pay.id}`}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          ) : null}
        </>
      )}

      {!selectedSupplier && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Wallet className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">اختر موردًا لعرض حسابه</p>
          </CardContent>
        </Card>
      )}

      <Dialog open={editPaymentDialogOpen} onOpenChange={setEditPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل الدفعة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>المبلغ</Label>
              <Input
                data-testid="input-edit-payment-amount"
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
                <SelectTrigger data-testid="select-edit-payment-currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CNY">يوان صيني</SelectItem>
                  <SelectItem value="USD">دولار أمريكي</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>ملاحظة</Label>
              <Input
                data-testid="input-edit-payment-note"
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                placeholder="ملاحظة اختيارية"
              />
            </div>
            <Button className="w-full" onClick={handleUpdatePayment} disabled={updatePaymentMutation.isPending} data-testid="button-submit-edit-payment">
              {updatePaymentMutation.isPending ? "جاري التحديث..." : "حفظ التعديلات"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تحويل العملة</DialogTitle>
          </DialogHeader>
          {convertPayment && (
            <div className="space-y-4 pt-4">
              <div className="p-4 bg-muted rounded-md space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">المبلغ الحالي:</span>
                  <span className="font-bold">{convertPayment.amount?.toFixed(2)} {convertPayment.currency === "CNY" ? "يوان" : "دولار"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">التحويل إلى:</span>
                  <span className="font-semibold">{convertPayment.currency === "CNY" ? "دولار أمريكي (USD)" : "يوان صيني (CNY)"}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>سعر الصرف</Label>
                <Input
                  data-testid="input-convert-rate"
                  type="number"
                  step="0.001"
                  value={convertRate}
                  onChange={(e) => setConvertRate(e.target.value)}
                  placeholder={convertPayment.currency === "CNY" ? "مثلاً: 0.14 (1 يوان = 0.14 دولار)" : "مثلاً: 7.2 (1 دولار = 7.2 يوان)"}
                />
              </div>
              {convertRate && parseFloat(convertRate) > 0 && (
                <div className="p-3 bg-muted rounded-md">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">المبلغ بعد التحويل:</span>
                    <span className="text-lg font-bold">
                      {(convertPayment.amount * parseFloat(convertRate)).toFixed(2)} {convertPayment.currency === "CNY" ? "USD" : "CNY"}
                    </span>
                  </div>
                </div>
              )}
              <Button className="w-full" onClick={handleConvert} disabled={convertPaymentMutation.isPending || !convertRate} data-testid="button-submit-convert">
                {convertPaymentMutation.isPending ? "جاري التحويل..." : "تأكيد التحويل"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletePaymentId} onOpenChange={(open) => { if (!open) setDeletePaymentId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الدفعة</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذه الدفعة؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2">
            <AlertDialogCancel data-testid="button-cancel-delete-payment">إلغاء</AlertDialogCancel>
            <AlertDialogAction
              data-testid="button-confirm-delete-payment"
              onClick={() => deletePaymentId && deletePaymentMutation.mutate(deletePaymentId)}
              className="bg-destructive text-destructive-foreground"
            >
              {deletePaymentMutation.isPending ? "جاري الحذف..." : "حذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
