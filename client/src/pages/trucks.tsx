import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatAmount, formatDateSimple } from "@/lib/format";
import {
  Truck as TruckIcon, Plus, Trash2, ChevronDown, ChevronUp,
  Fuel, UtensilsCrossed, Wallet, Wrench, ArrowDown, ArrowUp, User,
  MapPin, Settings, Route, FileText, AlertTriangle, Pencil
} from "lucide-react";
import type { Truck, TruckExpense, TruckTrip } from "@shared/schema";

const EXPENSE_CATEGORIES = [
  { value: "بنزين", label: "بنزين", icon: Fuel },
  { value: "مصاريف عامة", label: "مصاريف عامة", icon: Wrench },
  { value: "أكل", label: "أكل", icon: UtensilsCrossed },
  { value: "أجرة السائق", label: "أجرة السائق", icon: User },
  { value: "عمولة السائق", label: "عمولة السائق", icon: Wallet },
];

function FuelWarning({ actualFuel, expectedFuel }: { actualFuel: number; expectedFuel: number }) {
  if (expectedFuel <= 0 || actualFuel <= expectedFuel) return null;
  const diff = actualFuel - expectedFuel;
  const pct = ((diff / expectedFuel) * 100).toFixed(0);
  return (
    <div className="flex items-center gap-2 p-2 rounded-md bg-orange-500/10 border border-orange-500/30 text-orange-700 dark:text-orange-400 text-xs" data-testid="fuel-warning">
      <AlertTriangle className="w-4 h-4 shrink-0" />
      <span>تنبيه: تكلفة البنزين ({formatAmount(actualFuel)} د.ج) أكثر من المتوقع ({formatAmount(expectedFuel)} د.ج) بفارق {formatAmount(diff)} د.ج ({pct}%)</span>
    </div>
  );
}

