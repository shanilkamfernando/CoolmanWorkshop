import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create admin user
  const hashedPassword = await bcrypt.hash("admin123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@coolman.com" },
    update: {},
    create: {
      email: "admin@coolman.com",
      password: hashedPassword,
      firstName: "Admin",
      lastName: "User",
      role: "ADMIN",
      phone: "+1234567890",
      // Admin has access to all portals
      canAccessCustomers: true,
      canAccessProjects: true,
      canAccessCompressors: true,
      canAccessPurchasing: true,
      canAccessWorkshop: true,
      canAccessDocuments: true,
      canAccessWorklist: true,
      canAccessMeetings: true,
      canAccessStores: true,
    },
  });

  console.log("✅ Admin user created:", admin.email);
  console.log("📧 Email: admin@coolman.com");
  console.log("🔑 Password: admin123");

  // Create sample staff user
  const staffPassword = await bcrypt.hash("staff123", 12);

  const staff = await prisma.user.upsert({
    where: { email: "staff@coolman.com" },
    update: {},
    create: {
      email: "staff@coolman.com",
      password: staffPassword,
      firstName: "John",
      lastName: "Staff",
      role: "STAFF",
      phone: "+1234567891",
      // Staff has limited access
      canAccessCustomers: true,
      canAccessProjects: true,
      canAccessDocuments: true,
      canAccessWorklist: true,
    },
  });

  console.log("✅ Staff user created:", staff.email);
  console.log("📧 Email: staff@coolman.com");
  console.log("🔑 Password: staff123");

  // Create sample customer
  const customer = await prisma.customer.create({
    data: {
      name: "ABC Refrigeration",
      companyName: "ABC Corp",
      email: "contact@abc-corp.com",
      phone: "+1234567892",
      address: "123 Main Street",
      city: "New York",
      country: "USA",
      notes: "Sample customer for testing",
    },
  });

  console.log("✅ Sample customer created:", customer.name);

  console.log("\n🎉 Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
