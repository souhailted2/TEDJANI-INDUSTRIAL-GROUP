import type { Express, RequestHandler } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import connectPg from "connect-pg-simple";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { insertTransferSchema, insertExpenseSchema, insertExpenseCategorySchema, insertMemberTypeSchema, insertMemberSchema, insertMemberTransferSchema, insertExternalDebtSchema, insertDebtPaymentSchema, insertTruckSchema, insertTruckExpenseSchema, insertTruckTripSchema, insertExternalFundSchema, insertProjectSchema, insertProjectTransactionSchema, insertOperatorSchema, loginSchema, registerCompanySchema, updateCompanySchema, insertWorkshopSchema, insertWorkshopExpenseCategorySchema, insertWorkshopExpenseSchema, insertMachineSchema, insertWorkerSchema, insertMachineDailyEntrySchema, insertSparePartItemSchema, insertSparePartPurchaseSchema, insertSparePartConsumptionSchema, insertRawMaterialSchema, insertRawMaterialPurchaseSchema, insertWorkerCompanySchema, insertWorkerTransactionSchema, insertWorkShiftSchema, insertAttendanceScanSchema, insertAttendanceDaySchema, insertHolidaySchema, insertWorkerWarningSchema } from "@shared/schema";
import { seedDatabase } from "./seed";

function setupSession(app: Express) {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000;
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });

  app.set("trust proxy", 1);
  app.use(
    session({
      secret: process.env.SESSION_SECRET!,
      store: sessionStore,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: false,
        maxAge: sessionTtl,
      },
    })
  );
}

const isAuthenticated: RequestHandler = (req: any, res, next) => {
  if (req.session && (req.session.companyId || req.session.operatorId || req.session.appUserId)) {
    return next();
  }
  return res.status(401).json({ message: "غير مصرح" });
};

const isCompanyAuth: RequestHandler = (req: any, res, next) => {
  if (req.session && req.session.companyId) {
    return next();
  }
  if (req.session && req.session.appUserId) {
    return next();
  }
  if (req.session && req.session.operatorId) {
    return res.status(403).json({ message: "غير مصرح - المشغّل لا يملك صلاحية" });
  }
  return res.status(401).json({ message: "غير مصرح" });
};

function requirePermission(...sections: string[]): RequestHandler {
  return (req: any, res, next) => {
    if (req.session && req.session.appUserId) {
      const perms: string[] = req.session.appUserPermissions || [];
      if (sections.some(s => perms.includes(s))) {
        return next();
      }
      return res.status(403).json({ message: "ليس لديك صلاحية للوصول لهذا القسم" });
    }
    if (req.session && req.session.companyId && req.session.isParent) {
      return next();
    }
    if (req.session && req.session.companyId) {
      return next();
    }
    return res.status(403).json({ message: "غير مصرح" });
  };
}

