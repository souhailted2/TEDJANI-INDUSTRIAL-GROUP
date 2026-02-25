import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { formatAmount, formatDateSimple } from "@/lib/format";
import { FileText, Printer, Building2, ArrowDown, ArrowUp, Wallet } from "lucide-react";
import type { Company, Transfer, Expense, MemberTransfer, Member, ExternalDebt, DebtPayment, TruckExpense, Truck, TruckTrip, ExternalFund, Project, ProjectTransaction } from "@shared/schema";

type SafeCompany = Omit<Company, "password">;

interface StatementRow {
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  category: string;
  note?: string | null;
}

const PRINT_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Cairo', sans-serif; direction: rtl; padding: 20px; color: #1a1a1a; font-size: 12px; }
  .header { text-align: center; margin-bottom: 24px; border-bottom: 2px solid #333; padding-bottom: 16px; }
  .header h1 { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
  .header p { color: #666; font-size: 13px; }
  .balance-box { display: flex; justify-content: space-between; margin-bottom: 20px; gap: 16px; }
  .balance-item { flex: 1; padding: 12px; border: 1px solid #ddd; border-radius: 6px; text-align: center; }
  .balance-item .label { font-size: 11px; color: #666; margin-bottom: 4px; }
  .balance-item .value { font-size: 16px; font-weight: 700; }
  .positive { color: #16a34a; }
  .negative { color: #dc2626; }
  .section-title { font-size: 14px; font-weight: 700; margin: 20px 0 8px 0; padding-bottom: 4px; border-bottom: 1px solid #ddd; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 16px; }
  th { background: #f3f4f6; padding: 8px 12px; text-align: right; font-weight: 600; border: 1px solid #ddd; font-size: 11px; }
  td { padding: 6px 12px; border: 1px solid #ddd; text-align: right; font-size: 11px; }
  tr:nth-child(even) { background: #fafafa; }
  .totals td { font-weight: 700; background: #f3f4f6; }
  .footer { margin-top: 24px; text-align: center; font-size: 10px; color: #999; border-top: 1px solid #ddd; padding-top: 12px; }
  @media print { body { padding: 10px; } }
`;

function openPrintWindow(content: HTMLDivElement | null, title: string) {
  if (!content) return;
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  printWindow.document.write(`
    <!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><title>${title}</title>
    <style>${PRINT_STYLES}</style></head><body>
    ${content.innerHTML}
    <div class="footer">تم إنشاء هذا الكشف بتاريخ ${new Date().toLocaleDateString("en-US")} - نظام التحويلات المالية</div>
    </body></html>
  `);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => printWindow.print(), 500);
}

function StatementTable({ rows, showCategory }: { rows: StatementRow[]; showCategory?: boolean }) {
  const { hasPermission, user } = useAuth();
  const canViewTotals = user?.role !== "app_user" || hasPermission("view_totals");
  const totalDebit = rows.reduce((sum, r) => sum + r.debit, 0);
  const totalCredit = rows.reduce((sum, r) => sum + r.credit, 0);
  const lastBalance = rows.length > 0 ? rows[rows.length - 1].balance : 0;

  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">لا توجد عمليات مسجلة</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" data-testid="table-statement">
        <thead>
          <tr className="border-b">
            <th className="text-right p-2 text-muted-foreground font-medium text-xs">#</th>
            <th className="text-right p-2 text-muted-foreground font-medium text-xs">التاريخ</th>
            {showCategory && <th className="text-right p-2 text-muted-foreground font-medium text-xs">النوع</th>}
            <th className="text-right p-2 text-muted-foreground font-medium text-xs">البيان</th>
            <th className="text-right p-2 text-muted-foreground font-medium text-xs">ملاحظات</th>
            <th className="text-right p-2 text-muted-foreground font-medium text-xs">مدين (صادر)</th>
            <th className="text-right p-2 text-muted-foreground font-medium text-xs">دائن (وارد)</th>
            {canViewTotals && <th className="text-right p-2 text-muted-foreground font-medium text-xs">الرصيد</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b last:border-b-0" data-testid={`statement-row-${i}`}>
              <td className="p-2 text-muted-foreground">{i + 1}</td>
              <td className="p-2 whitespace-nowrap">{row.date}</td>
              {showCategory && <td className="p-2"><Badge variant="outline" className="text-xs">{row.category}</Badge></td>}
              <td className="p-2">{row.description}</td>
              <td className="p-2 text-muted-foreground text-xs">{row.note || "-"}</td>
              <td className="p-2">
                {row.debit > 0 ? (
                  <span className="text-destructive flex items-center gap-1">
                    <ArrowUp className="w-3 h-3" />{formatAmount(row.debit)}
                  </span>
                ) : "-"}
              </td>
              <td className="p-2">
                {row.credit > 0 ? (
                  <span className="text-green-600 flex items-center gap-1">
                    <ArrowDown className="w-3 h-3" />{formatAmount(row.credit)}
                  </span>
                ) : "-"}
              </td>
              {canViewTotals && (
                <td className={`p-2 font-bold ${row.balance >= 0 ? "text-green-600" : "text-destructive"}`}>
                  {formatAmount(row.balance)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
        {canViewTotals && (
          <tfoot>
            <tr className="border-t-2 font-bold">
              <td colSpan={showCategory ? 5 : 4} className="p-2">الإجمالي</td>
              <td className="p-2 text-destructive">{formatAmount(totalDebit)}</td>
              <td className="p-2 text-green-600">{formatAmount(totalCredit)}</td>
              <td className={`p-2 ${lastBalance >= 0 ? "text-green-600" : "text-destructive"}`}>{formatAmount(lastBalance)}</td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

function PrintableTable({ rows, showCategory }: { rows: StatementRow[]; showCategory?: boolean }) {
  const { hasPermission, user } = useAuth();
  const canViewTotals = user?.role !== "app_user" || hasPermission("view_totals");
  const totalDebit = rows.reduce((sum, r) => sum + r.debit, 0);
  const totalCredit = rows.reduce((sum, r) => sum + r.credit, 0);
  const lastBalance = rows.length > 0 ? rows[rows.length - 1].balance : 0;

  return (
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>التاريخ</th>
          {showCategory && <th>النوع</th>}
          <th>البيان</th>
          <th>ملاحظات</th>
          <th>مدين (صادر)</th>
          <th>دائن (وارد)</th>
          {canViewTotals && <th>الرصيد</th>}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            <td>{i + 1}</td>
            <td>{row.date}</td>
            {showCategory && <td>{row.category}</td>}
            <td>{row.description}</td>
            <td>{row.note || "-"}</td>
            <td className={row.debit > 0 ? "negative" : ""}>{row.debit > 0 ? formatAmount(row.debit) : "-"}</td>
            <td className={row.credit > 0 ? "positive" : ""}>{row.credit > 0 ? formatAmount(row.credit) : "-"}</td>
            {canViewTotals && <td className={row.balance >= 0 ? "positive" : "negative"}>{formatAmount(row.balance)}</td>}
          </tr>
        ))}
        {canViewTotals && (
          <tr className="totals">
            <td colSpan={showCategory ? 5 : 4}>الإجمالي</td>
            <td className="negative">{formatAmount(totalDebit)}</td>
            <td className="positive">{formatAmount(totalCredit)}</td>
            <td className={lastBalance >= 0 ? "positive" : "negative"}>{formatAmount(lastBalance)}</td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

function CompanyStatement({ company, transfers, allCompanies }: {
  company: SafeCompany;
  transfers: Transfer[];
  allCompanies: SafeCompany[];
}) {
  const { hasPermission, user } = useAuth();
  const canViewTotals = user?.role !== "app_user" || hasPermission("view_totals");
  const printRef = useRef<HTMLDivElement>(null);

  const companyTransfers = transfers
    .filter(t => t.status === "approved" && (t.fromCompanyId === company.id || t.toCompanyId === company.id))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const rows: StatementRow[] = [];
  let runningBalance = 0;

  for (const t of companyTransfers) {
    const amount = Number(t.amount);
    const isSender = t.fromCompanyId === company.id;
    const otherCompany = allCompanies.find(c => c.id === (isSender ? t.toCompanyId : t.fromCompanyId));

    if (isSender) {
      runningBalance -= amount;
      rows.push({ date: t.date || formatDateSimple(t.createdAt), description: `تحويل إلى ${otherCompany?.name || "غير معروف"}`, debit: amount, credit: 0, balance: runningBalance, category: "تحويل", note: t.note });
    } else {
      runningBalance += amount;
      rows.push({ date: t.date || formatDateSimple(t.createdAt), description: `تحويل من ${otherCompany?.name || "غير معروف"}`, debit: 0, credit: amount, balance: runningBalance, category: "تحويل", note: t.note });
    }
  }

  const totalDebit = rows.reduce((sum, r) => sum + r.debit, 0);
  const totalCredit = rows.reduce((sum, r) => sum + r.credit, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10 text-primary">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold" data-testid="text-statement-company-name">{company.name}</h2>
            <p className="text-sm text-muted-foreground">كشف حساب تفصيلي</p>
          </div>
        </div>
        <Button onClick={() => openPrintWindow(printRef.current, `كشف حساب - ${company.name}`)} variant="outline" data-testid="button-print-statement">
          <Printer className="w-4 h-4 ml-2" />طباعة الكشف
        </Button>
      </div>

      {canViewTotals && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card><CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">الرصيد الحالي</p>
            <p className={`text-xl font-bold ${Number(company.balance) >= 0 ? "text-green-600" : "text-destructive"}`} data-testid="text-current-balance">{formatAmount(company.balance)} د.ج</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">إجمالي الوارد</p>
            <p className="text-xl font-bold text-green-600" data-testid="text-total-credit">{formatAmount(totalCredit)} د.ج</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">إجمالي الصادر</p>
            <p className="text-xl font-bold text-destructive" data-testid="text-total-debit">{formatAmount(totalDebit)} د.ج</p>
          </CardContent></Card>
        </div>
      )}

      <div ref={printRef} style={{ display: "none" }}>
        <div className="header">
          <h1>كشف حساب - {company.name}</h1>
          <p>تاريخ الطباعة: {new Date().toLocaleDateString("en-US")}</p>
        </div>
        <div className="balance-box">
          <div className="balance-item"><div className="label">الرصيد الحالي</div><div className={`value ${Number(company.balance) >= 0 ? "positive" : "negative"}`}>{formatAmount(company.balance)} د.ج</div></div>
          <div className="balance-item"><div className="label">إجمالي الوارد</div><div className="value positive">{formatAmount(totalCredit)} د.ج</div></div>
          <div className="balance-item"><div className="label">إجمالي الصادر</div><div className="value negative">{formatAmount(totalDebit)} د.ج</div></div>
        </div>
        <PrintableTable rows={rows} />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4" />سجل العمليات
            <Badge variant="secondary" className="text-xs">{rows.length} عملية</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <StatementTable rows={rows} />
        </CardContent>
      </Card>
    </div>
  );
}

function ParentComprehensiveStatement({ parentCompany, companies, transfers, expenses, memberTransfers, members, externalDebts, debtPayments, truckExpenses, trucks, truckTrips, externalFundsList, projectTransactions, projects }: {
  parentCompany: SafeCompany;
  companies: SafeCompany[];
  transfers: Transfer[];
  expenses: Expense[];
  memberTransfers: MemberTransfer[];
  members: Member[];
  externalDebts: ExternalDebt[];
  debtPayments: DebtPayment[];
  truckExpenses: TruckExpense[];
  trucks: Truck[];
  truckTrips: TruckTrip[];
  externalFundsList: ExternalFund[];
  projectTransactions: ProjectTransaction[];
  projects: Project[];
}) {
  const { hasPermission, user } = useAuth();
  const canViewTotals = user?.role !== "app_user" || hasPermission("view_totals");
  const printRef = useRef<HTMLDivElement>(null);

  const allEntries: { date: Date; row: StatementRow }[] = [];

  const approvedTransfers = transfers.filter(t => t.status === "approved" && (t.fromCompanyId === parentCompany.id || t.toCompanyId === parentCompany.id));
  for (const t of approvedTransfers) {
    const amount = Number(t.amount);
    const isSender = t.fromCompanyId === parentCompany.id;
    const otherCompany = companies.find(c => c.id === (isSender ? t.toCompanyId : t.fromCompanyId));
    allEntries.push({
      date: t.date ? new Date(t.date) : new Date(t.createdAt),
      row: {
        date: t.date || formatDateSimple(t.createdAt),
        description: isSender ? `تحويل إلى ${otherCompany?.name || "غير معروف"}` : `تحويل من ${otherCompany?.name || "غير معروف"}`,
        debit: isSender ? amount : 0,
        credit: isSender ? 0 : amount,
        balance: 0,
        category: "تحويلات الشركات",
        note: t.note,
      },
    });
  }

  for (const e of expenses) {
    allEntries.push({
      date: e.date ? new Date(e.date) : new Date(e.createdAt),
      row: {
        date: e.date || formatDateSimple(e.createdAt),
        description: `مصروف: ${e.category}`,
        debit: Number(e.amount),
        credit: 0,
        balance: 0,
        category: "المصاريف العامة",
        note: e.description,
      },
    });
  }

  for (const mt of memberTransfers) {
    const member = members.find(m => m.id === mt.memberId);
    allEntries.push({
      date: mt.date ? new Date(mt.date) : new Date(mt.createdAt),
      row: {
        date: mt.date || formatDateSimple(mt.createdAt),
        description: `تحويل للعضو: ${member?.name || "غير معروف"}`,
        debit: Number(mt.amount),
        credit: 0,
        balance: 0,
        category: "مصاريف الشركاء",
        note: mt.note,
      },
    });
  }

  for (const te of truckExpenses) {
    const truck = trucks.find(t => t.id === te.truckId);
    const isIncome = te.type === "income";
    allEntries.push({
      date: te.date ? new Date(te.date) : new Date(te.createdAt),
      row: {
        date: te.date || formatDateSimple(te.createdAt),
        description: `شاحنة ${truck?.number || "?"} - ${te.category}`,
        debit: isIncome ? 0 : Number(te.amount),
        credit: isIncome ? Number(te.amount) : 0,
        balance: 0,
        category: "مصاريف الشاحنات",
        note: te.description,
      },
    });
  }

  for (const trip of truckTrips) {
    const truck = trucks.find(t => t.id === trip.truckId);
    const truckNum = truck?.number || "?";
    const tripDate = trip.date ? new Date(trip.date) : new Date(trip.createdAt);
    const tripDateStr = trip.date || formatDateSimple(trip.createdAt);
    const fare = Number(trip.tripFare);
    if (fare !== 0) {
      allEntries.push({
        date: tripDate,
        row: {
          date: tripDateStr,
          description: `شاحنة ${truckNum} - أجرة رحلة (${trip.departureLocation} → ${trip.arrivalLocation})`,
          debit: fare < 0 ? Math.abs(fare) : 0,
          credit: fare > 0 ? fare : 0,
          balance: 0,
          category: "رحلات الشاحنات",
          note: null,
        },
      });
    }
    const expenseItems = [
      { value: Number(trip.fuelExpense), label: "بنزين" },
      { value: Number(trip.foodExpense), label: "أكل" },
      { value: Number(trip.sparePartsExpense), label: "قطع غيار" },
      { value: Number(trip.driverWageEntry), label: "أجرة سائق" },
      { value: Number(trip.commissionEntry), label: "عمولة سائق" },
    ];
    for (const item of expenseItems) {
      if (item.value !== 0) {
        allEntries.push({
          date: tripDate,
          row: {
            date: tripDateStr,
            description: `شاحنة ${truckNum} - ${item.label} رحلة (${trip.departureLocation} → ${trip.arrivalLocation})`,
            debit: item.value > 0 ? item.value : 0,
            credit: item.value < 0 ? Math.abs(item.value) : 0,
            balance: 0,
            category: "رحلات الشاحنات",
            note: null,
          },
        });
      }
    }
  }

  for (const dp of debtPayments) {
    const debt = externalDebts.find(d => d.id === dp.debtId);
    allEntries.push({
      date: dp.date ? new Date(dp.date) : new Date(dp.createdAt),
      row: {
        date: dp.date || formatDateSimple(dp.createdAt),
        description: `سداد دين: ${debt?.personName || "غير معروف"}`,
        debit: Number(dp.amount),
        credit: 0,
        balance: 0,
        category: "سداد ديون خارجية",
        note: dp.note,
      },
    });
  }

  for (const ef of externalFundsList) {
    const isIncoming = ef.type === "incoming";
    allEntries.push({
      date: ef.date ? new Date(ef.date) : new Date(ef.createdAt),
      row: {
        date: ef.date || formatDateSimple(ef.createdAt),
        description: `أموال خارجية ${isIncoming ? "واردة من" : "صادرة إلى"}: ${ef.personName}`,
        debit: isIncoming ? 0 : Number(ef.amount),
        credit: isIncoming ? Number(ef.amount) : 0,
        balance: 0,
        category: "أموال خارجية",
        note: ef.description,
      },
    });
  }

  for (const pt of projectTransactions) {
    const project = projects.find(p => p.id === pt.projectId);
    const isIncome = pt.type === "income";
    allEntries.push({
      date: pt.date ? new Date(pt.date) : new Date(pt.createdAt),
      row: {
        date: pt.date || formatDateSimple(pt.createdAt),
        description: `مشروع ${project?.name || "غير معروف"} - ${isIncome ? "دخول أموال" : "خروج أموال"}`,
        debit: isIncome ? 0 : Number(pt.amount),
        credit: isIncome ? Number(pt.amount) : 0,
        balance: 0,
        category: "المشاريع",
        note: pt.description,
      },
    });
  }

  allEntries.sort((a, b) => a.date.getTime() - b.date.getTime());

  let runningBalance = 0;
  const rows = allEntries.map(entry => {
    runningBalance += entry.row.credit - entry.row.debit;
    return { ...entry.row, balance: runningBalance };
  });

  const totalDebit = rows.reduce((sum, r) => sum + r.debit, 0);
  const totalCredit = rows.reduce((sum, r) => sum + r.credit, 0);
  const totalDebts = externalDebts.reduce((sum, d) => sum + Number(d.totalAmount) - Number(d.paidAmount), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10 text-primary">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold" data-testid="text-parent-statement-title">كشف حساب الشركة الأم (شامل)</h2>
            <p className="text-sm text-muted-foreground">جميع العمليات: تحويلات، مصاريف، شركاء، ديون، شاحنات</p>
          </div>
        </div>
        <Button onClick={() => openPrintWindow(printRef.current, `كشف حساب شامل - ${parentCompany.name}`)} variant="outline" data-testid="button-print-parent-statement">
          <Printer className="w-4 h-4 ml-2" />طباعة الكشف
        </Button>
      </div>

      {canViewTotals && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card><CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">رصيد الشركة الأم</p>
            <p className={`text-lg font-bold ${Number(parentCompany.balance) >= 0 ? "text-green-600" : "text-destructive"}`} data-testid="text-parent-balance">{formatAmount(parentCompany.balance)} د.ج</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">إجمالي الوارد</p>
            <p className="text-lg font-bold text-green-600">{formatAmount(totalCredit)} د.ج</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">إجمالي الصادر</p>
            <p className="text-lg font-bold text-destructive">{formatAmount(totalDebit)} د.ج</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">ديون خارجية متبقية</p>
            <p className="text-lg font-bold text-destructive">{formatAmount(totalDebts)} د.ج</p>
          </CardContent></Card>
        </div>
      )}

      <div ref={printRef} style={{ display: "none" }}>
        <div className="header">
          <h1>كشف حساب شامل - {parentCompany.name}</h1>
          <p>تاريخ الطباعة: {new Date().toLocaleDateString("en-US")}</p>
        </div>
        <div className="balance-box">
          <div className="balance-item"><div className="label">رصيد الشركة الأم</div><div className={`value ${Number(parentCompany.balance) >= 0 ? "positive" : "negative"}`}>{formatAmount(parentCompany.balance)} د.ج</div></div>
          <div className="balance-item"><div className="label">إجمالي الوارد</div><div className="value positive">{formatAmount(totalCredit)} د.ج</div></div>
          <div className="balance-item"><div className="label">إجمالي الصادر</div><div className="value negative">{formatAmount(totalDebit)} د.ج</div></div>
          <div className="balance-item"><div className="label">ديون خارجية متبقية</div><div className="value negative">{formatAmount(totalDebts)} د.ج</div></div>
        </div>
        <div className="section-title">جميع العمليات ({rows.length} عملية)</div>
        <PrintableTable rows={rows} showCategory />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4" />جميع العمليات
            <Badge variant="secondary" className="text-xs">{rows.length} عملية</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <StatementTable rows={rows} showCategory />
        </CardContent>
      </Card>
    </div>
  );
}

function AllCompaniesStatement({ companies, transfers }: {
  companies: SafeCompany[];
  transfers: Transfer[];
}) {
  const printRef = useRef<HTMLDivElement>(null);
  const childCompanies = companies.filter(c => !c.isParent);

  const companySummaries = childCompanies.map(company => {
    const companyTransfers = transfers.filter(t => t.status === "approved" && (t.fromCompanyId === company.id || t.toCompanyId === company.id));
    const totalSent = companyTransfers.filter(t => t.fromCompanyId === company.id).reduce((sum, t) => sum + Number(t.amount), 0);
    const totalReceived = companyTransfers.filter(t => t.toCompanyId === company.id).reduce((sum, t) => sum + Number(t.amount), 0);
    return { company, totalSent, totalReceived, balance: Number(company.balance), debtToParent: Number(company.debtToParent), transferCount: companyTransfers.length };
  });

  const totalBalance = companySummaries.reduce((sum, s) => sum + s.balance, 0);
  const totalSentAll = companySummaries.reduce((sum, s) => sum + s.totalSent, 0);
  const totalReceivedAll = companySummaries.reduce((sum, s) => sum + s.totalReceived, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10 text-primary">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold" data-testid="text-all-companies-title">كشف حساب جميع الشركات</h2>
            <p className="text-sm text-muted-foreground">ملخص شامل لأرصدة وعمليات جميع الشركات</p>
          </div>
        </div>
        <Button onClick={() => openPrintWindow(printRef.current, "كشف حساب جميع الشركات")} variant="outline" data-testid="button-print-all">
          <Printer className="w-4 h-4 ml-2" />طباعة الكشف
        </Button>
      </div>

      <div ref={printRef} style={{ display: "none" }}>
        <div className="header">
          <h1>كشف حساب جميع الشركات</h1>
          <p>تاريخ الطباعة: {new Date().toLocaleDateString("en-US")}</p>
        </div>
        <table>
          <thead><tr><th>#</th><th>الشركة</th><th>الرصيد الحالي</th><th>المديونية للأم</th><th>إجمالي المرسل</th><th>إجمالي المستلم</th><th>عدد العمليات</th></tr></thead>
          <tbody>
            {companySummaries.map((s, i) => (
              <tr key={s.company.id}><td>{i + 1}</td><td>{s.company.name}</td><td className={s.balance >= 0 ? "positive" : "negative"}>{formatAmount(s.balance)} د.ج</td><td className={s.debtToParent > 0 ? "negative" : s.debtToParent < 0 ? "positive" : ""}>{formatAmount(s.debtToParent)} د.ج</td><td className="negative">{formatAmount(s.totalSent)} د.ج</td><td className="positive">{formatAmount(s.totalReceived)} د.ج</td><td>{s.transferCount}</td></tr>
            ))}
            <tr className="totals"><td colSpan={2}>الإجمالي</td><td className={totalBalance >= 0 ? "positive" : "negative"}>{formatAmount(totalBalance)} د.ج</td><td>-</td><td className="negative">{formatAmount(totalSentAll)} د.ج</td><td className="positive">{formatAmount(totalReceivedAll)} د.ج</td><td>{companySummaries.reduce((sum, s) => sum + s.transferCount, 0)}</td></tr>
          </tbody>
        </table>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4" />ملخص الشركات
            <Badge variant="secondary" className="text-xs">{childCompanies.length} شركة</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {childCompanies.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">لا توجد شركات مسجلة</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="table-all-companies">
                <thead><tr className="border-b">
                  <th className="text-right p-2 text-muted-foreground font-medium text-xs">#</th>
                  <th className="text-right p-2 text-muted-foreground font-medium text-xs">الشركة</th>
                  <th className="text-right p-2 text-muted-foreground font-medium text-xs">الرصيد الحالي</th>
                  <th className="text-right p-2 text-muted-foreground font-medium text-xs">المديونية للأم</th>
                  <th className="text-right p-2 text-muted-foreground font-medium text-xs">إجمالي المرسل</th>
                  <th className="text-right p-2 text-muted-foreground font-medium text-xs">إجمالي المستلم</th>
                  <th className="text-right p-2 text-muted-foreground font-medium text-xs">عدد العمليات</th>
                </tr></thead>
                <tbody>
                  {companySummaries.map((s, i) => (
                    <tr key={s.company.id} className="border-b last:border-b-0" data-testid={`all-company-row-${s.company.id}`}>
                      <td className="p-2 text-muted-foreground">{i + 1}</td>
                      <td className="p-2 font-medium">{s.company.name}</td>
                      <td className={`p-2 font-bold ${s.balance >= 0 ? "text-green-600" : "text-destructive"}`}>{formatAmount(s.balance)} د.ج</td>
                      <td className={`p-2 ${s.debtToParent > 0 ? "text-destructive" : s.debtToParent < 0 ? "text-green-600" : "text-muted-foreground"}`}>{formatAmount(s.debtToParent)} د.ج</td>
                      <td className="p-2 text-destructive">{formatAmount(s.totalSent)} د.ج</td>
                      <td className="p-2 text-green-600">{formatAmount(s.totalReceived)} د.ج</td>
                      <td className="p-2">{s.transferCount}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot><tr className="border-t-2 font-bold">
                  <td colSpan={2} className="p-2">الإجمالي</td>
                  <td className={`p-2 ${totalBalance >= 0 ? "text-green-600" : "text-destructive"}`}>{formatAmount(totalBalance)} د.ج</td>
                  <td className="p-2">-</td>
                  <td className="p-2 text-destructive">{formatAmount(totalSentAll)} د.ج</td>
                  <td className="p-2 text-green-600">{formatAmount(totalReceivedAll)} د.ج</td>
                  <td className="p-2">{companySummaries.reduce((sum, s) => sum + s.transferCount, 0)}</td>
                </tr></tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AccountStatement() {
  const { isParent, company: authCompany } = useAuth();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("parent");

  const { data: companies, isLoading: companiesLoading } = useQuery<SafeCompany[]>({ queryKey: ["/api/companies"] });
  const { data: transfers, isLoading: transfersLoading } = useQuery<Transfer[]>({ queryKey: ["/api/transfers"] });
  const { data: expenses } = useQuery<Expense[]>({ queryKey: ["/api/expenses"], enabled: isParent });
  const { data: memberTransfers } = useQuery<MemberTransfer[]>({ queryKey: ["/api/member-transfers"], enabled: isParent });
  const { data: members } = useQuery<Member[]>({ queryKey: ["/api/members"], enabled: isParent });
  const { data: externalDebts } = useQuery<ExternalDebt[]>({ queryKey: ["/api/external-debts"], enabled: isParent });
  const { data: debtPaymentsList } = useQuery<DebtPayment[]>({ queryKey: ["/api/debt-payments"], enabled: isParent });
  const { data: truckExpensesList } = useQuery<TruckExpense[]>({ queryKey: ["/api/truck-expenses"], enabled: isParent });
  const { data: trucks } = useQuery<Truck[]>({ queryKey: ["/api/trucks"], enabled: isParent });
  const { data: truckTripsList } = useQuery<TruckTrip[]>({ queryKey: ["/api/truck-trips"], enabled: isParent });
  const { data: externalFundsList } = useQuery<ExternalFund[]>({ queryKey: ["/api/external-funds"], enabled: isParent });
  const { data: projectTransactions } = useQuery<ProjectTransaction[]>({ queryKey: ["/api/project-transactions"], enabled: isParent });
  const { data: projectsList } = useQuery<Project[]>({ queryKey: ["/api/projects"], enabled: isParent });

  const loading = companiesLoading || transfersLoading;

  const childCompanies = companies?.filter(c => !c.isParent) || [];
  const parentCompany = companies?.find(c => c.isParent);

  if (!isParent && authCompany && companies && transfers) {
    const myCompany = companies.find(c => c.id === authCompany.id);
    if (myCompany) {
      return (
        <div className="p-6 space-y-6 max-w-6xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-statement-title">كشف الحساب</h1>
            <p className="text-muted-foreground text-sm mt-1">كشف حساب تفصيلي لشركتك</p>
          </div>
          <CompanyStatement company={myCompany} transfers={transfers} allCompanies={companies} />
        </div>
      );
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-statement-title">كشف الحساب</h1>
          <p className="text-muted-foreground text-sm mt-1">عرض كشوفات حسابات الشركات مع إمكانية الطباعة</p>
        </div>
      </div>

      {isParent && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 flex-wrap">
              <label className="text-sm font-medium whitespace-nowrap">اختر الشركة:</label>
              <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                <SelectTrigger className="w-64" data-testid="select-company-statement">
                  <SelectValue placeholder="اختر شركة" />
                </SelectTrigger>
                <SelectContent>
                  {parentCompany && (
                    <SelectItem value="parent" data-testid="option-parent-company">
                      {parentCompany.name} (الشركة الأم - كشف شامل)
                    </SelectItem>
                  )}
                  <SelectItem value="all" data-testid="option-all-companies">جميع الشركات (ملخص)</SelectItem>
                  {childCompanies.map(c => (
                    <SelectItem key={c.id} value={c.id} data-testid={`option-company-${c.id}`}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : selectedCompanyId === "parent" && isParent && parentCompany ? (
        <ParentComprehensiveStatement
          parentCompany={parentCompany}
          companies={companies || []}
          transfers={transfers || []}
          expenses={expenses || []}
          memberTransfers={memberTransfers || []}
          members={members || []}
          externalDebts={externalDebts || []}
          debtPayments={debtPaymentsList || []}
          truckExpenses={truckExpensesList || []}
          trucks={trucks || []}
          truckTrips={truckTripsList || []}
          externalFundsList={externalFundsList || []}
          projectTransactions={projectTransactions || []}
          projects={projectsList || []}
        />
      ) : selectedCompanyId === "all" && isParent ? (
        <AllCompaniesStatement companies={companies || []} transfers={transfers || []} />
      ) : companies?.find(c => c.id === selectedCompanyId) ? (
        <CompanyStatement
          company={companies.find(c => c.id === selectedCompanyId)!}
          transfers={transfers || []}
          allCompanies={companies || []}
        />
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">اختر شركة لعرض كشف حسابها</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
