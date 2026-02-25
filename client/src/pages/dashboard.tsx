import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Building2, ArrowLeftRight, Clock, CheckCircle2, XCircle, TrendingUp, MessageCircle, Phone, Settings, UserPlus, Trash2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { formatAmount, formatDateSimple, buildWhatsAppLink } from "@/lib/format";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import type { Company, Transfer, Operator } from "@shared/schema";

type SafeCompany = Omit<Company, "password">;

function StatCard({ title, value, icon: Icon, description, loading }: {
  title: string;
  value: string | number;
  icon: any;
  description?: string;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <>
            <div className="text-2xl font-bold" data-testid={`stat-${title}`}>{value}</div>
            {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function getStatusBadge(status: string) {
  switch (status) {
    case "pending":
      return <Badge variant="outline"><Clock className="w-3 h-3 ml-1" />بانتظار الموافقة</Badge>;
    case "approved":
      return <Badge variant="secondary"><CheckCircle2 className="w-3 h-3 ml-1" />تمت الموافقة</Badge>;
    case "rejected":
      return <Badge variant="destructive"><XCircle className="w-3 h-3 ml-1" />مرفوض</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function ParentPhoneEditor({ parentCompany }: { parentCompany: SafeCompany }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState(parentCompany.phone || "");

  const updateMutation = useMutation({
    mutationFn: async (newPhone: string) => {
      const res = await apiRequest("PATCH", `/api/companies/${parentCompany.id}`, { phone: newPhone });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: "تم تحديث رقم الواتساب بنجاح" });
      setOpen(false);
    },
    onError: (err: Error) => {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    },
  });

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-md bg-green-500/10 text-green-600">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium">رقم واتساب الشركة الأم</p>
              <p className="text-sm text-muted-foreground" data-testid="text-parent-phone" dir="ltr">
                {parentCompany.phone || "غير محدد"}
              </p>
            </div>
          </div>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v) setPhone(parentCompany.phone || ""); }}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" data-testid="button-edit-parent-phone">
                <Settings className="w-3 h-3 ml-1" />
                تعديل
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>تعديل رقم واتساب الشركة الأم</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>رقم الهاتف (بالصيغة الدولية)</Label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="مثال: 00213555053058"
                    dir="ltr"
                    data-testid="input-parent-phone"
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={() => updateMutation.mutate(phone)}
                  disabled={updateMutation.isPending}
                  data-testid="button-save-parent-phone"
                >
                  حفظ
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}

type SafeOperator = Omit<Operator, "password">;

