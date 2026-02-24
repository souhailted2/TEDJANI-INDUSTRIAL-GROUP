import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCategorySchema, insertSupplierSchema, insertWarehouseSchema, insertProductSchema, insertProductPartSchema, insertShippingCompanySchema, insertCashboxTransactionSchema, insertExpenseSchema } from "@shared/schema";
import bcrypt from "bcryptjs";
import multer from "multer";
import * as XLSX from "xlsx";
import { db } from "./db";
import { sql } from "drizzle-orm";
import * as schema from "@shared/schema";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "غير مصرح" });
  }
  next();
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId || req.session.role !== "admin") {
    return res.status(403).json({ message: "صلاحيات غير كافية" });
  }
  next();
}

function requireNotWarehouse(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "غير مصرح" });
  }
  if (req.session.role === "warehouse") {
    return res.status(403).json({ message: "صلاحيات غير كافية" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: "يرجى إدخال اسم المستخدم وكلمة المرور" });
      }
      const user = await storage.getUserByUsername(username);
      if (!user || !user.active) {
        return res.status(401).json({ message: "اسم المستخدم أو كلمة المرور غير صحيحة" });
      }
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ message: "اسم المستخدم أو كلمة المرور غير صحيحة" });
      }
      req.session.userId = user.id;
      req.session.role = user.role;
      const { password: _, ...safeUser } = user;
      const allowedCategories = await storage.getUserCategories(user.id);
      res.json({ ...safeUser, allowedCategories });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "غير مصرح" });
    }
    const user = await storage.getUserById(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "غير مصرح" });
    }
    const { password: _, ...safeUser } = user;
    const allowedCategories = await storage.getUserCategories(user.id);
    res.json({ ...safeUser, allowedCategories });
  });

  app.get("/api/users", requireAdmin, async (_req, res) => {
    const allUsers = await storage.getUsers();
    const result = [];
    for (const u of allUsers) {
      const { password: _, ...safeUser } = u;
      const allowedCategories = await storage.getUserCategories(u.id);
      result.push({ ...safeUser, allowedCategories });
    }
    res.json(result);
  });

  app.get("/api/users/:id/categories", requireAdmin, async (req, res) => {
    try {
      const cats = await storage.getUserCategories(parseInt(req.params.id));
      res.json(cats);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.put("/api/users/:id/categories", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { categoryIds } = req.body;
      if (!Array.isArray(categoryIds)) {
        return res.status(400).json({ message: "يرجى تقديم قائمة الفئات" });
      }
      await storage.setUserCategories(userId, categoryIds);
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.patch("/api/auth/profile", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { username, displayName, currentPassword, newPassword } = req.body;

      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }

      const updateData: Partial<{ username: string; password: string; displayName: string }> = {};

      if (username && username !== user.username) {
        const existing = await storage.getUserByUsername(username);
        if (existing) {
          return res.status(400).json({ message: "اسم المستخدم مستخدم بالفعل" });
        }
        updateData.username = username;
      }

      if (displayName) {
        updateData.displayName = displayName;
      }

      if (newPassword) {
        if (!currentPassword) {
          return res.status(400).json({ message: "يرجى إدخال كلمة المرور الحالية" });
        }
        const valid = await bcrypt.compare(currentPassword, user.password);
        if (!valid) {
          return res.status(400).json({ message: "كلمة المرور الحالية غير صحيحة" });
        }
        updateData.password = await bcrypt.hash(newPassword, 10);
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: "لا توجد تغييرات" });
      }

      const updated = await storage.updateUser(userId, updateData);
      if (!updated) {
        return res.status(500).json({ message: "فشل في التحديث" });
      }
      const { password: _, ...safeUser } = updated;
      const allowedCategories = await storage.getUserCategories(updated.id);
      res.json({ ...safeUser, allowedCategories });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.post("/api/users", requireAdmin, async (req, res) => {
    try {
      const { username, password, displayName, role } = req.body;
      if (!username || !password || !displayName) {
        return res.status(400).json({ message: "يرجى ملء جميع الحقول" });
      }
      const validRoles = ["admin", "user", "warehouse"];
      if (role && !validRoles.includes(role)) {
        return res.status(400).json({ message: "صلاحية غير صالحة" });
      }
      const existing = await storage.getUserByUsername(username);
      if (existing) {
        return res.status(400).json({ message: "اسم المستخدم مستخدم بالفعل" });
      }
      const hashed = await bcrypt.hash(password, 10);
      const user = await storage.createUser({ username, password: hashed, displayName, role: role || "user" });
      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.get("/api/categories", requireAuth, async (_req, res) => {
    const cats = await storage.getCategories();
    res.json(cats);
  });

  app.post("/api/categories", requireAuth, async (req, res) => {
    try {
      const parsed = insertCategorySchema.parse(req.body);
      const cat = await storage.createCategory(parsed);
      res.json(cat);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.get("/api/suppliers", requireAuth, async (_req, res) => {
    const sups = await storage.getSuppliers();
    res.json(sups);
  });

  app.post("/api/suppliers", requireAuth, async (req, res) => {
    try {
      const parsed = insertSupplierSchema.parse(req.body);
      const sup = await storage.createSupplier(parsed);
      res.json(sup);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.patch("/api/suppliers/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updated = await storage.updateSupplier(id, req.body);
      if (!updated) return res.status(404).json({ message: "المورد غير موجود" });
      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.delete("/api/suppliers/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteSupplier(id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.patch("/api/categories/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const parsed = insertCategorySchema.partial().parse(req.body);
      const updated = await storage.updateCategory(id, parsed);
      if (!updated) return res.status(404).json({ message: "الفئة غير موجودة" });
      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.delete("/api/categories/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCategory(id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.get("/api/warehouses", requireAuth, async (_req, res) => {
    const whs = await storage.getWarehouses();
    res.json(whs);
  });

  app.post("/api/warehouses", requireAuth, async (req, res) => {
    try {
      const parsed = insertWarehouseSchema.parse(req.body);
      const wh = await storage.createWarehouse(parsed);
      res.json(wh);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.patch("/api/warehouses/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updated = await storage.updateWarehouse(id, req.body);
      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.delete("/api/warehouses/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteWarehouse(id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  // Shipping Companies
  app.get("/api/shipping-companies", requireAuth, async (_req, res) => {
    const companies = await storage.getShippingCompanies();
    res.json(companies);
  });

  app.post("/api/shipping-companies", requireAuth, async (req, res) => {
    try {
      const parsed = insertShippingCompanySchema.parse(req.body);
      const sc = await storage.createShippingCompany(parsed);
      res.json(sc);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.patch("/api/shipping-companies/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updated = await storage.updateShippingCompany(id, req.body);
      if (!updated) return res.status(404).json({ message: "شركة الشحن غير موجودة" });
      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.delete("/api/shipping-companies/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteShippingCompany(id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.get("/api/shipping-companies/:id/account", requireAuth, async (req, res) => {
    try {
      const account = await storage.getShippingCompanyAccount(parseInt(req.params.id));
      res.json(account);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.get("/api/dashboard/summary", requireAdmin, async (req, res) => {
    try {
      const summary = await storage.getDashboardSummary();
      res.json(summary);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/products", requireAuth, async (req, res) => {
    const prods = await storage.getProducts();
    if (req.session.role === "admin") {
      return res.json(prods);
    }
    const allowedCats = await storage.getUserCategories(req.session.userId!);
    if (allowedCats.length === 0) {
      return res.json([]);
    }
    const filtered = prods.filter(p => p.categoryId && allowedCats.includes(p.categoryId));
    res.json(filtered);
  });

  app.post("/api/products", requireAuth, async (req, res) => {
    try {
      if (req.session.role !== "admin") {
        const allowedCats = await storage.getUserCategories(req.session.userId!);
        if (!req.body.categoryId || !allowedCats.includes(req.body.categoryId)) {
          return res.status(403).json({ message: "ليس لديك صلاحية لإنشاء منتج في هذه الفئة" });
        }
      }
      const prod = await storage.createProduct(req.body);
      res.json(prod);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.patch("/api/products/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const allowedFields = ["quantity", "name", "nameZh", "categoryId", "status"];
      const updateData: Record<string, any> = {};
      for (const key of allowedFields) {
        if (req.body[key] !== undefined) {
          updateData[key] = req.body[key];
        }
      }
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: "لا توجد بيانات للتحديث" });
      }
      if (updateData.status) {
        updateData.statusChangedAt = new Date();
      }
      const updated = await storage.updateProduct(id, updateData);
      if (!updated) return res.status(404).json({ message: "المنتج غير موجود" });
      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.delete("/api/products/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteProduct(id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.post("/api/products/import", requireAuth, upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "يرجى رفع ملف" });
      }
      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      if (rows.length === 0) {
        return res.status(400).json({ message: "الملف فارغ" });
      }

      const allCategories = await storage.getCategories();
      const imported: any[] = [];

      const allowedCats = req.session.role === "admin"
        ? null
        : await storage.getUserCategories(req.session.userId!);

      for (const row of rows) {
        const name = row[0] ? String(row[0]).trim() : "";
        const quantity = parseInt(String(row[1] || "0")) || 0;
        const categoryName = row[2] ? String(row[2]).trim() : "";
        const nameZh = row[3] ? String(row[3]).trim() : null;

        if (!name) continue;

        let categoryId: number | null = null;
        if (categoryName) {
          const found = allCategories.find(c => c.name === categoryName);
          if (found) categoryId = found.id;
        }

        if (allowedCats && (!categoryId || !allowedCats.includes(categoryId))) continue;

        const prod = await storage.createProduct({ name, quantity, categoryId, nameZh, status: "purchase_order" });
        imported.push(prod);
      }

      res.json({ imported: imported.length, products: imported });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.get("/api/orders", requireAuth, async (_req, res) => {
    const ords = await storage.getOrders();
    res.json(ords);
  });

  app.post("/api/orders", requireNotWarehouse, async (req, res) => {
    try {
      const { supplierId, items } = req.body;
      const order = await storage.createOrder(supplierId, items);
      res.json(order);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.patch("/api/order-items/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updated = await storage.updateOrderItem(id, req.body);
      if (!updated) return res.status(404).json({ message: "عنصر الطلب غير موجود" });
      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.get("/api/suppliers/:id/ordered-items", requireAuth, async (req, res) => {
    try {
      const items = await storage.getSupplierOrderedItems(parseInt(req.params.id));
      res.json(items);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.get("/api/deliveries", requireAuth, async (_req, res) => {
    const dels = await storage.getDeliveries();
    res.json(dels);
  });

  app.post("/api/deliveries", requireAuth, async (req, res) => {
    try {
      const { supplierId, warehouseId, items } = req.body;
      const delivery = await storage.createDelivery(supplierId, warehouseId, items);
      res.json(delivery);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.get("/api/containers", requireAuth, async (_req, res) => {
    const containersList = await storage.getContainers();
    res.json(containersList);
  });

  app.post("/api/containers", requireAuth, async (req, res) => {
    try {
      const { items, ...data } = req.body;
      const container = await storage.createContainer(data, items);
      res.json(container);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.patch("/api/containers/:id", requireAuth, async (req, res) => {
    try {
      const container = await storage.updateContainer(parseInt(req.params.id), req.body);
      res.json(container);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.patch("/api/containers/:id/arrive", requireAuth, async (req, res) => {
    try {
      const container = await storage.markContainerArrived(parseInt(req.params.id));
      res.json(container);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.get("/api/container-documents", requireAuth, async (_req, res) => {
    try {
      const docs = await storage.getContainerDocuments();
      res.json(docs);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.patch("/api/container-documents/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existing = await storage.getContainerDocument(id);
      if (!existing) return res.status(404).json({ message: "not found" });

      const updateData: any = {};
      if (typeof req.body.shippingBill === "boolean") updateData.shippingBill = req.body.shippingBill;
      if (typeof req.body.originCertificate === "boolean") updateData.originCertificate = req.body.originCertificate;
      if (typeof req.body.conformityCertificate === "boolean") updateData.conformityCertificate = req.body.conformityCertificate;
      if (req.body.invoice !== undefined) updateData.invoice = req.body.invoice || null;

      if (req.body.moneyArrival !== undefined) {
        const newAmount = req.body.moneyArrival ? parseFloat(String(req.body.moneyArrival)) : null;
        const currency = (req.body.moneyArrivalCurrency === "CNY" || req.body.moneyArrivalCurrency === "USD")
          ? req.body.moneyArrivalCurrency : (existing.moneyArrivalCurrency || "CNY");
        updateData.moneyArrival = newAmount;
        updateData.moneyArrivalCurrency = newAmount ? currency : null;

        if (newAmount && newAmount > 0) {
          if (existing.cashboxTransactionId) {
            await storage.updateCashboxTransaction(existing.cashboxTransactionId, {
              amount: newAmount,
              currency,
              description: `وصول أموال - فاتورة ${existing.invoiceNumber}`,
            });
          } else {
            const txn = await storage.createCashboxTransaction({
              type: "income",
              category: "other",
              amount: newAmount,
              currency,
              description: `وصول أموال - فاتورة ${existing.invoiceNumber}`,
            });
            updateData.cashboxTransactionId = txn.id;
          }
        } else if (!newAmount && existing.cashboxTransactionId) {
          await storage.deleteCashboxTransaction(existing.cashboxTransactionId);
          updateData.cashboxTransactionId = null;
        }
      }

      const updated = await storage.updateContainerDocument(id, updateData);
      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.post("/api/container-documents/merge", requireAuth, async (req, res) => {
    try {
      const { docIds, groupInvoiceNumber } = req.body;
      if (!docIds || !Array.isArray(docIds) || docIds.length < 2) {
        return res.status(400).json({ message: "يجب اختيار حاويتين على الأقل" });
      }
      for (const id of docIds) {
        const doc = await storage.getContainerDocument(id);
        if (!doc) return res.status(400).json({ message: `الفاتورة ${id} غير موجودة` });
      }
      const groupId = docIds[0];
      for (const id of docIds) {
        await storage.updateContainerDocument(id, { groupInvoiceId: groupId });
      }
      if (groupInvoiceNumber) {
        await storage.updateContainerDocument(groupId, { invoiceNumber: groupInvoiceNumber });
      }
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.post("/api/container-documents/unmerge", requireAuth, async (req, res) => {
    try {
      const { docId } = req.body;
      const doc = await storage.getContainerDocument(docId);
      if (!doc || !doc.groupInvoiceId) return res.status(404).json({ message: "not found" });
      const groupId = doc.groupInvoiceId;
      const allDocs = await storage.getContainerDocuments();
      const grouped = allDocs.filter((d: any) => d.groupInvoiceId === groupId);
      for (const d of grouped) {
        await storage.updateContainerDocument(d.id, { groupInvoiceId: null });
      }
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.get("/api/suppliers/:id/account", requireAuth, async (req, res) => {
    try {
      const account = await storage.getSupplierAccount(parseInt(req.params.id));
      res.json(account);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.get("/api/warehouse-inventory", requireAuth, async (_req, res) => {
    try {
      const inventory = await storage.getWarehouseInventory();
      res.json(inventory);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.get("/api/products/:id/parts", requireAuth, async (req, res) => {
    try {
      const parts = await storage.getProductParts(parseInt(req.params.id));
      res.json(parts);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.post("/api/products/:id/parts", requireAuth, async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const parsed = insertProductPartSchema.parse({ ...req.body, productId });
      const part = await storage.createProductPart(parsed);
      res.json(part);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.delete("/api/product-parts/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteProductPart(parseInt(req.params.id));
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.post("/api/payments", requireAuth, async (req, res) => {
    try {
      const payment = await storage.createPayment(req.body);
      const allSuppliers = await storage.getSuppliers();
      const supplier = allSuppliers.find(s => s.id === payment.supplierId);
      await storage.createCashboxTransaction({
        type: "expense",
        category: "supplier",
        amount: payment.amount,
        currency: payment.currency,
        supplierId: payment.supplierId,
        paymentId: payment.id,
        description: `دفعة للمورد: ${supplier?.name || ""}${payment.note ? " - " + payment.note : ""}`,
      });
      res.json(payment);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.patch("/api/payments/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { amount, currency, note } = req.body;
      const updateData: Record<string, any> = {};
      if (amount !== undefined) updateData.amount = amount;
      if (currency !== undefined) updateData.currency = currency;
      if (note !== undefined) updateData.note = note;
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: "لا توجد بيانات للتحديث" });
      }
      const updated = await storage.updatePayment(id, updateData);
      if (!updated) return res.status(404).json({ message: "الدفعة غير موجودة" });
      const cashboxUpdate: Record<string, any> = {};
      if (amount !== undefined) cashboxUpdate.amount = amount;
      if (currency !== undefined) cashboxUpdate.currency = currency;
      if (note !== undefined) {
        const allSuppliers = await storage.getSuppliers();
        const supplier = allSuppliers.find(s => s.id === updated.supplierId);
        cashboxUpdate.description = `دفعة للمورد: ${supplier?.name || ""}${note ? " - " + note : ""}`;
      }
      await storage.updateCashboxByPaymentId(id, cashboxUpdate);
      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.delete("/api/payments/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCashboxByPaymentId(id);
      await storage.deletePayment(id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  // Cashbox
  app.get("/api/cashbox/transactions", requireAuth, async (_req, res) => {
    try {
      const txns = await storage.getCashboxTransactions();
      res.json(txns);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.get("/api/cashbox/summary", requireAuth, async (_req, res) => {
    try {
      const summary = await storage.getCashboxSummary();
      res.json(summary);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.post("/api/cashbox/transactions", requireAuth, async (req, res) => {
    try {
      const parsed = insertCashboxTransactionSchema.parse(req.body);
      const txn = await storage.createCashboxTransaction(parsed);
      res.json(txn);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.patch("/api/cashbox/transactions/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existing = await storage.getCashboxTransactions();
      const txn = existing.find((t: any) => t.id === id);
      if (txn && (txn.paymentId || txn.shippingPaymentId || txn.expenseId)) {
        return res.status(400).json({ message: "لا يمكن تعديل عملية مرتبطة بدفعة أو مصروف، قم بالتعديل من الصفحة المعنية" });
      }
      const partial = insertCashboxTransactionSchema.partial().parse(req.body);
      const updated = await storage.updateCashboxTransaction(id, partial);
      if (!updated) return res.status(404).json({ message: "العملية غير موجودة" });
      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.delete("/api/cashbox/transactions/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existing = await storage.getCashboxTransactions();
      const txn = existing.find((t: any) => t.id === id);
      if (txn && (txn.paymentId || txn.shippingPaymentId || txn.expenseId)) {
        return res.status(400).json({ message: "لا يمكن حذف عملية مرتبطة بدفعة أو مصروف، قم بالحذف من الصفحة المعنية" });
      }
      await storage.deleteCashboxTransaction(id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  // Currency Exchange in Cashbox
  app.post("/api/cashbox/exchange", requireAuth, async (req, res) => {
    try {
      const { fromCurrency, fromAmount, toCurrency, toAmount, exchangeRate, description } = req.body;
      if (!fromCurrency || !toCurrency || !fromAmount || !toAmount || !exchangeRate) {
        return res.status(400).json({ message: "جميع الحقول مطلوبة" });
      }
      if (fromCurrency === toCurrency) {
        return res.status(400).json({ message: "يجب اختيار عملتين مختلفتين" });
      }
      const rateNote = `تحويل ${parseFloat(fromAmount).toFixed(2)} ${fromCurrency === "CNY" ? "يوان" : "دولار"} → ${parseFloat(toAmount).toFixed(2)} ${toCurrency === "CNY" ? "يوان" : "دولار"} | سعر الصرف: ${exchangeRate}`;
      const descSuffix = description ? ` | ${description}` : "";
      const expenseTxn = await storage.createCashboxTransaction({
        type: "expense",
        category: "other",
        amount: parseFloat(fromAmount),
        currency: fromCurrency,
        description: rateNote + descSuffix,
      });
      const incomeTxn = await storage.createCashboxTransaction({
        type: "income",
        category: "other",
        amount: parseFloat(toAmount),
        currency: toCurrency,
        description: rateNote + descSuffix,
      });
      res.json({ expenseTxn, incomeTxn });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  // Cashbox Supplier Payment (linked to supplier accounts)
  app.post("/api/cashbox/supplier-payment", requireAuth, async (req, res) => {
    try {
      const { supplierId, amount, currency, description } = req.body;
      if (!supplierId || !amount) {
        return res.status(400).json({ message: "المورد والمبلغ مطلوبان" });
      }
      const payment = await storage.createPayment({
        supplierId: parseInt(supplierId),
        amount: parseFloat(amount),
        currency: currency || "CNY",
        note: description || null,
      });
      const allSuppliers = await storage.getSuppliers();
      const supplier = allSuppliers.find(s => s.id === payment.supplierId);
      await storage.createCashboxTransaction({
        type: "expense",
        category: "supplier",
        amount: payment.amount,
        currency: payment.currency,
        supplierId: payment.supplierId,
        paymentId: payment.id,
        description: `دفعة للمورد: ${supplier?.name || ""}${payment.note ? " - " + payment.note : ""}`,
      });
      res.json(payment);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  // Cashbox Shipping Payment (linked to shipping company accounts)
  app.post("/api/cashbox/shipping-payment", requireAuth, async (req, res) => {
    try {
      const { shippingCompanyId, amount, currency, description } = req.body;
      if (!shippingCompanyId || !amount) {
        return res.status(400).json({ message: "شركة الشحن والمبلغ مطلوبان" });
      }
      const payment = await storage.createShippingPayment({
        shippingCompanyId: parseInt(shippingCompanyId),
        amount: parseFloat(amount),
        currency: currency || "CNY",
        note: description || null,
      });
      const companies = await storage.getShippingCompanies();
      const company = companies.find(c => c.id === payment.shippingCompanyId);
      await storage.createCashboxTransaction({
        type: "expense",
        category: "shipping",
        amount: payment.amount,
        currency: payment.currency,
        shippingCompanyId: payment.shippingCompanyId,
        shippingPaymentId: payment.id,
        description: `دفعة لشركة الشحن: ${company?.name || ""}${payment.note ? " - " + payment.note : ""}`,
      });
      res.json(payment);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  // Shipping Payments
  app.post("/api/shipping-payments", requireAuth, async (req, res) => {
    try {
      const payment = await storage.createShippingPayment(req.body);
      const companies = await storage.getShippingCompanies();
      const company = companies.find(c => c.id === payment.shippingCompanyId);
      await storage.createCashboxTransaction({
        type: "expense",
        category: "shipping",
        amount: payment.amount,
        currency: payment.currency,
        shippingCompanyId: payment.shippingCompanyId,
        shippingPaymentId: payment.id,
        description: `دفعة لشركة الشحن: ${company?.name || ""}${payment.note ? " - " + payment.note : ""}`,
      });
      res.json(payment);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.patch("/api/shipping-payments/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { amount, currency, note } = req.body;
      const updateData: Record<string, any> = {};
      if (amount !== undefined) updateData.amount = amount;
      if (currency !== undefined) updateData.currency = currency;
      if (note !== undefined) updateData.note = note;
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: "لا توجد بيانات للتحديث" });
      }
      const updated = await storage.updateShippingPayment(id, updateData);
      if (!updated) return res.status(404).json({ message: "الدفعة غير موجودة" });
      const cashboxUpdate: Record<string, any> = {};
      if (amount !== undefined) cashboxUpdate.amount = amount;
      if (currency !== undefined) cashboxUpdate.currency = currency;
      if (note !== undefined) {
        const companies = await storage.getShippingCompanies();
        const company = companies.find(c => c.id === updated.shippingCompanyId);
        cashboxUpdate.description = `دفعة لشركة الشحن: ${company?.name || ""}${note ? " - " + note : ""}`;
      }
      await storage.updateCashboxByShippingPaymentId(id, cashboxUpdate);
      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.delete("/api/shipping-payments/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCashboxByShippingPaymentId(id);
      await storage.deleteShippingPayment(id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.get("/api/expenses", requireAuth, async (_req, res) => {
    try {
      const list = await storage.getExpenses();
      res.json(list);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.post("/api/expenses", requireAuth, async (req, res) => {
    try {
      const parsed = insertExpenseSchema.parse(req.body);
      const expense = await storage.createExpense(parsed);
      await storage.createCashboxTransaction({
        type: "expense",
        category: "expense",
        amount: expense.amount,
        currency: expense.currency,
        expenseId: expense.id,
        description: `مصروف: ${expense.title}${expense.description ? " - " + expense.description : ""}`,
      });
      res.json(expense);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.patch("/api/expenses/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { title, amount, currency, description } = req.body;
      const updateData: Record<string, any> = {};
      if (title !== undefined) updateData.title = title;
      if (amount !== undefined) updateData.amount = amount;
      if (currency !== undefined) updateData.currency = currency;
      if (description !== undefined) updateData.description = description;
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: "لا توجد بيانات للتحديث" });
      }
      const updated = await storage.updateExpense(id, updateData);
      if (!updated) return res.status(404).json({ message: "المصروف غير موجود" });
      const cashboxUpdate: Record<string, any> = {};
      if (amount !== undefined) cashboxUpdate.amount = amount;
      if (currency !== undefined) cashboxUpdate.currency = currency;
      cashboxUpdate.description = `مصروف: ${updated.title}${updated.description ? " - " + updated.description : ""}`;
      await storage.updateCashboxByExpenseId(id, cashboxUpdate);
      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.delete("/api/expenses/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCashboxByExpenseId(id);
      await storage.deleteExpense(id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.get("/api/admin/export-data", requireAdmin, async (_req, res) => {
    try {
      const data: Record<string, any[]> = {};
      data.users = await db.select().from(schema.users);
      data.categories = await db.select().from(schema.categories);
      data.suppliers = await db.select().from(schema.suppliers);
      data.warehouses = await db.select().from(schema.warehouses);
      data.shippingCompanies = await db.select().from(schema.shippingCompanies);
      data.products = await db.select().from(schema.products);
      data.productParts = await db.select().from(schema.productParts);
      data.orders = await db.select().from(schema.orders);
      data.orderItems = await db.select().from(schema.orderItems);
      data.deliveries = await db.select().from(schema.deliveries);
      data.deliveryItems = await db.select().from(schema.deliveryItems);
      data.containers = await db.select().from(schema.containers);
      data.containerItems = await db.select().from(schema.containerItems);
      data.containerDocuments = await db.select().from(schema.containerDocuments);
      data.payments = await db.select().from(schema.payments);
      data.shippingPayments = await db.select().from(schema.shippingPayments);
      data.cashboxTransactions = await db.select().from(schema.cashboxTransactions);
      data.userCategories = await db.select().from(schema.userCategories);
      data.expenses = await db.select().from(schema.expenses);
      data.exportDate = new Date().toISOString();

      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename=backup_${new Date().toISOString().slice(0,10)}.json`);
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/admin/import-data", requireAdmin, async (req, res) => {
    try {
      const data = req.body;
      if (!data || typeof data !== "object") {
        return res.status(400).json({ message: "بيانات غير صالحة" });
      }

      const tableMap: { key: string; table: string; columns: string[] }[] = [
        { key: "categories", table: "categories", columns: ["id", "name"] },
        { key: "suppliers", table: "suppliers", columns: ["id", "name", "phone", "address"] },
        { key: "warehouses", table: "warehouses", columns: ["id", "name"] },
        { key: "shippingCompanies", table: "shipping_companies", columns: ["id", "name", "phone", "address"] },
        { key: "users", table: "users", columns: ["id", "username", "password", "display_name", "role", "active", "created_at"] },
        { key: "products", table: "products", columns: ["id", "name", "name_zh", "quantity", "category_id", "status", "status_changed_at"] },
        { key: "productParts", table: "product_parts", columns: ["id", "product_id", "name", "quantity", "length", "width", "height", "weight", "pieces_per_carton"] },
        { key: "orders", table: "orders", columns: ["id", "supplier_id", "created_at", "confirmed"] },
        { key: "orderItems", table: "order_items", columns: ["id", "order_id", "product_id", "quantity_requested", "quantity_ordered", "price", "currency"] },
        { key: "deliveries", table: "deliveries", columns: ["id", "order_id", "supplier_id", "warehouse_id", "created_at"] },
        { key: "deliveryItems", table: "delivery_items", columns: ["id", "delivery_id", "product_id", "quantity", "price", "currency", "length", "width", "height", "weight", "pieces_per_carton"] },
        { key: "containers", table: "containers", columns: ["id", "invoice_number", "container_number", "shipping_company", "shipping_company_id", "price_cny", "price_usd", "warehouse_id", "status", "created_at"] },
        { key: "containerItems", table: "container_items", columns: ["id", "container_id", "product_id", "quantity"] },
        { key: "payments", table: "payments", columns: ["id", "supplier_id", "amount", "currency", "note", "created_at"] },
        { key: "shippingPayments", table: "shipping_payments", columns: ["id", "shipping_company_id", "amount", "currency", "note", "created_at"] },
        { key: "expenses", table: "expenses", columns: ["id", "title", "amount", "currency", "description", "created_at"] },
        { key: "cashboxTransactions", table: "cashbox_transactions", columns: ["id", "type", "category", "amount", "currency", "supplier_id", "shipping_company_id", "payment_id", "shipping_payment_id", "expense_id", "description", "created_at"] },
        { key: "containerDocuments", table: "container_documents", columns: ["id", "container_id", "invoice_number", "invoice_date", "shipping_bill", "origin_certificate", "conformity_certificate", "invoice", "money_arrival", "money_arrival_currency", "cashbox_transaction_id", "group_invoice_id", "created_at"] },
        { key: "userCategories", table: "user_categories", columns: ["id", "user_id", "category_id"] },
      ];

      const camelToSnake = (str: string) => str.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);

      const results: Record<string, number> = {};

      for (const { key, table, columns } of tableMap) {
        const rows = data[key];
        if (!rows || !Array.isArray(rows) || rows.length === 0) continue;

        let inserted = 0;
        for (const row of rows) {
          const values = columns.map((col) => {
            const camelCol = col.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
            const val = row[camelCol] !== undefined ? row[camelCol] : row[col];
            if (val === null || val === undefined) return "NULL";
            if (typeof val === "boolean") return val ? "TRUE" : "FALSE";
            if (typeof val === "number") return String(val);
            return `'${String(val).replace(/'/g, "''")}'`;
          });

          const colList = columns.map((c) => `"${c}"`).join(", ");
          const valList = values.join(", ");

          try {
            await db.execute(sql.raw(
              `INSERT INTO "${table}" (${colList}) OVERRIDING SYSTEM VALUE VALUES (${valList}) ON CONFLICT (id) DO NOTHING`
            ));
            inserted++;
          } catch (err: any) {
            console.log(`Skipped row in ${table}: ${err.message}`);
          }
        }

        if (inserted > 0) {
          results[key] = inserted;
          try {
            await db.execute(sql.raw(
              `SELECT setval('${table}_id_seq', (SELECT COALESCE(MAX(id), 0) FROM "${table}"))`
            ));
          } catch {}
        }
      }

      res.json({ success: true, results });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  return httpServer;
}
