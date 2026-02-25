import { eq, or, and, gte, lte } from "drizzle-orm";
import { db } from "./db";
import {
  companies, transfers, expenses, expenseCategories, memberTypes, members, memberTransfers,
  externalDebts, debtPayments, trucks, truckExpenses, truckTrips, externalFunds, projects, projectTransactions, operators,
  factorySettings,
  workshops, workshopExpenseCategories, workshopExpenses, machines, workers, machineDailyEntries,
  sparePartsItems, sparePartsPurchases, sparePartsConsumption, rawMaterials, rawMaterialPurchases,
  workerCompanies, workerTransactions,
  workShifts, attendanceScans, attendanceDays, holidays, workerWarnings,
  type FactorySettings,
  type Company, type Transfer, type InsertTransfer, type Expense, type InsertExpense,
  type ExpenseCategory, type InsertExpenseCategory, type MemberType, type InsertMemberType,
  type Member, type InsertMember, type MemberTransfer, type InsertMemberTransfer,
  type ExternalDebt, type InsertExternalDebt, type DebtPayment, type InsertDebtPayment,
  type Truck, type InsertTruck, type TruckExpense, type InsertTruckExpense,
  type TruckTrip, type InsertTruckTrip,
  type ExternalFund, type InsertExternalFund,
  type Project, type InsertProject, type ProjectTransaction, type InsertProjectTransaction,
  type Operator, type InsertOperator,
  type Workshop, type InsertWorkshop, type WorkshopExpenseCategory, type InsertWorkshopExpenseCategory,
  type WorkshopExpense, type InsertWorkshopExpense, type Machine, type InsertMachine,
  type Worker, type InsertWorker, type MachineDailyEntry, type InsertMachineDailyEntry,
  type SparePartItem, type InsertSparePartItem, type SparePartPurchase, type InsertSparePartPurchase,
  type SparePartConsumption, type InsertSparePartConsumption,
  type RawMaterial, type InsertRawMaterial, type RawMaterialPurchase, type InsertRawMaterialPurchase,
  appUsers, type AppUser, type InsertAppUser,
  type WorkerCompany, type InsertWorkerCompany, type WorkerTransaction, type InsertWorkerTransaction,
  type WorkShift, type InsertWorkShift, type AttendanceScan, type InsertAttendanceScan,
  type AttendanceDay, type InsertAttendanceDay, type Holiday, type InsertHoliday,
  type WorkerWarning, type InsertWorkerWarning,
} from "@shared/schema";

export interface IStorage {
  getCompanies(): Promise<Company[]>;
  getCompany(id: string): Promise<Company | undefined>;
  getCompanyByUsername(username: string): Promise<Company | undefined>;
  createCompany(company: Omit<Company, "id">): Promise<Company>;
  updateCompany(id: string, data: Partial<Pick<Company, "name" | "username" | "password" | "phone">>): Promise<Company | undefined>;
  deleteCompany(id: string): Promise<void>;
  updateCompanyBalance(id: string, balance: string): Promise<Company | undefined>;
  updateCompanyDebt(id: string, debtToParent: string): Promise<Company | undefined>;

  getTransfers(): Promise<Transfer[]>;
  getTransfer(id: string): Promise<Transfer | undefined>;
  createTransfer(transfer: InsertTransfer): Promise<Transfer>;
  updateTransferStatus(id: string, status: string): Promise<Transfer | undefined>;

  getExpenseCategories(): Promise<ExpenseCategory[]>;
  createExpenseCategory(cat: InsertExpenseCategory): Promise<ExpenseCategory>;
  deleteExpenseCategory(id: string): Promise<void>;

