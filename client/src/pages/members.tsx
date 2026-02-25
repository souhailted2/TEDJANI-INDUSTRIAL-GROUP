import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatAmount, formatDateSimple, buildWhatsAppLink } from "@/lib/format";
import { Plus, Users, Trash2, Wallet, Tag, X, Send, MessageCircle, User } from "lucide-react";
import type { Member, MemberType, MemberTransfer } from "@shared/schema";

export default function Members() {
  const { toast } = useToast();
  const { hasPermission, user } = useAuth();
  const canViewTotals = user?.role !== "app_user" || hasPermission("view_totals");
  const isAppUser = user?.role === "app_user";
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [typeDialogOpen, setTypeDialogOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [transferMember, setTransferMember] = useState<Member | null>(null);

  const [newTypeName, setNewTypeName] = useState("");
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberPhone, setNewMemberPhone] = useState("");
  const [newMemberTypeId, setNewMemberTypeId] = useState("");

  const [transferAmount, setTransferAmount] = useState("");
  const [transferNote, setTransferNote] = useState("");
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split("T")[0]);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingMember, setDeletingMember] = useState<Member | null>(null);

  const [deleteTransferDialogOpen, setDeleteTransferDialogOpen] = useState(false);
  const [deletingTransfer, setDeletingTransfer] = useState<MemberTransfer | null>(null);

  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const { data: memberTypes, isLoading: typesLoading } = useQuery<MemberType[]>({
    queryKey: ["/api/member-types"],
  });

  const { data: members, isLoading: membersLoading } = useQuery<Member[]>({
    queryKey: ["/api/members"],
  });

  const { data: memberTransfers } = useQuery<MemberTransfer[]>({
    queryKey: ["/api/member-transfers"],
  });

  const createTypeMutation = useMutation({
    mutationFn: async (data: { name: string }) => {
      const res = await apiRequest("POST", "/api/member-types", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/member-types"] });
      setNewTypeName("");
      toast({ title: "تم إضافة نوع العضو بنجاح" });
    },
    onError: (err: Error) => {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    },
  });

  const deleteTypeMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/member-types/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/member-types"] });
      toast({ title: "تم حذف نوع العضو" });
    },
    onError: (err: Error) => {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    },
  });

  const createMemberMutation = useMutation({
    mutationFn: async (data: { name: string; phone?: string; typeId: string }) => {
      const res = await apiRequest("POST", "/api/members", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      setMemberDialogOpen(false);
      setNewMemberName("");
      setNewMemberPhone("");
      setNewMemberTypeId("");
      toast({ title: "تم إضافة العضو بنجاح" });
    },
    onError: (err: Error) => {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    },
  });

  const deleteMemberMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/members/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/member-transfers"] });
      setDeleteDialogOpen(false);
      setDeletingMember(null);
      if (selectedMember && deletingMember && selectedMember.id === deletingMember.id) {
        setSelectedMember(null);
      }
      toast({ title: "تم حذف العضو بنجاح" });
    },
    onError: (err: Error) => {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    },
  });

  const createTransferMutation = useMutation({
    mutationFn: async (data: { memberId: string; amount: string; note?: string }) => {
      const res = await apiRequest("POST", "/api/member-transfers", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/member-transfers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setTransferDialogOpen(false);
      setTransferAmount("");
      setTransferNote("");
      setTransferDate(new Date().toISOString().split("T")[0]);
      setTransferMember(null);
      toast({ title: "تم تحويل المبلغ بنجاح" });
    },
    onError: (err: Error) => {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    },
  });

  const deleteTransferMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/member-transfers/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/member-transfers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setDeleteTransferDialogOpen(false);
      setDeletingTransfer(null);
      toast({ title: "تم حذف التحويل بنجاح" });
    },
    onError: (err: Error) => {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    },
  });

  const getTypeName = (typeId: string) => {
    return (memberTypes || []).find(t => t.id === typeId)?.name || typeId;
  };

  const getMemberName = (memberId: string) => {
    return (members || []).find(m => m.id === memberId)?.name || memberId;
  };

  const totalTransferred = (members || []).reduce((sum, m) => sum + Number(m.balance), 0);

  const memberTransfersForSelected = selectedMember
    ? (memberTransfers || []).filter(t => t.memberId === selectedMember.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    : [];

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-members-title">الأعضاء</h1>
          <p className="text-muted-foreground text-sm mt-1">إدارة الأعضاء وتحويل الأموال إليهم</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {!isAppUser && (
          <Dialog open={typeDialogOpen} onOpenChange={setTypeDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-manage-member-types">
                <Tag className="w-4 h-4 ml-2" />
                أنواع الأعضاء
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إدارة أنواع الأعضاء</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="flex items-center gap-2">
                  <Input
                    data-testid="input-new-member-type"
                    placeholder="اسم النوع الجديد..."
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newTypeName.trim()) {
                        createTypeMutation.mutate({ name: newTypeName.trim() });
                      }
                    }}
                  />
                  <Button
                    size="icon"
                    onClick={() => {
                      if (newTypeName.trim()) createTypeMutation.mutate({ name: newTypeName.trim() });
                    }}
                    disabled={!newTypeName.trim() || createTypeMutation.isPending}
                    data-testid="button-add-member-type"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {typesLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
                  </div>
                ) : (memberTypes || []).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">لا توجد أنواع أعضاء</p>
                ) : (
                  <div className="space-y-2">
                    {(memberTypes || []).map(mt => (
                      <div key={mt.id} className="flex items-center justify-between gap-2 p-3 rounded-md bg-muted/50" data-testid={`member-type-row-${mt.id}`}>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{mt.name}</span>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteTypeMutation.mutate(mt.id)}
                          disabled={deleteTypeMutation.isPending}
                          data-testid={`button-delete-member-type-${mt.id}`}
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
          {!isAppUser && (
          <Dialog open={memberDialogOpen} onOpenChange={setMemberDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-member">
                <Plus className="w-4 h-4 ml-2" />
                إضافة عضو
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إضافة عضو جديد</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>الاسم</Label>
                  <Input
                    data-testid="input-member-name"
                    placeholder="اسم العضو"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>رقم الهاتف (اختياري)</Label>
                  <Input
                    data-testid="input-member-phone"
                    placeholder="رقم الهاتف"
                    dir="ltr"
                    value={newMemberPhone}
                    onChange={(e) => setNewMemberPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>نوع العضو</Label>
                  <Select value={newMemberTypeId} onValueChange={setNewMemberTypeId}>
                    <SelectTrigger data-testid="select-member-type">
                      <SelectValue placeholder="اختر نوع العضو" />
                    </SelectTrigger>
                    <SelectContent>
                      {(memberTypes || []).map(mt => (
                        <SelectItem key={mt.id} value={mt.id}>{mt.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full"
                  onClick={() => {
                    if (!newMemberName.trim() || !newMemberTypeId) {
                      toast({ title: "يرجى ملء الاسم ونوع العضو", variant: "destructive" });
                      return;
                    }
                    createMemberMutation.mutate({
                      name: newMemberName.trim(),
                      phone: newMemberPhone.trim() || undefined,
                      typeId: newMemberTypeId,
                    });
                  }}
                  disabled={createMemberMutation.isPending}
                  data-testid="button-submit-member"
                >
                  {createMemberMutation.isPending ? "جاري الإضافة..." : "إضافة العضو"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          )}
        </div>
      </div>

      {canViewTotals && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10 text-primary">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">عدد الأعضاء</p>
                  <p className="font-bold text-lg" data-testid="stat-members-count">
                    {(members || []).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10 text-primary">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">أنواع الأعضاء</p>
                  <p className="font-bold text-lg" data-testid="stat-member-types-count">
                    {(memberTypes || []).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-md bg-destructive/10 text-destructive">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">إجمالي المحوّل للأعضاء</p>
                  <p className="font-bold text-lg" dir="ltr" data-testid="stat-total-member-transfers">
                    {formatAmount(totalTransferred)} د.ج
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {membersLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-5">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (members || []).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground text-sm">لا يوجد أعضاء مسجلين بعد</p>
            <p className="text-muted-foreground text-xs mt-1">قم بإضافة أنواع الأعضاء أولاً ثم أضف الأعضاء</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {(members || []).map(member => (
            <Card
              key={member.id}
              data-testid={`card-member-${member.id}`}
              className={`cursor-pointer transition-colors ${selectedMember?.id === member.id ? "ring-2 ring-primary" : ""}`}
              onClick={() => setSelectedMember(selectedMember?.id === member.id ? null : member)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-md bg-primary/10 text-primary">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{member.name}</span>
                        <Badge variant="secondary" className="text-xs">{getTypeName(member.typeId)}</Badge>
                      </div>
                      {member.phone && (
                        <p className="text-xs text-muted-foreground mt-0.5" dir="ltr">{member.phone}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {canViewTotals && (
                      <div className="text-left ml-2">
                        <p className="text-xs text-muted-foreground">إجمالي المحوّل</p>
                        <p className="font-bold text-sm" dir="ltr" data-testid={`member-balance-${member.id}`}>
                          {formatAmount(member.balance)} د.ج
                        </p>
                      </div>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      data-testid={`button-transfer-to-member-${member.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setTransferMember(member);
                        setTransferDialogOpen(true);
                      }}
                    >
                      <Send className="w-4 h-4 ml-1" />
                      تحويل
                    </Button>
                    {member.phone && (
                      <a
                        href={buildWhatsAppLink(member.phone, `مرحبا ${member.name}`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button size="icon" variant="ghost" data-testid={`button-whatsapp-member-${member.id}`}>
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                      </a>
                    )}
                    {!isAppUser && (
                    <Button
                      size="icon"
                      variant="ghost"
                      data-testid={`button-delete-member-${member.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingMember(member);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedMember && (
        <Card>
          <CardContent className="p-5">
            <h3 className="font-bold text-sm mb-4">تحويلات {selectedMember.name}</h3>
            {memberTransfersForSelected.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">لا توجد تحويلات لهذا العضو</p>
            ) : (
              <div className="space-y-2">
                {memberTransfersForSelected.map(mt => (
                  <div key={mt.id} className="flex items-center justify-between gap-3 p-3 rounded-md bg-muted/50 flex-wrap" data-testid={`member-transfer-${mt.id}`}>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm" dir="ltr">{formatAmount(mt.amount)} د.ج</span>
                        <span className="text-xs text-muted-foreground">{mt.date || formatDateSimple(mt.createdAt)}</span>
                      </div>
                      {mt.note && <p className="text-xs text-muted-foreground mt-0.5">{mt.note}</p>}
                    </div>
                    {!isAppUser && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setDeletingTransfer(mt);
                        setDeleteTransferDialogOpen(true);
                      }}
                      data-testid={`button-delete-member-transfer-${mt.id}`}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تحويل مبلغ إلى {transferMember?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="transfer-amount">المبلغ (د.ج)</Label>
              <Input
                id="transfer-amount"
                data-testid="input-member-transfer-amount"
                type="number"
                placeholder="0.00"
                step="0.01"
                dir="ltr"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="transfer-note">ملاحظة (اختياري)</Label>
              <Textarea
                id="transfer-note"
                data-testid="input-member-transfer-note"
                placeholder="ملاحظة..."
                value={transferNote}
                onChange={(e) => setTransferNote(e.target.value)}
                className="resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label>التاريخ</Label>
              <Input
                type="date"
                value={transferDate}
                onChange={(e) => setTransferDate(e.target.value)}
                data-testid="input-member-transfer-date"
              />
            </div>
            <Button
              className="w-full"
              onClick={() => {
                if (!transferAmount || !transferMember) {
                  toast({ title: "يرجى إدخال المبلغ", variant: "destructive" });
                  return;
                }
                createTransferMutation.mutate({
                  memberId: transferMember.id,
                  amount: transferAmount,
                  note: transferNote || undefined,
                  date: transferDate,
                });
              }}
              disabled={createTransferMutation.isPending}
              data-testid="button-submit-member-transfer"
            >
              {createTransferMutation.isPending ? "جاري التحويل..." : "تحويل المبلغ"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف العضو</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا العضو وجميع تحويلاته؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2">
            <AlertDialogCancel data-testid="button-cancel-delete-member">إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingMember && deleteMemberMutation.mutate(deletingMember.id)}
              className="bg-destructive text-destructive-foreground"
              data-testid="button-confirm-delete-member"
            >
              {deleteMemberMutation.isPending ? "جاري الحذف..." : "حذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteTransferDialogOpen} onOpenChange={setDeleteTransferDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف التحويل</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا التحويل؟ سيتم استرجاع المبلغ إلى رصيد الشركة الأم.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2">
            <AlertDialogCancel data-testid="button-cancel-delete-transfer">إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingTransfer && deleteTransferMutation.mutate(deletingTransfer.id)}
              className="bg-destructive text-destructive-foreground"
              data-testid="button-confirm-delete-transfer"
            >
              {deleteTransferMutation.isPending ? "جاري الحذف..." : "حذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
