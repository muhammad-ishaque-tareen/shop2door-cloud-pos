import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  LayoutDashboard, Store, Users, ShoppingCart,
  Package as PackageIcon, Diamond, LogOut, User, Bell,
  Moon, Settings, TrendingUp, Download, Tags, Boxes,
  FileBarChart, DollarSign, Receipt, BarChart2, Percent,
  ShoppingBag, AlertTriangle, ChevronLeft, ChevronRight,
  X, RefreshCw, Package, CreditCard, Layers, ArrowUpRight,
  ArrowDownRight, Minus, TrendingDown, Activity, Zap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './ShopAdminTerminalStyles/ReportsAndAnalytics.css';
import { API_BASE_URL } from '../config';

const API = API_BASE_URL;

const fmtCurrency = (val) =>
  `Rs. ${parseFloat(val || 0).toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
};

const fmtDateTime = (d) => {
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

const PAYMENT_COLORS = ['#9333ea', '#2563eb', '#16a34a', '#ca8a04', '#dc2626'];

//  Trend Badge 
const TrendBadge = ({ pct }) => {
  if (pct === null || pct === undefined) return null;
  if (pct > 0)  return <span className="ra-stat-badge up"><ArrowUpRight size={10}/> {Math.abs(pct)}%</span>;
  if (pct < 0)  return <span className="ra-stat-badge down"><ArrowDownRight size={10}/> {Math.abs(pct)}%</span>;
  return <span className="ra-stat-badge neutral"><Minus size={10}/> 0%</span>;
};

//  SVG Bar Chart 
const BarChart = ({ data, height = 200, loading }) => {
  if (loading) return <div className="ra-loading">Loading chart…</div>;
  if (!data?.length)
    return <p className="ra-no-data">No data for this period.</p>;

  const maxVal = Math.max(...data.map(d => parseFloat(d.value || 0)), 1);

  return (
    <div className="ra-chart-wrap" style={{ height }}>
      {data.map((d, i) => {
        const pct = Math.max((parseFloat(d.value || 0) / maxVal) * 100, 2);
        return (
          <div key={i} className="ra-bar-col">
            <div
              className={`ra-bar${parseFloat(d.value) === 0 ? ' zero' : ''}`}
              style={{ height: `${pct}%` }}
              title={`${d.label}: ${fmtCurrency(d.value)}${d.transactions ? ` (${d.transactions} txns)` : ''}`}
            />
            <span className="ra-bar-label">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
};

// Donut Chart 
const DonutChart = ({ data, colors, valueKey = 'total_amount', nameKey = 'method' }) => {
  const total = data.reduce((s, d) => s + parseFloat(d[valueKey] || 0), 0);
  if (!total)
    return <p className="ra-no-data">No data.</p>;

  const size = 120, cx = 60, cy = 60, r = 46, stroke = 20;
  const circ = 2 * Math.PI * r;
  let offset = 0;

  const slices = data.map((d, i) => {
    const ratio = parseFloat(d[valueKey]) / total;
    const dash  = ratio * circ;
    const el = (
      <circle key={i} cx={cx} cy={cy} r={r}
        fill="none"
        stroke={colors[i % colors.length]}
        strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeDashoffset={-offset}
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
    );
    offset += dash;
    return el;
  });

  return (
    <div className="ra-donut-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="ra-donut-svg">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth={stroke}/>
        {slices}
      </svg>
      <div className="ra-donut-legend">
        {data.map((d, i) => (
          <div key={i} className="ra-legend-row">
            <div className="ra-legend-dot" style={{ background: colors[i % colors.length] }}/>
            <span className="ra-legend-name">{d[nameKey] || '—'}</span>
            <span className="ra-legend-pct">{((parseFloat(d[valueKey]) / total) * 100).toFixed(1)}%</span>
            <span className="ra-legend-amt">{fmtCurrency(d[valueKey])}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

//  Horizontal Progress Bar 
const StoreBar = ({ name, sub, amount, pct, color }) => (
  <div className="ra-store-row">
    <div className="ra-store-row-top">
      <div>
        <div className="ra-store-name">{name}</div>
        {sub && <div className="ra-store-meta">{sub}</div>}
      </div>
      <span className="ra-store-amount">{fmtCurrency(amount)}</span>
    </div>
    <div className="ra-store-bar-bg">
      <div className="ra-store-bar-fill" style={{ width: `${pct}%`, background: color || 'linear-gradient(90deg,#9333ea,#7e22ce)' }}/>
    </div>
  </div>
);

//  Main Component 
const ReportsAndAnalytics = () => {
  const navigate = useNavigate();
  const user  = JSON.parse(localStorage.getItem('user')  || '{}');
  const token = localStorage.getItem('token');

  const menuDropdownRef    = useRef(null);
  const profileDropdownRef = useRef(null);
  const [showMenuDropdown,    setShowMenuDropdown]    = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const [activeTab, setActiveTab] = useState('overview');
  const [range,     setRange]     = useState('this_month');
  const [dateFrom,  setDateFrom]  = useState('');
  const [dateTo,    setDateTo]    = useState('');
  const [storeId,   setStoreId]   = useState('');
  const [stores,    setStores]    = useState([]);
  const [categories, setCategories] = useState([]);

  // Data states
  const [overview,      setOverview]      = useState(null);
  const [overviewLoad,  setOverviewLoad]  = useState(true);
  const [salesData,     setSalesData]     = useState(null);
  const [salesLoad,     setSalesLoad]     = useState(false);
  const [salesPage,     setSalesPage]     = useState(1);
  const [salesPayment,  setSalesPayment]  = useState('');
  const [invData,       setInvData]       = useState(null);
  const [invLoad,       setInvLoad]       = useState(false);
  const [invCatId,      setInvCatId]      = useState('');
  const [invTab,        setInvTab]        = useState('stock');
  const [storePerf,     setStorePerf]     = useState(null);
  const [storePerfLoad, setStorePerfLoad] = useState(false);
  const [productData,   setProductData]   = useState(null);
  const [productLoad,   setProductLoad]   = useState(false);
  const [paymentData,   setPaymentData]   = useState(null);
  const [paymentLoad,   setPaymentLoad]   = useState(false);

  // Fetch helpers
  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  const fetchStores = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/stores`, authHeaders);
      if (res.ok) setStores(await res.json());
    } catch { /* silent */ }
  }, [token]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/categories`, authHeaders);
      if (res.ok) {
        const d = await res.json();
        setCategories(Array.isArray(d) ? d : d.categories || []);
      }
    } catch { /* silent */ }
  }, [token]);

  const fetchOverview = useCallback(async () => {
    setOverviewLoad(true);
    try {
      const p = new URLSearchParams({ range, store_id: storeId, date_from: dateFrom, date_to: dateTo });
      const res = await fetch(`${API}/api/reportsandanalytics/overview?${p}`, authHeaders);
      if (res.ok) setOverview(await res.json());
    } catch { /* silent */ }
    finally { setOverviewLoad(false); }
  }, [token, range, storeId, dateFrom, dateTo]);

  const fetchSalesReport = useCallback(async (pg = salesPage) => {
    setSalesLoad(true);
    try {
      const p = new URLSearchParams({ range, store_id: storeId, payment: salesPayment, date_from: dateFrom, date_to: dateTo, page: pg, limit: 20 });
      const res = await fetch(`${API}/api/reportsandanalytics/sales-report?${p}`, authHeaders);
      if (res.ok) setSalesData(await res.json());
    } catch { /* silent */ }
    finally { setSalesLoad(false); }
  }, [token, range, storeId, salesPayment, dateFrom, dateTo, salesPage]);

  const fetchInventory = useCallback(async () => {
    setInvLoad(true);
    try {
      const p = new URLSearchParams({ store_id: storeId, category_id: invCatId });
      const res = await fetch(`${API}/api/reportsandanalytics/inventory-report?${p}`, authHeaders);
      if (res.ok) setInvData(await res.json());
    } catch { /* silent */ }
    finally { setInvLoad(false); }
  }, [token, storeId, invCatId]);

  const fetchStorePerformance = useCallback(async () => {
    setStorePerfLoad(true);
    try {
      const p = new URLSearchParams({ range, date_from: dateFrom, date_to: dateTo });
      const res = await fetch(`${API}/api/reportsandanalytics/store-performance?${p}`, authHeaders);
      if (res.ok) setStorePerf(await res.json());
    } catch { /* silent */ }
    finally { setStorePerfLoad(false); }
  }, [token, range, dateFrom, dateTo]);

  const fetchProductAnalysis = useCallback(async () => {
    setProductLoad(true);
    try {
      const p = new URLSearchParams({ range, store_id: storeId, date_from: dateFrom, date_to: dateTo });
      const res = await fetch(`${API}/api/reportsandanalytics/product-analysis?${p}`, authHeaders);
      if (res.ok) setProductData(await res.json());
    } catch { /* silent */ }
    finally { setProductLoad(false); }
  }, [token, range, storeId, dateFrom, dateTo]);

  const fetchPaymentReport = useCallback(async () => {
    setPaymentLoad(true);
    try {
      const p = new URLSearchParams({ range, store_id: storeId, date_from: dateFrom, date_to: dateTo });
      const res = await fetch(`${API}/api/reportsandanalytics/payment-report?${p}`, authHeaders);
      if (res.ok) setPaymentData(await res.json());
    } catch { /* silent */ }
    finally { setPaymentLoad(false); }
  }, [token, range, storeId, dateFrom, dateTo]);

  // Effects
  useEffect(() => { fetchStores(); fetchCategories(); }, [fetchStores, fetchCategories]);

  useEffect(() => {
    if (activeTab === 'overview')   fetchOverview();
    if (activeTab === 'sales')      { setSalesPage(1); fetchSalesReport(1); }
    if (activeTab === 'inventory')  fetchInventory();
    if (activeTab === 'store')      fetchStorePerformance();
    if (activeTab === 'products')   fetchProductAnalysis();
    if (activeTab === 'payments')   fetchPaymentReport();
  }, [activeTab, range, storeId, dateFrom, dateTo]); // eslint-disable-line

  useEffect(() => { if (activeTab === 'inventory') fetchInventory(); }, [invCatId]); // eslint-disable-line
  useEffect(() => { if (activeTab === 'sales') fetchSalesReport(salesPage); }, [salesPage]); // eslint-disable-line
  useEffect(() => { if (activeTab === 'sales') { setSalesPage(1); fetchSalesReport(1); } }, [salesPayment]); // eslint-disable-line

  useEffect(() => {
    const h = (e) => {
      if (menuDropdownRef.current    && !menuDropdownRef.current.contains(e.target))    setShowMenuDropdown(false);
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target)) setShowProfileDropdown(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // Auth
  const handleLogOut = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/');
  };

  const shopLogoUrl = user.shop_logo ? `${API}${user.shop_logo}` : null;
  const renderShopLogo = () => {
    if (shopLogoUrl)
      return <img src={shopLogoUrl} alt={user.shop_name || 'Shop'} className="shop-sidebar-logo-img" onError={e => { e.target.style.display='none'; }}/>;
    return <span className="shop-brand-title">{user.shop_name || 'Shop'}</span>;
  };
  const renderProfileImage = (size = 'default') => {
    const initials = user.name?.substring(0,2).toUpperCase() || 'AD';
    if (user.image_url)
      return <img src={`${API}${user.image_url}`} alt="Profile" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' }}/>;
    return <span className={size === 'dropdown' ? 'avatar-initials' : 'profile-initials'}>{initials}</span>;
  };

  // CSV export
  const downloadCSV = (rows, filename) => {
    const csv  = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'), { href: url, download: filename });
    a.click(); URL.revokeObjectURL(url);
  };

  const exportSalesCSV = () => {
    if (!salesData?.sales?.length) return;
    downloadCSV([
      ['Receipt No','Cashier','Store','Items','Subtotal','Discount','Tax','Total','Payment','Date'],
      ...salesData.sales.map(s => [s.receipt_no, s.cashier_name, s.store_name||'', s.item_count||0,
        s.subtotal, s.discount, s.tax, s.total, s.payment_method, fmtDateTime(s.sale_date)]),
    ], 'sales_report.csv');
  };

  const exportInventoryCSV = () => {
    if (!invData?.products?.length) return;
    downloadCSV([
      ['Product','Barcode','Category','Store','Stock','Unit Price','Stock Value','Status'],
      ...invData.products.map(p => [p.product_name, p.barcode||'', p.category_name||'', p.store_name||'',
        p.current_stock, p.unit_price, p.stock_value, p.stock_status]),
    ], 'inventory_report.csv');
  };

  const exportStoreCSV = () => {
    if (!storePerf?.stores?.length) return;
    downloadCSV([
      ['Rank','Store','Transactions','Revenue','Avg Order','Discounts','Tax','Cashiers'],
      ...storePerf.stores.map((s,i) => [i+1, s.store_name, s.total_transactions, s.total_revenue,
        parseFloat(s.avg_order_value).toFixed(2), s.total_discounts, s.total_tax, s.active_cashiers]),
    ], 'store_performance.csv');
  };

  const exportProductCSV = () => {
    if (!productData?.top_products?.length) return;
    downloadCSV([
      ['Rank','Product','Category','Qty Sold','Revenue','Avg Price'],
      ...productData.top_products.map((p,i) => [i+1, p.product_name, p.category_name||'',
        p.total_qty_sold, p.total_revenue, parseFloat(p.avg_price||0).toFixed(2)]),
    ], 'product_analysis.csv');
  };

  const exportPaymentCSV = () => {
    if (!paymentData?.by_method?.length) return;
    downloadCSV([
      ['Payment Method','Transactions','Total Amount','Avg Amount','Discounts','Tax'],
      ...paymentData.by_method.map(m => [m.method, m.transaction_count, m.total_amount,
        parseFloat(m.avg_amount||0).toFixed(2), m.total_discount, m.total_tax]),
    ], 'payment_report.csv');
  };

  //  Shared filter bar 
  const renderFilters = ({ showPayment=false, showCategory=false, onExport=null } = {}) => (
    <div className="ra-filter-bar">
      <select className="ra-select" value={storeId} onChange={e => setStoreId(e.target.value)}>
        <option value="">All Stores</option>
        {stores.map(s => <option key={s.store_id} value={s.store_id}>{s.name}</option>)}
      </select>

      {showPayment && (
        <select className="ra-select" value={salesPayment} onChange={e => setSalesPayment(e.target.value)}>
          <option value="">All Payments</option>
          <option value="cash">Cash</option>
          <option value="card">Card</option>
          <option value="mobile">Mobile</option>
        </select>
      )}

      {showCategory && (
        <select className="ra-select" value={invCatId} onChange={e => setInvCatId(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
        </select>
      )}

      {range === 'custom' && (
        <>
          <span className="ra-filter-label">From</span>
          <input type="date" className="ra-date-input" value={dateFrom} onChange={e => setDateFrom(e.target.value)}/>
          <span className="ra-filter-label">To</span>
          <input type="date" className="ra-date-input" value={dateTo} onChange={e => setDateTo(e.target.value)}/>
        </>
      )}

      {onExport && (
        <button className="ra-btn-export" onClick={onExport} style={{ marginLeft:'auto' }}>
          <Download size={14}/> Export CSV
        </button>
      )}
    </div>
  );

  //  OVERVIEW PANEL
  const renderOverview = () => {
    const kpi   = overview?.kpi   || {};
    const chart = overview?.chart || [];

    return (
      <>
        {/* Low stock alert */}
        {(overview?.low_stock_count > 0) && (
          <div className="ra-alert-banner">
            <AlertTriangle size={18} color="#ca8a04"/>
            <span><strong>{overview.low_stock_count} items</strong> are low on stock across your stores.</span>
            <button className="ra-btn-export" style={{ marginLeft:'auto', padding:'0.35rem 0.75rem' }}
              onClick={() => setActiveTab('inventory')}>
              View Inventory
            </button>
          </div>
        )}

        {/* KPI Cards */}
        <div className="ra-stat-cards">
          {[
            { icon: <DollarSign size={20}/>, label: 'Total Revenue',    val: fmtCurrency(kpi.total_revenue),      change: kpi.revenue_change,      cls: 'revenue'      },
            { icon: <Receipt    size={20}/>, label: 'Transactions',     val: parseInt(kpi.total_transactions||0).toLocaleString(), change: kpi.transaction_change, cls:'transactions' },
            { icon: <BarChart2  size={20}/>, label: 'Avg Order Value',  val: fmtCurrency(kpi.avg_order_value),    change: kpi.avg_change,          cls: 'avg'          },
            { icon: <Percent    size={20}/>, label: 'Total Discounts',  val: fmtCurrency(kpi.total_discounts),   change: kpi.discount_change,     cls: 'discount'     },
          ].map((card, i) => (
            <div key={i} className="ra-stat-card">
              <div className={`ra-stat-icon-wrap ${card.cls}`}>{card.icon}</div>
              <div className="ra-stat-info">
                <p className="ra-stat-label">{card.label}</p>
                <p className="ra-stat-value">{overviewLoad ? '…' : card.val}</p>
                {!overviewLoad && <TrendBadge pct={card.change}/>}
              </div>
            </div>
          ))}
        </div>

        {/* Revenue chart + Payment donut */}
        <div className="ra-mid-grid">
          <div className="ra-card">
            <div className="ra-card-title">
              Revenue Trend
              <span className="ra-card-subtitle">
                {range==='today'?'hourly':range==='this_week'?'daily':range==='this_month'?'daily':range==='this_year'?'monthly':'all months'}
              </span>
            </div>
            <BarChart data={chart} loading={overviewLoad}/>
          </div>

          <div className="ra-card">
            <div className="ra-card-title">Payment Methods</div>
            {overviewLoad
              ? <div className="ra-loading">Loading…</div>
              : <DonutChart data={overview?.by_payment || []} colors={PAYMENT_COLORS}/>
            }
          </div>
        </div>

        {/* Top products + Store revenue */}
        <div className="ra-mid-grid">
          <div className="ra-card">
            <div className="ra-card-title">Top Products <span className="ra-card-subtitle">by revenue</span></div>
            {overviewLoad ? <div className="ra-loading">Loading…</div>
              : !(overview?.top_products?.length)
              ? <p className="ra-no-data">No product data.</p>
              : (
                <div style={{ overflowX:'auto' }}>
                  <table className="ra-product-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th style={{ textAlign:'left' }}>Product</th>
                        <th>Qty</th>
                        <th>Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overview.top_products.slice(0,8).map((p,i) => (
                        <tr key={i}>
                          <td><span className={`ra-rank-badge${i===0?' gold':i===1?' silver':i===2?' bronze':''}`}>{i+1}</span></td>
                          <td style={{ textAlign:'left' }}>
                            <div style={{ fontWeight:600, color:'#1f2937', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.product_name}</div>
                          </td>
                          <td>{parseFloat(p.total_qty||0).toLocaleString()}</td>
                          <td style={{ color:'#9333ea', fontWeight:700 }}>{fmtCurrency(p.total_revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            }
          </div>

          <div className="ra-card">
            <div className="ra-card-title">Sales by Store</div>
            {overviewLoad ? <div className="ra-loading">Loading…</div>
              : !(overview?.by_store?.length)
              ? <p className="ra-no-data">No store data.</p>
              : (() => {
                  const maxV = Math.max(...overview.by_store.map(s => parseFloat(s.total_revenue)), 1);
                  return (
                    <div className="ra-store-list">
                      {overview.by_store.map((s,i) => (
                        <StoreBar key={i}
                          name={s.store_name || `Store ${s.store_id}`}
                          sub={`${parseInt(s.transactions).toLocaleString()} transactions`}
                          amount={s.total_revenue}
                          pct={(parseFloat(s.total_revenue)/maxV)*100}
                        />
                      ))}
                    </div>
                  );
                })()
            }
          </div>
        </div>
      </>
    );
  };

  //  SALES REPORT PANEL
  const renderSalesReport = () => {
    const sales     = salesData?.sales     || [];
    const summary   = salesData?.summary   || {};
    const daily     = salesData?.daily_summary || [];
    const storeBrk  = salesData?.store_breakdown || [];
    const total     = salesData?.total     || 0;
    const totalPgs  = salesData?.total_pages || 1;
    const LIMIT     = 20;

    return (
      <>
        {renderFilters({ showPayment: true, onExport: exportSalesCSV })}

        {/* Summary KPI Strip */}
        <div className="ra-stat-cards" style={{ marginBottom:'1.25rem' }}>
          {[
            { icon:<DollarSign size={20}/>, label:'Total Revenue',    val: fmtCurrency(summary.total_revenue),    cls:'revenue'      },
            { icon:<Receipt    size={20}/>, label:'Transactions',     val: parseInt(summary.total_transactions||0).toLocaleString(), cls:'transactions' },
            { icon:<BarChart2  size={20}/>, label:'Avg Order Value',  val: fmtCurrency(summary.avg_order_value),  cls:'avg'          },
            { icon:<Percent    size={20}/>, label:'Total Discounts',  val: fmtCurrency(summary.total_discounts),  cls:'discount'     },
          ].map((card,i) => (
            <div key={i} className="ra-stat-card">
              <div className={`ra-stat-icon-wrap ${card.cls}`}>{card.icon}</div>
              <div className="ra-stat-info">
                <p className="ra-stat-label">{card.label}</p>
                <p className="ra-stat-value" style={{ fontSize:'1.25rem' }}>{salesLoad ? '…' : card.val}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Daily revenue mini-chart + store breakdown */}
        {(daily.length > 0 || storeBrk.length > 0) && (
          <div className="ra-mid-grid" style={{ marginBottom:'1.25rem' }}>
            {daily.length > 0 && (
              <div className="ra-card">
                <div className="ra-card-title">Daily Revenue <span className="ra-card-subtitle">selected period</span></div>
                <BarChart
                  data={daily.map(d => ({ label: String(new Date(d.sale_date).getDate()), value: d.daily_revenue, transactions: d.daily_transactions }))}
                  height={150} loading={salesLoad}
                />
              </div>
            )}
            {storeBrk.length > 0 && (
              <div className="ra-card">
                <div className="ra-card-title">Revenue by Store</div>
                {(() => {
                  const maxV = Math.max(...storeBrk.map(s => parseFloat(s.revenue)),1);
                  return (
                    <div className="ra-store-list">
                      {storeBrk.map((s,i) => (
                        <StoreBar key={i}
                          name={s.store_name || '—'}
                          sub={`${parseInt(s.transactions)} txns`}
                          amount={s.revenue}
                          pct={(parseFloat(s.revenue)/maxV)*100}
                        />
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* Transactions Table */}
        <div className="ra-table-card">
          <div className="ra-table-header-row">
            <span className="ra-table-header-title">Transaction Details</span>
            <span className="ra-table-header-sub">{total.toLocaleString()} total records</span>
          </div>
          <div className="ra-table-wrap">
            {salesLoad ? (
              <div className="ra-loading">Loading sales…</div>
            ) : sales.length === 0 ? (
              <div className="ra-empty">
                <div className="ra-empty-icon"><ShoppingBag size={20}/></div>
                <h3>No Sales Found</h3>
                <p>No records match your filters.</p>
              </div>
            ) : (
              <table className="ra-table">
                <thead>
                  <tr>
                    <th>Receipt No.</th>
                    <th>Cashier / Store</th>
                    <th>Items</th>
                    <th>Subtotal</th>
                    <th>Discount</th>
                    <th>Tax</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th>Date &amp; Time</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map(s => (
                    <tr key={s.sale_id}>
                      <td style={{ fontFamily:'monospace', color:'#9333ea', fontWeight:700 }}>#{s.receipt_no}</td>
                      <td>
                        <div style={{ fontWeight:600, color:'#1f2937' }}>{s.cashier_name || '—'}</div>
                        <div style={{ fontSize:'0.8125rem', color:'#9ca3af' }}>{s.store_name || '—'}</div>
                      </td>
                      <td>
                        <span style={{ background:'#f3e8ff', color:'#7e22ce', fontSize:'0.75rem', fontWeight:700, padding:'0.2rem 0.625rem', borderRadius:9999 }}>
                          {s.item_count || 0}
                        </span>
                      </td>
                      <td style={{ color:'#6b7280' }}>{fmtCurrency(s.subtotal)}</td>
                      <td style={{ color: parseFloat(s.discount)>0 ? '#dc2626' : '#9ca3af' }}>
                        {parseFloat(s.discount)>0 ? `−${fmtCurrency(s.discount)}` : '—'}
                      </td>
                      <td style={{ color:'#6b7280' }}>{parseFloat(s.tax)>0 ? fmtCurrency(s.tax) : '—'}</td>
                      <td style={{ fontWeight:700, color:'#1f2937' }}>{fmtCurrency(s.total)}</td>
                      <td><span className={`ra-pay-badge ${payClass(s.payment_method)}`}>{s.payment_method||'—'}</span></td>
                      <td style={{ fontSize:'0.8125rem', color:'#6b7280', whiteSpace:'nowrap' }}>{fmtDateTime(s.sale_date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {!salesLoad && sales.length > 0 && (
            <div className="ra-table-footer">
              <span className="ra-pagination-info">
                Showing {Math.min((salesPage-1)*LIMIT+1,total)}–{Math.min(salesPage*LIMIT,total)} of {total.toLocaleString()} records
              </span>
              <div className="ra-pagination-btns">
                <button className="ra-page-btn" disabled={salesPage===1} onClick={() => setSalesPage(p=>p-1)}>
                  <ChevronLeft size={14}/> Previous
                </button>
                <span style={{ fontSize:'0.8125rem', color:'#6b7280', padding:'0 0.25rem' }}>
                  Page {salesPage} of {totalPgs}
                </span>
                <button className="ra-page-btn" disabled={salesPage===totalPgs} onClick={() => setSalesPage(p=>p+1)}>
                  Next <ChevronRight size={14}/>
                </button>
              </div>
            </div>
          )}
        </div>
      </>
    );
  };

  //  INVENTORY PANEL
  const renderInventory = () => {
    const stats    = invData?.stats    || {};
    const products = invData?.products || [];
    const byCat    = invData?.by_category || [];
    const byStore  = invData?.by_store    || [];
    const stockIn  = invData?.stock_in    || [];
    const stockOut = invData?.stock_out   || [];

    const statusClass = (st) => {
      if (!st) return '';
      const s = st.toLowerCase();
      if (s === 'out of stock') return 'out';
      if (s === 'low stock')    return 'low-stock';
      if (s === 'medium')       return 'medium';
      return 'in-stock';
    };

    return (
      <>
        {renderFilters({ showCategory: true, onExport: exportInventoryCSV })}

        {/* Stat Cards */}
        <div className="ra-stat-cards">
          {[
            { icon:<Package size={20}/>,      label:'Total Products',  val: (stats.total_products||0).toLocaleString(), cls:'products'     },
            { icon:<DollarSign size={20}/>,   label:'Stock Value',     val: fmtCurrency(stats.total_stock_value),      cls:'value'        },
            { icon:<AlertTriangle size={20}/>,label:'Low Stock',       val: stats.low_stock_count||0,                  cls:'discount', hi: stats.low_stock_count>0 },
            { icon:<X size={20}/>,            label:'Out of Stock',    val: stats.out_of_stock_count||0,               cls:'stock',    hi: stats.out_of_stock_count>0 },
          ].map((card,i) => (
            <div key={i} className="ra-stat-card">
              <div className={`ra-stat-icon-wrap ${card.cls}`}>{card.icon}</div>
              <div className="ra-stat-info">
                <p className="ra-stat-label">{card.label}</p>
                <p className="ra-stat-value" style={card.hi ? { color:'#dc2626' } : {}}>{invLoad ? '…' : card.val}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Stock by store + by category */}
        <div className="ra-mid-grid">
          <div className="ra-card">
            <div className="ra-card-title">Stock by Store</div>
            {invLoad ? <div className="ra-loading">Loading…</div>
              : byStore.length === 0 ? <p className="ra-no-data">No data.</p>
              : (() => {
                  const maxV = Math.max(...byStore.map(s => parseFloat(s.total_value)),1);
                  return (
                    <div className="ra-store-list">
                      {byStore.map((s,i) => (
                        <StoreBar key={i}
                          name={s.store_name}
                          sub={`${parseInt(s.product_count)} products · ${parseFloat(s.total_units).toLocaleString()} units`}
                          amount={s.total_value}
                          pct={(parseFloat(s.total_value)/maxV)*100}
                        />
                      ))}
                    </div>
                  );
                })()
            }
          </div>

          <div className="ra-card">
            <div className="ra-card-title">Stock by Category</div>
            {invLoad ? <div className="ra-loading">Loading…</div>
              : <DonutChart data={byCat.map(c=>({...c, method:c.category_name, total_amount:c.total_value}))} colors={PAYMENT_COLORS}/>
            }
          </div>
        </div>

        {/* Inner sub-tabs */}
        <div className="ra-inv-tabs">
          {[
            { key:'stock',    label:'Stock Levels'         },
            { key:'stockin',  label:`Stock-In (30d) ${stockIn.length > 0 ? `(${stockIn.length})`:''}`  },
            { key:'stockout', label:`Stock-Out (30d) ${stockOut.length > 0 ? `(${stockOut.length})`:''}`},
          ].map(t => (
            <button key={t.key} className={`ra-inv-tab${invTab===t.key?' active':''}`} onClick={() => setInvTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        {invTab === 'stock' && (
          <div className="ra-table-card">
            <div className="ra-table-header-row">
              <span className="ra-table-header-title">Current Stock Levels</span>
              <span className="ra-table-header-sub">{products.length} products</span>
            </div>
            <div className="ra-table-wrap">
              {invLoad ? <div className="ra-loading">Loading inventory…</div>
                : products.length === 0 ? (
                  <div className="ra-empty">
                    <div className="ra-empty-icon"><Boxes size={20}/></div>
                    <h3>No Inventory Data</h3>
                    <p>No products found.</p>
                  </div>
                ) : (
                  <table className="ra-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Category</th>
                        <th>Store</th>
                        <th>Stock</th>
                        <th>Unit Price</th>
                        <th>Stock Value</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((p,i) => (
                        <tr key={i}>
                          <td>
                            <div style={{ fontWeight:600, color:'#1f2937' }}>{p.product_name}</div>
                            {p.barcode && <div style={{ fontSize:'0.75rem', color:'#9ca3af', fontFamily:'monospace' }}>{p.barcode}</div>}
                          </td>
                          <td style={{ color:'#6b7280', fontSize:'0.8125rem' }}>{p.category_name||'—'}</td>
                          <td style={{ color:'#6b7280', fontSize:'0.8125rem' }}>{p.store_name||'—'}</td>
                          <td style={{ fontWeight:700, color:parseFloat(p.current_stock)<=5?'#dc2626':'#1f2937' }}>
                            {parseFloat(p.current_stock).toLocaleString()}
                          </td>
                          <td style={{ color:'#6b7280' }}>{fmtCurrency(p.unit_price)}</td>
                          <td style={{ fontWeight:700, color:'#9333ea' }}>{fmtCurrency(p.stock_value)}</td>
                          <td><span className={`ra-stock-badge ${statusClass(p.stock_status)}`}>{p.stock_status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              }
            </div>
          </div>
        )}

        {invTab === 'stockin' && (
          <div className="ra-table-card">
            <div className="ra-table-header-row">
              <span className="ra-table-header-title">Stock-In:  Last 30 Days</span>
              <span className="ra-table-header-sub">{stockIn.length} entries</span>
            </div>
            <div className="ra-table-wrap">
              {invLoad ? <div className="ra-loading">Loading…</div>
                : stockIn.length === 0 ? <div className="ra-empty"><div className="ra-empty-icon"><Package size={20}/></div><h3>No stock-in records</h3><p>No supply orders in the last 30 days.</p></div>
                : (
                  <table className="ra-table">
                    <thead>
                      <tr><th>Product</th><th>Store</th><th>Qty Received</th><th>Unit Price</th><th>Date</th><th>Supplier</th></tr>
                    </thead>
                    <tbody>
                      {stockIn.map((r,i) => (
                        <tr key={i}>
                          <td style={{ fontWeight:600, color:'#1f2937' }}>{r.product_name}</td>
                          <td style={{ color:'#6b7280' }}>{r.store_name||'—'}</td>
                          <td><span style={{ background:'#dcfce7', color:'#15803d', fontSize:'0.75rem', fontWeight:700, padding:'0.2rem 0.625rem', borderRadius:9999 }}>+{parseFloat(r.qty_received||0).toLocaleString()}</span></td>
                          <td style={{ color:'#6b7280' }}>{fmtCurrency(r.unit_price)}</td>
                          <td style={{ fontSize:'0.8125rem', color:'#6b7280' }}>{fmtDate(r.received_date)}</td>
                          <td style={{ color:'#6b7280' }}>{r.supplier_name||'—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              }
            </div>
          </div>
        )}

        {invTab === 'stockout' && (
          <div className="ra-table-card">
            <div className="ra-table-header-row">
              <span className="ra-table-header-title">Stock-Out / Sold — Last 30 Days</span>
              <span className="ra-table-header-sub">{stockOut.length} products</span>
            </div>
            <div className="ra-table-wrap">
              {invLoad ? <div className="ra-loading">Loading…</div>
                : stockOut.length === 0 ? <div className="ra-empty"><div className="ra-empty-icon"><TrendingDown size={20}/></div><h3>No stock-out records</h3><p>No sales data in the last 30 days.</p></div>
                : (
                  <table className="ra-table">
                    <thead>
                      <tr><th>Product</th><th>Store</th><th>Qty Sold</th><th>Revenue</th><th>First Sale</th><th>Last Sale</th></tr>
                    </thead>
                    <tbody>
                      {stockOut.map((r,i) => (
                        <tr key={i}>
                          <td style={{ fontWeight:600, color:'#1f2937' }}>{r.product_name}</td>
                          <td style={{ color:'#6b7280' }}>{r.store_name||'—'}</td>
                          <td><span style={{ background:'#fee2e2', color:'#b91c1c', fontSize:'0.75rem', fontWeight:700, padding:'0.2rem 0.625rem', borderRadius:9999 }}>−{parseFloat(r.qty_sold||0).toLocaleString()}</span></td>
                          <td style={{ color:'#9333ea', fontWeight:700 }}>{fmtCurrency(r.revenue)}</td>
                          <td style={{ fontSize:'0.8125rem', color:'#6b7280' }}>{fmtDate(r.first_sale)}</td>
                          <td style={{ fontSize:'0.8125rem', color:'#6b7280' }}>{fmtDate(r.last_sale)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              }
            </div>
          </div>
        )}
      </>
    );
  };

  //  STORE PERFORMANCE PANEL
  const renderStorePerformance = () => {
    const perfStores = storePerf?.stores || [];

    return (
      <>
        <div className="ra-filter-bar">
          {range === 'custom' && (
            <>
              <span className="ra-filter-label">From</span>
              <input type="date" className="ra-date-input" value={dateFrom} onChange={e => setDateFrom(e.target.value)}/>
              <span className="ra-filter-label">To</span>
              <input type="date" className="ra-date-input" value={dateTo} onChange={e => setDateTo(e.target.value)}/>
            </>
          )}
          <button className="ra-btn-export" onClick={exportStoreCSV} style={{ marginLeft:'auto' }}>
            <Download size={14}/> Export CSV
          </button>
        </div>

        {storePerfLoad ? (
          <div className="ra-loading">Loading store performance…</div>
        ) : perfStores.length === 0 ? (
          <div className="ra-empty">
            <div className="ra-empty-icon"><Store size={20}/></div>
            <h3>No Store Data</h3>
            <p>No sales data for the selected period.</p>
          </div>
        ) : (
          <>
            {/* Summary KPIs */}
            <div className="ra-stat-cards">
              <div className="ra-stat-card">
                <div className="ra-stat-icon-wrap revenue"><Store size={20}/></div>
                <div className="ra-stat-info">
                  <p className="ra-stat-label">Active Stores</p>
                  <p className="ra-stat-value">{perfStores.length}</p>
                </div>
              </div>
              <div className="ra-stat-card">
                <div className="ra-stat-icon-wrap transactions"><Receipt size={20}/></div>
                <div className="ra-stat-info">
                  <p className="ra-stat-label">Total Transactions</p>
                  <p className="ra-stat-value">{perfStores.reduce((s,st)=>s+parseInt(st.total_transactions),0).toLocaleString()}</p>
                </div>
              </div>
              <div className="ra-stat-card">
                <div className="ra-stat-icon-wrap avg"><DollarSign size={20}/></div>
                <div className="ra-stat-info">
                  <p className="ra-stat-label">Total Revenue</p>
                  <p className="ra-stat-value">{fmtCurrency(perfStores.reduce((s,st)=>s+parseFloat(st.total_revenue),0))}</p>
                </div>
              </div>
              <div className="ra-stat-card">
                <div className="ra-stat-icon-wrap products"><BarChart2 size={20}/></div>
                <div className="ra-stat-info">
                  <p className="ra-stat-label">Best Avg Order</p>
                  <p className="ra-stat-value">{fmtCurrency(Math.max(...perfStores.map(st=>parseFloat(st.avg_order_value))))}</p>
                </div>
              </div>
            </div>

            {/* Revenue comparison bars */}
            <div className="ra-mid-grid">
              <div className="ra-card">
                <div className="ra-card-title">Revenue Comparison</div>
                {(() => {
                  const maxV = Math.max(...perfStores.map(s=>parseFloat(s.total_revenue)),1);
                  return (
                    <div className="ra-store-list">
                      {perfStores.map((s,i)=>(
                        <StoreBar key={i}
                          name={s.store_name || `Store ${s.store_id}`}
                          sub={`${parseInt(s.total_transactions).toLocaleString()} txns · avg ${fmtCurrency(s.avg_order_value)}`}
                          amount={s.total_revenue}
                          pct={(parseFloat(s.total_revenue)/maxV)*100}
                        />
                      ))}
                    </div>
                  );
                })()}
              </div>

              <div className="ra-card">
                <div className="ra-card-title">Payment Mix by Store</div>
                <div className="ra-store-list">
                  {perfStores.map((s,i)=>{
                    const total = parseInt(s.cash_txns)+parseInt(s.card_txns)+parseInt(s.mobile_txns)||1;
                    return (
                      <div key={i} className="ra-store-row">
                        <div className="ra-store-row-top">
                          <div className="ra-store-name">{s.store_name || `Store ${s.store_id}`}</div>
                        </div>
                        <div style={{ display:'flex', gap:4, height:8, borderRadius:9999, overflow:'hidden', marginTop:4 }}>
                          <div style={{ width:`${(s.cash_txns/total)*100}%`, background:'#16a34a', minWidth:s.cash_txns>0?4:0 }}/>
                          <div style={{ width:`${(s.card_txns/total)*100}%`, background:'#2563eb', minWidth:s.card_txns>0?4:0 }}/>
                          <div style={{ width:`${(s.mobile_txns/total)*100}%`, background:'#9333ea', minWidth:s.mobile_txns>0?4:0 }}/>
                        </div>
                        <div style={{ display:'flex', gap:12, marginTop:6 }}>
                          {[['Cash',s.cash_txns,'#16a34a'],['Card',s.card_txns,'#2563eb'],['Mobile',s.mobile_txns,'#9333ea']].map(([lbl,val,clr])=>(
                            <div key={lbl} style={{ display:'flex', alignItems:'center', gap:4, fontSize:'0.72rem', color:'#6b7280' }}>
                              <div style={{ width:8, height:8, borderRadius:'50%', background:clr }}/>
                              {lbl}: {parseInt(val||0)}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Store comparison table */}
            <div className="ra-table-card">
              <div className="ra-table-header-row">
                <span className="ra-table-header-title">Store Comparison</span>
                <span className="ra-table-header-sub">{perfStores.length} stores</span>
              </div>
              <div className="ra-table-wrap">
                <table className="ra-table">
                  <thead>
                    <tr>
                      <th>Rank</th><th>Store</th><th>Transactions</th>
                      <th>Revenue</th><th>Avg Order</th><th>Discounts</th>
                      <th>Tax</th><th>Cashiers</th><th>Cash</th><th>Card</th><th>Mobile</th>
                    </tr>
                  </thead>
                  <tbody>
                    {perfStores.map((s,i)=>(
                      <tr key={i}>
                        <td><span className={`ra-rank-badge${i===0?' gold':i===1?' silver':i===2?' bronze':''}`}>{i+1}</span></td>
                        <td>
                          <div style={{ fontWeight:600, color:'#1f2937' }}>{s.store_name||`Store ${s.store_id}`}</div>
                          {s.address && <div style={{ fontSize:'0.75rem', color:'#9ca3af' }}>{s.address}</div>}
                        </td>
                        <td>{parseInt(s.total_transactions).toLocaleString()}</td>
                        <td style={{ fontWeight:700, color:'#9333ea' }}>{fmtCurrency(s.total_revenue)}</td>
                        <td>{fmtCurrency(s.avg_order_value)}</td>
                        <td style={{ color:'#dc2626' }}>{fmtCurrency(s.total_discounts)}</td>
                        <td style={{ color:'#6b7280' }}>{fmtCurrency(s.total_tax)}</td>
                        <td><span style={{ background:'#dbeafe', color:'#1d4ed8', fontSize:'0.75rem', fontWeight:700, padding:'0.2rem 0.5rem', borderRadius:9999 }}>{s.active_cashiers}</span></td>
                        <td style={{ color:'#16a34a', fontWeight:600 }}>{s.cash_txns}</td>
                        <td style={{ color:'#2563eb', fontWeight:600 }}>{s.card_txns}</td>
                        <td style={{ color:'#9333ea', fontWeight:600 }}>{s.mobile_txns}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </>
    );
  };

  //  PRODUCT ANALYSIS PANEL
  const renderProductAnalysis = () => {
    const topProducts = productData?.top_products || [];
    const slowMovers  = productData?.slow_movers  || [];
    const byCat       = productData?.by_category  || [];

    return (
      <>
        {renderFilters({ onExport: exportProductCSV })}

        <div className="ra-mid-grid">
          <div className="ra-card">
            <div className="ra-card-title">Top Selling Products <span className="ra-card-subtitle">by revenue</span></div>
            {productLoad ? <div className="ra-loading">Loading…</div>
              : topProducts.length === 0 ? (
                <div className="ra-empty" style={{ padding:'2rem 0' }}>
                  <div className="ra-empty-icon"><ShoppingBag size={18}/></div>
                  <h3>No Product Data</h3>
                  <p>No sales in the selected period.</p>
                </div>
              ) : (
                <div style={{ overflowX:'auto' }}>
                  <table className="ra-product-table">
                    <thead>
                      <tr><th style={{ textAlign:'left' }}>#</th><th style={{ textAlign:'left' }}>Product</th><th>Qty Sold</th><th>Revenue</th><th>Times Sold</th></tr>
                    </thead>
                    <tbody>
                      {topProducts.map((p,i)=>(
                        <tr key={i}>
                          <td><span className={`ra-rank-badge${i===0?' gold':i===1?' silver':i===2?' bronze':''}`}>{i+1}</span></td>
                          <td style={{ textAlign:'left' }}>
                            <div style={{ fontWeight:600, color:'#1f2937' }}>{p.product_name}</div>
                            <div style={{ fontSize:'0.75rem', color:'#9ca3af' }}>{p.category_name||'—'}</div>
                          </td>
                          <td>{parseFloat(p.total_qty_sold||0).toLocaleString()}</td>
                          <td style={{ color:'#9333ea', fontWeight:700 }}>{fmtCurrency(p.total_revenue)}</td>
                          <td>{parseInt(p.times_in_sale||0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            }
          </div>

          <div className="ra-card">
            <div className="ra-card-title">Revenue by Category</div>
            {productLoad ? <div className="ra-loading">Loading…</div>
              : <DonutChart data={byCat.map(c=>({ method:c.category_name, total_amount:c.total_revenue }))} colors={PAYMENT_COLORS}/>
            }
          </div>
        </div>

        {/* Slow movers */}
        <div className="ra-card">
          <div className="ra-card-title">Slow Moving Products <span className="ra-card-subtitle">lowest sales this period</span></div>
          {productLoad ? <div className="ra-loading">Loading…</div>
            : slowMovers.length === 0 ? <p className="ra-no-data">No data.</p>
            : (
              <div style={{ overflowX:'auto' }}>
                <table className="ra-product-table">
                  <thead>
                    <tr><th style={{ textAlign:'left' }}>Product</th><th style={{ textAlign:'left' }}>Category</th><th>Qty Sold</th><th>Revenue</th></tr>
                  </thead>
                  <tbody>
                    {slowMovers.map((p,i)=>(
                      <tr key={i}>
                        <td style={{ textAlign:'left', fontWeight:600, color:'#1f2937' }}>{p.product_name}</td>
                        <td style={{ textAlign:'left', color:'#6b7280', fontSize:'0.8125rem' }}>{p.category_name||'—'}</td>
                        <td style={{ color:parseFloat(p.total_qty_sold)===0?'#dc2626':'#ca8a04', fontWeight:700 }}>
                          {parseFloat(p.total_qty_sold||0).toLocaleString()}
                        </td>
                        <td style={{ color:'#6b7280' }}>{fmtCurrency(p.total_revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
        </div>
      </>
    );
  };

  //  PAYMENT REPORT PANEL
  const renderPaymentReport = () => {
    const byMethod   = paymentData?.by_method  || [];
    const grandTotal = paymentData?.grand_total || 0;
    const grandCount = paymentData?.grand_count || 0;

    return (
      <>
        {renderFilters({ onExport: exportPaymentCSV })}

        {/* Summary cards */}
        <div className="ra-stat-cards">
          <div className="ra-stat-card">
            <div className="ra-stat-icon-wrap revenue"><DollarSign size={20}/></div>
            <div className="ra-stat-info">
              <p className="ra-stat-label">Total Collected</p>
              <p className="ra-stat-value">{paymentLoad ? '…' : fmtCurrency(grandTotal)}</p>
            </div>
          </div>
          <div className="ra-stat-card">
            <div className="ra-stat-icon-wrap transactions"><Receipt size={20}/></div>
            <div className="ra-stat-info">
              <p className="ra-stat-label">Total Transactions</p>
              <p className="ra-stat-value">{paymentLoad ? '…' : parseInt(grandCount).toLocaleString()}</p>
            </div>
          </div>
          {byMethod.slice(0,2).map((m,i) => (
            <div key={i} className="ra-stat-card">
              <div className={`ra-stat-icon-wrap ${m.method?.toLowerCase()==='cash'?'avg':m.method?.toLowerCase()==='card'?'transactions':'revenue'}`}>
                <CreditCard size={20}/>
              </div>
              <div className="ra-stat-info">
                <p className="ra-stat-label">{m.method}</p>
                <p className="ra-stat-value">{paymentLoad ? '…' : fmtCurrency(m.total_amount)}</p>
                <span style={{ fontSize:'0.72rem', color:'#9ca3af' }}>{parseInt(m.transaction_count||0)} txns</span>
              </div>
            </div>
          ))}
        </div>

        <div className="ra-mid-grid">
          <div className="ra-card">
            <div className="ra-card-title">Payment Method Breakdown</div>
            {paymentLoad ? <div className="ra-loading">Loading…</div>
              : <DonutChart data={byMethod} colors={PAYMENT_COLORS}/>
            }
          </div>

          <div className="ra-card">
            <div className="ra-card-title">Method Details</div>
            {paymentLoad ? <div className="ra-loading">Loading…</div>
              : byMethod.length === 0 ? <p className="ra-no-data">No data.</p>
              : (
                <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
                  {byMethod.map((m,i) => {
                    const pctV = grandTotal > 0 ? ((parseFloat(m.total_amount)/grandTotal)*100).toFixed(1) : 0;
                    return (
                      <div key={i} className="ra-store-row">
                        <div className="ra-store-row-top">
                          <div>
                            <div className="ra-store-name" style={{ display:'flex', alignItems:'center', gap:6 }}>
                              <span style={{ width:10, height:10, borderRadius:'50%', background:PAYMENT_COLORS[i%PAYMENT_COLORS.length], display:'inline-block' }}/>
                              {m.method}
                            </div>
                            <div className="ra-store-meta">{parseInt(m.transaction_count)} txns · avg {fmtCurrency(m.avg_amount)}</div>
                          </div>
                          <div style={{ textAlign:'right' }}>
                            <div className="ra-store-amount">{fmtCurrency(m.total_amount)}</div>
                            <div style={{ fontSize:'0.72rem', color:'#9ca3af' }}>{pctV}%</div>
                          </div>
                        </div>
                        <div className="ra-store-bar-bg">
                          <div className="ra-store-bar-fill" style={{ width:`${pctV}%`, background:PAYMENT_COLORS[i%PAYMENT_COLORS.length] }}/>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            }
          </div>
        </div>
      </>
    );
  };

  // 
  //  CONSTANTS
  const REPORT_TABS = [
    { key:'overview',  label:'Overview',          icon:<LayoutDashboard size={15}/> },
    { key:'sales',     label:'Sales Report',       icon:<TrendingUp size={15}/> },
    { key:'inventory', label:'Inventory Report',   icon:<Boxes size={15}/> },
    { key:'store',     label:'Store Performance',  icon:<Store size={15}/> },
    { key:'products',  label:'Product Analysis',   icon:<ShoppingBag size={15}/> },
    { key:'payments',  label:'Payment Report',     icon:<CreditCard size={15}/> },
  ];

  const RANGE_TABS = [
    { key:'today',      label:'Today'      },
    { key:'this_week',  label:'This Week'  },
    { key:'this_month', label:'This Month' },
    { key:'this_year',  label:'This Year'  },
    { key:'all_time',   label:'All Time'   },
    { key:'custom',     label:'Custom'     },
  ];

  const refreshActive = () => {
    if (activeTab==='overview')  fetchOverview();
    if (activeTab==='sales')     fetchSalesReport(salesPage);
    if (activeTab==='inventory') fetchInventory();
    if (activeTab==='store')     fetchStorePerformance();
    if (activeTab==='products')  fetchProductAnalysis();
    if (activeTab==='payments')  fetchPaymentReport();
  };

  
  //  RENDER
  return (
    <div className="shop-admin-container">
      {/* SIDEBAR */}
      <aside className="shop-admin-sidebar">
        <div className="shop-brand-header">{renderShopLogo()}</div>
        <nav className="shop-sidebar-nav">
          <button className="shop-nav-item" onClick={() => navigate('/shopadmindashboard')}><LayoutDashboard size={18}/><span>Dashboard</span></button>
          <button className="shop-nav-item" onClick={() => navigate('/shopprofile')}><Settings size={18}/><span>Shop Profile</span></button>
          <div className="nav-divider"/>
          <button className="shop-nav-item" onClick={() => navigate('/mystores')}><Store size={18}/><span>My Stores</span></button>
          <div className="nav-divider"/>
          <button className="shop-nav-item" onClick={() => navigate('/myuser')}><Users size={18}/><span>My Users</span></button>
          <button className="shop-nav-item" onClick={() => navigate('/suppliers')}><PackageIcon size={18}/><span>Suppliers</span></button>
          <div className="nav-divider"/>
          <button className="shop-nav-item" onClick={() => navigate('/products')}><ShoppingCart size={18}/><span>Products</span></button>
          <button className="mp-nav-item" onClick={() => navigate('/categories')}><Tags size={18}/><span>Categories</span></button>
          <button className="mp-nav-item" onClick={() => navigate('/inventory')}><Boxes size={18}/><span>Inventory</span></button>
          <div className="nav-divider"/>
          <button className="shop-nav-item" onClick={() => navigate('/salesrecords')}><TrendingUp size={18}/><span>Sales Records</span></button>
          <button className="mp-nav-item active" onClick={() => navigate('/reportsandanalytics')}><FileBarChart size={18}/><span>Reports &amp; Analytics</span></button>
          <button className="shop-nav-item" onClick={() => navigate('/subscription')}><Diamond size={18}/><span>Subscription</span></button>
          <div className="nav-divider"/>
          <button className="shop-nav-item" onClick={() => navigate('/adminprofile')}><User size={18}/><span>My Profile</span></button>
          <button className="shop-nav-item" onClick={handleLogOut}><LogOut size={18}/><span>Logout</span></button>
        </nav>
      </aside>

      {/* MAIN */}
      <main className="shop-admin-main">
        {/* HEADER */}
        <header className="shop-main-header">
          <div className="shop-breadcrumb">Admin &gt; Reports &amp; Analytics</div>
          <div className="shop-header-actions">
            <div className="shop-menu-dropdown-container" ref={menuDropdownRef}>
              <button className="shop-btn-menu" onClick={() => setShowMenuDropdown(!showMenuDropdown)}>
                {storeId ? (stores.find(s => String(s.store_id)===storeId)?.name || 'Store') : 'All Stores'}
                <span className="shop-dropdown-arrow">▼</span>
              </button>
              {showMenuDropdown && (
                <div className="shop-menu-dropdown">
                  <div className="shop-menu-section">
                    <h4 className="shop-menu-section-title">Filter by Store</h4>
                    <button className="shop-menu-item" onClick={() => { setStoreId(''); setShowMenuDropdown(false); }}>
                      <Layers size={16}/><span>All Stores</span>
                    </button>
                    {stores.map(s => (
                      <button key={s.store_id} className="shop-menu-item"
                        onClick={() => { setStoreId(String(s.store_id)); setShowMenuDropdown(false); }}>
                        <Store size={16}/><span>{s.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="shop-profile-dropdown-container" ref={profileDropdownRef}>
              <button className="shop-profile-circle-btn" onClick={() => setShowProfileDropdown(!showProfileDropdown)}>
                {renderProfileImage()}
              </button>
              {showProfileDropdown && (
                <div className="shop-profile-dropdown">
                  <div className="shop-profile-dropdown-header">
                    <div className="shop-profile-dropdown-avatar">{renderProfileImage('dropdown')}</div>
                    <div className="shop-profile-dropdown-info">
                      <h4 className="shop-profile-name">{user.name||'Admin'}</h4>
                      <p className="shop-profile-role">{user.role||'Shop Admin'}</p>
                    </div>
                  </div>
                  <div className="shop-profile-divider"/>
                  <div className="shop-profile-details">
                    <div className="shop-profile-detail-item"><span className="shop-detail-icon">📧</span><span className="shop-detail-text">{user.email||'N/A'}</span></div>
                    <div className="shop-profile-detail-item"><span className="shop-detail-icon">📱</span><span className="shop-detail-text">{user.phone||'N/A'}</span></div>
                  </div>
                  <div className="shop-profile-divider"/>
                  <div className="shop-profile-actions">
                    <button className="shop-profile-action-btn" onClick={() => { setShowProfileDropdown(false); navigate('/adminprofile'); }}><User size={18}/><span>My Profile</span></button>
                    <button className="shop-profile-action-btn shop-logout-btn" onClick={handleLogOut}><LogOut size={18}/><span>Logout</span></button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <div className="shop-dashboard-content">

          {/* Page Header */}
          <div className="ra-page-header">
            <div>
              <h1 className="ra-title">Reports &amp; Analytics</h1>
              <p className="ra-subtitle">Generate detailed reports and insights for your business</p>
            </div>
            <div className="ra-header-right">
              {activeTab !== 'inventory' && (
                <div className="ra-range-tabs">
                  {RANGE_TABS.map(t => (
                    <button key={t.key} className={`ra-range-tab${range===t.key?' active':''}`} onClick={() => setRange(t.key)}>
                      {t.label}
                    </button>
                  ))}
                </div>
              )}
              <button className="ra-btn-export" onClick={refreshActive}>
                <RefreshCw size={14}/> Refresh
              </button>
            </div>
          </div>

          {/* Report Type Tabs */}
          <div className="ra-report-tabs">
            {REPORT_TABS.map(t => (
              <button key={t.key} className={`ra-report-tab${activeTab===t.key?' active':''}`} onClick={() => setActiveTab(t.key)}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* Active Panel */}
          {activeTab === 'overview'  && renderOverview()}
          {activeTab === 'sales'     && renderSalesReport()}
          {activeTab === 'inventory' && renderInventory()}
          {activeTab === 'store'     && renderStorePerformance()}
          {activeTab === 'products'  && renderProductAnalysis()}
          {activeTab === 'payments'  && renderPaymentReport()}

        </div>
      </main>
    </div>
  );
};

export default ReportsAndAnalytics; 