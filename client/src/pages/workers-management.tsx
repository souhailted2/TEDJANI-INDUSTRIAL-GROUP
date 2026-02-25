import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatAmount, formatDateSimple } from "@/lib/format";
import {
  HardHat, Plus, Trash2, Building2, Wrench, Calendar,
  DollarSign, Upload, Clock, AlertTriangle, ChevronDown, ChevronUp, X,
} from "lucide-react";
import type { Worker, WorkerCompany, WorkerTransaction, Workshop } from "@shared/schema";

function getContractStatus(contractEndDate: string | null) {
  if (!contractEndDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(contractEndDate);
  end.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "expired";
  if (diffDays <= 30) return "warning";
  return "ok";
}

function ContractBadge({ contractEndDate }: { contractEndDate: string | null }) {
  const status = getContractStatus(contractEndDate);
  if (!status) return null;
  if (status === "expired") {
    return <Badge variant="destructive" className="no-default-active-elevate" data-testid="badge-contract-expired">منتهي</Badge>;
  }
  if (status === "warning") {
    return <Badge className="no-default-active-elevate bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30" data-testid="badge-contract-warning">قريب الانتهاء</Badge>;
  }
  return <Badge className="no-default-active-elevate bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30" data-testid="badge-contract-ok">ساري</Badge>;
}

function WorkerCard({
  worker,
  companies,
  workshopsList,
  isAppUser,
  canViewTotals,
}: {
  worker: Worker;
  companies: WorkerCompany[];
  workshopsList: Workshop[];
  isAppUser: boolean;
  canViewTotals: boolean;
}) {
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [txDialogOpen, setTxDialogOpen] = useState(false);
  const [txType, setTxType] = useState<"salary" | "advance" | "deduction" | "debt">("salary");
  const [txAmount, setTxAmount] = useState("");
  const [txDate, setTxDate] = useState(new Date().toISOString().split("T")[0]);
  const [txNote, setTxNote] = useState("");

  const { data: transactions, isLoading: txLoading } = useQuery<WorkerTransaction[]>({
    queryKey: ["/api/managed-workers", worker.id, "transactions"],
    enabled: expanded,
  });

  const addTxMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", `/api/managed-workers/${worker.id}/transactions`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/managed-workers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/managed-workers", worker.id, "transactions"] });
      setTxDialogOpen(false);
      setTxAmount("");
      setTxNote("");
      setTxDate(new Date().toISOString().split("T")[0]);
      toast({ title: "تم تسجيل العملية بنجاح" });
    },
    onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
  });

  const deleteTxMutation = useMutation({
    mutationFn: (txId: string) => apiRequest("DELETE", `/api/managed-workers/${worker.id}/transactions/${txId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/managed-workers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/managed-workers", worker.id, "transactions"] });
      toast({ title: "تم حذف العملية" });
    },
    onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
  });

  const deleteWorkerMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/managed-workers/${worker.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/managed-workers"] });
      toast({ title: "تم حذف العامل" });
    },
    onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
  });

  const companyName = companies.find(c => c.id === worker.workerCompanyId)?.name || "-";
  const workshopName = workshopsList.find(w => w.id === worker.workshopId)?.name || "-";

  const sortedTxs = [...(transactions || [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const txTypeLabels: Record<string, string> = {
    salary: "أجرة",
    advance: "سلفة",
    deduction: "خصم",
    debt: "استخلاص دين",
  };

  function calculateDebtRecovery(balance: string | number): string {
    const b = Math.abs(Number(balance));
    if (b > 200000) return "20000";
    if (b >= 100000) return "10000";
    return "5000";
  }

  const openTxDialog = (type: "salary" | "advance" | "deduction" | "debt") => {
    setTxType(type);
    if (type === "debt") {
      setTxAmount(calculateDebtRecovery(worker.balance));
      setTxNote("استخلاص دين");
    } else {
      setTxAmount("");
      setTxNote("");
    }
    setTxDate(new Date().toISOString().split("T")[0]);
    setTxDialogOpen(true);
  };

  return (
    <Card data-testid={`card-worker-${worker.id}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => setExpanded(!expanded)}>
          <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10 text-primary">
            <HardHat className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-base" data-testid={`text-worker-name-${worker.id}`}>{worker.name}</CardTitle>
              {worker.workerNumber && (
                <Badge variant="secondary" className="no-default-active-elevate text-xs" data-testid={`text-worker-number-${worker.id}`}>
                  #{worker.workerNumber}
                </Badge>
              )}
              {worker.workPeriod && (
                <Badge variant="outline" className="no-default-active-elevate text-xs" data-testid={`badge-work-period-${worker.id}`}>
                  <Clock className="w-3 h-3 ml-1" />
                  {worker.workPeriod}
                </Badge>
              )}
              <ContractBadge contractEndDate={worker.contractEndDate} />
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <Building2 className="w-3 h-3" /> {companyName}
              </span>
              <span className="flex items-center gap-1">
                <Wrench className="w-3 h-3" /> {workshopName}
              </span>
              {worker.contractEndDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {worker.contractEndDate}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canViewTotals && (
            <div className="text-left ml-2">
              <p className="text-xs text-muted-foreground">الأجرة</p>
              <p className="font-bold text-sm" dir="ltr" data-testid={`text-worker-wage-${worker.id}`}>
                {formatAmount(worker.wage)} د.ج
              </p>
            </div>
          )}
          {canViewTotals && (
            <Badge variant={Number(worker.balance) >= 0 ? "default" : "destructive"} data-testid={`text-worker-balance-${worker.id}`}>
              {formatAmount(worker.balance)} د.ج
            </Badge>
          )}
          {!isAppUser && (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                if (confirm("هل أنت متأكد من حذف هذا العامل؟")) {
                  deleteWorkerMutation.mutate();
                }
              }}
              data-testid={`button-delete-worker-${worker.id}`}
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setExpanded(!expanded)}
            data-testid={`button-toggle-worker-${worker.id}`}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
            {worker.nonRenewalDate && (
              <span className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> عدم تجديد: {worker.nonRenewalDate}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button size="sm" onClick={() => openTxDialog("salary")} data-testid={`button-add-salary-${worker.id}`}>
              <DollarSign className="w-4 h-4 ml-1" /> أجرة
            </Button>
            <Button size="sm" variant="outline" onClick={() => openTxDialog("advance")} data-testid={`button-add-advance-${worker.id}`}>
              <DollarSign className="w-4 h-4 ml-1" /> سلفة
            </Button>
            <Button size="sm" variant="outline" onClick={() => openTxDialog("deduction")} data-testid={`button-add-deduction-${worker.id}`}>
              <DollarSign className="w-4 h-4 ml-1" /> خصم
            </Button>
            <Button size="sm" variant="secondary" onClick={() => openTxDialog("debt")} data-testid={`button-add-debt-${worker.id}`}>
              <AlertTriangle className="w-4 h-4 ml-1" /> دين جديد
            </Button>
          </div>

          <Dialog open={txDialogOpen} onOpenChange={setTxDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>تسجيل {txTypeLabels[txType]} - {worker.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {txType === "debt" && canViewTotals && (
                  <div className="p-3 rounded-md bg-muted/60 text-xs space-y-1">
                    <p className="font-semibold text-sm">رصيد العامل الحالي: <span dir="ltr">{formatAmount(worker.balance)} د.ج</span></p>
                    <p className="text-muted-foreground">المبلغ المقترح تلقائياً حسب الدين:</p>
                    <ul className="text-muted-foreground list-disc list-inside mr-2">
                      <li>أكثر من 200,000 د.ج ← يُستخلص 20,000 د.ج</li>
                      <li>من 100,000 إلى 200,000 د.ج ← يُستخلص 10,000 د.ج</li>
                      <li>أقل من 100,000 د.ج ← يُستخلص 5,000 د.ج</li>
                    </ul>
                    <p className="text-muted-foreground mt-1">يمكنك تغيير المبلغ يدوياً</p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>المبلغ (د.ج)</Label>
                  <Input
                    type="number"
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    dir="ltr"
                    data-testid="input-tx-amount"
                  />
                </div>
                <div className="space-y-2">
                  <Label>التاريخ</Label>
                  <Input
                    type="date"
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    data-testid="input-tx-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label>ملاحظة (اختياري)</Label>
                  <Input
                    value={txNote}
                    onChange={(e) => setTxNote(e.target.value)}
                    placeholder="ملاحظة..."
                    data-testid="input-tx-note"
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={() => {
                    if (!txAmount) {
                      toast({ title: "يرجى إدخال المبلغ", variant: "destructive" });
                      return;
                    }
                    addTxMutation.mutate({
                      type: txType === "debt" ? "deduction" : txType,
                      amount: txAmount,
                      date: txDate,
                      note: txNote || undefined,
                    });
                  }}
                  disabled={!txAmount || addTxMutation.isPending}
                  data-testid="button-submit-tx"
                >
                  تسجيل {txTypeLabels[txType]}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {txLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : sortedTxs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">لا توجد عمليات مسجلة</p>
          ) : (
            <div className="space-y-2">
              {sortedTxs.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between gap-3 p-3 rounded-md bg-muted/50 flex-wrap" data-testid={`worker-tx-${tx.id}`}>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant={tx.type === "salary" ? "default" : tx.type === "advance" ? "secondary" : "destructive"}
                        className="no-default-active-elevate text-xs"
                      >
                        {txTypeLabels[tx.type] || tx.type}
                      </Badge>
                      {canViewTotals && (
                        <span className="font-bold text-sm" dir="ltr">{formatAmount(tx.amount)} د.ج</span>
                      )}
                      <span className="text-xs text-muted-foreground">{tx.date || formatDateSimple(tx.createdAt)}</span>
                    </div>
                    {tx.note && <p className="text-xs text-muted-foreground mt-0.5">{tx.note}</p>}
                  </div>
                  {!isAppUser && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteTxMutation.mutate(tx.id)}
                      disabled={deleteTxMutation.isPending}
                      data-testid={`button-delete-tx-${tx.id}`}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export default function WorkersManagement() {
  const { toast } = useToast();
  const { hasPermission, user } = useAuth();
  const canViewTotals = user?.role !== "app_user" || hasPermission("view_totals");
  const isAppUser = user?.role === "app_user";

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [companiesDialogOpen, setCompaniesDialogOpen] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");

  const [workerNumber, setWorkerNumber] = useState("");
  const [workerName, setWorkerName] = useState("");
  const [workerPhone, setWorkerPhone] = useState("");
  const [workerCompanyId, setWorkerCompanyId] = useState("");
  const [workerWorkshopId, setWorkerWorkshopId] = useState("");
  const [workerContractEnd, setWorkerContractEnd] = useState("");
  const [workerWage, setWorkerWage] = useState("");
  const [workerPeriod, setWorkerPeriod] = useState("");
  const [workerNonRenewal, setWorkerNonRenewal] = useState("");

  const { data: workersList, isLoading: workersLoading } = useQuery<Worker[]>({
    queryKey: ["/api/managed-workers"],
  });

  const { data: companies, isLoading: companiesLoading } = useQuery<WorkerCompany[]>({
    queryKey: ["/api/worker-companies"],
  });

  const { data: workshopsList } = useQuery<Workshop[]>({
    queryKey: ["/api/workshops"],
  });

  const createCompanyMutation = useMutation({
    mutationFn: async (data: { name: string }) => {
      const res = await apiRequest("POST", "/api/worker-companies", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/worker-companies"] });
      setNewCompanyName("");
      toast({ title: "تم إضافة الشركة بنجاح" });
    },
    onError: (err: Error) => {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    },
  });

  const deleteCompanyMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/worker-companies/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/worker-companies"] });
      toast({ title: "تم حذف الشركة" });
    },
    onError: (err: Error) => {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    },
  });

  const createWorkerMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/managed-workers", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/managed-workers"] });
      setCreateDialogOpen(false);
      setWorkerNumber("");
      setWorkerName("");
      setWorkerPhone("");
      setWorkerCompanyId("");
      setWorkerWorkshopId("");
      setWorkerContractEnd("");
      setWorkerWage("");
      setWorkerPeriod("");
      setWorkerNonRenewal("");
      toast({ title: "تم إضافة العامل بنجاح" });
    },
    onError: (err: Error) => {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    },
  });

  const importWorkersMutation = useMutation({
    mutationFn: async (data: { workers: any[] }) => {
      const res = await apiRequest("POST", "/api/managed-workers/import", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/managed-workers"] });
      toast({ title: "تم استيراد العمال بنجاح" });
    },
    onError: (err: Error) => {
      toast({ title: "خطأ في الاستيراد", description: err.message, variant: "destructive" });
    },
  });

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length < 2) {
          toast({ title: "الملف فارغ أو لا يحتوي على بيانات كافية", variant: "destructive" });
          return;
        }
        const headers = lines[0].split(",").map(h => h.trim());
        const workers = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(",").map(v => v.trim());
          const row: any = {};
          headers.forEach((h, idx) => {
            const val = values[idx] || "";
            if (h === "رقم العامل") row.workerNumber = val;
            else if (h === "اسم العامل") row.name = val;
            else if (h === "الهاتف") row.phone = val;
            else if (h === "أجرة العامل") row.wage = val;
            else if (h === "الفترة") row.workPeriod = val;
          });
          if (row.name) workers.push(row);
        }
        if (workers.length === 0) {
          toast({ title: "لم يتم العثور على بيانات صالحة في الملف", variant: "destructive" });
          return;
        }
        importWorkersMutation.mutate({ workers });
      } catch {
        toast({ title: "خطأ في قراءة الملف", variant: "destructive" });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-workers-title">إدارة العمال</h1>
          <p className="text-muted-foreground text-sm mt-1">إدارة العمال والأجور والمعاملات</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {!isAppUser && (
            <Dialog open={companiesDialogOpen} onOpenChange={setCompaniesDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" data-testid="button-manage-companies">
                  <Building2 className="w-4 h-4 ml-2" />
                  شركات العمال
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>إدارة شركات العمال</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="flex items-center gap-2">
                    <Input
                      data-testid="input-new-company-name"
                      placeholder="اسم الشركة الجديدة..."
                      value={newCompanyName}
                      onChange={(e) => setNewCompanyName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newCompanyName.trim()) {
                          createCompanyMutation.mutate({ name: newCompanyName.trim() });
                        }
                      }}
                    />
                    <Button
                      size="icon"
                      onClick={() => {
                        if (newCompanyName.trim()) createCompanyMutation.mutate({ name: newCompanyName.trim() });
                      }}
                      disabled={!newCompanyName.trim() || createCompanyMutation.isPending}
                      data-testid="button-add-company"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {companiesLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
                    </div>
                  ) : (companies || []).length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">لا توجد شركات</p>
                  ) : (
                    <div className="space-y-2">
                      {(companies || []).map(c => (
                        <div key={c.id} className="flex items-center justify-between gap-2 p-3 rounded-md bg-muted/50" data-testid={`company-row-${c.id}`}>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{c.name}</span>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteCompanyMutation.mutate(c.id)}
                            disabled={deleteCompanyMutation.isPending}
                            data-testid={`button-delete-company-${c.id}`}
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

          <Button variant="outline" asChild data-testid="button-import-excel">
            <label className="cursor-pointer">
              <Upload className="w-4 h-4 ml-2" />
              استيراد من إكسل
              <input
                type="file"
                accept=".xlsx,.csv"
                className="hidden"
                onChange={handleFileImport}
                data-testid="input-import-file"
              />
            </label>
          </Button>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-worker">
                <Plus className="w-4 h-4 ml-2" />
                إضافة عامل
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>إضافة عامل جديد</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>رقم العامل</Label>
                  <Input
                    value={workerNumber}
                    onChange={(e) => setWorkerNumber(e.target.value)}
                    placeholder="رقم العامل"
                    data-testid="input-worker-number"
                  />
                </div>
                <div className="space-y-2">
                  <Label>اسم العامل *</Label>
                  <Input
                    value={workerName}
                    onChange={(e) => setWorkerName(e.target.value)}
                    placeholder="اسم العامل"
                    data-testid="input-worker-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>الهاتف (اختياري)</Label>
                  <Input
                    value={workerPhone}
                    onChange={(e) => setWorkerPhone(e.target.value)}
                    placeholder="رقم الهاتف"
                    dir="ltr"
                    data-testid="input-worker-phone"
                  />
                </div>
                <div className="space-y-2">
                  <Label>الشركة</Label>
                  <Select value={workerCompanyId} onValueChange={setWorkerCompanyId}>
                    <SelectTrigger data-testid="select-worker-company">
                      <SelectValue placeholder="اختر الشركة" />
                    </SelectTrigger>
                    <SelectContent>
                      {(companies || []).map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>الورشة</Label>
                  <Select value={workerWorkshopId} onValueChange={setWorkerWorkshopId}>
                    <SelectTrigger data-testid="select-worker-workshop">
                      <SelectValue placeholder="اختر الورشة" />
                    </SelectTrigger>
                    <SelectContent>
                      {(workshopsList || []).map(w => (
                        <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>تاريخ انتهاء العقد</Label>
                  <Input
                    type="date"
                    value={workerContractEnd}
                    onChange={(e) => setWorkerContractEnd(e.target.value)}
                    data-testid="input-worker-contract-end"
                  />
                </div>
                <div className="space-y-2">
                  <Label>أجرة العامل (د.ج)</Label>
                  <Input
                    type="number"
                    value={workerWage}
                    onChange={(e) => setWorkerWage(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    dir="ltr"
                    data-testid="input-worker-wage"
                  />
                </div>
                <div className="space-y-2">
                  <Label>الفترة</Label>
                  <Select value={workerPeriod} onValueChange={setWorkerPeriod}>
                    <SelectTrigger data-testid="select-worker-period">
                      <SelectValue placeholder="اختر الفترة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="صباحي">صباحي</SelectItem>
                      <SelectItem value="مسائي">مسائي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>تاريخ عدم إمكانية تجديد العقد</Label>
                  <Input
                    type="date"
                    value={workerNonRenewal}
                    onChange={(e) => setWorkerNonRenewal(e.target.value)}
                    data-testid="input-worker-non-renewal"
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={() => {
                    if (!workerName.trim()) {
                      toast({ title: "يرجى إدخال اسم العامل", variant: "destructive" });
                      return;
                    }
                    createWorkerMutation.mutate({
                      name: workerName.trim(),
                      workerNumber: workerNumber.trim() || undefined,
                      phone: workerPhone.trim() || undefined,
                      workerCompanyId: workerCompanyId || undefined,
                      workshopId: workerWorkshopId || undefined,
                      contractEndDate: workerContractEnd || undefined,
                      wage: workerWage || "0",
                      workPeriod: workerPeriod || undefined,
                      nonRenewalDate: workerNonRenewal || undefined,
                    });
                  }}
                  disabled={!workerName.trim() || createWorkerMutation.isPending}
                  data-testid="button-submit-worker"
                >
                  {createWorkerMutation.isPending ? "جاري الإضافة..." : "إضافة العامل"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {workersLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-5">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (workersList || []).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <HardHat className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground text-sm">لا يوجد عمال مسجلين بعد</p>
            <p className="text-muted-foreground text-xs mt-1">قم بإضافة عمال جدد للبدء</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {(workersList || []).map(worker => (
            <WorkerCard
              key={worker.id}
              worker={worker}
              companies={companies || []}
              workshopsList={workshopsList || []}
              isAppUser={isAppUser}
              canViewTotals={canViewTotals}
            />
          ))}
        </div>
      )}
    </div>
  );
}