  getExpenses(): Promise<Expense[]>;
  getExpense(id: string): Promise<Expense | undefined>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: string, data: Partial<InsertExpense>): Promise<Expense | undefined>;
  deleteExpense(id: string): Promise<void>;

  getMemberTypes(): Promise<MemberType[]>;
  createMemberType(mt: InsertMemberType): Promise<MemberType>;
  deleteMemberType(id: string): Promise<void>;

  getMembers(): Promise<Member[]>;
  getMember(id: string): Promise<Member | undefined>;
  createMember(member: InsertMember): Promise<Member>;
  updateMember(id: string, data: Partial<Pick<Member, "name" | "phone" | "typeId">>): Promise<Member | undefined>;
  deleteMember(id: string): Promise<void>;
  updateMemberBalance(id: string, balance: string): Promise<Member | undefined>;

  getMemberTransfers(): Promise<MemberTransfer[]>;
  getMemberTransfersByMember(memberId: string): Promise<MemberTransfer[]>;
  createMemberTransfer(mt: InsertMemberTransfer): Promise<MemberTransfer>;
  deleteMemberTransfer(id: string): Promise<void>;
  getMemberTransfer(id: string): Promise<MemberTransfer | undefined>;

  getExternalDebts(): Promise<ExternalDebt[]>;
  getExternalDebt(id: string): Promise<ExternalDebt | undefined>;
  createExternalDebt(debt: InsertExternalDebt): Promise<ExternalDebt>;
  updateExternalDebt(id: string, data: Partial<Pick<ExternalDebt, "personName" | "phone" | "note" | "totalAmount" | "paidAmount">>): Promise<ExternalDebt | undefined>;
  deleteExternalDebt(id: string): Promise<void>;

  getDebtPayments(debtId: string): Promise<DebtPayment[]>;
  getAllDebtPayments(): Promise<DebtPayment[]>;
  getDebtPayment(id: string): Promise<DebtPayment | undefined>;
  createDebtPayment(payment: InsertDebtPayment): Promise<DebtPayment>;
  deleteDebtPayment(id: string): Promise<void>;

  getTrucks(): Promise<Truck[]>;
  getTruck(id: string): Promise<Truck | undefined>;
  createTruck(truck: InsertTruck): Promise<Truck>;
  updateTruck(id: string, data: Partial<Pick<Truck, "number" | "driverName" | "fuelFormula" | "driverWage" | "driverCommissionRate">>): Promise<Truck | undefined>;
  updateTruckBalance(id: string, balance: string): Promise<Truck | undefined>;
  deleteTruck(id: string): Promise<void>;

  getTruckExpenses(truckId: string): Promise<TruckExpense[]>;
  getAllTruckExpenses(): Promise<TruckExpense[]>;
  getTruckExpense(id: string): Promise<TruckExpense | undefined>;
  createTruckExpense(expense: InsertTruckExpense): Promise<TruckExpense>;
  deleteTruckExpense(id: string): Promise<void>;

  getTruckTrips(truckId: string): Promise<TruckTrip[]>;
  getAllTruckTrips(): Promise<TruckTrip[]>;
  getTruckTrip(id: string): Promise<TruckTrip | undefined>;
  getLastTruckTrip(truckId: string): Promise<TruckTrip | undefined>;
  createTruckTrip(trip: InsertTruckTrip): Promise<TruckTrip>;
  updateTruckTrip(id: string, data: Partial<InsertTruckTrip>): Promise<TruckTrip | undefined>;
  deleteTruckTrip(id: string): Promise<void>;

  getExternalFunds(): Promise<ExternalFund[]>;
  getExternalFund(id: string): Promise<ExternalFund | undefined>;
  createExternalFund(fund: InsertExternalFund): Promise<ExternalFund>;
  deleteExternalFund(id: string): Promise<void>;

  getProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProjectBalance(id: string, balance: string): Promise<Project | undefined>;
  deleteProject(id: string): Promise<void>;

  getProjectTransactions(projectId: string): Promise<ProjectTransaction[]>;
  getAllProjectTransactions(): Promise<ProjectTransaction[]>;
  getProjectTransaction(id: string): Promise<ProjectTransaction | undefined>;
  createProjectTransaction(tx: InsertProjectTransaction): Promise<ProjectTransaction>;
  deleteProjectTransaction(id: string): Promise<void>;

  getOperators(): Promise<Operator[]>;
  getOperator(id: string): Promise<Operator | undefined>;
  getOperatorByUsername(username: string): Promise<Operator | undefined>;
  createOperator(op: InsertOperator): Promise<Operator>;
  deleteOperator(id: string): Promise<void>;

  getFactorySettings(): Promise<FactorySettings>;
  updateFactoryBalance(balance: string): Promise<FactorySettings>;

  getWorkshops(): Promise<Workshop[]>;
  getWorkshop(id: string): Promise<Workshop | undefined>;
  createWorkshop(ws: InsertWorkshop): Promise<Workshop>;
  deleteWorkshop(id: string): Promise<void>;

  getWorkshopExpenseCategories(): Promise<WorkshopExpenseCategory[]>;
  createWorkshopExpenseCategory(cat: InsertWorkshopExpenseCategory): Promise<WorkshopExpenseCategory>;
  deleteWorkshopExpenseCategory(id: string): Promise<void>;

  getWorkshopExpenses(workshopId: string): Promise<WorkshopExpense[]>;
  getAllWorkshopExpenses(): Promise<WorkshopExpense[]>;
  getWorkshopExpense(id: string): Promise<WorkshopExpense | undefined>;
  createWorkshopExpense(exp: InsertWorkshopExpense): Promise<WorkshopExpense>;
  deleteWorkshopExpense(id: string): Promise<void>;

  getMachines(): Promise<Machine[]>;
  getMachinesByWorkshop(workshopId: string): Promise<Machine[]>;
  getMachine(id: string): Promise<Machine | undefined>;
  createMachine(machine: InsertMachine): Promise<Machine>;
  deleteMachine(id: string): Promise<void>;

  getWorkerCompanies(): Promise<WorkerCompany[]>;
  createWorkerCompany(data: InsertWorkerCompany): Promise<WorkerCompany>;
  deleteWorkerCompany(id: string): Promise<void>;

  getWorkers(): Promise<Worker[]>;
  getWorker(id: string): Promise<Worker | undefined>;
  createWorker(worker: InsertWorker): Promise<Worker>;
  updateWorker(id: string, data: Partial<InsertWorker>): Promise<Worker | undefined>;
  updateWorkerBalance(id: string, balance: string): Promise<Worker | undefined>;
  deleteWorker(id: string): Promise<void>;

  getWorkerTransactions(workerId: string): Promise<WorkerTransaction[]>;
  createWorkerTransaction(data: InsertWorkerTransaction): Promise<WorkerTransaction>;
  deleteWorkerTransaction(id: string): Promise<WorkerTransaction | undefined>;

  getWorkShifts(): Promise<WorkShift[]>;
  getWorkShift(id: string): Promise<WorkShift | undefined>;
  createWorkShift(shift: InsertWorkShift): Promise<WorkShift>;
  deleteWorkShift(id: string): Promise<void>;

  getAttendanceScans(workerId: string): Promise<AttendanceScan[]>;
  createAttendanceScan(scan: InsertAttendanceScan): Promise<AttendanceScan>;
  getAttendanceDays(workerId: string, startDate?: string, endDate?: string): Promise<AttendanceDay[]>;
  getAllAttendanceDays(startDate?: string, endDate?: string): Promise<AttendanceDay[]>;
  getAttendanceDay(workerId: string, date: string): Promise<AttendanceDay | undefined>;
  upsertAttendanceDay(data: InsertAttendanceDay): Promise<AttendanceDay>;
  deleteAttendanceDay(id: string): Promise<void>;

  getHolidays(): Promise<Holiday[]>;
  createHoliday(holiday: InsertHoliday): Promise<Holiday>;
  deleteHoliday(id: string): Promise<void>;

  getWorkerWarnings(workerId: string): Promise<WorkerWarning[]>;
  getAllWorkerWarnings(startDate?: string, endDate?: string): Promise<WorkerWarning[]>;
  createWorkerWarning(warning: InsertWorkerWarning): Promise<WorkerWarning>;
  deleteWorkerWarning(id: string): Promise<void>;

  getMachineDailyEntries(machineId: string): Promise<MachineDailyEntry[]>;
  getAllMachineDailyEntries(): Promise<MachineDailyEntry[]>;
  getMachineDailyEntry(id: string): Promise<MachineDailyEntry | undefined>;
  createMachineDailyEntry(entry: InsertMachineDailyEntry): Promise<MachineDailyEntry>;
  deleteMachineDailyEntry(id: string): Promise<void>;

  getSparePartItems(): Promise<SparePartItem[]>;
  getSparePartItem(id: string): Promise<SparePartItem | undefined>;
  createSparePartItem(item: InsertSparePartItem): Promise<SparePartItem>;
  updateSparePartQuantity(id: string, quantity: string): Promise<SparePartItem | undefined>;
  deleteSparePartItem(id: string): Promise<void>;

  getSparePartPurchases(sparePartId: string): Promise<SparePartPurchase[]>;
  getAllSparePartPurchases(): Promise<SparePartPurchase[]>;
  createSparePartPurchase(purchase: InsertSparePartPurchase): Promise<SparePartPurchase>;
  deleteSparePartPurchase(id: string): Promise<void>;

  getSparePartConsumptions(machineId: string): Promise<SparePartConsumption[]>;
  getAllSparePartConsumptions(): Promise<SparePartConsumption[]>;
  createSparePartConsumption(consumption: InsertSparePartConsumption): Promise<SparePartConsumption>;
  deleteSparePartConsumption(id: string): Promise<void>;

  getRawMaterials(): Promise<RawMaterial[]>;
  getRawMaterial(id: string): Promise<RawMaterial | undefined>;
  createRawMaterial(material: InsertRawMaterial): Promise<RawMaterial>;
  updateRawMaterialQuantity(id: string, quantity: string): Promise<RawMaterial | undefined>;
  deleteRawMaterial(id: string): Promise<void>;

  getRawMaterialPurchases(rawMaterialId: string): Promise<RawMaterialPurchase[]>;
  getAllRawMaterialPurchases(): Promise<RawMaterialPurchase[]>;
  createRawMaterialPurchase(purchase: InsertRawMaterialPurchase): Promise<RawMaterialPurchase>;
  deleteRawMaterialPurchase(id: string): Promise<void>;

  getAppUsers(): Promise<AppUser[]>;
  getAppUser(id: string): Promise<AppUser | undefined>;
  getAppUserByUsername(username: string): Promise<AppUser | undefined>;
  createAppUser(user: InsertAppUser): Promise<AppUser>;
  updateAppUser(id: string, data: Partial<InsertAppUser>): Promise<AppUser | undefined>;
  deleteAppUser(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getCompanies(): Promise<Company[]> {
    return db.select().from(companies);
  }

  async getCompany(id: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company;
  }

  async getCompanyByUsername(username: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.username, username));
    return company;
  }

  async createCompany(company: Omit<Company, "id">): Promise<Company> {
    const [created] = await db.insert(companies).values(company).returning();
    return created;
  }

  async updateCompany(id: string, data: Partial<Pick<Company, "name" | "username" | "password" | "phone">>): Promise<Company | undefined> {
    const [updated] = await db
      .update(companies)
      .set(data)
      .where(eq(companies.id, id))
      .returning();
    return updated;
  }

  async deleteCompany(id: string): Promise<void> {
    await db.delete(transfers).where(
      or(eq(transfers.fromCompanyId, id), eq(transfers.toCompanyId, id))
    );
    await db.delete(companies).where(eq(companies.id, id));
  }

  async updateCompanyBalance(id: string, balance: string): Promise<Company | undefined> {
    const [updated] = await db
      .update(companies)
      .set({ balance })
      .where(eq(companies.id, id))
      .returning();
    return updated;
  }

  async updateCompanyDebt(id: string, debtToParent: string): Promise<Company | undefined> {
    const [updated] = await db
      .update(companies)
      .set({ debtToParent })
      .where(eq(companies.id, id))
      .returning();
    return updated;
  }

  async getTransfers(): Promise<Transfer[]> {
    return db.select().from(transfers);
  }

  async getTransfer(id: string): Promise<Transfer | undefined> {
    const [transfer] = await db.select().from(transfers).where(eq(transfers.id, id));
    return transfer;
  }

  async createTransfer(transfer: InsertTransfer): Promise<Transfer> {
    const [created] = await db.insert(transfers).values(transfer).returning();
    return created;
  }

  async updateTransferStatus(id: string, status: string): Promise<Transfer | undefined> {
    const [updated] = await db
      .update(transfers)
      .set({ status })
      .where(eq(transfers.id, id))
      .returning();
    return updated;
  }

  async getExpenseCategories(): Promise<ExpenseCategory[]> {
    return db.select().from(expenseCategories);
  }

  async createExpenseCategory(cat: InsertExpenseCategory): Promise<ExpenseCategory> {
    const [created] = await db.insert(expenseCategories).values(cat).returning();
    return created;
  }

  async deleteExpenseCategory(id: string): Promise<void> {
    await db.delete(expenseCategories).where(eq(expenseCategories.id, id));
  }

  async getExpenses(): Promise<Expense[]> {
    return db.select().from(expenses);
  }

  async getExpense(id: string): Promise<Expense | undefined> {
    const [expense] = await db.select().from(expenses).where(eq(expenses.id, id));
    return expense;
  }

  async createExpense(expense: InsertExpense): Promise<Expense> {
    const [created] = await db.insert(expenses).values(expense).returning();
    return created;
  }

  async updateExpense(id: string, data: Partial<InsertExpense>): Promise<Expense | undefined> {
    const [updated] = await db.update(expenses).set(data).where(eq(expenses.id, id)).returning();
    return updated;
  }

  async deleteExpense(id: string): Promise<void> {
    await db.delete(expenses).where(eq(expenses.id, id));
  }

  async getMemberTypes(): Promise<MemberType[]> {
    return db.select().from(memberTypes);
  }

  async createMemberType(mt: InsertMemberType): Promise<MemberType> {
    const [created] = await db.insert(memberTypes).values(mt).returning();
    return created;
  }

  async deleteMemberType(id: string): Promise<void> {
    await db.delete(memberTypes).where(eq(memberTypes.id, id));
  }

  async getMembers(): Promise<Member[]> {
    return db.select().from(members);
  }

  async getMember(id: string): Promise<Member | undefined> {
    const [member] = await db.select().from(members).where(eq(members.id, id));
    return member;
  }

  async createMember(member: InsertMember): Promise<Member> {
    const [created] = await db.insert(members).values(member).returning();
    return created;
  }

  async updateMember(id: string, data: Partial<Pick<Member, "name" | "phone" | "typeId">>): Promise<Member | undefined> {
    const [updated] = await db
      .update(members)
      .set(data)
      .where(eq(members.id, id))
      .returning();
    return updated;
  }

  async deleteMember(id: string): Promise<void> {
    await db.delete(memberTransfers).where(eq(memberTransfers.memberId, id));
    await db.delete(members).where(eq(members.id, id));
  }

  async updateMemberBalance(id: string, balance: string): Promise<Member | undefined> {
    const [updated] = await db
      .update(members)
      .set({ balance })
      .where(eq(members.id, id))
      .returning();
    return updated;
  }

  async getMemberTransfers(): Promise<MemberTransfer[]> {
    return db.select().from(memberTransfers);
  }

  async getMemberTransfersByMember(memberId: string): Promise<MemberTransfer[]> {
    return db.select().from(memberTransfers).where(eq(memberTransfers.memberId, memberId));
  }

  async createMemberTransfer(mt: InsertMemberTransfer): Promise<MemberTransfer> {
    const [created] = await db.insert(memberTransfers).values(mt).returning();
    return created;
  }

  async deleteMemberTransfer(id: string): Promise<void> {
    await db.delete(memberTransfers).where(eq(memberTransfers.id, id));
  }

  async getMemberTransfer(id: string): Promise<MemberTransfer | undefined> {
    const [mt] = await db.select().from(memberTransfers).where(eq(memberTransfers.id, id));
    return mt;
  }

  async getExternalDebts(): Promise<ExternalDebt[]> {
    return db.select().from(externalDebts);
  }

  async getExternalDebt(id: string): Promise<ExternalDebt | undefined> {
    const [debt] = await db.select().from(externalDebts).where(eq(externalDebts.id, id));
    return debt;
  }

  async createExternalDebt(debt: InsertExternalDebt): Promise<ExternalDebt> {
    const [created] = await db.insert(externalDebts).values(debt).returning();
    return created;
  }

  async updateExternalDebt(id: string, data: Partial<Pick<ExternalDebt, "personName" | "phone" | "note" | "totalAmount" | "paidAmount">>): Promise<ExternalDebt | undefined> {
    const [updated] = await db.update(externalDebts).set(data).where(eq(externalDebts.id, id)).returning();
    return updated;
  }

  async deleteExternalDebt(id: string): Promise<void> {
    await db.delete(debtPayments).where(eq(debtPayments.debtId, id));
    await db.delete(externalDebts).where(eq(externalDebts.id, id));
  }

  async getDebtPayments(debtId: string): Promise<DebtPayment[]> {
    return db.select().from(debtPayments).where(eq(debtPayments.debtId, debtId));
  }

  async getAllDebtPayments(): Promise<DebtPayment[]> {
    return db.select().from(debtPayments);
  }

  async getDebtPayment(id: string): Promise<DebtPayment | undefined> {
    const [payment] = await db.select().from(debtPayments).where(eq(debtPayments.id, id));
    return payment;
  }

  async createDebtPayment(payment: InsertDebtPayment): Promise<DebtPayment> {
    const [created] = await db.insert(debtPayments).values(payment).returning();
    return created;
  }

  async deleteDebtPayment(id: string): Promise<void> {
    await db.delete(debtPayments).where(eq(debtPayments.id, id));
  }

  async getTrucks(): Promise<Truck[]> {
    return db.select().from(trucks);
  }

  async getTruck(id: string): Promise<Truck | undefined> {
    const [truck] = await db.select().from(trucks).where(eq(trucks.id, id));
    return truck;
  }

  async createTruck(truck: InsertTruck): Promise<Truck> {
    const [created] = await db.insert(trucks).values(truck).returning();
    return created;
  }

  async updateTruck(id: string, data: Partial<Pick<Truck, "number" | "driverName" | "fuelFormula" | "driverWage" | "driverCommissionRate">>): Promise<Truck | undefined> {
    const [updated] = await db.update(trucks).set(data).where(eq(trucks.id, id)).returning();
    return updated;
  }

  async updateTruckBalance(id: string, balance: string): Promise<Truck | undefined> {
    const [updated] = await db.update(trucks).set({ balance }).where(eq(trucks.id, id)).returning();
    return updated;
  }

  async deleteTruck(id: string): Promise<void> {
    await db.delete(truckTrips).where(eq(truckTrips.truckId, id));
    await db.delete(truckExpenses).where(eq(truckExpenses.truckId, id));
    await db.delete(trucks).where(eq(trucks.id, id));
  }

  async getTruckExpenses(truckId: string): Promise<TruckExpense[]> {
    return db.select().from(truckExpenses).where(eq(truckExpenses.truckId, truckId));
  }

  async getAllTruckExpenses(): Promise<TruckExpense[]> {
    return db.select().from(truckExpenses);
  }

  async getTruckExpense(id: string): Promise<TruckExpense | undefined> {
    const [expense] = await db.select().from(truckExpenses).where(eq(truckExpenses.id, id));
    return expense;
  }

  async createTruckExpense(expense: InsertTruckExpense): Promise<TruckExpense> {
    const [created] = await db.insert(truckExpenses).values(expense).returning();
    return created;
  }

  async deleteTruckExpense(id: string): Promise<void> {
    await db.delete(truckExpenses).where(eq(truckExpenses.id, id));
  }

  async getTruckTrips(truckId: string): Promise<TruckTrip[]> {
    return db.select().from(truckTrips).where(eq(truckTrips.truckId, truckId));
  }

  async getAllTruckTrips(): Promise<TruckTrip[]> {
    return db.select().from(truckTrips);
  }

  async getTruckTrip(id: string): Promise<TruckTrip | undefined> {
    const [trip] = await db.select().from(truckTrips).where(eq(truckTrips.id, id));
    return trip;
  }

  async getLastTruckTrip(truckId: string): Promise<TruckTrip | undefined> {
    const trips = await db.select().from(truckTrips).where(eq(truckTrips.truckId, truckId));
    if (trips.length === 0) return undefined;
    return trips.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  }

  async createTruckTrip(trip: InsertTruckTrip): Promise<TruckTrip> {
    const [created] = await db.insert(truckTrips).values(trip).returning();
    return created;
  }

  async updateTruckTrip(id: string, data: Partial<InsertTruckTrip>): Promise<TruckTrip | undefined> {
    const [updated] = await db.update(truckTrips).set(data).where(eq(truckTrips.id, id)).returning();
    return updated;
  }

  async deleteTruckTrip(id: string): Promise<void> {
    await db.delete(truckTrips).where(eq(truckTrips.id, id));
  }

  async getExternalFunds(): Promise<ExternalFund[]> {
    return db.select().from(externalFunds);
  }

  async getExternalFund(id: string): Promise<ExternalFund | undefined> {
    const [fund] = await db.select().from(externalFunds).where(eq(externalFunds.id, id));
    return fund;
  }

  async createExternalFund(fund: InsertExternalFund): Promise<ExternalFund> {
    const [created] = await db.insert(externalFunds).values(fund).returning();
    return created;
  }

  async deleteExternalFund(id: string): Promise<void> {
    await db.delete(externalFunds).where(eq(externalFunds.id, id));
  }

  async getProjects(): Promise<Project[]> {
    return db.select().from(projects);
  }

  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [created] = await db.insert(projects).values(project).returning();
    return created;
  }

  async updateProjectBalance(id: string, balance: string): Promise<Project | undefined> {
    const [updated] = await db.update(projects).set({ balance }).where(eq(projects.id, id)).returning();
    return updated;
  }

  async deleteProject(id: string): Promise<void> {
    await db.delete(projectTransactions).where(eq(projectTransactions.projectId, id));
    await db.delete(projects).where(eq(projects.id, id));
  }

  async getProjectTransactions(projectId: string): Promise<ProjectTransaction[]> {
    return db.select().from(projectTransactions).where(eq(projectTransactions.projectId, projectId));
  }

  async getAllProjectTransactions(): Promise<ProjectTransaction[]> {
    return db.select().from(projectTransactions);
  }

  async getProjectTransaction(id: string): Promise<ProjectTransaction | undefined> {
    const [tx] = await db.select().from(projectTransactions).where(eq(projectTransactions.id, id));
    return tx;
  }

  async createProjectTransaction(tx: InsertProjectTransaction): Promise<ProjectTransaction> {
    const [created] = await db.insert(projectTransactions).values(tx).returning();
    return created;
  }

  async deleteProjectTransaction(id: string): Promise<void> {
    await db.delete(projectTransactions).where(eq(projectTransactions.id, id));
  }

  async getOperators(): Promise<Operator[]> {
    return db.select().from(operators);
  }

  async getOperator(id: string): Promise<Operator | undefined> {
    const [op] = await db.select().from(operators).where(eq(operators.id, id));
    return op;
  }

  async getOperatorByUsername(username: string): Promise<Operator | undefined> {
    const [op] = await db.select().from(operators).where(eq(operators.username, username));
    return op;
  }

  async createOperator(op: InsertOperator): Promise<Operator> {
    const [created] = await db.insert(operators).values(op).returning();
    return created;
  }

  async deleteOperator(id: string): Promise<void> {
    await db.delete(operators).where(eq(operators.id, id));
  }

  async getFactorySettings(): Promise<FactorySettings> {
    const rows = await db.select().from(factorySettings);
    if (rows.length === 0) {
      const [created] = await db.insert(factorySettings).values({}).returning();
      return created;
    }
    return rows[0];
  }

  async updateFactoryBalance(balance: string): Promise<FactorySettings> {
    const settings = await this.getFactorySettings();
    const [updated] = await db.update(factorySettings).set({ balance }).where(eq(factorySettings.id, settings.id)).returning();
    return updated;
  }

  async getWorkshops(): Promise<Workshop[]> {
    return db.select().from(workshops);
  }

  async getWorkshop(id: string): Promise<Workshop | undefined> {
    const [ws] = await db.select().from(workshops).where(eq(workshops.id, id));
    return ws;
  }

  async createWorkshop(ws: InsertWorkshop): Promise<Workshop> {
    const [created] = await db.insert(workshops).values(ws).returning();
    return created;
  }

  async deleteWorkshop(id: string): Promise<void> {
    const workshopMachines = await db.select().from(machines).where(eq(machines.workshopId, id));
    for (const machine of workshopMachines) {
      await db.delete(machineDailyEntries).where(eq(machineDailyEntries.machineId, machine.id));
      await db.delete(sparePartsConsumption).where(eq(sparePartsConsumption.machineId, machine.id));
    }
    await db.delete(machines).where(eq(machines.workshopId, id));
    await db.delete(workshopExpenses).where(eq(workshopExpenses.workshopId, id));
    await db.delete(workshops).where(eq(workshops.id, id));
  }

  async getWorkshopExpenseCategories(): Promise<WorkshopExpenseCategory[]> {
    return db.select().from(workshopExpenseCategories);
  }

  async createWorkshopExpenseCategory(cat: InsertWorkshopExpenseCategory): Promise<WorkshopExpenseCategory> {
    const [created] = await db.insert(workshopExpenseCategories).values(cat).returning();
    return created;
  }

  async deleteWorkshopExpenseCategory(id: string): Promise<void> {
    await db.delete(workshopExpenseCategories).where(eq(workshopExpenseCategories.id, id));
  }

  async getWorkshopExpenses(workshopId: string): Promise<WorkshopExpense[]> {
    return db.select().from(workshopExpenses).where(eq(workshopExpenses.workshopId, workshopId));
  }

  async getAllWorkshopExpenses(): Promise<WorkshopExpense[]> {
    return db.select().from(workshopExpenses);
  }

  async getWorkshopExpense(id: string): Promise<WorkshopExpense | undefined> {
    const [expense] = await db.select().from(workshopExpenses).where(eq(workshopExpenses.id, id));
    return expense;
  }

  async createWorkshopExpense(exp: InsertWorkshopExpense): Promise<WorkshopExpense> {
    const [created] = await db.insert(workshopExpenses).values(exp).returning();
    return created;
  }

  async deleteWorkshopExpense(id: string): Promise<void> {
    await db.delete(workshopExpenses).where(eq(workshopExpenses.id, id));
  }

  async getMachines(): Promise<Machine[]> {
    return db.select().from(machines);
  }

  async getMachinesByWorkshop(workshopId: string): Promise<Machine[]> {
    return db.select().from(machines).where(eq(machines.workshopId, workshopId));
  }

  async getMachine(id: string): Promise<Machine | undefined> {
    const [machine] = await db.select().from(machines).where(eq(machines.id, id));
    return machine;
  }

  async createMachine(machine: InsertMachine): Promise<Machine> {
    const [created] = await db.insert(machines).values(machine).returning();
    return created;
  }

  async deleteMachine(id: string): Promise<void> {
    await db.delete(machineDailyEntries).where(eq(machineDailyEntries.machineId, id));
    await db.delete(sparePartsConsumption).where(eq(sparePartsConsumption.machineId, id));
    await db.delete(machines).where(eq(machines.id, id));
  }

  async getWorkers(): Promise<Worker[]> {
    return db.select().from(workers);
  }

  async getWorker(id: string): Promise<Worker | undefined> {
    const [worker] = await db.select().from(workers).where(eq(workers.id, id));
    return worker;
  }

  async createWorker(worker: InsertWorker): Promise<Worker> {
    const [created] = await db.insert(workers).values(worker).returning();
    return created;
  }

  async updateWorker(id: string, data: Partial<InsertWorker>): Promise<Worker | undefined> {
    const [updated] = await db.update(workers).set(data).where(eq(workers.id, id)).returning();
    return updated;
  }

  async updateWorkerBalance(id: string, balance: string): Promise<Worker | undefined> {
    const [updated] = await db.update(workers).set({ balance }).where(eq(workers.id, id)).returning();
    return updated;
  }

  async deleteWorker(id: string): Promise<void> {
    await db.delete(workerTransactions).where(eq(workerTransactions.workerId, id));
    await db.delete(workers).where(eq(workers.id, id));
  }

  async getWorkerCompanies(): Promise<WorkerCompany[]> {
    return db.select().from(workerCompanies);
  }

  async createWorkerCompany(data: InsertWorkerCompany): Promise<WorkerCompany> {
    const [created] = await db.insert(workerCompanies).values(data).returning();
    return created;
  }

  async deleteWorkerCompany(id: string): Promise<void> {
    await db.delete(workerCompanies).where(eq(workerCompanies.id, id));
  }

  async getWorkerTransactions(workerId: string): Promise<WorkerTransaction[]> {
    return db.select().from(workerTransactions).where(eq(workerTransactions.workerId, workerId));
  }

  async createWorkerTransaction(data: InsertWorkerTransaction): Promise<WorkerTransaction> {
    const [created] = await db.insert(workerTransactions).values(data).returning();
    return created;
  }

  async deleteWorkerTransaction(id: string): Promise<WorkerTransaction | undefined> {
    const [deleted] = await db.delete(workerTransactions).where(eq(workerTransactions.id, id)).returning();
    return deleted;
  }

  async getMachineDailyEntries(machineId: string): Promise<MachineDailyEntry[]> {
    return db.select().from(machineDailyEntries).where(eq(machineDailyEntries.machineId, machineId));
  }

  async getAllMachineDailyEntries(): Promise<MachineDailyEntry[]> {
    return db.select().from(machineDailyEntries);
  }

  async getMachineDailyEntry(id: string): Promise<MachineDailyEntry | undefined> {
    const [entry] = await db.select().from(machineDailyEntries).where(eq(machineDailyEntries.id, id));
    return entry;
  }

  async createMachineDailyEntry(entry: InsertMachineDailyEntry): Promise<MachineDailyEntry> {
    const [created] = await db.insert(machineDailyEntries).values(entry).returning();
    return created;
  }

  async deleteMachineDailyEntry(id: string): Promise<void> {
    await db.delete(machineDailyEntries).where(eq(machineDailyEntries.id, id));
  }

  async getSparePartItems(): Promise<SparePartItem[]> {
    return db.select().from(sparePartsItems);
  }

  async getSparePartItem(id: string): Promise<SparePartItem | undefined> {
    const [item] = await db.select().from(sparePartsItems).where(eq(sparePartsItems.id, id));
    return item;
  }

  async createSparePartItem(item: InsertSparePartItem): Promise<SparePartItem> {
    const [created] = await db.insert(sparePartsItems).values(item).returning();
    return created;
  }

  async updateSparePartQuantity(id: string, quantity: string): Promise<SparePartItem | undefined> {
    const [updated] = await db.update(sparePartsItems).set({ quantity }).where(eq(sparePartsItems.id, id)).returning();
    return updated;
  }

  async deleteSparePartItem(id: string): Promise<void> {
    await db.delete(sparePartsPurchases).where(eq(sparePartsPurchases.sparePartId, id));
    await db.delete(sparePartsConsumption).where(eq(sparePartsConsumption.sparePartId, id));
    await db.delete(sparePartsItems).where(eq(sparePartsItems.id, id));
  }

  async getSparePartPurchases(sparePartId: string): Promise<SparePartPurchase[]> {
    return db.select().from(sparePartsPurchases).where(eq(sparePartsPurchases.sparePartId, sparePartId));
  }

  async getAllSparePartPurchases(): Promise<SparePartPurchase[]> {
    return db.select().from(sparePartsPurchases);
  }

  async createSparePartPurchase(purchase: InsertSparePartPurchase): Promise<SparePartPurchase> {
    const [created] = await db.insert(sparePartsPurchases).values(purchase).returning();
    return created;
  }

  async deleteSparePartPurchase(id: string): Promise<void> {
    await db.delete(sparePartsPurchases).where(eq(sparePartsPurchases.id, id));
  }

  async getSparePartConsumptions(machineId: string): Promise<SparePartConsumption[]> {
    return db.select().from(sparePartsConsumption).where(eq(sparePartsConsumption.machineId, machineId));
  }

  async getAllSparePartConsumptions(): Promise<SparePartConsumption[]> {
    return db.select().from(sparePartsConsumption);
  }

  async createSparePartConsumption(consumption: InsertSparePartConsumption): Promise<SparePartConsumption> {
    const [created] = await db.insert(sparePartsConsumption).values(consumption).returning();
    return created;
  }

  async deleteSparePartConsumption(id: string): Promise<void> {
    await db.delete(sparePartsConsumption).where(eq(sparePartsConsumption.id, id));
  }

  async getRawMaterials(): Promise<RawMaterial[]> {
    return db.select().from(rawMaterials);
  }

  async getRawMaterial(id: string): Promise<RawMaterial | undefined> {
    const [material] = await db.select().from(rawMaterials).where(eq(rawMaterials.id, id));
    return material;
  }

  async createRawMaterial(material: InsertRawMaterial): Promise<RawMaterial> {
    const [created] = await db.insert(rawMaterials).values(material).returning();
    return created;
  }

  async updateRawMaterialQuantity(id: string, quantity: string): Promise<RawMaterial | undefined> {
    const [updated] = await db.update(rawMaterials).set({ quantity }).where(eq(rawMaterials.id, id)).returning();
    return updated;
  }

  async deleteRawMaterial(id: string): Promise<void> {
    await db.delete(rawMaterialPurchases).where(eq(rawMaterialPurchases.rawMaterialId, id));
    await db.delete(rawMaterials).where(eq(rawMaterials.id, id));
  }

  async getRawMaterialPurchases(rawMaterialId: string): Promise<RawMaterialPurchase[]> {
    return db.select().from(rawMaterialPurchases).where(eq(rawMaterialPurchases.rawMaterialId, rawMaterialId));
  }

  async getAllRawMaterialPurchases(): Promise<RawMaterialPurchase[]> {
    return db.select().from(rawMaterialPurchases);
  }

  async createRawMaterialPurchase(purchase: InsertRawMaterialPurchase): Promise<RawMaterialPurchase> {
    const [created] = await db.insert(rawMaterialPurchases).values(purchase).returning();
    return created;
  }

  async deleteRawMaterialPurchase(id: string): Promise<void> {
    await db.delete(rawMaterialPurchases).where(eq(rawMaterialPurchases.id, id));
  }

  async getAppUsers(): Promise<AppUser[]> {
    return db.select().from(appUsers);
  }

  async getAppUser(id: string): Promise<AppUser | undefined> {
    const [user] = await db.select().from(appUsers).where(eq(appUsers.id, id));
    return user;
  }

  async getAppUserByUsername(username: string): Promise<AppUser | undefined> {
    const [user] = await db.select().from(appUsers).where(eq(appUsers.username, username));
    return user;
  }

  async createAppUser(user: InsertAppUser): Promise<AppUser> {
    const [created] = await db.insert(appUsers).values(user).returning();
    return created;
  }

  async updateAppUser(id: string, data: Partial<InsertAppUser>): Promise<AppUser | undefined> {
    const [updated] = await db.update(appUsers).set(data).where(eq(appUsers.id, id)).returning();
    return updated;
  }

  async deleteAppUser(id: string): Promise<void> {
    await db.delete(appUsers).where(eq(appUsers.id, id));
  }

  async getWorkShifts(): Promise<WorkShift[]> {
    return db.select().from(workShifts);
  }

  async getWorkShift(id: string): Promise<WorkShift | undefined> {
    const [shift] = await db.select().from(workShifts).where(eq(workShifts.id, id));
    return shift;
  }

  async createWorkShift(shift: InsertWorkShift): Promise<WorkShift> {
    const [created] = await db.insert(workShifts).values(shift).returning();
    return created;
  }

  async deleteWorkShift(id: string): Promise<void> {
    await db.delete(workShifts).where(eq(workShifts.id, id));
  }

  async getAttendanceScans(workerId: string): Promise<AttendanceScan[]> {
    return db.select().from(attendanceScans).where(eq(attendanceScans.workerId, workerId));
  }

  async createAttendanceScan(scan: InsertAttendanceScan): Promise<AttendanceScan> {
    const [created] = await db.insert(attendanceScans).values(scan).returning();
    return created;
  }

  async getAttendanceDays(workerId: string, startDate?: string, endDate?: string): Promise<AttendanceDay[]> {
    const conditions = [eq(attendanceDays.workerId, workerId)];
    if (startDate) conditions.push(gte(attendanceDays.date, startDate));
    if (endDate) conditions.push(lte(attendanceDays.date, endDate));
    return db.select().from(attendanceDays).where(and(...conditions));
  }

  async getAllAttendanceDays(startDate?: string, endDate?: string): Promise<AttendanceDay[]> {
    const conditions = [];
    if (startDate) conditions.push(gte(attendanceDays.date, startDate));
    if (endDate) conditions.push(lte(attendanceDays.date, endDate));
    if (conditions.length > 0) {
      return db.select().from(attendanceDays).where(and(...conditions));
    }
    return db.select().from(attendanceDays);
  }

  async getAttendanceDay(workerId: string, date: string): Promise<AttendanceDay | undefined> {
    const [day] = await db.select().from(attendanceDays).where(
      and(eq(attendanceDays.workerId, workerId), eq(attendanceDays.date, date))
    );
    return day;
  }

  async upsertAttendanceDay(data: InsertAttendanceDay): Promise<AttendanceDay> {
    const existing = await this.getAttendanceDay(data.workerId, data.date);
    if (existing) {
      const [updated] = await db.update(attendanceDays).set(data).where(eq(attendanceDays.id, existing.id)).returning();
      return updated;
    }
    const [created] = await db.insert(attendanceDays).values(data).returning();
    return created;
  }

  async deleteAttendanceDay(id: string): Promise<void> {
    await db.delete(attendanceDays).where(eq(attendanceDays.id, id));
  }

  async getHolidays(): Promise<Holiday[]> {
    return db.select().from(holidays);
  }

  async createHoliday(holiday: InsertHoliday): Promise<Holiday> {
    const [created] = await db.insert(holidays).values(holiday).returning();
    return created;
  }

  async deleteHoliday(id: string): Promise<void> {
    await db.delete(holidays).where(eq(holidays.id, id));
  }

  async getWorkerWarnings(workerId: string): Promise<WorkerWarning[]> {
    return db.select().from(workerWarnings).where(eq(workerWarnings.workerId, workerId));
  }

  async getAllWorkerWarnings(startDate?: string, endDate?: string): Promise<WorkerWarning[]> {
    const conditions = [];
    if (startDate) conditions.push(gte(workerWarnings.date, startDate));
    if (endDate) conditions.push(lte(workerWarnings.date, endDate));
    if (conditions.length > 0) {
      return db.select().from(workerWarnings).where(and(...conditions));
    }
    return db.select().from(workerWarnings);
  }

  async createWorkerWarning(warning: InsertWorkerWarning): Promise<WorkerWarning> {
    const [created] = await db.insert(workerWarnings).values(warning).returning();
    return created;
  }

  async deleteWorkerWarning(id: string): Promise<void> {
    await db.delete(workerWarnings).where(eq(workerWarnings.id, id));
  }
}

export const storage = new DatabaseStorage();
