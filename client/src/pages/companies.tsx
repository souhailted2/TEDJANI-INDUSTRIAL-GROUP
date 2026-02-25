import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { Building2, Plus, Crown, Wallet, Phone, User, Pencil, Trash2, ArrowLeftRight, MessageCircle } from "lucide-react";
import type { Company } from "@shared/schema";

type SafeCompany = Omit<Company, "password">;

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

  const { data: companies, isLoading } = useQuery<SafeCompany[]>({
    queryKey: ["/api/companies"],
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
    mutationFn: async (data: { fromCompanyId: string; toCompanyId: string; amount: string; note?: string }) => {
      const res = await apiRequest("POST", "/api/transfers", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transfers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      setTransferDialogOpen(false);
      setTransferTarget(null);
      setTransferAmount("");
      setTransferNote("");
      toast({ title: "تم إنشاء طلب التحويل بنجاح" });
    },
    onError: (err: Error) => {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    },
  });

  const parentCompany = companies?.find(c => c.isParent);
  const childCompanies = companies?.filter(c => !c.isParent) || [];

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

    if (Object.keys(data).length === 0) {
      setEditDialogOpen(false);
      return;
    }
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
    setTransferDialogOpen(true);
  };

  const handleTransfer = () => {
    if (!transferTarget || !parentCompany || !transferAmount) {
      toast({ title: "يرجى إدخال المبلغ", variant: "destructive" });
      return;
    }
    const fromId = transferDirection === "to" ? parentCompany.id : transferTarget.id;
    const toId = transferDirection === "to" ? transferTarget.id : parentCompany.id;
    transferMutation.mutate({
      fromCompanyId: fromId,
      toCompanyId: toId,
      amount: transferAmount,
      note: transferNote || undefined,
    });
  };

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
                  <Input
                    id="company-name"
                    data-testid="input-company-name"
                    placeholder="أدخل اسم الشركة"
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-username">اسم المستخدم</Label>
                  <Input
                    id="company-username"
                    data-testid="input-company-username"
                    placeholder="اسم المستخدم للدخول"
                    dir="ltr"
                    value={newCompanyUsername}
                    onChange={(e) => setNewCompanyUsername(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-password">كلمة المرور</Label>
                  <Input
                    id="company-password"
                    data-testid="input-company-password"
                    type="password"
                    placeholder="كلمة المرور للدخول"
                    dir="ltr"
                    value={newCompanyPassword}
                    onChange={(e) => setNewCompanyPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-phone">رقم واتساب</Label>
                  <Input
                    id="company-phone"
                    data-testid="input-company-phone"
                    type="tel"
                    placeholder="213555000000"
                    dir="ltr"
                    value={newCompanyPhone}
                    onChange={(e) => setNewCompanyPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-balance">الرصيد الابتدائي (اختياري)</Label>
                  <Input
                    id="company-balance"
                    data-testid="input-company-balance"
                    type="number"
                    placeholder="0.00"
                    dir="ltr"
                    value={newCompanyBalance}
                    onChange={(e) => setNewCompanyBalance(e.target.value)}
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={handleCreate}
                  disabled={createMutation.isPending}
                  data-testid="button-submit-company"
                >
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
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-5">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : childCompanies.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground text-sm">لا توجد شركات مسجلة بعد</p>
            {isParent && (
              <p className="text-muted-foreground text-xs mt-1">اضغط على "إضافة شركة" لإنشاء شركة جديدة</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {childCompanies.map(company => {
            const debt = Number(company.debtToParent);
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
                            <Phone className="w-3 h-3" />
                            {company.phone}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1" dir="ltr">
                          <User className="w-3 h-3" />
                          {company.username}
                        </p>
                      </div>
                    </div>
                    {isParent && (
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          data-testid={`button-edit-company-${company.id}`}
                          onClick={() => openEditDialog(company)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          data-testid={`button-delete-company-${company.id}`}
                          onClick={() => openDeleteDialog(company)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </div>
                  {canViewTotals && (isParent || company.id === authCompany?.id) && company.balance !== undefined && (
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-2 p-3 rounded-md bg-muted/50">
                        <Wallet className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">الرصيد:</span>
                        <span className="font-bold text-sm mr-auto" dir="ltr">
                          {formatAmount(company.balance)} د.ج
                        </span>
                      </div>
                      <div className="flex items-center gap-2 p-3 rounded-md bg-muted/50">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {debt > 0 ? "مدينة للأم:" : debt < 0 ? "الأم مدينة لها:" : "المديونية:"}
                        </span>
                        <span className={`font-bold text-sm mr-auto ${debt > 0 ? "text-destructive" : debt < 0 ? "text-primary" : ""}`} dir="ltr">
                          {debt === 0 ? "0.00" : formatAmount(Math.abs(debt))} د.ج
                        </span>
                      </div>
                    </div>
                  )}
                  {isParent && (
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        data-testid={`button-transfer-to-${company.id}`}
                        onClick={() => openTransferDialog(company, "to")}
                      >
                        <ArrowLeftRight className="w-3 h-3 ml-1" />
                        تحويل إليها
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        data-testid={`button-transfer-from-${company.id}`}
                        onClick={() => openTransferDialog(company, "from")}
                      >
                        <ArrowLeftRight className="w-3 h-3 ml-1" />
                        تحويل منها
                      </Button>
                      {company.phone && (
                        <a
                          href={buildWhatsAppLink(company.phone, `مرحباً ${company.name}،`)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button
                            size="sm"
                            variant="outline"
                            data-testid={`button-whatsapp-${company.id}`}
                          >
                            <MessageCircle className="w-3 h-3 ml-1" />
                            واتساب
                          </Button>
                        </a>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل الشركة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">اسم الشركة</Label>
              <Input
                id="edit-name"
                data-testid="input-edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-username">اسم المستخدم</Label>
              <Input
                id="edit-username"
                data-testid="input-edit-username"
                dir="ltr"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password">كلمة المرور الجديدة (اتركها فارغة للإبقاء على الحالية)</Label>
              <Input
                id="edit-password"
                data-testid="input-edit-password"
                type="password"
                dir="ltr"
                placeholder="كلمة مرور جديدة"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">رقم واتساب</Label>
              <Input
                id="edit-phone"
                data-testid="input-edit-phone"
                type="tel"
                dir="ltr"
                placeholder="213555000000"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              onClick={handleEdit}
              disabled={updateMutation.isPending}
              data-testid="button-submit-edit"
            >
              {updateMutation.isPending ? "جاري التحديث..." : "حفظ التعديلات"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "جاري الحذف..." : "حذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {transferDirection === "to"
                ? `تحويل أموال إلى ${transferTarget?.name}`
                : `تحويل أموال من ${transferTarget?.name}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50">
              <div className="flex-1 text-center">
                <p className="text-xs text-muted-foreground">من</p>
                <p className="font-bold text-sm" data-testid="text-transfer-from">
                  {transferDirection === "to" ? parentCompany?.name : transferTarget?.name}
                </p>
              </div>
              <ArrowLeftRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 text-center">
                <p className="text-xs text-muted-foreground">إلى</p>
                <p className="font-bold text-sm" data-testid="text-transfer-to">
                  {transferDirection === "to" ? transferTarget?.name : parentCompany?.name}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quick-transfer-amount">المبلغ (د.ج)</Label>
              <Input
                id="quick-transfer-amount"
                data-testid="input-quick-transfer-amount"
                type="number"
                placeholder="0.00"
                step="0.01"
                dir="ltr"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quick-transfer-note">ملاحظات (اختياري)</Label>
              <Textarea
                id="quick-transfer-note"
                data-testid="input-quick-transfer-note"
                placeholder="أضف ملاحظة للتحويل..."
                value={transferNote}
                onChange={(e) => setTransferNote(e.target.value)}
                className="resize-none"
              />
            </div>
            <Button
              className="w-full"
              onClick={handleTransfer}
              disabled={transferMutation.isPending}
              data-testid="button-submit-quick-transfer"
            >
              {transferMutation.isPending ? "جاري التحويل..." : "إرسال طلب التحويل"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
