import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, timestamp, pgEnum, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const userRoleEnum = pgEnum("user_role", ["admin", "user", "warehouse"]);

export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name").notNull(),
  role: userRoleEnum("role").notNull().default("user"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const productStatusEnum = pgEnum("product_status", [
  "purchase_order",
  "ordered",
  "received",
  "semi_manufactured",
  "shipping",
  "arrived",
]);

export const currencyEnum = pgEnum("currency", ["CNY", "USD"]);

export const categories = pgTable("categories", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
});

export const suppliers = pgTable("suppliers", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  phone: text("phone"),
  address: text("address"),
});

export const shippingCompanies = pgTable("shipping_companies", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  phone: text("phone"),
  address: text("address"),
});

export const warehouses = pgTable("warehouses", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
});

export const products = pgTable("products", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  nameZh: text("name_zh"),
  quantity: integer("quantity").notNull().default(0),
  categoryId: integer("category_id").references(() => categories.id),
  status: productStatusEnum("status").notNull().default("purchase_order"),
  statusChangedAt: timestamp("status_changed_at").defaultNow(),
});

export const productParts = pgTable("product_parts", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  productId: integer("product_id").references(() => products.id).notNull(),
  name: text("name").notNull(),
  quantity: integer("quantity").notNull().default(0),
  length: real("length"),
  width: real("width"),
  height: real("height"),
  weight: real("weight"),
  piecesPerCarton: integer("pieces_per_carton"),
});

export const orders = pgTable("orders", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  supplierId: integer("supplier_id").references(() => suppliers.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  confirmed: text("confirmed").notNull().default("pending"),
});

export const orderItems = pgTable("order_items", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  quantityRequested: integer("quantity_requested").notNull(),
  quantityOrdered: integer("quantity_ordered").notNull(),
  price: real("price").notNull().default(0),
  currency: currencyEnum("currency").notNull().default("CNY"),
});

