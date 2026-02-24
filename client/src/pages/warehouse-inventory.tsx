import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer, Warehouse, Package, Layers } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLanguage } from "@/lib/language-context";
import { t, getStatusLabel } from "@/lib/translations";
import { openPrintWindow } from "@/lib/printStyles";

const statusColors: Record<string, string> = {
  received: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  semi_manufactured: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
};

export default function WarehouseInventory() {
  const printRef = useRef<HTMLDivElement>(null);
  const { language } = useLanguage();

  const { data: inventory, isLoading } = useQuery<any[]>({
    queryKey: ["/api/warehouse-inventory"],
  });

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;
    const isZh = language === "zh";
    const dir = isZh ? "ltr" : "rtl";
    const lang = isZh ? "zh" : "ar";
    openPrintWindow({
      title: t("warehouseInv.title", language),
      content: printContent.innerHTML,
      dir,
      lang,
    });
  };

  const totalProducts = inventory?.length || 0;
  const totalQuantity = inventory?.reduce((s: number, p: any) => s + p.quantity, 0) || 0;
  const totalWeight = inventory?.reduce((s: number, p: any) => {
    if (p.parts && p.parts.length > 0) {
      return s + p.parts.reduce((ps: number, part: any) => ps + ((part.weight || 0) * (part.quantity || 0)), 0);
    }
    return s + ((p.weight || 0) * p.quantity);
  }, 0) || 0;
  const totalVolume = inventory?.reduce((s: number, p: any) => {
    if (p.parts && p.parts.length > 0) {
      return s + p.parts.reduce((ps: number, part: any) => {
        const vol = ((part.length || 0) * (part.width || 0) * (part.height || 0)) / 1000000;
        return ps + vol * (part.quantity || 0);
      }, 0);
    }
    const vol = ((p.length || 0) * (p.width || 0) * (p.height || 0)) / 1000000;
    return s + vol * p.quantity;
  }, 0) || 0;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-inventory-title">{t("warehouseInv.title", language)}</h1>
          <p className="text-muted-foreground">{t("warehouseInv.subtitle", language)}</p>
        </div>
        {inventory && inventory.length > 0 && (
          <Button variant="outline" onClick={handlePrint} data-testid="button-print-inventory">
            <Printer className="h-4 w-4" />
            {t("common.print", language)}
          </Button>
        )}
      </div>

      <div ref={printRef}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t("warehouseInv.totalProducts", language)}</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold" data-testid="text-total-products">{totalProducts}</span>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t("warehouseInv.totalQuantity", language)}</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold" data-testid="text-total-quantity">{totalQuantity}</span>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t("warehouseInv.totalWeight", language)} ({t("products.kg", language)})</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold" data-testid="text-total-weight">{totalWeight.toFixed(2)}</span>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t("warehouseInv.totalVolume", language)} (m³)</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold" data-testid="text-total-volume">{totalVolume.toFixed(4)}</span>
            </CardContent>
          </Card>
        </div>

        {!inventory || inventory.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Warehouse className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">{t("warehouseInv.noInventory", language)}</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>{t("common.product", language)}</TableHead>
                    <TableHead>{t("common.category", language)}</TableHead>
                    <TableHead>{t("common.status", language)}</TableHead>
                    <TableHead>{t("common.quantity", language)}</TableHead>
                    <TableHead>{t("products.weight", language)} ({t("products.kg", language)})</TableHead>
                    <TableHead>{t("warehouseInv.dimensions", language)} ({t("products.cm", language)})</TableHead>
                    <TableHead>{t("warehouseInv.volume", language)} (m³)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory.map((item: any, idx: number) => {
                    const hasParts = item.parts && item.parts.length > 0;
                    const itemWeight = hasParts
                      ? item.parts.reduce((s: number, p: any) => s + ((p.weight || 0) * (p.quantity || 0)), 0)
                      : (item.weight || 0) * item.quantity;
                    const itemVolume = hasParts
                      ? item.parts.reduce((s: number, p: any) => {
                          return s + (((p.length || 0) * (p.width || 0) * (p.height || 0)) / 1000000) * (p.quantity || 0);
                        }, 0)
                      : (((item.length || 0) * (item.width || 0) * (item.height || 0)) / 1000000) * item.quantity;

                    return (
                      <>
                        <TableRow key={item.id} data-testid={`row-inventory-${item.id}`}>
                          <TableCell>{idx + 1}</TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <div>
                                <span>{item.name}</span>
                                {item.nameZh && (
                                  <span className="block text-sm text-muted-foreground" dir="ltr">{item.nameZh}</span>
                                )}
                              </div>
                              {hasParts && <Layers className="h-4 w-4 text-muted-foreground" />}
                            </div>
                          </TableCell>
                          <TableCell>{item.categoryName || "-"}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={statusColors[item.status] || ""}>
                              {getStatusLabel(item.status, language)}
                            </Badge>
                          </TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{itemWeight.toFixed(2)}</TableCell>
                          <TableCell>
                            {hasParts ? "-" : `${item.length || 0} × ${item.width || 0} × ${item.height || 0}`}
                          </TableCell>
                          <TableCell>{itemVolume.toFixed(4)}</TableCell>
                        </TableRow>
                        {hasParts && item.parts.map((part: any) => (
                          <TableRow key={`part-${part.id}`} className="bg-muted/30">
                            <TableCell></TableCell>
                            <TableCell className="text-sm text-muted-foreground pr-8">
                              <div className="flex items-center gap-1">
                                <Package className="h-3 w-3" />
                                {part.name}
                              </div>
                            </TableCell>
                            <TableCell></TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-xs">{t("products.parts", language)}</Badge>
                            </TableCell>
                            <TableCell className="text-sm">{part.quantity || 0}</TableCell>
                            <TableCell className="text-sm">{((part.weight || 0) * (part.quantity || 0)).toFixed(2)}</TableCell>
                            <TableCell className="text-sm">
                              {part.length || 0} × {part.width || 0} × {part.height || 0}
                            </TableCell>
                            <TableCell className="text-sm">
                              {((((part.length || 0) * (part.width || 0) * (part.height || 0)) / 1000000) * (part.quantity || 0)).toFixed(4)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
