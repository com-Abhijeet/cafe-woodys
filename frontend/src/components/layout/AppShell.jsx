import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { NotificationProvider } from '../../context/NotificationContext';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { WebSocketStatusIndicator } from './WebSocketStatusIndicator';
import { Button } from '../ui/Button/Button';
import { LogOut, User } from 'lucide-react';

export function AppShell({ activeTab, onSelectTab, children }) {
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const sidebarWidth = isMobile ? '0px' : (isCollapsed ? '72px' : '240px');

  return (
    <NotificationProvider onNavigateTab={onSelectTab}>
      <div style={{
        minHeight: '100vh',
        backgroundColor: 'var(--color-bg)',
        display: 'flex',
        paddingTop: 'var(--safe-area-top)',
        paddingBottom: 'var(--safe-area-bottom)',
        paddingLeft: 'var(--safe-area-left)',
        paddingRight: 'var(--safe-area-right)',
        boxSizing: 'border-box'
      }}>
        {/* 1. Left Sidebar (Desktop) or Bottom Navigation Bar (Mobile) */}
        {isMobile ? (
          <BottomNav activeTab={activeTab} onSelectTab={onSelectTab} role={user?.role} />
        ) : (
          <Sidebar
            activeTab={activeTab}
            onSelectTab={onSelectTab}
            role={user?.role}
            isCollapsed={isCollapsed}
            onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          />
        )}

        {/* 2. Main Content Wrapper */}
        <div style={{
          flex: 1,
          marginLeft: sidebarWidth,
          paddingBottom: isMobile ? '64px' : '0',
          transition: 'margin-left 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0
        }}>
          {/* Top Header Bar */}
          <header style={{
            height: '64px',
            backgroundColor: 'var(--color-surface)',
            borderBottom: '1px solid var(--color-border)',
            padding: '0 var(--space-4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 40,
            boxShadow: 'var(--shadow-card)'
          }}>
            {/* Left Title / Breadcrumb */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <h2 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--color-brand)' }}>
                {activeTab === 'FLOOR' && 'Floor Grid & Tables'}
                {activeTab === 'ORDERS_BOARD' && 'Kitchen & Live Orders Board'}
                {activeTab === 'MENU' && 'Menu Offerings & Recipe Builder'}
                {activeTab === 'INVENTORY' && 'Raw Material Stock & Wastage Audits'}
                {activeTab === 'PURCHASES' && 'Raw Material Purchases & Suppliers'}
                {activeTab === 'CUSTOMERS' && 'Customer CRM & Visit History'}
                {activeTab === 'PAYMENTS' && 'Payments Reconciliation Log'}
                {activeTab === 'BILLS' && 'Bill History & In-Place Payments'}
                {activeTab === 'SETTINGS' && 'System Settings & Staff Management'}
                {activeTab === 'REPORTS' && 'Business Analytics & Reports'}
                {activeTab === 'PRINT_LOGS' && 'Printer & KOT Execution Logs'}
              </h2>
            </div>

            {/* Right User & Live WS Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <WebSocketStatusIndicator />

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--color-bg)', padding: '4px 8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <User size={14} color="var(--color-brand)" />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, fontSize: '11px', color: 'var(--color-text-primary)' }}>{user?.username}</div>
                  <div style={{ fontSize: '9px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                    Role: <span style={{ color: 'var(--color-brand)' }}>{user?.role}</span>
                  </div>
                </div>
              </div>

              <Button variant="secondary" onClick={logout} style={{ padding: '4px 8px', minHeight: '32px', fontSize: '11px' }}>
                <LogOut size={14} /> Sign Out
              </Button>
            </div>
          </header>

          {/* Main View Scroll Area */}
          <main style={{ padding: 'var(--space-4)', maxWidth: '1400px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
            {children}
          </main>
        </div>
      </div>
    </NotificationProvider>
  );
}