export const deliveries = pgTable("deliveries", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  orderId: integer("order_id").references(() => orders.id),
  supplierId: integer("supplier_id").references(() => suppliers.id).notNull(),
  warehouseId: integer("warehouse_id").references(() => warehouses.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const deliveryItems = pgTable("delivery_items", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  deliveryId: integer("delivery_id").references(() => deliveries.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull(),
  price: real("price").notNull().default(0),
  currency: currencyEnum("currency").notNull().default("CNY"),
  length: real("length"),
  width: real("width"),
  height: real("height"),
  weight: real("weight"),
  piecesPerCarton: integer("pieces_per_carton"),
});

export const containers = pgTable("containers", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  invoiceNumber: text("invoice_number"),
  containerNumber: text("container_number"),
  shippingCompany: text("shipping_company"),
  shippingCompanyId: integer("shipping_company_id").references(() => shippingCompanies.id),
  priceCNY: real("price_cny").default(0),
  priceUSD: real("price_usd").default(0),
  warehouseId: integer("warehouse_id").references(() => warehouses.id),
  status: text("status").notNull().default("shipping"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const containerItems = pgTable("container_items", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  containerId: integer("container_id").references(() => containers.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull(),
});

export const userCategories = pgTable("user_categories", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").references(() => users.id).notNull(),
  categoryId: integer("category_id").references(() => categories.id).notNull(),
});

export const payments = pgTable("payments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  supplierId: integer("supplier_id").references(() => suppliers.id).notNull(),
  amount: real("amount").notNull(),
  currency: currencyEnum("currency").notNull().default("CNY"),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const shippingPayments = pgTable("shipping_payments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  shippingCompanyId: integer("shipping_company_id").references(() => shippingCompanies.id).notNull(),
  amount: real("amount").notNull(),
  currency: currencyEnum("currency").notNull().default("CNY"),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const expenses = pgTable("expenses", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  title: text("title").notNull(),
  amount: real("amount").notNull(),
  currency: currencyEnum("currency").notNull().default("CNY"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const cashboxTransactionTypeEnum = pgEnum("cashbox_transaction_type", ["income", "expense"]);
export const cashboxCategoryEnum = pgEnum("cashbox_category", ["supplier", "shipping", "other", "expense"]);

export const cashboxTransactions = pgTable("cashbox_transactions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  type: cashboxTransactionTypeEnum("type").notNull(),
  category: cashboxCategoryEnum("category").notNull().default("other"),
  amount: real("amount").notNull(),
  currency: currencyEnum("currency").notNull().default("CNY"),
  supplierId: integer("supplier_id").references(() => suppliers.id),
  shippingCompanyId: integer("shipping_company_id").references(() => shippingCompanies.id),
  paymentId: integer("payment_id").references(() => payments.id),
  shippingPaymentId: integer("shipping_payment_id").references(() => shippingPayments.id),
  expenseId: integer("expense_id").references(() => expenses.id),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const containerDocuments = pgTable("container_documents", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  containerId: integer("container_id").references(() => containers.id).notNull(),
  invoiceNumber: text("invoice_number"),
  invoiceDate: timestamp("invoice_date"),
  shippingBill: boolean("shipping_bill").default(false),
  originCertificate: boolean("origin_certificate").default(false),
  conformityCertificate: boolean("conformity_certificate").default(false),
  invoice: text("invoice"),
  moneyArrival: real("money_arrival"),
  moneyArrivalCurrency: currencyEnum("money_arrival_currency").default("CNY"),
  cashboxTransactionId: integer("cashbox_transaction_id"),
  groupInvoiceId: integer("group_invoice_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertContainerDocumentSchema = createInsertSchema(containerDocuments).omit({ id: true, createdAt: true });

export const insertProductPartSchema = createInsertSchema(productParts).omit({ id: true });
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true });
export const insertSupplierSchema = createInsertSchema(suppliers).omit({ id: true });
export const insertShippingCompanySchema = createInsertSchema(shippingCompanies).omit({ id: true });
export const insertWarehouseSchema = createInsertSchema(warehouses).omit({ id: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true, statusChangedAt: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true });
export const insertOrderItemSchema = createInsertSchema(orderItems).omit({ id: true });
export const insertDeliverySchema = createInsertSchema(deliveries).omit({ id: true, createdAt: true });
export const insertDeliveryItemSchema = createInsertSchema(deliveryItems).omit({ id: true });
export const insertContainerSchema = createInsertSchema(containers).omit({ id: true, createdAt: true });
export const insertContainerItemSchema = createInsertSchema(containerItems).omit({ id: true });
export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true, createdAt: true });
export const insertShippingPaymentSchema = createInsertSchema(shippingPayments).omit({ id: true, createdAt: true });
export const insertExpenseSchema = createInsertSchema(expenses).omit({ id: true, createdAt: true });

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type Supplier = typeof suppliers.$inferSelect;
export type InsertShippingCompany = z.infer<typeof insertShippingCompanySchema>;
export type ShippingCompany = typeof shippingCompanies.$inferSelect;
export type InsertWarehouse = z.infer<typeof insertWarehouseSchema>;
export type Warehouse = typeof warehouses.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertDelivery = z.infer<typeof insertDeliverySchema>;
export type Delivery = typeof deliveries.$inferSelect;
export type InsertDeliveryItem = z.infer<typeof insertDeliveryItemSchema>;
export type DeliveryItem = typeof deliveryItems.$inferSelect;
export type InsertContainer = z.infer<typeof insertContainerSchema>;
export type Container = typeof containers.$inferSelect;
export type InsertContainerItem = z.infer<typeof insertContainerItemSchema>;
export type ContainerItem = typeof containerItems.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertShippingPayment = z.infer<typeof insertShippingPaymentSchema>;
export type ShippingPayment = typeof shippingPayments.$inferSelect;

export type InsertProductPart = z.infer<typeof insertProductPartSchema>;
export type ProductPart = typeof productParts.$inferSelect;

export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expenses.$inferSelect;

export const insertCashboxTransactionSchema = createInsertSchema(cashboxTransactions).omit({ id: true, createdAt: true });
export type InsertCashboxTransaction = z.infer<typeof insertCashboxTransactionSchema>;
export type CashboxTransaction = typeof cashboxTransactions.$inferSelect;

export const insertUserCategorySchema = createInsertSchema(userCategories).omit({ id: true });
export type InsertUserCategory = z.infer<typeof insertUserCategorySchema>;
export type UserCategory = typeof userCategories.$inferSelect;

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, active: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertContainerDocument = z.infer<typeof insertContainerDocumentSchema>;
export type ContainerDocument = typeof containerDocuments.$inferSelect;
