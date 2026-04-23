import React, { useState, useRef, useEffect } from 'react';
import {
  ShoppingCart, Search, User, LogOut, BarChart3,
  FileText, Settings, Package, ChevronDown, ChevronUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { salesAPI } from '../services/api';
import './POSTerminalstyles/MySales.css';

const MySales = () => {
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [salesMetrics, setSalesMetrics] = useState({
    totalSales: 0, cashSales: 0, transactions: 0,
    cardSales: 0, discountsGiven: 0, refunds: 0
  });
  const [sales, setSales] = useState([]);
  const [expandedSale, setExpandedSale] = useState(null);

  const menuDropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => { loadSales(); }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuDropdownRef.current && !menuDropdownRef.current.contains(e.target))
        setShowMenuDropdown(false);
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target))
        setShowProfileDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadSales = async () => {
    try {
      setLoading(true);
      const data = await salesAPI.getMySales();
      setSalesMetrics(data.metrics);
      setSales(data.sales);
    } catch (error) {
      console.error('Error loading sales:', error);
      alert('Failed to load sales data.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);
  const handleProfileLogout = () => { setShowProfileDropdown(false); handleLogOut(); };

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

  const metricCards = [
    { label: 'Total Sales', value: `Rs.${salesMetrics.totalSales.toFixed(2)}`, icon: '💵', color: 'purple' },
    { label: 'Cash Sales', value: `Rs.${salesMetrics.cashSales.toFixed(2)}`, icon: '💳', color: 'blue' },
    { label: 'Transactions', value: salesMetrics.transactions, icon: '📊', color: 'pink' },
    { label: 'Card Sales', value: `Rs.${salesMetrics.cardSales.toFixed(2)}`, icon: '💵', color: 'green' },
    { label: 'Discounts Given', value: `Rs.${salesMetrics.discountsGiven.toFixed(2)}`, icon: '🏷️', color: 'orange' },
    { label: 'Refunds', value: `Rs.${salesMetrics.refunds.toFixed(2)}`, icon: '↩️', color: 'red' },
  ];

  return (
    <div className="my-sales-container">
      <aside className="my-sales-sidebar">
        <div className="brand-header">
          <ShoppingCart className="brand-icon" size={24} />
          <h1 className="brand-title">{user.shop_name || 'Shop2Door'}</h1>
        </div>
        <nav className="sidebar-nav">
          <button className="nav-item" onClick={() => navigate('/posterminal')}><User size={18} /><span>POS Terminal</span></button>
          <button className="nav-item" onClick={() => navigate('/shiftreport')}><FileText size={18} /><span>Shift Report</span></button>

          <div className="nav-divider" />
          <button className="nav-item" onClick={() => navigate('/findproducts')}><Search size={18} /><span>Find Products</span></button>
          <button className="nav-item" onClick={() => navigate('/returnproduct')}><Package size={18} /><span>Return Product</span></button>

          <div className="nav-divider" />
          <button className="nav-item active"><BarChart3 size={18} /><span>My Sales</span></button>
          <button className="nav-item" onClick={() => navigate('/settingss')}><Settings size={18} /><span>Settings</span></button>

          <div className="nav-divider" />
          <button className="nav-item" onClick={() => navigate('/myprofile')}><User size={18} /><span>My Profile</span></button>
          <button className="nav-item" onClick={handleLogOut}><LogOut size={18} /><span>Logout</span></button>
        </nav>
      </aside>

      <main className="my-sales-main">
        <header className="main-header">
          <div className="breadcrumb">POS &gt; My Sales</div>
          <div className="header-actions">
            <button className="btn-shift-active">Shift Active</button>

            <div className="menu-dropdown-container" ref={menuDropdownRef}>
              <button className="btn-menu" onClick={() => setShowMenuDropdown(!showMenuDropdown)}>
                Menu <span className="dropdown-arrow">▼</span>
              </button>
              {showMenuDropdown && (
                <div className="menu-dropdown">
                  <div className="menu-section">
                    <h4 className="menu-section-title">Quick Actions</h4>
                    <button className="menu-item" onClick={() => { setShowMenuDropdown(false); navigate('/posterminal'); }}><ShoppingCart size={18} /><span>New Sale</span></button>
                    <button className="menu-item" onClick={() => { setShowMenuDropdown(false); navigate('/findproducts'); }}><Search size={18} /><span>Find Products</span></button>
                    <button className="menu-item" onClick={() => { setShowMenuDropdown(false); navigate('/shiftreport'); }}><FileText size={18} /><span>Shift Report</span></button>
                    <button className="menu-item" onClick={() => { setShowMenuDropdown(false); navigate('/mysales'); }}><BarChart3 size={18} /><span>My Sales</span></button>
                  </div>
                  <div className="menu-divider"></div>
                  <div className="menu-section">
                    <h4 className="menu-section-title">Settings</h4>
                    <button className="menu-item" onClick={toggleDarkMode}>{isDarkMode ? '☀️' : '🌙'}<span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span></button>
                    <button className="menu-item" onClick={() => navigate('/settingss')}><Settings size={18} /><span>Settings</span></button>
                  </div>
                </div>
              )}
            </div>

            <div className="icon-circle moon">🌙</div>
            <div className="icon-circle calculator">🧮</div>

            <div className="profile-dropdown-container" ref={profileDropdownRef}>
              <button className="profile-circle-btn" onClick={() => setShowProfileDropdown(!showProfileDropdown)}>
                {user.image_url
                  ? <img src={`http://localhost:5000${user.image_url}`} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  : <span className="profile-initials">{user.name?.substring(0, 2).toUpperCase() || 'AM'}</span>}
              </button>
              {showProfileDropdown && (
                <div className="profile-dropdown">
                  <div className="profile-dropdown-header">
                    <div className="profile-dropdown-avatar">
                      {user.image_url
                        ? <img src={`http://localhost:5000${user.image_url}`} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                        : <span className="avatar-initials">{user.name?.substring(0, 2).toUpperCase() || 'AM'}</span>}
                    </div>
                    <div className="profile-dropdown-info">
                      <h4 className="profile-name">{user.name || 'User'}</h4>
                      <p className="profile-role">{user.role || 'Cashier'}</p>
                    </div>
                  </div>
                  <div className="profile-divider"></div>
                  <div className="profile-details">
                    <div className="profile-detail-item"><span className="detail-icon">📧</span><span className="detail-text">{user.email || 'N/A'}</span></div>
                    <div className="profile-detail-item"><span className="detail-icon">📱</span><span className="detail-text">{user.phone || 'N/A'}</span></div>
                  </div>
                  <div className="profile-divider"></div>
                  <div className="profile-actions">
                    <button className="profile-action-btn" onClick={() => navigate('/myprofile')}><User size={18} /><span>My Profile</span></button>
                    <button className="profile-action-btn" onClick={() => navigate('/settings')}><Settings size={18} /><span>Settings</span></button>
                    <button className="profile-action-btn logout-btn" onClick={handleProfileLogout}><LogOut size={18} /><span>Logout</span></button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="my-sales-content">
          <p className="subtitle">My sales performance report</p>

          <div className="metrics-section">
            <div className="section-header">
              <span className="section-icon">💰</span>
              <h2 className="section-title">Sales Metrics</h2>
            </div>
            {loading ? (
              <p style={{ color: '#6b7280', padding: '1rem' }}>Loading metrics...</p>
            ) : (
              <div className="metrics-grid">
                {metricCards.map((card) => (
                  <div className="metric-card" key={card.label}>
                    <div className={`metric-icon-wrapper ${card.color}`}>
                      <span className="metric-icon">{card.icon}</span>
                    </div>
                    <div className="metric-content">
                      <p className="metric-label">{card.label}</p>
                      <p className="metric-value">{card.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="metrics-section" style={{ marginTop: '1.5rem' }}>
            <div className="section-header">
              <span className="section-icon">🧾</span>
              <h2 className="section-title">Sales History</h2>
            </div>
            {loading ? (
              <p style={{ color: '#6b7280', padding: '1rem' }}>Loading sales...</p>
            ) : sales.length === 0 ? (
              <p style={{ color: '#6b7280', padding: '1rem' }}>No sales found.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                      {['Receipt No', 'Date', 'Items', 'Subtotal', 'Tax', 'Discount', 'Total', 'Payment', ''].map(h => (
                        <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#374151' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sales.map(sale => (
                      <React.Fragment key={sale.sale_id}>
                        <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: 500, color: '#6d28d9' }}>{sale.receipt_no}</td>
                          <td style={{ padding: '0.75rem 1rem', color: '#6b7280' }}>{formatDate(sale.created_at)}</td>
                          <td style={{ padding: '0.75rem 1rem' }}>{Array.isArray(sale.items) ? sale.items.length : 0}</td>
                          <td style={{ padding: '0.75rem 1rem' }}>Rs.{parseFloat(sale.subtotal).toFixed(2)}</td>
                          <td style={{ padding: '0.75rem 1rem' }}>Rs.{parseFloat(sale.tax).toFixed(2)}</td>
                          <td style={{ padding: '0.75rem 1rem', color: '#dc2626' }}>Rs.{parseFloat(sale.discount).toFixed(2)}</td>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Rs.{parseFloat(sale.total).toFixed(2)}</td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <span style={{
                              padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 500,
                              background: sale.payment_method === 'cash' ? '#dcfce7' : sale.payment_method === 'card' ? '#dbeafe' : '#fef3c7',
                              color: sale.payment_method === 'cash' ? '#16a34a' : sale.payment_method === 'card' ? '#2563eb' : '#d97706'
                            }}>{sale.payment_method}</span>
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <button
                              onClick={() => setExpandedSale(expandedSale === sale.sale_id ? null : sale.sale_id)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6d28d9' }}
                            >
                              {expandedSale === sale.sale_id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </button>
                          </td>
                        </tr>
                        {expandedSale === sale.sale_id && (
                          <tr>
                            <td colSpan={9} style={{ padding: '0 1rem 0.75rem 1rem', background: '#faf5ff' }}>
                              <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
                                <thead>
                                  <tr style={{ color: '#6b7280' }}>
                                    <th style={{ textAlign: 'left', padding: '0.4rem 0.5rem' }}>Product</th>
                                    <th style={{ textAlign: 'left', padding: '0.4rem 0.5rem' }}>Qty</th>
                                    <th style={{ textAlign: 'left', padding: '0.4rem 0.5rem' }}>Price</th>
                                    <th style={{ textAlign: 'left', padding: '0.4rem 0.5rem' }}>Line Total</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(Array.isArray(sale.items) ? sale.items : []).map((item, idx) => (
                                    <tr key={idx}>
                                      <td style={{ padding: '0.4rem 0.5rem' }}>{item.product_name}</td>
                                      <td style={{ padding: '0.4rem 0.5rem' }}>{item.quantity}</td>
                                      <td style={{ padding: '0.4rem 0.5rem' }}>Rs.{parseFloat(item.price).toFixed(2)}</td>
                                      <td style={{ padding: '0.4rem 0.5rem' }}>Rs.{parseFloat(item.total).toFixed(2)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default MySales;