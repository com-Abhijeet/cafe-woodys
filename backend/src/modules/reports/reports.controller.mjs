import { reportsService } from './reports.service.mjs';

export async function getSalesSummaryHandler(req, res, next) {
  try {
    const { dateFrom, dateTo, groupBy } = req.query;
    const data = await reportsService.getSalesSummary({ dateFrom, dateTo, groupBy });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getTopItemsHandler(req, res, next) {
  try {
    const { dateFrom, dateTo, limit } = req.query;
    const data = await reportsService.getTopItems({ dateFrom, dateTo, limit: limit ? parseInt(limit, 10) : 10 });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getZonePerformanceHandler(req, res, next) {
  try {
    const { dateFrom, dateTo } = req.query;
    const data = await reportsService.getZonePerformance({ dateFrom, dateTo });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getStaffPerformanceHandler(req, res, next) {
  try {
    const { dateFrom, dateTo } = req.query;
    const data = await reportsService.getStaffPerformance({ dateFrom, dateTo });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getPaymentMethodsHandler(req, res, next) {
  try {
    const { dateFrom, dateTo } = req.query;
    const data = await reportsService.getPaymentMethodsBreakdown({ dateFrom, dateTo });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
