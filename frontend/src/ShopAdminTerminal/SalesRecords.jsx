import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  LayoutDashboard, Store, Users, ShoppingCart,
  Package as PackageIcon, Diamond, LogOut, User, Bell, Tags,
  Moon, Settings, TrendingUp, Download, Search, X,
  Eye, ChevronLeft, ChevronRight, Receipt, Boxes,FileBarChart,
  DollarSign, ShoppingBag, BarChart2, Percent,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './ShopAdminTerminalStyles/SalesRecords.css';
import { API_BASE_URL } from '../config';

const API = API_BASE_URL;
const ITEMS_PER_PAGE = 15;

const fmtCurrency = (val) =>
  `Rs. ${parseFloat(val || 0).toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const fmtDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })
    + ' ' + dt.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const payClass = (method) => {
  const m = (method || '').toLowerCase();
  if (m === 'cash')   return 'cash';
  if (m === 'card')   return 'card';
  return 'mobile';
};

const SalesRecords = () => {
  const navigate = useNavigate();
  const user  = JSON.parse(localStorage.getItem('user')  || '{}');
  const token = localStorage.getItem('token');

  // Dropdown refs
  const menuDropdownRef    = useRef(null);
  const profileDropdownRef = useRef(null);
  const [showMenuDropdown,    setShowMenuDropdown]    = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Summary / KPIs
  const [summary,     setSummary]     = useState(null);
  const [summaryLoad, setSummaryLoad] = useState(true);
  const [range,       setRange]       = useState('today'); // today | this_week | this_month | all

  const rangeChartLabel = {
    today:      'Today',
    this_week:  'This Week',
    this_month: 'This Month',
    all:        'All Time',
  };

  // Table
  const [sales,      setSales]      = useState([]);
  const [total,      setTotal]      = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page,       setPage]       = useState(1);
  const [tableLoad,  setTableLoad]  = useState(true);
  const [tableError, setTableError] = useState('');

  // Filters
  const [search,    setSearch]    = useState('');
  const [storeId,   setStoreId]   = useState('');
  const [payment,   setPayment]   = useState('');
  const [dateFrom,  setDateFrom]  = useState('');
  const [dateTo,    setDateTo]    = useState('');
  const [stores,    setStores]    = useState([]);

  // View modal
  const [viewSale,      setViewSale]      = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  // Fetch stores for filter dropdown
  const fetchStores = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/stores`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setStores(await res.json());
    } catch { /* silent */ }
  }, [token]);

  // Fetch KPI summary
  const fetchSummary = useCallback(async () => {
    setSummaryLoad(true);
    try {
      const res = await fetch(`${API}/api/salesrecords/summary?range=${range}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setSummary(await res.json());
    } catch { /* silent */ }
    finally { setSummaryLoad(false); }
  }, [token, range]);

  // Fetch table
  const fetchSales = useCallback(async (pg = page) => {
    setTableLoad(true);
    setTableError('');
    try {
      const params = new URLSearchParams({
        page:      pg,
        limit:     ITEMS_PER_PAGE,
        search:    search.trim(),
        store_id:  storeId,
        payment,
        date_from: dateFrom,
        date_to:   dateTo,
      });
      const res = await fetch(`${API}/api/salesrecords?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSales(data.sales);
        setTotal(data.total);
        setTotalPages(data.total_pages || 1);
        setPage(data.page);
      } else {
        setTableError('Failed to load sales records.');
      }
    } catch {
      setTableError('Network error. Please try again.');
    } finally {
      setTableLoad(false);
    }
  }, [token, search, storeId, payment, dateFrom, dateTo, page]);

  useEffect(() => { fetchStores(); }, [fetchStores]);
  useEffect(() => { fetchSummary(); }, [fetchSummary]);
  useEffect(() => { fetchSales(1); setPage(1); }, [token, search, storeId, payment, dateFrom, dateTo]); // eslint-disable-line
  useEffect(() => { fetchSales(page); }, [page]); // eslint-disable-line

  // Close dropdowns on outside click
  useEffect(() => {
    const h = (e) => {
      if (menuDropdownRef.current    && !menuDropdownRef.current.contains(e.target))    setShowMenuDropdown(false);
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target)) setShowProfileDropdown(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // Auth / profile helpers  (identical to Products.jsx pattern)
  const handleLogOut = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/');
  };

  const shopLogoUrl    = user.shop_logo ? `${API}${user.shop_logo}` : null;
  const renderShopLogo = () => {
    if (shopLogoUrl)
      return <img src={shopLogoUrl} alt={user.shop_name || 'Shop'} className="shop-sidebar-logo-img"
        onError={e => { e.target.style.display = 'none'; }} />;
    return <span className="shop-brand-title">{user.shop_name || 'Shop'}</span>;
  };
  const renderProfileImage = (size = 'default') => {
    const initials = user.name?.substring(0, 2).toUpperCase() || 'AD';
    if (user.image_url)
      return <img src={`${API}${user.image_url}`} alt="Profile"
        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />;
    return <span className={size === 'dropdown' ? 'avatar-initials' : 'profile-initials'}>{initials}</span>;
  };

  // Export CSV
  const handleExport = () => {
    const rows = [
      ['Receipt No', 'Cashier', 'Store', 'Items', 'Subtotal', 'Tax', 'Discount', 'Total', 'Payment', 'Date'],
      ...sales.map(s => [
        s.receipt_no, s.cashier_name, s.store_name || '',
        s.item_count ?? (Array.isArray(s.items) ? s.items.length : 0),
        s.subtotal, s.tax, s.discount, s.total, s.payment_method,
        new Date(s.sale_date).toLocaleString()
      ])
    ];
    const csv  = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'sales_records.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  // Chart helpers
  const chartData = summary?.chart || [];
  const maxVal    = Math.max(...chartData.map(d => parseFloat(d.daily_total)), 1);

  // Store bar max
  const storeData    = summary?.by_store || [];
  const maxStoreVal  = Math.max(...storeData.map(s => parseFloat(s.store_total)), 1);

  // Open detail modal
  const openView  = (sale) => { setViewSale(sale); setShowViewModal(true); };
  const closeView = ()     => { setShowViewModal(false); setViewSale(null); };

  return (
    <div className="shop-admin-container">
      {/*  SIDEBAR  */}
      <aside className="shop-admin-sidebar">
        <div className="shop-brand-header">{renderShopLogo()}</div>
        <nav className="shop-sidebar-nav">
          <button className="shop-nav-item" onClick={() => navigate('/shopadmindashboard')}>
            <LayoutDashboard size={18}/><span>Dashboard</span>
          </button>
          <button className="shop-nav-item" onClick={() => navigate('/shopprofile')}>
            <Settings size={18}/><span>Shop Profile</span>
          </button>
          <div className="nav-divider"/>
          <button className="shop-nav-item" onClick={() => navigate('/mystores')}>
            <Store size={18}/><span>My Stores</span>
          </button>
          <div className="nav-divider"/>
          <button className="shop-nav-item" onClick={() => navigate('/myuser')}>
            <Users size={18}/><span>My Users</span>
          </button>
          <button className="shop-nav-item" onClick={() => navigate('/suppliers')}>
            <PackageIcon size={18}/><span>Suppliers</span>
          </button>
          <div className="nav-divider"/>
          <button className="shop-nav-item" onClick={() => navigate('/products')}>
            <ShoppingCart size={18}/><span>Products</span>
          </button>
          <button className="mp-nav-item" onClick={() => navigate('/categories')}>
            <Tags size={18}/><span>Categories</span>
          </button>
          <button className="mp-nav-item" onClick={() => navigate('/inventory')}>
            <Boxes size={18}/><span>Inventory</span>
          </button>
          <div className="nav-divider"/>
          <button className="shop-nav-item active">
            <TrendingUp size={18}/><span>Sales Records</span>
          </button>
          <button className="mp-nav-item" onClick={()=> navigate('/reportsandanalytics')}>
            <FileBarChart size={18}/><span>Reports & Analytics</span>
          </button>
          <button className="shop-nav-item" onClick={() => navigate('/subscription')}>
            <Diamond size={18}/><span>Subscription</span>
          </button>
          <div className="nav-divider"/>
          <button className="shop-nav-item" onClick={() => navigate('/adminprofile')}>
            <User size={18}/><span>My Profile</span>
          </button>
          <button className="shop-nav-item" onClick={handleLogOut}>
            <LogOut size={18}/><span>Logout</span>
          </button>
        </nav>
      </aside>

      {/*  MAIN  */}
      <main className="shop-admin-main">
        {/* HEADER */}
        <header className="shop-main-header">
          <div className="shop-breadcrumb">Admin &gt; Sales Records</div>
          <div className="shop-header-actions">
            <div className="shop-menu-dropdown-container" ref={menuDropdownRef}>
              <button className="shop-btn-menu" onClick={() => setShowMenuDropdown(!showMenuDropdown)}>
                All Stores <span className="shop-dropdown-arrow">▼</span>
              </button>
              {showMenuDropdown && (
                <div className="shop-menu-dropdown">
                  <div className="shop-menu-section">
                    <h4 className="shop-menu-section-title">My Stores</h4>
                    {stores.length > 0 ? stores.map(s => (
                      <button key={s.store_id} className="shop-menu-item"
                        onClick={() => { setStoreId(String(s.store_id)); setShowMenuDropdown(false); }}>
                        <Store size={16}/><span>{s.name}</span>
                      </button>
                    )) : <div className="shop-menu-item">No stores</div>}
                  </div>
                  {storeId && (
                    <>
                      <div className="shop-menu-divider"/>
                      <div className="shop-menu-section">
                        <button className="shop-menu-item" onClick={() => { setStoreId(''); setShowMenuDropdown(false); }}>
                          <X size={16}/><span>Clear Filter</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="shop-icon-circle moon"><Moon size={16}/></div>
            <div className="shop-icon-circle bell"><Bell size={16}/></div>

            <div className="shop-profile-dropdown-container" ref={profileDropdownRef}>
              <button className="shop-profile-circle-btn" onClick={() => setShowProfileDropdown(!showProfileDropdown)}>
                {renderProfileImage()}
              </button>
              {showProfileDropdown && (
                <div className="shop-profile-dropdown">
                  <div className="shop-profile-dropdown-header">
                    <div className="shop-profile-dropdown-avatar">{renderProfileImage('dropdown')}</div>
                    <div className="shop-profile-dropdown-info">
                      <h4 className="shop-profile-name">{user.name || 'Admin'}</h4>
                      <p className="shop-profile-role">{user.role || 'Shop Admin'}</p>
                    </div>
                  </div>
                  <div className="shop-profile-divider"/>
                  <div className="shop-profile-details">
                    <div className="shop-profile-detail-item">
                      <span className="shop-detail-icon">📧</span>
                      <span className="shop-detail-text">{user.email || 'N/A'}</span>
                    </div>
                    <div className="shop-profile-detail-item">
                      <span className="shop-detail-icon">📱</span>
                      <span className="shop-detail-text">{user.phone || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="shop-profile-divider"/>
                  <div className="shop-profile-actions">
                    <button className="shop-profile-action-btn"
                      onClick={() => { setShowProfileDropdown(false); navigate('/adminprofile'); }}>
                      <User size={18}/><span>My Profile</span>
                    </button>
                    <button className="shop-profile-action-btn shop-logout-btn" onClick={handleLogOut}>
                      <LogOut size={18}/><span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/*  CONTENT  */}
        <div className="shop-dashboard-content">

          {/* Page header */}
          <div className="sr-page-header">
            <div>
              <h1 className="sr-title">Sales Records</h1>
              <p className="sr-subtitle">Track sales performance across all stores</p>
            </div>
            <div className="sr-header-btns">
              {/* Range tabs */}
              <div className="sr-range-tabs">
                {[
                  { key: 'today',      label: 'Today'      },
                  { key: 'this_week',  label: 'This Week'  },
                  { key: 'this_month', label: 'This Month' },
                  { key: 'all',        label: 'All Time'   },
                ].map(t => (
                  <button
                    key={t.key}
                    className={`sr-range-tab${range === t.key ? ' active' : ''}`}
                    onClick={() => setRange(t.key)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <button className="sr-btn-export" onClick={handleExport}>
                <Download size={15}/> Export
              </button>
            </div>
          </div>

          {/* KPI stat cards */}
          <div className="sr-stat-cards">
            <div className="sr-stat-card">
              <div className="sr-stat-icon-wrap revenue"><DollarSign size={20}/></div>
              <div className="sr-stat-info">
                <p className="sr-stat-label">Total Sales</p>
                <p className="sr-stat-value">
                  {summaryLoad ? '…' : fmtCurrency(summary?.kpi?.total_sales)}
                </p>
              </div>
            </div>
            <div className="sr-stat-card">
              <div className="sr-stat-icon-wrap transactions"><Receipt size={20}/></div>
              <div className="sr-stat-info">
                <p className="sr-stat-label">Transactions</p>
                <p className="sr-stat-value">
                  {summaryLoad ? '…' : (summary?.kpi?.total_transactions || 0).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="sr-stat-card">
              <div className="sr-stat-icon-wrap avg"><BarChart2 size={20}/></div>
              <div className="sr-stat-info">
                <p className="sr-stat-label">Avg Order</p>
                <p className="sr-stat-value">
                  {summaryLoad ? '…' : fmtCurrency(summary?.kpi?.avg_order)}
                </p>
              </div>
            </div>
            <div className="sr-stat-card">
              <div className="sr-stat-icon-wrap discount"><Percent size={20}/></div>
              <div className="sr-stat-info">
                <p className="sr-stat-label">Total Discounts</p>
                <p className="sr-stat-value">
                  {summaryLoad ? '…' : fmtCurrency(summary?.kpi?.total_discounts)}
                </p>
              </div>
            </div>
          </div>

          {/* Chart + Store breakdown */}
          <div className="sr-mid-grid">
            {/* Bar chart daily last 7 days */}
            <div className="sr-chart-card">
              <h3 className="sr-chart-card-title">
                Sales Overview : {rangeChartLabel[range] || 'Today'}
                <span style={{ fontSize: '0.7rem', fontWeight: 400, color: '#9ca3af', marginLeft: '0.5rem' }}>
                  {range === 'today' ? '(by hour)' : range === 'this_week' ? '(by day)' : range === 'this_month' ? '(by week)' : '(last 12 months)'}
                </span>
              </h3>
              <div className="sr-chart-wrap">
                {summaryLoad ? (
                  <div className="sr-loading" style={{ width: '100%', paddingTop: '3rem' }}>
                    Loading chart…
                  </div>
                ) : chartData.length === 0 ? (
                  <div style={{ width: '100%', textAlign: 'center', color: '#9ca3af', paddingTop: '3rem', fontSize: '0.875rem' }}>
                    No sales data for this period.
                  </div>
                ) : chartData.map((d, i) => {
                  const pct = Math.max((parseFloat(d.daily_total) / maxVal) * 100, 4);
                  return (
                    <div key={i} className="sr-bar-col">
                      <div
                        className={`sr-bar${parseFloat(d.daily_total) === 0 ? ' empty' : ''}`}
                        style={{ height: `${pct}%` }}
                        title={`${d.day_label}: ${fmtCurrency(d.daily_total)}`}
                      />
                      <span className="sr-bar-label">{d.day_label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sales by store */}
            <div className="sr-store-card">
              <h3 className="sr-store-card-title">Sales by Store</h3>
              {summaryLoad ? (
                <div className="sr-loading" style={{ padding: '2rem' }}>Loading…</div>
              ) : storeData.length === 0 ? (
                <p style={{ color: '#9ca3af', fontSize: '0.875rem', textAlign: 'center', padding: '2rem 0' }}>
                  No store data.
                </p>
              ) : (
                <div className="sr-store-list">
                  {storeData.map((s, i) => {
                    const pct = (parseFloat(s.store_total) / maxStoreVal) * 100;
                    return (
                      <div key={i} className="sr-store-row">
                        <div className="sr-store-row-top">
                          <span className="sr-store-name">{s.store_name || `Store ${s.store_id}`}</span>
                          <span className="sr-store-amount">{fmtCurrency(s.store_total)}</span>
                        </div>
                        <div className="sr-store-bar-bg">
                          <div className="sr-store-bar-fill" style={{ width: `${pct}%` }}/>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Filter bar */}
          <div className="sr-filter-bar">
            <div className="sr-search-wrap">
              <Search size={15} className="sr-search-icon"/>
              <input
                className="sr-search-input"
                placeholder="Search receipt no. or cashier…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <select className="sr-select" value={storeId}
              onChange={e => setStoreId(e.target.value)}>
              <option value="">All Stores</option>
              {stores.map(s => (
                <option key={s.store_id} value={s.store_id}>{s.name}</option>
              ))}
            </select>

            <select className="sr-select" value={payment}
              onChange={e => setPayment(e.target.value)}>
              <option value="">All Payments</option>
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="Mobile">Mobile</option>
            </select>

            <span className="sr-filter-label">From</span>
            <input type="date" className="sr-date-input"
              value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            <span className="sr-filter-label">To</span>
            <input type="date" className="sr-date-input"
              value={dateTo} onChange={e => setDateTo(e.target.value)} />

            {(search || storeId || payment || dateFrom || dateTo) && (
              <button className="sr-btn-export"
                onClick={() => { setSearch(''); setStoreId(''); setPayment(''); setDateFrom(''); setDateTo(''); }}>
                <X size={14}/> Clear
              </button>
            )}
          </div>

          {/* Table */}
          <div className="sr-table-card">
            <div className="sr-table-wrap">
              {tableLoad ? (
                <div className="sr-loading">Loading sales records…</div>
              ) : tableError ? (
                <div className="sr-empty">
                  <div className="sr-empty-icon"><Receipt size={22}/></div>
                  <h3>Error</h3>
                  <p>{tableError}</p>
                </div>
              ) : sales.length === 0 ? (
                <div className="sr-empty">
                  <div className="sr-empty-icon"><ShoppingBag size={22}/></div>
                  <h3>No Sales Found</h3>
                  <p>No transactions match your current filters.</p>
                </div>
              ) : (
                <>
                  <table className="sr-table">
                    <thead>
                      <tr>
                        <th>Receipt No.</th>
                        <th>Cashier / Store</th>
                        <th>Items</th>
                        <th>Total</th>
                        <th>Payment</th>
                        <th>Date & Time</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sales.map(s => (
                        <tr key={s.sale_id}>
                          <td>
                            <span className="sr-receipt-no" onClick={() => openView(s)}>
                              #{s.receipt_no}
                            </span>
                          </td>
                          <td>
                            <div className="sr-cashier">{s.cashier_name}</div>
                            <div className="sr-store">{s.store_name || '—'}</div>
                          </td>
                          <td>
                            <span className="sr-items-badge">
                              {s.item_count ?? (Array.isArray(s.items) ? s.items.length : 0)} items
                            </span>
                          </td>
                          <td>
                            <span className="sr-total">{fmtCurrency(s.total)}</span>
                          </td>
                          <td>
                            <span className={`sr-pay-badge ${payClass(s.payment_method)}`}>
                              {s.payment_method}
                            </span>
                          </td>
                          <td>
                            <span className="sr-date">{fmtDate(s.sale_date)}</span>
                          </td>
                          <td>
                            <button className="sr-tbl-btn-view" onClick={() => openView(s)}>
                              <Eye size={13}/> View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Pagination */}
                  <div className="sr-table-footer">
                    <span className="sr-pagination-info">
                      Showing {Math.min((page - 1) * ITEMS_PER_PAGE + 1, total)}–
                      {Math.min(page * ITEMS_PER_PAGE, total)} of {total.toLocaleString()} records
                    </span>
                    <div className="sr-pagination-btns">
                      <button className="sr-page-btn" disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}>
                        <ChevronLeft size={14}/> Previous
                      </button>
                      <span style={{ fontSize: '0.8125rem', color: '#6b7280', padding: '0 0.25rem' }}>
                        Page {page} of {totalPages}
                      </span>
                      <button className="sr-page-btn" disabled={page === totalPages}
                        onClick={() => setPage(p => p + 1)}>
                        Next <ChevronRight size={14}/>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

        </div>{/* end shop-dashboard-content */}
      </main>

      {/*  SALE DETAIL MODAL  */}
      {showViewModal && viewSale && (
        <div className="ms-modal-overlay" onClick={closeView}>
          <div className="ms-modal ms-modal-wide" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="sr-view-header">
              <div className="sr-view-header-left">
                <p className="sr-view-receipt-no">#{viewSale.receipt_no}</p>
                <p className="sr-view-receipt-sub">
                  {viewSale.store_name || 'Store'} &nbsp;·&nbsp; {fmtDate(viewSale.sale_date)}
                </p>
              </div>
              <button className="ms-modal-close" style={{ color: 'rgba(255,255,255,0.8)' }} onClick={closeView}>
                <X size={20}/>
              </button>
            </div>

            <div className="ms-modal-body">
              {/* 3 KPI cards */}
              <div className="sr-view-stats-row">
                <div className="sr-view-stat-card">
                  <p className="sr-view-stat-value">{fmtCurrency(viewSale.total)}</p>
                  <p className="sr-view-stat-label">Total</p>
                </div>
                <div className="sr-view-stat-card">
                  <p className="sr-view-stat-value">{fmtCurrency(viewSale.subtotal)}</p>
                  <p className="sr-view-stat-label">Subtotal</p>
                </div>
                <div className="sr-view-stat-card">
                  <p className="sr-view-stat-value">{fmtCurrency(viewSale.discount)}</p>
                  <p className="sr-view-stat-label">Discount</p>
                </div>
              </div>

              {/* Detail grid */}
              <div className="sr-view-detail-grid">
                <div className="sr-view-detail-card">
                  <p className="sr-view-detail-label">Cashier</p>
                  <p className="sr-view-detail-val">{viewSale.cashier_name}</p>
                </div>
                <div className="sr-view-detail-card">
                  <p className="sr-view-detail-label">Store</p>
                  <p className="sr-view-detail-val">{viewSale.store_name || '—'}</p>
                </div>
                <div className="sr-view-detail-card">
                  <p className="sr-view-detail-label">Payment Method</p>
                  <p className="sr-view-detail-val">
                    <span className={`sr-pay-badge ${payClass(viewSale.payment_method)}`}>
                      {viewSale.payment_method}
                    </span>
                  </p>
                </div>
                <div className="sr-view-detail-card">
                  <p className="sr-view-detail-label">Tax</p>
                  <p className="sr-view-detail-val">{fmtCurrency(viewSale.tax)}</p>
                </div>
              </div>

              {/* Items table */}
              <p className="sr-items-section-title">Items Purchased</p>
              <div style={{ overflowX: 'auto' }}>
                <table className="sr-items-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Unit Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(Array.isArray(viewSale.items) ? viewSale.items : []).map((item, idx) => (
                      <tr key={idx}>
                        <td style={{ color: '#9ca3af', width: '2rem' }}>{idx + 1}</td>
                        <td style={{ fontWeight: 600, color: '#1f2937' }}>{item.name || item.product_name || '—'}</td>
                        <td>{item.quantity ?? 1}</td>
                        <td>{fmtCurrency(item.price)}</td>
                        <td>{fmtCurrency(parseFloat(item.price) * parseFloat(item.quantity ?? 1))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals summary */}
              <div className="sr-totals-block">
                <div className="sr-totals-row">
                  <span>Subtotal</span>
                  <span>{fmtCurrency(viewSale.subtotal)}</span>
                </div>
                {parseFloat(viewSale.discount) > 0 && (
                  <div className="sr-totals-row">
                    <span>Discount</span>
                    <span style={{ color: '#dc2626' }}>− {fmtCurrency(viewSale.discount)}</span>
                  </div>
                )}
                {parseFloat(viewSale.tax) > 0 && (
                  <div className="sr-totals-row">
                    <span>Tax</span>
                    <span>{fmtCurrency(viewSale.tax)}</span>
                  </div>
                )}
                <div className="sr-totals-row total-final">
                  <span>Total</span>
                  <span>{fmtCurrency(viewSale.total)}</span>
                </div>
              </div>
            </div>

            <div className="ms-modal-footer">
              <button className="ms-btn-cancel" onClick={closeView}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesRecords;