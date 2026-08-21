import express from 'express';
import cors from 'cors';
import authRoutes from './modules/auth/auth.routes.mjs';
import zoneRoutes from './modules/zone/zone.routes.mjs';
import tableRoutes from './modules/table/table.routes.mjs';
import gamingSessionRoutes from './modules/gaming-session/gaming-session.routes.mjs';
import menuItemRoutes from './modules/menu-item/menu-item.routes.mjs';
import orderRoutes from './modules/order/order.routes.mjs';
import billingRoutes from './modules/billing/billing.routes.mjs';
import inventoryRoutes from './modules/inventory/inventory.routes.mjs';
import recipeRoutes from './modules/recipe/recipe.routes.mjs';
import supplierRoutes from './modules/supplier/supplier.routes.mjs';
import purchaseRoutes from './modules/purchase/purchase.routes.mjs';
import smsRoutes from './modules/sms/sms.routes.mjs';
import customerRoutes from './modules/customer/customer.routes.mjs';
import paymentRoutes from './modules/payment/payment.routes.mjs';
import businessProfileRoutes from './modules/business-profile/business-profile.routes.mjs';
import discountRuleRoutes from './modules/discount-rule/discount-rule.routes.mjs';
import printerRoutes from './modules/printer/printer.routes.mjs';
import kitchenPrintSettingsRoutes from './modules/kitchen-print-settings/kitchen-print-settings.routes.mjs';
import exportRoutes from './modules/export/export.routes.mjs';
import reportsRoutes from './modules/reports/reports.routes.mjs';
import { errorHandler } from './shared/middleware/error-handler.mjs';

const app = express();

app.use(cors());
app.use(express.json());

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({ data: { status: 'ok', timestamp: new Date().toISOString() } });
});

// Domain Routes
app.use('/api/auth', authRoutes);
app.use('/api/zones', zoneRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/tables/:tableId/gaming-sessions', gamingSessionRoutes);
app.use('/api/menu-items', menuItemRoutes);
app.use('/api/inventory-items', inventoryRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api', exportRoutes); // Mounted before billingRoutes so /bills/export takes precedence over /bills/:id
app.use('/api', purchaseRoutes);
app.use('/api', orderRoutes);
app.use('/api', paymentRoutes);
app.use('/api', recipeRoutes);
app.use('/api', smsRoutes);
app.use('/api', billingRoutes);
app.use('/api', businessProfileRoutes);
app.use('/api', discountRuleRoutes);
app.use('/api', printerRoutes);
app.use('/api', kitchenPrintSettingsRoutes);
app.use('/api', reportsRoutes);

// Centralized error handling
app.use(errorHandler);

export default app;
