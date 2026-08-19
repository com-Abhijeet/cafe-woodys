export function formatInvoiceNumber(invoiceNumber, financialYear) {
  if (invoiceNumber == null) return '';
  const fy = financialYear || '2025-26';
  const parts = fy.split('-');
  const startYear = parts[0] || '2025';
  const endYearShort = parts[1] || '26';
  const compact = startYear.slice(-2) + endYearShort;
  return `inv-${compact}-0${invoiceNumber}`;
}
