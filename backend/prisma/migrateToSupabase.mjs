import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const neonUrl = 'postgresql://neondb_owner:npg_ZCRrwT0gJ3op@ep-super-cell-az57ucg0-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const supabaseUrl = 'postgresql://postgres:WOODIES@2026@db.jxejclxtxbrwecczpauf.supabase.co:5432/postgres';

// Source connection (Neon DB) - READ ONLY
const neonPool = new pg.Pool({ connectionString: neonUrl });
const neonAdapter = new PrismaPg(neonPool);
const neonDb = new PrismaClient({ adapter: neonAdapter });

// Target connection (Supabase DB) - WRITE ONLY
const supabasePool = new pg.Pool({ connectionString: supabaseUrl });
const supabaseAdapter = new PrismaPg(supabasePool);
const supabaseDb = new PrismaClient({ adapter: supabaseAdapter });

// Helper to convert Decimal objects to string for Prisma insert
function sanitizeRow(row) {
  if (!row) return row;
  const newRow = { ...row };
  for (const key of Object.keys(newRow)) {
    const val = newRow[key];
    if (val !== null && typeof val === 'object' && val.s !== undefined && val.e !== undefined && val.c !== undefined) {
      // It's a Prisma.Decimal instance
      newRow[key] = val.toString();
    }
  }
  return newRow;
}

async function migrateModel(modelName) {
  console.log(`\n📦 Migrating ${modelName}...`);
  const records = await neonDb[modelName].findMany();
  console.log(`   Found ${records.length} records in NeonDB.`);

  if (records.length === 0) {
    console.log(`   Skipping ${modelName} (0 records).`);
    return 0;
  }

  const sanitized = records.map(sanitizeRow);

  // Clear target model first if any leftover data exists on Supabase (idempotent migration)
  await supabaseDb[modelName].deleteMany();

  // Insert in batches of 100
  const batchSize = 100;
  for (let i = 0; i < sanitized.length; i += batchSize) {
    const batch = sanitized.slice(i, i + batchSize);
    await supabaseDb[modelName].createMany({
      data: batch,
      skipDuplicates: true
    });
  }

  const targetCount = await supabaseDb[modelName].count();
  console.log(`   ✅ Migrated ${targetCount}/${records.length} records into Supabase.`);
  return targetCount;
}

async function runFullMigration() {
  console.log('====================================================');
  console.log('🚀 STARTING FULL DATA MIGRATION (NEONDB -> SUPABASE)');
  console.log('====================================================');

  // Ordered strictly by foreign key dependency hierarchy
  const migrationSequence = [
    // 1. Singletons & Base Settings
    'businessProfile',
    'taxSettings',
    'paymentSettings',
    'orderSettings',
    'gamingSettings',
    'kitchenPrintSettings',
    'loyaltySettings',
    'daybookSettings',
    'printerConfig',
    'staff',

    // 2. Base Catalog & Structure
    'zone',
    'table',
    'menuItem',
    'inventoryItem',
    'supplier',
    'loyaltyRedemptionRule',
    'discountRule',

    // 3. Child Masters & CRM
    'recipeIngredient',
    'customer',

    // 4. Purchasing & Stock
    'purchaseOrder',
    'purchaseOrderItem',
    'purchasePayment',
    'inventoryAdjustment',

    // 5. Billing & Sales Transactions
    'bill',               // Bills inserted before Orders & GamingSessions so billId FKs resolve cleanly
    'order',
    'orderItem',
    'gamingSession',
    'payment',
    'refund',
    'loyaltyTransaction',
    'cashTransaction',
    'smsLog'
  ];

  const results = {};

  for (const model of migrationSequence) {
    try {
      results[model] = await migrateModel(model);
    } catch (err) {
      console.error(`❌ Migration failed for model "${model}":`, err.message);
      throw err;
    }
  }

  console.log('\n====================================================');
  console.log('🎉 FULL DATA MIGRATION COMPLETE!');
  console.log('====================================================');
  console.log(JSON.stringify(results, null, 2));
}

runFullMigration()
  .catch(err => {
    console.error('\n💥 Migration script fatal error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await neonDb.$disconnect();
    await supabaseDb.$disconnect();
    await neonPool.end();
    await supabasePool.end();
  });
