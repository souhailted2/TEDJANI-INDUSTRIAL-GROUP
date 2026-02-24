import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Users, Ship, Anchor, Wallet, TrendingDown, Truck, Warehouse, Container, Calculator } from "lucide-react";
import type { Product, Supplier, Container as ContainerType } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/lib/language-context";
import { t, getStatusLabel } from "@/lib/translations";
import { useAuth } from "@/App";

const statusColors: Record<string, string> = {
  purchase_order: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  ordered: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  received: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  semi_manufactured: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  shipping: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  arrived: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
};

const statusKeys = ["purchase_order", "ordered", "received", "semi_manufactured", "shipping", "arrived"];

function formatNumber(num: number): string {
  return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function debtColor(value: number): string {
  if (value > 0) return "text-red-600 dark:text-red-400";
  if (value < 0) return "text-green-600 dark:text-green-400";
  return "";
}

export default function Dashboard() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });
  const { data: suppliers, isLoading: suppliersLoading } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });
  const { data: containers, isLoading: containersLoading } = useQuery<ContainerType[]>({
    queryKey: ["/api/containers"],
  });
  const { data: summary, isLoading: summaryLoading } = useQuery<any>({
    queryKey: ["/api/dashboard/summary"],
    enabled: isAdmin,
  });

  const statusCounts = products?.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const shippingContainers = containers?.filter(c => c.status === "shipping") || [];
  const arrivedContainers = containers?.filter(c => c.status === "arrived") || [];

  const isLoading = productsLoading || suppliersLoading || containersLoading;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-dashboard-title">{t("dashboard.title", language)}</h1>
        <p className="text-muted-foreground">{t("dashboard.overview", language)}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card data-testid="card-total-products">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("dashboard.totalProducts", language)}</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{products?.length || 0}</div>
              </CardContent>
            </Card>

            <Card data-testid="card-total-suppliers">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("dashboard.totalSuppliers", language)}</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{suppliers?.length || 0}</div>
              </CardContent>
            </Card>

            <Card data-testid="card-shipping-containers">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("dashboard.containersShipping", language)}</CardTitle>
                <Ship className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{shippingContainers.length}</div>
              </CardContent>
            </Card>

            <Card data-testid="card-arrived-containers">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("dashboard.containersArrived", language)}</CardTitle>
                <Anchor className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{arrivedContainers.length}</div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {isAdmin && (
        <div>
          <h2 className="text-lg font-semibold mb-4" data-testid="text-financial-summary">{t("dashboard.financialSummary", language)}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {summaryLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-4" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-6 w-32 mb-1" />
                    <Skeleton className="h-6 w-32" />
                  </CardContent>
                </Card>
              ))
            ) : summary ? (
              <>
                <Card data-testid="card-cashbox-balance">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t("dashboard.cashboxBalance", language)}</CardTitle>
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-lg font-bold ${summary.cashbox.balanceCNY >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`} dir="ltr">
                      ¥ {formatNumber(summary.cashbox.balanceCNY)}
                    </div>
                    <div className={`text-lg font-bold ${summary.cashbox.balanceUSD >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`} dir="ltr">
                      $ {formatNumber(summary.cashbox.balanceUSD)}
                    </div>
                  </CardContent>
                </Card>

                <Card data-testid="card-supplier-debt">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t("dashboard.supplierDebt", language)}</CardTitle>
                    <TrendingDown className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-lg font-bold ${debtColor(summary.supplierDebt.CNY)}`} dir="ltr">
                      ¥ {formatNumber(summary.supplierDebt.CNY)}
                    </div>
                    <div className={`text-lg font-bold ${debtColor(summary.supplierDebt.USD)}`} dir="ltr">
                      $ {formatNumber(summary.supplierDebt.USD)}
                    </div>
                  </CardContent>
                </Card>

                <Card data-testid="card-shipping-debt">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t("dashboard.shippingDebt", language)}</CardTitle>
                    <Truck className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-lg font-bold ${debtColor(summary.shippingDebt.CNY)}`} dir="ltr">
                      ¥ {formatNumber(summary.shippingDebt.CNY)}
                    </div>
                    <div className={`text-lg font-bold ${debtColor(summary.shippingDebt.USD)}`} dir="ltr">
                      $ {formatNumber(summary.shippingDebt.USD)}
                    </div>
                  </CardContent>
                </Card>

                <Card data-testid="card-warehouse-value">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t("dashboard.warehouseValue", language)}</CardTitle>
                    <Warehouse className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold" dir="ltr">
                      ¥ {formatNumber(summary.warehouseValue.CNY)}
                    </div>
                    <div className="text-lg font-bold" dir="ltr">
                      $ {formatNumber(summary.warehouseValue.USD)}
                    </div>
                  </CardContent>
                </Card>

                <Card data-testid="card-container-value">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t("dashboard.containerValue", language)}</CardTitle>
                    <Container className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold" dir="ltr">
                      ¥ {formatNumber(summary.containerValue.CNY)}
                    </div>
                    <div className="text-lg font-bold" dir="ltr">
                      $ {formatNumber(summary.containerValue.USD)}
                    </div>
                  </CardContent>
                </Card>

                <Card data-testid="card-grand-total" className="border-2 border-primary/20">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t("dashboard.grandTotal", language)}</CardTitle>
                    <Calculator className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold text-primary" dir="ltr">
                      ¥ {formatNumber(summary.grandTotal.CNY)}
                    </div>
                    <div className="text-lg font-bold text-primary" dir="ltr">
                      $ {formatNumber(summary.grandTotal.USD)}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : null}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("dashboard.productsByStatus", language)}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {statusKeys.map((key) => (
                  <div key={key} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={statusColors[key]}>
                        {getStatusLabel(key, language)}
                      </Badge>
                    </div>
                    <span className="text-lg font-semibold">{statusCounts[key] || 0}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("dashboard.recentContainers", language)}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
            ) : products && products.length > 0 ? (
              <div className="space-y-2">
                {products.slice(0, 8).map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-2 py-1">
                    <span className="text-sm truncate">{p.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{p.quantity}</span>
                      <Badge variant="secondary" className={statusColors[p.status]}>
                        {getStatusLabel(p.status, language)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">{t("common.noData", language)}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
