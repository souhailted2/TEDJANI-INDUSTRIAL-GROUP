import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatAmount, buildWhatsAppLink } from "@/lib/format";
import {
  Building2,
  Plus,
  Crown,
  Phone,
  User,
  Pencil,
  Trash2,
  ArrowLeftRight,
  MessageCircle,
  Scale,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronLeft,
} from "lucide-react";
import type { Company, Transfer } from "@shared/schema";

type SafeCompany = Omit<Company, "password">;

const CURRENCIES = [
  { value: "DZD", label: "دينار جزائري (د.ج)" },
  { value: "USD", label: "دولار أمريكي ($)" },
  { value: "CNY", label: "يوان صيني (¥)" },
];

function getCurrencySymbol(currency: string) {
  switch (currency) {
    case "USD": return "$";
    case "CNY": return "¥";
    default: return "د.ج";
  }
}

function computeCompanyNetBalance(
  companyId: string,
  transfers: Transfer[]
): Record<string, number> {
  const bal: Record<string, number> = {};
  for (const t of transfers) {
    const c = t.currency || "DZD";
    if (bal[c] === undefined) bal[c] = 0;
    if (t.toCompanyId === companyId) bal[c] += Number(t.amount);
    if (t.fromCompanyId === companyId) bal[c] -= Number(t.amount);
  }
  return bal;
}

