import { exportService } from './export.service.mjs';

export async function exportBillsCsvHandler(req, res, next) {
  try {
    const { dateFrom, dateTo } = req.query;
    const csvData = await exportService.exportBillsCsv({ dateFrom, dateTo });

    const filename = `bills_export_${dateFrom || 'all'}_to_${dateTo || 'today'}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvData);
  } catch (err) {
    next(err);
  }
}

export async function exportPurchasesCsvHandler(req, res, next) {
  try {
    const { dateFrom, dateTo } = req.query;
    const csvData = await exportService.exportPurchasesCsv({ dateFrom, dateTo });

    const filename = `purchases_export_${dateFrom || 'all'}_to_${dateTo || 'today'}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvData);
  } catch (err) {
    next(err);
  }
}
