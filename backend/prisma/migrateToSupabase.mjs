import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const neonUrl = process.env.DATABASE_URL.includes('neon.tech') 
  ? process.env.DATABASE_URL 
  : 'postgresql://neondb_owner:npg_ZCRrwT0gJ3op@ep-super-cell-az57ucg0-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const supabaseUrl = process.env.SUPABASE_DIRECT_URL || process.env.DATABASE_URL;

console.log('Source DB (Neon):', neonUrl.split('@')[1] || neonUrl);
console.log('Target DB (Supabase):', supabaseUrl.split('@')[1] || supabaseUrl);

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

  const migrationSequence = [
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
    'zone',
    'table',
    'menuItem',
    'inventoryItem',
    'supplier',
    'loyaltyRedemptionRule',
    'discountRule',
    'recipeIngredient',
    'customer',
    'purchaseOrder',
    'purchaseOrderItem',
    'purchasePayment',
    'inventoryAdjustment',
    'bill',
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
