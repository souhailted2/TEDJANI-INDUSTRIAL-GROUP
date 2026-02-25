import { useState, useMemo } from "react";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatAmount, formatDateSimple } from "@/lib/format";
import {
  Plus, Trash2, ChevronDown, ChevronUp, Factory, Wrench,
  Users, Package, Boxes, BarChart3, Tag, X, Cog, ClipboardList,
  Wallet, ArrowDownCircle, ArrowUpCircle,
} from "lucide-react";
import type {
  Workshop, Machine, Worker, MachineDailyEntry,
  SparePartItem, SparePartPurchase, SparePartConsumption,
  WorkshopExpense, WorkshopExpenseCategory,
  RawMaterial, RawMaterialPurchase,
} from "@shared/schema";

function WorkshopCard({ workshop, expenseCategories }: { workshop: Workshop; expenseCategories: WorkshopExpenseCategory[] }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const isAppUser = user?.role === "app_user";
  const [expanded, setExpanded] = useState(false);
  const [subTab, setSubTab] = useState("machines");
  const [machineDialogOpen, setMachineDialogOpen] = useState(false);
  const [machineName, setMachineName] = useState("");
  const [machineType, setMachineType] = useState("counter");
  const [machineExpected, setMachineExpected] = useState("");
  const [machineUnit, setMachineUnit] = useState("kg");
  const [expDialogOpen, setExpDialogOpen] = useState(false);
  const [expCategory, setExpCategory] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [expDescription, setExpDescription] = useState("");
  const [expDate, setExpDate] = useState(new Date().toISOString().split("T")[0]);

  const { data: machines, isLoading: machinesLoading } = useQuery<Machine[]>({
    queryKey: [`/api/workshops/${workshop.id}/machines`],
    enabled: expanded,
  });

  const { data: wsExpenses, isLoading: expLoading } = useQuery<WorkshopExpense[]>({
    queryKey: [`/api/workshops/${workshop.id}/expenses`],
    enabled: expanded && subTab === "expenses",
  });

  const addMachineMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", `/api/workshops/${workshop.id}/machines`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/workshops/${workshop.id}/machines`] });
      queryClient.invalidateQueries({ queryKey: ["/api/machines"] });
      setMachineDialogOpen(false);
      setMachineName("");
      setMachineType("counter");
      setMachineExpected("");
      setMachineUnit("kg");
      toast({ title: "تم إضافة الماكينة بنجاح" });
    },
    onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
  });

  const deleteMachineMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/machines/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/workshops/${workshop.id}/machines`] });
      queryClient.invalidateQueries({ queryKey: ["/api/machines"] });
      toast({ title: "تم حذف الماكينة" });
    },
    onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
  });

  const addExpMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", `/api/workshops/${workshop.id}/expenses`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/workshops/${workshop.id}/expenses`] });
      queryClient.invalidateQueries({ queryKey: ["/api/factory-settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      setExpDialogOpen(false);
      setExpCategory("");
      setExpAmount("");
      setExpDescription("");
      setExpDate(new Date().toISOString().split("T")[0]);
      toast({ title: "تم إضافة المصروف بنجاح" });
    },
    onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
  });

  const deleteExpMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/workshop-expenses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/workshops/${workshop.id}/expenses`] });
      queryClient.invalidateQueries({ queryKey: ["/api/factory-settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      toast({ title: "تم حذف المصروف" });
    },
    onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
  });

  const deleteWorkshopMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/workshops/${workshop.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workshops"] });
      toast({ title: "تم حذف الورشة" });
    },
    onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
  });

  return (
    <Card data-testid={`card-workshop-${workshop.id}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <div className="flex items-center gap-3 flex-1">
          <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10 text-primary">
            <Factory className="w-5 h-5" />
          </div>
          <CardTitle className="text-base" data-testid={`text-workshop-name-${workshop.id}`}>{workshop.name}</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          {!isAppUser && (
          <Button
            size="icon"
            variant="ghost"
            onClick={() => {
              if (confirm("هل أنت متأكد من حذف هذه الورشة؟")) deleteWorkshopMutation.mutate();
            }}
            data-testid={`button-delete-workshop-${workshop.id}`}
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setExpanded(!expanded)}
            data-testid={`button-toggle-workshop-${workshop.id}`}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="space-y-4">
          <Tabs value={subTab} onValueChange={setSubTab}>
            <TabsList className="w-full">
              <TabsTrigger value="machines" className="flex-1" data-testid={`tab-machines-${workshop.id}`}>الماكينات</TabsTrigger>
              <TabsTrigger value="expenses" className="flex-1" data-testid={`tab-expenses-${workshop.id}`}>المصاريف</TabsTrigger>
            </TabsList>
            <TabsContent value="machines" className="space-y-3 mt-3">
              <div className="flex items-center justify-end">
                {!isAppUser && (
                <Dialog open={machineDialogOpen} onOpenChange={setMachineDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" data-testid={`button-add-machine-${workshop.id}`}>
                      <Plus className="w-4 h-4 ml-1" /> إضافة ماكينة
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>إضافة ماكينة - {workshop.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>اسم الماكينة</Label>
                        <Input value={machineName} onChange={e => setMachineName(e.target.value)} placeholder="اسم الماكينة" data-testid="input-machine-name" />
                      </div>
                      <div className="space-y-2">
                        <Label>النوع</Label>
                        <Select value={machineType} onValueChange={setMachineType}>
                          <SelectTrigger data-testid="select-machine-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="weight">وزن</SelectItem>
                            <SelectItem value="counter">عداد</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>الإنتاج اليومي المتوقع</Label>
                        <Input type="number" value={machineExpected} onChange={e => setMachineExpected(e.target.value)} placeholder="0" step="0.01" dir="ltr" data-testid="input-machine-expected" />
                      </div>
                      <div className="space-y-2">
                        <Label>الوحدة</Label>
                        <Input value={machineUnit} onChange={e => setMachineUnit(e.target.value)} placeholder="kg" data-testid="input-machine-unit" />
                      </div>
                      <Button
                        className="w-full"
                        onClick={() => {
                          if (!machineName) { toast({ title: "يرجى إدخال اسم الماكينة", variant: "destructive" }); return; }
                          addMachineMutation.mutate({ name: machineName, type: machineType, expectedDailyOutput: machineExpected || "0", unit: machineUnit });
                        }}
                        disabled={!machineName || addMachineMutation.isPending}
                        data-testid="button-submit-machine"
                      >
                        إضافة
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                )}
              </div>
              {machinesLoading ? (
                <div className="space-y-2">{[1, 2].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : (machines || []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">لا توجد ماكينات</p>
              ) : (
                <div className="space-y-2">
                  {(machines || []).map(m => (
                    <div key={m.id} className="flex items-center justify-between gap-2 p-3 rounded-md bg-muted/50" data-testid={`machine-row-${m.id}`}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Cog className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{m.name}</span>
                        <Badge variant="secondary" className="text-xs no-default-active-elevate">{m.type === "weight" ? "وزن" : "عداد"}</Badge>
                        <span className="text-xs text-muted-foreground">المتوقع: {formatAmount(m.expectedDailyOutput)} {m.unit}</span>
                      </div>
                      {!isAppUser && (
                      <Button size="icon" variant="ghost" onClick={() => deleteMachineMutation.mutate(m.id)} data-testid={`button-delete-machine-${m.id}`}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="expenses" className="space-y-3 mt-3">
              <div className="flex items-center justify-end">
                {!isAppUser && (
                <Dialog open={expDialogOpen} onOpenChange={setExpDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" data-testid={`button-add-ws-expense-${workshop.id}`}>
                      <Plus className="w-4 h-4 ml-1" /> إضافة مصروف
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>إضافة مصروف - {workshop.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>نوع المصروف</Label>
                        <Select value={expCategory} onValueChange={setExpCategory}>
                          <SelectTrigger data-testid="select-ws-expense-category">
                            <SelectValue placeholder="اختر النوع" />
                          </SelectTrigger>
                          <SelectContent>
                            {expenseCategories.map(c => (
                              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>المبلغ (د.ج)</Label>
                        <Input type="number" value={expAmount} onChange={e => setExpAmount(e.target.value)} placeholder="0" step="0.01" dir="ltr" data-testid="input-ws-expense-amount" />
                      </div>
                      <div className="space-y-2">
                        <Label>الوصف (اختياري)</Label>
                        <Input value={expDescription} onChange={e => setExpDescription(e.target.value)} placeholder="وصف المصروف" data-testid="input-ws-expense-desc" />
                      </div>
                      <div className="space-y-2">
                        <Label>التاريخ</Label>
                        <Input type="date" value={expDate} onChange={e => setExpDate(e.target.value)} data-testid="input-ws-expense-date" />
                      </div>
                      <Button
                        className="w-full"
                        onClick={() => {
                          if (!expCategory || !expAmount) { toast({ title: "يرجى ملء الحقول المطلوبة", variant: "destructive" }); return; }
                          addExpMutation.mutate({ category: expCategory, amount: expAmount, description: expDescription || undefined, date: expDate });
                        }}
                        disabled={!expCategory || !expAmount || addExpMutation.isPending}
                        data-testid="button-submit-ws-expense"
                      >
                        إضافة المصروف
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                )}
              </div>
              {expLoading ? (
                <div className="space-y-2">{[1, 2].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : (wsExpenses || []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">لا توجد مصاريف</p>
              ) : (
                <div className="space-y-2">
                  {[...(wsExpenses || [])].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(exp => {
                    const catName = expenseCategories.find(c => c.id === exp.category)?.name || exp.category;
                    return (
                      <div key={exp.id} className="flex items-center justify-between gap-2 p-3 rounded-md bg-muted/50" data-testid={`ws-expense-row-${exp.id}`}>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary" className="text-xs no-default-active-elevate">{catName}</Badge>
                          <span className="text-sm font-medium" dir="ltr">{formatAmount(exp.amount)} د.ج</span>
                          {exp.description && <span className="text-xs text-muted-foreground">{exp.description}</span>}
                          <span className="text-xs text-muted-foreground">{exp.date || formatDateSimple(exp.createdAt)}</span>
                        </div>
                        {!isAppUser && (
                        <Button size="icon" variant="ghost" onClick={() => deleteExpMutation.mutate(exp.id)} data-testid={`button-delete-ws-expense-${exp.id}`}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      )}
    </Card>
  );
}

function WorkshopsTab() {
  const { toast } = useToast();
  const { user } = useAuth();
  const isAppUser = user?.role === "app_user";
  const [createOpen, setCreateOpen] = useState(false);
  const [wsName, setWsName] = useState("");
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  const { data: workshops, isLoading } = useQuery<Workshop[]>({ queryKey: ["/api/workshops"] });
  const { data: expCats, isLoading: catsLoading } = useQuery<WorkshopExpenseCategory[]>({ queryKey: ["/api/workshop-expense-categories"] });

  const createWsMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/workshops", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workshops"] });
      setCreateOpen(false);
      setWsName("");
      toast({ title: "تم إنشاء الورشة بنجاح" });
    },
    onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
  });

  const createCatMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/workshop-expense-categories", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workshop-expense-categories"] });
      setNewCatName("");
      toast({ title: "تم إضافة النوع" });
    },
    onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
  });

  const deleteCatMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/workshop-expense-categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workshop-expense-categories"] });
      toast({ title: "تم حذف النوع" });
    },
    onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {!isAppUser && (
          <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-manage-ws-categories">
                <Tag className="w-4 h-4 ml-2" /> أنواع مصاريف الورشات
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إدارة أنواع مصاريف الورشات</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="اسم النوع الجديد..."
                    value={newCatName}
                    onChange={e => setNewCatName(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && newCatName.trim()) createCatMutation.mutate({ name: newCatName.trim() }); }}
                    data-testid="input-new-ws-category"
                  />
                  <Button
                    size="icon"
                    onClick={() => { if (newCatName.trim()) createCatMutation.mutate({ name: newCatName.trim() }); }}
                    disabled={!newCatName.trim() || createCatMutation.isPending}
                    data-testid="button-add-ws-category"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {catsLoading ? (
                  <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
                ) : (expCats || []).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">لا توجد أنواع</p>
                ) : (
                  <div className="space-y-2">
                    {(expCats || []).map(cat => (
                      <div key={cat.id} className="flex items-center justify-between gap-2 p-3 rounded-md bg-muted/50" data-testid={`ws-category-row-${cat.id}`}>
                        <span className="text-sm font-medium">{cat.name}</span>
                        <Button size="icon" variant="ghost" onClick={() => deleteCatMutation.mutate(cat.id)} data-testid={`button-delete-ws-category-${cat.id}`}>
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
          {!isAppUser && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-workshop">
                <Plus className="w-4 h-4 ml-1" /> إضافة ورشة
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إضافة ورشة جديدة</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>اسم الورشة</Label>
                  <Input value={wsName} onChange={e => setWsName(e.target.value)} placeholder="اسم الورشة" data-testid="input-workshop-name" />
                </div>
                <Button
                  className="w-full"
                  onClick={() => {
                    if (!wsName) { toast({ title: "يرجى إدخال اسم الورشة", variant: "destructive" }); return; }
                    createWsMutation.mutate({ name: wsName });
                  }}
                  disabled={!wsName || createWsMutation.isPending}
                  data-testid="button-submit-workshop"
                >
                  إضافة
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          )}
        </div>
      </div>
      {isLoading ? (
        <div className="space-y-4">{[1, 2].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>
      ) : (workshops || []).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Factory className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground text-sm">لا توجد ورشات مسجلة</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {(workshops || []).map(ws => (
            <WorkshopCard key={ws.id} workshop={ws} expenseCategories={expCats || []} />
          ))}
        </div>
      )}
    </div>
  );
}

function WorkersTab() {
  const { toast } = useToast();
  const { user } = useAuth();
  const isAppUser = user?.role === "app_user";
  const [createOpen, setCreateOpen] = useState(false);
  const [workerName, setWorkerName] = useState("");
  const [workerPhone, setWorkerPhone] = useState("");

  const { data: workers, isLoading } = useQuery<Worker[]>({ queryKey: ["/api/workers"] });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/workers", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workers"] });
      setCreateOpen(false);
      setWorkerName("");
      setWorkerPhone("");
      toast({ title: "تم إضافة العامل بنجاح" });
    },
    onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/workers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workers"] });
      toast({ title: "تم حذف العامل" });
    },
    onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        {!isAppUser && (
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-worker">
              <Plus className="w-4 h-4 ml-1" /> إضافة عامل
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة عامل جديد</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>الاسم</Label>
                <Input value={workerName} onChange={e => setWorkerName(e.target.value)} placeholder="اسم العامل" data-testid="input-worker-name" />
              </div>
              <div className="space-y-2">
                <Label>الهاتف (اختياري)</Label>
                <Input value={workerPhone} onChange={e => setWorkerPhone(e.target.value)} placeholder="رقم الهاتف" dir="ltr" data-testid="input-worker-phone" />
              </div>
              <Button
                className="w-full"
                onClick={() => {
                  if (!workerName) { toast({ title: "يرجى إدخال الاسم", variant: "destructive" }); return; }
                  createMutation.mutate({ name: workerName, phone: workerPhone || undefined });
                }}
                disabled={!workerName || createMutation.isPending}
                data-testid="button-submit-worker"
              >
                إضافة
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        )}
      </div>
      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : (workers || []).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground text-sm">لا يوجد عمال مسجلين</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(workers || []).map(w => (
            <Card key={w.id} data-testid={`card-worker-${w.id}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-md bg-primary/10 text-primary">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium" data-testid={`text-worker-name-${w.id}`}>{w.name}</p>
                      {w.phone && <p className="text-xs text-muted-foreground" dir="ltr">{w.phone}</p>}
                    </div>
                  </div>
                  {!isAppUser && (
                  <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(w.id)} data-testid={`button-delete-worker-${w.id}`}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function SparePartCard({ item, machines }: { item: SparePartItem; machines: Machine[] }) {
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [pQty, setPQty] = useState("");
  const [pCost, setPCost] = useState("");
  const [pDate, setPDate] = useState(new Date().toISOString().split("T")[0]);

  const { data: purchases, isLoading: purchLoading } = useQuery<SparePartPurchase[]>({
    queryKey: [`/api/spare-parts/${item.id}/purchases`],
    enabled: expanded,
  });

  const { data: consumption } = useQuery<SparePartConsumption[]>({
    queryKey: ["/api/spare-parts-consumption"],
    enabled: expanded,
  });

  const itemConsumption = useMemo(() =>
    (consumption || []).filter(c => c.sparePartId === item.id),
    [consumption, item.id]
  );

  const addPurchaseMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", `/api/spare-parts/${item.id}/purchases`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/spare-parts/${item.id}/purchases`] });
      queryClient.invalidateQueries({ queryKey: ["/api/spare-parts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/factory-settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      setPurchaseOpen(false);
      setPQty("");
      setPCost("");
      setPDate(new Date().toISOString().split("T")[0]);
      toast({ title: "تم إضافة عملية الشراء" });
    },
    onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
  });

  return (
    <Card data-testid={`card-spare-part-${item.id}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-md bg-primary/10 text-primary">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-medium" data-testid={`text-spare-part-name-${item.id}`}>{item.name}</p>
              <p className="text-xs text-muted-foreground">الكمية: {formatAmount(item.quantity)} {item.unit}</p>
            </div>
          </div>
          <Button size="icon" variant="ghost" onClick={() => setExpanded(!expanded)} data-testid={`button-toggle-spare-part-${item.id}`}>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
        {expanded && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">المشتريات</p>
              <Dialog open={purchaseOpen} onOpenChange={setPurchaseOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" data-testid={`button-add-sp-purchase-${item.id}`}>
                    <Plus className="w-4 h-4 ml-1" /> شراء
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>شراء {item.name}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>الكمية</Label>
                      <Input type="number" value={pQty} onChange={e => setPQty(e.target.value)} placeholder="0" step="0.01" dir="ltr" data-testid="input-sp-purchase-qty" />
                    </div>
                    <div className="space-y-2">
                      <Label>التكلفة (د.ج)</Label>
                      <Input type="number" value={pCost} onChange={e => setPCost(e.target.value)} placeholder="0" step="0.01" dir="ltr" data-testid="input-sp-purchase-cost" />
                    </div>
                    <div className="space-y-2">
                      <Label>التاريخ</Label>
                      <Input type="date" value={pDate} onChange={e => setPDate(e.target.value)} data-testid="input-sp-purchase-date" />
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => {
                        if (!pQty) { toast({ title: "يرجى إدخال الكمية", variant: "destructive" }); return; }
                        addPurchaseMutation.mutate({ quantity: pQty, cost: pCost || "0", date: pDate });
                      }}
                      disabled={!pQty || addPurchaseMutation.isPending}
                      data-testid="button-submit-sp-purchase"
                    >
                      تأكيد الشراء
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            {purchLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (purchases || []).length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-2">لا توجد مشتريات</p>
            ) : (
              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="p-2 text-right font-medium">الكمية</th>
                      <th className="p-2 text-right font-medium">التكلفة</th>
                      <th className="p-2 text-right font-medium">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...(purchases || [])].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(p => (
                      <tr key={p.id} className="border-t" data-testid={`sp-purchase-row-${p.id}`}>
                        <td className="p-2">{formatAmount(p.quantity)} {item.unit}</td>
                        <td className="p-2" dir="ltr">{formatAmount(p.cost)} د.ج</td>
                        <td className="p-2 text-muted-foreground">{p.date || formatDateSimple(p.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {itemConsumption.length > 0 && (
              <>
                <p className="text-sm font-medium">الاستهلاك</p>
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="p-2 text-right font-medium">الماكينة</th>
                        <th className="p-2 text-right font-medium">الكمية</th>
                        <th className="p-2 text-right font-medium">التاريخ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itemConsumption.map(c => {
                        const machine = machines.find(m => m.id === c.machineId);
                        return (
                          <tr key={c.id} className="border-t" data-testid={`sp-consumption-row-${c.id}`}>
                            <td className="p-2">{machine?.name || c.machineId}</td>
                            <td className="p-2">{formatAmount(c.quantity)} {item.unit}</td>
                            <td className="p-2 text-muted-foreground">{c.date || formatDateSimple(c.createdAt)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SparePartsTab() {
  const { toast } = useToast();
  const { user } = useAuth();
  const isAppUser = user?.role === "app_user";
  const [createOpen, setCreateOpen] = useState(false);
  const [spName, setSpName] = useState("");
  const [spUnit, setSpUnit] = useState("قطعة");

  const { data: spareParts, isLoading } = useQuery<SparePartItem[]>({ queryKey: ["/api/spare-parts"] });
  const { data: allMachines } = useQuery<Machine[]>({ queryKey: ["/api/machines"] });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/spare-parts", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/spare-parts"] });
      setCreateOpen(false);
      setSpName("");
      setSpUnit("قطعة");
      toast({ title: "تم إضافة قطعة الغيار" });
    },
    onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/spare-parts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/spare-parts"] });
      toast({ title: "تم الحذف" });
    },
    onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-spare-part">
              <Plus className="w-4 h-4 ml-1" /> إضافة قطعة غيار
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة قطعة غيار</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>الاسم</Label>
                <Input value={spName} onChange={e => setSpName(e.target.value)} placeholder="اسم القطعة" data-testid="input-spare-part-name" />
              </div>
              <div className="space-y-2">
                <Label>الوحدة</Label>
                <Input value={spUnit} onChange={e => setSpUnit(e.target.value)} placeholder="قطعة" data-testid="input-spare-part-unit" />
              </div>
              <Button
                className="w-full"
                onClick={() => {
                  if (!spName) { toast({ title: "يرجى إدخال الاسم", variant: "destructive" }); return; }
                  createMutation.mutate({ name: spName, unit: spUnit });
                }}
                disabled={!spName || createMutation.isPending}
                data-testid="button-submit-spare-part"
              >
                إضافة
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : (spareParts || []).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Wrench className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground text-sm">لا توجد قطع غيار</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {(spareParts || []).map(sp => (
            <div key={sp.id} className="relative">
              <SparePartCard item={sp} machines={allMachines || []} />
              {!isAppUser && (
              <Button
                size="icon"
                variant="ghost"
                className="absolute top-3 left-14"
                onClick={() => deleteMutation.mutate(sp.id)}
                data-testid={`button-delete-spare-part-${sp.id}`}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RawMaterialCard({ item, workshops }: { item: RawMaterial; workshops: Workshop[] }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const isAppUser = user?.role === "app_user";
  const [expanded, setExpanded] = useState(false);
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [pQty, setPQty] = useState("");
  const [pCost, setPCost] = useState("");
  const [pDate, setPDate] = useState(new Date().toISOString().split("T")[0]);

  const { data: purchases, isLoading: purchLoading } = useQuery<RawMaterialPurchase[]>({
    queryKey: [`/api/raw-materials/${item.id}/purchases`],
    enabled: expanded,
  });

  const addPurchaseMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", `/api/raw-materials/${item.id}/purchases`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/raw-materials/${item.id}/purchases`] });
      queryClient.invalidateQueries({ queryKey: ["/api/raw-materials"] });
      queryClient.invalidateQueries({ queryKey: ["/api/factory-settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      setPurchaseOpen(false);
      setPQty("");
      setPCost("");
      setPDate(new Date().toISOString().split("T")[0]);
      toast({ title: "تم إضافة عملية الشراء" });
    },
    onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
  });

  const wsName = workshops.find(w => w.id === item.workshopId)?.name;

  return (
    <Card data-testid={`card-raw-material-${item.id}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-md bg-primary/10 text-primary">
              <Boxes className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-medium" data-testid={`text-raw-material-name-${item.id}`}>{item.name}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground">الكمية: {formatAmount(item.quantity)} {item.unit}</span>
                {wsName && <Badge variant="secondary" className="text-xs no-default-active-elevate">{wsName}</Badge>}
              </div>
            </div>
          </div>
          <Button size="icon" variant="ghost" onClick={() => setExpanded(!expanded)} data-testid={`button-toggle-raw-material-${item.id}`}>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
        {expanded && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">المشتريات</p>
              {!isAppUser && (
              <Dialog open={purchaseOpen} onOpenChange={setPurchaseOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" data-testid={`button-add-rm-purchase-${item.id}`}>
                    <Plus className="w-4 h-4 ml-1" /> شراء
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>شراء {item.name}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>الكمية</Label>
                      <Input type="number" value={pQty} onChange={e => setPQty(e.target.value)} placeholder="0" step="0.01" dir="ltr" data-testid="input-rm-purchase-qty" />
                    </div>
                    <div className="space-y-2">
                      <Label>التكلفة (د.ج)</Label>
                      <Input type="number" value={pCost} onChange={e => setPCost(e.target.value)} placeholder="0" step="0.01" dir="ltr" data-testid="input-rm-purchase-cost" />
                    </div>
                    <div className="space-y-2">
                      <Label>التاريخ</Label>
                      <Input type="date" value={pDate} onChange={e => setPDate(e.target.value)} data-testid="input-rm-purchase-date" />
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => {
                        if (!pQty) { toast({ title: "يرجى إدخال الكمية", variant: "destructive" }); return; }
                        addPurchaseMutation.mutate({ quantity: pQty, cost: pCost || "0", date: pDate });
                      }}
                      disabled={!pQty || addPurchaseMutation.isPending}
                      data-testid="button-submit-rm-purchase"
                    >
                      تأكيد الشراء
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              )}
            </div>
            {purchLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (purchases || []).length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-2">لا توجد مشتريات</p>
            ) : (
              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="p-2 text-right font-medium">الكمية</th>
                      <th className="p-2 text-right font-medium">التكلفة</th>
                      <th className="p-2 text-right font-medium">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...(purchases || [])].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(p => (
                      <tr key={p.id} className="border-t" data-testid={`rm-purchase-row-${p.id}`}>
                        <td className="p-2">{formatAmount(p.quantity)} {item.unit}</td>
                        <td className="p-2" dir="ltr">{formatAmount(p.cost)} د.ج</td>
                        <td className="p-2 text-muted-foreground">{p.date || formatDateSimple(p.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RawMaterialsTab() {
  const { toast } = useToast();
  const { user } = useAuth();
  const isAppUser = user?.role === "app_user";
  const [createOpen, setCreateOpen] = useState(false);
  const [rmName, setRmName] = useState("");
  const [rmUnit, setRmUnit] = useState("kg");
  const [rmWorkshopId, setRmWorkshopId] = useState("");

  const { data: rawMaterials, isLoading } = useQuery<RawMaterial[]>({ queryKey: ["/api/raw-materials"] });
  const { data: workshops } = useQuery<Workshop[]>({ queryKey: ["/api/workshops"] });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/raw-materials", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/raw-materials"] });
      setCreateOpen(false);
      setRmName("");
      setRmUnit("kg");
      setRmWorkshopId("");
      toast({ title: "تم إضافة المادة الأولية" });
    },
    onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/raw-materials/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/raw-materials"] });
      toast({ title: "تم الحذف" });
    },
    onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        {!isAppUser && (
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-raw-material">
              <Plus className="w-4 h-4 ml-1" /> إضافة مادة أولية
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة مادة أولية</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>الاسم</Label>
                <Input value={rmName} onChange={e => setRmName(e.target.value)} placeholder="اسم المادة" data-testid="input-raw-material-name" />
              </div>
              <div className="space-y-2">
                <Label>الوحدة</Label>
                <Input value={rmUnit} onChange={e => setRmUnit(e.target.value)} placeholder="kg" data-testid="input-raw-material-unit" />
              </div>
              <div className="space-y-2">
                <Label>الورشة (اختياري)</Label>
                <Select value={rmWorkshopId} onValueChange={setRmWorkshopId}>
                  <SelectTrigger data-testid="select-raw-material-workshop">
                    <SelectValue placeholder="اختر الورشة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">بدون ورشة</SelectItem>
                    {(workshops || []).map(ws => (
                      <SelectItem key={ws.id} value={ws.id}>{ws.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full"
                onClick={() => {
                  if (!rmName) { toast({ title: "يرجى إدخال الاسم", variant: "destructive" }); return; }
                  createMutation.mutate({
                    name: rmName,
                    unit: rmUnit,
                    workshopId: rmWorkshopId && rmWorkshopId !== "none" ? rmWorkshopId : undefined,
                  });
                }}
                disabled={!rmName || createMutation.isPending}
                data-testid="button-submit-raw-material"
              >
                إضافة
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        )}
      </div>
      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : (rawMaterials || []).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Boxes className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground text-sm">لا توجد مواد أولية</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {(rawMaterials || []).map(rm => (
            <div key={rm.id} className="relative">
              <RawMaterialCard item={rm} workshops={workshops || []} />
              {!isAppUser && (
              <Button
                size="icon"
                variant="ghost"
                className="absolute top-3 left-14"
                onClick={() => deleteMutation.mutate(rm.id)}
                data-testid={`button-delete-raw-material-${rm.id}`}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DailyProductionTab() {
  const { toast } = useToast();
  const { user } = useAuth();
  const isAppUser = user?.role === "app_user";
  const [selectedMachine, setSelectedMachine] = useState("");
  const [selectedWorker, setSelectedWorker] = useState("");
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split("T")[0]);
  const [outputValue, setOutputValue] = useState("");
  const [oldCounter, setOldCounter] = useState("");
  const [newCounter, setNewCounter] = useState("");
  const [sparePartId, setSparePartId] = useState("");
  const [sparePartQty, setSparePartQty] = useState("");

  const { data: allMachines } = useQuery<Machine[]>({ queryKey: ["/api/machines"] });
  const { data: workers } = useQuery<Worker[]>({ queryKey: ["/api/workers"] });
  const { data: allEntries, isLoading: entriesLoading } = useQuery<MachineDailyEntry[]>({ queryKey: ["/api/machine-entries"] });
  const { data: spareParts } = useQuery<SparePartItem[]>({ queryKey: ["/api/spare-parts"] });

  const selectedMachineObj = (allMachines || []).find(m => m.id === selectedMachine);
  const isWeight = selectedMachineObj?.type === "weight";
  const calculatedOutput = isWeight ? Number(outputValue || 0) : Math.max(0, Number(newCounter || 0) - Number(oldCounter || 0));

  const addEntryMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/machines/${selectedMachine}/entries`, data);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/machine-entries"] });
      if (selectedMachine) {
        queryClient.invalidateQueries({ queryKey: [`/api/machines/${selectedMachine}/entries`] });
      }
      setOutputValue("");
      setOldCounter("");
      setNewCounter("");
      toast({ title: "تم تسجيل الإنتاج بنجاح" });
    },
    onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
  });

  const addConsumptionMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", `/api/machines/${selectedMachine}/spare-parts-consumption`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/spare-parts-consumption"] });
      queryClient.invalidateQueries({ queryKey: ["/api/spare-parts"] });
      setSparePartId("");
      setSparePartQty("");
      toast({ title: "تم تسجيل استهلاك قطع الغيار" });
    },
    onError: () => toast({ title: "حدث خطأ في تسجيل الاستهلاك", variant: "destructive" }),
  });

  const deleteEntryMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/machine-entries/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/machine-entries"] });
      toast({ title: "تم حذف السجل" });
    },
    onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
  });

  const handleSubmit = async () => {
    if (!selectedMachine || !selectedWorker) {
      toast({ title: "يرجى اختيار الماكينة والعامل", variant: "destructive" });
      return;
    }
    const entryData: any = {
      workerId: selectedWorker,
      date: entryDate,
      outputValue: String(calculatedOutput),
      oldCounter: isWeight ? "0" : (oldCounter || "0"),
      newCounter: isWeight ? "0" : (newCounter || "0"),
    };
    await addEntryMutation.mutateAsync(entryData);

    if (sparePartId && sparePartQty) {
      addConsumptionMutation.mutate({
        sparePartId,
        quantity: sparePartQty,
        date: entryDate,
      });
    }
  };

  const sortedEntries = [...(allEntries || [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList className="w-5 h-5" /> تسجيل إنتاج يومي
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>الماكينة</Label>
              <Select value={selectedMachine} onValueChange={v => { setSelectedMachine(v); setOutputValue(""); setOldCounter(""); setNewCounter(""); }}>
                <SelectTrigger data-testid="select-entry-machine">
                  <SelectValue placeholder="اختر الماكينة" />
                </SelectTrigger>
                <SelectContent>
                  {(allMachines || []).map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>العامل</Label>
              <Select value={selectedWorker} onValueChange={setSelectedWorker}>
                <SelectTrigger data-testid="select-entry-worker">
                  <SelectValue placeholder="اختر العامل" />
                </SelectTrigger>
                <SelectContent>
                  {(workers || []).map(w => (
                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>التاريخ</Label>
              <Input type="date" value={entryDate} onChange={e => setEntryDate(e.target.value)} data-testid="input-entry-date" />
            </div>
          </div>

          {selectedMachineObj && (
            <div className="space-y-3">
              {isWeight ? (
                <div className="space-y-2">
                  <Label>قيمة الإنتاج ({selectedMachineObj.unit})</Label>
                  <Input type="number" value={outputValue} onChange={e => setOutputValue(e.target.value)} placeholder="0" step="0.01" dir="ltr" data-testid="input-output-value" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>العداد القديم</Label>
                    <Input type="number" value={oldCounter} onChange={e => setOldCounter(e.target.value)} placeholder="0" step="0.01" dir="ltr" data-testid="input-old-counter" />
                  </div>
                  <div className="space-y-2">
                    <Label>العداد الجديد</Label>
                    <Input type="number" value={newCounter} onChange={e => setNewCounter(e.target.value)} placeholder="0" step="0.01" dir="ltr" data-testid="input-new-counter" />
                  </div>
                </div>
              )}
              {calculatedOutput > 0 && (
                <div className="p-3 rounded-md bg-muted/50 text-sm">
                  <span className="text-muted-foreground">الإنتاج: </span>
                  <span className="font-bold">{formatAmount(calculatedOutput)} {selectedMachineObj.unit}</span>
                  <span className="text-muted-foreground mx-2">|</span>
                  <span className="text-muted-foreground">المتوقع: </span>
                  <span className="font-bold">{formatAmount(selectedMachineObj.expectedDailyOutput)} {selectedMachineObj.unit}</span>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>قطعة غيار مستهلكة (اختياري)</Label>
              <Select value={sparePartId} onValueChange={setSparePartId}>
                <SelectTrigger data-testid="select-entry-spare-part">
                  <SelectValue placeholder="اختر قطعة الغيار" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون</SelectItem>
                  {(spareParts || []).map(sp => (
                    <SelectItem key={sp.id} value={sp.id}>{sp.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {sparePartId && sparePartId !== "none" && (
              <div className="space-y-2">
                <Label>الكمية المستهلكة</Label>
                <Input type="number" value={sparePartQty} onChange={e => setSparePartQty(e.target.value)} placeholder="0" step="0.01" dir="ltr" data-testid="input-entry-spare-part-qty" />
              </div>
            )}
          </div>

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={!selectedMachine || !selectedWorker || addEntryMutation.isPending}
            data-testid="button-submit-entry"
          >
            {addEntryMutation.isPending ? "جاري التسجيل..." : "تسجيل الإنتاج"}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h3 className="text-lg font-bold" data-testid="text-recent-entries-title">السجلات الأخيرة</h3>
        {entriesLoading ? (
          <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
        ) : sortedEntries.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ClipboardList className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground text-sm">لا توجد سجلات إنتاج</p>
            </CardContent>
          </Card>
        ) : (
          sortedEntries.slice(0, 50).map(entry => {
            const machine = (allMachines || []).find(m => m.id === entry.machineId);
            const worker = (workers || []).find(w => w.id === entry.workerId);
            const output = Number(entry.outputValue);
            const expected = Number(machine?.expectedDailyOutput || 0);
            let statusBadge: { variant: "destructive" | "default" | "secondary"; label: string };
            if (expected > 0 && output < expected) {
              statusBadge = { variant: "destructive", label: "أقل من المتوقع - مشكلة" };
            } else if (expected > 0 && output > expected) {
              statusBadge = { variant: "default", label: "أكثر من المتوقع - تحفيز" };
            } else {
              statusBadge = { variant: "secondary", label: "عادي" };
            }

            return (
              <Card key={entry.id} data-testid={`card-entry-${entry.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center justify-center w-9 h-9 rounded-md bg-primary/10 text-primary">
                        <Cog className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium" data-testid={`text-entry-machine-${entry.id}`}>{machine?.name || "—"}</span>
                          <span className="text-xs text-muted-foreground">{worker?.name || "—"}</span>
                          <span className="text-xs text-muted-foreground">{entry.date || formatDateSimple(entry.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-sm font-bold" dir="ltr" data-testid={`text-entry-output-${entry.id}`}>
                            {formatAmount(output)} {machine?.unit || ""}
                          </span>
                          <Badge variant={statusBadge.variant} className="text-xs no-default-active-elevate" data-testid={`badge-entry-status-${entry.id}`}>
                            {statusBadge.label}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    {!isAppUser && (
                    <Button size="icon" variant="ghost" onClick={() => deleteEntryMutation.mutate(entry.id)} data-testid={`button-delete-entry-${entry.id}`}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

function StatisticsTab() {
  const { hasPermission, user } = useAuth();
  const canViewTotals = user?.role !== "app_user" || hasPermission("view_totals");
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(String(now.getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()));

  const { data: allMachines } = useQuery<Machine[]>({ queryKey: ["/api/machines"] });
  const { data: workshops } = useQuery<Workshop[]>({ queryKey: ["/api/workshops"] });
  const { data: allEntries, isLoading } = useQuery<MachineDailyEntry[]>({ queryKey: ["/api/machine-entries"] });
  const { data: allConsumption } = useQuery<SparePartConsumption[]>({ queryKey: ["/api/spare-parts-consumption"] });
  const { data: spareParts } = useQuery<SparePartItem[]>({ queryKey: ["/api/spare-parts"] });

  const stats = useMemo(() => {
    if (!allMachines || !allEntries) return [];

    const month = Number(selectedMonth);
    const year = Number(selectedYear);

    const monthEntries = allEntries.filter(e => {
      const d = e.date ? new Date(e.date) : new Date(e.createdAt);
      return d.getMonth() + 1 === month && d.getFullYear() === year;
    });

    const monthConsumption = (allConsumption || []).filter(c => {
      const d = c.date ? new Date(c.date) : new Date(c.createdAt);
      return d.getMonth() + 1 === month && d.getFullYear() === year;
    });

    return allMachines.map(machine => {
      const machineEntries = monthEntries.filter(e => e.machineId === machine.id);
      const daysWorked = machineEntries.length;
      const totalOutput = machineEntries.reduce((s, e) => s + Number(e.outputValue), 0);
      const avgOutput = daysWorked > 0 ? totalOutput / daysWorked : 0;
      const expectedTotal = Number(machine.expectedDailyOutput) * daysWorked;
      const performance = expectedTotal > 0 ? (totalOutput / expectedTotal) * 100 : 0;
      const ws = (workshops || []).find(w => w.id === machine.workshopId);

      const machineConsumption = monthConsumption.filter(c => c.machineId === machine.id);
      const consumptionDetails = machineConsumption.map(c => {
        const sp = (spareParts || []).find(s => s.id === c.sparePartId);
        return { name: sp?.name || "—", quantity: Number(c.quantity) };
      });

      let status: { label: string; variant: "default" | "destructive" | "secondary" };
      if (daysWorked === 0) {
        status = { label: "لم تعمل", variant: "secondary" };
      } else if (performance >= 100) {
        status = { label: "ممتاز", variant: "default" };
      } else if (performance >= 70) {
        status = { label: "جيد", variant: "default" };
      } else {
        status = { label: "ضعيف", variant: "destructive" };
      }

      return {
        machine,
        workshopName: ws?.name || "—",
        daysWorked,
        totalOutput,
        avgOutput,
        expectedTotal,
        performance,
        consumptionDetails,
        status,
      };
    });
  }, [allMachines, allEntries, allConsumption, spareParts, workshops, selectedMonth, selectedYear]);

  const totalMachines = stats.length;
  const machinesWorked = stats.filter(s => s.daysWorked > 0).length;
  const machinesIdle = totalMachines - machinesWorked;
  const totalProduction = stats.reduce((s, st) => s + st.totalOutput, 0);

  const years = [];
  for (let y = now.getFullYear(); y >= now.getFullYear() - 5; y--) years.push(String(y));
  const months = [
    { value: "1", label: "جانفي" }, { value: "2", label: "فيفري" }, { value: "3", label: "مارس" },
    { value: "4", label: "أفريل" }, { value: "5", label: "ماي" }, { value: "6", label: "جوان" },
    { value: "7", label: "جويلية" }, { value: "8", label: "أوت" }, { value: "9", label: "سبتمبر" },
    { value: "10", label: "أكتوبر" }, { value: "11", label: "نوفمبر" }, { value: "12", label: "ديسمبر" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="space-y-1">
          <Label>الشهر</Label>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-32" data-testid="select-stat-month">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map(m => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>السنة</Label>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-28" data-testid="select-stat-year">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map(y => (
                <SelectItem key={y} value={y}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {canViewTotals && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">إجمالي الماكينات</p>
              <p className="text-2xl font-bold" data-testid="stat-total-machines">{totalMachines}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">ماكينات عملت</p>
              <p className="text-2xl font-bold text-green-600" data-testid="stat-machines-worked">{machinesWorked}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">ماكينات لم تعمل</p>
              <p className="text-2xl font-bold text-red-600" data-testid="stat-machines-idle">{machinesIdle}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">إجمالي الإنتاج</p>
              <p className="text-2xl font-bold" data-testid="stat-total-production">{formatAmount(totalProduction)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : stats.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground text-sm">لا توجد ماكينات</p>
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-md overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="p-2 text-right font-medium">الماكينة</th>
                <th className="p-2 text-right font-medium">الورشة</th>
                <th className="p-2 text-right font-medium">أيام العمل</th>
                <th className="p-2 text-right font-medium">الإنتاج الكلي</th>
                <th className="p-2 text-right font-medium">المعدل اليومي</th>
                <th className="p-2 text-right font-medium">المتوقع</th>
                <th className="p-2 text-right font-medium">الأداء</th>
                <th className="p-2 text-right font-medium">قطع الغيار</th>
                <th className="p-2 text-right font-medium">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {stats.map(s => (
                <tr key={s.machine.id} className="border-t" data-testid={`stat-row-${s.machine.id}`}>
                  <td className="p-2 font-medium">{s.machine.name}</td>
                  <td className="p-2 text-muted-foreground">{s.workshopName}</td>
                  <td className="p-2">{s.daysWorked}</td>
                  <td className="p-2" dir="ltr">{formatAmount(s.totalOutput)} {s.machine.unit}</td>
                  <td className="p-2" dir="ltr">{formatAmount(s.avgOutput)} {s.machine.unit}</td>
                  <td className="p-2" dir="ltr">{formatAmount(s.expectedTotal)} {s.machine.unit}</td>
                  <td className="p-2">
                    <span className={s.performance >= 100 ? "text-green-600 font-bold" : s.performance >= 70 ? "font-medium" : "text-red-600 font-bold"}>
                      {s.daysWorked > 0 ? `${s.performance.toFixed(0)}%` : "—"}
                    </span>
                  </td>
                  <td className="p-2">
                    {s.consumptionDetails.length > 0 ? (
                      <div className="text-xs space-y-0.5">
                        {s.consumptionDetails.map((cd, i) => (
                          <div key={i}>{cd.name}: {formatAmount(cd.quantity)}</div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                  <td className="p-2">
                    <Badge variant={s.status.variant} className="text-xs no-default-active-elevate" data-testid={`badge-stat-status-${s.machine.id}`}>
                      {s.status.label}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function FactoryPage() {
  const { toast } = useToast();
  const { hasPermission, user } = useAuth();
  const canViewTotals = user?.role !== "app_user" || hasPermission("view_totals");
  const isAppUser = user?.role === "app_user";
  const [fundDialogOpen, setFundDialogOpen] = useState(false);
  const [fundAmount, setFundAmount] = useState("");
  const [fundType, setFundType] = useState<"add" | "withdraw">("add");

  const { data: factorySettings } = useQuery<{ id: string; balance: string }>({
    queryKey: ["/api/factory-settings"],
  });

  const fundMutation = useMutation({
    mutationFn: (data: { amount: string; type: string }) =>
      apiRequest("PATCH", "/api/factory-settings/balance", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/factory-settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      setFundDialogOpen(false);
      setFundAmount("");
      toast({ title: fundType === "add" ? "تم إضافة المبلغ للمصنع" : "تم سحب المبلغ من المصنع" });
    },
    onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
  });

  const factoryBalance = Number(factorySettings?.balance || 0);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-factory-title">إدارة المصنع</h1>
          <p className="text-muted-foreground text-sm mt-1">إدارة الورشات والماكينات والإنتاج اليومي</p>
        </div>
        {canViewTotals && (
          <Card data-testid="card-factory-balance">
            <CardContent className="p-4 flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">رصيد المصنع:</span>
                <span className={`text-lg font-bold ${factoryBalance >= 0 ? "text-green-600" : "text-red-600"}`} data-testid="text-factory-balance">
                  {formatAmount(factorySettings?.balance || "0")}
                </span>
              </div>
              {!isAppUser && (
              <Dialog open={fundDialogOpen} onOpenChange={setFundDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" data-testid="button-fund-factory">
                    <Wallet className="w-4 h-4 ml-1" /> إدارة الرصيد
                  </Button>
                </DialogTrigger>
                <DialogContent dir="rtl">
                  <DialogHeader>
                    <DialogTitle>إدارة رصيد المصنع</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Button
                        variant={fundType === "add" ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => setFundType("add")}
                        data-testid="button-fund-add"
                      >
                        <ArrowDownCircle className="w-4 h-4 ml-1" /> إيداع
                      </Button>
                      <Button
                        variant={fundType === "withdraw" ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => setFundType("withdraw")}
                        data-testid="button-fund-withdraw"
                      >
                        <ArrowUpCircle className="w-4 h-4 ml-1" /> سحب
                      </Button>
                    </div>
                    <div>
                      <Label>المبلغ</Label>
                      <Input
                        type="number"
                        value={fundAmount}
                        onChange={e => setFundAmount(e.target.value)}
                        placeholder="أدخل المبلغ"
                        data-testid="input-fund-amount"
                      />
                    </div>
                    <Button
                      className="w-full"
                      disabled={!fundAmount || fundMutation.isPending}
                      onClick={() => fundMutation.mutate({ amount: fundAmount, type: fundType })}
                      data-testid="button-fund-submit"
                    >
                      {fundType === "add" ? "إيداع" : "سحب"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <Tabs defaultValue="workshops" dir="rtl">
        <TabsList className="flex flex-wrap gap-1">
          <TabsTrigger value="workshops" data-testid="tab-workshops">
            <Factory className="w-4 h-4 ml-1" /> الورشات
          </TabsTrigger>
          <TabsTrigger value="workers" data-testid="tab-workers">
            <Users className="w-4 h-4 ml-1" /> العمال
          </TabsTrigger>
          <TabsTrigger value="spare-parts" data-testid="tab-spare-parts">
            <Wrench className="w-4 h-4 ml-1" /> مخزن قطع الغيار
          </TabsTrigger>
          <TabsTrigger value="raw-materials" data-testid="tab-raw-materials">
            <Boxes className="w-4 h-4 ml-1" /> المواد الأولية
          </TabsTrigger>
          <TabsTrigger value="daily-production" data-testid="tab-daily-production">
            <ClipboardList className="w-4 h-4 ml-1" /> الإنتاج اليومي
          </TabsTrigger>
          <TabsTrigger value="statistics" data-testid="tab-statistics">
            <BarChart3 className="w-4 h-4 ml-1" /> الإحصائيات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workshops" className="mt-4">
          <WorkshopsTab />
        </TabsContent>
        <TabsContent value="workers" className="mt-4">
          <WorkersTab />
        </TabsContent>
        <TabsContent value="spare-parts" className="mt-4">
          <SparePartsTab />
        </TabsContent>
        <TabsContent value="raw-materials" className="mt-4">
          <RawMaterialsTab />
        </TabsContent>
        <TabsContent value="daily-production" className="mt-4">
          <DailyProductionTab />
        </TabsContent>
        <TabsContent value="statistics" className="mt-4">
          <StatisticsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
