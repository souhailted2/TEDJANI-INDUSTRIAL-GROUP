import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, UserPlus, Shield, User, FolderOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/App";
import type { Category } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function UserManagement() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState("user");
  const [permDialogOpen, setPermDialogOpen] = useState(false);
  const [permUser, setPermUser] = useState<any>(null);
  const [selectedCats, setSelectedCats] = useState<number[]>([]);

  if (currentUser?.role !== "admin") {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Shield className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">ليس لديك صلاحية للوصول لهذه الصفحة</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data: users, isLoading } = useQuery<any[]>({
    queryKey: ["/api/users"],
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/users", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setDialogOpen(false);
      setUsername("");
      setPassword("");
      setDisplayName("");
      setRole("user");
      toast({ title: "تم إنشاء المستخدم بنجاح" });
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  const setCategoriesMutation = useMutation({
    mutationFn: async ({ userId, categoryIds }: { userId: number; categoryIds: number[] }) => {
      const res = await apiRequest("PUT", `/api/users/${userId}/categories`, { categoryIds });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setPermDialogOpen(false);
      setPermUser(null);
      toast({ title: "تم تحديث صلاحيات الفئات بنجاح" });
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  const handleCreate = () => {
    if (!username.trim() || !password.trim() || !displayName.trim()) {
      toast({ title: "يرجى ملء جميع الحقول", variant: "destructive" });
      return;
    }
    createMutation.mutate({ username: username.trim(), password, displayName: displayName.trim(), role });
  };

  const openPermissions = (u: any) => {
    setPermUser(u);
    setSelectedCats(u.allowedCategories || []);
    setPermDialogOpen(true);
  };

  const toggleCategory = (catId: number) => {
    setSelectedCats(prev =>
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    );
  };

  const handleSavePermissions = () => {
    if (!permUser) return;
    setCategoriesMutation.mutate({ userId: permUser.id, categoryIds: selectedCats });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-users-title">إدارة المستخدمين</h1>
          <p className="text-muted-foreground">إنشاء وإدارة حسابات المستخدمين وصلاحياتهم</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-user">
              <UserPlus className="h-4 w-4" />
              إضافة مستخدم
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إنشاء مستخدم جديد</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>اسم المستخدم (للدخول)</Label>
                <Input
                  data-testid="input-new-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="اسم المستخدم"
                />
              </div>
              <div className="space-y-2">
                <Label>كلمة المرور</Label>
                <Input
                  data-testid="input-new-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="كلمة المرور"
                />
              </div>
              <div className="space-y-2">
                <Label>الاسم الظاهر</Label>
                <Input
                  data-testid="input-new-displayname"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="الاسم الكامل"
                />
              </div>
              <div className="space-y-2">
                <Label>الصلاحية</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger data-testid="select-user-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">مدير</SelectItem>
                    <SelectItem value="user">مستخدم</SelectItem>
                    <SelectItem value="warehouse">عامل مخزن</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                data-testid="button-submit-user"
                className="w-full"
                onClick={handleCreate}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "جاري الإنشاء..." : "إنشاء المستخدم"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : users && users.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>اسم المستخدم</TableHead>
                  <TableHead>الاسم الظاهر</TableHead>
                  <TableHead>الصلاحية</TableHead>
                  <TableHead>الفئات المسموحة</TableHead>
                  <TableHead>تاريخ الإنشاء</TableHead>
                  <TableHead>إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u: any, idx: number) => (
                  <TableRow key={u.id} data-testid={`row-user-${u.id}`}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell className="font-medium">{u.username}</TableCell>
                    <TableCell>{u.displayName}</TableCell>
                    <TableCell>
                      <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                        {u.role === "admin" ? "مدير" : u.role === "warehouse" ? "عامل مخزن" : "مستخدم"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {u.role === "admin" ? (
                        <span className="text-sm text-muted-foreground">جميع الفئات</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {u.allowedCategories && u.allowedCategories.length > 0 ? (
                            u.allowedCategories.map((catId: number) => {
                              const cat = categories?.find(c => c.id === catId);
                              return cat ? (
                                <Badge key={catId} variant="secondary" className="text-xs">
                                  {cat.name}
                                </Badge>
                              ) : null;
                            })
                          ) : (
                            <span className="text-sm text-muted-foreground">لا توجد فئات</span>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString("fr-FR") : "-"}
                    </TableCell>
                    <TableCell>
                      {u.role !== "admin" && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openPermissions(u)}
                          data-testid={`button-permissions-${u.id}`}
                        >
                          <FolderOpen className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <User className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">لا يوجد مستخدمين</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={permDialogOpen} onOpenChange={setPermDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>صلاحيات الفئات - {permUser?.displayName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">
              اختر الفئات التي يمكن لهذا المستخدم إنشاء المنتجات فيها وتتبعها
            </p>
            {categories && categories.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center gap-3 p-3 rounded-md border cursor-pointer hover-elevate"
                    onClick={() => toggleCategory(cat.id)}
                    data-testid={`checkbox-category-${cat.id}`}
                  >
                    <Checkbox
                      checked={selectedCats.includes(cat.id)}
                      onCheckedChange={() => toggleCategory(cat.id)}
                    />
                    <span className="font-medium">{cat.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">لا توجد فئات</p>
            )}
            <Button
              className="w-full"
              onClick={handleSavePermissions}
              disabled={setCategoriesMutation.isPending}
              data-testid="button-save-permissions"
            >
              {setCategoriesMutation.isPending ? "جاري الحفظ..." : "حفظ الصلاحيات"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