function OperatorManagement() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const { data: operators, isLoading } = useQuery<SafeOperator[]>({
    queryKey: ["/api/operators"],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/operators", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/operators"] });
      setOpen(false);
      setName("");
      setUsername("");
      setPassword("");
      toast({ title: "تم إنشاء المشغّل بنجاح" });
    },
    onError: () => toast({ title: "حدث خطأ - قد يكون اسم المستخدم مستخدم", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/operators/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/operators"] });
      toast({ title: "تم حذف المشغّل" });
    },
    onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <User className="w-4 h-4" />
          المشغّلون
        </CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" data-testid="button-add-operator">
              <UserPlus className="w-4 h-4 ml-1" />
              إضافة مشغّل
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة مشغّل جديد</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>الاسم</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="اسم المشغّل" data-testid="input-operator-name" />
              </div>
              <div className="space-y-2">
                <Label>اسم المستخدم</Label>
                <Input value={username} onChange={e => setUsername(e.target.value)} placeholder="اسم المستخدم" dir="ltr" data-testid="input-operator-username" />
              </div>
              <div className="space-y-2">
                <Label>كلمة المرور</Label>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="كلمة المرور" dir="ltr" data-testid="input-operator-password" />
              </div>
              <Button
                className="w-full"
                onClick={() => createMutation.mutate({ name, username, password })}
                disabled={!name || !username || !password || createMutation.isPending}
                data-testid="button-submit-operator"
              >
                إنشاء المشغّل
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map(i => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : !operators || operators.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">لا يوجد مشغّلون - المشغّل يمكنه فقط تسجيل الرحلات وعرض العدادات</p>
        ) : (
          <div className="space-y-2">
            {operators.map(op => (
              <div key={op.id} className="flex items-center justify-between gap-3 p-3 rounded-md bg-muted/50" data-testid={`operator-row-${op.id}`}>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-sm">{op.name}</span>
                  <span className="text-xs text-muted-foreground" dir="ltr">({op.username})</span>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    if (confirm("هل أنت متأكد من حذف هذا المشغّل؟")) {
                      deleteMutation.mutate(op.id);
                    }
                  }}
                  data-testid={`button-delete-operator-${op.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { isParent, hasPermission, user } = useAuth();
  const canViewTotals = user?.role !== "app_user" || hasPermission("view_totals");

  const { data: companies, isLoading: companiesLoading } = useQuery<SafeCompany[]>({
    queryKey: ["/api/companies"],
  });

  const { data: transfers, isLoading: transfersLoading } = useQuery<Transfer[]>({
    queryKey: ["/api/transfers"],
  });

  const parentCompany = companies?.find(c => c.isParent);
  const childCompanies = companies?.filter(c => !c.isParent) || [];
  const pendingTransfers = transfers?.filter(t => t.status === "pending") || [];
  const approvedTransfers = transfers?.filter(t => t.status === "approved") || [];
  const totalTransferred = approvedTransfers.reduce((acc, t) => acc + Number(t.amount), 0);

  const recentTransfers = [...(transfers || [])].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 5);

  const loading = companiesLoading || transfersLoading;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-dashboard-title">لوحة التحكم</h1>
        <p className="text-muted-foreground text-sm mt-1">نظرة عامة على التحويلات المالية بين الشركات</p>
      </div>

      {canViewTotals && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="الشركات"
            value={childCompanies.length}
            icon={Building2}
            description="عدد الشركات المسجلة"
            loading={loading}
          />
          <StatCard
            title="التحويلات المعلقة"
            value={pendingTransfers.length}
            icon={Clock}
            description="بانتظار الموافقة"
            loading={loading}
          />
          <StatCard
            title="التحويلات المكتملة"
            value={approvedTransfers.length}
            icon={CheckCircle2}
            description="تمت الموافقة عليها"
            loading={loading}
          />
          <StatCard
            title="إجمالي المحول"
            value={loading ? "..." : `${formatAmount(totalTransferred)} د.ج`}
            icon={TrendingUp}
            description="إجمالي المبالغ المحولة"
            loading={loading}
          />
        </div>
      )}

      {isParent && parentCompany && (
        <ParentPhoneEditor parentCompany={parentCompany} />
      )}

      {isParent && parentCompany && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">مديونيات الشركات مع الشركة الأم</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
            ) : childCompanies.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">لا توجد شركات مسجلة بعد</p>
            ) : (
              <div className="space-y-3">
                {childCompanies.map(company => {
                  const debt = Number(company.debtToParent);
                  const companyTransfers = (transfers || []).filter(
                    t => t.status === "approved" && (t.fromCompanyId === company.id || t.toCompanyId === company.id)
                  );
                  const whatsappMsg = debt > 0
                    ? `مرحبا ${company.name}، لديكم مبلغ مستحق للشركة الأم بقيمة ${formatAmount(debt)} د.ج`
                    : debt < 0
                    ? `مرحبا ${company.name}، الشركة الأم مدينة لكم بمبلغ ${formatAmount(Math.abs(debt))} د.ج`
                    : `مرحبا ${company.name}، لا توجد مديونيات حالياً`;

                  return (
                    <div key={company.id} className="flex items-center justify-between gap-3 p-4 rounded-md bg-muted/50 flex-wrap" data-testid={`debt-row-${company.id}`}>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-9 h-9 rounded-md bg-primary/10 text-primary">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-medium text-sm">{company.name}</span>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {companyTransfers.length} تحويل مكتمل
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-left">
                          {debt < 0 ? (
                            <div>
                              <p className="text-xs text-muted-foreground">الأم مدينة لها بـ</p>
                              <p className="font-bold text-sm text-primary" data-testid={`debt-amount-${company.id}`}>{formatAmount(Math.abs(debt))} د.ج</p>
                            </div>
                          ) : debt > 0 ? (
                            <div>
                              <p className="text-xs text-muted-foreground">مدينة للأم بـ</p>
                              <p className="font-bold text-sm text-destructive" data-testid={`debt-amount-${company.id}`}>{formatAmount(debt)} د.ج</p>
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground" data-testid={`debt-amount-${company.id}`}>لا مديونيات</p>
                          )}
                        </div>
                        {company.phone && (
                          <a
                            href={buildWhatsAppLink(company.phone, whatsappMsg)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button size="icon" variant="ghost" data-testid={`button-whatsapp-${company.id}`}>
                              <MessageCircle className="w-4 h-4" />
                            </Button>
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {isParent && <OperatorManagement />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isParent && canViewTotals && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">أرصدة الشركات</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : childCompanies.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">لا توجد شركات مسجلة بعد</p>
              ) : (
                <div className="space-y-3">
                  {childCompanies.map(company => (
                    <div key={company.id} className="flex items-center justify-between gap-3 p-3 rounded-md bg-muted/50" data-testid={`company-balance-${company.id}`}>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10 text-primary">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-sm">{company.name}</span>
                      </div>
                      <span className="font-bold text-sm">
                        {formatAmount(company.balance)} د.ج
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2 text-base flex-wrap">
              <span>آخر التحويلات</span>
              <Badge variant="secondary" className="text-xs">{transfers?.length || 0} تحويل</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
            ) : recentTransfers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">لا توجد تحويلات بعد</p>
            ) : (
              <div className="space-y-3">
                {recentTransfers.map(transfer => {
                  const from = companies?.find(c => c.id === transfer.fromCompanyId);
                  const to = companies?.find(c => c.id === transfer.toCompanyId);
                  return (
                    <div key={transfer.id} className="flex items-center justify-between gap-3 p-3 rounded-md bg-muted/50" data-testid={`transfer-recent-${transfer.id}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-sm flex-wrap">
                          <span className="font-medium truncate">{from?.name || "غير معروف"}</span>
                          <ArrowLeftRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                          <span className="font-medium truncate">{to?.name || "غير معروف"}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {getStatusBadge(transfer.status)}
                          <span className="text-xs text-muted-foreground">{formatDateSimple(transfer.createdAt)}</span>
                        </div>
                      </div>
                      <span className="font-bold text-sm mr-3 whitespace-nowrap">{formatAmount(transfer.amount)} د.ج</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
