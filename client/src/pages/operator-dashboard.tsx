import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatAmount, formatDateSimple } from "@/lib/format";
import { Truck as TruckIcon, Plus, MapPin, Route, Fuel, AlertTriangle } from "lucide-react";
import type { Truck, TruckTrip } from "@shared/schema";

function TripForm({ truck, onClose }: { truck: Truck; onClose: () => void }) {
  const { toast } = useToast();
  const [departure, setDeparture] = useState("");
  const [arrival, setArrival] = useState("");
  const [fuelExp, setFuelExp] = useState("");
  const [foodExp, setFoodExp] = useState("");
  const [sparePartsExp, setSparePartsExp] = useState("");
  const [oldOdo, setOldOdo] = useState("");
  const [newOdo, setNewOdo] = useState("");
  const [tripFare, setTripFare] = useState("");
  const [driverWageEntry, setDriverWageEntry] = useState("");
  const [commissionEntry, setCommissionEntry] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const { data: lastTrip } = useQuery<TruckTrip | null>({
    queryKey: [`/api/trucks/${truck.id}/last-trip`],
  });

  const actualOldOdo = oldOdo || (lastTrip ? String(lastTrip.newOdometer) : "0");

  const km = Math.max(0, Number(newOdo || 0) - Number(actualOldOdo));
  const fuelFormula = Number(truck.fuelFormula || 0);
  const expectedFuel = km * fuelFormula;
  const totalExpenses = Number(fuelExp || 0) + Number(foodExp || 0) + Number(sparePartsExp || 0) + Number(driverWageEntry || 0) + Number(commissionEntry || 0);
  const netResult = Number(tripFare || 0) - totalExpenses;
  const actualFuel = Number(fuelExp || 0);
  const fuelExceedsExpected = expectedFuel > 0 && actualFuel > expectedFuel;

  const addTripMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", `/api/trucks/${truck.id}/trips`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trucks"] });
      queryClient.invalidateQueries({ queryKey: [`/api/trucks/${truck.id}/trips`] });
      queryClient.invalidateQueries({ queryKey: [`/api/trucks/${truck.id}/last-trip`] });
      onClose();
      toast({ title: "تم تسجيل الرحلة بنجاح" });
    },
    onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>من أين</Label>
          <Input value={departure} onChange={e => setDeparture(e.target.value)} placeholder="مدينة الانطلاق" data-testid="input-op-departure" />
        </div>
        <div className="space-y-2">
          <Label>إلى أين</Label>
          <Input value={arrival} onChange={e => setArrival(e.target.value)} placeholder="مدينة الوصول" data-testid="input-op-arrival" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>العداد القديم (كم)</Label>
          <Input type="number" value={oldOdo || (lastTrip ? String(lastTrip.newOdometer) : "")} onChange={e => setOldOdo(e.target.value)} placeholder={lastTrip ? String(lastTrip.newOdometer) : "0"} step="0.01" dir="ltr" data-testid="input-op-old-odometer" />
        </div>
        <div className="space-y-2">
          <Label>العداد الجديد (كم)</Label>
          <Input type="number" value={newOdo} onChange={e => setNewOdo(e.target.value)} placeholder="0" step="0.01" dir="ltr" data-testid="input-op-new-odometer" />
        </div>
      </div>
      {km > 0 && (
        <div className="p-3 rounded-md bg-muted/50 text-sm">
          <span className="text-muted-foreground">المسافة: </span>
          <span className="font-bold">{formatAmount(km)} كم</span>
          {fuelFormula > 0 && (
            <>
              <span className="text-muted-foreground mx-2">|</span>
              <span className="text-muted-foreground">البنزين المتوقع: </span>
              <span className="font-bold text-orange-600">{formatAmount(expectedFuel)} د.ج</span>
            </>
          )}
        </div>
      )}
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label>مصاريف البنزين</Label>
          <Input type="number" value={fuelExp} onChange={e => setFuelExp(e.target.value)} placeholder="0" step="0.01" dir="ltr" data-testid="input-op-fuel-expense" />
        </div>
        <div className="space-y-2">
          <Label>مصاريف الأكل</Label>
          <Input type="number" value={foodExp} onChange={e => setFoodExp(e.target.value)} placeholder="0" step="0.01" dir="ltr" data-testid="input-op-food-expense" />
        </div>
        <div className="space-y-2">
          <Label>قطع الغيار</Label>
          <Input type="number" value={sparePartsExp} onChange={e => setSparePartsExp(e.target.value)} placeholder="0" step="0.01" dir="ltr" data-testid="input-op-spare-parts" />
        </div>
      </div>
      {fuelExceedsExpected && (
        <div className="flex items-center gap-2 p-2 rounded-md bg-orange-500/10 border border-orange-500/30 text-orange-700 dark:text-orange-400 text-xs" data-testid="op-fuel-warning">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>تنبيه: تكلفة البنزين ({formatAmount(actualFuel)} د.ج) أكثر من المتوقع ({formatAmount(expectedFuel)} د.ج)</span>
        </div>
      )}
      <div className="space-y-2">
        <Label>أجرة الرحلة (د.ج)</Label>
        <Input type="number" value={tripFare} onChange={e => setTripFare(e.target.value)} placeholder="0" step="0.01" dir="ltr" data-testid="input-op-trip-fare" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>أجرة السائق (د.ج)</Label>
          <Input type="number" value={driverWageEntry} onChange={e => setDriverWageEntry(e.target.value)} placeholder="0" step="0.01" dir="ltr" data-testid="input-op-driver-wage-entry" />
        </div>
        <div className="space-y-2">
          <Label>عمولة السائق (د.ج)</Label>
          <Input type="number" value={commissionEntry} onChange={e => setCommissionEntry(e.target.value)} placeholder="0" step="0.01" dir="ltr" data-testid="input-op-commission-entry" />
        </div>
      </div>
      <div className="p-3 rounded-md bg-muted/50 grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-muted-foreground">إجمالي المصاريف: </span>
          <span className="font-bold text-red-600">{formatAmount(totalExpenses)} د.ج</span>
        </div>
        <div>
          <span className="text-muted-foreground">الناتج الصافي: </span>
          <span className={`font-bold ${netResult >= 0 ? "text-green-600" : "text-red-600"}`}>{formatAmount(netResult)} د.ج</span>
        </div>
      </div>
      <div className="space-y-2">
        <Label>التاريخ</Label>
        <Input type="date" value={date} onChange={e => setDate(e.target.value)} data-testid="input-op-trip-date" />
      </div>
      <Button
        className="w-full"
        onClick={() => {
          if (!departure || !arrival) {
            toast({ title: "يرجى إدخال الوجهة", variant: "destructive" });
            return;
          }
          addTripMutation.mutate({
            departureLocation: departure,
            arrivalLocation: arrival,
            fuelExpense: fuelExp || "0",
            foodExpense: foodExp || "0",
            sparePartsExpense: sparePartsExp || "0",
            oldOdometer: actualOldOdo,
            newOdometer: newOdo || "0",
            tripFare: tripFare || "0",
            expectedFuel: String(expectedFuel),
            driverWageEntry: driverWageEntry || "0",
            commissionEntry: commissionEntry || "0",
            netResult: String(netResult),
            date,
          });
        }}
        disabled={!departure || !arrival || addTripMutation.isPending}
        data-testid="button-op-submit-trip"
      >
        تسجيل الرحلة
      </Button>
    </div>
  );
}

