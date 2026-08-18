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
import { Calendar, BarChart3, TrendingUp, Trophy, PieChart as PieIcon, Users, AlertCircle } from 'lucide-react';
import styles from './ReportsDashboard.module.css';

const PIE_COLORS = ['#2E7D4F', '#3B6EC9', '#C97A3B', '#8E44AD', '#E74C3C'];

export function ReportsDashboard() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [groupBy, setGroupBy] = useState('day');

  const {
    salesSummary,
    topItems,
    zonePerformance,
    staffPerformance,
    paymentMethods,
    isLoading,
    error,
    refreshReports
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
          <p className={styles.subtitle}>Track revenue trends, best-selling dishes, zone occupancy, staff performance, and daily cash-up</p>
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
                    <Bar dataKey="Food" fill="#C97A3B" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Gaming" fill="#3B6EC9" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* List 1: Top 10 Best-Selling Menu Items */}
          <div className={styles.chartCard}>
            <div className={styles.cardHeader}>
              <Trophy size={18} color="#D4AF37" />
              <h3 className={styles.cardTitle}>Top 10 Best-Selling Menu Items</h3>
            </div>
            {topItems.length === 0 ? (
              <div className={styles.emptyChart}>No order items found in date range.</div>
            ) : (
              <div className={styles.tableList}>
                {topItems.map((item, idx) => (
                  <div key={item.id} className={styles.tableRow}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={styles.rankBadge}>#{idx + 1}</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 'var(--text-xs)' }}>{item.name}</div>
                        <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>{item.category}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, fontSize: 'var(--text-xs)', color: 'var(--color-brand)' }}>
                        {item.totalQuantity} Sold
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>
                        ₹{(item.totalRevenue / 100).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* List 2: Staff Performance Leaderboard */}
          <div className={styles.chartCard}>
            <div className={styles.cardHeader}>
              <Users size={18} color="var(--color-brand)" />
              <h3 className={styles.cardTitle}>Staff Activity & Billing Leaderboard</h3>
            </div>
            {staffPerformance.length === 0 ? (
              <div className={styles.emptyChart}>No staff activity logged in date range.</div>
            ) : (
              <div className={styles.tableList}>
                {staffPerformance.map((staff) => (
                  <div key={staff.id} className={styles.tableRow}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 'var(--text-xs)' }}>{staff.username}</div>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>Role: {staff.role}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, fontSize: 'var(--text-xs)', color: 'var(--color-success)' }}>
                        {staff.billsGenerated} Bills Generated
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>
                        ₹{(staff.totalSales / 100).toFixed(2)} Revenue
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
