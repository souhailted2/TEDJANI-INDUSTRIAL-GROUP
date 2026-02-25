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
import { Plus, Trash2, ArrowDown, ArrowUp, Banknote } from "lucide-react";
import type { ExternalFund } from "@shared/schema";

export default function ExternalFunds() {
  const { toast } = useToast();
  const { hasPermission, user } = useAuth();
  const canViewTotals = user?.role !== "app_user" || hasPermission("view_totals");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [personName, setPersonName] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("incoming");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const { data: funds, isLoading } = useQuery<ExternalFund[]>({
    queryKey: ["/api/external-funds"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { personName: string; phone?: string; amount: string; type: string; description?: string }) => {
      const res = await apiRequest("POST", "/api/external-funds", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-funds"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      setAddDialogOpen(false);
      resetForm();
      toast({ title: "تم تسجيل العملية بنجاح" });
    },
    onError: (err: Error) => {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/external-funds/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-funds"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      toast({ title: "تم حذف العملية" });
    },
    onError: (err: Error) => {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    },
  });

  function resetForm() {
    setPersonName("");
    setPhone("");
    setAmount("");
    setType("incoming");
    setDescription("");
    setDate(new Date().toISOString().split("T")[0]);
  }

  const sortedFunds = [...(funds || [])].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const totalIncoming = sortedFunds.filter(f => f.type === "incoming").reduce((sum, f) => sum + Number(f.amount), 0);
  const totalOutgoing = sortedFunds.filter(f => f.type === "outgoing").reduce((sum, f) => sum + Number(f.amount), 0);

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-external-funds-title">أموال خارجية</h1>
          <p className="text-muted-foreground text-sm mt-1">تتبع الأموال الواردة والصادرة من/إلى جهات خارجية</p>
        </div>

        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-fund">
              <Plus className="w-4 h-4 ml-2" />
              تسجيل عملية
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>تسجيل أموال خارجية</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>نوع العملية</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger data-testid="select-fund-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="incoming">وارد (دخول أموال)</SelectItem>
                    <SelectItem value="outgoing">صادر (خروج أموال)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>اسم الشخص / الجهة</Label>
                <Input
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  placeholder="اسم الشخص أو الجهة"
                  data-testid="input-fund-person"
                />
              </div>
              <div className="space-y-2">
                <Label>رقم الهاتف (اختياري)</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="رقم الهاتف"
                  dir="ltr"
                  data-testid="input-fund-phone"
                />
              </div>
              <div className="space-y-2">
                <Label>المبلغ (د.ج)</Label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  dir="ltr"
                  data-testid="input-fund-amount"
                />
              </div>
              <div className="space-y-2">
                <Label>وصف (اختياري)</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="وصف العملية"
                  data-testid="input-fund-description"
                />
              </div>
              <div className="space-y-2">
                <Label>التاريخ</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  data-testid="input-fund-date"
                />
              </div>
              <Button
                className="w-full"
                onClick={() => createMutation.mutate({
                  personName,
                  phone: phone || undefined,
                  amount,
                  type,
                  description: description || undefined,
                  date,
                })}
                disabled={!personName || !amount || createMutation.isPending}
                data-testid="button-submit-fund"
              >
                تسجيل العملية
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {canViewTotals && funds && funds.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card><CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">إجمالي الوارد</p>
            <p className="text-lg font-bold text-green-600" data-testid="text-total-incoming">{formatAmount(totalIncoming)} د.ج</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">إجمالي الصادر</p>
            <p className="text-lg font-bold text-destructive" data-testid="text-total-outgoing">{formatAmount(totalOutgoing)} د.ج</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">الصافي</p>
            <p className={`text-lg font-bold ${totalIncoming - totalOutgoing >= 0 ? "text-green-600" : "text-destructive"}`} data-testid="text-net-amount">{formatAmount(totalIncoming - totalOutgoing)} د.ج</p>
          </CardContent></Card>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : !funds || funds.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Banknote className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">لا توجد عمليات مسجلة</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Banknote className="w-4 h-4" />
              سجل العمليات
              <Badge variant="secondary" className="text-xs">{sortedFunds.length} عملية</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sortedFunds.map(fund => (
                <div key={fund.id} className="flex items-center justify-between gap-3 p-3 rounded-md bg-muted/50" data-testid={`fund-item-${fund.id}`}>
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-md ${fund.type === "incoming" ? "bg-green-500/10 text-green-600" : "bg-destructive/10 text-destructive"}`}>
                      {fund.type === "incoming" ? <ArrowDown className="w-5 h-5" /> : <ArrowUp className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{fund.personName}</span>
                        <Badge variant={fund.type === "incoming" ? "secondary" : "outline"} className="text-xs">
                          {fund.type === "incoming" ? "وارد" : "صادر"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                        {fund.description && <span>{fund.description}</span>}
                        {fund.phone && <span>| {fund.phone}</span>}
                        <span>| {fund.date || formatDateSimple(fund.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`font-bold text-sm ${fund.type === "incoming" ? "text-green-600" : "text-destructive"}`}>
                      {fund.type === "incoming" ? "+" : "-"}{formatAmount(fund.amount)} د.ج
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        if (confirm("هل أنت متأكد من حذف هذه العملية؟")) {
                          deleteMutation.mutate(fund.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-fund-${fund.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