export default function OperatorDashboard() {
  const { data: trucks, isLoading } = useQuery<Truck[]>({ queryKey: ["/api/trucks"] });
  const [selectedTruckId, setSelectedTruckId] = useState<string | null>(null);
  const [tripDialogOpen, setTripDialogOpen] = useState(false);

  const selectedTruck = trucks?.find(t => t.id === selectedTruckId);

  const { data: trips } = useQuery<TruckTrip[]>({
    queryKey: [`/api/trucks/${selectedTruckId}/trips`],
    enabled: !!selectedTruckId,
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold" data-testid="text-operator-title">لوحة المشغّل - الرحلات</h1>
      </div>

      <div className="space-y-2">
        <Label>اختر الشاحنة</Label>
        <Select value={selectedTruckId || ""} onValueChange={setSelectedTruckId}>
          <SelectTrigger data-testid="select-op-truck">
            <SelectValue placeholder="اختر شاحنة..." />
          </SelectTrigger>
          <SelectContent>
            {trucks?.map(truck => (
              <SelectItem key={truck.id} value={truck.id}>
                <div className="flex items-center gap-2">
                  <TruckIcon className="w-4 h-4" />
                  <span>{truck.number}</span>
                  {truck.driverName && <span className="text-muted-foreground">- {truck.driverName}</span>}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedTruck && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <TruckIcon className="w-5 h-5" />
                {selectedTruck.number}
                {selectedTruck.driverName && (
                  <span className="text-sm text-muted-foreground font-normal">({selectedTruck.driverName})</span>
                )}
              </CardTitle>
              <Dialog open={tripDialogOpen} onOpenChange={setTripDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-op-add-trip">
                    <Plus className="w-4 h-4 ml-1" />
                    رحلة جديدة
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>تسجيل رحلة - {selectedTruck.number}</DialogTitle>
                  </DialogHeader>
                  <TripForm truck={selectedTruck} onClose={() => setTripDialogOpen(false)} />
                </DialogContent>
              </Dialog>
            </CardHeader>
          </Card>

          <h2 className="text-lg font-semibold" data-testid="text-trips-history">سجل الرحلات والعدادات</h2>

          {trips && trips.length > 0 ? (
            <div className="space-y-3">
              {trips.map(trip => (
                <Card key={trip.id} data-testid={`card-op-trip-${trip.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          {trip.departureLocation} ← {trip.arrivalLocation}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {trip.date || formatDateSimple(trip.createdAt)}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1" title="العداد">
                          <Route className="w-4 h-4 text-muted-foreground" />
                          <span dir="ltr">{formatAmount(Number(trip.oldOdometer))} → {formatAmount(Number(trip.newOdometer))}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ({formatAmount(Math.max(0, Number(trip.newOdometer) - Number(trip.oldOdometer)))} كم)
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">بنزين: </span>
                        <span>{formatAmount(Number(trip.fuelExpense))} د.ج</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">أكل: </span>
                        <span>{formatAmount(Number(trip.foodExpense))} د.ج</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">قطع غيار: </span>
                        <span>{formatAmount(Number(trip.sparePartsExpense))} د.ج</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">أجرة: </span>
                        <span className="font-medium">{formatAmount(Number(trip.tripFare))} د.ج</span>
                      </div>
                    </div>
                    {Number(trip.expectedFuel) > 0 && (
                      <div className="mt-2 flex items-center gap-1 text-xs">
                        <Fuel className="w-3 h-3 text-orange-500" />
                        <span className="text-muted-foreground">بنزين متوقع: </span>
                        <span className="text-orange-600">{formatAmount(Number(trip.expectedFuel))} د.ج</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                لا توجد رحلات مسجلة لهذه الشاحنة
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {!selectedTruckId && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <TruckIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
            اختر شاحنة لعرض الرحلات والعدادات
          </CardContent>
        </Card>
      )}
    </div>
  );
}
