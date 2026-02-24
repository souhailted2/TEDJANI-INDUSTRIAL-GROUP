import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Warehouse, Pencil, Trash2 } from "lucide-react";
import type { Warehouse as WarehouseType } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/lib/language-context";
import { t } from "@/lib/translations";

export default function Warehouses() {
  const { toast } = useToast();
  const { language } = useLanguage();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  const { data: warehouses, isLoading } = useQuery<WarehouseType[]>({
    queryKey: ["/api/warehouses"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string }) => {
      const res = await apiRequest("POST", "/api/warehouses", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses"] });
      setDialogOpen(false);
      setName("");
      toast({ title: t("warehouses.createSuccess", language) });
    },
    onError: (error: Error) => {
      toast({ title: t("common.error", language), description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      const res = await apiRequest("PATCH", `/api/warehouses/${id}`, { name });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses"] });
      setEditId(null);
      setEditName("");
      toast({ title: t("warehouses.editSuccess", language) });
    },
    onError: (error: Error) => {
      toast({ title: t("common.error", language), description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/warehouses/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses"] });
      toast({ title: t("warehouses.deleteSuccess", language) });
    },
    onError: (error: Error) => {
      toast({ title: t("common.error", language), description: error.message, variant: "destructive" });
    },
  });

  const handleCreate = () => {
    if (!name.trim()) {
      toast({ title: "يرجى إدخال اسم المخزن", variant: "destructive" });
      return;
    }
    createMutation.mutate({ name: name.trim() });
  };

  const handleUpdate = () => {
    if (!editName.trim() || editId === null) return;
    updateMutation.mutate({ id: editId, name: editName.trim() });
  };

  const handleDelete = (id: number, whName: string) => {
    if (confirm(`هل أنت متأكد من حذف المخزن "${whName}"؟`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-warehouses-title">{t("warehouses.title", language)}</h1>
          <p className="text-muted-foreground">{t("warehouses.subtitle", language)}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-warehouse">
              <Plus className="h-4 w-4" />
              {t("warehouses.addWarehouse", language)}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة مخزن جديد</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>{t("warehouses.warehouseName", language)}</Label>
                <Input
                  data-testid="input-warehouse-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="أدخل اسم المخزن"
                />
              </div>
              <Button
                data-testid="button-submit-warehouse"
                className="w-full"
                onClick={handleCreate}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "جاري الإنشاء..." : "إنشاء المخزن"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-6 w-32" /></CardContent></Card>
          ))}
        </div>
      ) : warehouses && warehouses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {warehouses.map((wh) => (
            <Card key={wh.id} data-testid={`card-warehouse-${wh.id}`}>
              <CardContent className="flex items-center justify-between gap-3 p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 shrink-0">
                    <Warehouse className="h-5 w-5 text-primary" />
                  </div>
                  {editId === wh.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-40"
                        data-testid={`input-edit-warehouse-${wh.id}`}
                      />
                      <Button size="sm" onClick={handleUpdate} disabled={updateMutation.isPending} data-testid={`button-save-warehouse-${wh.id}`}>
                        {t("common.save", language)}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditId(null)} data-testid={`button-cancel-edit-${wh.id}`}>
                        إلغاء
                      </Button>
                    </div>
                  ) : (
                    <h3 className="font-semibold">{wh.name}</h3>
                  )}
                </div>
                {editId !== wh.id && (
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" onClick={() => { setEditId(wh.id); setEditName(wh.name); }} data-testid={`button-edit-warehouse-${wh.id}`}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(wh.id, wh.name)} data-testid={`button-delete-warehouse-${wh.id}`}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Warehouse className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">{t("warehouses.noWarehouses", language)}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
