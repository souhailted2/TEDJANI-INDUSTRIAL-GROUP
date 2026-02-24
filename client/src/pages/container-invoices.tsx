import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Printer, FileText, X, Save, Merge, Unlink } from "lucide-react";
import { openPrintWindow } from "@/lib/printStyles";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";

export default function ContainerInvoices() {
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editInvoice, setEditInvoice] = useState("");
  const [editMoneyArrival, setEditMoneyArrival] = useState("");
  const [editMoneyArrivalCurrency, setEditMoneyArrivalCurrency] = useState("CNY");
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [selectedForMerge, setSelectedForMerge] = useState<number[]>([]);
  const [mergeInvoiceNumber, setMergeInvoiceNumber] = useState("");

  const { data: docs, isLoading } = useQuery<any[]>({
    queryKey: ["/api/container-documents"],
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/container-documents/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/container-documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cashbox/transactions"] });
      setEditingId(null);
      toast({ title: "تم التحديث بنجاح" });
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  const mergeMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/container-documents/merge", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/container-documents"] });
      setMergeDialogOpen(false);
      setSelectedForMerge([]);
      setMergeInvoiceNumber("");
      toast({ title: "تم دمج الحاويات في فاتورة واحدة" });
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  const unmergeMutation = useMutation({
    mutationFn: async (docId: number) => {
      const res = await apiRequest("POST", "/api/container-documents/unmerge", { docId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/container-documents"] });
      toast({ title: "تم فك الدمج" });
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  const toggleField = (id: number, field: string, value: boolean) => {
    updateMutation.mutate({ id, data: { [field]: value } });
  };

  const startEdit = (doc: any) => {
    setEditingId(doc.id);
    setEditInvoice(doc.invoice || "");
    setEditMoneyArrival(doc.moneyArrival ? String(doc.moneyArrival) : "");
    setEditMoneyArrivalCurrency(doc.moneyArrivalCurrency || "CNY");
  };

  const saveEdit = (id: number) => {
    updateMutation.mutate({
      id,
      data: {
        invoice: editInvoice || null,
        moneyArrival: editMoneyArrival || null,
        moneyArrivalCurrency: editMoneyArrivalCurrency,
      },
    });
  };

  const toggleMergeSelection = (docId: number) => {
    setSelectedForMerge(prev =>
      prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
    );
  };

  const handleMerge = () => {
    if (selectedForMerge.length < 2) {
      toast({ title: "يجب اختيار حاويتين على الأقل", variant: "destructive" });
      return;
    }
    mergeMutation.mutate({ docIds: selectedForMerge, groupInvoiceNumber: mergeInvoiceNumber });
  };

  const handlePrint = () => {
    const printContent = document.getElementById("invoices-table");
    if (!printContent) return;
    openPrintWindow({
      title: "سجل فواتير الحاويات",
      subtitle: "متابعة مستندات الحاويات",
      content: printContent.outerHTML,
    });
  };

  const formatDate = (d: string | null) => {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("fr-FR");
  };

  const groupedDocs = (() => {
    if (!docs) return [];
    const groups: Record<string, any[]> = {};
    const ungrouped: any[] = [];

    for (const doc of docs) {
      if (doc.groupInvoiceId) {
        const key = String(doc.groupInvoiceId);
        if (!groups[key]) groups[key] = [];
        groups[key].push(doc);
      } else {
        ungrouped.push(doc);
      }
    }

    const result: any[] = [];
    for (const [groupId, groupDocs] of Object.entries(groups)) {
      result.push({ type: "group", groupId: Number(groupId), docs: groupDocs });
    }
    for (const doc of ungrouped) {
      result.push({ type: "single", doc });
    }
    return result;
  })();

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const ungroupedDocs = docs?.filter(d => !d.groupInvoiceId) || [];

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h1 className="text-2xl font-bold" data-testid="text-page-title">سجل فواتير الحاويات</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={() => setMergeDialogOpen(true)} data-testid="button-merge-invoices">
            <Merge className="h-4 w-4 ml-2" />
            دمج حاويات
          </Button>
          <Button variant="outline" onClick={handlePrint} data-testid="button-print-invoices">
            <Printer className="h-4 w-4 ml-2" />
            طباعة
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            متابعة مستندات الحاويات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table id="invoices-table" data-testid="table-invoices">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">رقم الفاتورة</TableHead>
                  <TableHead className="text-center">تاريخ الفاتورة</TableHead>
                  <TableHead className="text-center">بوليصة الشحن</TableHead>
                  <TableHead className="text-center">شهادة المنشأ</TableHead>
                  <TableHead className="text-center">شهادة المطابقة</TableHead>
                  <TableHead className="text-center">الفاتورة</TableHead>
                  <TableHead className="text-center">وصول الأموال</TableHead>
                  <TableHead className="text-center">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(!docs || docs.length === 0) ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      لا توجد فواتير بعد - يتم إنشاؤها تلقائياً عند تحميل الحاويات
                    </TableCell>
                  </TableRow>
                ) : (
                  groupedDocs.map((entry, idx) => {
                    if (entry.type === "group") {
                      return entry.docs.map((doc: any, docIdx: number) => (
                        <TableRow key={doc.id} className="bg-muted/30" data-testid={`row-doc-${doc.id}`}>
                          {docIdx === 0 && (
                            <TableCell className="text-center font-bold" rowSpan={entry.docs.length} data-testid={`text-invoice-number-${doc.id}`}>
                              <div className="flex flex-col items-center gap-1">
                                <Badge variant="secondary">{doc.invoiceNumber || "-"}</Badge>
                                <span className="text-xs text-muted-foreground">({entry.docs.length} حاويات)</span>
                                <Button size="sm" variant="ghost" onClick={() => unmergeMutation.mutate(doc.id)} data-testid={`button-unmerge-${doc.id}`}>
                                  <Unlink className="h-3 w-3 ml-1" />
                                  فك الدمج
                                </Button>
                              </div>
                            </TableCell>
                          )}
                          <TableCell className="text-center" data-testid={`text-invoice-date-${doc.id}`}>
                            {formatDate(doc.invoiceDate)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Switch checked={doc.shippingBill || false} onCheckedChange={(val) => toggleField(doc.id, "shippingBill", val)} data-testid={`switch-shipping-bill-${doc.id}`} />
                          </TableCell>
                          <TableCell className="text-center">
                            <Switch checked={doc.originCertificate || false} onCheckedChange={(val) => toggleField(doc.id, "originCertificate", val)} data-testid={`switch-origin-cert-${doc.id}`} />
                          </TableCell>
                          <TableCell className="text-center">
                            <Switch checked={doc.conformityCertificate || false} onCheckedChange={(val) => toggleField(doc.id, "conformityCertificate", val)} data-testid={`switch-conformity-cert-${doc.id}`} />
                          </TableCell>
                          <TableCell className="text-center">
                            {editingId === doc.id ? (
                              <Input value={editInvoice} onChange={(e) => setEditInvoice(e.target.value)} className="text-center" data-testid={`input-invoice-${doc.id}`} />
                            ) : (
                              <span data-testid={`text-invoice-${doc.id}`}>{doc.invoice || "-"}</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {editingId === doc.id ? (
                              <div className="flex items-center gap-1">
                                <Input type="number" value={editMoneyArrival} onChange={(e) => setEditMoneyArrival(e.target.value)} className="text-center" placeholder="المبلغ" data-testid={`input-money-arrival-${doc.id}`} />
                                <Select value={editMoneyArrivalCurrency} onValueChange={setEditMoneyArrivalCurrency}>
                                  <SelectTrigger className="w-24" data-testid={`select-money-currency-${doc.id}`}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="CNY">يوان</SelectItem>
                                    <SelectItem value="USD">دولار</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            ) : (
                              <span data-testid={`text-money-arrival-${doc.id}`}>
                                {doc.moneyArrival ? (
                                  <Badge variant="default">
                                    {doc.moneyArrival} {doc.moneyArrivalCurrency === "CNY" ? "يوان" : "دولار"}
                                  </Badge>
                                ) : "-"}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {editingId === doc.id ? (
                              <div className="flex items-center justify-center gap-1">
                                <Button size="icon" variant="ghost" onClick={() => saveEdit(doc.id)} data-testid={`button-save-${doc.id}`}>
                                  <Save className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="ghost" onClick={() => setEditingId(null)} data-testid={`button-cancel-${doc.id}`}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <Button size="icon" variant="ghost" onClick={() => startEdit(doc)} data-testid={`button-edit-${doc.id}`}>
                                <FileText className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ));
                    } else {
                      const doc = entry.doc;
                      return (
                        <TableRow key={doc.id} data-testid={`row-doc-${doc.id}`}>
                          <TableCell className="text-center font-medium" data-testid={`text-invoice-number-${doc.id}`}>
                            {doc.invoiceNumber || "-"}
                          </TableCell>
                          <TableCell className="text-center" data-testid={`text-invoice-date-${doc.id}`}>
                            {formatDate(doc.invoiceDate)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Switch checked={doc.shippingBill || false} onCheckedChange={(val) => toggleField(doc.id, "shippingBill", val)} data-testid={`switch-shipping-bill-${doc.id}`} />
                          </TableCell>
                          <TableCell className="text-center">
                            <Switch checked={doc.originCertificate || false} onCheckedChange={(val) => toggleField(doc.id, "originCertificate", val)} data-testid={`switch-origin-cert-${doc.id}`} />
                          </TableCell>
                          <TableCell className="text-center">
                            <Switch checked={doc.conformityCertificate || false} onCheckedChange={(val) => toggleField(doc.id, "conformityCertificate", val)} data-testid={`switch-conformity-cert-${doc.id}`} />
                          </TableCell>
                          <TableCell className="text-center">
                            {editingId === doc.id ? (
                              <Input value={editInvoice} onChange={(e) => setEditInvoice(e.target.value)} className="text-center" data-testid={`input-invoice-${doc.id}`} />
                            ) : (
                              <span data-testid={`text-invoice-${doc.id}`}>{doc.invoice || "-"}</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {editingId === doc.id ? (
                              <div className="flex items-center gap-1">
                                <Input type="number" value={editMoneyArrival} onChange={(e) => setEditMoneyArrival(e.target.value)} className="text-center" placeholder="المبلغ" data-testid={`input-money-arrival-${doc.id}`} />
                                <Select value={editMoneyArrivalCurrency} onValueChange={setEditMoneyArrivalCurrency}>
                                  <SelectTrigger className="w-24" data-testid={`select-money-currency-${doc.id}`}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="CNY">يوان</SelectItem>
                                    <SelectItem value="USD">دولار</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            ) : (
                              <span data-testid={`text-money-arrival-${doc.id}`}>
                                {doc.moneyArrival ? (
                                  <Badge variant="default">
                                    {doc.moneyArrival} {doc.moneyArrivalCurrency === "CNY" ? "يوان" : "دولار"}
                                  </Badge>
                                ) : "-"}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {editingId === doc.id ? (
                              <div className="flex items-center justify-center gap-1">
                                <Button size="icon" variant="ghost" onClick={() => saveEdit(doc.id)} data-testid={`button-save-${doc.id}`}>
                                  <Save className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="ghost" onClick={() => setEditingId(null)} data-testid={`button-cancel-${doc.id}`}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <Button size="icon" variant="ghost" onClick={() => startEdit(doc)} data-testid={`button-edit-${doc.id}`}>
                                <FileText className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    }
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={mergeDialogOpen} onOpenChange={setMergeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>دمج حاويات في فاتورة واحدة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>رقم الفاتورة المشتركة</Label>
              <Input
                value={mergeInvoiceNumber}
                onChange={(e) => setMergeInvoiceNumber(e.target.value)}
                placeholder="أدخل رقم الفاتورة"
                data-testid="input-merge-invoice-number"
              />
            </div>
            <div className="space-y-2">
              <Label>اختر الحاويات للدمج</Label>
              <div className="max-h-60 overflow-y-auto space-y-2 border rounded-md p-3">
                {ungroupedDocs.map((doc: any) => (
                  <div key={doc.id} className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedForMerge.includes(doc.id)}
                      onCheckedChange={() => toggleMergeSelection(doc.id)}
                      data-testid={`checkbox-merge-${doc.id}`}
                    />
                    <span className="text-sm">
                      {doc.invoiceNumber || `حاوية #${doc.id}`} - {formatDate(doc.invoiceDate)}
                    </span>
                  </div>
                ))}
              </div>
              {selectedForMerge.length > 0 && (
                <p className="text-sm text-muted-foreground">تم اختيار {selectedForMerge.length} حاوية</p>
              )}
            </div>
            <Button
              className="w-full"
              onClick={handleMerge}
              disabled={selectedForMerge.length < 2 || mergeMutation.isPending}
              data-testid="button-confirm-merge"
            >
              {mergeMutation.isPending ? "جاري الدمج..." : "دمج الحاويات"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
