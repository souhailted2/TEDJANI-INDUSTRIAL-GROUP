import { sql } from "drizzle-orm";
import { pgTable, text, varchar, numeric, timestamp, boolean, index, jsonb, date, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

export const companies = pgTable("companies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  phone: text("phone"),
  whatsappApiKey: text("whatsapp_api_key"),
  balance: numeric("balance", { precision: 15, scale: 2 }).notNull().default("0"),
  debtToParent: numeric("debt_to_parent", { precision: 15, scale: 2 }).notNull().default("0"),
  isParent: boolean("is_parent").notNull().default(false),
});

export const transfers = pgTable("transfers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromCompanyId: varchar("from_company_id").notNull().references(() => companies.id),
  toCompanyId: varchar("to_company_id").notNull().references(() => companies.id),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"),
  note: text("note"),
  date: text("date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const expenseCategories = pgTable("expense_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
});

export const expenses = pgTable("expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  category: text("category").notNull(),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  description: text("description"),
  date: text("date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const memberTypes = pgTable("member_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
});

export const members = pgTable("members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  phone: text("phone"),
  typeId: varchar("type_id").notNull().references(() => memberTypes.id),
  balance: numeric("balance", { precision: 15, scale: 2 }).notNull().default("0"),
});

export const memberTransfers = pgTable("member_transfers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  memberId: varchar("member_id").notNull().references(() => members.id),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  note: text("note"),
  date: text("date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const externalDebts = pgTable("external_debts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  personName: text("person_name").notNull(),
  phone: text("phone"),
  totalAmount: numeric("total_amount", { precision: 15, scale: 2 }).notNull(),
  paidAmount: numeric("paid_amount", { precision: 15, scale: 2 }).notNull().default("0"),
  note: text("note"),
  date: text("date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const debtPayments = pgTable("debt_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  debtId: varchar("debt_id").notNull().references(() => externalDebts.id),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  note: text("note"),
  date: text("date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCompanySchema = createInsertSchema(companies).omit({ id: true, debtToParent: true, password: true });
export const insertTransferSchema = createInsertSchema(transfers).omit({ id: true, createdAt: true, status: true });
export const insertExpenseSchema = createInsertSchema(expenses).omit({ id: true, createdAt: true });
export const insertExpenseCategorySchema = createInsertSchema(expenseCategories).omit({ id: true });
export const insertMemberTypeSchema = createInsertSchema(memberTypes).omit({ id: true });
export const insertMemberSchema = createInsertSchema(members).omit({ id: true });
export const insertMemberTransferSchema = createInsertSchema(memberTransfers).omit({ id: true, createdAt: true });
export const trucks = pgTable("trucks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  number: text("number").notNull(),
  driverName: text("driver_name").notNull(),
  balance: numeric("balance", { precision: 15, scale: 2 }).notNull().default("0"),
  fuelFormula: numeric("fuel_formula", { precision: 15, scale: 4 }).notNull().default("0"),
  driverWage: numeric("driver_wage", { precision: 15, scale: 2 }).notNull().default("0"),
  driverCommissionRate: numeric("driver_commission_rate", { precision: 5, scale: 2 }).notNull().default("0"),
});

export const truckExpenses = pgTable("truck_expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  truckId: varchar("truck_id").notNull().references(() => trucks.id),
  category: text("category").notNull(),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  type: text("type").notNull().default("expense"),
  description: text("description"),
  date: text("date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const truckTrips = pgTable("truck_trips", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  truckId: varchar("truck_id").notNull().references(() => trucks.id),
  departureLocation: text("departure_location").notNull(),
  arrivalLocation: text("arrival_location").notNull(),
  fuelExpense: numeric("fuel_expense", { precision: 15, scale: 2 }).notNull().default("0"),
  foodExpense: numeric("food_expense", { precision: 15, scale: 2 }).notNull().default("0"),
  sparePartsExpense: numeric("spare_parts_expense", { precision: 15, scale: 2 }).notNull().default("0"),
  oldOdometer: numeric("old_odometer", { precision: 15, scale: 2 }).notNull().default("0"),
  newOdometer: numeric("new_odometer", { precision: 15, scale: 2 }).notNull().default("0"),
  tripFare: numeric("trip_fare", { precision: 15, scale: 2 }).notNull().default("0"),
  expectedFuel: numeric("expected_fuel", { precision: 15, scale: 2 }).notNull().default("0"),
  driverWageEntry: numeric("driver_wage_entry", { precision: 15, scale: 2 }).notNull().default("0"),
  commissionEntry: numeric("commission_entry", { precision: 15, scale: 2 }).notNull().default("0"),
  netResult: numeric("net_result", { precision: 15, scale: 2 }).notNull().default("0"),
  date: text("date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const externalFunds = pgTable("external_funds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  personName: text("person_name").notNull(),
  phone: text("phone"),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  type: text("type").notNull().default("incoming"),
  description: text("description"),
  date: text("date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  balance: numeric("balance", { precision: 15, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const projectTransactions = pgTable("project_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  type: text("type").notNull().default("income"),
  description: text("description"),
  date: text("date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Factory System
export const factorySettings = pgTable("factory_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  balance: numeric("balance", { precision: 15, scale: 2 }).notNull().default("0"),
});

export const workshops = pgTable("workshops", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const workshopExpenseCategories = pgTable("workshop_expense_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
});

export const workshopExpenses = pgTable("workshop_expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workshopId: varchar("workshop_id").notNull().references(() => workshops.id),
  category: text("category").notNull(),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  description: text("description"),
  date: text("date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const machines = pgTable("machines", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workshopId: varchar("workshop_id").notNull().references(() => workshops.id),
  name: text("name").notNull(),
  type: text("type").notNull().default("counter"),
  expectedDailyOutput: numeric("expected_daily_output", { precision: 15, scale: 2 }).notNull().default("0"),
  unit: text("unit").notNull().default("kg"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const workerCompanies = pgTable("worker_companies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const workers = pgTable("workers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  phone: text("phone"),
  workerNumber: text("worker_number"),
  workerCompanyId: varchar("worker_company_id").references(() => workerCompanies.id),
  contractEndDate: text("contract_end_date"),
  wage: numeric("wage", { precision: 15, scale: 2 }).notNull().default("0"),
  workPeriod: text("work_period"),
  workshopId: varchar("workshop_id").references(() => workshops.id),
  nonRenewalDate: text("non_renewal_date"),
  balance: numeric("balance", { precision: 15, scale: 2 }).notNull().default("0"),
  overtimeRate: numeric("overtime_rate", { precision: 15, scale: 2 }).notNull().default("0"),
  shiftId: varchar("shift_id").references(() => workShifts.id),
  bonus: numeric("bonus", { precision: 15, scale: 2 }).notNull().default("5000"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const workerTransactions = pgTable("worker_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workerId: varchar("worker_id").notNull().references(() => workers.id),
  type: text("type").notNull(),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  note: text("note"),
  date: text("date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const workShifts = pgTable("work_shifts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  lateToleranceMinutes: integer("late_tolerance_minutes").notNull().default(3),
  earlyLeaveMinutes: integer("early_leave_minutes").notNull().default(10),
  overtimeAfterMinutes: integer("overtime_after_minutes").notNull().default(30),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const attendanceScans = pgTable("attendance_scans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workerId: varchar("worker_id").notNull().references(() => workers.id),
  scanTime: timestamp("scan_time").notNull().defaultNow(),
  type: text("type").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const attendanceDays = pgTable("attendance_days", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workerId: varchar("worker_id").notNull().references(() => workers.id),
  date: text("date").notNull(),
  checkIn: text("check_in"),
  checkOut: text("check_out"),
  status: text("status").notNull().default("absent"),
  lateMinutes: integer("late_minutes").notNull().default(0),
  earlyLeaveMinutes: integer("early_leave_minutes").notNull().default(0),
  overtimeMinutes: integer("overtime_minutes").notNull().default(0),
  shiftId: varchar("shift_id").references(() => workShifts.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const holidays = pgTable("holidays", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: text("date").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const workerWarnings = pgTable("worker_warnings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workerId: varchar("worker_id").notNull().references(() => workers.id),
  date: text("date").notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const machineDailyEntries = pgTable("machine_daily_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  machineId: varchar("machine_id").notNull().references(() => machines.id),
  workerId: varchar("worker_id").notNull().references(() => workers.id),
  outputValue: numeric("output_value", { precision: 15, scale: 2 }).notNull().default("0"),
  oldCounter: numeric("old_counter", { precision: 15, scale: 2 }).notNull().default("0"),
  newCounter: numeric("new_counter", { precision: 15, scale: 2 }).notNull().default("0"),
  date: text("date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const sparePartsItems = pgTable("spare_parts_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  quantity: numeric("quantity", { precision: 15, scale: 2 }).notNull().default("0"),
  unit: text("unit").notNull().default("قطعة"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const sparePartsPurchases = pgTable("spare_parts_purchases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sparePartId: varchar("spare_part_id").notNull().references(() => sparePartsItems.id),
  quantity: numeric("quantity", { precision: 15, scale: 2 }).notNull(),
  cost: numeric("cost", { precision: 15, scale: 2 }).notNull().default("0"),
  date: text("date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const sparePartsConsumption = pgTable("spare_parts_consumption", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sparePartId: varchar("spare_part_id").notNull().references(() => sparePartsItems.id),
  machineId: varchar("machine_id").notNull().references(() => machines.id),
  quantity: numeric("quantity", { precision: 15, scale: 2 }).notNull(),
  date: text("date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const rawMaterials = pgTable("raw_materials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  quantity: numeric("quantity", { precision: 15, scale: 2 }).notNull().default("0"),
  unit: text("unit").notNull().default("kg"),
  workshopId: varchar("workshop_id").references(() => workshops.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const rawMaterialPurchases = pgTable("raw_material_purchases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  rawMaterialId: varchar("raw_material_id").notNull().references(() => rawMaterials.id),
  quantity: numeric("quantity", { precision: 15, scale: 2 }).notNull(),
  cost: numeric("cost", { precision: 15, scale: 2 }).notNull().default("0"),
  date: text("date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const operators = pgTable("operators", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const appUsers = pgTable("app_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name").notNull(),
  permissions: text("permissions").array().notNull().default(sql`'{}'::text[]`),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertOperatorSchema = createInsertSchema(operators).omit({ id: true, createdAt: true });
export const insertAppUserSchema = createInsertSchema(appUsers).omit({ id: true, createdAt: true });

export const insertWorkshopSchema = createInsertSchema(workshops).omit({ id: true, createdAt: true });
export const insertWorkshopExpenseCategorySchema = createInsertSchema(workshopExpenseCategories).omit({ id: true });
export const insertWorkshopExpenseSchema = createInsertSchema(workshopExpenses).omit({ id: true, createdAt: true });
export const insertMachineSchema = createInsertSchema(machines).omit({ id: true, createdAt: true });
export const insertWorkerCompanySchema = createInsertSchema(workerCompanies).omit({ id: true, createdAt: true });
export const insertWorkerSchema = createInsertSchema(workers).omit({ id: true, createdAt: true, balance: true });
export const insertWorkerTransactionSchema = createInsertSchema(workerTransactions).omit({ id: true, createdAt: true });
export const insertMachineDailyEntrySchema = createInsertSchema(machineDailyEntries).omit({ id: true, createdAt: true });
export const insertSparePartItemSchema = createInsertSchema(sparePartsItems).omit({ id: true, createdAt: true });
export const insertSparePartPurchaseSchema = createInsertSchema(sparePartsPurchases).omit({ id: true, createdAt: true });
export const insertSparePartConsumptionSchema = createInsertSchema(sparePartsConsumption).omit({ id: true, createdAt: true });
export const insertRawMaterialSchema = createInsertSchema(rawMaterials).omit({ id: true, createdAt: true });
export const insertRawMaterialPurchaseSchema = createInsertSchema(rawMaterialPurchases).omit({ id: true, createdAt: true });

export const insertProjectSchema = createInsertSchema(projects).omit({ id: true, createdAt: true, balance: true });
export const insertProjectTransactionSchema = createInsertSchema(projectTransactions).omit({ id: true, createdAt: true });

export const insertExternalFundSchema = createInsertSchema(externalFunds).omit({ id: true, createdAt: true });
export const insertExternalDebtSchema = createInsertSchema(externalDebts).omit({ id: true, createdAt: true, paidAmount: true });
export const insertDebtPaymentSchema = createInsertSchema(debtPayments).omit({ id: true, createdAt: true });
export const insertTruckSchema = createInsertSchema(trucks).omit({ id: true, balance: true });
export const insertTruckExpenseSchema = createInsertSchema(truckExpenses).omit({ id: true, createdAt: true });
export const insertTruckTripSchema = createInsertSchema(truckTrips).omit({ id: true, createdAt: true });

export const insertWorkShiftSchema = createInsertSchema(workShifts).omit({ id: true, createdAt: true });
export const insertAttendanceScanSchema = createInsertSchema(attendanceScans).omit({ id: true, createdAt: true });
export const insertAttendanceDaySchema = createInsertSchema(attendanceDays).omit({ id: true, createdAt: true });
export const insertHolidaySchema = createInsertSchema(holidays).omit({ id: true, createdAt: true });
export const insertWorkerWarningSchema = createInsertSchema(workerWarnings).omit({ id: true, createdAt: true });

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const registerCompanySchema = z.object({
  name: z.string().min(1),
  username: z.string().min(3),
  password: z.string().min(4),
  phone: z.string().optional(),
  whatsappApiKey: z.string().optional(),
  balance: z.string().optional(),
});

export const updateCompanySchema = z.object({
  name: z.string().min(1).optional(),
  username: z.string().min(3).optional(),
  password: z.string().min(4).optional(),
  phone: z.string().optional(),
  whatsappApiKey: z.string().optional(),
});

export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Company = typeof companies.$inferSelect;
export type InsertTransfer = z.infer<typeof insertTransferSchema>;
export type Transfer = typeof transfers.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expenses.$inferSelect;
export type ExpenseCategory = typeof expenseCategories.$inferSelect;
export type InsertExpenseCategory = z.infer<typeof insertExpenseCategorySchema>;
export type MemberType = typeof memberTypes.$inferSelect;
export type InsertMemberType = z.infer<typeof insertMemberTypeSchema>;
export type Member = typeof members.$inferSelect;
export type InsertMember = z.infer<typeof insertMemberSchema>;
export type MemberTransfer = typeof memberTransfers.$inferSelect;
export type InsertMemberTransfer = z.infer<typeof insertMemberTransferSchema>;
export type ExternalDebt = typeof externalDebts.$inferSelect;
export type InsertExternalDebt = z.infer<typeof insertExternalDebtSchema>;
export type DebtPayment = typeof debtPayments.$inferSelect;
export type InsertDebtPayment = z.infer<typeof insertDebtPaymentSchema>;
export type Truck = typeof trucks.$inferSelect;
export type InsertTruck = z.infer<typeof insertTruckSchema>;
export type TruckExpense = typeof truckExpenses.$inferSelect;
export type InsertTruckExpense = z.infer<typeof insertTruckExpenseSchema>;
export type TruckTrip = typeof truckTrips.$inferSelect;
export type InsertTruckTrip = z.infer<typeof insertTruckTripSchema>;
export type ExternalFund = typeof externalFunds.$inferSelect;
export type InsertExternalFund = z.infer<typeof insertExternalFundSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type ProjectTransaction = typeof projectTransactions.$inferSelect;
export type InsertProjectTransaction = z.infer<typeof insertProjectTransactionSchema>;
export type Operator = typeof operators.$inferSelect;
export type InsertOperator = z.infer<typeof insertOperatorSchema>;
export type FactorySettings = typeof factorySettings.$inferSelect;
export type Workshop = typeof workshops.$inferSelect;
export type InsertWorkshop = z.infer<typeof insertWorkshopSchema>;
export type WorkshopExpenseCategory = typeof workshopExpenseCategories.$inferSelect;
export type InsertWorkshopExpenseCategory = z.infer<typeof insertWorkshopExpenseCategorySchema>;
export type WorkshopExpense = typeof workshopExpenses.$inferSelect;
export type InsertWorkshopExpense = z.infer<typeof insertWorkshopExpenseSchema>;
export type Machine = typeof machines.$inferSelect;
export type InsertMachine = z.infer<typeof insertMachineSchema>;
export type Worker = typeof workers.$inferSelect;
export type InsertWorker = z.infer<typeof insertWorkerSchema>;
export type MachineDailyEntry = typeof machineDailyEntries.$inferSelect;
export type InsertMachineDailyEntry = z.infer<typeof insertMachineDailyEntrySchema>;
export type SparePartItem = typeof sparePartsItems.$inferSelect;
export type InsertSparePartItem = z.infer<typeof insertSparePartItemSchema>;
export type SparePartPurchase = typeof sparePartsPurchases.$inferSelect;
export type InsertSparePartPurchase = z.infer<typeof insertSparePartPurchaseSchema>;
export type SparePartConsumption = typeof sparePartsConsumption.$inferSelect;
export type InsertSparePartConsumption = z.infer<typeof insertSparePartConsumptionSchema>;
export type RawMaterial = typeof rawMaterials.$inferSelect;
export type InsertRawMaterial = z.infer<typeof insertRawMaterialSchema>;
export type RawMaterialPurchase = typeof rawMaterialPurchases.$inferSelect;
export type InsertRawMaterialPurchase = z.infer<typeof insertRawMaterialPurchaseSchema>;
export type AppUser = typeof appUsers.$inferSelect;
export type InsertAppUser = z.infer<typeof insertAppUserSchema>;
export type WorkerCompany = typeof workerCompanies.$inferSelect;
export type InsertWorkerCompany = z.infer<typeof insertWorkerCompanySchema>;
export type WorkerTransaction = typeof workerTransactions.$inferSelect;
export type InsertWorkerTransaction = z.infer<typeof insertWorkerTransactionSchema>;
export type WorkShift = typeof workShifts.$inferSelect;
export type InsertWorkShift = z.infer<typeof insertWorkShiftSchema>;
export type AttendanceScan = typeof attendanceScans.$inferSelect;
export type InsertAttendanceScan = z.infer<typeof insertAttendanceScanSchema>;
export type AttendanceDay = typeof attendanceDays.$inferSelect;
export type InsertAttendanceDay = z.infer<typeof insertAttendanceDaySchema>;
export type Holiday = typeof holidays.$inferSelect;
export type InsertHoliday = z.infer<typeof insertHolidaySchema>;
export type WorkerWarning = typeof workerWarnings.$inferSelect;
export type InsertWorkerWarning = z.infer<typeof insertWorkerWarningSchema>;
