import { useState } from 'react';
import { useReports } from '../hooks/useReports';
import { Input } from '../../../components/ui/Input/Input';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { Calendar, BarChart3, TrendingUp, Trophy, PieChart as PieIcon, Users, AlertCircle, ShoppingBag, Utensils, Receipt } from 'lucide-react';
import styles from './ReportsDashboard.module.css';

const PIE_COLORS = ['#2E7D4F', '#3B6EC9', '#C97A3B', '#8E44AD', '#E74C3C'];

export function ReportsDashboard() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [groupBy, setGroupBy] = useState('day');

  const {
    salesSummary,
    totalOrders,
    dineInOrders,
    parcelOrders,
    topItems,
    zonePerformance,
    staffPerformance,
    paymentMethods,
    isLoading,
    error
  } = useReports({ dateFrom, dateTo, groupBy });

  // Format Sales Data for Recharts (convert paise to ₹)
  const chartSalesData = salesSummary.map((item) => ({
    period: item.period,
    Food: Number((item.foodTotal / 100).toFixed(2)),
    Gaming: Number((item.gamingTotal / 100).toFixed(2)),
    Total: Number((item.grandTotal / 100).toFixed(2)),
    Bills: item.billCount
  }));

  // Format Payment Methods Data for Pie Chart
  const piePaymentData = paymentMethods.map((p) => ({
    name: p.method,
    value: Number((p.totalAmount / 100).toFixed(2)),
    count: p.count
  }));

  // Format Zone Data for Bar Chart
  const barZoneData = zonePerformance.map((z) => ({
    name: z.zoneName,
    Food: Number((z.foodRevenue / 100).toFixed(2)),
    Gaming: Number((z.gamingRevenue / 100).toFixed(2)),
    Total: Number((z.totalRevenue / 100).toFixed(2))
  }));

  return (
    <div className={styles.container}>
      {/* Header & Date Bar */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Reports & Business Analytics</h2>
          <p className={styles.subtitle}>Track revenue trends, best-selling dishes, zone occupancy, staff performance, and order volumes</p>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className={styles.filterBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={18} color="var(--color-brand)" />
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-secondary)' }}>Filter Range:</span>
        </div>

        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          placeholder="From Date"
          style={{ fontSize: 'var(--text-xs)', padding: '6px 10px' }}
        />

        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>to</span>

        <Input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          placeholder="To Date"
          style={{ fontSize: 'var(--text-xs)', padding: '6px 10px' }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-secondary)' }}>Group By:</span>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value)}
            className={styles.selectInput}
          >
            <option value="day">Daily</option>
            <option value="week">Weekly</option>
            <option value="month">Monthly</option>
          </select>
        </div>

        {(dateFrom || dateTo) && (
          <button
            onClick={() => { setDateFrom(''); setDateTo(''); }}
            style={{ background: 'none', border: 'none', color: 'var(--color-danger)', fontSize: 'var(--text-xs)', fontWeight: 700, cursor: 'pointer' }}
          >
            Clear Dates
          </button>
        )}
      </div>

      {/* Step 7: Order Count Summary Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)' }}>
        <div style={{ padding: '16px', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Receipt size={32} color="var(--color-brand)" />
          <div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-brand)' }}>{totalOrders}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Total Orders Fulfilled</div>
          </div>
        </div>

        <div style={{ padding: '16px', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Utensils size={32} color="var(--color-primary)" />
          <div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-primary)' }}>{dineInOrders}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Dine-In Table Orders</div>
          </div>
        </div>

        <div style={{ padding: '16px', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ShoppingBag size={32} color="var(--color-success)" />
          <div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-success)' }}>{parcelOrders}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Parcel / Takeaway Orders</div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Loading analytics dashboard...</p>
      ) : error ? (
        <div className={styles.errorMessage}><AlertCircle size={16} /> {error}</div>
      ) : (
        <div className={styles.dashboardGrid}>
          {/* Chart 1: Revenue Trends over Time */}
          <div className={styles.chartCard} style={{ gridColumn: 'span 2' }}>
            <div className={styles.cardHeader}>
              <TrendingUp size={18} color="var(--color-brand)" />
              <h3 className={styles.cardTitle}>Sales & Revenue Trends (Food vs. Gaming)</h3>
            </div>
            <div style={{ width: '100%', height: 280 }}>
              {chartSalesData.length === 0 ? (
                <div className={styles.emptyChart}>No revenue recorded in selected date range.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartSalesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="period" stroke="var(--color-text-secondary)" fontSize={12} />
                    <YAxis stroke="var(--color-text-secondary)" fontSize={12} unit="₹" />
                    <Tooltip formatter={(value) => [`₹${value}`, '']} />
                    <Legend />
                    <Line type="monotone" dataKey="Food" stroke="#C97A3B" strokeWidth={2} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="Gaming" stroke="#3B6EC9" strokeWidth={2} />
                    <Line type="monotone" dataKey="Total" stroke="#2E7D4F" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Chart 2: Payment Method Breakdown & Cash-Up */}
          <div className={styles.chartCard}>
            <div className={styles.cardHeader}>
              <PieIcon size={18} color="var(--color-brand)" />
              <h3 className={styles.cardTitle}>Payment Method Cash-Up</h3>
            </div>
            <div style={{ width: '100%', height: 260 }}>
              {piePaymentData.length === 0 ? (
                <div className={styles.emptyChart}>No payments recorded in date range.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={piePaymentData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {piePaymentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`₹${value}`, 'Amount']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Chart 3: Zone Revenue & Performance */}
          <div className={styles.chartCard}>
            <div className={styles.cardHeader}>
              <BarChart3 size={18} color="var(--color-brand)" />
              <h3 className={styles.cardTitle}>Zone Revenue Comparison</h3>
            </div>
            <div style={{ width: '100%', height: 260 }}>
              {barZoneData.length === 0 ? (
                <div className={styles.emptyChart}>No zone data available.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barZoneData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="name" stroke="var(--color-text-secondary)" fontSize={12} />
                    <YAxis stroke="var(--color-text-secondary)" fontSize={12} unit="₹" />
                    <Tooltip formatter={(value) => [`₹${value}`, '']} />
                    <Legend />
                    <Bar dataKey="Food" fill="#C97A3B" />
                    <Bar dataKey="Gaming" fill="#3B6EC9" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Chart 4: Top-Selling Menu Items Ranking */}
          <div className={styles.chartCard}>
            <div className={styles.cardHeader}>
              <Trophy size={18} color="var(--color-brand)" />
              <h3 className={styles.cardTitle}>Top 10 Selling Dishes</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: 260, overflowY: 'auto' }}>
              {topItems.length === 0 ? (
                <div className={styles.emptyChart}>No dish sales recorded yet.</div>
              ) : (
                topItems.map((item, index) => (
                  <div key={item.id} className={styles.topItemRow}>
                    <span className={styles.rankBadge}>#{index + 1}</span>
                    <div style={{ flex: 1 }}>
                      <div className={styles.itemName}>{item.name}</div>
                      <div className={styles.itemCategory}>{item.category}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className={styles.itemQty}>{item.totalQuantity} sold</div>
                      <div className={styles.itemRevenue}>₹{(item.totalRevenue / 100).toFixed(2)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chart 5: Staff Billing & Order Leaderboard */}
          <div className={styles.chartCard}>
            <div className={styles.cardHeader}>
              <Users size={18} color="var(--color-brand)" />
              <h3 className={styles.cardTitle}>Staff Sales & Billing Leaderboard</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: 260, overflowY: 'auto' }}>
              {staffPerformance.length === 0 ? (
                <div className={styles.emptyChart}>No staff sales activity recorded.</div>
              ) : (
                staffPerformance.map((staff) => (
                  <div key={staff.id} className={styles.topItemRow}>
                    <div style={{ flex: 1 }}>
                      <div className={styles.itemName}>{staff.username} ({staff.role})</div>
                      <div className={styles.itemCategory}>{staff.billsGenerated} Bills Issued</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className={styles.itemRevenue}>₹{(staff.totalSales / 100).toFixed(2)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
