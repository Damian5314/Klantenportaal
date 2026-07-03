import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { ALL_PERMISSIONS, ROLE_PRESETS } from "../src/config/permissions";

const prisma = new PrismaClient();

async function main() {
  console.log("Permissies aanmaken...");
  for (const key of ALL_PERMISSIONS) {
    await prisma.permission.upsert({ where: { key }, update: {}, create: { key } });
  }

  console.log("Rollen aanmaken...");
  const roles: Record<string, { id: string }> = {};
  for (const [roleName, permissionKeys] of Object.entries(ROLE_PRESETS)) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: { permissions: { set: permissionKeys.map((key) => ({ key })) } },
      create: {
        name: roleName,
        isSystem: true,
        permissions: { connect: permissionKeys.map((key) => ({ key })) },
      },
    });
    roles[roleName] = { id: role.id };
  }

  console.log("Ticketstatussen aanmaken...");
  const statusDefs = [
    { name: "Nieuw", order: 0, color: "#3b82f6", isDefault: true },
    { name: "Open", order: 1, color: "#6366f1" },
    { name: "In behandeling", order: 2, color: "#f59e0b" },
    { name: "Wacht op klant", order: 3, color: "#a855f7" },
    { name: "Wacht op leverancier", order: 4, color: "#ec4899" },
    { name: "Opgelost", order: 5, color: "#22c55e", isClosed: true },
    { name: "Gesloten", order: 6, color: "#64748b", isClosed: true },
    { name: "Geannuleerd", order: 7, color: "#ef4444", isClosed: true },
  ];
  for (const s of statusDefs) {
    await prisma.ticketStatus.upsert({ where: { name: s.name }, update: s, create: s });
  }

  console.log("Prioriteiten aanmaken...");
  const priorityDefs = [
    { name: "Laag", order: 0, color: "#22c55e" },
    { name: "Normaal", order: 1, color: "#3b82f6" },
    { name: "Hoog", order: 2, color: "#f59e0b" },
    { name: "Kritiek", order: 3, color: "#ef4444" },
  ];
  for (const p of priorityDefs) {
    await prisma.ticketPriority.upsert({ where: { name: p.name }, update: p, create: p });
  }

  console.log("Categorieën aanmaken...");
  const categoryTree: Record<string, string[]> = {
    ICT: ["Printer", "Laptop", "Netwerk", "E-mail", "Account"],
    Software: ["Bug", "Vraag", "Feature Request"],
    Administratie: ["Factuur", "Contract", "Overig"],
  };
  for (const [parentName, children] of Object.entries(categoryTree)) {
    let parent = await prisma.ticketCategory.findFirst({ where: { name: parentName, parentId: null } });
    if (!parent) parent = await prisma.ticketCategory.create({ data: { name: parentName } });
    for (const childName of children) {
      const existing = await prisma.ticketCategory.findFirst({ where: { name: childName, parentId: parent.id } });
      if (!existing) await prisma.ticketCategory.create({ data: { name: childName, parentId: parent.id } });
    }
  }

  console.log("Beheerder aanmaken...");
  const adminEmail = "admin@klantenportaal.nl";
  const adminPassword = "Admin123!";
  const adminPasswordHash = await bcrypt.hash(adminPassword, 10);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "Beheerder",
      passwordHash: adminPasswordHash,
      kind: "STAFF",
      roleId: roles.Admin.id,
    },
  });

  console.log("Voorbeeldmedewerker aanmaken...");
  const employeeEmail = "medewerker@klantenportaal.nl";
  const employeePasswordHash = await bcrypt.hash("Medewerker123!", 10);
  await prisma.user.upsert({
    where: { email: employeeEmail },
    update: {},
    create: {
      email: employeeEmail,
      name: "Eva de Vries",
      passwordHash: employeePasswordHash,
      kind: "STAFF",
      roleId: roles.Medewerker.id,
      department: "Support",
      jobTitle: "Support Engineer",
    },
  });

  console.log("Voorbeeldbedrijf en klant aanmaken...");
  const company = await prisma.company.upsert({
    where: { id: "seed-company-acme" },
    update: {},
    create: { id: "seed-company-acme", name: "Acme B.V.", email: "info@acme.nl", phone: "020-1234567" },
  });

  const contactEmail = "klant@acme.nl";
  let contact = await prisma.contact.findUnique({ where: { email: contactEmail } });
  if (!contact) {
    contact = await prisma.contact.create({
      data: { name: "Jan Janssen", email: contactEmail, companyId: company.id },
    });
  }

  const klantRole = roles.Klant;
  const contactUser = await prisma.user.findUnique({ where: { contactId: contact.id } });
  if (!contactUser) {
    const contactPasswordHash = await bcrypt.hash("Klant123!", 10);
    await prisma.user.create({
      data: {
        email: contact.email,
        name: contact.name,
        passwordHash: contactPasswordHash,
        kind: "CUSTOMER",
        roleId: klantRole.id,
        contactId: contact.id,
      },
    });
  }

  console.log("Voorbeeldticket aanmaken...");
  const defaultStatus = await prisma.ticketStatus.findFirst({ where: { isDefault: true } });
  const normalPriority = await prisma.ticketPriority.findUnique({ where: { name: "Normaal" } });
  const printerCategory = await prisma.ticketCategory.findFirst({ where: { name: "Printer" } });
  const existingTicket = await prisma.ticket.findFirst({ where: { contactId: contact.id } });
  if (!existingTicket && defaultStatus && normalPriority) {
    await prisma.ticket.create({
      data: {
        subject: "Printer op kantoor doet het niet",
        description: "De printer op de 2e verdieping geeft een foutmelding en drukt niets meer af.",
        contactId: contact.id,
        companyId: company.id,
        statusId: defaultStatus.id,
        priorityId: normalPriority.id,
        categoryId: printerCategory?.id,
        history: { create: { action: "created" } },
      },
    });
  }

  console.log("\nSeed voltooid. Inloggegevens:");
  console.log(`  Beheerder:   ${adminEmail} / ${adminPassword}`);
  console.log(`  Medewerker:  ${employeeEmail} / Medewerker123!`);
  console.log(`  Klant:       ${contactEmail} / Klant123!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
