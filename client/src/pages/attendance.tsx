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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatAmount } from "@/lib/format";
import {
  Fingerprint, Plus, Trash2, Pencil, Clock, CalendarDays,
  AlertTriangle, Gift, FileText, Printer, Timer, Shield,
} from "lucide-react";
import type { Worker, WorkShift, AttendanceDay, Holiday, WorkerWarning } from "@shared/schema";

function getMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
  };
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function StatusBadge({ status }: { status: string }) {
  if (status === "present") return <Badge className="no-default-active-elevate bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30">حاضر</Badge>;
  if (status === "late") return <Badge className="no-default-active-elevate bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30">متأخر</Badge>;
  if (status === "absent") return <Badge variant="destructive" className="no-default-active-elevate">غائب</Badge>;
  return <Badge variant="secondary" className="no-default-active-elevate">{status}</Badge>;
}

function ScanTab({ workers }: { workers: Worker[] }) {
  const { toast } = useToast();
  const [selectedWorkerId, setSelectedWorkerId] = useState("");
  const [scanResult, setScanResult] = useState<{ message: string; attendanceDay?: any; scan?: any } | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingDay, setEditingDay] = useState<AttendanceDay | null>(null);
  const [editCheckIn, setEditCheckIn] = useState("");
  const [editCheckOut, setEditCheckOut] = useState("");

  const today = todayStr();

  const { data: todayAttendance, isLoading } = useQuery<AttendanceDay[]>({
    queryKey: ["/api/attendance-days", { startDate: today, endDate: today }],
    queryFn: async () => {
      const res = await fetch(`/api/attendance-days?startDate=${today}&endDate=${today}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const scanMutation = useMutation({
    mutationFn: async (workerId: string) => {
      const res = await apiRequest("POST", "/api/attendance/scan", { workerId });
      return res.json();
    },
    onSuccess: (data) => {
      setScanResult(data);
      queryClient.invalidateQueries({ queryKey: ["/api/attendance-days"] });
      toast({ title: data.message || "تم تسجيل البصمة" });
    },
    onError: (err: Error) => {
      toast({ title: err.message || "حدث خطأ", variant: "destructive" });
    },
  });

  const editDayMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PATCH", `/api/attendance-days/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance-days"] });
      setEditDialogOpen(false);
      toast({ title: "تم التعديل بنجاح" });
    },
    onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
  });

  const deleteDayMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/attendance-days/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance-days"] });
      toast({ title: "تم الحذف" });
    },
    onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
  });

  const openEdit = (day: AttendanceDay) => {
    setEditingDay(day);
    setEditCheckIn(day.checkIn || "");
    setEditCheckOut(day.checkOut || "");
    setEditDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fingerprint className="w-5 h-5" /> تسجيل البصمة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>اختر العامل</Label>
            <Select value={selectedWorkerId} onValueChange={setSelectedWorkerId}>
              <SelectTrigger data-testid="select-scan-worker">
                <SelectValue placeholder="اختر عامل..." />
              </SelectTrigger>
              <SelectContent>
                {workers.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name} {w.workerNumber ? `#${w.workerNumber}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            className="w-full"
            size="lg"
            onClick={() => {
              if (!selectedWorkerId) {
                toast({ title: "يرجى اختيار عامل", variant: "destructive" });
                return;
              }
              scanMutation.mutate(selectedWorkerId);
            }}
            disabled={!selectedWorkerId || scanMutation.isPending}
            data-testid="button-scan"
          >
            <Fingerprint className="w-5 h-5 ml-2" />
            تسجيل بصمة
          </Button>
          {scanResult && (
            <div className="p-3 rounded-md bg-muted/50 space-y-2" data-testid="scan-result">
              <p className="font-medium">{scanResult.message}</p>
              {scanResult.scan && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={scanResult.scan.type === "in" ? "default" : "secondary"} className="no-default-active-elevate">
                    {scanResult.scan.type === "in" ? "دخول" : "خروج"}
                  </Badge>
                  {scanResult.attendanceDay?.status && (
                    <StatusBadge status={scanResult.attendanceDay.status} />
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5" /> حضور اليوم - {today}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : !todayAttendance || todayAttendance.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">لا توجد سجلات حضور اليوم</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الاسم</TableHead>
                    <TableHead>الرقم</TableHead>
                    <TableHead>الدخول</TableHead>
                    <TableHead>الخروج</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>تأخر (د)</TableHead>
                    <TableHead>إضافي (د)</TableHead>
                    <TableHead>إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todayAttendance.map((day) => {
                    const worker = workers.find((w) => w.id === day.workerId);
                    return (
                      <TableRow key={day.id} data-testid={`row-attendance-${day.id}`}>
                        <TableCell>{worker?.name || "-"}</TableCell>
                        <TableCell>{worker?.workerNumber || "-"}</TableCell>
                        <TableCell>{day.checkIn || "-"}</TableCell>
                        <TableCell>{day.checkOut || "-"}</TableCell>
                        <TableCell><StatusBadge status={day.status} /></TableCell>
                        <TableCell>{day.lateMinutes}</TableCell>
                        <TableCell>{day.overtimeMinutes}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button size="icon" variant="ghost" onClick={() => openEdit(day)} data-testid={`button-edit-day-${day.id}`}>
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                if (confirm("حذف هذا السجل؟")) deleteDayMutation.mutate(day.id);
                              }}
                              data-testid={`button-delete-day-${day.id}`}
                            >
                              <Trash2 className="w-3 h-3 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل سجل الحضور</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>وقت الدخول</Label>
              <Input type="time" value={editCheckIn} onChange={(e) => setEditCheckIn(e.target.value)} data-testid="input-edit-checkin" />
            </div>
            <div className="space-y-2">
              <Label>وقت الخروج</Label>
              <Input type="time" value={editCheckOut} onChange={(e) => setEditCheckOut(e.target.value)} data-testid="input-edit-checkout" />
            </div>
            <Button
              className="w-full"
              onClick={() => {
                if (editingDay) {
                  editDayMutation.mutate({
                    id: editingDay.id,
                    data: { checkIn: editCheckIn || null, checkOut: editCheckOut || null },
                  });
                }
              }}
              disabled={editDayMutation.isPending}
              data-testid="button-save-edit-day"
            >
              حفظ التعديل
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AttendanceRecordsTab({ workers }: { workers: Worker[] }) {
  const { toast } = useToast();
  const { startDate: defaultStart, endDate: defaultEnd } = getMonthRange();
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [filterWorkerId, setFilterWorkerId] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingDay, setEditingDay] = useState<AttendanceDay | null>(null);
  const [editCheckIn, setEditCheckIn] = useState("");
  const [editCheckOut, setEditCheckOut] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editLateMinutes, setEditLateMinutes] = useState("");
  const [editOvertimeMinutes, setEditOvertimeMinutes] = useState("");

  const queryParams = `startDate=${startDate}&endDate=${endDate}${filterWorkerId ? `&workerId=${filterWorkerId}` : ""}`;

  const { data: attendanceDays, isLoading } = useQuery<AttendanceDay[]>({
    queryKey: ["/api/attendance-days", { startDate, endDate, workerId: filterWorkerId }],
    queryFn: async () => {
      const res = await fetch(`/api/attendance-days?${queryParams}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const editDayMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PATCH", `/api/attendance-days/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance-days"] });
      setEditDialogOpen(false);
      toast({ title: "تم التعديل بنجاح" });
    },
    onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
  });

  const openEdit = (day: AttendanceDay) => {
    setEditingDay(day);
    setEditCheckIn(day.checkIn || "");
    setEditCheckOut(day.checkOut || "");
    setEditStatus(day.status);
    setEditLateMinutes(String(day.lateMinutes));
    setEditOvertimeMinutes(String(day.overtimeMinutes));
    setEditDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-end gap-3 flex-wrap">
            <div className="space-y-2">
              <Label>من تاريخ</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} data-testid="input-records-start" />
            </div>
            <div className="space-y-2">
              <Label>إلى تاريخ</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} data-testid="input-records-end" />
            </div>
            <div className="space-y-2">
              <Label>عامل (اختياري)</Label>
              <Select value={filterWorkerId || "all"} onValueChange={(v) => setFilterWorkerId(v === "all" ? "" : v)}>
                <SelectTrigger data-testid="select-records-worker">
                  <SelectValue placeholder="الكل" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  {workers.map((w) => (
                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : !attendanceDays || attendanceDays.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">لا توجد سجلات</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>الاسم</TableHead>
                    <TableHead>الرقم</TableHead>
                    <TableHead>الدخول</TableHead>
                    <TableHead>الخروج</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>تأخر (د)</TableHead>
                    <TableHead>إضافي (د)</TableHead>
                    <TableHead>إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceDays.map((day) => {
                    const worker = workers.find((w) => w.id === day.workerId);
                    return (
                      <TableRow key={day.id} data-testid={`row-record-${day.id}`}>
                        <TableCell>{day.date}</TableCell>
                        <TableCell>{worker?.name || "-"}</TableCell>
                        <TableCell>{worker?.workerNumber || "-"}</TableCell>
                        <TableCell>{day.checkIn || "-"}</TableCell>
                        <TableCell>{day.checkOut || "-"}</TableCell>
                        <TableCell><StatusBadge status={day.status} /></TableCell>
                        <TableCell>{day.lateMinutes}</TableCell>
                        <TableCell>{day.overtimeMinutes}</TableCell>
                        <TableCell>
                          <Button size="icon" variant="ghost" onClick={() => openEdit(day)} data-testid={`button-edit-record-${day.id}`}>
                            <Pencil className="w-3 h-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل سجل الحضور</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>وقت الدخول</Label>
              <Input type="time" value={editCheckIn} onChange={(e) => setEditCheckIn(e.target.value)} data-testid="input-edit-record-checkin" />
            </div>
            <div className="space-y-2">
              <Label>وقت الخروج</Label>
              <Input type="time" value={editCheckOut} onChange={(e) => setEditCheckOut(e.target.value)} data-testid="input-edit-record-checkout" />
            </div>
            <div className="space-y-2">
              <Label>الحالة</Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger data-testid="select-edit-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="present">حاضر</SelectItem>
                  <SelectItem value="late">متأخر</SelectItem>
                  <SelectItem value="absent">غائب</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>دقائق التأخر</Label>
                <Input type="number" value={editLateMinutes} onChange={(e) => setEditLateMinutes(e.target.value)} dir="ltr" data-testid="input-edit-late" />
              </div>
              <div className="space-y-2">
                <Label>دقائق إضافية</Label>
                <Input type="number" value={editOvertimeMinutes} onChange={(e) => setEditOvertimeMinutes(e.target.value)} dir="ltr" data-testid="input-edit-overtime" />
              </div>
            </div>
            <Button
              className="w-full"
              onClick={() => {
                if (editingDay) {
                  editDayMutation.mutate({
                    id: editingDay.id,
                    data: {
                      checkIn: editCheckIn || null,
                      checkOut: editCheckOut || null,
                      status: editStatus,
                      lateMinutes: Number(editLateMinutes) || 0,
                      overtimeMinutes: Number(editOvertimeMinutes) || 0,
                    },
                  });
                }
              }}
              disabled={editDayMutation.isPending}
              data-testid="button-save-edit-record"
            >
              حفظ التعديل
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ShiftsTab() {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("17:00");
  const [lateTolerance, setLateTolerance] = useState("3");
  const [earlyLeave, setEarlyLeave] = useState("10");
  const [overtimeAfter, setOvertimeAfter] = useState("30");

  const { data: shifts, isLoading } = useQuery<WorkShift[]>({
    queryKey: ["/api/work-shifts"],
  });

  const addShiftMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/work-shifts", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-shifts"] });
      setName("");
      toast({ title: "تم إضافة الوردية" });
    },
    onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
  });

  const deleteShiftMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/work-shifts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-shifts"] });
      toast({ title: "تم حذف الوردية" });
    },
    onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" /> إضافة وردية جديدة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>اسم الوردية</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: وردية صباحية" data-testid="input-shift-name" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>وقت البداية</Label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} data-testid="input-shift-start" />
            </div>
            <div className="space-y-2">
              <Label>وقت النهاية</Label>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} data-testid="input-shift-end" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>تسامح التأخر (د)</Label>
              <Input type="number" value={lateTolerance} onChange={(e) => setLateTolerance(e.target.value)} dir="ltr" data-testid="input-shift-late-tolerance" />
            </div>
            <div className="space-y-2">
              <Label>خروج مبكر (د)</Label>
              <Input type="number" value={earlyLeave} onChange={(e) => setEarlyLeave(e.target.value)} dir="ltr" data-testid="input-shift-early-leave" />
            </div>
            <div className="space-y-2">
              <Label>إضافي بعد (د)</Label>
              <Input type="number" value={overtimeAfter} onChange={(e) => setOvertimeAfter(e.target.value)} dir="ltr" data-testid="input-shift-overtime-after" />
            </div>
          </div>
          <Button
            className="w-full"
            onClick={() => {
              if (!name.trim()) {
                toast({ title: "يرجى إدخال اسم الوردية", variant: "destructive" });
                return;
              }
              addShiftMutation.mutate({
                name: name.trim(),
                startTime,
                endTime,
                lateToleranceMinutes: Number(lateTolerance) || 3,
                earlyLeaveMinutes: Number(earlyLeave) || 10,
                overtimeAfterMinutes: Number(overtimeAfter) || 30,
              });
            }}
            disabled={!name.trim() || addShiftMutation.isPending}
            data-testid="button-add-shift"
          >
            إضافة الوردية
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" /> الورديات الحالية
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : !shifts || shifts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">لا توجد ورديات</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الاسم</TableHead>
                    <TableHead>البداية</TableHead>
                    <TableHead>النهاية</TableHead>
                    <TableHead>تسامح التأخر</TableHead>
                    <TableHead>خروج مبكر</TableHead>
                    <TableHead>إضافي بعد</TableHead>
                    <TableHead>إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shifts.map((shift) => (
                    <TableRow key={shift.id} data-testid={`row-shift-${shift.id}`}>
                      <TableCell className="font-medium">{shift.name}</TableCell>
                      <TableCell>{shift.startTime}</TableCell>
                      <TableCell>{shift.endTime}</TableCell>
                      <TableCell>{shift.lateToleranceMinutes} د</TableCell>
                      <TableCell>{shift.earlyLeaveMinutes} د</TableCell>
                      <TableCell>{shift.overtimeAfterMinutes} د</TableCell>
                      <TableCell>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            if (confirm("حذف هذه الوردية؟")) deleteShiftMutation.mutate(shift.id);
                          }}
                          data-testid={`button-delete-shift-${shift.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function HolidaysTab() {
  const { toast } = useToast();
  const [date, setDate] = useState(todayStr());
  const [name, setName] = useState("");

  const { data: holidaysList, isLoading } = useQuery<Holiday[]>({
    queryKey: ["/api/holidays"],
  });

  const addHolidayMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/holidays", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/holidays"] });
      setName("");
      toast({ title: "تم إضافة العطلة" });
    },
    onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
  });

  const deleteHolidayMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/holidays/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/holidays"] });
      toast({ title: "تم حذف العطلة" });
    },
    onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" /> إضافة عطلة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3 flex-wrap">
            <div className="space-y-2">
              <Label>التاريخ</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} data-testid="input-holiday-date" />
            </div>
            <div className="space-y-2 flex-1">
              <Label>اسم العطلة</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: عيد الفطر" data-testid="input-holiday-name" />
            </div>
            <Button
              onClick={() => {
                if (!name.trim() || !date) {
                  toast({ title: "يرجى ملء جميع الحقول", variant: "destructive" });
                  return;
                }
                addHolidayMutation.mutate({ date, name: name.trim() });
              }}
              disabled={!name.trim() || !date || addHolidayMutation.isPending}
              data-testid="button-add-holiday"
            >
              <Plus className="w-4 h-4 ml-1" /> إضافة
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5" /> الأعياد والعطل
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : !holidaysList || holidaysList.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">لا توجد أعياد مسجلة</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>الاسم</TableHead>
                    <TableHead>إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {holidaysList.map((h) => (
                    <TableRow key={h.id} data-testid={`row-holiday-${h.id}`}>
                      <TableCell>{h.date}</TableCell>
                      <TableCell className="font-medium">{h.name}</TableCell>
                      <TableCell>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            if (confirm("حذف هذه العطلة؟")) deleteHolidayMutation.mutate(h.id);
                          }}
                          data-testid={`button-delete-holiday-${h.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function WarningsTab({ workers }: { workers: Worker[] }) {
  const { toast } = useToast();
  const { startDate: defaultStart, endDate: defaultEnd } = getMonthRange();
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [selectedWorkerId, setSelectedWorkerId] = useState("");
  const [warningDate, setWarningDate] = useState(todayStr());
  const [warningReason, setWarningReason] = useState("");

  const queryParams = `startDate=${startDate}&endDate=${endDate}`;
  const { data: warnings, isLoading } = useQuery<WorkerWarning[]>({
    queryKey: ["/api/worker-warnings", { startDate, endDate }],
    queryFn: async () => {
      const res = await fetch(`/api/worker-warnings?${queryParams}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const addWarningMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/worker-warnings", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/worker-warnings"] });
      setSelectedWorkerId("");
      setWarningReason("");
      toast({ title: "تم إضافة الإنذار" });
    },
    onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
  });

  const deleteWarningMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/worker-warnings/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/worker-warnings"] });
      toast({ title: "تم حذف الإنذار" });
    },
    onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" /> إضافة إنذار
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>العامل</Label>
              <Select value={selectedWorkerId} onValueChange={setSelectedWorkerId}>
                <SelectTrigger data-testid="select-warning-worker">
                  <SelectValue placeholder="اختر عامل..." />
                </SelectTrigger>
                <SelectContent>
                  {workers.map((w) => (
                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>التاريخ</Label>
              <Input type="date" value={warningDate} onChange={(e) => setWarningDate(e.target.value)} data-testid="input-warning-date" />
            </div>
            <div className="space-y-2">
              <Label>السبب (اختياري)</Label>
              <Input value={warningReason} onChange={(e) => setWarningReason(e.target.value)} placeholder="سبب الإنذار..." data-testid="input-warning-reason" />
            </div>
          </div>
          <Button
            onClick={() => {
              if (!selectedWorkerId || !warningDate) {
                toast({ title: "يرجى اختيار العامل والتاريخ", variant: "destructive" });
                return;
              }
              addWarningMutation.mutate({
                workerId: selectedWorkerId,
                date: warningDate,
                reason: warningReason || undefined,
              });
            }}
            disabled={!selectedWorkerId || addWarningMutation.isPending}
            data-testid="button-add-warning"
          >
            <Plus className="w-4 h-4 ml-1" /> إضافة إنذار
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-end gap-3 mb-4 flex-wrap">
            <div className="space-y-2">
              <Label>من تاريخ</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} data-testid="input-warnings-start" />
            </div>
            <div className="space-y-2">
              <Label>إلى تاريخ</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} data-testid="input-warnings-end" />
            </div>
          </div>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : !warnings || warnings.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">لا توجد إنذارات</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>العامل</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>السبب</TableHead>
                    <TableHead>إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {warnings.map((w) => {
                    const worker = workers.find((wr) => wr.id === w.workerId);
                    return (
                      <TableRow key={w.id} data-testid={`row-warning-${w.id}`}>
                        <TableCell className="font-medium">{worker?.name || "-"}</TableCell>
                        <TableCell>{w.date}</TableCell>
                        <TableCell>{w.reason || "-"}</TableCell>
                        <TableCell>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              if (confirm("حذف هذا الإنذار؟")) deleteWarningMutation.mutate(w.id);
                            }}
                            data-testid={`button-delete-warning-${w.id}`}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function OvertimeTab({ workers, canViewTotals }: { workers: Worker[]; canViewTotals: boolean }) {
  const { toast } = useToast();
  const { startDate: defaultStart, endDate: defaultEnd } = getMonthRange();
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [editingRate, setEditingRate] = useState<{ workerId: string; rate: string } | null>(null);

  const { data: attendanceDays, isLoading } = useQuery<AttendanceDay[]>({
    queryKey: ["/api/attendance-days", { startDate, endDate, tab: "overtime" }],
    queryFn: async () => {
      const res = await fetch(`/api/attendance-days?startDate=${startDate}&endDate=${endDate}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const updateRateMutation = useMutation({
    mutationFn: async ({ workerId, overtimeRate }: { workerId: string; overtimeRate: string }) => {
      const res = await apiRequest("PATCH", `/api/managed-workers/${workerId}`, { overtimeRate });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/managed-workers"] });
      setEditingRate(null);
      toast({ title: "تم تحديث معدل الساعات الإضافية" });
    },
    onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
  });

  const editOvertimeMutation = useMutation({
    mutationFn: async ({ id, overtimeMinutes }: { id: string; overtimeMinutes: number }) => {
      const res = await apiRequest("PATCH", `/api/attendance-days/${id}`, { overtimeMinutes });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance-days"] });
      toast({ title: "تم التعديل" });
    },
    onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
  });

  const overtimeByWorker = useMemo(() => {
    if (!attendanceDays) return [];
    const map = new Map<string, number>();
    for (const day of attendanceDays) {
      map.set(day.workerId, (map.get(day.workerId) || 0) + (day.overtimeMinutes || 0));
    }
    return Array.from(map.entries()).map(([workerId, totalMinutes]) => {
      const worker = workers.find((w) => w.id === workerId);
      const rate = Number(worker?.overtimeRate || 0);
      const hours = totalMinutes / 60;
      return {
        workerId,
        workerName: worker?.name || "-",
        workerNumber: worker?.workerNumber || "-",
        totalMinutes,
        rate,
        amount: hours * rate,
      };
    }).filter((r) => r.totalMinutes > 0);
  }, [attendanceDays, workers]);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-end gap-3 flex-wrap">
            <div className="space-y-2">
              <Label>من تاريخ</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} data-testid="input-overtime-start" />
            </div>
            <div className="space-y-2">
              <Label>إلى تاريخ</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} data-testid="input-overtime-end" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="w-5 h-5" /> الساعات الإضافية
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : overtimeByWorker.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">لا توجد ساعات إضافية</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الاسم</TableHead>
                    <TableHead>الرقم</TableHead>
                    <TableHead>إجمالي الدقائق</TableHead>
                    {canViewTotals && <TableHead>المعدل (د.ج/ساعة)</TableHead>}
                    {canViewTotals && <TableHead>المبلغ</TableHead>}
                    {canViewTotals && <TableHead>إجراءات</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overtimeByWorker.map((row) => (
                    <TableRow key={row.workerId} data-testid={`row-overtime-${row.workerId}`}>
                      <TableCell className="font-medium">{row.workerName}</TableCell>
                      <TableCell>{row.workerNumber}</TableCell>
                      <TableCell>{row.totalMinutes} د</TableCell>
                      {canViewTotals && (
                        <TableCell>
                          {editingRate?.workerId === row.workerId ? (
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                value={editingRate.rate}
                                onChange={(e) => setEditingRate({ ...editingRate, rate: e.target.value })}
                                className="w-24"
                                dir="ltr"
                                data-testid={`input-overtime-rate-${row.workerId}`}
                              />
                              <Button
                                size="sm"
                                onClick={() => updateRateMutation.mutate({ workerId: row.workerId, overtimeRate: editingRate.rate })}
                                disabled={updateRateMutation.isPending}
                                data-testid={`button-save-rate-${row.workerId}`}
                              >
                                حفظ
                              </Button>
                            </div>
                          ) : (
                            <span
                              className="cursor-pointer underline decoration-dotted"
                              onClick={() => setEditingRate({ workerId: row.workerId, rate: String(row.rate) })}
                              data-testid={`text-overtime-rate-${row.workerId}`}
                            >
                              {formatAmount(row.rate)} د.ج
                            </span>
                          )}
                        </TableCell>
                      )}
                      {canViewTotals && <TableCell className="font-bold">{formatAmount(row.amount)} د.ج</TableCell>}
                      {canViewTotals && (
                        <TableCell>
                          <Button size="icon" variant="ghost" onClick={() => setEditingRate({ workerId: row.workerId, rate: String(row.rate) })} data-testid={`button-edit-rate-${row.workerId}`}>
                            <Pencil className="w-3 h-3" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function BonusesTab() {
  const { startDate: defaultStart, endDate: defaultEnd } = getMonthRange();
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);

  const { data: bonusData, isLoading } = useQuery<any[]>({
    queryKey: ["/api/bonus-calculation", { startDate, endDate }],
    queryFn: async () => {
      const res = await fetch(`/api/bonus-calculation?startDate=${startDate}&endDate=${endDate}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-end gap-3 flex-wrap">
            <div className="space-y-2">
              <Label>من تاريخ</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} data-testid="input-bonus-start" />
            </div>
            <div className="space-y-2">
              <Label>إلى تاريخ</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} data-testid="input-bonus-end" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5" /> حساب المكافآت
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : !bonusData || bonusData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">لا توجد بيانات</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الاسم</TableHead>
                    <TableHead>الرقم</TableHead>
                    <TableHead>المكافأة الأساسية</TableHead>
                    <TableHead>أيام الغياب</TableHead>
                    <TableHead>أيام التأخر</TableHead>
                    <TableHead>الإنذارات</TableHead>
                    <TableHead>الخصومات</TableHead>
                    <TableHead>المكافأة النهائية</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bonusData.map((row: any, idx: number) => {
                    const finalBonus = Number(row.finalBonus || 0);
                    const baseBonus = Number(row.baseBonus || 0);
                    let colorClass = "text-green-600";
                    if (finalBonus <= 0) colorClass = "text-red-600";
                    else if (finalBonus < baseBonus) colorClass = "text-yellow-600";

                    return (
                      <TableRow key={row.workerId || idx} data-testid={`row-bonus-${row.workerId || idx}`}>
                        <TableCell className="font-medium">{row.workerName || "-"}</TableCell>
                        <TableCell>{row.workerNumber || "-"}</TableCell>
                        <TableCell>{formatAmount(row.baseBonus || 0)} د.ج</TableCell>
                        <TableCell>{row.absenceDays || 0}</TableCell>
                        <TableCell>{row.lateDays || 0}</TableCell>
                        <TableCell>{row.warningDays || 0}</TableCell>
                        <TableCell className="text-destructive">{formatAmount(row.deductions || 0)} د.ج</TableCell>
                        <TableCell className={`font-bold ${colorClass}`}>{formatAmount(finalBonus)} د.ج</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SalaryStatementTab() {
  const { startDate: defaultStart, endDate: defaultEnd } = getMonthRange();
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);

  const { data: salaryData, isLoading } = useQuery<any[]>({
    queryKey: ["/api/salary-statement", { startDate, endDate }],
    queryFn: async () => {
      const res = await fetch(`/api/salary-statement?startDate=${startDate}&endDate=${endDate}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const totals = useMemo(() => {
    if (!salaryData) return null;
    return {
      daysPresent: salaryData.reduce((s, r) => s + Number(r.daysPresent || 0), 0),
      deservedAmount: salaryData.reduce((s, r) => s + Number(r.deservedAmount || 0), 0),
      overtimeHours: salaryData.reduce((s, r) => s + Number(r.overtimeHours || 0), 0),
      overtimeAmount: salaryData.reduce((s, r) => s + Number(r.overtimeAmount || 0), 0),
      bonus: salaryData.reduce((s, r) => s + Number(r.bonus || 0), 0),
      advances: salaryData.reduce((s, r) => s + Number(r.advances || 0), 0),
      totalDeserved: salaryData.reduce((s, r) => s + Number(r.totalDeserved || 0), 0),
      totalPaid: salaryData.reduce((s, r) => s + Number(r.totalPaid || 0), 0),
      remaining: salaryData.reduce((s, r) => s + Number(r.remaining || 0), 0),
    };
  }, [salaryData]);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-end gap-3 flex-wrap">
            <div className="space-y-2">
              <Label>من تاريخ</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} data-testid="input-salary-start" />
            </div>
            <div className="space-y-2">
              <Label>إلى تاريخ</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} data-testid="input-salary-end" />
            </div>
            <Button
              variant="outline"
              onClick={() => window.print()}
              data-testid="button-print-salary"
            >
              <Printer className="w-4 h-4 ml-1" /> طباعة
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" /> كشف الرواتب
          </CardTitle>
        </CardHeader>
        <CardContent>
          <style>{`
            @media print {
              body * { visibility: hidden; }
              .print-area, .print-area * { visibility: visible; }
              .print-area { position: absolute; left: 0; top: 0; width: 100%; }
              .no-print { display: none !important; }
            }
          `}</style>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : !salaryData || salaryData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">لا توجد بيانات</p>
          ) : (
            <div className="print-area overflow-x-auto">
              <div className="text-center mb-4">
                <h2 className="text-lg font-bold">كشف الرواتب</h2>
                <p className="text-sm text-muted-foreground">من {startDate} إلى {endDate}</p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الرقم</TableHead>
                    <TableHead>الاسم</TableHead>
                    <TableHead>أيام الحضور</TableHead>
                    <TableHead>المبلغ المستحق</TableHead>
                    <TableHead>ساعات إضافية</TableHead>
                    <TableHead>مبلغ الإضافي</TableHead>
                    <TableHead>المكافأة</TableHead>
                    <TableHead>التسبيقات</TableHead>
                    <TableHead>الإجمالي</TableHead>
                    <TableHead>المدفوع</TableHead>
                    <TableHead>المتبقي</TableHead>
                    <TableHead>الإمضاء</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salaryData.map((row: any, idx: number) => (
                    <TableRow key={row.workerId || idx} data-testid={`row-salary-${row.workerId || idx}`}>
                      <TableCell>{row.workerNumber || idx + 1}</TableCell>
                      <TableCell className="font-medium">{row.workerName || "-"}</TableCell>
                      <TableCell>{row.daysPresent || 0}</TableCell>
                      <TableCell>{formatAmount(row.deservedAmount || 0)}</TableCell>
                      <TableCell>{Number(row.overtimeHours || 0).toFixed(1)}</TableCell>
                      <TableCell>{formatAmount(row.overtimeAmount || 0)}</TableCell>
                      <TableCell>{formatAmount(row.bonus || 0)}</TableCell>
                      <TableCell className="text-destructive">{formatAmount(row.advances || 0)}</TableCell>
                      <TableCell className="font-bold">{formatAmount(row.totalDeserved || 0)}</TableCell>
                      <TableCell>{formatAmount(row.totalPaid || 0)}</TableCell>
                      <TableCell className={Number(row.remaining || 0) >= 0 ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                        {formatAmount(row.remaining || 0)}
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  ))}
                  {totals && (
                    <TableRow className="bg-muted/50 font-bold" data-testid="row-salary-totals">
                      <TableCell></TableCell>
                      <TableCell>المجموع</TableCell>
                      <TableCell>{totals.daysPresent}</TableCell>
                      <TableCell>{formatAmount(totals.deservedAmount)}</TableCell>
                      <TableCell>{totals.overtimeHours.toFixed(1)}</TableCell>
                      <TableCell>{formatAmount(totals.overtimeAmount)}</TableCell>
                      <TableCell>{formatAmount(totals.bonus)}</TableCell>
                      <TableCell className="text-destructive">{formatAmount(totals.advances)}</TableCell>
                      <TableCell>{formatAmount(totals.totalDeserved)}</TableCell>
                      <TableCell>{formatAmount(totals.totalPaid)}</TableCell>
                      <TableCell className={totals.remaining >= 0 ? "text-green-600" : "text-red-600"}>
                        {formatAmount(totals.remaining)}
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AttendancePage() {
  const { user, hasPermission } = useAuth();
  const canViewTotals = user?.role !== "app_user" || hasPermission("view_totals");
  const isAppUser = user?.role === "app_user";

  const { data: workers, isLoading: workersLoading } = useQuery<Worker[]>({
    queryKey: ["/api/managed-workers"],
  });

  if (workersLoading) {
    return (
      <div className="p-6 space-y-4 max-w-6xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const workersList = workers || [];

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-attendance-title">الحضور والرواتب</h1>
        <p className="text-muted-foreground text-sm mt-1">إدارة البصمة والحضور والورديات والرواتب</p>
      </div>

      <Tabs defaultValue="scan" dir="rtl">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="scan" data-testid="tab-scan">
            <Fingerprint className="w-4 h-4 ml-1" /> البصمة
          </TabsTrigger>
          <TabsTrigger value="records" data-testid="tab-records">
            <CalendarDays className="w-4 h-4 ml-1" /> سجل الحضور
          </TabsTrigger>
          <TabsTrigger value="shifts" data-testid="tab-shifts">
            <Clock className="w-4 h-4 ml-1" /> الورديات
          </TabsTrigger>
          <TabsTrigger value="holidays" data-testid="tab-holidays">
            <CalendarDays className="w-4 h-4 ml-1" /> الأعياد
          </TabsTrigger>
          <TabsTrigger value="warnings" data-testid="tab-warnings">
            <AlertTriangle className="w-4 h-4 ml-1" /> الإنذارات
          </TabsTrigger>
          <TabsTrigger value="overtime" data-testid="tab-overtime">
            <Timer className="w-4 h-4 ml-1" /> الساعات الإضافية
          </TabsTrigger>
          {canViewTotals && (
            <TabsTrigger value="bonuses" data-testid="tab-bonuses">
              <Gift className="w-4 h-4 ml-1" /> المكافآت
            </TabsTrigger>
          )}
          {canViewTotals && (
            <TabsTrigger value="salary" data-testid="tab-salary">
              <FileText className="w-4 h-4 ml-1" /> كشف الرواتب
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="scan">
          <ScanTab workers={workersList} />
        </TabsContent>
        <TabsContent value="records">
          <AttendanceRecordsTab workers={workersList} />
        </TabsContent>
        <TabsContent value="shifts">
          <ShiftsTab />
        </TabsContent>
        <TabsContent value="holidays">
          <HolidaysTab />
        </TabsContent>
        <TabsContent value="warnings">
          <WarningsTab workers={workersList} />
        </TabsContent>
        <TabsContent value="overtime">
          <OvertimeTab workers={workersList} canViewTotals={canViewTotals} />
        </TabsContent>
        {canViewTotals && (
          <TabsContent value="bonuses">
            <BonusesTab />
          </TabsContent>
        )}
        {canViewTotals && (
          <TabsContent value="salary">
            <SalaryStatementTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