function BalanceSummary({ balances }: { balances: Record<string, number> }) {
  const entries = Object.entries(balances).filter(([, v]) => Math.abs(v) > 0.001);
  if (entries.length === 0) {
    return (
      <div className="flex items-center gap-2 p-2.5 rounded-md bg-muted/40">
        <Minus className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">لا توجد معاملات مسجلة</span>
      </div>
    );
  }
  return (
    <div className="space-y-1.5">
      {entries.map(([currency, net]) => {
        const sym = getCurrencySymbol(currency);
        const isPositive = net > 0;
        return (
          <div
            key={currency}
            className={`flex items-center gap-2 p-2.5 rounded-md ${isPositive ? "bg-emerald-50 dark:bg-emerald-950/30" : "bg-red-50 dark:bg-red-950/30"}`}
          >
            {isPositive
              ? <TrendingUp className="w-4 h-4 text-emerald-600" />
              : <TrendingDown className="w-4 h-4 text-red-500" />}
            <span className="text-xs text-muted-foreground">الرصيد:</span>
            <span
              className={`font-bold text-sm mr-auto ${isPositive ? "text-emerald-600" : "text-red-500"}`}
              dir="ltr"
            >
              {isPositive ? "+" : ""}{formatAmount(net)} {sym}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function Companies() {
  const { toast } = useToast();
  const { isParent, company: authCompany, hasPermission, user } = useAuth();
  const canViewTotals = user?.role !== "app_user" || hasPermission("view_totals");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyUsername, setNewCompanyUsername] = useState("");
  const [newCompanyPassword, setNewCompanyPassword] = useState("");
  const [newCompanyBalance, setNewCompanyBalance] = useState("");
  const [newCompanyPhone, setNewCompanyPhone] = useState("");

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<SafeCompany | null>(null);
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editPhone, setEditPhone] = useState("");

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingCompany, setDeletingCompany] = useState<SafeCompany | null>(null);

  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [transferTarget, setTransferTarget] = useState<SafeCompany | null>(null);
  const [transferDirection, setTransferDirection] = useState<"to" | "from">("to");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferNote, setTransferNote] = useState("");
  const [transferCurrency, setTransferCurrency] = useState("DZD");
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split("T")[0]);
  const [transferOtherCompanyId, setTransferOtherCompanyId] = useState("");

  const { data: companies, isLoading } = useQuery<SafeCompany[]>({
    queryKey: ["/api/companies"],
  });

  const { data: icTransfers } = useQuery<Transfer[]>({
    queryKey: ["/api/transfers"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; username: string; password: string; balance: string; phone?: string }) => {
      const res = await apiRequest("POST", "/api/companies", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      setDialogOpen(false);
      setNewCompanyName("");
      setNewCompanyUsername("");
      setNewCompanyPassword("");
      setNewCompanyBalance("");
      setNewCompanyPhone("");
      toast({ title: "تم إنشاء الشركة بنجاح" });
    },
    onError: (err: Error) => {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PATCH", `/api/companies/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      setEditDialogOpen(false);
      setEditingCompany(null);
      toast({ title: "تم تعديل الشركة بنجاح" });
    },
    onError: (err: Error) => {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/companies/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transfers"] });
      setDeleteDialogOpen(false);
      setDeletingCompany(null);
      toast({ title: "تم حذف الشركة بنجاح" });
    },
    onError: (err: Error) => {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    },
  });

  const transferMutation = useMutation({
    mutationFn: async (data: {
      fromCompanyId: string;
      toCompanyId: string;
      amount: string;
      currency: string;
      note?: string;
      date?: string;
    }) => {
      const res = await apiRequest("POST", "/api/transfers/direct", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transfers"] });
      setTransferDialogOpen(false);
      setTransferTarget(null);
      setTransferAmount("");
      setTransferNote("");
      setTransferCurrency("DZD");
      setTransferOtherCompanyId("");
      setTransferDate(new Date().toISOString().split("T")[0]);
      toast({ title: "تم تسجيل التحويل بنجاح" });
    },
    onError: (err: Error) => {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    },
  });

  const parentCompany = companies?.find(c => c.isParent);
  const childCompanies = companies?.filter(c => !c.isParent) || [];
  const allTransfers = icTransfers || [];

  const handleCreate = () => {
    if (!newCompanyName.trim() || !newCompanyUsername.trim() || !newCompanyPassword.trim()) {
      toast({ title: "يرجى ملء جميع الحقول المطلوبة", variant: "destructive" });
      return;
    }
    if (newCompanyUsername.trim().length < 3) {
      toast({ title: "اسم المستخدم يجب أن يكون 3 أحرف على الأقل", variant: "destructive" });
      return;
    }
    if (newCompanyPassword.length < 4) {
      toast({ title: "كلمة المرور يجب أن تكون 4 أحرف على الأقل", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      name: newCompanyName.trim(),
      username: newCompanyUsername.trim(),
      password: newCompanyPassword,
      balance: newCompanyBalance || "0",
      phone: newCompanyPhone || undefined,
    });
  };

  const openEditDialog = (company: SafeCompany) => {
    setEditingCompany(company);
    setEditName(company.name);
    setEditUsername(company.username);
    setEditPassword("");
    setEditPhone(company.phone || "");
    setEditDialogOpen(true);
  };

  const handleEdit = () => {
    if (!editingCompany) return;
    const data: any = {};
    if (editName.trim() && editName.trim() !== editingCompany.name) data.name = editName.trim();
    if (editUsername.trim() && editUsername.trim() !== editingCompany.username) data.username = editUsername.trim();
    if (editPassword.trim()) data.password = editPassword.trim();
    if (editPhone !== (editingCompany.phone || "")) data.phone = editPhone;
    if (Object.keys(data).length === 0) { setEditDialogOpen(false); return; }
    updateMutation.mutate({ id: editingCompany.id, data });
  };

  const openDeleteDialog = (company: SafeCompany) => {
    setDeletingCompany(company);
    setDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (!deletingCompany) return;
    deleteMutation.mutate(deletingCompany.id);
  };

  const openTransferDialog = (company: SafeCompany, direction: "to" | "from") => {
    setTransferTarget(company);
    setTransferDirection(direction);
    setTransferAmount("");
    setTransferNote("");
    setTransferCurrency("DZD");
    setTransferOtherCompanyId("");
    setTransferDate(new Date().toISOString().split("T")[0]);
    setTransferDialogOpen(true);
  };

  const handleTransfer = () => {
    if (!transferTarget || !transferAmount || !transferOtherCompanyId) {
      toast({ title: "يرجى ملء جميع الحقول المطلوبة", variant: "destructive" });
      return;
    }
    const fromId = transferDirection === "to" ? transferOtherCompanyId : transferTarget.id;
    const toId = transferDirection === "to" ? transferTarget.id : transferOtherCompanyId;
    transferMutation.mutate({
      fromCompanyId: fromId,
      toCompanyId: toId,
      amount: transferAmount,
      currency: transferCurrency,
      note: transferNote || undefined,
      date: transferDate,
    });
  };

  const otherCompaniesForDialog = (companies || []).filter(c => c.id !== transferTarget?.id);

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-companies-title">الشركات</h1>
          <p className="text-muted-foreground text-sm mt-1">إدارة الشركات وأرصدتها المالية</p>
        </div>
        {isParent && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-company">
                <Plus className="w-4 h-4 ml-2" />
                إضافة شركة
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إضافة شركة جديدة</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="company-name">اسم الشركة</Label>
                  <Input id="company-name" data-testid="input-company-name" placeholder="أدخل اسم الشركة" value={newCompanyName} onChange={e => setNewCompanyName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-username">اسم المستخدم</Label>
                  <Input id="company-username" data-testid="input-company-username" placeholder="اسم المستخدم للدخول" dir="ltr" value={newCompanyUsername} onChange={e => setNewCompanyUsername(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-password">كلمة المرور</Label>
                  <Input id="company-password" data-testid="input-company-password" type="password" placeholder="كلمة المرور للدخول" dir="ltr" value={newCompanyPassword} onChange={e => setNewCompanyPassword(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-phone">رقم واتساب</Label>
                  <Input id="company-phone" data-testid="input-company-phone" type="tel" placeholder="213555000000" dir="ltr" value={newCompanyPhone} onChange={e => setNewCompanyPhone(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-balance">الرصيد الابتدائي (اختياري)</Label>
                  <Input id="company-balance" data-testid="input-company-balance" type="number" placeholder="0.00" dir="ltr" value={newCompanyBalance} onChange={e => setNewCompanyBalance(e.target.value)} />
                </div>
                <Button className="w-full" onClick={handleCreate} disabled={createMutation.isPending} data-testid="button-submit-company">
                  {createMutation.isPending ? "جاري الإنشاء..." : "إنشاء الشركة"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {parentCompany && (
        <Card className="border-primary/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary text-primary-foreground">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold" data-testid="text-parent-name">{parentCompany.name}</h3>
                    <Badge variant="secondary" className="text-xs">الشركة الأم</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">الوسيط بين جميع الشركات</p>
                </div>
              </div>
              {canViewTotals && isParent && (
                <div className="text-sm">
                  {(() => {
                    const bal = computeCompanyNetBalance(parentCompany.id, allTransfers);
                    const entries = Object.entries(bal).filter(([, v]) => Math.abs(v) > 0.001);
                    if (entries.length === 0) return <span className="text-muted-foreground text-xs">لا توجد معاملات</span>;
                    return entries.map(([c, v]) => (
                      <span key={c} className={`font-bold ${v > 0 ? "text-emerald-600" : "text-red-500"}`} dir="ltr">
                        {v > 0 ? "+" : ""}{formatAmount(v)} {getCurrencySymbol(c)}
                      </span>
                    ));
                  })()}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i}><CardContent className="p-5"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : childCompanies.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground text-sm">لا توجد شركات مسجلة بعد</p>
            {isParent && <p className="text-muted-foreground text-xs mt-1">اضغط على "إضافة شركة" لإنشاء شركة جديدة</p>}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {childCompanies.map(company => {
            const balances = canViewTotals && (isParent || company.id === authCompany?.id)
              ? computeCompanyNetBalance(company.id, allTransfers)
              : {};
            return (
              <Card key={company.id} data-testid={`card-company-${company.id}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10 text-primary">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm">{company.name}</h3>
                        {company.phone && (
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1" dir="ltr">
                            <Phone className="w-3 h-3" />{company.phone}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1" dir="ltr">
                          <User className="w-3 h-3" />{company.username}
                        </p>
                      </div>
                    </div>
                    {isParent && (
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" data-testid={`button-edit-company-${company.id}`} onClick={() => openEditDialog(company)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" data-testid={`button-delete-company-${company.id}`} onClick={() => openDeleteDialog(company)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {canViewTotals && (isParent || company.id === authCompany?.id) && (
                    <div className="mt-4">
                      <BalanceSummary balances={balances} />
                    </div>
                  )}

                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    {isParent && (
                      <>
                        <Button size="sm" variant="outline" data-testid={`button-transfer-to-${company.id}`} onClick={() => openTransferDialog(company, "to")}>
                          <ArrowLeftRight className="w-3 h-3 ml-1" />
                          تحويل إليها
                        </Button>
                        <Button size="sm" variant="outline" data-testid={`button-transfer-from-${company.id}`} onClick={() => openTransferDialog(company, "from")}>
                          <ArrowLeftRight className="w-3 h-3 ml-1" />
                          تحويل منها
                        </Button>
                      </>
                    )}
                    <Link href={`/companies/${company.id}/relations`}>
                      <Button size="sm" variant="ghost" data-testid={`button-relations-${company.id}`}>
                        <Scale className="w-3 h-3 ml-1" />
                        العلاقات
                      </Button>
                    </Link>
                    {company.phone && (
                      <a href={buildWhatsAppLink(company.phone, `مرحباً ${company.name}،`)} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline" data-testid={`button-whatsapp-${company.id}`}>
                          <MessageCircle className="w-3 h-3 ml-1" />
                          واتساب
                        </Button>
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>تعديل الشركة</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">اسم الشركة</Label>
              <Input id="edit-name" data-testid="input-edit-name" value={editName} onChange={e => setEditName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-username">اسم المستخدم</Label>
              <Input id="edit-username" data-testid="input-edit-username" dir="ltr" value={editUsername} onChange={e => setEditUsername(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password">كلمة المرور الجديدة (اتركها فارغة للإبقاء على الحالية)</Label>
              <Input id="edit-password" data-testid="input-edit-password" type="password" dir="ltr" placeholder="كلمة مرور جديدة" value={editPassword} onChange={e => setEditPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">رقم واتساب</Label>
              <Input id="edit-phone" data-testid="input-edit-phone" type="tel" dir="ltr" placeholder="213555000000" value={editPhone} onChange={e => setEditPhone(e.target.value)} />
            </div>
            <Button className="w-full" onClick={handleEdit} disabled={updateMutation.isPending} data-testid="button-submit-edit">
              {updateMutation.isPending ? "جاري التحديث..." : "حفظ التعديلات"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الشركة</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف شركة "{deletingCompany?.name}"؟ سيتم حذف جميع التحويلات المرتبطة بها. لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2">
            <AlertDialogCancel data-testid="button-cancel-delete">إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground" data-testid="button-confirm-delete">
              {deleteMutation.isPending ? "جاري الحذف..." : "حذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Transfer Dialog */}
      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {transferDirection === "to"
                ? `تسجيل تحويل إلى: ${transferTarget?.name}`
                : `تسجيل تحويل من: ${transferTarget?.name}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="p-3 rounded-md bg-muted/50 text-center">
              {transferDirection === "to" ? (
                <p className="text-sm">
                  <span className="font-semibold text-muted-foreground">من شركة أخرى</span>
                  <span className="mx-2 text-muted-foreground">←</span>
                  <span className="font-bold">{transferTarget?.name}</span>
                </p>
              ) : (
                <p className="text-sm">
                  <span className="font-bold">{transferTarget?.name}</span>
                  <span className="mx-2 text-muted-foreground">←</span>
                  <span className="font-semibold text-muted-foreground">إلى شركة أخرى</span>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>{transferDirection === "to" ? "الشركة المُرسِلة (من)" : "الشركة المُستقبِلة (إلى)"}</Label>
              <Select value={transferOtherCompanyId} onValueChange={setTransferOtherCompanyId}>
                <SelectTrigger data-testid="select-transfer-other">
                  <SelectValue placeholder={transferDirection === "to" ? "اختر الشركة المُرسِلة" : "اختر الشركة المُستقبِلة"} />
                </SelectTrigger>
                <SelectContent>
                  {otherCompaniesForDialog.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}{c.isParent ? " (الأم)" : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="quick-transfer-amount">المبلغ</Label>
                <Input
                  id="quick-transfer-amount"
                  data-testid="input-quick-transfer-amount"
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  dir="ltr"
                  value={transferAmount}
                  onChange={e => setTransferAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>العملة</Label>
                <Select value={transferCurrency} onValueChange={setTransferCurrency}>
                  <SelectTrigger data-testid="select-transfer-currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>التاريخ</Label>
              <Input type="date" value={transferDate} onChange={e => setTransferDate(e.target.value)} data-testid="input-transfer-date" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quick-transfer-note">ملاحظات (اختياري)</Label>
              <Textarea
                id="quick-transfer-note"
                data-testid="input-quick-transfer-note"
                placeholder="أضف ملاحظة للتحويل..."
                value={transferNote}
                onChange={e => setTransferNote(e.target.value)}
                className="resize-none"
                rows={2}
              />
            </div>

            <Button
              className="w-full"
              onClick={handleTransfer}
              disabled={transferMutation.isPending}
              data-testid="button-submit-quick-transfer"
            >
              {transferMutation.isPending ? "جاري الحفظ..." : "تسجيل التحويل"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
