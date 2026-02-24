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
import { Printer, Pencil, Trash2, Plus, Receipt, TrendingDown } from "lucide-react";
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
import type { Expense } from "@shared/schema";

function formatDateFr(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("fr-FR");
}

export default function Expenses() {
  const { toast } = useToast();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("CNY");
  const [description, setDescription] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editExpense, setEditExpense] = useState<any>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editCurrency, setEditCurrency] = useState("CNY");
  const [editDescription, setEditDescription] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [filterCurrency, setFilterCurrency] = useState("all");
  const printRef = useRef<HTMLDivElement>(null);

  const { data: expenses, isLoading } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/expenses", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cashbox/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cashbox/summary"] });
      setAddDialogOpen(false);
      resetAddForm();
      toast({ title: "تم تسجيل المصروف بنجاح" });
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/expenses/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cashbox/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cashbox/summary"] });
      setEditDialogOpen(false);
      setEditExpense(null);
      toast({ title: "تم تحديث المصروف بنجاح" });
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/expenses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cashbox/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cashbox/summary"] });
      setDeleteId(null);
      toast({ title: "تم حذف المصروف بنجاح" });
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  const resetAddForm = () => {
    setTitle("");
    setAmount("");
    setCurrency("CNY");
    setDescription("");
  };

  const handleCreate = () => {
    if (!title || !amount) return;
    createMutation.mutate({
      title,
      amount: parseFloat(amount),
      currency,
      description: description || null,
    });
  };

  const openEdit = (exp: any) => {
    setEditExpense(exp);
    setEditTitle(exp.title);
    setEditAmount(String(exp.amount));
    setEditCurrency(exp.currency);
    setEditDescription(exp.description || "");
    setEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!editExpense) return;
    updateMutation.mutate({
      id: editExpense.id,
      data: {
        title: editTitle,
        amount: parseFloat(editAmount),
        currency: editCurrency,
        description: editDescription || null,
      },
    });
  };

  const filteredExpenses = (expenses || []).filter((exp: any) => {
    if (filterCurrency !== "all" && exp.currency !== filterCurrency) return false;
    return true;
  });

  const totalCNY = (expenses || [])
    .filter((e: any) => e.currency === "CNY")
    .reduce((sum: number, e: any) => sum + (e.amount || 0), 0);

  const totalUSD = (expenses || [])
    .filter((e: any) => e.currency === "USD")
    .reduce((sum: number, e: any) => sum + (e.amount || 0), 0);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;
    const summaryHtml = `
      <div class="summary-grid">
        <div class="summary-card danger">
          <div class="summary-label">إجمالي المصاريف (يوان)</div>
          <div class="summary-value danger">${totalCNY.toFixed(2)}<span class="currency-label">CNY</span></div>
        </div>
        <div class="summary-card danger">
          <div class="summary-label">إجمالي المصاريف (دولار)</div>
          <div class="summary-value danger">${totalUSD.toFixed(2)}<span class="currency-label">USD</span></div>
        </div>
      </div>
    `;
    openPrintWindow({
      title: "صندوق المصاريف",
      content: summaryHtml + printContent.innerHTML,
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-expenses-title">صندوق المصاريف</h1>
          <p className="text-muted-foreground">تسجيل وإدارة المصاريف</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={handlePrint} data-testid="button-print-expenses">
            <Printer className="h-4 w-4" />
            طباعة
          </Button>
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-expense">
                <Plus className="h-4 w-4" />
                تسجيل مصروف
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>تسجيل مصروف جديد</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>عنوان المصروف</Label>
                  <Input
                    data-testid="input-expense-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="مثال: إيجار مكتب، رواتب، نقل..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>المبلغ</Label>
                  <Input
                    data-testid="input-expense-amount"
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>العملة</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger data-testid="select-expense-currency">
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
                    data-testid="input-expense-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="وصف اختياري"
                  />
                </div>
                <Button className="w-full" onClick={handleCreate} disabled={createMutation.isPending} data-testid="button-submit-expense">
                  {createMutation.isPending ? "جاري التسجيل..." : "تسجيل المصروف"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <TrendingDown className="h-4 w-4 text-destructive" />
                إجمالي المصاريف (يوان)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-xl font-bold text-destructive" data-testid="text-total-expenses-cny">{totalCNY.toFixed(2)}</span>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <TrendingDown className="h-4 w-4 text-destructive" />
                إجمالي المصاريف (دولار)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-xl font-bold text-destructive" data-testid="text-total-expenses-usd">{totalUSD.toFixed(2)}</span>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex items-center gap-4 flex-wrap">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">العملة</Label>
          <Select value={filterCurrency} onValueChange={setFilterCurrency}>
            <SelectTrigger className="w-36" data-testid="select-filter-expense-currency">
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

      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : filteredExpenses.length > 0 ? (
        <Card>
          <CardContent className="pt-6" ref={printRef}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>العنوان</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>العملة</TableHead>
                  <TableHead>الوصف</TableHead>
                  <TableHead>إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.map((exp: any) => (
                  <TableRow key={exp.id} data-testid={`row-expense-${exp.id}`}>
                    <TableCell className="text-sm">{formatDateFr(exp.createdAt)}</TableCell>
                    <TableCell className="text-sm font-medium">{exp.title}</TableCell>
                    <TableCell className="font-semibold text-destructive">
                      -{exp.amount?.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-sm">{exp.currency === "CNY" ? "يوان" : "دولار"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-48 truncate">{exp.description || "-"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(exp)} data-testid={`button-edit-expense-${exp.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setDeleteId(exp.id)} data-testid={`button-delete-expense-${exp.id}`}>
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
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Receipt className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">لا توجد مصاريف مسجلة</p>
          </CardContent>
        </Card>
      )}

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تعديل المصروف</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>عنوان المصروف</Label>
              <Input
                data-testid="input-edit-expense-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="عنوان المصروف"
              />
            </div>
            <div className="space-y-2">
              <Label>المبلغ</Label>
              <Input
                data-testid="input-edit-expense-amount"
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
                <SelectTrigger data-testid="select-edit-expense-currency">
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
                data-testid="input-edit-expense-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="وصف اختياري"
              />
            </div>
            <Button className="w-full" onClick={handleUpdate} disabled={updateMutation.isPending} data-testid="button-submit-edit-expense">
              {updateMutation.isPending ? "جاري التحديث..." : "تحديث المصروف"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>هل أنت متأكد من حذف هذا المصروف؟ سيتم أيضاً حذف القيد المرتبط في صندوق الحسابات.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)} data-testid="button-confirm-delete-expense">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
