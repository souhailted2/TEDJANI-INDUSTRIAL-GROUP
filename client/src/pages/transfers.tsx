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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatAmount, formatDateSimple, buildWhatsAppLink } from "@/lib/format";
import {
  ArrowLeftRight,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  Send,
  ArrowRight,
  MessageCircle,
  Search,
  Trash2,
  RotateCcw,
  Filter,
} from "lucide-react";
import type { Company, Transfer } from "@shared/schema";

type SafeCompany = Omit<Company, "password">;

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

function openWhatsApp(phone: string, message: string) {
  const link = buildWhatsAppLink(phone, message);
  window.open(link, "_blank");
}

function buildTransferMsg(status: string, fromName: string, toName: string, amount: string, note?: string | null) {
  let msg = "";
  if (status === "approved") {
    msg = `تم الموافقة على تحويل مالي\nمن: ${fromName}\nإلى: ${toName}\nالمبلغ: ${formatAmount(amount)} د.ج`;
  } else if (status === "rejected") {
    msg = `تم رفض التحويل المالي\nمن: ${fromName}\nإلى: ${toName}\nالمبلغ: ${formatAmount(amount)} د.ج`;
  } else {
    msg = `طلب تحويل مالي جديد\nمن: ${fromName}\nإلى: ${toName}\nالمبلغ: ${formatAmount(amount)} د.ج`;
  }
  if (note) msg += `\nملاحظة: ${note}`;
  return msg;
}

