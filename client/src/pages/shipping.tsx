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
import { Ship, Eye, Pencil, Printer } from "lucide-react";
import { openPrintWindow } from "@/lib/printStyles";
import { useAuth } from "@/App";
import type { Warehouse as WarehouseType, Product, ShippingCompany } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/lib/language-context";
import { t } from "@/lib/translations";
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

interface ShipItem {
  productId: number;
  productName: string;
  productNameZh?: string | null;
  availableQty: number;
  shipQty: number;
  selected: boolean;
}

export default function Shipping() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { language } = useLanguage();
  const hidePrice = user?.role === "warehouse";
  const [dialogOpen, setDialogOpen] = useState(false);
  const [warehouseId, setWarehouseId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [containerNumber, setContainerNumber] = useState("");
  const [shippingCompanyId, setShippingCompanyId] = useState("");
  const [priceCNY, setPriceCNY] = useState("");
  const [priceUSD, setPriceUSD] = useState("");
  const [items, setItems] = useState<ShipItem[]>([]);
  const [step, setStep] = useState<"info" | "items">("info");

  const { data: warehouses } = useQuery<WarehouseType[]>({
    queryKey: ["/api/warehouses"],
  });

  const { data: receivedProducts } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: shippingCompanies } = useQuery<ShippingCompany[]>({
    queryKey: ["/api/shipping-companies"],
  });

  const createContainerMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/containers", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/containers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse-inventory"] });
      setDialogOpen(false);
      resetForm();
      toast({ title: "تم تحميل الحاوية بنجاح" });
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setWarehouseId("");
    setInvoiceNumber("");
    setContainerNumber("");
    setShippingCompanyId("");
    setPriceCNY("");
    setPriceUSD("");
    setItems([]);
    setStep("info");
  };

  const handleNext = () => {
    const received = receivedProducts?.filter(p => p.status === "received" || p.status === "semi_manufactured") || [];
    const shipItems: ShipItem[] = received.map(p => ({
      productId: p.id,
      productName: p.name,
      productNameZh: p.nameZh || null,
      availableQty: p.quantity,
      shipQty: p.quantity,
      selected: false,
    }));
    setItems(shipItems);
    if (warehouses && warehouses.length > 0 && !warehouseId) {
      setWarehouseId(String(warehouses[0].id));
    }
    setStep("items");
  };

  const toggleItem = (idx: number) => {
    setItems(prev => prev.map((item, i) =>
      i === idx ? { ...item, selected: !item.selected } : item
    ));
  };

  const updateQty = (idx: number, qty: number) => {
    setItems(prev => prev.map((item, i) =>
      i === idx ? { ...item, shipQty: qty } : item
    ));
  };

  const handleSubmit = () => {
    const selected = items.filter(i => i.selected);
    if (selected.length === 0) {
      toast({ title: "يرجى اختيار بضاعة للشحن", variant: "destructive" });
      return;
    }
    const company = shippingCompanies?.find(c => c.id === parseInt(shippingCompanyId));
    createContainerMutation.mutate({
      invoiceNumber,
      containerNumber,
      shippingCompany: company?.name || "",
      shippingCompanyId: shippingCompanyId ? parseInt(shippingCompanyId) : null,
      priceCNY: parseFloat(priceCNY) || 0,
      priceUSD: parseFloat(priceUSD) || 0,
      warehouseId: parseInt(warehouseId) || null,
      items: selected.map(i => ({
        productId: i.productId,
        quantity: i.shipQty,
      })),
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-shipping-title">{t("shipping.title", language)}</h1>
          <p className="text-muted-foreground">{t("shipping.subtitle", language)}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button data-testid="button-load-container">
              <Ship className="h-4 w-4" />
              {t("shipping.newContainer", language)}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {step === "info" ? "معلومات الحاوية" : "اختيار البضاعة"}
              </DialogTitle>
            </DialogHeader>

            {step === "info" && (
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>{t("common.warehouse", language)}</Label>
                  <Select value={warehouseId} onValueChange={setWarehouseId}>
                    <SelectTrigger data-testid="select-ship-warehouse">
                      <SelectValue placeholder={t("shipping.selectWarehouse", language)} />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses?.map((wh) => (
                        <SelectItem key={wh.id} value={String(wh.id)}>{wh.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("shipping.invoiceNumber", language)}</Label>
                  <Input data-testid="input-invoice" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} placeholder={t("shipping.invoiceNumber", language)} />
                </div>
                <div className="space-y-2">
                  <Label>{t("shipping.containerNumber", language)}</Label>
                  <Input data-testid="input-container-number" value={containerNumber} onChange={(e) => setContainerNumber(e.target.value)} placeholder={t("shipping.containerNumber", language)} />
                </div>
                <div className="space-y-2">
                  <Label>{t("shipping.shippingCompany", language)}</Label>
                  <Select value={shippingCompanyId} onValueChange={setShippingCompanyId}>
                    <SelectTrigger data-testid="select-shipping-company">
                      <SelectValue placeholder={t("shipping.shippingCompany", language)} />
                    </SelectTrigger>
                    <SelectContent>
                      {shippingCompanies?.map((sc) => (
                        <SelectItem key={sc.id} value={String(sc.id)}>{sc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {!hidePrice && <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>سعر الحاوية (يوان)</Label>
                    <Input data-testid="input-price-cny" type="number" step="0.01" value={priceCNY} onChange={(e) => setPriceCNY(e.target.value)} placeholder="0.00" />
                  </div>
                  <div className="space-y-2">
                    <Label>سعر الحاوية (دولار)</Label>
                    <Input data-testid="input-price-usd" type="number" step="0.01" value={priceUSD} onChange={(e) => setPriceUSD(e.target.value)} placeholder="0.00" />
                  </div>
                </div>}
                <Button className="w-full" onClick={handleNext} data-testid="button-next-ship">التالي</Button>
              </div>
            )}

            {step === "items" && (
              <div className="space-y-4 pt-4">
                {items.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">لا توجد بضائع في المخزن</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">اختيار</TableHead>
                        <TableHead>{t("common.product", language)}</TableHead>
                        <TableHead>{t("common.quantity", language)}</TableHead>
                        <TableHead>كمية الشحن</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item, idx) => (
                        <TableRow key={item.productId}>
                          <TableCell>
                            <Checkbox checked={item.selected} onCheckedChange={() => toggleItem(idx)} />
                          </TableCell>
                          <TableCell className="font-medium">
                            <div>
                              <span>{item.productName}</span>
                              {item.productNameZh && (
                                <span className="block text-sm text-muted-foreground" dir="ltr">{item.productNameZh}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell data-testid={`text-available-qty-${item.productId}`}>{item.availableQty}</TableCell>
                          <TableCell>
                            <Input type="number" className="w-20" value={item.shipQty}
                              onChange={(e) => updateQty(idx, parseInt(e.target.value) || 0)} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep("info")}>رجوع</Button>
                  <Button onClick={handleSubmit} disabled={createContainerMutation.isPending} data-testid="button-submit-container">
                    {createContainerMutation.isPending ? "جاري التحميل..." : t("shipping.confirmShip", language)}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <ContainersHistory />
    </div>
  );
}

function ContainersHistory() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { language } = useLanguage();
  const hidePrice = user?.role === "warehouse";
  const { data: containersList, isLoading } = useQuery<any[]>({
    queryKey: ["/api/containers"],
  });
  const { data: shippingCompanies } = useQuery<ShippingCompany[]>({
    queryKey: ["/api/shipping-companies"],
  });

  const [viewContainer, setViewContainer] = useState<any | null>(null);
  const [editContainer, setEditContainer] = useState<any | null>(null);
  const [editInvoice, setEditInvoice] = useState("");
  const [editContainerNum, setEditContainerNum] = useState("");
  const [editCompanyId, setEditCompanyId] = useState("");
  const [editPriceCNY, setEditPriceCNY] = useState("");
  const [editPriceUSD, setEditPriceUSD] = useState("");

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/containers/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/containers"] });
      setEditContainer(null);
      toast({ title: "تم تحديث الحاوية بنجاح" });
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  const startEdit = (c: any) => {
    setEditContainer(c);
    setEditInvoice(c.invoiceNumber || "");
    setEditContainerNum(c.containerNumber || "");
    setEditCompanyId(c.shippingCompanyId ? String(c.shippingCompanyId) : "");
    setEditPriceCNY(c.priceCNY ? String(c.priceCNY) : "");
    setEditPriceUSD(c.priceUSD ? String(c.priceUSD) : "");
  };

  const saveEdit = () => {
    if (!editContainer) return;
    const company = shippingCompanies?.find(c => c.id === parseInt(editCompanyId));
    updateMutation.mutate({
      id: editContainer.id,
      data: {
        invoiceNumber: editInvoice,
        containerNumber: editContainerNum,
        shippingCompanyId: editCompanyId ? parseInt(editCompanyId) : null,
        shippingCompany: company?.name || "",
        priceCNY: parseFloat(editPriceCNY) || 0,
        priceUSD: parseFloat(editPriceUSD) || 0,
      },
    });
  };

  const handlePrint = (container: any) => {
    const itemsHtml = container.items?.map((item: any) =>
      `<tr><td>${item.productName || `منتج #${item.productId}`}${item.productNameZh ? '<br/><small style="color:#666">' + item.productNameZh + '</small>' : ''}</td><td class="text-center">${item.quantity}</td></tr>`
    ).join("") || "";

    const infoHtml = `
      <div class="info-row">
        <div class="info-item"><span class="info-label">رقم الفاتورة:</span> <span class="info-value">${container.invoiceNumber || "-"}</span></div>
        <div class="info-item"><span class="info-label">شركة الشحن:</span> <span class="info-value">${container.shippingCompanyName || "-"}</span></div>
        <div class="info-item"><span class="info-label">المخزن:</span> <span class="info-value">${container.warehouseName || "-"}</span></div>
        <div class="info-item"><span class="info-label">التاريخ:</span> <span class="info-value">${container.createdAt ? new Date(container.createdAt).toLocaleDateString("fr-FR") : "-"}</span></div>
      </div>
      ${!hidePrice && (container.priceCNY > 0 || container.priceUSD > 0) ? `
      <div class="summary-grid" style="grid-template-columns: repeat(2, 1fr);">
        ${container.priceCNY > 0 ? `<div class="summary-card"><div class="summary-label">السعر (يوان)</div><div class="summary-value">${container.priceCNY.toFixed(2)}<span class="currency-label">CNY</span></div></div>` : ""}
        ${container.priceUSD > 0 ? `<div class="summary-card"><div class="summary-label">السعر (دولار)</div><div class="summary-value">${container.priceUSD.toFixed(2)}<span class="currency-label">USD</span></div></div>` : ""}
      </div>` : ""}
    `;

    const tableHtml = `
      <table>
        <thead><tr><th>المنتج</th><th>الكمية</th></tr></thead>
        <tbody>${itemsHtml}</tbody>
      </table>
    `;

    openPrintWindow({
      title: `حاوية #${container.containerNumber || container.id}`,
      content: infoHtml + tableHtml,
    });
  };

  const statusLabels: Record<string, string> = {
    shipping: "في الشحن",
    arrived: "وصلت",
  };

  const statusColors: Record<string, string> = {
    shipping: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    arrived: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
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

  if (!containersList || containersList.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Ship className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">{t("shipping.noContainers", language)}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">{t("shipping.containerHistory", language)}</h2>
      {containersList.map((container: any) => (
        <Card key={container.id} data-testid={`card-container-history-${container.id}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <CardTitle className="text-base">
                حاوية #{container.containerNumber || container.id}
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" onClick={() => setViewContainer(container)} data-testid={`button-view-container-${container.id}`}>
                  <Eye className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => startEdit(container)} data-testid={`button-edit-container-${container.id}`}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => handlePrint(container)} data-testid={`button-print-container-${container.id}`}>
                  <Printer className="h-4 w-4" />
                </Button>
                <Badge variant="secondary" className={statusColors[container.status]}>
                  {statusLabels[container.status] || container.status}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
              {container.invoiceNumber && <span>فاتورة: {container.invoiceNumber}</span>}
              {container.shippingCompanyName && <span>{t("shipping.shippingCompany", language)}: {container.shippingCompanyName}</span>}
              {container.warehouseName && <span>المخزن: {container.warehouseName}</span>}
              {!hidePrice && (container.priceCNY > 0 || container.priceUSD > 0) && (
                <span>
                  السعر:
                  {container.priceCNY > 0 && ` ${container.priceCNY.toFixed(2)} CNY`}
                  {container.priceCNY > 0 && container.priceUSD > 0 && " | "}
                  {container.priceUSD > 0 && ` ${container.priceUSD.toFixed(2)} USD`}
                </span>
              )}
              {container.createdAt && <span>{formatDateFr(container.createdAt)}</span>}
            </div>
          </CardHeader>
        </Card>
      ))}

      <Dialog open={!!viewContainer} onOpenChange={(open) => { if (!open) setViewContainer(null); }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>حاوية #{viewContainer?.containerNumber || viewContainer?.id}</DialogTitle>
          </DialogHeader>
          {viewContainer && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">{t("shipping.invoiceNumber", language)}:</span> <span className="font-medium">{viewContainer.invoiceNumber || "-"}</span></div>
                <div><span className="text-muted-foreground">{t("shipping.containerNumber", language)}:</span> <span className="font-medium">{viewContainer.containerNumber || "-"}</span></div>
                <div><span className="text-muted-foreground">{t("shipping.shippingCompany", language)}:</span> <span className="font-medium">{viewContainer.shippingCompanyName || "-"}</span></div>
                <div><span className="text-muted-foreground">المخزن:</span> <span className="font-medium">{viewContainer.warehouseName || "-"}</span></div>
                <div><span className="text-muted-foreground">الحالة:</span> <Badge variant="secondary" className={statusColors[viewContainer.status]}>{statusLabels[viewContainer.status] || viewContainer.status}</Badge></div>
                <div><span className="text-muted-foreground">التاريخ:</span> <span className="font-medium">{viewContainer.createdAt ? formatDateFr(viewContainer.createdAt) : "-"}</span></div>
                {!hidePrice && (viewContainer.priceCNY > 0 || viewContainer.priceUSD > 0) && (
                  <div className="col-span-2"><span className="text-muted-foreground">السعر:</span> <span className="font-medium">{viewContainer.priceCNY > 0 ? `${viewContainer.priceCNY.toFixed(2)} CNY` : ""}{viewContainer.priceCNY > 0 && viewContainer.priceUSD > 0 ? " | " : ""}{viewContainer.priceUSD > 0 ? `${viewContainer.priceUSD.toFixed(2)} USD` : ""}</span></div>
                )}
              </div>
              {viewContainer.items && viewContainer.items.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("common.product", language)}</TableHead>
                      <TableHead>{t("common.quantity", language)}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {viewContainer.items.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <span>{item.productName || `منتج #${item.productId}`}</span>
                            {item.productNameZh && (
                              <span className="block text-sm text-muted-foreground" dir="ltr">{item.productNameZh}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{item.quantity}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              <Button variant="outline" onClick={() => handlePrint(viewContainer)} className="w-full">
                <Printer className="h-4 w-4 ml-2" />
                {t("common.print", language)}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editContainer} onOpenChange={(open) => { if (!open) setEditContainer(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تعديل حاوية #{editContainer?.containerNumber || editContainer?.id}</DialogTitle>
          </DialogHeader>
          {editContainer && (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>{t("shipping.invoiceNumber", language)}</Label>
                <Input value={editInvoice} onChange={(e) => setEditInvoice(e.target.value)} data-testid="input-edit-container-invoice" />
              </div>
              <div className="space-y-1">
                <Label>{t("shipping.containerNumber", language)}</Label>
                <Input value={editContainerNum} onChange={(e) => setEditContainerNum(e.target.value)} data-testid="input-edit-container-number" />
              </div>
              <div className="space-y-1">
                <Label>{t("shipping.shippingCompany", language)}</Label>
                <Select value={editCompanyId} onValueChange={setEditCompanyId}>
                  <SelectTrigger data-testid="select-edit-container-company">
                    <SelectValue placeholder={t("shipping.shippingCompany", language)} />
                  </SelectTrigger>
                  <SelectContent>
                    {shippingCompanies?.map((sc) => (
                      <SelectItem key={sc.id} value={String(sc.id)}>{sc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {!hidePrice && <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>سعر (يوان)</Label>
                  <Input type="number" step="0.01" value={editPriceCNY} onChange={(e) => setEditPriceCNY(e.target.value)} data-testid="input-edit-container-price-cny" />
                </div>
                <div className="space-y-1">
                  <Label>سعر (دولار)</Label>
                  <Input type="number" step="0.01" value={editPriceUSD} onChange={(e) => setEditPriceUSD(e.target.value)} data-testid="input-edit-container-price-usd" />
                </div>
              </div>}
              <Button className="w-full" onClick={saveEdit} disabled={updateMutation.isPending} data-testid="button-save-edit-container">
                {updateMutation.isPending ? "جاري الحفظ..." : "حفظ التعديلات"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
