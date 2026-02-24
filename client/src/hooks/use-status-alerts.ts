import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@shared/schema";

interface AlertRule {
  status: string;
  label: string;
  thresholdMs: number;
  intervalMs: number;
}

const ALERT_RULES: AlertRule[] = [
  {
    status: "purchase_order",
    label: "طلب شراء",
    thresholdMs: 7 * 24 * 60 * 60 * 1000,
    intervalMs: 60 * 60 * 1000,
  },
  {
    status: "ordered",
    label: "تم الطلب",
    thresholdMs: 30 * 24 * 60 * 60 * 1000,
    intervalMs: 24 * 60 * 60 * 1000,
  },
  {
    status: "received",
    label: "تم الاستلام",
    thresholdMs: 7 * 24 * 60 * 60 * 1000,
    intervalMs: 60 * 60 * 1000,
  },
];

const STORAGE_KEY = "status_alerts_last_shown";

function getLastShown(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function setLastShown(key: string, time: number) {
  const data = getLastShown();
  data[key] = time;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function useStatusAlerts() {
  const { toast } = useToast();

  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    refetchInterval: 60 * 1000,
  });

  useEffect(() => {
    if (!products || products.length === 0) return;

    const now = Date.now();
    const lastShown = getLastShown();

    for (const rule of ALERT_RULES) {
      const overdueProducts = products.filter((p) => {
        if (p.status !== rule.status || !p.statusChangedAt) return false;
        const changedAt = new Date(p.statusChangedAt).getTime();
        return now - changedAt > rule.thresholdMs;
      });

      if (overdueProducts.length === 0) continue;

      const alertKey = `alert_${rule.status}`;
      const lastAlertTime = lastShown[alertKey] || 0;

      if (now - lastAlertTime < rule.intervalMs) continue;

      const thresholdLabel =
        rule.thresholdMs >= 30 * 24 * 60 * 60 * 1000 ? "شهر" : "أسبوع";

      const productNames = overdueProducts
        .slice(0, 5)
        .map((p) => p.name)
        .join("، ");
      const extra =
        overdueProducts.length > 5
          ? ` و ${overdueProducts.length - 5} منتج آخر`
          : "";

      toast({
        title: `تنبيه: ${overdueProducts.length} منتج بحالة "${rule.label}" منذ أكثر من ${thresholdLabel}`,
        description: `${productNames}${extra}`,
        variant: "destructive",
        duration: 10000,
      });

      setLastShown(alertKey, now);
    }
  }, [products, toast]);
}