function TruckSettingsDialog({ truck }: { truck: Truck }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [fuelFormula, setFuelFormula] = useState(String(truck.fuelFormula || "0"));
  const [driverWage, setDriverWage] = useState(String(truck.driverWage || "0"));
  const [commissionRate, setCommissionRate] = useState(String(truck.driverCommissionRate || "0"));

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PATCH", `/api/trucks/${truck.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trucks"] });
      setOpen(false);
      toast({ title: "تم حفظ الإعدادات" });
    },
    onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => {
      if (v) {
        setFuelFormula(String(truck.fuelFormula || "0"));
        setDriverWage(String(truck.driverWage || "0"));
        setCommissionRate(String(truck.driverCommissionRate || "0"));
      }
      setOpen(v);
    }}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" data-testid={`button-truck-settings-${truck.id}`}>
          <Settings className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>إعدادات الشاحنة {truck.number}</DialogTitle>
          <DialogDescription>تعديل معادلة البنزين المتوقع</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>معادلة البنزين المتوقع (د.ج لكل كم)</Label>
            <Input type="number" value={fuelFormula} onChange={e => setFuelFormula(e.target.value)} step="0.01" dir="ltr" data-testid="input-fuel-formula" />
            <p className="text-xs text-muted-foreground">البنزين المتوقع = عدد الكيلومترات × هذه القيمة</p>
          </div>
          <div className="space-y-2">
            <Label>أجرة السائق الافتراضية (د.ج)</Label>
            <Input type="number" value={driverWage} onChange={e => setDriverWage(e.target.value)} step="0.01" dir="ltr" data-testid="input-driver-wage" />
            <p className="text-xs text-muted-foreground">قيمة افتراضية تظهر عند تسجيل رحلة جديدة</p>
          </div>
          <div className="space-y-2">
            <Label>نسبة عمولة السائق الافتراضية (%)</Label>
            <Input type="number" value={commissionRate} onChange={e => setCommissionRate(e.target.value)} step="0.01" dir="ltr" data-testid="input-commission-rate" />
            <p className="text-xs text-muted-foreground">نسبة افتراضية تظهر عند تسجيل رحلة جديدة</p>
          </div>
          <Button
            className="w-full"
            onClick={() => updateMutation.mutate({ fuelFormula, driverWage, driverCommissionRate: commissionRate })}
            disabled={updateMutation.isPending}
            data-testid="button-save-settings"
          >
            حفظ الإعدادات
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TripFormFields({ truck, initialTrip, onSubmit, isPending, submitLabel }: {
  truck: Truck;
  initialTrip?: TruckTrip;
  onSubmit: (data: any) => void;
  isPending: boolean;
  submitLabel: string;
}) {
  const { toast } = useToast();
  const { hasPermission, user } = useAuth();
  const canViewTotals = user?.role !== "app_user" || hasPermission("view_totals");
  const [departure, setDeparture] = useState(initialTrip?.departureLocation || "");
  const [arrival, setArrival] = useState(initialTrip?.arrivalLocation || "");
  const [fuelExp, setFuelExp] = useState(initialTrip ? String(initialTrip.fuelExpense) : "");
  const [foodExp, setFoodExp] = useState(initialTrip ? String(initialTrip.foodExpense) : "");
  const [sparePartsExp, setSparePartsExp] = useState(initialTrip ? String(initialTrip.sparePartsExpense) : "");
  const [oldOdo, setOldOdo] = useState(initialTrip ? String(initialTrip.oldOdometer) : "");
  const [newOdo, setNewOdo] = useState(initialTrip ? String(initialTrip.newOdometer) : "");
  const [tripFare, setTripFare] = useState(initialTrip ? String(initialTrip.tripFare) : "");
  const [driverWageEntry, setDriverWageEntry] = useState(initialTrip ? String(initialTrip.driverWageEntry) : "");
  const [commissionEntry, setCommissionEntry] = useState(initialTrip ? String(initialTrip.commissionEntry) : "");
  const [tripDate, setTripDate] = useState(initialTrip?.date || new Date().toISOString().split("T")[0]);

  const { data: lastTrip } = useQuery<TruckTrip | null>({
    queryKey: [`/api/trucks/${truck.id}/last-trip`],
    enabled: !initialTrip,
  });

  const actualOldOdo = initialTrip ? oldOdo : (oldOdo || (lastTrip ? String(lastTrip.newOdometer) : "0"));

  const km = Math.max(0, Number(newOdo || 0) - Number(actualOldOdo));
  const fuelFormula = Number(truck.fuelFormula || 0);
  const expectedFuel = km * fuelFormula;
  const totalExpenses = Number(fuelExp || 0) + Number(foodExp || 0) + Number(sparePartsExp || 0) + Number(driverWageEntry || 0) + Number(commissionEntry || 0);
  const netResult = Number(tripFare || 0) - totalExpenses;

  const actualFuel = Number(fuelExp || 0);
  const fuelExceedsExpected = expectedFuel > 0 && actualFuel > expectedFuel;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>من أين</Label>
          <Input value={departure} onChange={e => setDeparture(e.target.value)} placeholder="مدينة الانطلاق" data-testid="input-departure" />
        </div>
        <div className="space-y-2">
          <Label>إلى أين</Label>
          <Input value={arrival} onChange={e => setArrival(e.target.value)} placeholder="مدينة الوصول" data-testid="input-arrival" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>العداد القديم (كم)</Label>
          <Input type="number" value={initialTrip ? oldOdo : (oldOdo || (lastTrip ? String(lastTrip.newOdometer) : ""))} onChange={e => setOldOdo(e.target.value)} placeholder={!initialTrip && lastTrip ? String(lastTrip.newOdometer) : "0"} step="0.01" dir="ltr" data-testid="input-old-odometer" />
        </div>
        <div className="space-y-2">
          <Label>العداد الجديد (كم)</Label>
          <Input type="number" value={newOdo} onChange={e => setNewOdo(e.target.value)} placeholder="0" step="0.01" dir="ltr" data-testid="input-new-odometer" />
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
          <Input type="number" value={fuelExp} onChange={e => setFuelExp(e.target.value)} placeholder="0" step="0.01" dir="ltr" data-testid="input-fuel-expense" />
        </div>
        <div className="space-y-2">
          <Label>مصاريف الأكل</Label>
          <Input type="number" value={foodExp} onChange={e => setFoodExp(e.target.value)} placeholder="0" step="0.01" dir="ltr" data-testid="input-food-expense" />
        </div>
        <div className="space-y-2">
          <Label>قطع الغيار</Label>
          <Input type="number" value={sparePartsExp} onChange={e => setSparePartsExp(e.target.value)} placeholder="0" step="0.01" dir="ltr" data-testid="input-spare-parts" />
        </div>
      </div>
      {fuelExceedsExpected && <FuelWarning actualFuel={actualFuel} expectedFuel={expectedFuel} />}
      <div className="space-y-2">
        <Label>أجرة الرحلة (د.ج)</Label>
        <Input type="number" value={tripFare} onChange={e => setTripFare(e.target.value)} placeholder="0" step="0.01" dir="ltr" data-testid="input-trip-fare" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>أجرة السائق (د.ج)</Label>
          <Input type="number" value={driverWageEntry} onChange={e => setDriverWageEntry(e.target.value)} placeholder="0" step="0.01" dir="ltr" data-testid="input-driver-wage-entry" />
        </div>
        <div className="space-y-2">
          <Label>عمولة السائق (د.ج)</Label>
          <Input type="number" value={commissionEntry} onChange={e => setCommissionEntry(e.target.value)} placeholder="0" step="0.01" dir="ltr" data-testid="input-commission-entry" />
        </div>
      </div>
      {canViewTotals && (
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
      )}
      <div className="space-y-2">
        <Label>التاريخ</Label>
        <Input type="date" value={tripDate} onChange={e => setTripDate(e.target.value)} data-testid="input-trip-date" />
      </div>
      <Button
        className="w-full"
        onClick={() => {
          if (!departure || !arrival) {
            toast({ title: "يرجى إدخال الوجهة", variant: "destructive" });
            return;
          }
          onSubmit({
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
            date: tripDate,
          });
        }}
        disabled={!departure || !arrival || isPending}
        data-testid="button-submit-trip"
      >
        {submitLabel}
      </Button>
    </div>
  );
}

