import { useState, useRef } from "react";
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
import { Plus, ShoppingCart, Printer, RotateCcw, Pencil } from "lucide-react";
import { openPrintWindow } from "@/lib/printStyles";
import { useAuth } from "@/App";
import { useLanguage } from "@/lib/language-context";
import { t } from "@/lib/translations";
import type { Product, Supplier } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatDateFr(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("fr-FR");
}

interface OrderItemDraft {
  productId: number;
  productName: string;
  productNameZh?: string | null;
  quantityRequested: number;
  quantityOrdered: number;
  price: number;
  currency: "CNY" | "USD";
  selected: boolean;
}

export default function Orders() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { language } = useLanguage();
  const hidePrice = user?.role === "warehouse";
  const [dialogOpen, setDialogOpen] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [orderItems, setOrderItems] = useState<OrderItemDraft[]>([]);
  const [step, setStep] = useState<"supplier" | "items" | "summary">("supplier");
  const [confirmed, setConfirmed] = useState(false);

  const { data: suppliers } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const purchaseProducts = products?.filter(p => p.status === "purchase_order") || [];

  const createOrderMutation = useMutation({
    mutationFn: async (data: { supplierId: number; items: any[] }) => {
      const res = await apiRequest("POST", "/api/orders", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setDialogOpen(false);
      resetForm();
      toast({ title: "تم إنشاء الطلب بنجاح" });
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  const resetRemainingMutation = useMutation({
    mutationFn: async (productId: number) => {
      const res = await apiRequest("PATCH", `/api/products/${productId}`, { quantity: 0 });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "تم تصفير الكمية المتبقية" });
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setSupplierId("");
    setOrderItems([]);
    setStep("supplier");
    setConfirmed(false);
  };

  const handleSelectSupplier = () => {
    if (!supplierId) {
      toast({ title: "يرجى اختيار المورد", variant: "destructive" });
      return;
    }
    const items: OrderItemDraft[] = purchaseProducts.map(p => ({
      productId: p.id,
      productName: p.name,
      productNameZh: p.nameZh || null,
      quantityRequested: p.quantity,
      quantityOrdered: p.quantity,
      price: 0,
      currency: "CNY" as const,
      selected: false,
    }));
    setOrderItems(items);
    setStep("items");
  };

  const toggleItem = (idx: number) => {
    setOrderItems(prev => prev.map((item, i) =>
      i === idx ? { ...item, selected: !item.selected } : item
    ));
  };

  const updateItem = (idx: number, field: string, value: any) => {
    setOrderItems(prev => prev.map((item, i) =>
      i === idx ? { ...item, [field]: value } : item
    ));
  };

  const handleConfirmOrder = () => {
    const selected = orderItems.filter(i => i.selected);
    if (selected.length === 0) {
      toast({ title: "يرجى اختيار منتج واحد على الأقل", variant: "destructive" });
      return;
    }
    setStep("summary");
  };

  const handleSubmitOrder = () => {
    const selected = orderItems.filter(i => i.selected);
    createOrderMutation.mutate({
      supplierId: parseInt(supplierId),
      items: selected.map(i => ({
        productId: i.productId,
        quantityRequested: i.quantityRequested,
        quantityOrdered: i.quantityOrdered,
        price: i.price,
        currency: i.currency,
      })),
    });
  };

  const selectedItems = orderItems.filter(i => i.selected);
  const totalCNY = selectedItems.filter(i => i.currency === "CNY").reduce((s, i) => s + (i.price * i.quantityOrdered), 0);
  const totalUSD = selectedItems.filter(i => i.currency === "USD").reduce((s, i) => s + (i.price * i.quantityOrdered), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-orders-title">{t("orders.title", language)}</h1>
          <p className="text-muted-foreground">{t("orders.subtitle", language)}</p>
        </div>
        {!hidePrice && (
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-order">
              <Plus className="h-4 w-4" />
              {t("orders.newOrder", language)}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {step === "supplier" && "اختيار المورد"}
                {step === "items" && "اختيار المنتجات"}
                {step === "summary" && "ملخص الطلب"}
              </DialogTitle>
            </DialogHeader>

            {step === "supplier" && (
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>المورد</Label>
                  <Select value={supplierId} onValueChange={setSupplierId}>
                    <SelectTrigger data-testid="select-order-supplier">
                      <SelectValue placeholder={t("orders.selectSupplier", language)} />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers?.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button data-testid="button-next-step" className="w-full" onClick={handleSelectSupplier}>{t("common.next", language)}</Button>
              </div>
            )}

            {step === "items" && (
              <div className="space-y-4 pt-4">
                {purchaseProducts.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">لا توجد منتجات في حالة طلب الشراء</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-10">اختيار</TableHead>
                            <TableHead>{t("common.product", language)}</TableHead>
                            <TableHead>{t("orders.quantityOrdered", language)}</TableHead>
                            <TableHead>{t("common.quantity", language)}</TableHead>
                            <TableHead>المتبقي</TableHead>
                            {!hidePrice && <TableHead>السعر</TableHead>}
                            {!hidePrice && <TableHead>العملة</TableHead>}
                            <TableHead>تصفير</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {orderItems.map((item, idx) => (
                            <TableRow key={item.productId}>
                              <TableCell>
                                <Checkbox checked={item.selected} onCheckedChange={() => toggleItem(idx)} data-testid={`checkbox-item-${item.productId}`} />
                              </TableCell>
                              <TableCell className="font-medium">
                                <div>
                                  <span>{item.productName}</span>
                                  {item.productNameZh && (
                                    <span className="block text-sm text-muted-foreground" dir="ltr">{item.productNameZh}</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Input type="number" className="w-20" value={item.quantityRequested} onChange={(e) => updateItem(idx, "quantityRequested", parseInt(e.target.value) || 0)} data-testid={`input-qty-requested-${item.productId}`} />
                              </TableCell>
                              <TableCell>
                                <Input type="number" className="w-20" value={item.quantityOrdered} onChange={(e) => updateItem(idx, "quantityOrdered", parseInt(e.target.value) || 0)} data-testid={`input-qty-${item.productId}`} />
                              </TableCell>
                              <TableCell>
                                <span className={item.quantityRequested - item.quantityOrdered < 0 ? "text-destructive font-semibold" : ""}>
                                  {item.quantityRequested - item.quantityOrdered}
                                </span>
                              </TableCell>
                              {!hidePrice && <TableCell>
                                <Input type="number" step="0.01" className="w-24" value={item.price} onChange={(e) => updateItem(idx, "price", parseFloat(e.target.value) || 0)} data-testid={`input-price-${item.productId}`} />
                              </TableCell>}
                              {!hidePrice && <TableCell>
                                <Select value={item.currency} onValueChange={(v) => updateItem(idx, "currency", v)}>
                                  <SelectTrigger className="w-24">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="CNY">يوان</SelectItem>
                                    <SelectItem value="USD">دولار</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>}
                              <TableCell>
                                <Button size="icon" variant="ghost" onClick={() => { updateItem(idx, "quantityRequested", 0); resetRemainingMutation.mutate(item.productId); }} data-testid={`button-reset-remaining-${item.productId}`}>
                                  <RotateCcw className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setStep("supplier")}>{t("common.back", language)}</Button>
                      <Button onClick={handleConfirmOrder} data-testid="button-confirm-items">{t("orders.confirmOrder", language)}</Button>
                    </div>
                  </>
                )}
              </div>
            )}

            {step === "summary" && (
              <div className="space-y-4 pt-4" id="order-summary">
                <h3 className="font-semibold">المورد: {suppliers?.find(s => s.id === parseInt(supplierId))?.name}</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("common.product", language)}</TableHead>
                      <TableHead>{t("common.quantity", language)}</TableHead>
                      {!hidePrice && <TableHead>{t("orders.price", language)}</TableHead>}
                      {!hidePrice && <TableHead>{t("orders.currency", language)}</TableHead>}
                      {!hidePrice && <TableHead>{t("common.total", language)}</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedItems.map((item) => (
                      <TableRow key={item.productId}>
                        <TableCell className="font-medium">
                          <div>
                            <span>{item.productName}</span>
                            {item.productNameZh && (
                              <span className="block text-sm text-muted-foreground" dir="ltr">{item.productNameZh}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{item.quantityOrdered}</TableCell>
                        {!hidePrice && <TableCell>{item.price.toFixed(2)}</TableCell>}
                        {!hidePrice && <TableCell>{item.currency === "CNY" ? "يوان" : "دولار"}</TableCell>}
                        {!hidePrice && <TableCell className="font-semibold">{(item.price * item.quantityOrdered).toFixed(2)}</TableCell>}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {!hidePrice && <div className="flex flex-col gap-2 p-4 bg-muted rounded-md">
                  {totalCNY > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">المجموع باليوان الصيني:</span>
                      <span className="text-lg font-bold">{totalCNY.toFixed(2)} CNY</span>
                    </div>
                  )}
                  {totalUSD > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">المجموع بالدولار:</span>
                      <span className="text-lg font-bold">{totalUSD.toFixed(2)} USD</span>
                    </div>
                  )}
                </div>}
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep("items")}>{t("common.back", language)}</Button>
                  <Button onClick={handleSubmitOrder} disabled={createOrderMutation.isPending} data-testid="button-submit-order">
                    {createOrderMutation.isPending ? t("common.loading", language) : t("orders.confirmOrder", language)}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
        )}
      </div>

      <OrdersHistory />
    </div>
  );
}

function OrdersHistory() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { language } = useLanguage();
  const hidePrice = user?.role === "warehouse";
  const { data: orders, isLoading } = useQuery<any[]>({
    queryKey: ["/api/orders"],
  });
  const { data: suppliers } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editPrice, setEditPrice] = useState("");
  const [editQtyOrdered, setEditQtyOrdered] = useState("");
  const [editCurrency, setEditCurrency] = useState("CNY");

  const updateOrderItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/order-items/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setEditingItem(null);
      toast({ title: "تم تحديث العنصر بنجاح" });
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  const openEdit = (item: any) => {
    setEditingItem(item);
    setEditPrice(String(item.price || 0));
    setEditQtyOrdered(String(item.quantityOrdered));
    setEditCurrency(item.currency || "CNY");
  };

  const handleSaveEdit = () => {
    if (!editingItem) return;
    updateOrderItemMutation.mutate({
      id: editingItem.id,
      data: {
        quantityOrdered: parseInt(editQtyOrdered) || 0,
        price: parseFloat(editPrice) || 0,
        currency: editCurrency,
      },
    });
  };

  const handlePrintOrder = (order: any) => {
    const supplierName = order.supplierName || "";
    const orderTotalCNY = order.items?.filter((i: any) => i.currency === "CNY").reduce((s: number, i: any) => s + ((i.price || 0) * i.quantityOrdered), 0) || 0;
    const orderTotalUSD = order.items?.filter((i: any) => i.currency === "USD").reduce((s: number, i: any) => s + ((i.price || 0) * i.quantityOrdered), 0) || 0;

    let itemsHtml = "";
    order.items?.forEach((item: any) => {
      itemsHtml += `
        <tr>
          <td>${item.productName || `منتج #${item.productId}`}${item.productNameZh ? '<br/><small style="color:#666">' + item.productNameZh + '</small>' : ''}</td>
          <td class="text-center">${item.quantityOrdered}</td>
          ${!hidePrice ? `<td class="text-center">${(item.price || 0).toFixed(2)}</td>` : ""}
          ${!hidePrice ? `<td class="text-center">${item.currency === "CNY" ? "يوان" : "دولار"}</td>` : ""}
          ${!hidePrice ? `<td class="text-center">${((item.price || 0) * item.quantityOrdered).toFixed(2)}</td>` : ""}
        </tr>
      `;
    });

    const infoHtml = `
      <div class="info-row">
        <div class="info-item"><span class="info-label">المورد:</span> <span class="info-value">${supplierName}</span></div>
        <div class="info-item"><span class="info-label">التاريخ:</span> <span class="info-value">${formatDateFr(order.createdAt)}</span></div>
      </div>
    `;

    const tableHtml = `
      <table>
        <thead>
          <tr>
            <th>المنتج</th>
            <th>الكمية</th>
            ${!hidePrice ? `<th>السعر</th>` : ""}
            ${!hidePrice ? `<th>العملة</th>` : ""}
            ${!hidePrice ? `<th>المجموع</th>` : ""}
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>
    `;

    const totalsHtml = !hidePrice ? `
      <div class="totals-section">
        ${orderTotalCNY > 0 ? `<div class="total-row"><span class="total-label">المجموع باليوان:</span> <span class="total-amount">${orderTotalCNY.toFixed(2)} CNY</span></div>` : ""}
        ${orderTotalUSD > 0 ? `<div class="total-row"><span class="total-label">المجموع بالدولار:</span> <span class="total-amount">${orderTotalUSD.toFixed(2)} USD</span></div>` : ""}
      </div>
    ` : "";

    openPrintWindow({
      title: `طلب شراء #${order.id}`,
      subtitle: supplierName,
      content: infoHtml + tableHtml + totalsHtml,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-6 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <ShoppingCart className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">{t("orders.noOrders", language)}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">{t("orders.orderHistory", language)}</h2>
      {orders.map((order: any) => {
        const orderTotalCNY = order.items?.filter((i: any) => i.currency === "CNY").reduce((s: number, i: any) => s + ((i.price || 0) * i.quantityOrdered), 0) || 0;
        const orderTotalUSD = order.items?.filter((i: any) => i.currency === "USD").reduce((s: number, i: any) => s + ((i.price || 0) * i.quantityOrdered), 0) || 0;
        return (
          <Card key={order.id} data-testid={`card-order-${order.id}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <CardTitle className="text-base">
                  طلب #{order.id} - {order.supplierName || "مورد"}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="ghost" onClick={() => handlePrintOrder(order)} data-testid={`button-print-order-${order.id}`}>
                    <Printer className="h-4 w-4" />
                  </Button>
                  <Badge variant={order.confirmed === "confirmed" ? "default" : "secondary"}>
                    {order.confirmed === "confirmed" ? "مؤكد" : "معلق"}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                <span>{formatDateFr(order.createdAt)}</span>
                {!hidePrice && orderTotalCNY > 0 && <span>المجموع: {orderTotalCNY.toFixed(2)} CNY</span>}
                {!hidePrice && orderTotalUSD > 0 && <span>المجموع: {orderTotalUSD.toFixed(2)} USD</span>}
              </div>
            </CardHeader>
            {order.items && order.items.length > 0 && (
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("common.product", language)}</TableHead>
                      <TableHead>{t("common.quantity", language)}</TableHead>
                      {!hidePrice && <TableHead>{t("orders.price", language)}</TableHead>}
                      {!hidePrice && <TableHead>{t("orders.currency", language)}</TableHead>}
                      {!hidePrice && <TableHead>{t("common.total", language)}</TableHead>}
                      {!hidePrice && <TableHead>{t("common.edit", language)}</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.items.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <span>{item.productName || `منتج #${item.productId}`}</span>
                            {item.productNameZh && (
                              <span className="block text-sm text-muted-foreground" dir="ltr">{item.productNameZh}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{item.quantityOrdered}</TableCell>
                        {!hidePrice && <TableCell>{(item.price || 0).toFixed(2)}</TableCell>}
                        {!hidePrice && <TableCell>{item.currency === "CNY" ? "يوان" : "دولار"}</TableCell>}
                        {!hidePrice && <TableCell className="font-semibold">{((item.price || 0) * item.quantityOrdered).toFixed(2)}</TableCell>}
                        {!hidePrice && <TableCell>
                          <Button size="icon" variant="ghost" onClick={() => openEdit(item)} data-testid={`button-edit-order-item-${item.id}`}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            )}
          </Card>
        );
      })}

      <Dialog open={!!editingItem} onOpenChange={(open) => { if (!open) setEditingItem(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل عنصر الطلب</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <div className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground">المنتج: {editingItem.productName}{editingItem.productNameZh && <span className="block text-sm text-muted-foreground" dir="ltr">{editingItem.productNameZh}</span>}</p>
              <div className="space-y-2">
                <Label>الكمية المطلوبة</Label>
                <Input data-testid="input-edit-order-qty" type="number" value={editQtyOrdered} onChange={(e) => setEditQtyOrdered(e.target.value)} />
              </div>
              {!hidePrice && <div className="space-y-2">
                <Label>السعر</Label>
                <Input data-testid="input-edit-order-price" type="number" step="0.01" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} />
              </div>}
              {!hidePrice && <div className="space-y-2">
                <Label>العملة</Label>
                <Select value={editCurrency} onValueChange={setEditCurrency}>
                  <SelectTrigger data-testid="select-edit-order-currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CNY">يوان صيني</SelectItem>
                    <SelectItem value="USD">دولار أمريكي</SelectItem>
                  </SelectContent>
                </Select>
              </div>}
              <Button className="w-full" onClick={handleSaveEdit} disabled={updateOrderItemMutation.isPending} data-testid="button-save-edit-order-item">
                {updateOrderItemMutation.isPending ? "جاري الحفظ..." : "حفظ التعديل"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
