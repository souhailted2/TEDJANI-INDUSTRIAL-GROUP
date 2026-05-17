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
import { formatAmount, formatDateSimple } from "@/lib/format";
import {
  Scale,
  Plus,
  ArrowRight,
  Building2,
  ChevronRight,
  Trash2,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import type { Company, IntercompanyTransfer } from "@shared/schema";

type SafeCompany = Omit<Company, "password">;

const CURRENCIES = [
  { value: "DZD", label: "د.ج (دينار جزائري)" },
  { value: "USD", label: "$ (دولار أمريكي)" },
  { value: "CNY", label: "¥ (يوان صيني)" },
];

function getCurrencySymbol(currency: string) {
  switch (currency) {
    case "USD": return "$";
    case "CNY": return "¥";
    default: return "د.ج";
  }
}

interface PairBalance {
  companyAId: string;
  companyBId: string;
  companyAName: string;
  companyBName: string;
  netByAToB: Record<string, number>;
  transactionCount: number;
}

function computePairBalances(transfers: IntercompanyTransfer[], companies: SafeCompany[]): PairBalance[] {
  const pairMap = new Map<string, PairBalance>();

  for (const t of transfers) {
    const ids = [t.fromCompanyId, t.toCompanyId].sort();
    const key = ids.join("|");
    const compA = companies.find(c => c.id === ids[0]);
    const compB = companies.find(c => c.id === ids[1]);
    if (!compA || !compB) continue;

    if (!pairMap.has(key)) {
      pairMap.set(key, {
        companyAId: ids[0],
        companyBId: ids[1],
        companyAName: compA.name,
        companyBName: compB.name,
        netByAToB: {},
        transactionCount: 0,
      });
    }

    const pair = pairMap.get(key)!;
    const currency = t.currency || "DZD";
    const amount = Number(t.amount);
    if (!pair.netByAToB[currency]) pair.netByAToB[currency] = 0;

    if (t.fromCompanyId === ids[0]) {
      pair.netByAToB[currency] += amount;
    } else {
      pair.netByAToB[currency] -= amount;
    }
    pair.transactionCount++;
  }

  return Array.from(pairMap.values());
}

function NetBalanceBadge({ net, currency, companyAName, companyBName }: {
  net: number;
  currency: string;
  companyAName: string;
  companyBName: string;
}) {
  const sym = getCurrencySymbol(currency);
  const abs = formatAmount(Math.abs(net));
  if (Math.abs(net) < 0.01) {
    return (
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Minus className="w-4 h-4" />
        <span className="text-sm font-medium" dir="ltr">{abs} {sym}</span>
        <span className="text-xs">(متوازن)</span>
      </div>
    );
  }
  const debtor = net > 0 ? companyBName : companyAName;
  const creditor = net > 0 ? companyAName : companyBName;
  return (
    <div className="flex flex-col gap-0.5">
      <div className={`flex items-center gap-1.5 ${net > 0 ? "text-amber-600" : "text-emerald-600"}`}>
        {net > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
        <span className="text-sm font-bold" dir="ltr">{abs} {sym}</span>
      </div>
      <p className="text-xs text-muted-foreground">
        <span className="font-semibold">{debtor}</span> مدينة لـ <span className="font-semibold">{creditor}</span>
      </p>
    </div>
  );
}

function PairDetail({
  pair,
  transfers,
  companies,
  onBack,
}: {
  pair: PairBalance;
  transfers: IntercompanyTransfer[];
  companies: SafeCompany[];
  onBack: () => void;
}) {
  const { toast } = useToast();
  const { isParent } = useAuth();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const pairTransfers = transfers
    .filter(t =>
      (t.fromCompanyId === pair.companyAId && t.toCompanyId === pair.companyBId) ||
      (t.fromCompanyId === pair.companyBId && t.toCompanyId === pair.companyAId)
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/intercompany-transfers/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/intercompany-transfers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/debt-summary"] });
      setDeleteId(null);
      toast({ title: "تم حذف التحويل بنجاح" });
    },
    onError: (err: Error) => {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} data-testid="button-back-to-pairs">
          <ChevronRight className="w-4 h-4 ml-1" />
          العودة
        </Button>
        <div className="flex items-center gap-2">
          <span className="font-semibold">{pair.companyAName}</span>
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
          <span className="font-semibold">{pair.companyBName}</span>
        </div>
      </div>

      <Card className="border-primary/10">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-3 font-semibold">الرصيد الصافي</p>
          <div className="space-y-2">
            {Object.entries(pair.netByAToB).map(([currency, net]) => (
              <NetBalanceBadge
                key={currency}
                net={net}
                currency={currency}
                companyAName={pair.companyAName}
                companyBName={pair.companyBName}
              />
            ))}
            {Object.keys(pair.netByAToB).length === 0 && (
              <p className="text-sm text-muted-foreground">لا توجد معاملات</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {pairTransfers.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <Scale className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground text-sm">لا توجد معاملات بين هاتين الشركتين</p>
            </CardContent>
          </Card>
        ) : (
          pairTransfers.map(t => {
            const from = companies.find(c => c.id === t.fromCompanyId);
            const to = companies.find(c => c.id === t.toCompanyId);
            const sym = getCurrencySymbol(t.currency || "DZD");
            return (
              <Card key={t.id} data-testid={`card-ict-${t.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">{from?.name}</span>
                        <ArrowRight className="w-3 h-3 text-muted-foreground" />
                        <span className="font-medium">{to?.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-base font-bold" dir="ltr">{formatAmount(t.amount)} {sym}</span>
                        <Badge variant="outline" className="text-xs">{t.currency || "DZD"}</Badge>
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
                        data-testid={`button-delete-ict-${t.id}`}
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

      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف التحويل</AlertDialogTitle>
            <AlertDialogDescription>هل أنت متأكد من حذف هذا التحويل؟ لا يمكن التراجع عن هذا الإجراء.</AlertDialogDescription>
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

export default function IntercompanyPage() {
  const { toast } = useToast();
  const { isParent } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [fromCompanyId, setFromCompanyId] = useState("");
  const [toCompanyId, setToCompanyId] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("DZD");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedPair, setSelectedPair] = useState<PairBalance | null>(null);

  const { data: companies, isLoading: companiesLoading } = useQuery<SafeCompany[]>({
    queryKey: ["/api/companies"],
  });

  const { data: transfers, isLoading: transfersLoading } = useQuery<IntercompanyTransfer[]>({
    queryKey: ["/api/intercompany-transfers"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: {
      fromCompanyId: string;
      toCompanyId: string;
      amount: string;
      currency: string;
      note?: string;
      date?: string;
    }) => {
      const res = await apiRequest("POST", "/api/intercompany-transfers", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/intercompany-transfers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/debt-summary"] });
      setDialogOpen(false);
      setFromCompanyId("");
      setToCompanyId("");
      setAmount("");
      setCurrency("DZD");
      setNote("");
      setDate(new Date().toISOString().split("T")[0]);
      toast({ title: "تم تسجيل التحويل بنجاح" });
    },
    onError: (err: Error) => {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    },
  });

  const handleCreate = () => {
    if (!fromCompanyId || !toCompanyId || !amount) {
      toast({ title: "يرجى ملء جميع الحقول المطلوبة", variant: "destructive" });
      return;
    }
    if (fromCompanyId === toCompanyId) {
      toast({ title: "لا يمكن التحويل لنفس الشركة", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      fromCompanyId,
      toCompanyId,
      amount,
      currency,
      note: note || undefined,
      date,
    });
  };

  const loading = companiesLoading || transfersLoading;
  const allCompanies = companies || [];
  const allTransfers = transfers || [];
  const pairs = computePairBalances(allTransfers, allCompanies);

  if (selectedPair) {
    const currentPair = pairs.find(
      p => p.companyAId === selectedPair.companyAId && p.companyBId === selectedPair.companyBId
    ) || selectedPair;
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <PairDetail
          pair={currentPair}
          transfers={allTransfers}
          companies={allCompanies}
          onBack={() => setSelectedPair(null)}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-intercompany-title">العلاقات المالية بين الشركات</h1>
          <p className="text-muted-foreground text-sm mt-1">تتبع المديونيات والتحويلات المباشرة بين الشركات</p>
        </div>
        {isParent && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-new-ict">
                <Plus className="w-4 h-4 ml-2" />
                تسجيل تحويل
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>تسجيل تحويل مالي بين شركتين</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>الشركة المُرسِلة (المدينة)</Label>
                  <Select value={fromCompanyId} onValueChange={setFromCompanyId}>
                    <SelectTrigger data-testid="select-ict-from">
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
                  <Label>الشركة المُستقبِلة (الدائنة)</Label>
                  <Select value={toCompanyId} onValueChange={setToCompanyId}>
                    <SelectTrigger data-testid="select-ict-to">
                      <SelectValue placeholder="اختر الشركة المُستقبِلة" />
                    </SelectTrigger>
                    <SelectContent>
                      {allCompanies.filter(c => c.id !== fromCompanyId).map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="ict-amount">المبلغ</Label>
                    <Input
                      id="ict-amount"
                      data-testid="input-ict-amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      dir="ltr"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>العملة</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger data-testid="select-ict-currency">
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
                  <Input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    data-testid="input-ict-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ict-note">ملاحظات (اختياري)</Label>
                  <Textarea
                    id="ict-note"
                    data-testid="input-ict-note"
                    placeholder="أضف وصفاً للتحويل..."
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    className="resize-none"
                    rows={2}
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={handleCreate}
                  disabled={createMutation.isPending}
                  data-testid="button-submit-ict"
                >
                  {createMutation.isPending ? "جاري الحفظ..." : "حفظ التحويل"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-5">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : pairs.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Scale className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">لا توجد علاقات مالية مسجلة بين الشركات</p>
            {isParent && (
              <p className="text-muted-foreground text-xs mt-1">اضغط على "تسجيل تحويل" لإضافة معاملة</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {pairs.map(pair => (
            <Card
              key={`${pair.companyAId}-${pair.companyBId}`}
              className="cursor-pointer hover:border-primary/40 transition-colors"
              onClick={() => setSelectedPair(pair)}
              data-testid={`card-pair-${pair.companyAId}-${pair.companyBId}`}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-md bg-primary/10">
                      <Scale className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="font-semibold text-sm">{pair.companyAName}</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="font-semibold text-sm">{pair.companyBName}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">{pair.transactionCount} معاملة</Badge>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    {Object.entries(pair.netByAToB).map(([curr, net]) => (
                      <NetBalanceBadge
                        key={curr}
                        net={net}
                        currency={curr}
                        companyAName={pair.companyAName}
                        companyBName={pair.companyBName}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
