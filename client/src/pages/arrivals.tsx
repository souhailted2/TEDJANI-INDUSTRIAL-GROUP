import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Anchor, Ship, CheckCircle } from "lucide-react";
import type { Container } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export default function Arrivals() {
  const { toast } = useToast();

  const { data: containers, isLoading } = useQuery<Container[]>({
    queryKey: ["/api/containers"],
  });

  const arrivalMutation = useMutation({
    mutationFn: async (containerId: number) => {
      const res = await apiRequest("PATCH", `/api/containers/${containerId}/arrive`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/containers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "تم تأكيد وصول الحاوية" });
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  const shippingContainers = containers?.filter(c => c.status === "shipping") || [];
  const arrivedContainers = containers?.filter(c => c.status === "arrived") || [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-arrivals-title">وصول الحاويات</h1>
        <p className="text-muted-foreground">تتبع وصول الحاويات إلى الميناء</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Ship className="h-5 w-5" />
          حاويات في الطريق ({shippingContainers.length})
        </h2>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <Card key={i}><CardContent className="p-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
            ))}
          </div>
        ) : shippingContainers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {shippingContainers.map((c) => (
              <Card key={c.id} data-testid={`card-container-${c.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <CardTitle className="text-base">حاوية #{c.containerNumber || c.id}</CardTitle>
                    <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">في الشحن</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {c.invoiceNumber && <p className="text-sm"><span className="text-muted-foreground">فاتورة:</span> {c.invoiceNumber}</p>}
                  {c.shippingCompany && <p className="text-sm"><span className="text-muted-foreground">شركة الشحن:</span> {c.shippingCompany}</p>}
                  <p className="text-sm text-muted-foreground">
                    {c.createdAt ? new Date(c.createdAt).toLocaleDateString("fr-FR") : ""}
                  </p>
                  <Button
                    className="w-full mt-2"
                    onClick={() => arrivalMutation.mutate(c.id)}
                    disabled={arrivalMutation.isPending}
                    data-testid={`button-arrive-${c.id}`}
                  >
                    <Anchor className="h-4 w-4" />
                    تأكيد الوصول
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <Ship className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">لا توجد حاويات في الطريق</p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          حاويات وصلت ({arrivedContainers.length})
        </h2>

        {arrivedContainers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {arrivedContainers.map((c) => (
              <Card key={c.id} data-testid={`card-arrived-${c.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <CardTitle className="text-base">حاوية #{c.containerNumber || c.id}</CardTitle>
                    <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">وصلت</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-1">
                  {c.invoiceNumber && <p className="text-sm"><span className="text-muted-foreground">فاتورة:</span> {c.invoiceNumber}</p>}
                  {c.shippingCompany && <p className="text-sm"><span className="text-muted-foreground">شركة الشحن:</span> {c.shippingCompany}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <Anchor className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">لا توجد حاويات وصلت بعد</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
