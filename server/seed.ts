import { db } from "./db";
import { categories, suppliers, warehouses, products, users } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function seedDatabase() {
  const existingUsers = await db.select().from(users);
  if (existingUsers.length === 0) {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await db.insert(users).values({
      username: "admin",
      password: hashedPassword,
      displayName: "المدير",
      role: "admin",
    });
    console.log("Admin user created (username: admin, password: admin123)");
  }

  const existingCategories = await db.select().from(categories);
  if (existingCategories.length > 0) return;

  console.log("Seeding database...");

  await db.insert(categories).values([
    { name: "إلكترونيات" },
    { name: "ملابس" },
    { name: "أدوات منزلية" },
    { name: "قطع غيار" },
    { name: "ألعاب أطفال" },
  ]);

  await db.insert(suppliers).values([
    { name: "شركة جوانزو للتجارة", phone: "+86 20 8888 1234", address: "جوانزو، الصين" },
    { name: "مصنع شنزن للإلكترونيات", phone: "+86 755 2666 5678", address: "شنزن، الصين" },
    { name: "شركة ييوو العالمية", phone: "+86 579 8523 9012", address: "ييوو، تشجيانغ، الصين" },
  ]);

  await db.insert(warehouses).values([
    { name: "المخزن الرئيسي - جوانزو" },
    { name: "مخزن شنزن" },
  ]);

  const allCategories = await db.select().from(categories);
  const elecId = allCategories.find(c => c.name === "إلكترونيات")?.id;
  const clothId = allCategories.find(c => c.name === "ملابس")?.id;
  const homeId = allCategories.find(c => c.name === "أدوات منزلية")?.id;
  const partsId = allCategories.find(c => c.name === "قطع غيار")?.id;
  const toysId = allCategories.find(c => c.name === "ألعاب أطفال")?.id;

  await db.insert(products).values([
    { name: "شاحن لاسلكي 15W", quantity: 500, categoryId: elecId!, status: "purchase_order" },
    { name: "سماعات بلوتوث TWS", quantity: 300, categoryId: elecId!, status: "purchase_order" },
    { name: "كابل USB-C 1.5م", quantity: 1000, categoryId: elecId!, status: "purchase_order" },
    { name: "قميص قطن رجالي", quantity: 200, categoryId: clothId!, status: "purchase_order" },
    { name: "حقيبة يد نسائية", quantity: 150, categoryId: clothId!, status: "purchase_order" },
    { name: "طقم أواني طهي", quantity: 100, categoryId: homeId!, status: "purchase_order" },
    { name: "مكنسة كهربائية صغيرة", quantity: 80, categoryId: homeId!, status: "purchase_order" },
    { name: "فلتر زيت محرك", quantity: 400, categoryId: partsId!, status: "purchase_order" },
    { name: "لعبة تعليمية للأطفال", quantity: 250, categoryId: toysId!, status: "purchase_order" },
    { name: "روبوت ذكي تعليمي", quantity: 120, categoryId: toysId!, status: "purchase_order" },
  ]);

  console.log("Database seeded successfully!");
}
