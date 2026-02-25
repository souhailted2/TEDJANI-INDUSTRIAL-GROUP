import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { FolderKanban, Plus, Trash2, ChevronDown, ChevronUp, ArrowDown, ArrowUp, TrendingUp, TrendingDown } from "lucide-react";
import type { Project, ProjectTransaction } from "@shared/schema";

function ProjectCard({ project }: { project: Project }) {
  const { toast } = useToast();
  const { hasPermission, user } = useAuth();
  const canViewTotals = user?.role !== "app_user" || hasPermission("view_totals");
  const isAppUser = user?.role === "app_user";
  const [expanded, setExpanded] = useState(false);
  const [txDialogOpen, setTxDialogOpen] = useState(false);
  const [txType, setTxType] = useState("income");
  const [txAmount, setTxAmount] = useState("");
  const [txDescription, setTxDescription] = useState("");
  const [txDate, setTxDate] = useState(new Date().toISOString().split("T")[0]);

  const { data: transactions, isLoading: txLoading } = useQuery<ProjectTransaction[]>({
    queryKey: [`/api/projects/${project.id}/transactions`],
    enabled: expanded,
  });

  const addTxMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", `/api/projects/${project.id}/transactions`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${project.id}/transactions`] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      setTxDialogOpen(false);
      setTxAmount("");
      setTxDescription("");
      setTxType("income");
      setTxDate(new Date().toISOString().split("T")[0]);
      toast({ title: "تم تسجيل العملية بنجاح" });
    },
    onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
  });

  const deleteTxMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/projects/${project.id}/transactions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${project.id}/transactions`] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      toast({ title: "تم حذف العملية" });
    },
    onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
  });

  const deleteProjectMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/projects/${project.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      toast({ title: "تم حذف المشروع" });
    },
    onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
  });

  const balance = Number(project.balance);
  const sortedTxs = [...(transactions || [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const totalIncome = sortedTxs.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = sortedTxs.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);

  return (
    <Card data-testid={`project-card-${project.id}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <div className="flex items-center gap-3 flex-1">
          <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10 text-primary">
            <FolderKanban className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-base" data-testid={`text-project-name-${project.id}`}>{project.name}</CardTitle>
            {project.description && (
              <p className="text-xs text-muted-foreground mt-0.5">{project.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canViewTotals && (
            <Badge variant={balance >= 0 ? "default" : "destructive"} data-testid={`text-project-balance-${project.id}`}>
              {formatAmount(balance)} د.ج
            </Badge>
          )}
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setExpanded(!expanded)}
            data-testid={`button-toggle-project-${project.id}`}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-4 text-sm">
              <span className="text-green-600 flex items-center gap-1">
                <ArrowDown className="w-3 h-3" /> دخول: {formatAmount(totalIncome)} د.ج
              </span>
              <span className="text-red-600 flex items-center gap-1">
                <ArrowUp className="w-3 h-3" /> خروج: {formatAmount(totalExpense)} د.ج
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Dialog open={txDialogOpen} onOpenChange={setTxDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" data-testid={`button-add-tx-${project.id}`}>
                    <Plus className="w-4 h-4 ml-1" /> تسجيل عملية
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>تسجيل عملية - {project.name}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>نوع العملية</Label>
                      <Select value={txType} onValueChange={setTxType}>
                        <SelectTrigger data-testid="select-tx-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="income">دخول أموال</SelectItem>
                          <SelectItem value="expense">خروج أموال</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
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
                      <Label>وصف (اختياري)</Label>
                      <Textarea
                        value={txDescription}
                        onChange={(e) => setTxDescription(e.target.value)}
                        placeholder="وصف العملية"
                        data-testid="input-tx-description"
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
                    <Button
                      className="w-full"
                      onClick={() => {
                        if (!txAmount) {
                          toast({ title: "يرجى إدخال المبلغ", variant: "destructive" });
                          return;
                        }
                        addTxMutation.mutate({
                          type: txType,
                          amount: txAmount,
                          description: txDescription || undefined,
                          date: txDate,
                        });
                      }}
                      disabled={!txAmount || addTxMutation.isPending}
                      data-testid="button-submit-tx"
                    >
                      تسجيل العملية
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              {!isAppUser && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  if (confirm("هل أنت متأكد من حذف هذا المشروع وجميع عملياته؟")) {
                    deleteProjectMutation.mutate();
                  }
                }}
                data-testid={`button-delete-project-${project.id}`}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
              )}
            </div>
          </div>

          {txLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : sortedTxs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">لا توجد عمليات مسجلة</p>
          ) : (
            <div className="border rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="p-2 text-right font-medium">التاريخ</th>
                    <th className="p-2 text-right font-medium">النوع</th>
                    <th className="p-2 text-right font-medium">المبلغ</th>
                    <th className="p-2 text-right font-medium">الوصف</th>
                    {!isAppUser && <th className="p-2 text-center font-medium">حذف</th>}
                  </tr>
                </thead>
                <tbody>
                  {sortedTxs.map((tx) => (
                    <tr key={tx.id} className="border-t" data-testid={`tx-row-${tx.id}`}>
                      <td className="p-2 text-muted-foreground">{tx.date || formatDateSimple(tx.createdAt)}</td>
                      <td className="p-2">
                        <Badge variant={tx.type === "income" ? "default" : "destructive"} className="no-default-active-elevate">
                          {tx.type === "income" ? (
                            <><TrendingUp className="w-3 h-3 ml-1" /> دخول</>
                          ) : (
                            <><TrendingDown className="w-3 h-3 ml-1" /> خروج</>
                          )}
                        </Badge>
                      </td>
                      <td className="p-2 font-medium" dir="ltr">
                        <span className={tx.type === "income" ? "text-green-600" : "text-red-600"}>
                          {tx.type === "income" ? "+" : "-"}{formatAmount(Number(tx.amount))}
                        </span>
                      </td>
                      <td className="p-2 text-muted-foreground">{tx.description || "-"}</td>
                      {!isAppUser && (
                      <td className="p-2 text-center">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteTxMutation.mutate(tx.id)}
                          disabled={deleteTxMutation.isPending}
                          data-testid={`button-delete-tx-${tx.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export default function Projects() {
  const { toast } = useToast();
  const { hasPermission, user } = useAuth();
  const canViewTotals = user?.role !== "app_user" || hasPermission("view_totals");
  const isAppUser = user?.role === "app_user";
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const { data: projectsList, isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/projects", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setCreateOpen(false);
      setName("");
      setDescription("");
      toast({ title: "تم إنشاء المشروع بنجاح" });
    },
    onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
  });

  const sortedProjects = [...(projectsList || [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const totalBalance = sortedProjects.reduce((s, p) => s + Number(p.balance), 0);

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-projects-title">المشاريع</h1>
          <p className="text-muted-foreground text-sm mt-1">إدارة المشاريع وتتبع دخول وخروج الأموال</p>
        </div>
        {!isAppUser && (
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-project">
              <Plus className="w-4 h-4 ml-1" /> إضافة مشروع
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة مشروع جديد</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>اسم المشروع</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="اسم المشروع"
                  data-testid="input-project-name"
                />
              </div>
              <div className="space-y-2">
                <Label>وصف (اختياري)</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="وصف المشروع"
                  data-testid="input-project-description"
                />
              </div>
              <Button
                className="w-full"
                onClick={() => {
                  if (!name) {
                    toast({ title: "يرجى إدخال اسم المشروع", variant: "destructive" });
                    return;
                  }
                  createMutation.mutate({ name, description: description || undefined });
                }}
                disabled={!name || createMutation.isPending}
                data-testid="button-submit-project"
              >
                إضافة
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        )}
      </div>

      {canViewTotals && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">عدد المشاريع</CardTitle>
              <FolderKanban className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-24" /> : (
                <div className="text-2xl font-bold" data-testid="stat-projects-count">{sortedProjects.length}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي الرصيد</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-24" /> : (
                <div className={`text-2xl font-bold ${totalBalance >= 0 ? "text-green-600" : "text-red-600"}`} data-testid="stat-total-balance">
                  {formatAmount(totalBalance)} د.ج
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : sortedProjects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FolderKanban className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">لا توجد مشاريع مسجلة</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
