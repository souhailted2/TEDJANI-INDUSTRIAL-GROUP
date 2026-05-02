import { useState } from "react";
import { useRoute, Link } from "wouter";
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
import { formatAmount, formatDateSimple } from "@/lib/format";
import {
  Building2,
  ChevronRight,
  Scale,
  Plus,
  ArrowRight,
  Trash2,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  User,
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

// Balance = SUM(A→B) - SUM(B→A), grouped by currency
function computePairNet(
  companyAId: string,
  companyBId: string,
  transfers: Transfer[]
): Record<string, number> {
  const net: Record<string, number> = {};
  for (const t of transfers) {
    const isAtoB = t.fromCompanyId === companyAId && t.toCompanyId === companyBId;
    const isBtoA = t.fromCompanyId === companyBId && t.toCompanyId === companyAId;
    if (!isAtoB && !isBtoA) continue;
    const c = t.currency || "DZD";
    if (net[c] === undefined) net[c] = 0;
    if (isAtoB) net[c] += Number(t.amount);
    if (isBtoA) net[c] -= Number(t.amount);
  }
  return net;
}

function NetBadges({
  net,
  companyAName,
  companyBName,
}: {
  net: Record<string, number>;
  companyAName: string;
  companyBName: string;
}) {
  const entries = Object.entries(net);
  if (entries.length === 0) {
    return (
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Minus className="w-4 h-4" />
        <span className="text-xs">لا توجد معاملات</span>
      </div>
    );
  }
  return (
    <div className="space-y-1">
      {entries.map(([currency, value]) => {
        const sym = getCurrencySymbol(currency);
        const abs = formatAmount(Math.abs(value));
        if (Math.abs(value) < 0.001) {
          return (
            <div key={currency} className="flex items-center gap-1.5 text-muted-foreground text-xs">
              <Minus className="w-3 h-3" />
              <span dir="ltr">{abs} {sym}</span>
              <span>(متوازن)</span>
            </div>
          );
        }
        const debtor = value > 0 ? companyBName : companyAName;
        const isPositive = value > 0;
        return (
          <div key={currency} className="space-y-0.5">
            <div className={`flex items-center gap-1.5 ${isPositive ? "text-emerald-600" : "text-red-500"}`}>
              {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              <span className="text-sm font-bold" dir="ltr">{abs} {sym}</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              <span className="font-semibold">{debtor}</span> مدينة
            </p>
          </div>
        );
      })}
    </div>
  );
}

function PairDetail({
  companyA,
  companyB,
  transfers,
  companies,
  onBack,
}: {
  companyA: SafeCompany;
  companyB: SafeCompany;
  transfers: Transfer[];
  companies: SafeCompany[];
  onBack: () => void;
}) {
  const { toast } = useToast();
  const { isParent } = useAuth();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addAmount, setAddAmount] = useState("");
  const [addCurrency, setAddCurrency] = useState("DZD");
  const [addNote, setAddNote] = useState("");
  const [addDate, setAddDate] = useState(new Date().toISOString().split("T")[0]);
  const [addDirection, setAddDirection] = useState<"a_to_b" | "b_to_a">("a_to_b");

  const pairTransfers = transfers
    .filter(t =>
      (t.fromCompanyId === companyA.id && t.toCompanyId === companyB.id) ||
      (t.fromCompanyId === companyB.id && t.toCompanyId === companyA.id)
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const net = computePairNet(companyA.id, companyB.id, transfers);

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

  const addMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/transfers/direct", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transfers"] });
      setAddDialogOpen(false);
      setAddAmount("");
      setAddNote("");
      setAddCurrency("DZD");
      setAddDate(new Date().toISOString().split("T")[0]);
      toast({ title: "تم تسجيل التحويل بنجاح" });
    },
    onError: (err: Error) => {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    },
  });

  const handleAdd = () => {
    if (!addAmount) {
      toast({ title: "يرجى إدخال المبلغ", variant: "destructive" });
      return;
    }
    const fromId = addDirection === "a_to_b" ? companyA.id : companyB.id;
    const toId = addDirection === "a_to_b" ? companyB.id : companyA.id;
    addMutation.mutate({ fromCompanyId: fromId, toCompanyId: toId, amount: addAmount, currency: addCurrency, note: addNote || null, date: addDate });
  };

  const totalsByDirection: Record<string, { atob: number; btoa: number }> = {};
  for (const t of pairTransfers) {
    const c = t.currency || "DZD";
    if (!totalsByDirection[c]) totalsByDirection[c] = { atob: 0, btoa: 0 };
    if (t.fromCompanyId === companyA.id) totalsByDirection[c].atob += Number(t.amount);
    else totalsByDirection[c].btoa += Number(t.amount);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} data-testid="button-back-to-relations">
          <ChevronRight className="w-4 h-4 ml-1" />
          العودة
        </Button>
        <div className="flex items-center gap-2 font-semibold">
          <span>{companyA.name}</span>
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
          <span>{companyB.name}</span>
        </div>
      </div>

      {/* Summary card */}
      <Card className="border-primary/15">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-muted-foreground">الملخص المالي</p>
            {isParent && (
              <Button size="sm" onClick={() => setAddDialogOpen(true)} data-testid="button-add-pair-transfer">
                <Plus className="w-3 h-3 ml-1" />
                تحويل جديد
              </Button>
            )}
          </div>
          {Object.entries(totalsByDirection).map(([currency, { atob, btoa }]) => {
            const sym = getCurrencySymbol(currency);
            const netVal = atob - btoa;
            return (
              <div key={currency} className="rounded-md border p-3 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">من {companyA.name} إلى {companyB.name}:</span>
                  <span className="font-semibold" dir="ltr">{formatAmount(atob)} {sym}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">من {companyB.name} إلى {companyA.name}:</span>
                  <span className="font-semibold" dir="ltr">{formatAmount(btoa)} {sym}</span>
                </div>
                <div className="border-t pt-2 flex items-center justify-between font-bold">
                  <span>الرصيد الصافي:</span>
                  <span className={netVal >= 0 ? "text-emerald-600" : "text-red-500"} dir="ltr">
                    {netVal >= 0 ? "+" : ""}{formatAmount(netVal)} {sym}
                  </span>
                </div>
                {Math.abs(netVal) > 0.001 && (
                  <p className="text-xs text-muted-foreground">
                    {netVal > 0
                      ? `${companyB.name} مدينة لـ ${companyA.name}`
                      : `${companyA.name} مدينة لـ ${companyB.name}`}
                  </p>
                )}
              </div>
            );
          })}
          {Object.keys(totalsByDirection).length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-2">لا توجد معاملات بين هاتين الشركتين</p>
          )}
        </CardContent>
      </Card>

      {/* Transfer list */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-muted-foreground">جميع التحويلات ({pairTransfers.length})</p>
        {pairTransfers.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <Scale className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground text-sm">لا توجد تحويلات مسجلة</p>
            </CardContent>
          </Card>
        ) : (
          pairTransfers.map(t => {
            const from = companies.find(c => c.id === t.fromCompanyId);
            const to = companies.find(c => c.id === t.toCompanyId);
            const sym = getCurrencySymbol(t.currency || "DZD");
            return (
              <Card key={t.id} data-testid={`card-transfer-${t.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">{from?.name}</span>
                        <ArrowRight className="w-3 h-3 text-muted-foreground" />
                        <span className="font-medium">{to?.name}</span>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-base font-bold" dir="ltr">{formatAmount(Number(t.amount))} {sym}</span>
                        <Badge variant="outline" className="text-xs">{t.currency || "DZD"}</Badge>
                        {t.status === "pending" && (
                          <Badge variant="secondary" className="text-xs">قيد الانتظار</Badge>
                        )}
                        <span className="text-xs text-muted-foreground">{t.date || formatDateSimple(t.createdAt)}</span>
                      </div>
                      {t.note && (
                        <p className="text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded">{t.note}</p>
                      )}
                    </div>
                    {isParent && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteId(t.id)}
                        data-testid={`button-delete-transfer-${t.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Add transfer dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تحويل جديد بين {companyA.name} و {companyB.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>اتجاه التحويل</Label>
              <Select value={addDirection} onValueChange={v => setAddDirection(v as "a_to_b" | "b_to_a")}>
                <SelectTrigger data-testid="select-pair-direction">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="a_to_b">من {companyA.name} → {companyB.name}</SelectItem>
                  <SelectItem value="b_to_a">من {companyB.name} → {companyA.name}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="pair-amount">المبلغ</Label>
                <Input id="pair-amount" data-testid="input-pair-amount" type="number" step="0.01" placeholder="0.00" dir="ltr" value={addAmount} onChange={e => setAddAmount(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>العملة</Label>
                <Select value={addCurrency} onValueChange={setAddCurrency}>
                  <SelectTrigger data-testid="select-pair-currency">
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
              <Input type="date" value={addDate} onChange={e => setAddDate(e.target.value)} data-testid="input-pair-date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pair-note">ملاحظات (اختياري)</Label>
              <Textarea id="pair-note" data-testid="input-pair-note" placeholder="وصف التحويل..." value={addNote} onChange={e => setAddNote(e.target.value)} className="resize-none" rows={2} />
            </div>
            <Button className="w-full" onClick={handleAdd} disabled={addMutation.isPending} data-testid="button-submit-pair-transfer">
              {addMutation.isPending ? "جاري الحفظ..." : "تسجيل التحويل"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف التحويل</AlertDialogTitle>
            <AlertDialogDescription>هل أنت متأكد من حذف هذا التحويل؟ لا يمكن التراجع.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              {deleteMutation.isPending ? "جاري الحذف..." : "حذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function CompanyRelations() {
  const [, params] = useRoute("/companies/:id/relations");
  const companyId = params?.id || "";

  const { toast } = useToast();
  const { isParent } = useAuth();

  const [viewMode, setViewMode] = useState<"mine" | "all">("mine");
  const [selectedPair, setSelectedPair] = useState<{ a: SafeCompany; b: SafeCompany } | null>(null);

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addFromId, setAddFromId] = useState("");
  const [addToId, setAddToId] = useState("");
  const [addAmount, setAddAmount] = useState("");
  const [addCurrency, setAddCurrency] = useState("DZD");
  const [addNote, setAddNote] = useState("");
  const [addDate, setAddDate] = useState(new Date().toISOString().split("T")[0]);

  const { data: companies, isLoading: companiesLoading } = useQuery<SafeCompany[]>({
    queryKey: ["/api/companies"],
  });

  const { data: transfers, isLoading: transfersLoading } = useQuery<Transfer[]>({
    queryKey: ["/api/transfers"],
  });

  const addMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/transfers/direct", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transfers"] });
      setAddDialogOpen(false);
      setAddFromId("");
      setAddToId("");
      setAddAmount("");
      setAddNote("");
      setAddCurrency("DZD");
      setAddDate(new Date().toISOString().split("T")[0]);
      toast({ title: "تم تسجيل التحويل بنجاح" });
    },
    onError: (err: Error) => {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    },
  });

  const handleAdd = () => {
    if (!addFromId || !addToId || !addAmount) {
      toast({ title: "يرجى ملء جميع الحقول المطلوبة", variant: "destructive" });
      return;
    }
    if (addFromId === addToId) {
      toast({ title: "لا يمكن التحويل لنفس الشركة", variant: "destructive" });
      return;
    }
    addMutation.mutate({ fromCompanyId: addFromId, toCompanyId: addToId, amount: addAmount, currency: addCurrency, note: addNote || null, date: addDate });
  };

  const loading = companiesLoading || transfersLoading;
  const allCompanies = companies || [];
  const allTransfers = transfers || [];
  const currentCompany = allCompanies.find(c => c.id === companyId);

  // Generate all unique pairs (A, B) where A.id < B.id to avoid duplicates
  const allPairs: { a: SafeCompany; b: SafeCompany }[] = [];
  for (let i = 0; i < allCompanies.length; i++) {
    for (let j = i + 1; j < allCompanies.length; j++) {
      allPairs.push({ a: allCompanies[i], b: allCompanies[j] });
    }
  }

  // Filter pairs based on view mode
  const displayedPairs = viewMode === "mine"
    ? allPairs.filter(p => p.a.id === companyId || p.b.id === companyId)
    : allPairs;

  if (selectedPair) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <PairDetail
          companyA={selectedPair.a}
          companyB={selectedPair.b}
          transfers={allTransfers}
          companies={allCompanies}
          onBack={() => setSelectedPair(null)}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Link href="/companies">
            <Button variant="ghost" size="sm" data-testid="button-back-to-companies">
              <ChevronRight className="w-4 h-4 ml-1" />
              الشركات
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold" data-testid="text-relations-title">
              العلاقات المالية
            </h1>
            <p className="text-muted-foreground text-xs mt-0.5">التحويلات المسجلة بين الشركات</p>
          </div>
        </div>
        {isParent && (
          <Button size="sm" onClick={() => { setAddFromId(""); setAddToId(""); setAddDialogOpen(true); }} data-testid="button-new-transfer-overview">
            <Plus className="w-4 h-4 ml-1" />
            تحويل جديد
          </Button>
        )}
      </div>

      {/* View mode toggle */}
      <div className="flex items-center gap-2 bg-muted/40 p-1 rounded-lg w-fit" data-testid="toggle-view-mode">
        <Button
          size="sm"
          variant={viewMode === "mine" ? "default" : "ghost"}
          className="gap-1.5 h-8"
          onClick={() => setViewMode("mine")}
          data-testid="button-view-mine"
        >
          <User className="w-3.5 h-3.5" />
          علاقاتي فقط
        </Button>
        <Button
          size="sm"
          variant={viewMode === "all" ? "default" : "ghost"}
          className="gap-1.5 h-8"
          onClick={() => setViewMode("all")}
          data-testid="button-view-all"
        >
          <Users className="w-3.5 h-3.5" />
          كل العلاقات
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Card key={i}><CardContent className="p-5"><Skeleton className="h-16 w-full" /></CardContent></Card>)}
        </div>
      ) : displayedPairs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Scale className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground text-sm">
              {viewMode === "mine" ? "لا توجد شركات أخرى لعرض علاقاتها" : "لا توجد شركات مسجلة"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {displayedPairs.map(({ a, b }) => {
            const net = computePairNet(a.id, b.id, allTransfers);
            const txCount = allTransfers.filter(t =>
              (t.fromCompanyId === a.id && t.toCompanyId === b.id) ||
              (t.fromCompanyId === b.id && t.toCompanyId === a.id)
            ).length;
            return (
              <Card
                key={`${a.id}-${b.id}`}
                className="cursor-pointer hover:border-primary/40 transition-colors"
                onClick={() => setSelectedPair({ a, b })}
                data-testid={`card-relation-${a.id}-${b.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-9 h-9 rounded-md bg-primary/10">
                        <Building2 className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 font-semibold text-sm">
                          <span>{a.name}</span>
                          <ArrowRight className="w-3 h-3 text-muted-foreground" />
                          <span>{b.name}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-[11px]">{txCount} معاملة</Badge>
                          {a.isParent && <Badge variant="secondary" className="text-[11px]">{a.name} (الأم)</Badge>}
                          {b.isParent && <Badge variant="secondary" className="text-[11px]">{b.name} (الأم)</Badge>}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <NetBadges net={net} companyAName={a.name} companyBName={b.name} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* New transfer dialog (overview level) */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تحويل جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>من</Label>
              <Select value={addFromId} onValueChange={setAddFromId}>
                <SelectTrigger data-testid="select-add-from">
                  <SelectValue placeholder="اختر الشركة المُرسِلة" />
                </SelectTrigger>
                <SelectContent>
                  {allCompanies.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>إلى</Label>
              <Select value={addToId} onValueChange={setAddToId}>
                <SelectTrigger data-testid="select-add-to">
                  <SelectValue placeholder="اختر الشركة المُستقبِلة" />
                </SelectTrigger>
                <SelectContent>
                  {allCompanies.filter(c => c.id !== addFromId).map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="ov-amount">المبلغ</Label>
                <Input id="ov-amount" data-testid="input-ov-amount" type="number" step="0.01" placeholder="0.00" dir="ltr" value={addAmount} onChange={e => setAddAmount(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>العملة</Label>
                <Select value={addCurrency} onValueChange={setAddCurrency}>
                  <SelectTrigger data-testid="select-ov-currency">
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
              <Input type="date" value={addDate} onChange={e => setAddDate(e.target.value)} data-testid="input-ov-date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ov-note">ملاحظات (اختياري)</Label>
              <Textarea id="ov-note" data-testid="input-ov-note" placeholder="وصف التحويل..." value={addNote} onChange={e => setAddNote(e.target.value)} className="resize-none" rows={2} />
            </div>
            <Button className="w-full" onClick={handleAdd} disabled={addMutation.isPending} data-testid="button-submit-ov-transfer">
              {addMutation.isPending ? "جاري الحفظ..." : "تسجيل التحويل"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
