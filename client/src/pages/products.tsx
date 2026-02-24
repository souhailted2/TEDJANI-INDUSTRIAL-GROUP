import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Search, Package, Trash2, RotateCcw, FileSpreadsheet, AlertTriangle, Layers, Pencil } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Product, Category, ProductPart } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/App";
import { useLanguage } from "@/lib/language-context";
import { t, getStatusLabel } from "@/lib/translations";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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


const statusColors: Record<string, string> = {
  purchase_order: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  ordered: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  received: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  semi_manufactured: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  shipping: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  arrived: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
};

const STATUS_AGING_THRESHOLDS: Record<string, number> = {
  purchase_order: 7,
  ordered: 30,
  received: 7,
};
const terminalStatuses = ["arrived"];

function getAgingDays(product: Product): number | null {
  if (!product.statusChangedAt || terminalStatuses.includes(product.status)) return null;
  const threshold = STATUS_AGING_THRESHOLDS[product.status];
  if (!threshold) return null;
  const changed = new Date(product.statusChangedAt);
  const now = new Date();
  const diffMs = now.getTime() - changed.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diffDays >= threshold ? diffDays : null;
}

export default function Products() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const { language } = useLanguage();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [productToReset, setProductToReset] = useState<Product | null>(null);
  const [partsDialogOpen, setPartsDialogOpen] = useState(false);
  const [partsProduct, setPartsProduct] = useState<Product | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [editName, setEditName] = useState("");
  const [editNameZh, setEditNameZh] = useState("");
  const [compositeDialogOpen, setCompositeDialogOpen] = useState(false);
  const [compositeName, setCompositeName] = useState("");
  const [compositeQuantity, setCompositeQuantity] = useState("");
  const [compositeCategoryId, setCompositeCategoryId] = useState("");
  const [compositeNameZh, setCompositeNameZh] = useState("");
  const [name, setName] = useState("");
  const [nameZh, setNameZh] = useState("");
  const [quantity, setQuantity] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });
  const { data: allCategories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const isAdmin = currentUser?.role === "admin";
  const categories = isAdmin
    ? allCategories
    : allCategories?.filter(c => currentUser?.allowedCategories?.includes(c.id));

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; nameZh?: string | null; quantity: number; categoryId: number | null }) => {
      const res = await apiRequest("POST", "/api/products", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setDialogOpen(false);
      setName("");
      setNameZh("");
      setQuantity("");
      setCategoryId("");
      toast({ title: "تم إنشاء المنتج بنجاح" });
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  const createCompositeMutation = useMutation({
    mutationFn: async (data: { name: string; nameZh?: string | null; quantity: number; categoryId: number | null }) => {
      const res = await apiRequest("POST", "/api/products", data);
      return await res.json();
    },
    onSuccess: (product: Product) => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setCompositeDialogOpen(false);
      setCompositeName("");
      setCompositeNameZh("");
      setCompositeQuantity("");
      setCompositeCategoryId("");
      toast({ title: "تم إنشاء المنتج المركب بنجاح" });
      setPartsProduct(product);
      setPartsDialogOpen(true);
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setDeleteDialogOpen(false);
      setProductToDelete(null);
      toast({ title: "تم حذف المنتج بنجاح" });
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  const resetMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PATCH", `/api/products/${id}`, { quantity: 0 });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setResetDialogOpen(false);
      setProductToReset(null);
      toast({ title: "تم تصفير الكمية بنجاح" });
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  const editMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { name: string; nameZh: string | null } }) => {
      const res = await apiRequest("PATCH", `/api/products/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setEditDialogOpen(false);
      setEditProduct(null);
      toast({ title: t("products.editSuccess", language) });
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  const openEditDialog = (product: Product) => {
    setEditProduct(product);
    setEditName(product.name);
    setEditNameZh(product.nameZh || "");
    setEditDialogOpen(true);
  };

  const handleEdit = () => {
    if (!editProduct || !editName.trim()) {
      toast({ title: "يرجى إدخال اسم المنتج", variant: "destructive" });
      return;
    }
    editMutation.mutate({
      id: editProduct.id,
      data: {
        name: editName.trim(),
        nameZh: editNameZh.trim() || null,
      },
    });
  };

  const [importing, setImporting] = useState(false);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/products/import", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "فشل في الاستيراد");
      }
      const data = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: `تم استيراد ${data.imported} منتج بنجاح` });
    } catch (error: any) {
      toast({ title: "خطأ في الاستيراد", description: error.message, variant: "destructive" });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleCreate = () => {
    if (!name.trim()) {
      toast({ title: "يرجى إدخال اسم المنتج", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      name: name.trim(),
      nameZh: nameZh.trim() || null,
      quantity: parseInt(quantity) || 0,
      categoryId: categoryId ? parseInt(categoryId) : null,
    });
  };

  const handleCreateComposite = () => {
    if (!compositeName.trim()) {
      toast({ title: "يرجى إدخال اسم المنتج المركب", variant: "destructive" });
      return;
    }
    createCompositeMutation.mutate({
      name: compositeName.trim(),
      nameZh: compositeNameZh.trim() || null,
      quantity: parseInt(compositeQuantity) || 0,
      categoryId: compositeCategoryId ? parseInt(compositeCategoryId) : null,
    });
  };

  const filtered = (products?.filter((p) => {
    const searchLower = search.toLowerCase();
    const matchSearch = p.name.toLowerCase().includes(searchLower) ||
      (p.nameZh && p.nameZh.toLowerCase().includes(searchLower));
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  }) || []).sort((a, b) => b.id - a.id);

  const getCategoryName = (catId: number | null) => {
    if (!catId || !allCategories) return "-";
    return allCategories.find(c => c.id === catId)?.name || "-";
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-products-title">{t("products.title", language)}</h1>
          <p className="text-muted-foreground">{t("products.subtitle", language)}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleImport}
            data-testid="input-import-file"
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            data-testid="button-import-products"
          >
            <FileSpreadsheet className="h-4 w-4" />
            {importing ? "جاري الاستيراد..." : t("products.importExcel", language)}
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-product">
                <Plus className="h-4 w-4" />
                {t("products.addProduct", language)}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("products.addProduct", language)}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>{t("products.productName", language)}</Label>
                  <Input
                    data-testid="input-product-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="أدخل اسم المنتج"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("products.chineseName", language)}</Label>
                  <Input
                    data-testid="input-product-name-zh"
                    value={nameZh}
                    onChange={(e) => setNameZh(e.target.value)}
                    placeholder="输入中文名称"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("common.quantity", language)}</Label>
                  <Input
                    data-testid="input-product-quantity"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("common.category", language)}</Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger data-testid="select-product-category">
                      <SelectValue placeholder="اختر الفئة" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map((cat) => (
                        <SelectItem key={cat.id} value={String(cat.id)}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  data-testid="button-submit-product"
                  className="w-full"
                  onClick={handleCreate}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? "جاري الإنشاء..." : "إنشاء المنتج"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={compositeDialogOpen} onOpenChange={setCompositeDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-add-composite-product">
                <Layers className="h-4 w-4" />
                {t("products.addComposite", language)}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("products.addComposite", language)}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>{t("products.productName", language)}</Label>
                  <Input
                    data-testid="input-composite-name"
                    value={compositeName}
                    onChange={(e) => setCompositeName(e.target.value)}
                    placeholder="أدخل اسم المنتج المركب"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("products.chineseName", language)}</Label>
                  <Input
                    data-testid="input-composite-name-zh"
                    value={compositeNameZh}
                    onChange={(e) => setCompositeNameZh(e.target.value)}
                    placeholder="输入中文名称"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("common.quantity", language)}</Label>
                  <Input
                    data-testid="input-composite-quantity"
                    type="number"
                    value={compositeQuantity}
                    onChange={(e) => setCompositeQuantity(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("common.category", language)}</Label>
                  <Select value={compositeCategoryId} onValueChange={setCompositeCategoryId}>
                    <SelectTrigger data-testid="select-composite-category">
                      <SelectValue placeholder="اختر الفئة" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map((cat) => (
                        <SelectItem key={cat.id} value={String(cat.id)}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  data-testid="button-submit-composite"
                  className="w-full"
                  onClick={handleCreateComposite}
                  disabled={createCompositeMutation.isPending}
                >
                  {createCompositeMutation.isPending ? "جاري الإنشاء..." : "إنشاء المنتج المركب"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                data-testid="input-search-products"
                className="pr-9"
                placeholder={t("common.search", language)}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
                <SelectValue placeholder="تصفية حسب الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all", language)}</SelectItem>
                {Object.keys(statusColors).map((key) => (
                  <SelectItem key={key} value={key}>{getStatusLabel(key, language)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>{t("products.productName", language)}</TableHead>
                    <TableHead>{t("common.quantity", language)}</TableHead>
                    <TableHead>{t("common.category", language)}</TableHead>
                    <TableHead>{t("common.status", language)}</TableHead>
                    <TableHead>{t("common.date", language)}</TableHead>
                    <TableHead>{t("common.edit", language)}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((product, idx) => {
                    const agingDays = getAgingDays(product);
                    return (
                    <TableRow
                      key={product.id}
                      data-testid={`row-product-${product.id}`}
                      className={agingDays ? "bg-amber-50/50 dark:bg-amber-950/20" : ""}
                    >
                      <TableCell className="font-medium">{idx + 1}</TableCell>
                      <TableCell className="font-medium">
                        <div>
                          <span>{product.name}</span>
                          {product.nameZh && (
                            <span className="block text-sm text-muted-foreground" dir="ltr">{product.nameZh}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{product.quantity}</TableCell>
                      <TableCell>{getCategoryName(product.categoryId)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="secondary" className={statusColors[product.status]}>
                            {getStatusLabel(product.status, language)}
                          </Badge>
                          {agingDays && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" data-testid={`icon-aging-${product.id}`} />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{agingDays} {t("products.statusAge", language)}</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {product.statusChangedAt
                          ? new Date(product.statusChangedAt).toLocaleDateString("fr-FR")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                data-testid={`button-edit-product-${product.id}`}
                                onClick={() => openEditDialog(product)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{t("common.edit", language)}</p>
                            </TooltipContent>
                          </Tooltip>
                          {product.status === "semi_manufactured" && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  data-testid={`button-parts-${product.id}`}
                                  onClick={() => {
                                    setPartsProduct(product);
                                    setPartsDialogOpen(true);
                                  }}
                                >
                                  <Layers className="h-4 w-4 text-cyan-600" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{t("products.parts", language)}</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            data-testid={`button-reset-quantity-${product.id}`}
                            onClick={() => {
                              setProductToReset(product);
                              setResetDialogOpen(true);
                            }}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            data-testid={`button-delete-product-${product.id}`}
                            onClick={() => {
                              setProductToDelete(product);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">{t("products.noProducts", language)}</p>
              <p className="text-sm text-muted-foreground">أضف منتجًا جديدًا للبدء</p>
            </div>
          )}
        </CardContent>
      </Card>

      {partsProduct && (
        <PartsDialog
          product={partsProduct}
          open={partsDialogOpen}
          onOpenChange={(open) => {
            setPartsDialogOpen(open);
            if (!open) setPartsProduct(null);
          }}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف المنتج "{productToDelete?.name}"؟ سيتم حذف جميع البيانات المرتبطة نهائيًا.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2">
            <AlertDialogCancel data-testid="button-cancel-delete">{t("common.cancel", language)}</AlertDialogCancel>
            <AlertDialogAction
              data-testid="button-confirm-delete"
              onClick={() => productToDelete && deleteMutation.mutate(productToDelete.id)}
              className="bg-destructive text-destructive-foreground"
            >
              {deleteMutation.isPending ? "جاري الحذف..." : t("common.delete", language)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تصفير الكمية</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من تصفير كمية المنتج "{productToReset?.name}"؟ ستصبح الكمية صفرًا.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2">
            <AlertDialogCancel data-testid="button-cancel-reset">{t("common.cancel", language)}</AlertDialogCancel>
            <AlertDialogAction
              data-testid="button-confirm-reset"
              onClick={() => productToReset && resetMutation.mutate(productToReset.id)}
            >
              {resetMutation.isPending ? "جاري التصفير..." : t("common.reset", language)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={editDialogOpen} onOpenChange={(open) => {
        setEditDialogOpen(open);
        if (!open) setEditProduct(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("common.edit", language)} - {editProduct?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>{t("products.productName", language)}</Label>
              <Input
                data-testid="input-edit-product-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="اسم المنتج"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("products.chineseName", language)}</Label>
              <Input
                data-testid="input-edit-product-name-zh"
                value={editNameZh}
                onChange={(e) => setEditNameZh(e.target.value)}
                placeholder="输入中文名称"
                dir="ltr"
              />
            </div>
            <Button
              data-testid="button-submit-edit-product"
              className="w-full"
              onClick={handleEdit}
              disabled={editMutation.isPending}
            >
              {editMutation.isPending ? "جاري الحفظ..." : t("common.save", language)}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PartsDialog({ product, open, onOpenChange }: { product: Product; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const { language } = useLanguage();
  const [partName, setPartName] = useState("");
  const [partQuantity, setPartQuantity] = useState("");
  const [partLength, setPartLength] = useState("");
  const [partWidth, setPartWidth] = useState("");
  const [partHeight, setPartHeight] = useState("");
  const [partWeight, setPartWeight] = useState("");
  const [partPieces, setPartPieces] = useState("");

  const { data: parts, isLoading } = useQuery<ProductPart[]>({
    queryKey: ["/api/products", product.id, "parts"],
    enabled: open,
  });

  const createPartMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/products/${product.id}/parts`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products", product.id, "parts"] });
      setPartName("");
      setPartQuantity("");
      setPartLength("");
      setPartWidth("");
      setPartHeight("");
      setPartWeight("");
      setPartPieces("");
      toast({ title: "تم إضافة الجزء بنجاح" });
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  const deletePartMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/product-parts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products", product.id, "parts"] });
      toast({ title: "تم حذف الجزء" });
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  const handleAddPart = () => {
    if (!partName.trim()) {
      toast({ title: "يرجى إدخال اسم الجزء", variant: "destructive" });
      return;
    }
    createPartMutation.mutate({
      name: partName.trim(),
      quantity: partQuantity ? parseInt(partQuantity) : 0,
      length: partLength ? parseFloat(partLength) : null,
      width: partWidth ? parseFloat(partWidth) : null,
      height: partHeight ? parseFloat(partHeight) : null,
      weight: partWeight ? parseFloat(partWeight) : null,
      piecesPerCarton: partPieces ? parseInt(partPieces) : null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("products.parts", language)}: {product.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-2">
            <div className="col-span-2 md:col-span-2 lg:col-span-5">
              <Label>{t("products.partName", language)}</Label>
              <Input
                data-testid="input-part-name"
                value={partName}
                onChange={(e) => setPartName(e.target.value)}
                placeholder={t("products.partName", language)}
              />
            </div>
            <div className="col-span-2 md:col-span-1 lg:col-span-2">
              <Label>{t("common.quantity", language)}</Label>
              <Input
                data-testid="input-part-quantity"
                type="number"
                value={partQuantity}
                onChange={(e) => setPartQuantity(e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <Label>{t("products.length", language)} ({t("products.cm", language)})</Label>
              <Input
                data-testid="input-part-length"
                type="number"
                step="0.1"
                value={partLength}
                onChange={(e) => setPartLength(e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <Label>{t("products.width", language)} ({t("products.cm", language)})</Label>
              <Input
                data-testid="input-part-width"
                type="number"
                step="0.1"
                value={partWidth}
                onChange={(e) => setPartWidth(e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <Label>{t("products.height", language)} ({t("products.cm", language)})</Label>
              <Input
                data-testid="input-part-height"
                type="number"
                step="0.1"
                value={partHeight}
                onChange={(e) => setPartHeight(e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <Label>{t("products.weight", language)} ({t("products.kg", language)})</Label>
              <Input
                data-testid="input-part-weight"
                type="number"
                step="0.1"
                value={partWeight}
                onChange={(e) => setPartWeight(e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <Label>{t("products.piecesPerCarton", language)}</Label>
              <Input
                data-testid="input-part-pieces"
                type="number"
                value={partPieces}
                onChange={(e) => setPartPieces(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleAddPart}
                disabled={createPartMutation.isPending}
                data-testid="button-add-part"
              >
                <Plus className="h-4 w-4" />
                {t("common.add", language)}
              </Button>
            </div>
          </div>

          {isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : parts && parts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("products.partName", language)}</TableHead>
                  <TableHead>{t("common.quantity", language)}</TableHead>
                  <TableHead>{t("products.length", language)} ({t("products.cm", language)})</TableHead>
                  <TableHead>{t("products.width", language)} ({t("products.cm", language)})</TableHead>
                  <TableHead>{t("products.height", language)} ({t("products.cm", language)})</TableHead>
                  <TableHead>{t("products.weight", language)} ({t("products.kg", language)})</TableHead>
                  <TableHead>{t("products.piecesPerCarton", language)}</TableHead>
                  <TableHead>{t("common.delete", language)}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parts.map((part) => (
                  <TableRow key={part.id} data-testid={`row-part-${part.id}`}>
                    <TableCell className="font-medium">{part.name}</TableCell>
                    <TableCell>{part.quantity}</TableCell>
                    <TableCell>{part.length ?? "-"}</TableCell>
                    <TableCell>{part.width ?? "-"}</TableCell>
                    <TableCell>{part.height ?? "-"}</TableCell>
                    <TableCell>{part.weight ?? "-"}</TableCell>
                    <TableCell>{part.piecesPerCarton ?? "-"}</TableCell>
                    <TableCell>
                      <Button
                        size="icon"
                        variant="ghost"
                        data-testid={`button-delete-part-${part.id}`}
                        onClick={() => deletePartMutation.mutate(part.id)}
                        disabled={deletePartMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Layers className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">لا توجد أجزاء لهذا المنتج</p>
              <p className="text-sm text-muted-foreground">أضف أجزاء المنتج باستخدام النموذج أعلاه</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
