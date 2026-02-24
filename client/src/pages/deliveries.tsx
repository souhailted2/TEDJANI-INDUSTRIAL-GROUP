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
import { Truck, Printer, Layers, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "@/App";
import { useLanguage } from "@/lib/language-context";
import { t } from "@/lib/translations";
import type { Supplier, Warehouse as WarehouseType } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PartDraft {
  id?: number;
  name: string;
  quantity: number;
  length: number | null;
  width: number | null;
  height: number | null;
  weight: number | null;
  piecesPerCarton: number | null;
}

interface DeliveryItemDraft {
  productId: number;
  productName: string;
  productNameZh?: string | null;
  productStatus: string;
  selected: boolean;
  quantity: number;
  price: number;
  currency: "CNY" | "USD";
  length: number;
  width: number;
  height: number;
  weight: number;
  piecesPerCarton: number;
  parts: PartDraft[];
}

export default function Deliveries() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { language } = useLanguage();
  const hidePrice = user?.role === "warehouse";
  const [dialogOpen, setDialogOpen] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [items, setItems] = useState<DeliveryItemDraft[]>([]);
  const [step, setStep] = useState<"supplier" | "items" | "summary">("supplier");
  const [expandedParts, setExpandedParts] = useState<number[]>([]);

  const { data: suppliers } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });
  const { data: warehouses } = useQuery<WarehouseType[]>({
    queryKey: ["/api/warehouses"],
  });

  const fetchSupplierOrdersMutation = useMutation({
    mutationFn: async (sId: string) => {
      const res = await fetch(`/api/suppliers/${sId}/ordered-items`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    onSuccess: (data: any[]) => {
      const draftItems: DeliveryItemDraft[] = data.map((item: any) => ({
        productId: item.productId,
        productName: item.productName,
        productNameZh: item.productNameZh || null,
        productStatus: item.productStatus || "ordered",
        selected: true,
        quantity: item.quantityOrdered,
        price: item.price,
        currency: item.currency,
        length: 0,
        width: 0,
        height: 0,
        weight: 0,
        piecesPerCarton: 0,
        parts: (item.parts || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          quantity: p.quantity || 0,
          length: p.length,
          width: p.width,
          height: p.height,
          weight: p.weight,
          piecesPerCarton: p.piecesPerCarton,
        })),
      }));
      setItems(draftItems);
      setExpandedParts([]);
      if (warehouses && warehouses.length > 0 && !warehouseId) {
        setWarehouseId(String(warehouses[0].id));
      }
      setStep("items");
    },
    onError: () => {
      toast({ title: "لا توجد بضائع مطلوبة لهذا المورد", variant: "destructive" });
    },
  });

  const confirmDeliveryMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/deliveries", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/deliveries"] });
      setDialogOpen(false);
      resetForm();
      toast({ title: "تم تأكيد التسليم بنجاح" });
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setSupplierId("");
    setWarehouseId("");
    setItems([]);
    setStep("supplier");
    setExpandedParts([]);
  };

  const handleSelectSupplier = () => {
    if (!supplierId) {
      toast({ title: "يرجى اختيار المورد", variant: "destructive" });
      return;
    }
    fetchSupplierOrdersMutation.mutate(supplierId);
  };

  const updateItem = (idx: number, field: string, value: any) => {
    setItems(prev => prev.map((item, i) =>
      i === idx ? { ...item, [field]: value } : item
    ));
  };

  const toggleSelect = (idx: number) => {
    setItems(prev => prev.map((item, i) =>
      i === idx ? { ...item, selected: !item.selected } : item
    ));
  };

  const toggleExpandParts = (productId: number) => {
    setExpandedParts(prev =>
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  const updatePart = (itemIdx: number, partIdx: number, field: string, value: any) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== itemIdx) return item;
      const newParts = [...item.parts];
      newParts[partIdx] = { ...newParts[partIdx], [field]: value };
      return { ...item, parts: newParts };
    }));
  };

  const addPart = (itemIdx: number) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== itemIdx) return item;
      return {
        ...item,
        parts: [...item.parts, { name: "", quantity: 0, length: null, width: null, height: null, weight: null, piecesPerCarton: null }],
      };
    }));
  };

  const removePart = (itemIdx: number, partIdx: number) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== itemIdx) return item;
      return { ...item, parts: item.parts.filter((_, pi) => pi !== partIdx) };
    }));
  };

  const handleConfirm = () => {
    const selected = items.filter(i => i.selected);
    if (selected.length === 0) {
      toast({ title: "يرجى اختيار بضاعة واحدة على الأقل", variant: "destructive" });
      return;
    }
    setStep("summary");
  };

  const handleSubmit = () => {
    const selected = items.filter(i => i.selected);
    confirmDeliveryMutation.mutate({
      supplierId: parseInt(supplierId),
      warehouseId: parseInt(warehouseId),
      items: selected.map(i => ({
        productId: i.productId,
        quantity: i.quantity,
        price: i.price,
        currency: i.currency,
        length: i.length || null,
        width: i.width || null,
        height: i.height || null,
        weight: i.weight || null,
        piecesPerCarton: i.piecesPerCarton || null,
        parts: i.parts,
      })),
    });
  };

  const selectedItems = items.filter(i => i.selected);
  const totalCNY = selectedItems.filter(i => i.currency === "CNY").reduce((s, i) => s + (i.price * i.quantity), 0);
  const totalUSD = selectedItems.filter(i => i.currency === "USD").reduce((s, i) => s + (i.price * i.quantity), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-deliveries-title">{t("deliveries.title", language)}</h1>
          <p className="text-muted-foreground">{t("deliveries.subtitle", language)}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button data-testid="button-receive-delivery">
              <Truck className="h-4 w-4" />
              {t("deliveries.newDelivery", language)}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {step === "supplier" && "اختيار المورد"}
                {step === "items" && "تفاصيل البضاعة"}
                {step === "summary" && "ملخص التسليم"}
              </DialogTitle>
            </DialogHeader>

            {step === "supplier" && (
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>المورد</Label>
                  <Select value={supplierId} onValueChange={setSupplierId}>
                    <SelectTrigger data-testid="select-delivery-supplier">
                      <SelectValue placeholder={t("deliveries.selectSupplier", language)} />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers?.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  data-testid="button-fetch-orders"
                  className="w-full"
                  onClick={handleSelectSupplier}
                  disabled={fetchSupplierOrdersMutation.isPending}
                >
                  {fetchSupplierOrdersMutation.isPending ? "جاري البحث..." : "عرض البضاعة"}
                </Button>
              </div>
            )}

            {step === "items" && (
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>المخزن</Label>
                  <Select value={warehouseId} onValueChange={setWarehouseId}>
                    <SelectTrigger data-testid="select-delivery-warehouse">
                      <SelectValue placeholder={t("deliveries.selectWarehouse", language)} />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses?.map((wh) => (
                        <SelectItem key={wh.id} value={String(wh.id)}>{wh.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {items.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    لا توجد بضائع مطلوبة
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr className="border-b text-muted-foreground">
                            <th className="p-1 text-right"></th>
                            <th className="p-1 text-right">{t("common.product", language)}</th>
                            <th className="p-1 text-center">{t("common.quantity", language)}</th>
                            {!hidePrice && <th className="p-1 text-center">السعر</th>}
                            {!hidePrice && <th className="p-1 text-center">العملة</th>}
                            <th className="p-1 text-center">{t("deliveries.length", language)}</th>
                            <th className="p-1 text-center">{t("deliveries.width", language)}</th>
                            <th className="p-1 text-center">{t("deliveries.height", language)}</th>
                            <th className="p-1 text-center">{t("deliveries.weight", language)}</th>
                            <th className="p-1 text-center">{t("deliveries.pcsCarton", language)}</th>
                            <th className="p-1 text-center"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((item, idx) => (
                            <>
                              <tr key={item.productId} className={`border-b ${!item.selected ? "opacity-40" : ""}`}>
                                <td className="p-1">
                                  <Checkbox
                                    checked={item.selected}
                                    onCheckedChange={() => toggleSelect(idx)}
                                    data-testid={`checkbox-item-${item.productId}`}
                                  />
                                </td>
                                <td className="p-1 font-medium whitespace-nowrap">
                                  <div className="flex items-center gap-1">
                                    <div>
                                      <span>{item.productName}</span>
                                      {item.productNameZh && (
                                        <span className="block text-sm text-muted-foreground" dir="ltr">{item.productNameZh}</span>
                                      )}
                                    </div>
                                    {item.productStatus === "semi_manufactured" && (
                                      <Badge variant="secondary" className="bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200 text-[10px] px-1">
                                        مركب
                                      </Badge>
                                    )}
                                  </div>
                                </td>
                                <td className="p-1">
                                  <input type="number" className="w-12 border rounded px-1 py-0.5 text-center text-xs bg-background" value={item.quantity}
                                    onChange={(e) => updateItem(idx, "quantity", parseInt(e.target.value) || 0)}
                                    disabled={!item.selected} data-testid={`input-quantity-${item.productId}`} />
                                </td>
                                {!hidePrice && <td className="p-1">
                                  <input type="number" step="0.01" className="w-14 border rounded px-1 py-0.5 text-center text-xs bg-background" value={item.price}
                                    onChange={(e) => updateItem(idx, "price", parseFloat(e.target.value) || 0)}
                                    disabled={!item.selected} data-testid={`input-price-${item.productId}`} />
                                </td>}
                                {!hidePrice && <td className="p-1 text-center">{item.currency === "CNY" ? "¥" : "$"}</td>}
                                <td className="p-1">
                                  <input type="number" step="0.1" className="w-12 border rounded px-1 py-0.5 text-center text-xs bg-background" value={item.length || ""}
                                    onChange={(e) => updateItem(idx, "length", parseFloat(e.target.value) || 0)}
                                    disabled={!item.selected} data-testid={`input-length-${item.productId}`} />
                                </td>
                                <td className="p-1">
                                  <input type="number" step="0.1" className="w-12 border rounded px-1 py-0.5 text-center text-xs bg-background" value={item.width || ""}
                                    onChange={(e) => updateItem(idx, "width", parseFloat(e.target.value) || 0)}
                                    disabled={!item.selected} data-testid={`input-width-${item.productId}`} />
                                </td>
                                <td className="p-1">
                                  <input type="number" step="0.1" className="w-12 border rounded px-1 py-0.5 text-center text-xs bg-background" value={item.height || ""}
                                    onChange={(e) => updateItem(idx, "height", parseFloat(e.target.value) || 0)}
                                    disabled={!item.selected} data-testid={`input-height-${item.productId}`} />
                                </td>
                                <td className="p-1">
                                  <input type="number" step="0.1" className="w-12 border rounded px-1 py-0.5 text-center text-xs bg-background" value={item.weight || ""}
                                    onChange={(e) => updateItem(idx, "weight", parseFloat(e.target.value) || 0)}
                                    disabled={!item.selected} data-testid={`input-weight-${item.productId}`} />
                                </td>
                                <td className="p-1">
                                  <input type="number" className="w-12 border rounded px-1 py-0.5 text-center text-xs bg-background" value={item.piecesPerCarton || ""}
                                    onChange={(e) => updateItem(idx, "piecesPerCarton", parseInt(e.target.value) || 0)}
                                    disabled={!item.selected} data-testid={`input-ppc-${item.productId}`} />
                                </td>
                                <td className="p-1">
                                  {item.selected && item.productStatus === "semi_manufactured" && (
                                    <Button size="icon" variant="ghost" onClick={() => toggleExpandParts(item.productId)}
                                      data-testid={`button-toggle-parts-${item.productId}`}>
                                      <Layers className="h-4 w-4 text-cyan-600" />
                                    </Button>
                                  )}
                                </td>
                              </tr>
                              {item.selected && item.productStatus === "semi_manufactured" && expandedParts.includes(item.productId) && (
                                <tr key={`parts-${item.productId}`}>
                                  <td colSpan={11} className="p-2">
                                    <div className="border rounded-md p-3 space-y-2 bg-muted/30">
                                      <div className="flex items-center justify-between gap-2">
                                        <h4 className="text-sm font-semibold flex items-center gap-1">
                                          <Layers className="h-3 w-3 text-cyan-600" />
                                          {t("deliveries.parts", language)}: <span>{item.productName}</span>
                                          {item.productNameZh && (
                                            <span className="text-sm text-muted-foreground font-normal" dir="ltr">{item.productNameZh}</span>
                                          )}
                                        </h4>
                                        <Button size="sm" variant="outline" onClick={() => addPart(idx)} data-testid={`button-add-part-${item.productId}`}>
                                          <Plus className="h-3 w-3 ml-1" />
                                          إضافة جزء
                                        </Button>
                                      </div>
                                      {item.parts.length === 0 ? (
                                        <p className="text-sm text-muted-foreground text-center py-2">لا توجد أجزاء - اضغط إضافة جزء</p>
                                      ) : (
                                        <table className="w-full text-xs border-collapse">
                                          <thead>
                                            <tr className="border-b text-muted-foreground">
                                              <th className="p-1 text-right">الاسم</th>
                                              <th className="p-1 text-center">{t("common.quantity", language)}</th>
                                              <th className="p-1 text-center">{t("deliveries.length", language)}</th>
                                              <th className="p-1 text-center">{t("deliveries.width", language)}</th>
                                              <th className="p-1 text-center">{t("deliveries.height", language)}</th>
                                              <th className="p-1 text-center">{t("deliveries.weight", language)}</th>
                                              <th className="p-1 text-center">{t("deliveries.pcsCarton", language)}</th>
                                              <th className="p-1"></th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {item.parts.map((part, pi) => (
                                              <tr key={pi} className="border-b last:border-0">
                                                <td className="p-1">
                                                  <input value={part.name} onChange={(e) => updatePart(idx, pi, "name", e.target.value)}
                                                    className="w-20 border rounded px-1 py-0.5 text-xs bg-background" data-testid={`input-part-name-${item.productId}-${pi}`} />
                                                </td>
                                                <td className="p-1">
                                                  <input type="number" value={part.quantity || ""} onChange={(e) => updatePart(idx, pi, "quantity", parseInt(e.target.value) || 0)}
                                                    className="w-12 border rounded px-1 py-0.5 text-center text-xs bg-background" data-testid={`input-part-qty-${item.productId}-${pi}`} />
                                                </td>
                                                <td className="p-1">
                                                  <input type="number" step="0.1" value={part.length ?? ""} onChange={(e) => updatePart(idx, pi, "length", parseFloat(e.target.value) || null)}
                                                    className="w-12 border rounded px-1 py-0.5 text-center text-xs bg-background" data-testid={`input-part-length-${item.productId}-${pi}`} />
                                                </td>
                                                <td className="p-1">
                                                  <input type="number" step="0.1" value={part.width ?? ""} onChange={(e) => updatePart(idx, pi, "width", parseFloat(e.target.value) || null)}
                                                    className="w-12 border rounded px-1 py-0.5 text-center text-xs bg-background" data-testid={`input-part-width-${item.productId}-${pi}`} />
                                                </td>
                                                <td className="p-1">
                                                  <input type="number" step="0.1" value={part.height ?? ""} onChange={(e) => updatePart(idx, pi, "height", parseFloat(e.target.value) || null)}
                                                    className="w-12 border rounded px-1 py-0.5 text-center text-xs bg-background" data-testid={`input-part-height-${item.productId}-${pi}`} />
                                                </td>
                                                <td className="p-1">
                                                  <input type="number" step="0.1" value={part.weight ?? ""} onChange={(e) => updatePart(idx, pi, "weight", parseFloat(e.target.value) || null)}
                                                    className="w-12 border rounded px-1 py-0.5 text-center text-xs bg-background" data-testid={`input-part-weight-${item.productId}-${pi}`} />
                                                </td>
                                                <td className="p-1">
                                                  <input type="number" value={part.piecesPerCarton ?? ""} onChange={(e) => updatePart(idx, pi, "piecesPerCarton", parseInt(e.target.value) || null)}
                                                    className="w-12 border rounded px-1 py-0.5 text-center text-xs bg-background" data-testid={`input-part-ppc-${item.productId}-${pi}`} />
                                                </td>
                                                <td className="p-1">
                                                  <Button size="icon" variant="ghost" onClick={() => removePart(idx, pi)} data-testid={`button-remove-part-${item.productId}-${pi}`}>
                                                    <Trash2 className="h-3 w-3 text-destructive" />
                                                  </Button>
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep("supplier")}>رجوع</Button>
                  <Button onClick={handleConfirm} data-testid="button-confirm-delivery">تأكيد</Button>
                </div>
              </div>
            )}

            {step === "summary" && (
              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold">
                    المورد: {suppliers?.find(s => s.id === parseInt(supplierId))?.name} |
                    المخزن: {warehouses?.find(w => w.id === parseInt(warehouseId))?.name}
                  </h3>
                  <Button variant="outline" size="icon" onClick={() => window.print()} data-testid="button-print-delivery">
                    <Printer className="h-4 w-4" />
                  </Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("common.product", language)}</TableHead>
                      <TableHead>{t("common.quantity", language)}</TableHead>
                      {!hidePrice && <TableHead>السعر</TableHead>}
                      {!hidePrice && <TableHead>العملة</TableHead>}
                      {!hidePrice && <TableHead>المجموع</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedItems.map((item) => (
                      <TableRow key={item.productId}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-1.5">
                            <div>
                              <span>{item.productName}</span>
                              {item.productNameZh && (
                                <span className="block text-sm text-muted-foreground" dir="ltr">{item.productNameZh}</span>
                              )}
                            </div>
                            {item.productStatus === "semi_manufactured" && (
                              <Badge variant="secondary" className="bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200 text-xs">
                                مركب
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        {!hidePrice && <TableCell>{item.price.toFixed(2)}</TableCell>}
                        {!hidePrice && <TableCell>{item.currency === "CNY" ? "يوان" : "دولار"}</TableCell>}
                        {!hidePrice && <TableCell className="font-semibold">{(item.price * item.quantity).toFixed(2)}</TableCell>}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {selectedItems.some(i => i.productStatus === "semi_manufactured" && i.parts.length > 0) && (
                  <div className="space-y-3">
                    {selectedItems.filter(i => i.productStatus === "semi_manufactured" && i.parts.length > 0).map((item) => (
                      <Card key={`parts-summary-${item.productId}`}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Layers className="h-4 w-4 text-cyan-600" />
                            {t("deliveries.parts", language)}: <span>{item.productName}</span>
                            {item.productNameZh && (
                              <span className="text-sm text-muted-foreground font-normal" dir="ltr">{item.productNameZh}</span>
                            )}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>الجزء</TableHead>
                                <TableHead>{t("common.quantity", language)}</TableHead>
                                <TableHead>{t("deliveries.length", language)}</TableHead>
                                <TableHead>{t("deliveries.width", language)}</TableHead>
                                <TableHead>{t("deliveries.height", language)}</TableHead>
                                <TableHead>{t("deliveries.weight", language)}</TableHead>
                                <TableHead>{t("deliveries.pcsCarton", language)}</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {item.parts.map((part, pi) => (
                                <TableRow key={pi}>
                                  <TableCell className="font-medium">{part.name}</TableCell>
                                  <TableCell>{part.quantity}</TableCell>
                                  <TableCell>{part.length ?? "-"}</TableCell>
                                  <TableCell>{part.width ?? "-"}</TableCell>
                                  <TableCell>{part.height ?? "-"}</TableCell>
                                  <TableCell>{part.weight ?? "-"}</TableCell>
                                  <TableCell>{part.piecesPerCarton ?? "-"}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {!hidePrice && <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4 space-y-2">
                      <h4 className="font-semibold text-sm">المجاميع المالية</h4>
                      {totalCNY > 0 && (
                        <div className="flex justify-between"><span>يوان صيني:</span><span className="font-bold">{totalCNY.toFixed(2)} CNY</span></div>
                      )}
                      {totalUSD > 0 && (
                        <div className="flex justify-between"><span>دولار:</span><span className="font-bold">{totalUSD.toFixed(2)} USD</span></div>
                      )}
                    </CardContent>
                  </Card>
                </div>}

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep("items")}>رجوع</Button>
                  <Button onClick={handleSubmit} disabled={confirmDeliveryMutation.isPending} data-testid="button-submit-delivery">
                    {confirmDeliveryMutation.isPending ? "جاري التأكيد..." : t("deliveries.confirmDelivery", language)}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <DeliveriesHistory />
    </div>
  );
}

function DeliveriesHistory() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const hidePrice = user?.role === "warehouse";
  const { data: deliveriesList, isLoading } = useQuery<any[]>({
    queryKey: ["/api/deliveries"],
  });

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

  if (!deliveriesList || deliveriesList.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Truck className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">{t("deliveries.noDeliveries", language)}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">{t("deliveries.deliveryHistory", language)}</h2>
      {deliveriesList.map((delivery: any) => (
        <Card key={delivery.id} data-testid={`card-delivery-${delivery.id}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <CardTitle className="text-base">
                تسليم #{delivery.id} - {delivery.supplierName || "مورد"}
              </CardTitle>
              <Badge variant="secondary">
                {delivery.warehouseName || "مخزن"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {delivery.createdAt ? new Date(delivery.createdAt).toLocaleDateString("fr-FR") : ""}
            </p>
          </CardHeader>
          {delivery.items && delivery.items.length > 0 && (
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("common.product", language)}</TableHead>
                    <TableHead>{t("common.quantity", language)}</TableHead>
                    {!hidePrice && <TableHead>السعر</TableHead>}
                    {!hidePrice && <TableHead>العملة</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {delivery.items.map((item: any) => (
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
                      {!hidePrice && <TableCell>{item.price?.toFixed(2)}</TableCell>}
                      {!hidePrice && <TableCell>{item.currency === "CNY" ? "يوان" : "دولار"}</TableCell>}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}
