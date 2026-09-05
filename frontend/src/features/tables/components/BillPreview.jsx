import { BillingView } from '../../billing/components/BillingView';

export function BillPreview({ table, initialBill = null, onBackToOrdering, onRefreshTable, onBillSettled }) {
  return (
    <BillingView
      tableId={table?.id}
      initialBill={initialBill}
      onBack={onBackToOrdering}
      onBillSettled={(bill) => {
        if (onBillSettled) onBillSettled(bill);
        if (onRefreshTable) onRefreshTable(bill);
      }}
    />
  );
}
