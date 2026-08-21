import { BillingView } from './BillingView';

export function WorkspaceBillingView({ bill: initialBill, table, onBackToOrdering, onRefreshTable }) {
  return (
    <BillingView
      tableId={table?.id}
      initialBill={initialBill}
      onBack={onBackToOrdering}
      onBillSettled={onRefreshTable}
    />
  );
}