function TripForm({ truck, onClose }: { truck: Truck; onClose: () => void }) {
  const { toast } = useToast();

  const addTripMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", `/api/trucks/${truck.id}/trips`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trucks"] });
      queryClient.invalidateQueries({ queryKey: [`/api/trucks/${truck.id}/trips`] });
      queryClient.invalidateQueries({ queryKey: [`/api/trucks/${truck.id}/last-trip`] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      onClose();
      toast({ title: "تم تسجيل الرحلة بنجاح" });
    },
    onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
  });

  return (
    <TripFormFields
      truck={truck}
      onSubmit={(data) => addTripMutation.mutate(data)}
      isPending={addTripMutation.isPending}
      submitLabel="تسجيل الرحلة"
    />
  );
}

function EditTripDialog({ truck, trip }: { truck: Truck; trip: TruckTrip }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const editTripMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PATCH", `/api/trucks/${truck.id}/trips/${trip.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trucks"] });
      queryClient.invalidateQueries({ queryKey: [`/api/trucks/${truck.id}/trips`] });
      queryClient.invalidateQueries({ queryKey: [`/api/trucks/${truck.id}/last-trip`] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      setOpen(false);
      toast({ title: "تم تعديل الرحلة بنجاح" });
    },
    onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" data-testid={`button-edit-trip-${trip.id}`}>
          <Pencil className="w-3 h-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>تعديل الرحلة</DialogTitle>
          <DialogDescription>{trip.departureLocation} ← {trip.arrivalLocation}</DialogDescription>
        </DialogHeader>
        <TripFormFields
          truck={truck}
          initialTrip={trip}
          onSubmit={(data) => editTripMutation.mutate(data)}
          isPending={editTripMutation.isPending}
          submitLabel="حفظ التعديلات"
        />
      </DialogContent>
    </Dialog>
  );
}

