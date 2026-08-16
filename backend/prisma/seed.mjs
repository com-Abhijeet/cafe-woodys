import bcrypt from 'bcrypt';
import prisma from '../src/shared/db/client.mjs';

async function seed() {
  console.log('🌱 Seeding database...');

  // 1. Seed Admin
  const adminUsername = 'admin';
  const defaultPassword = 'admin123';

  let admin = await prisma.staff.findUnique({
    where: { username: adminUsername }
  });

  if (!admin) {
    const passwordHash = await bcrypt.hash(defaultPassword, 10);
    admin = await prisma.staff.create({
      data: {
        username: adminUsername,
        passwordHash,
        role: 'ADMIN',
        isActive: true
      }
    });
    console.log('✅ Default Admin user created!');
  }

  // 2. Seed Zones & Tables if none exist
  const zoneCount = await prisma.zone.count();
  if (zoneCount === 0) {
    console.log('🌱 Seeding default zones and tables...');

    // Café Zone
    const cafeZone = await prisma.zone.create({
      data: {
        name: 'Main Café Floor',
        type: 'CAFE',
        tables: {
          create: [
            { name: 'Table T1', capacity: 2 },
            { name: 'Table T2', capacity: 4 },
            { name: 'Table T3', capacity: 4 },
            { name: 'Table T4', capacity: 6 },
            { name: 'VIP Booth T5', capacity: 6 }
          ]
        }
      }
    });
    console.log(`✅ Created ${cafeZone.name} with 5 café tables`);

    // Gaming Zone
    const gamingZone = await prisma.zone.create({
      data: {
        name: 'PlayStation & Console Arena',
        type: 'GAMING',
        defaultHalfHourRate: 5000, // ₹50 / 30 mins
        defaultHourlyRate: 9000,   // ₹90 / 60 mins
        defaultMaxPlayers: 4,
        tables: {
          create: [
            { name: 'PS5 Station G1 (4K OLED)', capacity: 4 },
            { name: 'PS5 Station G2', capacity: 4 },
            { name: 'Xbox Station G3', capacity: 4 },
            { name: 'VIP VR Station G4', capacity: 2, halfHourRate: 7500, hourlyRate: 14000, maxPlayers: 2 }
          ]
        }
      }
    });
    console.log(`✅ Created ${gamingZone.name} with 4 gaming stations`);
  }

  // 3. Seed Menu Items if none exist
  const menuItemCount = await prisma.menuItem.count();
  if (menuItemCount === 0) {
    console.log('🌱 Seeding default menu items...');
    await prisma.menuItem.createMany({
      data: [
        { name: 'Signature Cold Coffee', category: 'Beverages', price: 12000, description: 'Creamy blended espresso with vanilla ice cream', isAvailable: true },
        { name: 'Iced Hazelnut Latte', category: 'Beverages', price: 14000, description: 'Rich espresso with milk & hazelnut syrup', isAvailable: true },
        { name: 'Classic Americano', category: 'Beverages', price: 9000, description: 'Double shot espresso over hot water', isAvailable: true },
        { name: 'Peri Peri Crispy Fries', category: 'Snacks', price: 11000, description: 'Hand-cut potato fries tossed in spicy peri peri seasoning', isAvailable: true },
        { name: 'Loaded Cheese Nachos', category: 'Snacks', price: 16000, description: 'Tortilla chips topped with jalapenos, salsa & warm melted cheese', isAvailable: true },
        { name: 'Woody Double Cheese Burger', category: 'Burgers & Pizza', price: 22000, description: 'Juicy patty, cheddar cheese, caramelized onions & special sauce', isAvailable: true },
        { name: 'Classic Margherita Pizza 9"', category: 'Burgers & Pizza', price: 28000, description: 'Fresh mozzarella, basil & rich tomato basil sauce', isAvailable: true },
        { name: 'Chocolate Sizzler Brownie', category: 'Desserts', price: 18000, description: 'Hot walnut brownie with vanilla ice cream & sizzled chocolate fudge', isAvailable: true }
      ]
    });
    console.log('✅ Created 8 default menu items across 4 categories');
  }

  // 4. Seed Inventory Items if none exist
  const inventoryCount = await prisma.inventoryItem.count();
  if (inventoryCount === 0) {
    console.log('🌱 Seeding raw material inventory items...');
    await prisma.inventoryItem.createMany({
      data: [
        { name: 'Espresso Dark Roast Coffee Beans', unit: 'KG', stockQuantity: 15.5, reorderThreshold: 5.0, costPerUnit: 80000 },
        { name: 'Whole Cream Fresh Milk', unit: 'L', stockQuantity: 8.0, reorderThreshold: 10.0, costPerUnit: 6500 }, // Low stock!
        { name: 'Vanilla Flavoring Syrup', unit: 'L', stockQuantity: 4.5, reorderThreshold: 2.0, costPerUnit: 45000 },
        { name: 'Cut Frozen Potato Fries', unit: 'KG', stockQuantity: 20.0, reorderThreshold: 8.0, costPerUnit: 14000 },
        { name: 'Cheddar Cheese Slices', unit: 'PCS', stockQuantity: 50.0, reorderThreshold: 20.0, costPerUnit: 1200 },
        { name: 'Artisan Burger Buns', unit: 'PCS', stockQuantity: 12.0, reorderThreshold: 15.0, costPerUnit: 1500 } // Low stock!
      ]
    });
    console.log('✅ Created 6 default inventory items with low-stock test flags');
  }

  // 5. Seed Suppliers if none exist
  const supplierCount = await prisma.supplier.count();
  if (supplierCount === 0) {
    console.log('🌱 Seeding default suppliers...');
    await prisma.supplier.createMany({
      data: [
        { name: 'Woody Dairy & Beverage Distributors', phone: '+91 98765 43210', address: 'Plot 42, Main Market Rd' },
        { name: 'Prime Fresh Bakery & Frozen Foods', phone: '+91 91234 56789', address: 'Unit 12, Industrial Estate' }
      ]
    });
    console.log('✅ Created 2 default suppliers');
  }

  console.log('🎉 Seeding complete!');
}

seed()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
