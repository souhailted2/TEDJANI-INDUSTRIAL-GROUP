import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, FolderOpen, Trash2, Pencil } from "lucide-react";
import type { Category } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
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

export default function Categories() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [editName, setEditName] = useState("");

  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string }) => {
      const res = await apiRequest("POST", "/api/categories", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setDialogOpen(false);
      setName("");
      toast({ title: "تم إنشاء الفئة بنجاح" });
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      const res = await apiRequest("PATCH", `/api/categories/${id}`, { name });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setEditDialogOpen(false);
      setSelectedCategory(null);
      setEditName("");
      toast({ title: "تم تعديل الفئة بنجاح" });
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setDeleteDialogOpen(false);
      setSelectedCategory(null);
      toast({ title: "تم حذف الفئة بنجاح" });
    },
    onError: (error: Error) => {
      toast({ title: "خطأ في الحذف", description: error.message, variant: "destructive" });
    },
  });

  const handleCreate = () => {
    if (!name.trim()) {
      toast({ title: "يرجى إدخال اسم الفئة", variant: "destructive" });
      return;
    }
    createMutation.mutate({ name: name.trim() });
  };

  const handleEdit = () => {
    if (!editName.trim() || !selectedCategory) {
      toast({ title: "يرجى إدخال اسم الفئة", variant: "destructive" });
      return;
    }
    updateMutation.mutate({ id: selectedCategory.id, name: editName.trim() });
  };

  const openEdit = (cat: Category) => {
    setSelectedCategory(cat);
    setEditName(cat.name);
    setEditDialogOpen(true);
  };

  const openDelete = (cat: Category) => {
    setSelectedCategory(cat);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-categories-title">الفئات</h1>
          <p className="text-muted-foreground">إدارة فئات المنتجات</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-category">
              <Plus className="h-4 w-4" />
              إضافة فئة
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة فئة جديدة</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>اسم الفئة</Label>
                <Input
                  data-testid="input-category-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="أدخل اسم الفئة"
                />
              </div>
              <Button
                data-testid="button-submit-category"
                className="w-full"
                onClick={handleCreate}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "جاري الإنشاء..." : "إنشاء الفئة"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-6 w-32" /></CardContent></Card>
          ))}
        </div>
      ) : categories && categories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <Card key={cat.id} className="hover-elevate" data-testid={`card-category-${cat.id}`}>
              <CardContent className="flex items-center gap-3 p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 shrink-0">
                  <FolderOpen className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold flex-1">{cat.name}</h3>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => openEdit(cat)}
                  data-testid={`button-edit-category-${cat.id}`}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => openDelete(cat)}
                  data-testid={`button-delete-category-${cat.id}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FolderOpen className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">لا توجد فئات</p>
          </CardContent>
        </Card>
      )}

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل الفئة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>اسم الفئة</Label>
              <Input
                data-testid="input-edit-category-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="أدخل اسم الفئة"
              />
            </div>
            <Button
              data-testid="button-submit-edit-category"
              className="w-full"
              onClick={handleEdit}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "جاري التعديل..." : "تعديل الفئة"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الفئة</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف الفئة "{selectedCategory?.name}"؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2">
            <AlertDialogCancel data-testid="button-cancel-delete-category">إلغاء</AlertDialogCancel>
            <AlertDialogAction
              data-testid="button-confirm-delete-category"
              onClick={() => selectedCategory && deleteMutation.mutate(selectedCategory.id)}
              className="bg-destructive text-destructive-foreground"
            >
              {deleteMutation.isPending ? "جاري الحذف..." : "حذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