function MonthlyStatement({ truck, trips, expenses }: { truck: Truck; trips: TruckTrip[]; expenses: TruckExpense[] }) {
  const { hasPermission, user } = useAuth();
  const canViewTotals = user?.role !== "app_user" || hasPermission("view_totals");
  const driverWage = Number(truck.driverWage || 0);
  const commissionRate = Number(truck.driverCommissionRate || 0);

  const months = useMemo(() => {
    const map = new Map<string, TruckTrip[]>();
    for (const trip of trips) {
      const d = new Date(trip.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(trip);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [trips]);

  const commissionExpensesByMonth = useMemo(() => {
    const map = new Map<string, number>();
    for (const exp of expenses) {
      if (exp.category === "عمولة السائق" && exp.type === "expense") {
        const d = new Date(exp.createdAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        map.set(key, (map.get(key) || 0) + Number(exp.amount));
      }
    }
    return map;
  }, [expenses]);

  if (months.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-4">لا توجد رحلات مسجلة</p>;
  }

  return (
    <div className="space-y-4">
      {months.map(([month, monthTrips]) => {
        const totalFare = monthTrips.reduce((s, t) => s + Number(t.tripFare), 0);
        const totalFuel = monthTrips.reduce((s, t) => s + Number(t.fuelExpense), 0);
        const totalFood = monthTrips.reduce((s, t) => s + Number(t.foodExpense), 0);
        const totalSpare = monthTrips.reduce((s, t) => s + Number(t.sparePartsExpense), 0);
        const totalTripExpenses = totalFuel + totalFood + totalSpare;
        const grossProfit = totalFare - totalTripExpenses;

        const netAfterWage = grossProfit - driverWage;
        const calculatedCommission = commissionRate > 0 && netAfterWage > 0 ? netAfterWage * (commissionRate / 100) : 0;
        const paidCommission = commissionExpensesByMonth.get(month) || 0;
        const remainingCommission = calculatedCommission - paidCommission;
        const finalResult = netAfterWage - calculatedCommission;

        const [year, m] = month.split("-");
        const monthName = new Date(Number(year), Number(m) - 1).toLocaleDateString("ar-DZ", { year: "numeric", month: "long" });

        return (
          <Card key={month}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4" /> كشف شهر {monthName}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {canViewTotals && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div className="p-2 rounded-md bg-muted/50 text-center">
                    <p className="text-xs text-muted-foreground">عدد الرحلات</p>
                    <p className="font-bold">{monthTrips.length}</p>
                  </div>
                  <div className="p-2 rounded-md bg-green-500/10 text-center">
                    <p className="text-xs text-muted-foreground">إجمالي الأجرة</p>
                    <p className="font-bold text-green-600">{formatAmount(totalFare)} د.ج</p>
                  </div>
                  <div className="p-2 rounded-md bg-destructive/10 text-center">
                    <p className="text-xs text-muted-foreground">مصاريف الرحلات</p>
                    <p className="font-bold text-destructive">{formatAmount(totalTripExpenses)} د.ج</p>
                  </div>
                  <div className="p-2 rounded-md bg-muted/50 text-center">
                    <p className="text-xs text-muted-foreground">صافي الربح</p>
                    <p className={`font-bold ${grossProfit >= 0 ? "text-green-600" : "text-red-600"}`}>{formatAmount(grossProfit)} د.ج</p>
                  </div>
                </div>
              )}
              <div className="border rounded-md overflow-hidden text-sm">
                <table className="w-full">
                  <tbody>
                    <tr className="border-b">
                      <td className="p-2 text-muted-foreground">بنزين</td>
                      <td className="p-2 font-medium text-red-600" dir="ltr">{formatAmount(totalFuel)} د.ج</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 text-muted-foreground">أكل</td>
                      <td className="p-2 font-medium text-red-600" dir="ltr">{formatAmount(totalFood)} د.ج</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 text-muted-foreground">قطع غيار</td>
                      <td className="p-2 font-medium text-red-600" dir="ltr">{formatAmount(totalSpare)} د.ج</td>
                    </tr>
                    <tr className="border-b bg-muted/30">
                      <td className="p-2 font-medium">صافي الربح (الأجرة - المصاريف)</td>
                      <td className={`p-2 font-bold ${grossProfit >= 0 ? "text-green-600" : "text-red-600"}`} dir="ltr">{formatAmount(grossProfit)} د.ج</td>
                    </tr>
                    {driverWage > 0 && (
                      <>
                        <tr className="border-b">
                          <td className="p-2 text-muted-foreground">أجرة السائق الشهرية</td>
                          <td className="p-2 font-medium text-red-600" dir="ltr">{formatAmount(driverWage)} د.ج</td>
                        </tr>
                        <tr className="border-b bg-muted/30">
                          <td className="p-2 font-medium">الناتج بعد أجرة السائق</td>
                          <td className={`p-2 font-bold ${netAfterWage >= 0 ? "text-green-600" : "text-red-600"}`} dir="ltr">{formatAmount(netAfterWage)} د.ج</td>
                        </tr>
                      </>
                    )}
                    {commissionRate > 0 && (
                      <>
                        <tr className="border-b">
                          <td className="p-2 text-muted-foreground">عمولة السائق المحسوبة ({commissionRate}%)</td>
                          <td className="p-2 font-medium text-orange-600" dir="ltr">{formatAmount(calculatedCommission)} د.ج</td>
                        </tr>
                        {paidCommission > 0 && (
                          <tr className="border-b">
                            <td className="p-2 text-muted-foreground">عمولة مدفوعة (من المصاريف)</td>
                            <td className="p-2 font-medium text-green-600" dir="ltr">-{formatAmount(paidCommission)} د.ج</td>
                          </tr>
                        )}
                        <tr className="border-b">
                          <td className="p-2 font-medium">عمولة متبقية</td>
                          <td className={`p-2 font-bold ${remainingCommission === 0 ? "text-green-600" : "text-orange-600"}`} dir="ltr">
                            {remainingCommission === 0 ? "0 (مدفوعة بالكامل)" : `${formatAmount(remainingCommission)} د.ج`}
                          </td>
                        </tr>
                      </>
                    )}
                    <tr className="bg-muted/50">
                      <td className="p-2 font-bold">النتيجة النهائية (الصندوق)</td>
                      <td className={`p-2 font-bold ${finalResult >= 0 ? "text-green-600" : "text-red-600"}`} dir="ltr">{formatAmount(finalResult)} د.ج</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function TruckCard({ truck }: { truck: Truck }) {
  const { toast } = useToast();
  const { hasPermission, user } = useAuth();
  const canViewTotals = user?.role !== "app_user" || hasPermission("view_totals");
  const isAppUser = user?.role === "app_user";
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState("expenses");
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [tripDialogOpen, setTripDialogOpen] = useState(false);
  const [expenseCategory, setExpenseCategory] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseType, setExpenseType] = useState("expense");
  const [expenseDescription, setExpenseDescription] = useState("");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0]);

  const { data: expenses, isLoading: expensesLoading } = useQuery<TruckExpense[]>({
    queryKey: [`/api/trucks/${truck.id}/expenses`],
    enabled: expanded,
  });

  const { data: trips, isLoading: tripsLoading } = useQuery<TruckTrip[]>({
    queryKey: [`/api/trucks/${truck.id}/trips`],
    enabled: expanded,
  });

  const addExpenseMutation = useMutation({
    mutationFn: async (data: { category: string; amount: string; type: string; description?: string }) => {
      const res = await apiRequest("POST", `/api/trucks/${truck.id}/expenses`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trucks"] });
      queryClient.invalidateQueries({ queryKey: [`/api/trucks/${truck.id}/expenses`] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      setExpenseDialogOpen(false);
      setExpenseCategory("");
      setExpenseAmount("");
      setExpenseType("expense");
      setExpenseDescription("");
      setExpenseDate(new Date().toISOString().split("T")[0]);
      toast({ title: "تم تسجيل العملية بنجاح" });
    },
    onError: (err: Error) => {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (expenseId: string) => {
      await apiRequest("DELETE", `/api/trucks/${truck.id}/expenses/${expenseId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trucks"] });
      queryClient.invalidateQueries({ queryKey: [`/api/trucks/${truck.id}/expenses`] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      toast({ title: "تم حذف العملية" });
    },
    onError: (err: Error) => {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    },
  });

  const deleteTripMutation = useMutation({
    mutationFn: async (tripId: string) => {
      await apiRequest("DELETE", `/api/trucks/${truck.id}/trips/${tripId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trucks"] });
      queryClient.invalidateQueries({ queryKey: [`/api/trucks/${truck.id}/trips`] });
      queryClient.invalidateQueries({ queryKey: [`/api/trucks/${truck.id}/last-trip`] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      toast({ title: "تم حذف الرحلة" });
    },
    onError: (err: Error) => {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    },
  });

  const deleteTruckMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/trucks/${truck.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trucks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      toast({ title: "تم حذف الشاحنة" });
    },
    onError: (err: Error) => {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    },
  });

  const balance = Number(truck.balance);
  const totalIncome = (expenses || []).filter(e => e.type === "income").reduce((sum, e) => sum + Number(e.amount), 0);
  const totalExpense = (expenses || []).filter(e => e.type === "expense").reduce((sum, e) => sum + Number(e.amount), 0);
  const sortedTrips = [...(trips || [])].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const fuelFormula = Number(truck.fuelFormula || 0);

  return (
    <Card data-testid={`truck-card-${truck.id}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => setExpanded(!expanded)}>
            <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10 text-primary">
              <TruckIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm" data-testid={`truck-number-${truck.id}`}>شاحنة رقم {truck.number}</span>
                <Badge variant="secondary" className="text-xs">{truck.driverName}</Badge>
              </div>
              {canViewTotals && (
                <p className={`text-sm font-bold mt-0.5 ${balance >= 0 ? "text-green-600" : "text-destructive"}`} data-testid={`truck-balance-${truck.id}`}>
                  الرصيد: {formatAmount(balance)} د.ج
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isAppUser && <TruckSettingsDialog truck={truck} />}

            {!isAppUser && (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                if (confirm("هل أنت متأكد من حذف هذه الشاحنة وجميع عملياتها ورحلاتها؟")) {
                  deleteTruckMutation.mutate();
                }
              }}
              disabled={deleteTruckMutation.isPending}
              data-testid={`button-delete-truck-${truck.id}`}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            )}

            <Button size="icon" variant="ghost" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {expanded && (
          <div className="mt-4 border-t pt-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full grid grid-cols-3 mb-4">
                <TabsTrigger value="expenses" data-testid={`tab-expenses-${truck.id}`}>
                  <Wallet className="w-3 h-3 ml-1" /> المصاريف
                </TabsTrigger>
                <TabsTrigger value="trips" data-testid={`tab-trips-${truck.id}`}>
                  <Route className="w-3 h-3 ml-1" /> الرحلات
                </TabsTrigger>
                <TabsTrigger value="statement" data-testid={`tab-statement-${truck.id}`}>
                  <FileText className="w-3 h-3 ml-1" /> كشف شهري
                </TabsTrigger>
              </TabsList>

              <TabsContent value="expenses" className="space-y-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  {expenses && expenses.length > 0 && (
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-green-600 flex items-center gap-1">
                        <ArrowDown className="w-3 h-3" /> دخل: {formatAmount(totalIncome)} د.ج
                      </span>
                      <span className="text-red-600 flex items-center gap-1">
                        <ArrowUp className="w-3 h-3" /> مصاريف: {formatAmount(totalExpense)} د.ج
                      </span>
                    </div>
                  )}
                  {!isAppUser && (
                  <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" data-testid={`button-add-truck-expense-${truck.id}`}>
                        <Plus className="w-3 h-3 ml-1" /> عملية جديدة
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>تسجيل عملية - شاحنة {truck.number}</DialogTitle>
                        <DialogDescription>إضافة مصروف أو إيراد للشاحنة</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 pt-2">
                        <div className="space-y-2">
                          <Label>نوع العملية</Label>
                          <Select value={expenseType} onValueChange={setExpenseType}>
                            <SelectTrigger data-testid="select-expense-type">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="expense">مصروف (خروج)</SelectItem>
                              <SelectItem value="income">دخل (إيراد)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>التصنيف</Label>
                          <Select value={expenseCategory} onValueChange={setExpenseCategory}>
                            <SelectTrigger data-testid="select-expense-category">
                              <SelectValue placeholder="اختر التصنيف" />
                            </SelectTrigger>
                            <SelectContent>
                              {EXPENSE_CATEGORIES.map(cat => (
                                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>المبلغ (د.ج)</Label>
                          <Input type="number" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} placeholder="0.00" step="0.01" dir="ltr" data-testid="input-expense-amount" />
                        </div>
                        <div className="space-y-2">
                          <Label>وصف (اختياري)</Label>
                          <Input value={expenseDescription} onChange={(e) => setExpenseDescription(e.target.value)} placeholder="وصف العملية" data-testid="input-expense-description" />
                        </div>
                        <div className="space-y-2">
                          <Label>التاريخ</Label>
                          <Input type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} data-testid="input-truck-expense-date" />
                        </div>
                        <Button
                          className="w-full"
                          onClick={() => addExpenseMutation.mutate({
                            category: expenseCategory,
                            amount: expenseAmount,
                            type: expenseType,
                            description: expenseDescription || undefined,
                            date: expenseDate,
                          })}
                          disabled={!expenseCategory || !expenseAmount || addExpenseMutation.isPending}
                          data-testid="button-submit-expense"
                        >
                          تسجيل العملية
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  )}
                </div>

                {expensesLoading ? (
                  <div className="space-y-2">
                    {[1, 2].map(i => <Skeleton key={i} className="h-10 w-full" />)}
                  </div>
                ) : !expenses || expenses.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">لا توجد عمليات مسجلة</p>
                ) : (
                  <div className="space-y-2">
                    {[...expenses].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(expense => {
                      const catIcon = EXPENSE_CATEGORIES.find(c => c.value === expense.category);
                      const CatIcon = catIcon?.icon || Wallet;
                      return (
                        <div key={expense.id} className="flex items-center justify-between gap-3 p-3 rounded-md bg-muted/50" data-testid={`truck-expense-${expense.id}`}>
                          <div className="flex items-center gap-3 flex-1">
                            <div className={`flex items-center justify-center w-8 h-8 rounded-md ${expense.type === "income" ? "bg-green-500/10 text-green-600" : "bg-destructive/10 text-destructive"}`}>
                              {expense.type === "income" ? <ArrowDown className="w-4 h-4" /> : <CatIcon className="w-4 h-4" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-medium">{expense.category}</span>
                                <Badge variant={expense.type === "income" ? "secondary" : "outline"} className="text-xs">
                                  {expense.type === "income" ? "إيراد" : "مصروف"}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                {expense.description && <span className="text-xs text-muted-foreground">{expense.description}</span>}
                                <span className="text-xs text-muted-foreground">{expense.date || formatDateSimple(expense.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`font-bold text-sm ${expense.type === "income" ? "text-green-600" : "text-destructive"}`}>
                              {expense.type === "income" ? "+" : "-"}{formatAmount(expense.amount)} د.ج
                            </span>
                            {!isAppUser && (
                            <Button size="icon" variant="ghost" onClick={() => deleteExpenseMutation.mutate(expense.id)} disabled={deleteExpenseMutation.isPending} data-testid={`button-delete-expense-${expense.id}`}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="trips" className="space-y-3">
                <div className="flex items-center justify-end gap-2">
                  <Dialog open={tripDialogOpen} onOpenChange={setTripDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" data-testid={`button-add-trip-${truck.id}`}>
                        <Plus className="w-3 h-3 ml-1" /> رحلة جديدة
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>تسجيل رحلة - شاحنة {truck.number}</DialogTitle>
                        <DialogDescription>إضافة رحلة جديدة للشاحنة</DialogDescription>
                      </DialogHeader>
                      <TripForm truck={truck} onClose={() => setTripDialogOpen(false)} />
                    </DialogContent>
                  </Dialog>
                </div>

                {tripsLoading ? (
                  <div className="space-y-2">
                    {[1, 2].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                  </div>
                ) : sortedTrips.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">لا توجد رحلات مسجلة</p>
                ) : (
                  <div className="space-y-2">
                    {sortedTrips.map(trip => {
                      const tripExpectedFuel = Number(trip.expectedFuel || 0);
                      const tripActualFuel = Number(trip.fuelExpense || 0);
                      const fuelExceedsExpected = tripExpectedFuel > 0 && tripActualFuel > tripExpectedFuel;
                      return (
                        <div key={trip.id} className="p-3 rounded-md bg-muted/50 space-y-2" data-testid={`trip-row-${trip.id}`}>
                          <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-primary" />
                              <span className="text-sm font-medium">{trip.departureLocation} ← {trip.arrivalLocation}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={Number(trip.netResult) >= 0 ? "default" : "destructive"} className="text-xs">
                                الناتج: {formatAmount(trip.netResult)} د.ج
                              </Badge>
                              {!isAppUser && <EditTripDialog truck={truck} trip={trip} />}
                              {!isAppUser && (
                              <Button size="icon" variant="ghost" onClick={() => deleteTripMutation.mutate(trip.id)} disabled={deleteTripMutation.isPending} data-testid={`button-delete-trip-${trip.id}`}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                              )}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-muted-foreground">
                            <span>أجرة: {formatAmount(trip.tripFare)} د.ج</span>
                            <span className={fuelExceedsExpected ? "text-orange-600 font-medium" : ""}>
                              {fuelExceedsExpected && <AlertTriangle className="w-3 h-3 inline ml-1" />}
                              بنزين: {formatAmount(trip.fuelExpense)} د.ج
                            </span>
                            <span>أكل: {formatAmount(trip.foodExpense)} د.ج</span>
                            <span>قطع غيار: {formatAmount(trip.sparePartsExpense)} د.ج</span>
                          </div>
                          {(Number(trip.driverWageEntry || 0) > 0 || Number(trip.commissionEntry || 0) > 0) && (
                            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                              {Number(trip.driverWageEntry || 0) > 0 && <span>أجرة السائق: {formatAmount(trip.driverWageEntry)} د.ج</span>}
                              {Number(trip.commissionEntry || 0) > 0 && <span>عمولة: {formatAmount(trip.commissionEntry)} د.ج</span>}
                            </div>
                          )}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                            <span>العداد: {formatAmount(trip.oldOdometer)} ← {formatAmount(trip.newOdometer)} كم</span>
                            {Number(trip.expectedFuel) > 0 && <span>بنزين متوقع: {formatAmount(trip.expectedFuel)} د.ج</span>}
                            <span>{trip.date || formatDateSimple(trip.createdAt)}</span>
                          </div>
                          {fuelExceedsExpected && (
                            <FuelWarning actualFuel={tripActualFuel} expectedFuel={tripExpectedFuel} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="statement">
                {tripsLoading ? (
                  <Skeleton className="h-32 w-full" />
                ) : (
                  <MonthlyStatement truck={truck} trips={trips || []} expenses={expenses || []} />
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Trucks() {
  const { toast } = useToast();
  const { user } = useAuth();
  const isAppUser = user?.role === "app_user";
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [truckNumber, setTruckNumber] = useState("");
  const [driverName, setDriverName] = useState("");
  const [fuelFormula, setFuelFormula] = useState("");
  const [driverWage, setDriverWage] = useState("");
  const [commissionRate, setCommissionRate] = useState("");

  const { data: trucks, isLoading } = useQuery<Truck[]>({
    queryKey: ["/api/trucks"],
  });

  const createTruckMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/trucks", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trucks"] });
      setAddDialogOpen(false);
      setTruckNumber("");
      setDriverName("");
      setFuelFormula("");
      setDriverWage("");
      setCommissionRate("");
      toast({ title: "تم إضافة الشاحنة بنجاح" });
    },
    onError: (err: Error) => {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-trucks-title">الشاحنات</h1>
          <p className="text-muted-foreground text-sm mt-1">إدارة الشاحنات والرحلات والمصاريف</p>
        </div>

        {!isAppUser && (
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-truck">
              <Plus className="w-4 h-4 ml-2" /> إضافة شاحنة
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة شاحنة جديدة</DialogTitle>
              <DialogDescription>إدخال بيانات الشاحنة الجديدة</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>رقم الشاحنة</Label>
                <Input value={truckNumber} onChange={(e) => setTruckNumber(e.target.value)} placeholder="مثال: 12345" data-testid="input-truck-number" />
              </div>
              <div className="space-y-2">
                <Label>اسم السائق</Label>
                <Input value={driverName} onChange={(e) => setDriverName(e.target.value)} placeholder="اسم السائق" data-testid="input-driver-name" />
              </div>
              <div className="space-y-2">
                <Label>معادلة البنزين المتوقع (د.ج لكل كم)</Label>
                <Input type="number" value={fuelFormula} onChange={e => setFuelFormula(e.target.value)} placeholder="0" step="0.01" dir="ltr" data-testid="input-new-fuel-formula" />
              </div>
              <div className="space-y-2">
                <Label>أجرة السائق الافتراضية (د.ج)</Label>
                <Input type="number" value={driverWage} onChange={e => setDriverWage(e.target.value)} placeholder="0" step="0.01" dir="ltr" data-testid="input-new-driver-wage" />
              </div>
              <div className="space-y-2">
                <Label>نسبة عمولة السائق الافتراضية (%)</Label>
                <Input type="number" value={commissionRate} onChange={e => setCommissionRate(e.target.value)} placeholder="0" step="0.01" dir="ltr" data-testid="input-new-commission-rate" />
              </div>
              <Button
                className="w-full"
                onClick={() => createTruckMutation.mutate({
                  number: truckNumber,
                  driverName,
                  fuelFormula: fuelFormula || "0",
                  driverWage: driverWage || "0",
                  driverCommissionRate: commissionRate || "0",
                })}
                disabled={!truckNumber || !driverName || createTruckMutation.isPending}
                data-testid="button-submit-truck"
              >
                إضافة
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : !trucks || trucks.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <TruckIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">لا توجد شاحنات مسجلة</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {trucks.map(truck => (
            <TruckCard key={truck.id} truck={truck} />
          ))}
        </div>
      )}
    </div>
  );
}
