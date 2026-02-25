import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatAmount, formatDateSimple } from "@/lib/format";
import { Plus, ReceiptText, Trash2, Wallet, Tag, X, Factory, Wrench, Package, Edit } from "lucide-react";
import type { Expense, ExpenseCategory, WorkshopExpense, SparePartPurchase, RawMaterialPurchase } from "@shared/schema";

export default function Expenses() {
  const { toast } = useToast();
  const { hasPermission, user } = useAuth();
  const canViewTotals = user?.role !== "app_user" || hasPermission("view_totals");
  const isAppUser = user?.role === "app_user";
  const [dialogOpen, setDialogOpen] = useState(false);
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);

  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editCategory, setEditCategory] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDate, setEditDate] = useState("");

  const { data: categories, isLoading: catsLoading } = useQuery<ExpenseCategory[]>({
    queryKey: ["/api/expense-categories"],
  });

  const { data: expenses, isLoading } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
  });

  const { data: workshopExpenses } = useQuery<WorkshopExpense[]>({
    queryKey: ["/api/workshop-expenses"],
  });
  const { data: sparePartPurchases } = useQuery<SparePartPurchase[]>({
    queryKey: ["/api/spare-parts-purchases"],
  });
  const { data: rawMaterialPurchases } = useQuery<RawMaterialPurchase[]>({
    queryKey: ["/api/raw-material-purchases"],
  });

  const createCatMutation = useMutation({
    mutationFn: async (data: { name: string }) => {
      const res = await apiRequest("POST", "/api/expense-categories", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expense-categories"] });
      setNewCatName("");
      setCatDialogOpen(false);
      toast({ title: "تم إضافة نوع المصروف بنجاح" });
    },
    onError: (err: Error) => {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    },
  });

  const deleteCatMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/expense-categories/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expense-categories"] });
      toast({ title: "تم حذف نوع المصروف" });
    },
    onError: (err: Error) => {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { category: string; amount: string; description?: string; date?: string }) => {
      const res = await apiRequest("POST", "/api/expenses", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setDialogOpen(false);
      setCategory("");
      setAmount("");
      setDescription("");
      setDate(new Date().toISOString().split("T")[0]);
      toast({ title: "تم إضافة المصروف بنجاح" });
    },
    onError: (err: Error) => {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PATCH", `/api/expenses/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setEditingExpense(null);
      toast({ title: "تم تعديل المصروف بنجاح" });
    },
    onError: (err: Error) => {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/expenses/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setDeleteDialogOpen(false);
      setDeletingExpense(null);
      toast({ title: "تم حذف المصروف بنجاح" });
    },
    onError: (err: Error) => {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    },
  });

  const handleCreate = () => {
    if (!category || !amount) {
      toast({ title: "يرجى ملء جميع الحقول المطلوبة", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      category,
      amount,
      description: description || undefined,
      date,
    });
  };

  const handleEdit = () => {
    if (!editingExpense || !editCategory || !editAmount) return;
    updateMutation.mutate({
      id: editingExpense.id,
      data: {
        category: editCategory,
        amount: editAmount,
        description: editDescription || undefined,
        date: editDate,
      },
    });
  };

  const openEditDialog = (expense: Expense) => {
    setEditingExpense(expense);
    setEditCategory(expense.category);
    setEditAmount(String(expense.amount));
    setEditDescription(expense.description || "");
    setEditDate(expense.date || "");
  };

  const sortedExpenses = [...(expenses || [])].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const getCategoryName = (catId: string) => {
    return (categories || []).find(c => c.id === catId)?.name || catId;
  };

  const totalByCategory = (categories || []).map(cat => ({
    ...cat,
    total: (expenses || [])
      .filter(e => e.category === cat.id)
      .reduce((sum, e) => sum + Number(e.amount), 0),
  }));

  const factoryWorkshopTotal = (workshopExpenses || []).reduce((sum, e) => sum + Number(e.amount), 0);
  const factorySparePartsTotal = (sparePartPurchases || []).reduce((sum, e) => sum + Number(e.cost), 0);
  const factoryRawMaterialsTotal = (rawMaterialPurchases || []).reduce((sum, e) => sum + Number(e.cost), 0);
  const grandTotal = (expenses || []).reduce((sum, e) => sum + Number(e.amount), 0)
    + factoryWorkshopTotal + factorySparePartsTotal + factoryRawMaterialsTotal;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-expenses-title">المصاريف</h1>
          <p className="text-muted-foreground text-sm mt-1">إدارة مصاريف الشركة الأم</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {!isAppUser && (
            <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" data-testid="button-manage-categories">
                  <Tag className="w-4 h-4 ml-2" />
                  أنواع المصاريف
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>إدارة أنواع المصاريف</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="flex items-center gap-2">
                    <Input
                      data-testid="input-new-category"
                      placeholder="اسم النوع الجديد..."
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newCatName.trim()) {
                          createCatMutation.mutate({ name: newCatName.trim() });
                        }
                      }}
                    />
                    <Button
                      size="icon"
                      onClick={() => {
                        if (newCatName.trim()) createCatMutation.mutate({ name: newCatName.trim() });
                      }}
                      disabled={!newCatName.trim() || createCatMutation.isPending}
                      data-testid="button-add-category"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {catsLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
                    </div>
                  ) : (categories || []).length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">لا توجد أنواع مصاريف</p>
                  ) : (
                    <div className="space-y-2">
                      {(categories || []).map(cat => (
                        <div key={cat.id} className="flex items-center justify-between gap-2 p-3 rounded-md bg-muted/50" data-testid={`category-row-${cat.id}`}>
                          <div className="flex items-center gap-2">
                            <ReceiptText className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{cat.name}</span>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteCatMutation.mutate(cat.id)}
                            disabled={deleteCatMutation.isPending}
                            data-testid={`button-delete-category-${cat.id}`}
                          >
                            <X className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          )}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-expense">
                <Plus className="w-4 h-4 ml-2" />
                إضافة مصروف
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إضافة مصروف جديد</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>نوع المصروف</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger data-testid="select-expense-category">
                      <SelectValue placeholder="اختر نوع المصروف" />
                    </SelectTrigger>
                    <SelectContent>
                      {(categories || []).map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expense-amount">المبلغ (د.ج)</Label>
                  <Input
                    id="expense-amount"
                    data-testid="input-expense-amount"
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    dir="ltr"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expense-description">الوصف (اختياري)</Label>
                  <Textarea
                    id="expense-description"
                    data-testid="input-expense-description"
                    placeholder="وصف المصروف..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label>التاريخ</Label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    data-testid="input-expense-date"
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={handleCreate}
                  disabled={createMutation.isPending}
                  data-testid="button-submit-expense"
                >
                  {createMutation.isPending ? "جاري الإضافة..." : "إضافة المصروف"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {canViewTotals && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {totalByCategory.map(cat => (
            <Card key={cat.id}>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10 text-primary">
                    <ReceiptText className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{cat.name}</p>
                    <p className="font-bold text-lg" dir="ltr" data-testid={`stat-${cat.id}`}>
                      {formatAmount(cat.total)} د.ج
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-md bg-orange-500/10 text-orange-600">
                  <Factory className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">مصاريف المصنع (ورشات)</p>
                  <p className="font-bold text-lg" dir="ltr" data-testid="stat-factory-workshop-expenses">
                    {formatAmount(factoryWorkshopTotal)} د.ج
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-md bg-orange-500/10 text-orange-600">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">مصاريف قطع الغيار</p>
                  <p className="font-bold text-lg" dir="ltr" data-testid="stat-factory-spare-parts-expenses">
                    {formatAmount(factorySparePartsTotal)} د.ج
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-md bg-orange-500/10 text-orange-600">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">مصاريف المواد الأولية</p>
                  <p className="font-bold text-lg" dir="ltr" data-testid="stat-factory-raw-materials-expenses">
                    {formatAmount(factoryRawMaterialsTotal)} د.ج
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-md bg-destructive/10 text-destructive">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">إجمالي المصاريف</p>
                  <p className="font-bold text-lg" dir="ltr" data-testid="stat-total-expenses">
                    {formatAmount(grandTotal)} د.ج
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-5">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : sortedExpenses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ReceiptText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground text-sm">لا توجد مصاريف مسجلة بعد</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sortedExpenses.map(expense => (
            <Card key={expense.id} data-testid={`card-expense-${expense.id}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-md bg-primary/10 text-primary">
                      <ReceiptText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-xs">{getCategoryName(expense.category)}</Badge>
                        <span className="text-xs text-muted-foreground">{expense.date || formatDateSimple(expense.createdAt)}</span>
                      </div>
                      {expense.description && (
                        <p className="text-xs text-muted-foreground mt-1">{expense.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {canViewTotals && (
                      <span className="font-bold text-sm whitespace-nowrap" dir="ltr">
                        {formatAmount(expense.amount)} د.ج
                      </span>
                    )}
                    {!isAppUser && (
                      <Button
                        size="icon"
                        variant="ghost"
                        data-testid={`button-edit-expense-${expense.id}`}
                        onClick={() => openEditDialog(expense)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                    {!isAppUser && (
                      <Button
                        size="icon"
                        variant="ghost"
                        data-testid={`button-delete-expense-${expense.id}`}
                        onClick={() => {
                          setDeletingExpense(expense);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isAppUser && (
      <>
      <Dialog open={!!editingExpense} onOpenChange={(open) => !open && setEditingExpense(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل المصروف</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>نوع المصروف</Label>
              <Select value={editCategory} onValueChange={setEditCategory}>
                <SelectTrigger data-testid="select-edit-expense-category">
                  <SelectValue placeholder="اختر نوع المصروف" />
                </SelectTrigger>
                <SelectContent>
                  {(categories || []).map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>المبلغ (د.ج)</Label>
              <Input
                data-testid="input-edit-expense-amount"
                type="number"
                placeholder="0.00"
                step="0.01"
                dir="ltr"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>الوصف (اختياري)</Label>
              <Textarea
                data-testid="input-edit-expense-description"
                placeholder="وصف المصروف..."
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label>التاريخ</Label>
              <Input
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                data-testid="input-edit-expense-date"
              />
            </div>
            <Button
              className="w-full"
              onClick={handleEdit}
              disabled={updateMutation.isPending || !editCategory || !editAmount}
              data-testid="button-submit-edit-expense"
            >
              {updateMutation.isPending ? "جاري التعديل..." : "حفظ التعديلات"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف المصروف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا المصروف؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2">
            <AlertDialogCancel data-testid="button-cancel-delete-expense">إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingExpense && deleteMutation.mutate(deletingExpense.id)}
              className="bg-destructive text-destructive-foreground"
              data-testid="button-confirm-delete-expense"
            >
              {deleteMutation.isPending ? "جاري الحذف..." : "حذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </>
      )}
    </div>
  );
}
