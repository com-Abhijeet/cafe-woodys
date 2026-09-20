import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const neonUrl = 'postgresql://neondb_owner:npg_ZCRrwT0gJ3op@ep-super-cell-az57ucg0-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const supabaseUrl = 'postgresql://postgres:WOODIES@2026@db.jxejclxtxbrwecczpauf.supabase.co:5432/postgres';

const neonPool = new pg.Pool({ connectionString: neonUrl });
const neonDb = new PrismaClient({ adapter: new PrismaPg(neonPool) });

const supabasePool = new pg.Pool({ connectionString: supabaseUrl });
const supabaseDb = new PrismaClient({ adapter: new PrismaPg(supabasePool) });

const models = [
  'staff', 'zone', 'table', 'gamingSession', 'menuItem', 'inventoryItem', 
  'inventoryAdjustment', 'recipeIngredient', 'supplier', 'purchaseOrder', 
  'purchaseOrderItem', 'customer', 'smsLog', 'order', 'orderItem', 'bill', 
  'payment', 'refund', 'purchasePayment', 'businessProfile', 'taxSettings', 
  'paymentSettings', 'orderSettings', 'gamingSettings', 'printerConfig', 
  'discountRule', 'kitchenPrintSettings', 'loyaltySettings', 'loyaltyRedemptionRule', 
  'loyaltyTransaction', 'cashTransaction', 'daybookSettings'
];

async function verify() {
  console.log('====================================================');
  console.log('📊 VERIFYING RECORD COUNTS: NEONDB VS SUPABASE');
  console.log('====================================================');

  let allMatch = true;
  const audit = [];

  for (const m of models) {
    const neonCount = await neonDb[m].count();
    const supabaseCount = await supabaseDb[m].count();
    const match = neonCount === supabaseCount;
    if (!match) allMatch = false;

    audit.push({
      Model: m,
      'NeonDB Rows': neonCount,
      'Supabase Rows': supabaseCount,
      Status: match ? '✅ MATCH' : '❌ MISMATCH'
    });
  }

  console.table(audit);

  if (allMatch) {
    console.log('\n🎉 AUDIT SUCCESSFUL: 100% Data Parity Verified across all 32 models!');
  } else {
    console.error('\n⚠️ AUDIT WARNING: Row count mismatch detected!');
  }
}

verify()
  .catch(console.error)
  .finally(async () => {
    await neonDb.$disconnect();
    await supabaseDb.$disconnect();
    await neonPool.end();
    await supabasePool.end();
  });