function TransferCard({
  transfer,
  companies,
  onDeleteRequest,
}: {
  transfer: Transfer;
  companies: SafeCompany[];
  onDeleteRequest: (id: string) => void;
}) {
  const { toast } = useToast();
  const { isParent, company: authCompany, user, hasPermission } = useAuth();
  const isAppUser = user?.role === "app_user";
  const canViewTotals = user?.role !== "app_user" || hasPermission("view_totals");
  const from = companies.find(c => c.id === transfer.fromCompanyId);
  const to = companies.find(c => c.id === transfer.toCompanyId);
  const isReceiver = authCompany?.id === transfer.toCompanyId;
  const canApproveReject = isParent || isReceiver;

  const notifyOtherParty = (status: string) => {
    const msg = buildTransferMsg(status, from?.name || "", to?.name || "", transfer.amount, transfer.note);
    if (from?.phone) openWhatsApp(from.phone, msg);
  };

  const approveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", `/api/transfers/${transfer.id}/approve`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transfers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      toast({ title: "تمت الموافقة على التحويل بنجاح" });
      notifyOtherParty("approved");
    },
    onError: (err: Error) => {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", `/api/transfers/${transfer.id}/reject`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transfers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      toast({ title: "تم رفض التحويل" });
      notifyOtherParty("rejected");
    },
    onError: (err: Error) => {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    },
  });

  const whatsappMsg = buildTransferMsg(transfer.status, from?.name || "", to?.name || "", transfer.amount, transfer.note);
  const whatsappPhone = to?.phone || from?.phone;

  return (
    <Card data-testid={`card-transfer-${transfer.id}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 bg-muted/50 rounded-md px-3 py-2">
                <Send className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium truncate">{from?.name || "غير معروف"}</span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0 rtl:rotate-180" />
              <div className="flex items-center gap-2 bg-muted/50 rounded-md px-3 py-2">
                <ArrowLeftRight className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium truncate">{to?.name || "غير معروف"}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {getStatusBadge(transfer.status)}
              <span className="text-xs text-muted-foreground">{transfer.date || formatDateSimple(transfer.createdAt)}</span>
            </div>
            {transfer.note && (
              <p className="text-xs text-muted-foreground bg-muted/30 p-2 rounded-md">{transfer.note}</p>
            )}
          </div>
          <div className="text-left space-y-2">
            {canViewTotals && (
              <p className="text-lg font-bold whitespace-nowrap" dir="ltr">{formatAmount(transfer.amount)} د.ج</p>
            )}
            <div className="flex gap-2 flex-wrap justify-end">
              {transfer.status === "pending" && canApproveReject && !isAppUser && (
                <>
                  <Button
                    size="sm"
                    onClick={() => approveMutation.mutate()}
                    disabled={approveMutation.isPending || rejectMutation.isPending}
                    data-testid={`button-approve-${transfer.id}`}
                  >
                    <CheckCircle2 className="w-3 h-3 ml-1" />
                    موافقة
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => rejectMutation.mutate()}
                    disabled={approveMutation.isPending || rejectMutation.isPending}
                    data-testid={`button-reject-${transfer.id}`}
                  >
                    <XCircle className="w-3 h-3 ml-1" />
                    رفض
                  </Button>
                </>
              )}
              {whatsappPhone && (
                <a
                  href={buildWhatsAppLink(whatsappPhone, whatsappMsg)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button size="sm" variant="outline" data-testid={`button-whatsapp-transfer-${transfer.id}`}>
                    <MessageCircle className="w-3 h-3 ml-1" />
                    واتساب
                  </Button>
                </a>
              )}
              {isParent && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => onDeleteRequest(transfer.id)}
                  data-testid={`button-delete-transfer-${transfer.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const ALL_VALUE = "__all__";

export default function Transfers() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [fromCompanyId, setFromCompanyId] = useState("");
  const [toCompanyId, setToCompanyId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterA, setFilterA] = useState("");
  const [filterB, setFilterB] = useState("");
  const [searchDate, setSearchDate] = useState("");

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { isParent } = useAuth();
  const { company: authCompany } = useAuth();

  const { data: companies, isLoading: companiesLoading } = useQuery<SafeCompany[]>({
    queryKey: ["/api/companies"],
  });

  const transfersQueryKey = searchDate ? `/api/transfers?date=${searchDate}` : "/api/transfers";
  const { data: transfers, isLoading: transfersLoading } = useQuery<Transfer[]>({
    queryKey: [transfersQueryKey],
  });

  const allCompanies = companies || [];

  const createMutation = useMutation({
    mutationFn: async (data: { fromCompanyId: string; toCompanyId: string; amount: string; note?: string; date?: string }) => {
      const res = await apiRequest("POST", "/api/transfers", data);
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/transfers"] });
      const fromC = allCompanies.find(c => c.id === variables.fromCompanyId);
      const toC = allCompanies.find(c => c.id === variables.toCompanyId);
      const msg = buildTransferMsg("pending", fromC?.name || "", toC?.name || "", variables.amount, variables.note);
      if (toC?.phone) openWhatsApp(toC.phone, msg);
      setDialogOpen(false);
      setFromCompanyId("");
      setToCompanyId("");
      setAmount("");
      setNote("");
      setDate(new Date().toISOString().split("T")[0]);
      toast({ title: "تم إنشاء طلب التحويل بنجاح", description: "بانتظار موافقة الشركة المستقبلة" });
    },
    onError: (err: Error) => {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/transfers/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transfers"] });
      setDeleteId(null);
      toast({ title: "تم حذف التحويل بنجاح" });
    },
    onError: (err: Error) => {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    },
  });

  const effectiveFromId = isParent ? fromCompanyId : (authCompany?.id || "");

  const handleCreate = () => {
    if (!effectiveFromId || !toCompanyId || !amount) {
      toast({ title: "يرجى ملء جميع الحقول المطلوبة", variant: "destructive" });
      return;
    }
    if (effectiveFromId === toCompanyId) {
      toast({ title: "لا يمكن التحويل لنفس الشركة", variant: "destructive" });
      return;
    }
    createMutation.mutate({ fromCompanyId: effectiveFromId, toCompanyId, amount, note: note || undefined, date });
  };

  const hasFilters = searchQuery.trim() !== "" || filterA !== "" || filterB !== "" || searchDate !== "";

  const resetFilters = () => {
    setSearchQuery("");
    setFilterA("");
    setFilterB("");
    setSearchDate("");
  };

  const loading = companiesLoading || transfersLoading;

  const baseTransfers = [...(transfers || [])].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  function applyFilters(list: Transfer[]): Transfer[] {
    let result = list;

    if (filterA && filterB) {
      result = result.filter(t =>
        (t.fromCompanyId === filterA && t.toCompanyId === filterB) ||
        (t.fromCompanyId === filterB && t.toCompanyId === filterA)
      );
    } else if (filterA) {
      result = result.filter(t => t.fromCompanyId === filterA || t.toCompanyId === filterA);
    } else if (filterB) {
      result = result.filter(t => t.fromCompanyId === filterB || t.toCompanyId === filterB);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(t => {
        const from = allCompanies.find(c => c.id === t.fromCompanyId);
        const to = allCompanies.find(c => c.id === t.toCompanyId);
        return (
          (from?.name || "").toLowerCase().includes(q) ||
          (to?.name || "").toLowerCase().includes(q) ||
          (t.note || "").toLowerCase().includes(q) ||
          (t.date || "").includes(q) ||
          formatDateSimple(t.createdAt).includes(q)
        );
      });
    }

    return result;
  }

  const allTransfers = applyFilters(baseTransfers);
  const pendingTransfers = applyFilters(baseTransfers.filter(t => t.status === "pending"));
  const approvedTransfers = applyFilters(baseTransfers.filter(t => t.status === "approved"));
  const rejectedTransfers = applyFilters(baseTransfers.filter(t => t.status === "rejected"));

  const renderEmpty = (icon: React.ReactNode, text: string) => (
    <Card>
      <CardContent className="py-12 text-center">
        <div className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4">{icon}</div>
        <p className="text-muted-foreground text-sm">{text}</p>
        {hasFilters && (
          <Button variant="ghost" size="sm" className="mt-3" onClick={resetFilters}>
            <RotateCcw className="w-3 h-3 ml-1" />
            مسح الفلاتر
          </Button>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-transfers-title">التحويلات</h1>
          <p className="text-muted-foreground text-sm mt-1">إدارة التحويلات المالية بين الشركات</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-transfer">
              <Plus className="w-4 h-4 ml-2" />
              تحويل جديد
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إنشاء تحويل جديد</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>الشركة المرسلة</Label>
                {isParent ? (
                  <Select value={fromCompanyId} onValueChange={setFromCompanyId}>
                    <SelectTrigger data-testid="select-from-company">
                      <SelectValue placeholder="اختر الشركة المرسلة" />
                    </SelectTrigger>
                    <SelectContent>
                      {allCompanies.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}{c.isParent ? " (الأم)" : ""}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input value={authCompany?.name || ""} disabled data-testid="input-from-company-fixed" />
                )}
              </div>
              <div className="space-y-2">
                <Label>الشركة المستقبلة</Label>
                <Select value={toCompanyId} onValueChange={setToCompanyId}>
                  <SelectTrigger data-testid="select-to-company">
                    <SelectValue placeholder="اختر الشركة المستقبلة" />
                  </SelectTrigger>
                  <SelectContent>
                    {allCompanies.filter(c => c.id !== effectiveFromId).map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}{c.isParent ? " (الأم)" : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="transfer-amount">المبلغ (د.ج)</Label>
                <Input
                  id="transfer-amount"
                  data-testid="input-transfer-amount"
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  dir="ltr"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="transfer-note">ملاحظات (اختياري)</Label>
                <Textarea
                  id="transfer-note"
                  data-testid="input-transfer-note"
                  placeholder="أضف ملاحظة للتحويل..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="resize-none"
                />
              </div>
              <div className="space-y-2">
                <Label>التاريخ</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  data-testid="input-transfer-date"
                />
              </div>
              <Button
                className="w-full"
                onClick={handleCreate}
                disabled={createMutation.isPending}
                data-testid="button-submit-transfer"
              >
                {createMutation.isPending ? "جاري الإنشاء..." : "إرسال طلب التحويل"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search & Filter bar */}
      <Card className="border-dashed">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Filter className="w-4 h-4" />
            بحث وفلترة
          </div>
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                className="pr-9"
                placeholder="ابحث باسم الشركة، الملاحظة..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                data-testid="input-search-transfers"
              />
            </div>
            <Input
              type="date"
              className="w-auto min-w-[160px]"
              value={searchDate}
              onChange={e => setSearchDate(e.target.value)}
              data-testid="input-search-date"
            />
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-[160px]">
              <Select value={filterA || ALL_VALUE} onValueChange={v => setFilterA(v === ALL_VALUE ? "" : v)}>
                <SelectTrigger data-testid="select-filter-company-a">
                  <SelectValue placeholder="الشركة الأولى" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>— كل الشركات —</SelectItem>
                  {allCompanies.filter(c => c.id !== filterB).map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <ArrowLeftRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-[160px]">
              <Select value={filterB || ALL_VALUE} onValueChange={v => setFilterB(v === ALL_VALUE ? "" : v)}>
                <SelectTrigger data-testid="select-filter-company-b">
                  <SelectValue placeholder="الشركة الثانية" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>— كل الشركات —</SelectItem>
                  {allCompanies.filter(c => c.id !== filterA).map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {hasFilters && (
              <Button variant="outline" size="sm" onClick={resetFilters} data-testid="button-reset-filters">
                <RotateCcw className="w-3.5 h-3.5 ml-1" />
                إعادة تعيين
              </Button>
            )}
          </div>
          {hasFilters && (
            <p className="text-xs text-muted-foreground">
              يعرض <span className="font-semibold">{allTransfers.length}</span> نتيجة
            </p>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="all" dir="rtl">
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-all">
            الكل ({allTransfers.length})
          </TabsTrigger>
          <TabsTrigger value="pending" data-testid="tab-pending">
            معلقة ({pendingTransfers.length})
          </TabsTrigger>
          <TabsTrigger value="approved" data-testid="tab-approved">
            مكتملة ({approvedTransfers.length})
          </TabsTrigger>
          <TabsTrigger value="rejected" data-testid="tab-rejected">
            مرفوضة ({rejectedTransfers.length})
          </TabsTrigger>
        </TabsList>

        {loading ? (
          <div className="space-y-4 mt-4">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <CardContent className="p-5">
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            <TabsContent value="all" className="space-y-4 mt-4">
              {allTransfers.length === 0
                ? renderEmpty(<ArrowLeftRight className="w-full h-full" />, "لا توجد تحويلات")
                : allTransfers.map(t => (
                    <TransferCard key={t.id} transfer={t} companies={allCompanies} onDeleteRequest={setDeleteId} />
                  ))}
            </TabsContent>
            <TabsContent value="pending" className="space-y-4 mt-4">
              {pendingTransfers.length === 0
                ? renderEmpty(<Clock className="w-full h-full" />, "لا توجد تحويلات معلقة")
                : pendingTransfers.map(t => (
                    <TransferCard key={t.id} transfer={t} companies={allCompanies} onDeleteRequest={setDeleteId} />
                  ))}
            </TabsContent>
            <TabsContent value="approved" className="space-y-4 mt-4">
              {approvedTransfers.length === 0
                ? renderEmpty(<CheckCircle2 className="w-full h-full" />, "لا توجد تحويلات مكتملة")
                : approvedTransfers.map(t => (
                    <TransferCard key={t.id} transfer={t} companies={allCompanies} onDeleteRequest={setDeleteId} />
                  ))}
            </TabsContent>
            <TabsContent value="rejected" className="space-y-4 mt-4">
              {rejectedTransfers.length === 0
                ? renderEmpty(<XCircle className="w-full h-full" />, "لا توجد تحويلات مرفوضة")
                : rejectedTransfers.map(t => (
                    <TransferCard key={t.id} transfer={t} companies={allCompanies} onDeleteRequest={setDeleteId} />
                  ))}
            </TabsContent>
          </>
        )}
      </Tabs>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف التحويل</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا التحويل؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete-transfer"
            >
              {deleteMutation.isPending ? "جاري الحذف..." : "حذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
