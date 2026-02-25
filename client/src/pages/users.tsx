import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2, Edit, UserCog, Shield } from "lucide-react";

type AppUser = {
  id: number;
  username: string;
  displayName: string;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
};

const PERMISSION_SECTIONS = [
  { key: "companies", label: "الشركات" },
  { key: "transfers", label: "التحويلات" },
  { key: "expenses", label: "المصاريف" },
  { key: "members", label: "الأعضاء" },
  { key: "external_debts", label: "الديون الخارجية" },
  { key: "trucks", label: "الشاحنات" },
  { key: "external_funds", label: "أموال خارجية" },
  { key: "projects", label: "المشاريع" },
  { key: "factory", label: "المصنع" },
  { key: "workers", label: "العمال" },
  { key: "account_statement", label: "كشف الحساب" },
  { key: "view_totals", label: "رؤية المجاميع" },
];

export default function UsersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<AppUser | null>(null);

  const { data: users = [], isLoading } = useQuery<AppUser[]>({
    queryKey: ["/api/app-users"],
  });

  if (user?.role !== "company" || !user?.isParent) {
    return (
      <div className="p-6 text-center" dir="rtl">
        <p className="text-muted-foreground">غير مصرح بالوصول</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <UserCog className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold" data-testid="text-users-title">إدارة المستخدمين</h1>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-user">
              <Plus className="w-4 h-4 ml-1" />
              إضافة مستخدم
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle>إضافة مستخدم جديد</DialogTitle>
            </DialogHeader>
            <CreateUserForm onSuccess={() => setCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
      ) : users.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            لا يوجد مستخدمون حتى الآن
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {users.map((u) => (
            <UserCard key={u.id} appUser={u} onEdit={() => setEditUser(u)} />
          ))}
        </div>
      )}

      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل المستخدم</DialogTitle>
          </DialogHeader>
          {editUser && (
            <EditUserForm user={editUser} onSuccess={() => setEditUser(null)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function UserCard({ appUser, onEdit }: { appUser: AppUser; onEdit: () => void }) {
  const { toast } = useToast();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/app-users/${appUser.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/app-users"] });
      toast({ title: "تم حذف المستخدم بنجاح" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/app-users/${appUser.id}`, {
        isActive: !appUser.isActive,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/app-users"] });
      toast({ title: appUser.isActive ? "تم تعطيل المستخدم" : "تم تفعيل المستخدم" });
    },
  });

  return (
    <Card data-testid={`card-user-${appUser.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold" data-testid={`text-user-name-${appUser.id}`}>
                {appUser.displayName}
              </h3>
              <Badge variant={appUser.isActive ? "default" : "secondary"}>
                {appUser.isActive ? "نشط" : "معطل"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground" data-testid={`text-user-username-${appUser.id}`}>
              @{appUser.username}
            </p>
            <div className="flex items-center gap-1 flex-wrap">
              <Shield className="w-3 h-3 text-muted-foreground" />
              {appUser.permissions.length === 0 ? (
                <span className="text-xs text-muted-foreground">بدون صلاحيات</span>
              ) : (
                appUser.permissions.map((p) => {
                  const section = PERMISSION_SECTIONS.find((s) => s.key === p);
                  return (
                    <Badge key={p} variant="outline" className="text-xs">
                      {section?.label || p}
                    </Badge>
                  );
                })
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-2 ml-2">
              <Switch
                checked={appUser.isActive}
                onCheckedChange={() => toggleMutation.mutate()}
                disabled={toggleMutation.isPending}
                data-testid={`switch-user-active-${appUser.id}`}
              />
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={onEdit}
              data-testid={`button-edit-user-${appUser.id}`}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                if (confirm("هل أنت متأكد من حذف هذا المستخدم؟")) {
                  deleteMutation.mutate();
                }
              }}
              disabled={deleteMutation.isPending}
              data-testid={`button-delete-user-${appUser.id}`}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CreateUserForm({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [permissions, setPermissions] = useState<string[]>([]);

  const createMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/app-users", {
        username,
        password,
        displayName,
        permissions,
        isActive: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/app-users"] });
      toast({ title: "تم إنشاء المستخدم بنجاح" });
      onSuccess();
    },
    onError: (err: any) => {
      toast({ title: err.message || "حدث خطأ", variant: "destructive" });
    },
  });

  const togglePermission = (key: string) => {
    setPermissions((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  };

  const selectAll = () => {
    if (permissions.length === PERMISSION_SECTIONS.length) {
      setPermissions([]);
    } else {
      setPermissions(PERMISSION_SECTIONS.map((s) => s.key));
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>الاسم المعروض</Label>
        <Input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="مثال: محمد أحمد"
          data-testid="input-user-display-name"
        />
      </div>
      <div className="space-y-2">
        <Label>اسم المستخدم</Label>
        <Input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="مثال: mohammed"
          dir="ltr"
          data-testid="input-user-username"
        />
      </div>
      <div className="space-y-2">
        <Label>كلمة المرور</Label>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="كلمة المرور"
          dir="ltr"
          data-testid="input-user-password"
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>الصلاحيات</Label>
          <Button variant="ghost" size="sm" onClick={selectAll} data-testid="button-select-all-permissions">
            {permissions.length === PERMISSION_SECTIONS.length ? "إلغاء الكل" : "تحديد الكل"}
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {PERMISSION_SECTIONS.map((section) => (
            <div key={section.key} className="flex items-center gap-2">
              <Checkbox
                id={`perm-${section.key}`}
                checked={permissions.includes(section.key)}
                onCheckedChange={() => togglePermission(section.key)}
                data-testid={`checkbox-permission-${section.key}`}
              />
              <label htmlFor={`perm-${section.key}`} className="text-sm cursor-pointer">
                {section.label}
              </label>
            </div>
          ))}
        </div>
      </div>
      <Button
        className="w-full"
        onClick={() => createMutation.mutate()}
        disabled={createMutation.isPending || !username || !password || !displayName}
        data-testid="button-submit-create-user"
      >
        {createMutation.isPending ? "جاري الإنشاء..." : "إنشاء المستخدم"}
      </Button>
    </div>
  );
}

function EditUserForm({ user, onSuccess }: { user: AppUser; onSuccess: () => void }) {
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState(user.displayName);
  const [username, setUsername] = useState(user.username);
  const [newPassword, setNewPassword] = useState("");
  const [permissions, setPermissions] = useState<string[]>(user.permissions);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const data: any = { displayName, username, permissions };
      if (newPassword) data.password = newPassword;
      await apiRequest("PATCH", `/api/app-users/${user.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/app-users"] });
      toast({ title: "تم تحديث المستخدم بنجاح" });
      onSuccess();
    },
    onError: (err: any) => {
      toast({ title: err.message || "حدث خطأ", variant: "destructive" });
    },
  });

  const togglePermission = (key: string) => {
    setPermissions((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  };

  const selectAll = () => {
    if (permissions.length === PERMISSION_SECTIONS.length) {
      setPermissions([]);
    } else {
      setPermissions(PERMISSION_SECTIONS.map((s) => s.key));
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>الاسم المعروض</Label>
        <Input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          data-testid="input-edit-display-name"
        />
      </div>
      <div className="space-y-2">
        <Label>اسم المستخدم</Label>
        <Input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          dir="ltr"
          data-testid="input-edit-username"
        />
      </div>
      <div className="space-y-2">
        <Label>كلمة مرور جديدة (اتركها فارغة إذا لا تريد التغيير)</Label>
        <Input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="كلمة مرور جديدة"
          dir="ltr"
          data-testid="input-edit-password"
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>الصلاحيات</Label>
          <Button variant="ghost" size="sm" onClick={selectAll} data-testid="button-edit-select-all">
            {permissions.length === PERMISSION_SECTIONS.length ? "إلغاء الكل" : "تحديد الكل"}
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {PERMISSION_SECTIONS.map((section) => (
            <div key={section.key} className="flex items-center gap-2">
              <Checkbox
                id={`edit-perm-${section.key}`}
                checked={permissions.includes(section.key)}
                onCheckedChange={() => togglePermission(section.key)}
                data-testid={`checkbox-edit-permission-${section.key}`}
              />
              <label htmlFor={`edit-perm-${section.key}`} className="text-sm cursor-pointer">
                {section.label}
              </label>
            </div>
          ))}
        </div>
      </div>
      <Button
        className="w-full"
        onClick={() => updateMutation.mutate()}
        disabled={updateMutation.isPending || !username || !displayName}
        data-testid="button-submit-edit-user"
      >
        {updateMutation.isPending ? "جاري التحديث..." : "حفظ التعديلات"}
      </Button>
    </div>
  );
}