async function getParentCompanyForSession(req: any) {
  if (req.session.companyId) {
    return storage.getCompany(req.session.companyId);
  }
  if (req.session.appUserId) {
    const companies = await storage.getCompanies();
    return companies.find(c => c.isParent);
  }
  return undefined;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupSession(app);
  await seedDatabase();

  app.post("/api/auth/login", async (req: any, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "بيانات غير صالحة" });

    const company = await storage.getCompanyByUsername(parsed.data.username);
    if (company) {
      const valid = await bcrypt.compare(parsed.data.password, company.password);
      if (!valid) return res.status(401).json({ message: "اسم المستخدم أو كلمة المرور غير صحيحة" });

      req.session.companyId = company.id;
      req.session.isParent = company.isParent;
      req.session.operatorId = null;

      return res.json({
        id: company.id,
        name: company.name,
        username: company.username,
        isParent: company.isParent,
        role: "company",
      });
    }

    const operator = await storage.getOperatorByUsername(parsed.data.username);
    if (operator) {
      const valid = await bcrypt.compare(parsed.data.password, operator.password);
      if (!valid) return res.status(401).json({ message: "اسم المستخدم أو كلمة المرور غير صحيحة" });

      req.session.operatorId = operator.id;
      req.session.companyId = null;
      req.session.appUserId = null;
      req.session.isParent = false;

      return res.json({
        id: operator.id,
        name: operator.name,
        username: operator.username,
        isParent: false,
        role: "operator",
      });
    }

    const appUser = await storage.getAppUserByUsername(parsed.data.username);
    if (appUser) {
      if (!appUser.isActive) return res.status(403).json({ message: "الحساب معطل" });
      const valid = await bcrypt.compare(parsed.data.password, appUser.password);
      if (!valid) return res.status(401).json({ message: "اسم المستخدم أو كلمة المرور غير صحيحة" });

      const allCompanies = await storage.getCompanies();
      const parentCo = allCompanies.find(c => c.isParent);

      req.session.appUserId = appUser.id;
      req.session.appUserPermissions = appUser.permissions;
      req.session.companyId = parentCo?.id || null;
      req.session.operatorId = null;
      req.session.isParent = true;

      return res.json({
        id: appUser.id,
        name: appUser.displayName,
        username: appUser.username,
        isParent: true,
        role: "app_user",
        permissions: appUser.permissions,
      });
    }

    return res.status(401).json({ message: "اسم المستخدم أو كلمة المرور غير صحيحة" });
  });

  app.post("/api/auth/logout", (req: any, res) => {
    req.session.destroy(() => {
      res.json({ ok: true });
    });
  });

  app.get("/api/auth/me", isAuthenticated, async (req: any, res) => {
    if (req.session.operatorId) {
      const operator = await storage.getOperator(req.session.operatorId);
      if (!operator) return res.status(401).json({ message: "غير مصرح" });
      const { password, ...safe } = operator;
      return res.json({ ...safe, role: "operator", isParent: false });
    }
    if (req.session.appUserId) {
      const appUser = await storage.getAppUser(req.session.appUserId);
      if (!appUser || !appUser.isActive) return res.status(401).json({ message: "غير مصرح" });
      const { password, ...safe } = appUser;
      return res.json({ ...safe, name: appUser.displayName, role: "app_user", isParent: true, permissions: appUser.permissions });
    }
    const company = await storage.getCompany(req.session.companyId);
    if (!company) return res.status(401).json({ message: "غير مصرح" });
    const { password, ...safe } = company;
    res.json({ ...safe, role: "company" });
  });

  app.get("/api/companies", isCompanyAuth, requirePermission("companies"), async (req: any, res) => {
    const companies = await storage.getCompanies();
    if (req.session.isParent) {
      const safe = companies.map(({ password, ...c }) => c);
      return res.json(safe);
    }
    const safe = companies.map(({ password, balance, debtToParent, whatsappApiKey, ...c }) => ({
      ...c,
      balance: c.id === req.session.companyId ? balance : undefined,
      debtToParent: c.id === req.session.companyId ? debtToParent : undefined,
    }));
    res.json(safe);
  });

  app.get("/api/companies/:id", isCompanyAuth, requirePermission("companies"), async (req: any, res) => {
    const company = await storage.getCompany(req.params.id as string);
    if (!company) return res.status(404).json({ message: "الشركة غير موجودة" });
    if (!req.session.isParent && req.session.companyId !== company.id) {
      return res.status(403).json({ message: "غير مصرح" });
    }
    const { password, whatsappApiKey, ...safe } = company;
    if (req.session.isParent) {
      return res.json({ ...safe, whatsappApiKey });
    }
    res.json(safe);
  });

  app.post("/api/companies", isCompanyAuth, requirePermission("companies"), async (req: any, res) => {
    if (!req.session.isParent) {
      return res.status(403).json({ message: "فقط الشركة الأم يمكنها إضافة شركات" });
    }

    const parsed = registerCompanySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "بيانات غير صالحة" });

    const existing = await storage.getCompanyByUsername(parsed.data.username);
    if (existing) return res.status(400).json({ message: "اسم المستخدم مستخدم بالفعل" });

    const hashedPassword = await bcrypt.hash(parsed.data.password, 10);
    const company = await storage.createCompany({
      name: parsed.data.name,
      username: parsed.data.username,
      password: hashedPassword,
      phone: parsed.data.phone || null,
      whatsappApiKey: parsed.data.whatsappApiKey || null,
      balance: parsed.data.balance || "0",
      debtToParent: "0",
      isParent: false,
    });

    const { password, ...safe } = company;
    res.status(201).json(safe);
  });

  app.patch("/api/companies/:id", isCompanyAuth, requirePermission("companies"), async (req: any, res) => {
    if (!req.session.isParent) {
      return res.status(403).json({ message: "فقط الشركة الأم يمكنها تعديل الشركات" });
    }

    const company = await storage.getCompany(req.params.id as string);
    if (!company) return res.status(404).json({ message: "الشركة غير موجودة" });
    if (company.isParent && req.session.companyId !== company.id) return res.status(400).json({ message: "لا يمكن تعديل الشركة الأم" });

    const parsed = updateCompanySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "بيانات غير صالحة" });

    const updateData: any = {};
    if (parsed.data.name) updateData.name = parsed.data.name;
    if (parsed.data.phone !== undefined) updateData.phone = parsed.data.phone || null;
    if (parsed.data.whatsappApiKey !== undefined) updateData.whatsappApiKey = parsed.data.whatsappApiKey || null;
    if (parsed.data.username) {
      const existing = await storage.getCompanyByUsername(parsed.data.username);
      if (existing && existing.id !== company.id) {
        return res.status(400).json({ message: "اسم المستخدم مستخدم بالفعل" });
      }
      updateData.username = parsed.data.username;
    }
    if (parsed.data.password) {
      updateData.password = await bcrypt.hash(parsed.data.password, 10);
    }

    const updated = await storage.updateCompany(company.id, updateData);
    if (!updated) return res.status(500).json({ message: "خطأ في التحديث" });
    const { password, ...safe } = updated;
    res.json(safe);
  });

  app.delete("/api/companies/:id", isCompanyAuth, requirePermission("companies"), async (req: any, res) => {
    if (!req.session.isParent) {
      return res.status(403).json({ message: "فقط الشركة الأم يمكنها حذف الشركات" });
    }

    const company = await storage.getCompany(req.params.id as string);
    if (!company) return res.status(404).json({ message: "الشركة غير موجودة" });
    if (company.isParent) return res.status(400).json({ message: "لا يمكن حذف الشركة الأم" });

    await storage.deleteCompany(company.id);
    res.json({ ok: true });
  });

  app.get("/api/transfers", isCompanyAuth, requirePermission("transfers"), async (req: any, res) => {
    const allTransfers = await storage.getTransfers();
    if (req.session.isParent) {
      return res.json(allTransfers);
    }
    const companyId = req.session.companyId;
    const filtered = allTransfers.filter(
      t => t.fromCompanyId === companyId || t.toCompanyId === companyId
    );
    res.json(filtered);
  });

  app.post("/api/transfers", isCompanyAuth, requirePermission("transfers"), async (req: any, res) => {
    const parsed = insertTransferSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "بيانات غير صالحة" });

    if (!req.session.isParent) {
      if (parsed.data.fromCompanyId !== req.session.companyId) {
        return res.status(403).json({ message: "يمكنك فقط إرسال تحويلات من حسابك" });
      }
    }

    const fromCompany = await storage.getCompany(parsed.data.fromCompanyId);
    const toCompany = await storage.getCompany(parsed.data.toCompanyId);

    if (!fromCompany || !toCompany) {
      return res.status(400).json({ message: "الشركة غير موجودة" });
    }

    if (fromCompany.id === toCompany.id) {
      return res.status(400).json({ message: "لا يمكن التحويل لنفس الشركة" });
    }

    const transfer = await storage.createTransfer(parsed.data);
    res.status(201).json(transfer);
  });

  app.patch("/api/transfers/:id/approve", isCompanyAuth, requirePermission("transfers"), async (req: any, res) => {
    const transfer = await storage.getTransfer(req.params.id as string);
    if (!transfer) return res.status(404).json({ message: "التحويل غير موجود" });
    if (transfer.status !== "pending") return res.status(400).json({ message: "لا يمكن الموافقة على هذا التحويل" });

    if (!req.session.isParent && req.session.companyId !== transfer.toCompanyId) {
      return res.status(403).json({ message: "فقط الشركة المستقبلة يمكنها الموافقة على التحويل" });
    }

    const fromCompany = await storage.getCompany(transfer.fromCompanyId);
    const toCompany = await storage.getCompany(transfer.toCompanyId);

    if (!fromCompany || !toCompany) {
      return res.status(400).json({ message: "خطأ في بيانات الشركات" });
    }

    const amount = Number(transfer.amount);
    const fromBalance = Number(fromCompany.balance);

    await storage.updateCompanyBalance(fromCompany.id, String(fromBalance - amount));

    const fromDebt = Number(fromCompany.debtToParent);
    await storage.updateCompanyDebt(fromCompany.id, String(fromDebt - amount));

    const toDebt = Number(toCompany.debtToParent);
    await storage.updateCompanyDebt(toCompany.id, String(toDebt + amount));

    const toBalance = Number(toCompany.balance);
    await storage.updateCompanyBalance(toCompany.id, String(toBalance + amount));

    const updated = await storage.updateTransferStatus(transfer.id, "approved");
    res.json(updated);
  });

  app.patch("/api/transfers/:id/reject", isCompanyAuth, requirePermission("transfers"), async (req: any, res) => {
    const transfer = await storage.getTransfer(req.params.id as string);
    if (!transfer) return res.status(404).json({ message: "التحويل غير موجود" });
    if (transfer.status !== "pending") return res.status(400).json({ message: "لا يمكن رفض هذا التحويل" });

    if (!req.session.isParent && req.session.companyId !== transfer.toCompanyId) {
      return res.status(403).json({ message: "فقط الشركة المستقبلة يمكنها رفض التحويل" });
    }

    const fromCompany = await storage.getCompany(transfer.fromCompanyId);
    const toCompany = await storage.getCompany(transfer.toCompanyId);

    const updated = await storage.updateTransferStatus(transfer.id, "rejected");
    res.json(updated);
  });

  app.get("/api/expenses", isCompanyAuth, requirePermission("expenses"), async (req: any, res) => {
    if (!req.session.isParent) {
      return res.status(403).json({ message: "فقط الشركة الأم يمكنها عرض المصاريف" });
    }
    const allExpenses = await storage.getExpenses();
    res.json(allExpenses);
  });

  app.post("/api/expenses", isCompanyAuth, requirePermission("expenses"), async (req: any, res) => {
    if (!req.session.isParent) {
      return res.status(403).json({ message: "فقط الشركة الأم يمكنها إضافة مصاريف" });
    }
    const parsed = insertExpenseSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "بيانات غير صالحة" });

    const parentCompany = await storage.getCompany(req.session.companyId);
    if (!parentCompany) return res.status(500).json({ message: "خطأ في بيانات الشركة الأم" });

    const amount = Number(parsed.data.amount);
    const parentBalance = Number(parentCompany.balance);

    await storage.updateCompanyBalance(parentCompany.id, String(parentBalance - amount));

    const expense = await storage.createExpense(parsed.data);
    res.status(201).json(expense);
  });

  app.patch("/api/expenses/:id", isCompanyAuth, requirePermission("expenses"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const expense = await storage.getExpense(req.params.id as string);
    if (!expense) return res.status(404).json({ message: "المصروف غير موجود" });

    const { amount, category, description, date } = req.body;
    if (amount !== undefined && (isNaN(Number(amount)) || amount === "")) {
      return res.status(400).json({ message: "المبلغ غير صالح" });
    }
    if (category !== undefined && typeof category !== "string") {
      return res.status(400).json({ message: "بيانات غير صالحة" });
    }

    const parentCompany = await storage.getCompany(req.session.companyId);
    if (!parentCompany) return res.status(500).json({ message: "خطأ في بيانات الشركة الأم" });

    const oldAmount = Number(expense.amount);
    const newAmount = amount !== undefined ? Number(amount) : oldAmount;
    const diff = newAmount - oldAmount;

    if (diff !== 0) {
      const parentBalance = Number(parentCompany.balance);
      await storage.updateCompanyBalance(parentCompany.id, String(parentBalance - diff));
    }

    const updateData: any = {};
    if (amount !== undefined) updateData.amount = String(amount);
    if (category !== undefined) updateData.category = category;
    if (description !== undefined) updateData.description = description;
    if (date !== undefined) updateData.date = date;

    const updated = await storage.updateExpense(expense.id, updateData);
    res.json(updated);
  });

  app.delete("/api/expenses/:id", isCompanyAuth, requirePermission("expenses"), async (req: any, res) => {
    if (!req.session.isParent) {
      return res.status(403).json({ message: "فقط الشركة الأم يمكنها حذف المصاريف" });
    }

    const expense = await storage.getExpense(req.params.id as string);
    if (!expense) return res.status(404).json({ message: "المصروف غير موجود" });

    const parentCompany = await storage.getCompany(req.session.companyId);
    if (!parentCompany) return res.status(500).json({ message: "خطأ في بيانات الشركة الأم" });

    const amount = Number(expense.amount);
    const parentBalance = Number(parentCompany.balance);
    await storage.updateCompanyBalance(parentCompany.id, String(parentBalance + amount));

    await storage.deleteExpense(expense.id);
    res.json({ ok: true });
  });

  // Expense Categories
  app.get("/api/expense-categories", isCompanyAuth, requirePermission("expenses"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const categories = await storage.getExpenseCategories();
    res.json(categories);
  });

  app.post("/api/expense-categories", isCompanyAuth, requirePermission("expenses"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const parsed = insertExpenseCategorySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "بيانات غير صالحة" });
    const cat = await storage.createExpenseCategory(parsed.data);
    res.status(201).json(cat);
  });

  app.delete("/api/expense-categories/:id", isCompanyAuth, requirePermission("expenses"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    await storage.deleteExpenseCategory(req.params.id);
    res.json({ ok: true });
  });

  // Member Types
  app.get("/api/member-types", isCompanyAuth, requirePermission("members"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const types = await storage.getMemberTypes();
    res.json(types);
  });

  app.post("/api/member-types", isCompanyAuth, requirePermission("members"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const parsed = insertMemberTypeSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "بيانات غير صالحة" });
    const mt = await storage.createMemberType(parsed.data);
    res.status(201).json(mt);
  });

  app.delete("/api/member-types/:id", isCompanyAuth, requirePermission("members"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    await storage.deleteMemberType(req.params.id);
    res.json({ ok: true });
  });

  // Members
  app.get("/api/members", isCompanyAuth, requirePermission("members"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const allMembers = await storage.getMembers();
    res.json(allMembers);
  });

  app.post("/api/members", isCompanyAuth, requirePermission("members"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const parsed = insertMemberSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "بيانات غير صالحة" });
    const member = await storage.createMember(parsed.data);
    res.status(201).json(member);
  });

  app.patch("/api/members/:id", isCompanyAuth, requirePermission("members"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const member = await storage.getMember(req.params.id);
    if (!member) return res.status(404).json({ message: "العضو غير موجود" });
    const updateData: any = {};
    if (req.body.name) updateData.name = req.body.name;
    if (req.body.phone !== undefined) updateData.phone = req.body.phone || null;
    if (req.body.typeId) updateData.typeId = req.body.typeId;
    const updated = await storage.updateMember(member.id, updateData);
    res.json(updated);
  });

  app.delete("/api/members/:id", isCompanyAuth, requirePermission("members"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const member = await storage.getMember(req.params.id);
    if (!member) return res.status(404).json({ message: "العضو غير موجود" });
    await storage.deleteMember(member.id);
    res.json({ ok: true });
  });

  // Member Transfers
  app.get("/api/member-transfers", isCompanyAuth, requirePermission("members"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const all = await storage.getMemberTransfers();
    res.json(all);
  });

  app.post("/api/member-transfers", isCompanyAuth, requirePermission("members"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const parsed = insertMemberTransferSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "بيانات غير صالحة" });

    const member = await storage.getMember(parsed.data.memberId);
    if (!member) return res.status(404).json({ message: "العضو غير موجود" });

    const parentCompany = await storage.getCompany(req.session.companyId);
    if (!parentCompany) return res.status(500).json({ message: "خطأ في بيانات الشركة الأم" });

    const amount = Number(parsed.data.amount);
    const parentBalance = Number(parentCompany.balance);

    await storage.updateCompanyBalance(parentCompany.id, String(parentBalance - amount));

    const memberBalance = Number(member.balance);
    await storage.updateMemberBalance(member.id, String(memberBalance + amount));

    const mt = await storage.createMemberTransfer(parsed.data);
    res.status(201).json(mt);
  });

  app.delete("/api/member-transfers/:id", isCompanyAuth, requirePermission("members"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const mt = await storage.getMemberTransfer(req.params.id);
    if (!mt) return res.status(404).json({ message: "التحويل غير موجود" });

    const member = await storage.getMember(mt.memberId);
    const parentCompany = await storage.getCompany(req.session.companyId);

    if (member && parentCompany) {
      const amount = Number(mt.amount);
      const parentBalance = Number(parentCompany.balance);
      await storage.updateCompanyBalance(parentCompany.id, String(parentBalance + amount));

      const memberBalance = Number(member.balance);
      await storage.updateMemberBalance(member.id, String(memberBalance - amount));
    }

    await storage.deleteMemberTransfer(mt.id);
    res.json({ ok: true });
  });

  // External Debts
  app.get("/api/external-debts", isCompanyAuth, requirePermission("external_debts"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const debts = await storage.getExternalDebts();
    res.json(debts);
  });

  app.get("/api/external-debts/:id", isCompanyAuth, requirePermission("external_debts"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const debt = await storage.getExternalDebt(req.params.id);
    if (!debt) return res.status(404).json({ message: "الدين غير موجود" });
    res.json(debt);
  });

  app.post("/api/external-debts", isCompanyAuth, requirePermission("external_debts"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const parsed = insertExternalDebtSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "بيانات غير صالحة" });

    const debt = await storage.createExternalDebt(parsed.data);
    res.status(201).json(debt);
  });

  app.patch("/api/external-debts/:id", isCompanyAuth, requirePermission("external_debts"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const debt = await storage.getExternalDebt(req.params.id);
    if (!debt) return res.status(404).json({ message: "الدين غير موجود" });
    const updateData: any = {};
    if (req.body.personName) updateData.personName = req.body.personName;
    if (req.body.phone !== undefined) updateData.phone = req.body.phone || null;
    if (req.body.note !== undefined) updateData.note = req.body.note || null;
    if (req.body.totalAmount) updateData.totalAmount = req.body.totalAmount;
    const updated = await storage.updateExternalDebt(debt.id, updateData);
    res.json(updated);
  });

  app.delete("/api/external-debts/:id", isCompanyAuth, requirePermission("external_debts"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const debt = await storage.getExternalDebt(req.params.id);
    if (!debt) return res.status(404).json({ message: "الدين غير موجود" });
    await storage.deleteExternalDebt(debt.id);
    res.json({ ok: true });
  });

  // All Debt Payments (for account statement)
  app.get("/api/debt-payments", isCompanyAuth, requirePermission("external_debts"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const payments = await storage.getAllDebtPayments();
    res.json(payments);
  });

  // Debt Payments
  app.get("/api/external-debts/:debtId/payments", isCompanyAuth, requirePermission("external_debts"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const payments = await storage.getDebtPayments(req.params.debtId);
    res.json(payments);
  });

  app.post("/api/external-debts/:debtId/payments", isCompanyAuth, requirePermission("external_debts"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const debt = await storage.getExternalDebt(req.params.debtId);
    if (!debt) return res.status(404).json({ message: "الدين غير موجود" });

    const parsed = insertDebtPaymentSchema.safeParse({ ...req.body, debtId: req.params.debtId });
    if (!parsed.success) return res.status(400).json({ message: "بيانات غير صالحة" });

    const amount = Number(parsed.data.amount);
    const currentPaid = Number(debt.paidAmount);
    const total = Number(debt.totalAmount);
    const remaining = total - currentPaid;

    if (amount > remaining) {
      return res.status(400).json({ message: `المبلغ المتبقي هو ${remaining} د.ج فقط` });
    }

    const payment = await storage.createDebtPayment(parsed.data);
    await storage.updateExternalDebt(debt.id, { paidAmount: String(currentPaid + amount) });
    res.status(201).json(payment);
  });

  app.delete("/api/external-debts/:debtId/payments/:id", isCompanyAuth, requirePermission("external_debts"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const payment = await storage.getDebtPayment(req.params.id);
    if (!payment) return res.status(404).json({ message: "الدفعة غير موجودة" });

    const debt = await storage.getExternalDebt(payment.debtId);
    if (debt) {
      const currentPaid = Number(debt.paidAmount);
      const amount = Number(payment.amount);
      const newPaid = Math.max(0, currentPaid - amount);
      await storage.updateExternalDebt(debt.id, { paidAmount: String(newPaid) });
    }

    await storage.deleteDebtPayment(payment.id);
    res.json({ ok: true });
  });

  // Trucks
  app.get("/api/trucks", isAuthenticated, requirePermission("trucks"), async (req: any, res) => {
    if (!req.session.isParent && !req.session.operatorId) return res.status(403).json({ message: "غير مصرح" });
    const allTrucks = await storage.getTrucks();
    res.json(allTrucks);
  });

  app.post("/api/trucks", isCompanyAuth, requirePermission("trucks"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const parsed = insertTruckSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "بيانات غير صالحة" });
    const truck = await storage.createTruck(parsed.data);
    res.status(201).json(truck);
  });

  app.patch("/api/trucks/:id", isCompanyAuth, requirePermission("trucks"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const truck = await storage.getTruck(req.params.id);
    if (!truck) return res.status(404).json({ message: "الشاحنة غير موجودة" });
    const updateData: any = {};
    if (req.body.number) updateData.number = req.body.number;
    if (req.body.driverName) updateData.driverName = req.body.driverName;
    if (req.body.fuelFormula !== undefined) updateData.fuelFormula = req.body.fuelFormula;
    if (req.body.driverWage !== undefined) updateData.driverWage = req.body.driverWage;
    if (req.body.driverCommissionRate !== undefined) updateData.driverCommissionRate = req.body.driverCommissionRate;
    const updated = await storage.updateTruck(truck.id, updateData);
    res.json(updated);
  });

  app.delete("/api/trucks/:id", isCompanyAuth, requirePermission("trucks"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const truck = await storage.getTruck(req.params.id);
    if (!truck) return res.status(404).json({ message: "الشاحنة غير موجودة" });
    await storage.deleteTruck(truck.id);
    res.json({ ok: true });
  });

  // Truck Expenses
  app.get("/api/trucks/:truckId/expenses", isCompanyAuth, requirePermission("trucks"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const expenses = await storage.getTruckExpenses(req.params.truckId);
    res.json(expenses);
  });

  app.get("/api/truck-expenses", isCompanyAuth, requirePermission("trucks"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const all = await storage.getAllTruckExpenses();
    res.json(all);
  });

  app.post("/api/trucks/:truckId/expenses", isCompanyAuth, requirePermission("trucks"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const truck = await storage.getTruck(req.params.truckId);
    if (!truck) return res.status(404).json({ message: "الشاحنة غير موجودة" });

    const parsed = insertTruckExpenseSchema.safeParse({ ...req.body, truckId: req.params.truckId });
    if (!parsed.success) return res.status(400).json({ message: "بيانات غير صالحة" });

    const amount = Number(parsed.data.amount);
    const truckBalance = Number(truck.balance);

    const parentCompany = await storage.getCompany(req.session.companyId);
    if (!parentCompany) return res.status(500).json({ message: "خطأ" });
    const parentBalance = Number(parentCompany.balance);

    if (parsed.data.type === "income") {
      await storage.updateTruckBalance(truck.id, String(truckBalance + amount));
      await storage.updateCompanyBalance(parentCompany.id, String(parentBalance + amount));
    } else {
      await storage.updateTruckBalance(truck.id, String(truckBalance - amount));
      await storage.updateCompanyBalance(parentCompany.id, String(parentBalance - amount));
    }

    const expense = await storage.createTruckExpense(parsed.data);
    res.status(201).json(expense);
  });

  app.delete("/api/trucks/:truckId/expenses/:id", isCompanyAuth, requirePermission("trucks"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const expense = await storage.getTruckExpense(req.params.id);
    if (!expense) return res.status(404).json({ message: "العملية غير موجودة" });

    const truck = await storage.getTruck(expense.truckId);
    const parentCompany = await storage.getCompany(req.session.companyId);

    if (truck && parentCompany) {
      const amount = Number(expense.amount);
      const truckBalance = Number(truck.balance);
      const parentBalance = Number(parentCompany.balance);

      if (expense.type === "income") {
        await storage.updateTruckBalance(truck.id, String(truckBalance - amount));
        await storage.updateCompanyBalance(parentCompany.id, String(parentBalance - amount));
      } else {
        await storage.updateTruckBalance(truck.id, String(truckBalance + amount));
        await storage.updateCompanyBalance(parentCompany.id, String(parentBalance + amount));
      }
    }

    await storage.deleteTruckExpense(expense.id);
    res.json({ ok: true });
  });

  // Truck Trips
  app.get("/api/trucks/:id/trips", isAuthenticated, requirePermission("trucks"), async (req: any, res) => {
    if (!req.session.isParent && !req.session.operatorId) return res.status(403).json({ message: "غير مصرح" });
    const trips = await storage.getTruckTrips(req.params.id);
    res.json(trips);
  });

  app.get("/api/truck-trips", isAuthenticated, requirePermission("trucks"), async (req: any, res) => {
    if (!req.session.isParent && !req.session.operatorId) return res.status(403).json({ message: "غير مصرح" });
    const all = await storage.getAllTruckTrips();
    res.json(all);
  });

  app.get("/api/trucks/:id/last-trip", isAuthenticated, requirePermission("trucks"), async (req: any, res) => {
    if (!req.session.isParent && !req.session.operatorId) return res.status(403).json({ message: "غير مصرح" });
    const lastTrip = await storage.getLastTruckTrip(req.params.id);
    res.json(lastTrip || null);
  });

  app.post("/api/trucks/:id/trips", isAuthenticated, requirePermission("trucks"), async (req: any, res) => {
    if (!req.session.isParent && !req.session.operatorId) return res.status(403).json({ message: "غير مصرح" });
    const truck = await storage.getTruck(req.params.id);
    if (!truck) return res.status(404).json({ message: "الشاحنة غير موجودة" });

    const parsed = insertTruckTripSchema.safeParse({ ...req.body, truckId: req.params.id });
    if (!parsed.success) return res.status(400).json({ message: "بيانات غير صالحة" });

    const trip = await storage.createTruckTrip(parsed.data);

    const allCompanies = await storage.getCompanies();
    const parentCompany = allCompanies.find(c => c.isParent);
    if (parentCompany) {
      const netResult = Number(trip.netResult);
      const parentBalance = Number(parentCompany.balance);
      const truckBalance = Number(truck.balance);
      await storage.updateCompanyBalance(parentCompany.id, String(parentBalance + netResult));
      await storage.updateTruckBalance(truck.id, String(truckBalance + netResult));
    }

    res.status(201).json(trip);
  });

  app.patch("/api/trucks/:truckId/trips/:id", isAuthenticated, requirePermission("trucks"), async (req: any, res) => {
    if (!req.session.isParent && !req.session.operatorId) return res.status(403).json({ message: "غير مصرح" });
    const oldTrip = await storage.getTruckTrip(req.params.id);
    if (!oldTrip) return res.status(404).json({ message: "الرحلة غير موجودة" });

    const truck = await storage.getTruck(oldTrip.truckId);
    if (!truck) return res.status(404).json({ message: "الشاحنة غير موجودة" });

    const updateData: any = {};
    const fields = ["departureLocation", "arrivalLocation", "fuelExpense", "foodExpense", "sparePartsExpense", "oldOdometer", "newOdometer", "tripFare", "expectedFuel", "driverWageEntry", "commissionEntry", "netResult"];
    for (const f of fields) {
      if (req.body[f] !== undefined) updateData[f] = req.body[f];
    }

    const updated = await storage.updateTruckTrip(oldTrip.id, updateData);
    if (!updated) return res.status(500).json({ message: "خطأ في التحديث" });

    const allCompanies = await storage.getCompanies();
    const parentCompany = allCompanies.find(c => c.isParent);
    if (parentCompany) {
      const oldNet = Number(oldTrip.netResult);
      const newNet = Number(updated.netResult);
      const diff = newNet - oldNet;
      if (diff !== 0) {
        const parentBalance = Number(parentCompany.balance);
        const truckBalance = Number(truck.balance);
        await storage.updateCompanyBalance(parentCompany.id, String(parentBalance + diff));
        await storage.updateTruckBalance(truck.id, String(truckBalance + diff));
      }
    }

    res.json(updated);
  });

  app.delete("/api/trucks/:truckId/trips/:id", isAuthenticated, requirePermission("trucks"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const trip = await storage.getTruckTrip(req.params.id);
    if (!trip) return res.status(404).json({ message: "الرحلة غير موجودة" });

    const truck = await storage.getTruck(trip.truckId);
    const parentCompany = await storage.getCompany(req.session.companyId);

    if (truck && parentCompany) {
      const netResult = Number(trip.netResult);
      const parentBalance = Number(parentCompany.balance);
      const truckBalance = Number(truck.balance);
      await storage.updateCompanyBalance(parentCompany.id, String(parentBalance - netResult));
      await storage.updateTruckBalance(truck.id, String(truckBalance - netResult));
    }

    await storage.deleteTruckTrip(trip.id);
    res.json({ ok: true });
  });

  // External Funds
  app.get("/api/external-funds", isCompanyAuth, requirePermission("external_funds"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const funds = await storage.getExternalFunds();
    res.json(funds);
  });

  app.post("/api/external-funds", isCompanyAuth, requirePermission("external_funds"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const parsed = insertExternalFundSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "بيانات غير صالحة" });

    const fund = await storage.createExternalFund(parsed.data);

    const parentCompany = await storage.getCompany(req.session.companyId);
    if (parentCompany) {
      const parentBalance = Number(parentCompany.balance);
      const amount = Number(fund.amount);
      if (fund.type === "incoming") {
        await storage.updateCompanyBalance(parentCompany.id, String(parentBalance + amount));
      } else {
        await storage.updateCompanyBalance(parentCompany.id, String(parentBalance - amount));
      }
    }

    res.status(201).json(fund);
  });

  app.delete("/api/external-funds/:id", isCompanyAuth, requirePermission("external_funds"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const fund = await storage.getExternalFund(req.params.id);
    if (!fund) return res.status(404).json({ message: "غير موجود" });

    const parentCompany = await storage.getCompany(req.session.companyId);
    if (parentCompany) {
      const parentBalance = Number(parentCompany.balance);
      const amount = Number(fund.amount);
      if (fund.type === "incoming") {
        await storage.updateCompanyBalance(parentCompany.id, String(parentBalance - amount));
      } else {
        await storage.updateCompanyBalance(parentCompany.id, String(parentBalance + amount));
      }
    }

    await storage.deleteExternalFund(fund.id);
    res.json({ ok: true });
  });

  // Projects
  app.get("/api/projects", isCompanyAuth, requirePermission("projects"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const allProjects = await storage.getProjects();
    res.json(allProjects);
  });

  app.post("/api/projects", isCompanyAuth, requirePermission("projects"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const parsed = insertProjectSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "بيانات غير صالحة" });
    const project = await storage.createProject(parsed.data);
    res.status(201).json(project);
  });

  app.delete("/api/projects/:id", isCompanyAuth, requirePermission("projects"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const project = await storage.getProject(req.params.id);
    if (!project) return res.status(404).json({ message: "المشروع غير موجود" });

    const txs = await storage.getProjectTransactions(project.id);
    let totalEffect = 0;
    for (const tx of txs) {
      const amt = Number(tx.amount);
      totalEffect += tx.type === "income" ? amt : -amt;
    }

    const parentCompany = await storage.getCompany(req.session.companyId);
    if (parentCompany) {
      const parentBalance = Number(parentCompany.balance);
      await storage.updateCompanyBalance(parentCompany.id, String(parentBalance - totalEffect));
    }

    await storage.deleteProject(project.id);
    res.json({ ok: true });
  });

  // Project Transactions
  app.get("/api/projects/:projectId/transactions", isCompanyAuth, requirePermission("projects"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const txs = await storage.getProjectTransactions(req.params.projectId);
    res.json(txs);
  });

  app.get("/api/project-transactions", isCompanyAuth, requirePermission("projects"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const all = await storage.getAllProjectTransactions();
    res.json(all);
  });

  app.post("/api/projects/:projectId/transactions", isCompanyAuth, requirePermission("projects"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const project = await storage.getProject(req.params.projectId);
    if (!project) return res.status(404).json({ message: "المشروع غير موجود" });

    const parsed = insertProjectTransactionSchema.safeParse({ ...req.body, projectId: req.params.projectId });
    if (!parsed.success) return res.status(400).json({ message: "بيانات غير صالحة" });

    const amount = Number(parsed.data.amount);
    const projectBalance = Number(project.balance);

    const parentCompany = await storage.getCompany(req.session.companyId);
    if (!parentCompany) return res.status(500).json({ message: "خطأ" });
    const parentBalance = Number(parentCompany.balance);

    if (parsed.data.type === "income") {
      await storage.updateProjectBalance(project.id, String(projectBalance + amount));
      await storage.updateCompanyBalance(parentCompany.id, String(parentBalance + amount));
    } else {
      await storage.updateProjectBalance(project.id, String(projectBalance - amount));
      await storage.updateCompanyBalance(parentCompany.id, String(parentBalance - amount));
    }

    const tx = await storage.createProjectTransaction(parsed.data);
    res.status(201).json(tx);
  });

  app.delete("/api/projects/:projectId/transactions/:id", isCompanyAuth, requirePermission("projects"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const tx = await storage.getProjectTransaction(req.params.id);
    if (!tx) return res.status(404).json({ message: "العملية غير موجودة" });

    const project = await storage.getProject(tx.projectId);
    const parentCompany = await storage.getCompany(req.session.companyId);

    if (project && parentCompany) {
      const amount = Number(tx.amount);
      const projectBalance = Number(project.balance);
      const parentBalance = Number(parentCompany.balance);

      if (tx.type === "income") {
        await storage.updateProjectBalance(project.id, String(projectBalance - amount));
        await storage.updateCompanyBalance(parentCompany.id, String(parentBalance - amount));
      } else {
        await storage.updateProjectBalance(project.id, String(projectBalance + amount));
        await storage.updateCompanyBalance(parentCompany.id, String(parentBalance + amount));
      }
    }

    await storage.deleteProjectTransaction(tx.id);
    res.json({ ok: true });
  });

  // Operators
  app.get("/api/operators", isCompanyAuth, async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const ops = await storage.getOperators();
    const safe = ops.map(({ password, ...o }) => o);
    res.json(safe);
  });

  app.post("/api/operators", isCompanyAuth, async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const parsed = insertOperatorSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "بيانات غير صالحة" });

    const existingCompany = await storage.getCompanyByUsername(parsed.data.username);
    const existingOp = await storage.getOperatorByUsername(parsed.data.username);
    if (existingCompany || existingOp) return res.status(400).json({ message: "اسم المستخدم مستخدم بالفعل" });

    const hashed = await bcrypt.hash(parsed.data.password, 10);
    const op = await storage.createOperator({ ...parsed.data, password: hashed });
    const { password, ...safe } = op;
    res.status(201).json(safe);
  });

  app.delete("/api/operators/:id", isCompanyAuth, async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    await storage.deleteOperator(req.params.id);
    res.json({ ok: true });
  });

  // App Users Management
  app.get("/api/app-users", isCompanyAuth, async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const users = await storage.getAppUsers();
    const safeUsers = users.map(({ password, ...rest }) => rest);
    res.json(safeUsers);
  });

  app.post("/api/app-users", isCompanyAuth, async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const { username, password, displayName, permissions, isActive } = req.body;
    if (!username || !password || !displayName) return res.status(400).json({ message: "بيانات غير صالحة" });
    const existing = await storage.getAppUserByUsername(username);
    if (existing) return res.status(400).json({ message: "اسم المستخدم موجود مسبقاً" });
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await storage.createAppUser({
      username,
      password: hashedPassword,
      displayName,
      permissions: permissions || [],
      isActive: isActive !== false,
    });
    const { password: _, ...safe } = user;
    res.status(201).json(safe);
  });

  app.patch("/api/app-users/:id", isCompanyAuth, async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const existing = await storage.getAppUser(req.params.id);
    if (!existing) return res.status(404).json({ message: "المستخدم غير موجود" });
    const updateData: any = {};
    if (req.body.displayName) updateData.displayName = req.body.displayName;
    if (req.body.username) updateData.username = req.body.username;
    if (req.body.permissions) updateData.permissions = req.body.permissions;
    if (typeof req.body.isActive === "boolean") updateData.isActive = req.body.isActive;
    if (req.body.password) updateData.password = await bcrypt.hash(req.body.password, 10);
    const updated = await storage.updateAppUser(req.params.id, updateData);
    if (!updated) return res.status(404).json({ message: "المستخدم غير موجود" });
    const { password: _, ...safe } = updated;
    res.json(safe);
  });

  app.delete("/api/app-users/:id", isCompanyAuth, async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    await storage.deleteAppUser(req.params.id);
    res.json({ ok: true });
  });

  // Workshops
  app.get("/api/workshops", isCompanyAuth, requirePermission("factory"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const all = await storage.getWorkshops();
    res.json(all);
  });

  app.post("/api/workshops", isCompanyAuth, requirePermission("factory"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const parsed = insertWorkshopSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "بيانات غير صالحة" });
    const ws = await storage.createWorkshop(parsed.data);
    res.status(201).json(ws);
  });

  app.delete("/api/workshops/:id", isCompanyAuth, requirePermission("factory"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    await storage.deleteWorkshop(req.params.id);
    res.json({ ok: true });
  });

  // Workshop Expense Categories
  app.get("/api/workshop-expense-categories", isCompanyAuth, requirePermission("factory"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const cats = await storage.getWorkshopExpenseCategories();
    res.json(cats);
  });

  app.post("/api/workshop-expense-categories", isCompanyAuth, requirePermission("factory"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const parsed = insertWorkshopExpenseCategorySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "بيانات غير صالحة" });
    const cat = await storage.createWorkshopExpenseCategory(parsed.data);
    res.status(201).json(cat);
  });

  app.delete("/api/workshop-expense-categories/:id", isCompanyAuth, requirePermission("factory"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    await storage.deleteWorkshopExpenseCategory(req.params.id);
    res.json({ ok: true });
  });

  // Workshop Expenses
  app.get("/api/workshops/:workshopId/expenses", isCompanyAuth, requirePermission("factory"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const expenses = await storage.getWorkshopExpenses(req.params.workshopId);
    res.json(expenses);
  });

  // Factory Settings
  app.get("/api/factory-settings", isCompanyAuth, requirePermission("factory"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const settings = await storage.getFactorySettings();
    res.json(settings);
  });

  app.patch("/api/factory-settings/balance", isCompanyAuth, requirePermission("factory"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const { amount, type } = req.body;
    if (!amount || !type) return res.status(400).json({ message: "بيانات غير صالحة" });
    const factoryS = await storage.getFactorySettings();
    const currentBalance = Number(factoryS.balance);
    const changeAmount = Number(amount);
    const newBalance = type === "add" ? currentBalance + changeAmount : currentBalance - changeAmount;
    const updated = await storage.updateFactoryBalance(String(newBalance));
    const parentCompany = await storage.getCompany(req.session.companyId);
    if (parentCompany) {
      const parentBalance = Number(parentCompany.balance);
      const newParentBalance = type === "add" ? parentBalance - changeAmount : parentBalance + changeAmount;
      await storage.updateCompanyBalance(parentCompany.id, String(newParentBalance));
    }
    res.json(updated);
  });

  app.get("/api/workshop-expenses", isCompanyAuth, requirePermission("factory"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const all = await storage.getAllWorkshopExpenses();
    res.json(all);
  });

  app.get("/api/spare-parts-purchases", isCompanyAuth, requirePermission("factory"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const all = await storage.getAllSparePartPurchases();
    res.json(all);
  });

  app.get("/api/raw-material-purchases", isCompanyAuth, requirePermission("factory"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const all = await storage.getAllRawMaterialPurchases();
    res.json(all);
  });

  app.post("/api/workshops/:workshopId/expenses", isCompanyAuth, requirePermission("factory"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const parsed = insertWorkshopExpenseSchema.safeParse({ ...req.body, workshopId: req.params.workshopId });
    if (!parsed.success) return res.status(400).json({ message: "بيانات غير صالحة" });

    const factoryS = await storage.getFactorySettings();
    const amount = Number(parsed.data.amount);
    const factoryBalance = Number(factoryS.balance);
    await storage.updateFactoryBalance(String(factoryBalance - amount));

    const parentCompany = await storage.getCompany(req.session.companyId);
    if (parentCompany) {
      const parentBalance = Number(parentCompany.balance);
      await storage.updateCompanyBalance(parentCompany.id, String(parentBalance - amount));
    }

    const expense = await storage.createWorkshopExpense(parsed.data);
    res.status(201).json(expense);
  });

  app.delete("/api/workshop-expenses/:id", isCompanyAuth, requirePermission("factory"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const expense = await storage.getWorkshopExpense(req.params.id);
    if (!expense) return res.status(404).json({ message: "غير موجود" });

    const factoryS = await storage.getFactorySettings();
    const amount = Number(expense.amount);
    const factoryBalance = Number(factoryS.balance);
    await storage.updateFactoryBalance(String(factoryBalance + amount));

    const parentCompany = await storage.getCompany(req.session.companyId);
    if (parentCompany) {
      const parentBalance = Number(parentCompany.balance);
      await storage.updateCompanyBalance(parentCompany.id, String(parentBalance + amount));
    }

    await storage.deleteWorkshopExpense(expense.id);
    res.json({ ok: true });
  });

  // Machines
  app.get("/api/machines", isCompanyAuth, requirePermission("factory"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const all = await storage.getMachines();
    res.json(all);
  });

  app.get("/api/workshops/:workshopId/machines", isCompanyAuth, requirePermission("factory"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const machines = await storage.getMachinesByWorkshop(req.params.workshopId);
    res.json(machines);
  });

  app.post("/api/workshops/:workshopId/machines", isCompanyAuth, requirePermission("factory"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const parsed = insertMachineSchema.safeParse({ ...req.body, workshopId: req.params.workshopId });
    if (!parsed.success) return res.status(400).json({ message: "بيانات غير صالحة" });
    const machine = await storage.createMachine(parsed.data);
    res.status(201).json(machine);
  });

  app.delete("/api/machines/:id", isCompanyAuth, requirePermission("factory"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    await storage.deleteMachine(req.params.id);
    res.json({ ok: true });
  });

  // Workers
  app.get("/api/workers", isCompanyAuth, requirePermission("factory"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const all = await storage.getWorkers();
    res.json(all);
  });

  app.post("/api/workers", isCompanyAuth, requirePermission("factory"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const parsed = insertWorkerSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "بيانات غير صالحة" });
    const worker = await storage.createWorker(parsed.data);
    res.status(201).json(worker);
  });

  app.delete("/api/workers/:id", isCompanyAuth, requirePermission("factory"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    await storage.deleteWorker(req.params.id);
    res.json({ ok: true });
  });

  // Machine Daily Entries
  app.get("/api/machines/:machineId/entries", isCompanyAuth, requirePermission("factory"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const entries = await storage.getMachineDailyEntries(req.params.machineId);
    res.json(entries);
  });

  app.get("/api/machine-entries", isCompanyAuth, requirePermission("factory"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const all = await storage.getAllMachineDailyEntries();
    res.json(all);
  });

  app.post("/api/machines/:machineId/entries", isCompanyAuth, requirePermission("factory"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const parsed = insertMachineDailyEntrySchema.safeParse({ ...req.body, machineId: req.params.machineId });
    if (!parsed.success) return res.status(400).json({ message: "بيانات غير صالحة" });
    const entry = await storage.createMachineDailyEntry(parsed.data);
    res.status(201).json(entry);
  });

  app.delete("/api/machine-entries/:id", isCompanyAuth, requirePermission("factory"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    await storage.deleteMachineDailyEntry(req.params.id);
    res.json({ ok: true });
  });

  // Spare Parts Items (Warehouse)
  app.get("/api/spare-parts", isCompanyAuth, requirePermission("factory"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const all = await storage.getSparePartItems();
    res.json(all);
  });

  app.post("/api/spare-parts", isCompanyAuth, requirePermission("factory"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const parsed = insertSparePartItemSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "بيانات غير صالحة" });
    const item = await storage.createSparePartItem(parsed.data);
    res.status(201).json(item);
  });

  app.delete("/api/spare-parts/:id", isCompanyAuth, requirePermission("factory"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    await storage.deleteSparePartItem(req.params.id);
    res.json({ ok: true });
  });

  // Spare Parts Purchases
  app.get("/api/spare-parts/:sparePartId/purchases", isCompanyAuth, requirePermission("factory"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const purchases = await storage.getSparePartPurchases(req.params.sparePartId);
    res.json(purchases);
  });

  app.post("/api/spare-parts/:sparePartId/purchases", isCompanyAuth, requirePermission("factory"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const parsed = insertSparePartPurchaseSchema.safeParse({ ...req.body, sparePartId: req.params.sparePartId });
    if (!parsed.success) return res.status(400).json({ message: "بيانات غير صالحة" });

    const sparePart = await storage.getSparePartItem(req.params.sparePartId);
    if (sparePart) {
      const currentQty = Number(sparePart.quantity);
      const addedQty = Number(parsed.data.quantity);
      await storage.updateSparePartQuantity(sparePart.id, String(currentQty + addedQty));
    }

    const factoryS = await storage.getFactorySettings();
    const cost = Number(parsed.data.cost);
    const factoryBalance = Number(factoryS.balance);
    await storage.updateFactoryBalance(String(factoryBalance - cost));

    const parentCompany = await storage.getCompany(req.session.companyId);
    if (parentCompany) {
      const parentBalance = Number(parentCompany.balance);
      await storage.updateCompanyBalance(parentCompany.id, String(parentBalance - cost));
    }

    const purchase = await storage.createSparePartPurchase(parsed.data);
    res.status(201).json(purchase);
  });

  app.delete("/api/spare-parts-purchases/:id", isCompanyAuth, requirePermission("factory"), async (req: any, res) => {
    return res.status(405).json({ message: "غير مسموح" });
  });

  // Spare Parts Consumption
  app.get("/api/machines/:machineId/spare-parts-consumption", isCompanyAuth, requirePermission("factory"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const consumption = await storage.getSparePartConsumptions(req.params.machineId);
    res.json(consumption);
  });

  app.get("/api/spare-parts-consumption", isCompanyAuth, requirePermission("factory"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const all = await storage.getAllSparePartConsumptions();
    res.json(all);
  });

  app.post("/api/machines/:machineId/spare-parts-consumption", isCompanyAuth, requirePermission("factory"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const parsed = insertSparePartConsumptionSchema.safeParse({ ...req.body, machineId: req.params.machineId });
    if (!parsed.success) return res.status(400).json({ message: "بيانات غير صالحة" });

    const sparePart = await storage.getSparePartItem(parsed.data.sparePartId);
    if (sparePart) {
      const currentQty = Number(sparePart.quantity);
      const consumedQty = Number(parsed.data.quantity);
      await storage.updateSparePartQuantity(sparePart.id, String(currentQty - consumedQty));
    }

    const consumption = await storage.createSparePartConsumption(parsed.data);
    res.status(201).json(consumption);
  });

  app.delete("/api/spare-parts-consumption/:id", isCompanyAuth, requirePermission("factory"), async (req: any, res) => {
    return res.status(405).json({ message: "غير مسموح" });
  });

  // Raw Materials
  app.get("/api/raw-materials", isCompanyAuth, requirePermission("factory"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const all = await storage.getRawMaterials();
    res.json(all);
  });

  app.post("/api/raw-materials", isCompanyAuth, requirePermission("factory"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const parsed = insertRawMaterialSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "بيانات غير صالحة" });
    const material = await storage.createRawMaterial(parsed.data);
    res.status(201).json(material);
  });

  app.delete("/api/raw-materials/:id", isCompanyAuth, requirePermission("factory"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    await storage.deleteRawMaterial(req.params.id);
    res.json({ ok: true });
  });

  // Raw Material Purchases
  app.get("/api/raw-materials/:rawMaterialId/purchases", isCompanyAuth, requirePermission("factory"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const purchases = await storage.getRawMaterialPurchases(req.params.rawMaterialId);
    res.json(purchases);
  });

  app.post("/api/raw-materials/:rawMaterialId/purchases", isCompanyAuth, requirePermission("factory"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const parsed = insertRawMaterialPurchaseSchema.safeParse({ ...req.body, rawMaterialId: req.params.rawMaterialId });
    if (!parsed.success) return res.status(400).json({ message: "بيانات غير صالحة" });

    const rawMaterial = await storage.getRawMaterial(req.params.rawMaterialId);
    if (rawMaterial) {
      const currentQty = Number(rawMaterial.quantity);
      const addedQty = Number(parsed.data.quantity);
      await storage.updateRawMaterialQuantity(rawMaterial.id, String(currentQty + addedQty));
    }

    const factoryS = await storage.getFactorySettings();
    const cost = Number(parsed.data.cost);
    const factoryBalance = Number(factoryS.balance);
    await storage.updateFactoryBalance(String(factoryBalance - cost));

    const parentCompany = await storage.getCompany(req.session.companyId);
    if (parentCompany) {
      const parentBalance = Number(parentCompany.balance);
      await storage.updateCompanyBalance(parentCompany.id, String(parentBalance - cost));
    }

    const purchase = await storage.createRawMaterialPurchase(parsed.data);
    res.status(201).json(purchase);
  });

  app.delete("/api/raw-material-purchases/:id", isCompanyAuth, requirePermission("factory"), async (req: any, res) => {
    return res.status(405).json({ message: "غير مسموح" });
  });

  // Worker Companies
  app.get("/api/worker-companies", isCompanyAuth, requirePermission("workers"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const all = await storage.getWorkerCompanies();
    res.json(all);
  });

  app.post("/api/worker-companies", isCompanyAuth, requirePermission("workers"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const parsed = insertWorkerCompanySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "بيانات غير صالحة" });
    const company = await storage.createWorkerCompany(parsed.data);
    res.status(201).json(company);
  });

  app.delete("/api/worker-companies/:id", isCompanyAuth, requirePermission("workers"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    await storage.deleteWorkerCompany(req.params.id);
    res.json({ ok: true });
  });

  // Managed Workers
  app.get("/api/managed-workers", isCompanyAuth, requirePermission("workers"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const all = await storage.getWorkers();
    res.json(all);
  });

  app.post("/api/managed-workers", isCompanyAuth, requirePermission("workers"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const parsed = insertWorkerSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "بيانات غير صالحة" });
    const worker = await storage.createWorker(parsed.data);
    res.status(201).json(worker);
  });

  app.post("/api/managed-workers/import", isCompanyAuth, requirePermission("workers"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const workersData = Array.isArray(req.body) ? req.body : req.body?.workers;
    if (!Array.isArray(workersData)) return res.status(400).json({ message: "بيانات غير صالحة - يجب إرسال مصفوفة" });
    const created = [];
    for (const w of workersData) {
      const parsed = insertWorkerSchema.safeParse(w);
      if (!parsed.success) continue;
      const worker = await storage.createWorker(parsed.data);
      created.push(worker);
    }
    res.status(201).json(created);
  });

  app.patch("/api/managed-workers/:id", isCompanyAuth, requirePermission("workers"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const worker = await storage.getWorker(req.params.id);
    if (!worker) return res.status(404).json({ message: "العامل غير موجود" });
    const updateData: any = {};
    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.phone !== undefined) updateData.phone = req.body.phone || null;
    if (req.body.workerNumber !== undefined) updateData.workerNumber = req.body.workerNumber || null;
    if (req.body.workerCompanyId !== undefined) updateData.workerCompanyId = req.body.workerCompanyId || null;
    if (req.body.contractEndDate !== undefined) updateData.contractEndDate = req.body.contractEndDate || null;
    if (req.body.wage !== undefined) updateData.wage = req.body.wage;
    if (req.body.workPeriod !== undefined) updateData.workPeriod = req.body.workPeriod || null;
    if (req.body.workshopId !== undefined) updateData.workshopId = req.body.workshopId || null;
    if (req.body.nonRenewalDate !== undefined) updateData.nonRenewalDate = req.body.nonRenewalDate || null;
    const updated = await storage.updateWorker(worker.id, updateData);
    res.json(updated);
  });

  app.delete("/api/managed-workers/:id", isCompanyAuth, requirePermission("workers"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const worker = await storage.getWorker(req.params.id);
    if (!worker) return res.status(404).json({ message: "العامل غير موجود" });
    await storage.deleteWorker(worker.id);
    res.json({ ok: true });
  });

  // Worker Transactions
  app.get("/api/managed-workers/:workerId/transactions", isCompanyAuth, requirePermission("workers"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const transactions = await storage.getWorkerTransactions(req.params.workerId);
    res.json(transactions);
  });

  app.post("/api/managed-workers/:workerId/transactions", isCompanyAuth, requirePermission("workers"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const worker = await storage.getWorker(req.params.workerId);
    if (!worker) return res.status(404).json({ message: "العامل غير موجود" });

    const parsed = insertWorkerTransactionSchema.safeParse({ ...req.body, workerId: req.params.workerId });
    if (!parsed.success) return res.status(400).json({ message: "بيانات غير صالحة" });

    const txType = parsed.data.type;
    if (!["salary", "advance", "deduction"].includes(txType)) {
      return res.status(400).json({ message: "نوع العملية غير صالح" });
    }

    const amount = Number(parsed.data.amount);
    const workerBalance = Number(worker.balance);
    const parentCompany = await getParentCompanyForSession(req);
    if (!parentCompany) return res.status(500).json({ message: "خطأ في بيانات الشركة الأم" });
    const parentBalance = Number(parentCompany.balance);

    if (txType === "salary" || txType === "advance") {
      await storage.updateWorkerBalance(worker.id, String(workerBalance + amount));
      await storage.updateCompanyBalance(parentCompany.id, String(parentBalance - amount));
    } else {
      await storage.updateWorkerBalance(worker.id, String(workerBalance - amount));
      await storage.updateCompanyBalance(parentCompany.id, String(parentBalance + amount));
    }

    const tx = await storage.createWorkerTransaction(parsed.data);
    res.status(201).json(tx);
  });

  app.delete("/api/managed-workers/:workerId/transactions/:id", isCompanyAuth, requirePermission("workers"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const worker = await storage.getWorker(req.params.workerId);
    if (!worker) return res.status(404).json({ message: "العامل غير موجود" });

    const deleted = await storage.deleteWorkerTransaction(req.params.id);
    if (!deleted) return res.status(404).json({ message: "العملية غير موجودة" });

    const amount = Number(deleted.amount);
    const workerBalance = Number(worker.balance);
    const parentCompany = await getParentCompanyForSession(req);
    if (!parentCompany) return res.status(500).json({ message: "خطأ في بيانات الشركة الأم" });
    const parentBalance = Number(parentCompany.balance);

    if (deleted.type === "salary" || deleted.type === "advance") {
      await storage.updateWorkerBalance(worker.id, String(workerBalance - amount));
      await storage.updateCompanyBalance(parentCompany.id, String(parentBalance + amount));
    } else {
      await storage.updateWorkerBalance(worker.id, String(workerBalance + amount));
      await storage.updateCompanyBalance(parentCompany.id, String(parentBalance - amount));
    }

    res.json({ ok: true });
  });

  // Work Shifts
  app.get("/api/work-shifts", isCompanyAuth, requirePermission("workers"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const shifts = await storage.getWorkShifts();
    res.json(shifts);
  });

  app.post("/api/work-shifts", isCompanyAuth, requirePermission("workers"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const parsed = insertWorkShiftSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "بيانات غير صالحة" });
    const shift = await storage.createWorkShift(parsed.data);
    res.status(201).json(shift);
  });

  app.delete("/api/work-shifts/:id", isCompanyAuth, requirePermission("workers"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    await storage.deleteWorkShift(req.params.id);
    res.json({ ok: true });
  });

  // Holidays
  app.get("/api/holidays", isCompanyAuth, requirePermission("workers"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const allHolidays = await storage.getHolidays();
    res.json(allHolidays);
  });

  app.post("/api/holidays", isCompanyAuth, requirePermission("workers"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const parsed = insertHolidaySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "بيانات غير صالحة" });
    const holiday = await storage.createHoliday(parsed.data);
    res.status(201).json(holiday);
  });

  app.delete("/api/holidays/:id", isCompanyAuth, requirePermission("workers"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    await storage.deleteHoliday(req.params.id);
    res.json({ ok: true });
  });

  // Worker Warnings
  app.get("/api/worker-warnings", isCompanyAuth, requirePermission("workers"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const { startDate, endDate, workerId } = req.query;
    if (workerId) {
      const warnings = await storage.getWorkerWarnings(workerId as string);
      if (startDate || endDate) {
        const filtered = warnings.filter(w => {
          if (startDate && w.date < (startDate as string)) return false;
          if (endDate && w.date > (endDate as string)) return false;
          return true;
        });
        return res.json(filtered);
      }
      return res.json(warnings);
    }
    const allWarnings = await storage.getAllWorkerWarnings(startDate as string, endDate as string);
    res.json(allWarnings);
  });

  app.post("/api/worker-warnings", isCompanyAuth, requirePermission("workers"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const parsed = insertWorkerWarningSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "بيانات غير صالحة" });
    const warning = await storage.createWorkerWarning(parsed.data);
    res.status(201).json(warning);
  });

  app.delete("/api/worker-warnings/:id", isCompanyAuth, requirePermission("workers"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    await storage.deleteWorkerWarning(req.params.id);
    res.json({ ok: true });
  });

  // Attendance Scan
  app.post("/api/attendance/scan", isCompanyAuth, requirePermission("workers"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const { workerId } = req.body;
    if (!workerId) return res.status(400).json({ message: "معرف العامل مطلوب" });

    const worker = await storage.getWorker(workerId);
    if (!worker) return res.status(404).json({ message: "العامل غير موجود" });

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const currentTimeStr = now.toTimeString().slice(0, 5);

    const existingDay = await storage.getAttendanceDay(workerId, todayStr);

    const recentScans = await storage.getAttendanceScans(workerId);
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
    const recentScan = recentScans.find(s => new Date(s.scanTime) > tenMinutesAgo);
    if (recentScan) {
      return res.status(400).json({ message: "يجب الانتظار 10 دقائق بين كل مسح" });
    }

    let shift = null;
    if (worker.shiftId) {
      shift = await storage.getWorkShift(worker.shiftId);
    }

    if (!existingDay || !existingDay.checkIn) {
      const scan = await storage.createAttendanceScan({
        workerId,
        scanTime: now,
        type: "in",
      });

      let lateMinutes = 0;
      if (shift) {
        const [shiftH, shiftM] = shift.startTime.split(":").map(Number);
        const shiftStart = shiftH * 60 + shiftM;
        const currentMin = now.getHours() * 60 + now.getMinutes();
        const tolerance = shift.lateToleranceMinutes || 0;
        if (currentMin > shiftStart + tolerance) {
          lateMinutes = currentMin - shiftStart;
        }
      }

      const attendanceDay = await storage.upsertAttendanceDay({
        workerId,
        date: todayStr,
        checkIn: currentTimeStr,
        checkOut: null,
        status: lateMinutes > 0 ? "late" : "present",
        lateMinutes,
        earlyLeaveMinutes: 0,
        overtimeMinutes: 0,
        shiftId: worker.shiftId || null,
      });

      return res.json({ scan, attendanceDay, message: "تم تسجيل الحضور" });
    }

    if (existingDay.checkIn && !existingDay.checkOut) {
      const scan = await storage.createAttendanceScan({
        workerId,
        scanTime: now,
        type: "out",
      });

      let earlyLeaveMin = 0;
      let overtimeMin = 0;
      if (shift) {
        const [endH, endM] = shift.endTime.split(":").map(Number);
        const shiftEnd = endH * 60 + endM;
        const currentMin = now.getHours() * 60 + now.getMinutes();
        const earlyThreshold = shift.earlyLeaveMinutes || 0;
        if (currentMin < shiftEnd - earlyThreshold) {
          earlyLeaveMin = shiftEnd - currentMin;
        }
        const overtimeThreshold = shift.overtimeAfterMinutes || 0;
        if (currentMin > shiftEnd + overtimeThreshold) {
          overtimeMin = currentMin - shiftEnd - overtimeThreshold;
        }
      }

      const lateMinutes = existingDay.lateMinutes || 0;
      const status = (lateMinutes > 0 || earlyLeaveMin > 0) ? "late" : "present";

      const attendanceDay = await storage.upsertAttendanceDay({
        workerId,
        date: todayStr,
        checkIn: existingDay.checkIn,
        checkOut: currentTimeStr,
        status,
        lateMinutes,
        earlyLeaveMinutes: earlyLeaveMin,
        overtimeMinutes: overtimeMin,
        shiftId: existingDay.shiftId || worker.shiftId || null,
      });

      return res.json({ scan, attendanceDay, message: "تم تسجيل الانصراف" });
    }

    return res.status(400).json({ message: "تم تسجيل الحضور والانصراف لهذا اليوم بالفعل" });
  });

  // Attendance Days
  app.get("/api/attendance-days", isCompanyAuth, requirePermission("workers"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const { startDate, endDate, workerId } = req.query;
    if (workerId) {
      const days = await storage.getAttendanceDays(workerId as string, startDate as string, endDate as string);
      return res.json(days);
    }
    const days = await storage.getAllAttendanceDays(startDate as string, endDate as string);
    res.json(days);
  });

  app.patch("/api/attendance-days/:id", isCompanyAuth, requirePermission("workers"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const { checkIn, checkOut, status, lateMinutes, earlyLeaveMinutes, overtimeMinutes } = req.body;

    const allDays = await storage.getAllAttendanceDays();
    const day = allDays.find(d => d.id === req.params.id);
    if (!day) return res.status(404).json({ message: "سجل الحضور غير موجود" });

    const updateData: any = {
      workerId: day.workerId,
      date: day.date,
      checkIn: checkIn !== undefined ? checkIn : day.checkIn,
      checkOut: checkOut !== undefined ? checkOut : day.checkOut,
      status: status !== undefined ? status : day.status,
      lateMinutes: lateMinutes !== undefined ? lateMinutes : day.lateMinutes,
      earlyLeaveMinutes: earlyLeaveMinutes !== undefined ? earlyLeaveMinutes : day.earlyLeaveMinutes,
      overtimeMinutes: overtimeMinutes !== undefined ? overtimeMinutes : day.overtimeMinutes,
      shiftId: day.shiftId,
    };

    const updated = await storage.upsertAttendanceDay(updateData);
    res.json(updated);
  });

  app.delete("/api/attendance-days/:id", isCompanyAuth, requirePermission("workers"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    await storage.deleteAttendanceDay(req.params.id);
    res.json({ ok: true });
  });

  // Bonus Calculation
  app.get("/api/bonus-calculation", isCompanyAuth, requirePermission("workers"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) return res.status(400).json({ message: "يجب تحديد تاريخ البداية والنهاية" });

    const allWorkers = await storage.getWorkers();
    const allDays = await storage.getAllAttendanceDays(startDate as string, endDate as string);
    const allHolidays = await storage.getHolidays();
    const allWarnings = await storage.getAllWorkerWarnings(startDate as string, endDate as string);

    const holidayDates = new Set(allHolidays.map(h => h.date));

    const results = allWorkers.map(worker => {
      const workerDays = allDays.filter(d => d.workerId === worker.id);
      const workerWarningsList = allWarnings.filter(w => w.workerId === worker.id);
      const baseBonus = Number(worker.bonus) || 5000;

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      let absenceDays = 0;
      let lateDays = 0;

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split("T")[0];
        const dayOfWeek = d.getDay();

        if (dayOfWeek === 4 || dayOfWeek === 5) continue;
        if (holidayDates.has(dateStr)) continue;

        const attendanceRecord = workerDays.find(ad => ad.date === dateStr);

        if (!attendanceRecord || attendanceRecord.status === "absent") {
          if (dayOfWeek === 6) {
            absenceDays += 2;
          } else {
            absenceDays += 1.5;
          }
        } else if (attendanceRecord.status === "late") {
          lateDays += 0.5;
        }
      }

      const warningDays = workerWarningsList.length;
      lateDays += warningDays * 0.5;

      const totalPenalty = absenceDays + lateDays;
      let deductions = 0;
      let finalBonus = baseBonus;

      if (totalPenalty > 2) {
        deductions = baseBonus;
        finalBonus = 0;
      } else {
        deductions = (absenceDays * 1000) + (lateDays * 500);
        if (totalPenalty === 2) {
          deductions = (absenceDays * 2000) + (lateDays * 1000);
        }
        finalBonus = Math.max(0, baseBonus - deductions);
      }

      return {
        workerId: worker.id,
        workerName: worker.name,
        workerNumber: worker.workerNumber,
        bonus: baseBonus,
        absenceDays,
        lateDays,
        warningDays,
        deductions,
        finalBonus,
      };
    });

    res.json(results);
  });

  // Salary Statement
  app.get("/api/salary-statement", isCompanyAuth, requirePermission("workers"), async (req: any, res) => {
    if (!req.session.isParent) return res.status(403).json({ message: "غير مصرح" });
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) return res.status(400).json({ message: "يجب تحديد تاريخ البداية والنهاية" });

    const allWorkers = await storage.getWorkers();
    const allDays = await storage.getAllAttendanceDays(startDate as string, endDate as string);
    const allHolidays = await storage.getHolidays();
    const allWarnings = await storage.getAllWorkerWarnings(startDate as string, endDate as string);

    const holidayDates = new Set(allHolidays.map(h => h.date));

    const results = await Promise.all(allWorkers.map(async (worker) => {
      const workerDays = allDays.filter(d => d.workerId === worker.id);
      const workerWarningsList = allWarnings.filter(w => w.workerId === worker.id);
      const baseBonus = Number(worker.bonus) || 5000;
      const wage = Number(worker.wage) || 0;
      const overtimeRate = Number(worker.overtimeRate) || 0;

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      let daysPresent = 0;
      let totalOvertimeMinutes = 0;
      let absenceDays = 0;
      let lateDays = 0;

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split("T")[0];
        const dayOfWeek = d.getDay();

        if (dayOfWeek === 4 || dayOfWeek === 5) continue;
        if (holidayDates.has(dateStr)) continue;

        const attendanceRecord = workerDays.find(ad => ad.date === dateStr);

        if (attendanceRecord && attendanceRecord.status !== "absent") {
          daysPresent++;
          totalOvertimeMinutes += attendanceRecord.overtimeMinutes || 0;
          if (attendanceRecord.status === "late") {
            lateDays += 0.5;
          }
        } else {
          if (dayOfWeek === 6) {
            absenceDays += 2;
          } else {
            absenceDays += 1.5;
          }
        }
      }

      const warningDays = workerWarningsList.length;
      lateDays += warningDays * 0.5;

      const totalPenalty = absenceDays + lateDays;
      let bonusDeductions = 0;
      let finalBonus = baseBonus;

      if (totalPenalty > 2) {
        bonusDeductions = baseBonus;
        finalBonus = 0;
      } else {
        bonusDeductions = (absenceDays * 1000) + (lateDays * 500);
        if (totalPenalty === 2) {
          bonusDeductions = (absenceDays * 2000) + (lateDays * 1000);
        }
        finalBonus = Math.max(0, baseBonus - bonusDeductions);
      }

      const deservedAmount = wage;
      const overtimeHours = Math.round((totalOvertimeMinutes / 60) * 100) / 100;
      const overtimeAmount = overtimeHours * overtimeRate;

      const workerTransactions = await storage.getWorkerTransactions(worker.id);
      const advances = workerTransactions
        .filter(t => t.type === "advance" && t.date && t.date >= (startDate as string) && t.date <= (endDate as string))
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const totalDeserved = deservedAmount + overtimeAmount + finalBonus;
      const totalPaid = advances;
      const remaining = totalDeserved - totalPaid;

      return {
        workerId: worker.id,
        workerName: worker.name,
        workerNumber: worker.workerNumber,
        daysPresent,
        wage,
        deservedAmount,
        overtimeHours,
        overtimeAmount,
        bonus: baseBonus,
        bonusDeductions,
        finalBonus,
        advances,
        totalDeserved,
        totalPaid,
        remaining,
      };
    }));

    res.json(results);
  });

  return httpServer;
}
