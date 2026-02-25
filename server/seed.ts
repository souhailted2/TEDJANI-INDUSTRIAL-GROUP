import bcrypt from "bcryptjs";
import { db } from "./db";
import { companies, transfers, expenseCategories, memberTypes } from "@shared/schema";
import { log } from "./index";

export async function seedDatabase() {
  const existing = await db.select().from(companies);
  if (existing.length > 0) {
    const existingCats = await db.select().from(expenseCategories);
    if (existingCats.length === 0) {
      await db.insert(expenseCategories).values([
        { name: "مصاريف المصنع" },
        { name: "مصاريف العمال" },
        { name: "مصاريف أخرى" },
      ]);
      log("Seeded default expense categories");
    }
    log("Database already seeded, skipping");
    return;
  }

  log("Seeding database...");

  const hash = (pw: string) => bcrypt.hashSync(pw, 10);

  await db.insert(companies).values({
    name: "الشركة الأم المركزية",
    username: "admin",
    password: hash("admin123"),
    phone: "966500000000",
    balance: "0",
    debtToParent: "0",
    isParent: true,
  });

  const [company1] = await db.insert(companies).values({
    name: "شركة النور للتجارة",
    username: "alnoor",
    password: hash("1234"),
    phone: "966501111111",
    balance: "25000",
    debtToParent: "-5000",
    isParent: false,
  }).returning();

  const [company2] = await db.insert(companies).values({
    name: "شركة الأمل للمقاولات",
    username: "alamal",
    password: hash("1234"),
    phone: "966502222222",
    balance: "18000",
    debtToParent: "5000",
    isParent: false,
  }).returning();

  const [company3] = await db.insert(companies).values({
    name: "شركة الرياض للتقنية",
    username: "alriyadh",
    password: hash("1234"),
    phone: "966503333333",
    balance: "32000",
    debtToParent: "-8500",
    isParent: false,
  }).returning();

  const [company4] = await db.insert(companies).values({
    name: "شركة الخليج للاستثمار",
    username: "alkhaleej",
    password: hash("1234"),
    phone: "966504444444",
    balance: "45000",
    debtToParent: "8500",
    isParent: false,
  }).returning();

  await db.insert(transfers).values([
    {
      fromCompanyId: company1.id,
      toCompanyId: company2.id,
      amount: "5000",
      status: "approved",
      note: "دفعة مستحقة عن عقد توريد",
    },
    {
      fromCompanyId: company3.id,
      toCompanyId: company4.id,
      amount: "8500",
      status: "approved",
      note: "سداد فاتورة خدمات",
    },
    {
      fromCompanyId: company3.id,
      toCompanyId: company1.id,
      amount: "12000",
      status: "pending",
      note: "تحويل ربع سنوي",
    },
    {
      fromCompanyId: company4.id,
      toCompanyId: company3.id,
      amount: "3000",
      status: "rejected",
      note: "تحويل تجريبي",
    },
    {
      fromCompanyId: company1.id,
      toCompanyId: company4.id,
      amount: "15000",
      status: "pending",
      note: "دفعة استثمارية",
    },
  ]);

  await db.insert(expenseCategories).values([
    { name: "مصاريف المصنع" },
    { name: "مصاريف العمال" },
    { name: "مصاريف أخرى" },
  ]);

  log("Database seeded successfully");
}
