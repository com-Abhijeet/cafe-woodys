import { PrismaClient } from '@prisma/client';

/**
 * Migration Utility: Copies Master Data (Menu, Zones/Tables, Settings, Profile, Printers, Inventory)
 * from Source Database (NeonDB) to Target Database (Supabase)
 *
 * Usage:
 *   SOURCE_URL="postgresql://neon..." TARGET_URL="postgresql://supabase..." node prisma/migrateMasterData.mjs
 */

async function migrateMasterData() {
  const sourceUrl = process.env.SOURCE_URL;
  const targetUrl = process.env.TARGET_URL || process.env.DATABASE_URL;

  if (!sourceUrl || !targetUrl) {
    console.error('❌ Error: Both SOURCE_URL and TARGET_URL must be provided.');
    console.log('Example command:');
    console.log('  SOURCE_URL="postgresql://user:pass@neon.tech/db" TARGET_URL="postgresql://postgres:pass@supabase.com:5432/postgres" node prisma/migrateMasterData.mjs');
    process.exit(1);
  }

  console.log('🚀 Starting Master Data Migration from Source DB to Target DB...');

  const sourcePrisma = new PrismaClient({ datasources: { db: { url: sourceUrl } } });
  const targetPrisma = new PrismaClient({ datasources: { db: { url: targetUrl } } });

  try {
    // 1. Business Profile
    console.log('📦 Migrating Business Profile...');
    const profiles = await sourcePrisma.businessProfile.findMany({});
    for (const p of profiles) {
      await targetPrisma.businessProfile.upsert({
        where: { id: p.id },
        update: p,
        create: p
      });
    }

    // 2. Settings Modules
    console.log('📦 Migrating Settings Modules...');
    const taxSettings = await sourcePrisma.taxSettings.findMany({});
    for (const s of taxSettings) await targetPrisma.taxSettings.upsert({ where: { id: s.id }, update: s, create: s });

    const paymentSettings = await sourcePrisma.paymentSettings.findMany({});
    for (const s of paymentSettings) await targetPrisma.paymentSettings.upsert({ where: { id: s.id }, update: s, create: s });

    const orderSettings = await sourcePrisma.orderSettings.findMany({});
    for (const s of orderSettings) await targetPrisma.orderSettings.upsert({ where: { id: s.id }, update: s, create: s });

    const gamingSettings = await sourcePrisma.gamingSettings.findMany({});
    for (const s of gamingSettings) await targetPrisma.gamingSettings.upsert({ where: { id: s.id }, update: s, create: s });

    const kitchenSettings = await sourcePrisma.kitchenPrintSettings.findMany({});
    for (const s of kitchenSettings) await targetPrisma.kitchenPrintSettings.upsert({ where: { id: s.id }, update: s, create: s });

    const loyaltySettings = await sourcePrisma.loyaltySettings.findMany({});
    for (const s of loyaltySettings) await targetPrisma.loyaltySettings.upsert({ where: { id: s.id }, update: s, create: s });

    const daybookSettings = await sourcePrisma.daybookSettings.findMany({});
    for (const s of daybookSettings) await targetPrisma.daybookSettings.upsert({ where: { id: s.id }, update: s, create: s });

    // 3. Printer Configs
    console.log('📦 Migrating Printer Configurations...');
    const printers = await sourcePrisma.printerConfig.findMany({});
    for (const pr of printers) {
      await targetPrisma.printerConfig.upsert({
        where: { id: pr.id },
        update: pr,
        create: pr
      });
    }

    // 4. Zones & Tables
    console.log('📦 Migrating Zones & Tables...');
    const zones = await sourcePrisma.zone.findMany({ include: { tables: true } });
    for (const z of zones) {
      const { tables, ...zoneData } = z;
      await targetPrisma.zone.upsert({
        where: { id: z.id },
        update: zoneData,
        create: zoneData
      });
      for (const t of tables) {
        await targetPrisma.table.upsert({
          where: { id: t.id },
          update: { ...t, status: 'FREE' },
          create: { ...t, status: 'FREE' }
        });
      }
    }

    // 5. Menu Items
    console.log('📦 Migrating Menu Items...');
    const menuItems = await sourcePrisma.menuItem.findMany({});
    for (const m of menuItems) {
      await targetPrisma.menuItem.upsert({
        where: { id: m.id },
        update: m,
        create: m
      });
    }

    // 6. Inventory Items & Suppliers
    console.log('📦 Migrating Inventory & Suppliers...');
    const suppliers = await sourcePrisma.supplier.findMany({});
    for (const sup of suppliers) {
      await targetPrisma.supplier.upsert({ where: { id: sup.id }, update: sup, create: sup });
    }

    const invItems = await sourcePrisma.inventoryItem.findMany({});
    for (const inv of invItems) {
      await targetPrisma.inventoryItem.upsert({ where: { id: inv.id }, update: inv, create: inv });
    }

    // 7. Staff Accounts
    console.log('📦 Migrating Staff Accounts...');
    const staffList = await sourcePrisma.staff.findMany({});
    for (const st of staffList) {
      await targetPrisma.staff.upsert({ where: { id: st.id }, update: st, create: st });
    }

    console.log('🎉 Master Data Migration Successfully Completed!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await sourcePrisma.$disconnect();
    await targetPrisma.$disconnect();
  }
}

migrateMasterData();
